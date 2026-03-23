import type { ScenarioDifficulty } from '../types';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: ScenarioDifficulty;
  conceptExplanation: string;
  setup: (store: any) => void;
  tasks: ScenarioTask[];
  hints: string[];
}

export interface ScenarioTask {
  id: string;
  description: string;
  check: (state: any) => boolean;
}

export const scenarios: Scenario[] = [
  // ── BEGINNER ──────────────────────────────────────────────
  {
    id: 'intro',
    title: 'First Commit',
    description: 'Learn how to make your very first commit.',
    difficulty: 'beginner',
    conceptExplanation: 'A commit is a snapshot of your project at a specific point in time. Think of it as a save point in a game — you can always come back to it.',
    setup: (store) => {
      store.resetAll();
    },
    tasks: [
      { id: 'edit', description: 'Edit README.md and save your changes.', check: (s) => {
        const headCommit = s.commits[s.branches[s.head]];
        return headCommit && s.workingDirectory['README.md'] !== headCommit.files['README.md'];
      }},
      { id: 'stage', description: 'Stage README.md (git add README.md).', check: (s) => 'README.md' in s.stagedFiles },
      { id: 'commit', description: 'Create a commit with a message.', check: (s) => Object.keys(s.commits).length > 1 }
    ],
    hints: [
      'Click on README.md in the file explorer to open it.',
      'After editing, click Save or use the terminal: git add README.md',
      'Then use the Commit panel or terminal: git commit -m "my first commit"',
    ]
  },
  {
    id: 'staging-area',
    title: 'The Staging Area',
    description: 'Understand the flow: Working Directory → Staging → Repository.',
    difficulty: 'beginner',
    conceptExplanation: 'The staging area (index) lets you choose exactly which changes to include in your next commit. You can have many modified files but only stage the ones you want to commit.',
    setup: (store) => {
      store.resetAll();
    },
    tasks: [
      { id: 'create-files', description: 'Create two new files (any names).', check: (s) => Object.keys(s.workingDirectory).length >= 3 },
      { id: 'stage-one', description: 'Stage only ONE of the new files.', check: (s) => {
        const stagedCount = Object.keys(s.stagedFiles).length;
        return stagedCount === 1;
      }},
      { id: 'commit-one', description: 'Commit the staged file.', check: (s) => Object.keys(s.commits).length > 1 },
      { id: 'stage-other', description: 'Now stage and commit the other file.', check: (s) => Object.keys(s.commits).length > 2 }
    ],
    hints: [
      'Use the + button in the file explorer to create new files.',
      'Stage just one file using: git add <filename>',
      'Commit it, then repeat for the other file — this shows selective staging!',
    ]
  },
  {
    id: 'branching',
    title: 'Branching Out',
    description: 'Branches let you work in isolated workspaces.',
    difficulty: 'beginner',
    conceptExplanation: 'A branch is just a pointer to a commit. Creating a branch is cheap and fast. The default branch is usually called "main".',
    setup: (store) => {
      store.resetAll();
    },
    tasks: [
      { id: 'branch', description: 'Create a new branch named "feature".', check: (s) => !!s.branches['feature'] },
      { id: 'checkout', description: 'Checkout the "feature" branch.', check: (s) => s.head === 'feature' },
      { id: 'commit', description: 'Make a commit on the feature branch.', check: (s) => {
        const featureCommitId = s.branches['feature'];
        const mainCommitId = s.branches['main'];
        return featureCommitId !== mainCommitId;
      }}
    ],
    hints: [
      'Use the Branch panel or terminal: git branch feature',
      'Switch to it: git checkout feature',
      'Edit a file, stage, and commit on this branch.',
    ]
  },
  {
    id: 'undoing-changes',
    title: 'Undoing Changes',
    description: 'Learn to undo mistakes with git reset.',
    difficulty: 'beginner',
    conceptExplanation: 'git reset --soft keeps your changes in the working directory and staging area. git reset --hard discards everything and restores files to the target commit.',
    setup: (store) => {
      store.resetAll();
      store.saveFile('README.md', '# Updated README\n\nThis is an updated version.');
      store.stageFile('README.md');
      store.commit('Add updated content');
      store.saveFile('temp.txt', 'Temporary file that should be removed.');
      store.stageFile('temp.txt');
      store.commit('Add temp file');
    },
    tasks: [
      { id: 'check-log', description: 'Use "git log" to see the commit history.', check: (s) => s.commandHistory.includes('git log') },
      { id: 'soft-reset', description: 'Undo the last commit but keep changes: git reset --soft HEAD~1.', check: (s) => {
        const headCommit = s.commits[s.branches[s.head] || s.head];
        // Should be at the commit BEFORE "Add temp file"
        return headCommit && headCommit.message === 'Add updated content' && Object.keys(s.stagedFiles).length > 0;
      }},
      { id: 'hard-reset', description: 'Discard all changes and reset to initial: git reset --hard <initial-commit-id>.', check: (s) => {
        const headCommit = s.commits[s.branches[s.head] || s.head];
        return headCommit && headCommit.message === 'Initial commit' && Object.keys(s.stagedFiles).length === 0 && !s.workingDirectory['temp.txt'];
      }}
    ],
    hints: [
      'Type "git log" in the terminal to see commits.',
      'git reset --soft removes the last commit but keeps your changes staged.',
      'git reset --hard discards all changes and resets to the target commit.',
    ]
  },

  // ── INTERMEDIATE ──────────────────────────────────────────
  {
    id: 'fast-forward',
    title: 'Fast-Forward Merge',
    description: 'When branches don\'t diverge, Git can fast-forward.',
    difficulty: 'intermediate',
    conceptExplanation: 'A fast-forward merge happens when the target branch has no new commits since the source branched off. Git simply moves the target pointer forward — no new merge commit is needed.',
    setup: (store) => {
      store.resetAll();
      store.createBranch('feature');
      store.saveFile('feature.txt', 'A new feature file');
      store.stageFile('feature.txt');
      store.commit('Add feature');
      store.saveFile('feature.txt', 'A new feature file\nWith more content');
      store.stageFile('feature.txt');
      store.commit('Update feature');
      store.checkout('main');
    },
    tasks: [
      { id: 'check-graph', description: 'Observe: main is behind feature with no divergent commits.', check: () => true },
      { id: 'merge', description: 'Merge "feature" into "main".', check: (s) => s.branches['main'] === s.branches['feature'] },
    ],
    hints: [
      'Look at the graph — feature is ahead of main, but main hasn\'t moved.',
      'Use: git merge feature. Git will fast-forward main to feature\'s tip.',
    ]
  },
  {
    id: 'merge-conflict',
    title: 'Merge Conflicts',
    description: 'When changes collide — learn to resolve conflicts!',
    difficulty: 'intermediate',
    conceptExplanation: 'Conflicts happen when two branches modify the same lines in the same file. Git can\'t decide which version to keep, so it marks the conflicting sections and asks you to resolve them manually.',
    setup: (store) => {
      store.resetAll();
      store.saveFile('README.md', 'Base content');
      store.stageFile('README.md');
      store.commit('Update README base');
      
      store.createBranch('feature');
      store.checkout('main');
      
      store.saveFile('README.md', 'Base content\nLine added in main');
      store.stageFile('README.md');
      store.commit('Main update');
      
      store.checkout('feature');
      store.saveFile('README.md', 'Base content\nLine added in feature');
      store.stageFile('README.md');
      store.commit('Feature update');
      
      store.checkout('main');
    },
    tasks: [
      { id: 'merge', description: 'Merge "feature" into "main".', check: (s) => !!s.conflictState },
      { id: 'resolve', description: 'Edit the conflicted file and resolve it.', check: (s) => s.conflictState && Object.keys(s.conflictState.files).length === 0 },
      { id: 'complete', description: 'Complete the merge commit.', check: (s) => !s.conflictState && s.commits[s.branches['main']]?.parents.length === 2 }
    ],
    hints: [
      'Use: git merge feature. You\'ll see conflict markers in README.md.',
      'Open README.md, remove the <<<, ===, >>> markers, and save the resolved version.',
      'Click "Mark all as resolved & Commit Merge" to finalize.',
    ]
  },
  {
    id: 'rebase-workflow',
    title: 'Rebase Workflow',
    description: 'Rebase vs merge — create a clean, linear history.',
    difficulty: 'intermediate',
    conceptExplanation: 'Rebase replays your commits on top of another branch, creating a linear history without merge commits. It rewrites commit hashes — never rebase shared/public branches!',
    setup: (store) => {
      store.resetAll();
      
      store.createBranch('feature');
      store.checkout('main');
      
      store.saveFile('main.txt', 'Main branch work');
      store.stageFile('main.txt');
      store.commit('Main work');
      
      store.checkout('feature');
      store.saveFile('feature.txt', 'Feature branch work');
      store.stageFile('feature.txt');
      store.commit('Feature work');
      store.saveFile('feature.txt', 'Feature branch work\nMore feature work');
      store.stageFile('feature.txt');
      store.commit('More feature work');
    },
    tasks: [
      { id: 'observe', description: 'Notice feature and main have diverged.', check: () => true },
      { id: 'rebase', description: 'Rebase feature onto main.', check: (s) => {
        const featureId = s.branches['feature'];
        const mainId = s.branches['main'];
        if (!featureId || !mainId) return false;
        // Check that feature's ancestor chain includes main
        let curr = featureId;
        while (curr) {
          if (curr === mainId) return true;
          curr = s.commits[curr]?.parents[0];
        }
        return false;
      }},
    ],
    hints: [
      'Make sure you\'re on the feature branch (git checkout feature).',
      'Then run: git rebase main',
      'Watch the graph — feature\'s commits are replayed on top of main!',
    ]
  },
  {
    id: 'cherry-pick',
    title: 'Cherry-Pick',
    description: 'Pick specific commits from other branches.',
    difficulty: 'intermediate',
    conceptExplanation: 'Cherry-pick lets you apply changes from a specific commit onto your current branch, without merging the entire branch. Useful for backporting bugfixes.',
    setup: (store) => {
      store.resetAll();
      store.createBranch('feature');
      
      store.saveFile('bugfix.txt', 'Important bugfix');
      store.stageFile('bugfix.txt');
      store.commit('Fix critical bug');
      
      store.saveFile('experiment.txt', 'Experimental code');
      store.stageFile('experiment.txt');
      store.commit('Add experiment');
      
      store.checkout('main');
    },
    tasks: [
      { id: 'identify', description: 'Use "git log" on feature to find the bugfix commit.', check: () => true },
      { id: 'cherry-pick', description: 'Cherry-pick the bugfix commit onto main.', check: (s) => {
        const mainCommit = s.commits[s.branches['main']];
        return mainCommit && mainCommit.files['bugfix.txt'] && !mainCommit.files['experiment.txt'];
      }}
    ],
    hints: [
      'Checkout main first: git checkout main',
      'Find the bugfix commit ID from git log or the graph.',
      'Run: git cherry-pick <commit-id> — it copies just that commit!',
    ]
  },
  {
    id: 'stashing',
    title: 'Stashing Work',
    description: 'Temporarily save work-in-progress to switch branches.',
    difficulty: 'intermediate',
    conceptExplanation: 'git stash saves your uncommitted changes and restores a clean working directory. You can later pop the stash to get your changes back. Perfect for "I need to switch branches but I\'m not ready to commit".',
    setup: (store) => {
      store.resetAll();
      store.createBranch('feature');
      store.checkout('feature');
      store.saveFile('wip.txt', 'Work in progress...');
    },
    tasks: [
      { id: 'stash', description: 'Stash your work-in-progress.', check: (s) => s.stash.length > 0 },
      { id: 'switch', description: 'Switch to main and make a commit.', check: (s) => s.head === 'main' && Object.keys(s.commits).length > 1 },
      { id: 'pop', description: 'Switch back to feature and pop the stash.', check: (s) => s.head === 'feature' && s.stash.length === 0 && s.workingDirectory['wip.txt'] }
    ],
    hints: [
      'Run: git stash — your changes are saved and working directory is clean.',
      'Now checkout main, make changes, commit, then go back to feature.',
      'Run: git stash pop — your WIP is restored!',
    ]
  },

  // ── ADVANCED ──────────────────────────────────────────────
  {
    id: 'detached-head',
    title: 'Detached HEAD',
    description: 'Navigate history and understand the detached HEAD state.',
    difficulty: 'advanced',
    conceptExplanation: 'When you checkout a specific commit (not a branch), you\'re in "detached HEAD" state. Any commits you make won\'t belong to any branch and may be lost. To keep them, create a branch.',
    setup: (store) => {
      store.resetAll();
      store.saveFile('v1.txt', 'Version 1');
      store.stageFile('v1.txt');
      store.commit('Version 1');
      store.saveFile('v2.txt', 'Version 2');
      store.stageFile('v2.txt');
      store.commit('Version 2');
      store.saveFile('v3.txt', 'Version 3');
      store.stageFile('v3.txt');
      store.commit('Version 3');
    },
    tasks: [
      { id: 'checkout-old', description: 'Checkout an older commit by its ID.', check: (s) => s.detachedHead },
      { id: 'create-branch', description: 'Create a branch to save your position.', check: (s) => !s.detachedHead && s.head !== 'main' },
      { id: 'return', description: 'Return to main.', check: (s) => s.head === 'main' }
    ],
    hints: [
      'Use git log to see commit IDs, then: git checkout <commit-id>',
      'You\'re now in detached HEAD! Create a branch: git checkout -b recovery',
      'Go back safely: git checkout main',
    ]
  },
  {
    id: 'open-source',
    title: 'Open Source Workflow',
    description: 'Simulate a typical open-source contribution flow.',
    difficulty: 'advanced',
    conceptExplanation: 'Open source contributions typically follow: fork → clone → branch → commit → push → pull request. Here we simulate this with branching and merging.',
    setup: (store) => {
      store.resetAll();
      store.saveFile('README.md', '# Open Source Project\n\nWelcome to the project!\n\n## Contributing\n\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Submit a pull request');
      store.stageFile('README.md');
      store.commit('Project setup');
      
      store.saveFile('app.js', '// Main application\nfunction main() {\n  console.log("Hello!");\n}');
      store.stageFile('app.js');
      store.commit('Add main app');
      
      // Critical: Add a commit to main to diverge so that merge creates a merge commit
      store.createBranch('fix/typo'); // switches to fix/typo
      store.checkout('main');
      store.saveFile('CONTRIBUTING.md', 'Please be nice.');
      store.stageFile('CONTRIBUTING.md');
      store.commit('Add contributing guidelines');
      store.checkout('fix/typo');
    },
    tasks: [
      { id: 'branch', description: 'Create a feature branch (e.g., "fix/typo").', check: (s) => Object.keys(s.branches).length > 1 && s.head !== 'main' },
      { id: 'change', description: 'Make meaningful changes and commit.', check: (s) => {
        const branchId = s.branches[s.head];
        return branchId && branchId !== s.branches['main'];
      }},
      { id: 'merge-back', description: 'Switch to main and merge your branch.', check: (s) => {
        const mainCommit = s.commits[s.branches['main']];
        return mainCommit && mainCommit.parents.length === 2;
      }},
      { id: 'tag', description: 'Tag the release (e.g., "v1.0").', check: (s) => Object.keys(s.tags).length > 0 }
    ],
    hints: [
      'Create a descriptive branch: git checkout -b fix/typo',
      'Make changes, stage, and commit. Then checkout main.',
      'Merge your branch: git merge fix/typo',
      'Tag the result: git tag v1.0',
    ]
  },
  {
    id: 'linear-history',
    title: 'Linear History with Rebase',
    description: 'Use rebase to keep a clean, linear history.',
    difficulty: 'advanced',
    conceptExplanation: 'Interactive rebase lets you modify your commit history: squash multiple commits into one, reorder them, edit messages, or drop commits entirely. It\'s a powerful tool for cleaning up before merging to main.',
    setup: (store) => {
      store.resetAll();
      store.createBranch('feature');
      
      store.saveFile('feature.txt', 'Start');
      store.stageFile('feature.txt');
      store.commit('WIP: start feature');
      
      store.saveFile('feature.txt', 'Start\nMore work');
      store.stageFile('feature.txt');
      store.commit('WIP: more work');
      
      store.saveFile('feature.txt', 'Start\nMore work\nFinished!');
      store.stageFile('feature.txt');
      store.commit('WIP: finish feature');
    },
    tasks: [
      { id: 'observe', description: 'Notice the messy "WIP" commit messages.', check: () => true },
      { id: 'rebase', description: 'Rebase feature onto main to clean up.', check: (s) => {
        const featureId = s.branches['feature'];
        const mainId = s.branches['main'];
        if (!featureId || !mainId) return false;
        let curr = featureId;
        while (curr) {
          if (curr === mainId) return true;
          curr = s.commits[curr]?.parents[0];
        }
        return false;
      }}
    ],
    hints: [
      'Look at the commit history — three WIP commits clutter the log.',
      'Use: git rebase main to replay your commits cleanly.',
    ]
  },
];

export const difficultyColors: Record<ScenarioDifficulty, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  advanced: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};
