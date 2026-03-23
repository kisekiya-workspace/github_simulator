export interface File {
  name: string;
  content: string;
}

export interface Commit {
  id: string;
  parents: string[]; // commit IDs
  message: string;
  files: Record<string, string>; // Maps filename to content
  timestamp: number;
}

export interface ConflictState {
  targetBranch: string;
  sourceBranch: string;
  files: Record<string, ConflictFile>; // filename -> conflict info
}

export interface ConflictFile {
  base: string;
  target: string;
  source: string;
  mergedContent: string; // the content with conflict markers
}

export interface InteractiveRebaseState {
  targetBranch: string;
  originalBranch: string;
  steps: RebaseStep[];
  activeStepIndex: number;
}

export interface RebaseStep {
  commitId: string;
  action: 'pick' | 'skip' | 'edit' | 'squash';
  message: string;
}

export interface GitTag {
  name: string;
  commitId: string;
  timestamp: number;
}

export interface StashEntry {
  id: string;
  message: string;
  files: Record<string, string>;
  stagedFiles: Record<string, string | null>;
  branch: string;
  timestamp: number;
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

export interface FileDiff {
  filename: string;
  oldContent: string;
  newContent: string;
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

export type TerminalLineType = 'input' | 'output' | 'error' | 'success' | 'info' | 'diff-add' | 'diff-remove' | 'diff-header';

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GitState {
  // Persistence 
  config: { persistState: boolean };

  commits: Record<string, Commit>;
  branches: Record<string, string>; // branch name -> commit ID
  head: string; // branch name or commit ID if detached
  detachedHead: boolean;
  workingDirectory: Record<string, string>; // filename -> content
  stagedFiles: Record<string, string | null>; // filename -> content, null means deleted
  
  // Tags & Stash
  tags: Record<string, GitTag>;
  stash: StashEntry[];

  // Ongoing operations state
  conflictState: ConflictState | null;
  rebaseState: InteractiveRebaseState | null;
  activeScenarioId: string | null;
  lastActionExplanation: string | null;

  // Terminal
  terminalHistory: TerminalLine[];
  commandHistory: string[];

  // Toasts
  toasts: Toast[];

  // Progress tracking
  completedScenarios: string[];

  // Undo
  undoStack: Array<Partial<GitState>>;

  // Actions
  initRepo: () => void;
  loadScenario: (setupFunc: (store: GitState) => void, id: string) => void;
  saveFile: (name: string, content: string) => void;
  deleteFile: (name: string) => void;
  stageFile: (name: string) => void;
  unstageFile: (name: string) => void;
  stageAllFiles: () => void;
  commit: (message: string) => void;
  createBranch: (name: string) => void;
  deleteBranch: (name: string) => void;
  checkout: (target: string) => void;
  merge: (sourceBranch: string) => void;
  rebase: (sourceBranch: string) => void;
  interactiveRebase: (sourceBranch: string) => void;
  processRebaseStep: (action: RebaseStep['action'], message?: string) => void;
  resolveConflict: (filename: string, resolvedContent: string) => void;
  completeMerge: (message: string) => void;
  abortMerge: () => void;
  reset: (type: 'soft' | 'hard', targetCommitId?: string) => void;
  resetAll: () => void;
  setExplanation: (text: string | null) => void;

  // New Actions  
  stashChanges: (message?: string) => void;
  stashPop: () => void;
  cherryPick: (commitId: string) => void;
  createTag: (name: string) => void;
  deleteTag: (name: string) => void;

  // Terminal actions
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  addCommandHistory: (cmd: string) => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Progress
  markScenarioComplete: (id: string) => void;
}
