import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Commit, GitState, ConflictFile, RebaseStep } from '../types';
import { getCommit, findLCA } from './utils';

const generateId = () => uuidv4().substring(0, 8);

const useGitStore = create<GitState>((set, get) => ({
  config: { persistState: false },
  commits: {},
  branches: {},
  head: '',
  detachedHead: false,
  workingDirectory: {},
  stagedFiles: {},
  tags: {},
  stash: [],
  conflictState: null,
  rebaseState: null,
  activeScenarioId: null,
  lastActionExplanation: null,
  terminalHistory: [],
  commandHistory: [],
  toasts: [],
  completedScenarios: JSON.parse(localStorage.getItem('git-sandbox-progress') || '[]'),
  undoStack: [],

  setExplanation: (text) => set({ lastActionExplanation: text }),

  // ── Toast Actions ─────────────────────────────────────────
  addToast: (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };
    set((s) => ({ toasts: [...s.toasts, newToast] }));
    setTimeout(() => get().removeToast(id), toast.duration || 3000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── Terminal Actions ───────────────────────────────────────
  addTerminalLine: (line) => set((s) => ({
    terminalHistory: [...s.terminalHistory, { ...line, id: generateId(), timestamp: Date.now() }]
  })),
  clearTerminal: () => set({ terminalHistory: [] }),
  addCommandHistory: (cmd) => set((s) => ({
    commandHistory: [...s.commandHistory, cmd]
  })),

  // ── Progress ───────────────────────────────────────────────
  markScenarioComplete: (id) => {
    const current = get().completedScenarios;
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem('git-sandbox-progress', JSON.stringify(updated));
      set({ completedScenarios: updated });
    }
  },

  // ── Core Git Actions ──────────────────────────────────────

  initRepo: () => {
    const initialCommitId = generateId();
    const initialCommit: Commit = {
      id: initialCommitId,
      parents: [],
      message: 'Initial commit',
      files: {
        'README.md': '# Welcome to Git Sandbox\n\nEdit files, commit, branch, and merge!',
      },
      timestamp: Date.now(),
    };
    
    set({
      commits: { [initialCommitId]: initialCommit },
      branches: { 'main': initialCommitId },
      head: 'main',
      detachedHead: false,
      workingDirectory: { ...initialCommit.files },
      stagedFiles: {},
      tags: {},
      stash: [],
      conflictState: null,
      rebaseState: null,
      activeScenarioId: null,
      lastActionExplanation: 'Initialized a new empty repository.',
    });
    get().addToast({ type: 'success', title: 'Repository initialized', message: 'Created initial commit on main' });
  },

  loadScenario: (setupFunc, id) => {
    const state = get();
    setupFunc(state);
    set({ activeScenarioId: id, lastActionExplanation: `Loaded scenario` });
    get().addToast({ type: 'info', title: 'Scenario loaded', message: `Ready to begin!` });
  },

  saveFile: (name, content) => {
    set((state) => ({
      workingDirectory: { ...state.workingDirectory, [name]: content },
      lastActionExplanation: `Saved ${name}`
    }));
  },

  deleteFile: (name) => {
    set((state) => {
      const newWorkingDir = { ...state.workingDirectory };
      delete newWorkingDir[name];
      return { 
        workingDirectory: newWorkingDir,
        lastActionExplanation: `Deleted ${name}` 
      };
    });
    get().addToast({ type: 'info', title: 'File deleted', message: name });
  },

  stageFile: (name) => {
    const state = get();
    const content = state.workingDirectory[name];
    set({ 
      stagedFiles: { ...state.stagedFiles, [name]: content !== undefined ? content : null },
      lastActionExplanation: `Staged changes for ${name}`
    });
  },

  unstageFile: (name) => {
    set((state) => {
      const newStaged = { ...state.stagedFiles };
      delete newStaged[name];
      return { 
        stagedFiles: newStaged, 
        lastActionExplanation: `Unstaged ${name}` 
      };
    });
  },

  stageAllFiles: () => {
    const state = get();
    const headCommit = getCommit(state.commits, state.head, state.branches);
    const headFiles = headCommit ? headCommit.files : {};
    const newStaged: Record<string, string | null> = { ...state.stagedFiles };
    
    // Stage all modified/new files
    for (const [file, content] of Object.entries(state.workingDirectory)) {
      if (content !== headFiles[file]) {
        newStaged[file] = content;
      }
    }
    // Stage deletions
    for (const file of Object.keys(headFiles)) {
      if (!(file in state.workingDirectory)) {
        newStaged[file] = null;
      }
    }
    
    set({ 
      stagedFiles: newStaged,
      lastActionExplanation: `Staged all changes`
    });
  },

  commit: (message) => {
    const state = get();
    if (state.conflictState) {
      set({ lastActionExplanation: "Please resolve conflicts before committing." });
      get().addToast({ type: 'error', title: 'Cannot commit', message: 'Resolve conflicts first' });
      return;
    }
    
    const headCommit = getCommit(state.commits, state.head, state.branches);
    if (!headCommit && Object.keys(state.commits).length > 0) return;

    const stagedCount = Object.keys(state.stagedFiles).length;
    if (stagedCount === 0) {
      set({ lastActionExplanation: 'Nothing to commit. Please stage files first.' });
      get().addToast({ type: 'warning', title: 'Nothing to commit', message: 'Stage files first with git add' });
      return;
    }

    const headFiles = headCommit ? headCommit.files : {};
    const newFiles = { ...headFiles };
    for (const [file, content] of Object.entries(state.stagedFiles)) {
      if (content === null) {
        delete newFiles[file];
      } else {
        newFiles[file] = content;
      }
    }

    const newCommitId = generateId();
    const parents = headCommit ? [headCommit.id] : [];
    
    const newCommit: Commit = {
      id: newCommitId,
      parents,
      message,
      files: newFiles,
      timestamp: Date.now(),
    };

    const newCommits = { ...state.commits, [newCommitId]: newCommit };
    let newBranches = { ...state.branches };
    let newHead = state.head;

    if (!state.detachedHead && state.branches[state.head]) {
      newBranches[state.head] = newCommitId;
    } else {
      newHead = newCommitId;
      set({ detachedHead: true });
    }

    set({ 
      commits: newCommits, 
      branches: newBranches, 
      head: newHead, 
      stagedFiles: {},
      lastActionExplanation: `Created commit ${newCommitId.substring(0,6)}` 
    });
    get().addToast({ type: 'success', title: `Committed ${newCommitId.substring(0,6)}`, message });
  },

  createBranch: (name) => {
    const state = get();
    if (state.branches[name]) {
      set({ lastActionExplanation: `Branch ${name} already exists.` });
      get().addToast({ type: 'error', title: 'Branch exists', message: `'${name}' already exists` });
      return;
    }
    
    const currentCommit = state.branches[state.head] || state.head;
    set({ 
      branches: { ...state.branches, [name]: currentCommit },
      head: name,
      detachedHead: false,
      lastActionExplanation: `Created and checked out branch ${name}`
    });
    get().addToast({ type: 'success', title: 'Branch created', message: `Switched to '${name}'` });
  },

  deleteBranch: (name) => {
    const state = get();
    if (name === 'main') {
      get().addToast({ type: 'error', title: 'Cannot delete main', message: 'The main branch cannot be deleted' });
      return;
    }
    if (state.head === name) {
      get().addToast({ type: 'error', title: 'Cannot delete', message: 'Cannot delete the current branch' });
      return;
    }
    const newBranches = { ...state.branches };
    delete newBranches[name];
    set({ branches: newBranches, lastActionExplanation: `Deleted branch ${name}` });
    get().addToast({ type: 'info', title: 'Branch deleted', message: name });
  },

  checkout: (target) => {
    const state = get();
    const isBranch = !!state.branches[target];
    const targetCommitId = isBranch ? state.branches[target] : target;
    const targetCommit = state.commits[targetCommitId];
    
    if (state.conflictState) {
      set({ lastActionExplanation: "Cannot checkout during a conflict." });
      get().addToast({ type: 'error', title: 'Cannot checkout', message: 'Resolve conflicts first' });
      return;
    }

    if (!targetCommit) return; 
    
    set({
      head: target,
      detachedHead: !isBranch,
      workingDirectory: { ...targetCommit.files },
      stagedFiles: {},
      lastActionExplanation: `Checked out ${target}${!isBranch ? ' (Detached HEAD)' : ''}`
    });
    get().addToast({ 
      type: isBranch ? 'success' : 'warning', 
      title: `Checked out ${target}`, 
      message: !isBranch ? 'You are in detached HEAD state' : undefined 
    });
  },

  merge: (sourceBranch) => {
    const state = get();
    if (state.conflictState) return;

    const sourceCommitId = state.branches[sourceBranch] || sourceBranch;
    const targetCommitId = state.branches[state.head] || state.head; 

    if (sourceCommitId === targetCommitId) {
      get().addToast({ type: 'info', title: 'Already up to date', message: 'Nothing to merge' });
      return;
    }

    // Fast-forward check
    const sourceAncestors = new Set<string>();
    const queue = [sourceCommitId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      sourceAncestors.add(curr);
      const c = state.commits[curr];
      if (c?.parents) queue.push(...c.parents);
    }

    if (sourceAncestors.has(targetCommitId)) {
      // Fast-forward merge
      const newBranches = { ...state.branches };
      if (!state.detachedHead && state.branches[state.head]) {
        newBranches[state.head] = sourceCommitId;
      }
      set({
        branches: newBranches,
        workingDirectory: { ...state.commits[sourceCommitId].files },
        stagedFiles: {},
        lastActionExplanation: `Fast-forward merged ${sourceBranch} into ${state.head}`
      });
      get().addToast({ type: 'success', title: 'Fast-forward merge', message: `Merged ${sourceBranch}` });
      return;
    }

    const lcaId = findLCA(state.commits, sourceCommitId, targetCommitId);
    if (!lcaId) return; 

    const baseCommit = state.commits[lcaId];
    const sourceCommit = state.commits[sourceCommitId];
    const targetCommit = state.commits[targetCommitId];

    const mergedFiles = { ...targetCommit.files };
    const conflicts: Record<string, ConflictFile> = {};
    let hasConflict = false;

    const allFiles = new Set([
      ...Object.keys(baseCommit.files), 
      ...Object.keys(sourceCommit.files), 
      ...Object.keys(targetCommit.files)
    ]);

    allFiles.forEach(file => {
      const baseContent = baseCommit.files[file] || '';
      const sourceContent = sourceCommit.files[file] || '';
      const targetContent = targetCommit.files[file] || '';

      const targetChanged = targetContent !== baseContent;
      const sourceChanged = sourceContent !== baseContent;

      if (!targetChanged && sourceChanged) {
        if (!sourceContent) {
          delete mergedFiles[file];
        } else {
          mergedFiles[file] = sourceContent;
        }
      } else if (targetChanged && sourceChanged) {
        if (targetContent !== sourceContent) {
          hasConflict = true;
          conflicts[file] = {
            base: baseContent,
            target: targetContent,
            source: sourceContent,
            mergedContent: `<<<<<<< HEAD\n${targetContent || ''}\n=======\n${sourceContent || ''}\n>>>>>>> ${sourceBranch}`
          };
          mergedFiles[file] = conflicts[file].mergedContent;
        }
      }
    });

    if (hasConflict) {
      set({
        workingDirectory: mergedFiles,
        stagedFiles: {},
        lastActionExplanation: `Merge conflict detected across ${Object.keys(conflicts).length} files.`,
        conflictState: {
          targetBranch: state.head,
          sourceBranch,
          files: conflicts,
        }
      });
      get().addToast({ type: 'error', title: 'Merge conflict!', message: `${Object.keys(conflicts).length} file(s) have conflicts` });
    } else {
      const newCommitId = generateId();
      const newCommit: Commit = {
        id: newCommitId,
        parents: [targetCommitId, sourceCommitId],
        message: `Merge branch '${sourceBranch}' into ${state.head}`,
        files: mergedFiles,
        timestamp: Date.now(),
      };

      const newCommits = { ...state.commits, [newCommitId]: newCommit };
      const newBranches = { ...state.branches };
      if (!state.detachedHead && state.branches[state.head]) {
        newBranches[state.head] = newCommitId;
      }
      set({
        commits: newCommits,
        branches: newBranches,
        workingDirectory: mergedFiles,
        lastActionExplanation: `Successfully merged ${sourceBranch} via commit ${newCommitId.substring(0,6)}`
      });
      get().addToast({ type: 'success', title: 'Merge complete', message: `Merged ${sourceBranch} → ${state.head}` });
    }
  },

  interactiveRebase: (sourceBranch) => {
    const state = get();
    if (state.conflictState || state.detachedHead) return;

    const sourceCommitId = state.branches[sourceBranch] || sourceBranch;
    const targetCommitId = state.branches[state.head] || state.head;

    const lcaId = findLCA(state.commits, sourceCommitId, targetCommitId);
    if (!lcaId) return;

    const commitsToReplay: Commit[] = [];
    let curr = targetCommitId;
    while(curr !== lcaId && curr) {
      commitsToReplay.unshift(state.commits[curr]);
      curr = state.commits[curr].parents[0];
    }

    const steps: RebaseStep[] = commitsToReplay.map(c => ({
      commitId: c.id,
      action: 'pick',
      message: c.message
    }));

    if (steps.length === 0) {
      set({ lastActionExplanation: 'Up to date, nothing to rebase.' });
      return;
    }

    set({
      rebaseState: {
        originalBranch: state.head,
        targetBranch: sourceBranch,
        steps,
        activeStepIndex: 0
      },
      lastActionExplanation: `Interactive rebase started against ${sourceBranch}`
    });
    get().addToast({ type: 'info', title: 'Interactive rebase', message: `${steps.length} commits to replay` });
  },

  processRebaseStep: (action, message) => {
    const state = get();
    if (!state.rebaseState) return;

    const steps = [...state.rebaseState.steps];
    steps[state.rebaseState.activeStepIndex].action = action;
    if (message) steps[state.rebaseState.activeStepIndex].message = message;

    if (state.rebaseState.activeStepIndex + 1 < steps.length) {
      set({
        rebaseState: {
          ...state.rebaseState,
          steps,
          activeStepIndex: state.rebaseState.activeStepIndex + 1
        }
      });
    } else {
      const sourceCommitId = state.branches[state.rebaseState.targetBranch] || state.rebaseState.targetBranch;
      let newCommits = { ...state.commits };
      let currentParent = sourceCommitId;

      for (const step of steps) {
        if (step.action === 'skip') continue;
        
        const originalCommit = state.commits[step.commitId];
        const newId = generateId();
        newCommits[newId] = {
          ...originalCommit,
          id: newId,
          parents: [currentParent],
          message: step.message
        };
        currentParent = newId;
      }

      const newBranches = { ...state.branches };
      newBranches[state.rebaseState.originalBranch] = currentParent;

      set({
        commits: newCommits,
        branches: newBranches,
        workingDirectory: newCommits[currentParent]?.files || {},
        rebaseState: null,
        lastActionExplanation: `Rebase successfully finished.`
      });
      get().addToast({ type: 'success', title: 'Rebase complete', message: 'Successfully rebased commits' });
    }
  },

  rebase: (sourceBranch) => {
    get().interactiveRebase(sourceBranch);
    const state = get();
    if (!state.rebaseState) return;
    while(get().rebaseState) {
      get().processRebaseStep('pick');
    }
  },

  resolveConflict: (filename, resolvedContent) => {
    const state = get();
    if (!state.conflictState) return;

    const newConflictFiles = { ...state.conflictState.files };
    delete newConflictFiles[filename];

    set({
      workingDirectory: { ...state.workingDirectory, [filename]: resolvedContent },
      stagedFiles: { ...state.stagedFiles, [filename]: resolvedContent },
      conflictState: { ...state.conflictState, files: newConflictFiles },
      lastActionExplanation: `Resolved conflict in ${filename}`
    });
    get().addToast({ type: 'success', title: 'Conflict resolved', message: filename });
  },

  completeMerge: (_message) => {
    const state = get();
    if (!state.conflictState) return;

    const sourceCommitId = state.branches[state.conflictState.sourceBranch] || state.conflictState.sourceBranch;
    const targetCommitId = state.branches[state.head] || state.head;

    const newCommitId = generateId();
    const newCommit: Commit = {
      id: newCommitId,
      parents: [targetCommitId, sourceCommitId],
      message: _message || `Merge branch '${state.conflictState.sourceBranch}' into ${state.head}`,
      files: { ...state.workingDirectory },
      timestamp: Date.now(),
    };

    const newCommits = { ...state.commits, [newCommitId]: newCommit };
    const newBranches = { ...state.branches };
    if (!state.detachedHead && state.branches[state.head]) {
      newBranches[state.head] = newCommitId;
    }

    set({
      commits: newCommits,
      branches: newBranches,
      head: state.head,
      stagedFiles: {},
      conflictState: null,
      lastActionExplanation: `Merge completed with commit ${newCommitId.substring(0,6)}`
    });
    get().addToast({ type: 'success', title: 'Merge complete', message: `Created merge commit ${newCommitId.substring(0,6)}` });
  },

  abortMerge: () => {
    const state = get();
    if (!state.conflictState) return;
    const headCommitId = state.branches[state.head] || state.head;
    set({
      conflictState: null,
      stagedFiles: {},
      workingDirectory: { ...state.commits[headCommitId].files },
      lastActionExplanation: 'Merge aborted.'
    });
    get().addToast({ type: 'warning', title: 'Merge aborted', message: 'Returned to pre-merge state' });
  },

  reset: (type, targetCommitId) => {
    const state = get();
    const targetId = targetCommitId || (state.branches[state.head] ? state.branches[state.head] : state.head);
    const targetCommit = state.commits[targetId];

    if (!targetCommit) return;

    const newBranches = { ...state.branches };
    if (!state.detachedHead && state.branches[state.head]) {
      newBranches[state.head] = targetId;
    }

    const oldHeadId = state.branches[state.head] || state.head;
    const oldHeadCommit = state.commits[oldHeadId];

    if (type === 'hard') {
      set({
        branches: newBranches,
        head: !state.detachedHead ? state.head : targetId,
        workingDirectory: { ...targetCommit.files },
        stagedFiles: {},
        lastActionExplanation: `Hard reset to ${targetId.substring(0,6)}`
      });
    } else {
      // Soft reset: HEAD moves, but Index (stagedFiles) maintains changes relative to new HEAD
      const newStaged: Record<string, string | null> = { ...state.stagedFiles };
      
      if (oldHeadCommit) {
        // Any files in the old HEAD that are different from the target HEAD should be staged
        const allRelevantFiles = new Set([...Object.keys(oldHeadCommit.files), ...Object.keys(targetCommit.files)]);
        allRelevantFiles.forEach(file => {
          const oldContent = oldHeadCommit.files[file];
          const newContent = targetCommit.files[file];
          if (oldContent !== newContent) {
            newStaged[file] = oldContent !== undefined ? oldContent : null;
          }
        });
      }

      set({
        branches: newBranches,
        head: !state.detachedHead ? state.head : targetId,
        stagedFiles: newStaged,
        lastActionExplanation: `Soft reset to ${targetId.substring(0,6)}`
      });
    }
    get().addToast({ type: 'warning', title: `Reset ${type}`, message: `HEAD → ${targetId.substring(0,6)}` });
  },

  resetAll: () => {
    get().initRepo();
  },

  // ── Stash ──────────────────────────────────────────────────

  stashChanges: (message) => {
    const state = get();
    const headCommit = getCommit(state.commits, state.head, state.branches);
    if (!headCommit) return;

    // Check if there are any changes
    const hasChanges = Object.keys(state.stagedFiles).length > 0 ||
      Object.entries(state.workingDirectory).some(([f, c]) => headCommit.files[f] !== c) ||
      Object.keys(headCommit.files).some(f => !(f in state.workingDirectory));

    if (!hasChanges) {
      get().addToast({ type: 'warning', title: 'No changes to stash' });
      return;
    }

    const entry = {
      id: generateId(),
      message: message || `WIP on ${state.head}`,
      files: { ...state.workingDirectory },
      stagedFiles: { ...state.stagedFiles },
      branch: state.head,
      timestamp: Date.now(),
    };

    set({
      stash: [entry, ...state.stash],
      workingDirectory: { ...headCommit.files },
      stagedFiles: {},
      lastActionExplanation: `Stashed changes: ${entry.message}`
    });
    get().addToast({ type: 'success', title: 'Changes stashed', message: entry.message });
  },

  stashPop: () => {
    const state = get();
    if (state.stash.length === 0) {
      get().addToast({ type: 'warning', title: 'Stash is empty' });
      return;
    }

    const entry = state.stash[0];
    set({
      stash: state.stash.slice(1),
      workingDirectory: { ...entry.files },
      stagedFiles: {},
      lastActionExplanation: `Popped stash: ${entry.message}`
    });
    get().addToast({ type: 'success', title: 'Stash popped', message: entry.message });
  },

  // ── Cherry Pick ────────────────────────────────────────────

  cherryPick: (commitId) => {
    const state = get();
    const commit = state.commits[commitId];
    if (!commit) {
      get().addToast({ type: 'error', title: 'Commit not found', message: commitId });
      return;
    }
    if (state.conflictState) {
      get().addToast({ type: 'error', title: 'Cannot cherry-pick', message: 'Resolve conflicts first' });
      return;
    }

    const headCommit = getCommit(state.commits, state.head, state.branches);
    if (!headCommit) return;

    // Apply the diff from the cherry-picked commit's parent to the cherry-picked commit
    const parentId = commit.parents[0];
    const parentFiles = parentId ? (state.commits[parentId]?.files || {}) : {};
    
    const newFiles = { ...headCommit.files };
    const allFiles = new Set([...Object.keys(parentFiles), ...Object.keys(commit.files)]);
    
    allFiles.forEach(file => {
      const parentContent = parentFiles[file] || '';
      const commitContent = commit.files[file] || '';
      if (parentContent !== commitContent) {
        // This file was changed in the cherry-picked commit
        if (!commitContent) {
          delete newFiles[file];
        } else {
          newFiles[file] = commitContent;
        }
      }
    });

    const newCommitId = generateId();
    const newCommit: Commit = {
      id: newCommitId,
      parents: [headCommit.id],
      message: commit.message,
      files: newFiles,
      timestamp: Date.now(),
    };

    const newCommits = { ...state.commits, [newCommitId]: newCommit };
    const newBranches = { ...state.branches };
    if (!state.detachedHead && state.branches[state.head]) {
      newBranches[state.head] = newCommitId;
    }

    set({
      commits: newCommits,
      branches: newBranches,
      workingDirectory: newFiles,
      stagedFiles: {},
      lastActionExplanation: `Cherry-picked commit ${commitId.substring(0,6)}`
    });
    get().addToast({ type: 'success', title: 'Cherry-picked', message: `${commitId.substring(0,6)}: ${commit.message}` });
  },

  // ── Tags ───────────────────────────────────────────────────

  createTag: (name) => {
    const state = get();
    if (state.tags[name]) {
      get().addToast({ type: 'error', title: 'Tag exists', message: `'${name}' already exists` });
      return;
    }
    const commitId = state.branches[state.head] || state.head;
    set({
      tags: { ...state.tags, [name]: { name, commitId, timestamp: Date.now() } },
      lastActionExplanation: `Created tag ${name} at ${commitId.substring(0,6)}`
    });
    get().addToast({ type: 'success', title: 'Tag created', message: `${name} → ${commitId.substring(0,6)}` });
  },

  deleteTag: (name) => {
    const state = get();
    if (!state.tags[name]) {
      get().addToast({ type: 'error', title: 'Tag not found', message: name });
      return;
    }
    const newTags = { ...state.tags };
    delete newTags[name];
    set({ tags: newTags, lastActionExplanation: `Deleted tag ${name}` });
    get().addToast({ type: 'info', title: 'Tag deleted', message: name });
  },
}));

export default useGitStore;
