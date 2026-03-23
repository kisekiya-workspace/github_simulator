import type { GitState, TerminalLine } from '../types';
import { computeFileDiffs } from './utils';
import { GIT_COMMANDS } from '../data/gitCommands';

type OutputLine = Omit<TerminalLine, 'id' | 'timestamp'>;

/**
 * Parse and execute a git command string against the store
 */
export function executeCommand(input: string, store: GitState): OutputLine[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const parts = parseArgs(trimmed);
  const cmd = parts[0]?.toLowerCase();

  // Built-in shell commands
  if (cmd === 'clear') {
    store.clearTerminal();
    return [];
  }

  if (cmd === 'help') {
    if (parts.length > 1) {
      return getDetailedCommandHelp(parts[1]);
    }
    return getHelpOutput();
  }

  if (cmd !== 'git') {
    return [{ type: 'error', content: `Command not found: ${cmd}. Type 'help' for available commands.` }];
  }

  const subCommand = parts[1]?.toLowerCase();
  
  // Handle git help <command> or git <command> --help
  if (subCommand === 'help' && parts[2]) {
    return getDetailedCommandHelp(parts[2]);
  }
  if (subCommand && (hasFlag(parts.slice(2), '--help') || hasFlag(parts.slice(2), '-h'))) {
    return getDetailedCommandHelp(subCommand);
  }

  if (!subCommand) {
    return [{ type: 'error', content: "Usage: git <command>. Type 'help' for available commands." }];
  }

  switch (subCommand) {
    case 'init':
      return handleInit(store);
    case 'status':
      return handleStatus(store);
    case 'add':
      return handleAdd(parts.slice(2), store);
    case 'commit':
      return handleCommit(parts.slice(2), store);
    case 'branch':
      return handleBranch(parts.slice(2), store);
    case 'checkout':
      return handleCheckout(parts.slice(2), store);
    case 'switch':
      return handleCheckout(parts.slice(2), store);
    case 'merge':
      return handleMerge(parts.slice(2), store);
    case 'rebase':
      return handleRebase(parts.slice(2), store);
    case 'log':
      return handleLog(parts.slice(2), store);
    case 'diff':
      return handleDiff(store);
    case 'stash':
      return handleStash(parts.slice(2), store);
    case 'cherry-pick':
      return handleCherryPick(parts.slice(2), store);
    case 'tag':
      return handleTag(parts.slice(2), store);
    case 'reset':
      return handleReset(parts.slice(2), store);
    case 'rm':
      return handleRm(parts.slice(2), store);
    default:
      return [{ type: 'error', content: `git: '${subCommand}' is not a git command. See 'help'.` }];
  }
}

function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of input) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) args.push(current);
  return args;
}

function extractFlag(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(f => args.includes(f));
}

function resolveRef(ref: string, store: GitState): string | null {
  if (!ref) return null;
  
  // Direct branch or commit match
  if (store.branches[ref]) return store.branches[ref];
  if (store.commits[ref]) return ref;

  // Handle HEAD relative refs (HEAD~1, HEAD^, etc)
  if (ref.startsWith('HEAD')) {
    let currentId = store.branches[store.head] || store.head;
    if (!currentId) return null;

    if (ref === 'HEAD') return currentId;

    // HEAD~n
    if (ref.includes('~')) {
      const parts = ref.split('~');
      const count = parseInt(parts[1]) || 1;
      let curr: string | null = currentId;
      for (let i = 0; i < count && curr; i++) {
        curr = store.commits[curr]?.parents[0] || null;
      }
      return curr;
    }

    // HEAD^
    if (ref.includes('^')) {
      const count = (ref.match(/\^/g) || []).length;
      let curr: string | null = currentId;
      for (let i = 0; i < count && curr; i++) {
        curr = store.commits[curr]?.parents[0] || null;
      }
      return curr;
    }
  }

  // Try partial commit ID match
  const match = Object.keys(store.commits).find(id => id.startsWith(ref));
  return match || null;
}

// ── Command Handlers ─────────────────────────────────────────

function handleInit(store: GitState): OutputLine[] {
  store.initRepo();
  return [{ type: 'success', content: 'Initialized empty Git repository' }];
}

function handleStatus(store: GitState): OutputLine[] {
  const lines: OutputLine[] = [];
  const headCommit = store.branches[store.head] ? store.commits[store.branches[store.head]] : store.commits[store.head];
  const headFiles = headCommit?.files || {};

  if (store.detachedHead) {
    lines.push({ type: 'info', content: `HEAD detached at ${store.head.substring(0, 7)}` });
  } else {
    lines.push({ type: 'info', content: `On branch ${store.head}` });
  }

  if (store.conflictState) {
    lines.push({ type: 'error', content: `You have unmerged paths.` });
    lines.push({ type: 'error', content: `  (fix conflicts and run "git commit")` });
    Object.keys(store.conflictState.files).forEach(f => {
      lines.push({ type: 'error', content: `\tboth modified:   ${f}` });
    });
    return lines;
  }

  // Staged files
  const stagedKeys = Object.keys(store.stagedFiles);
  if (stagedKeys.length > 0) {
    lines.push({ type: 'success', content: 'Changes to be committed:' });
    stagedKeys.forEach(f => {
      const content = store.stagedFiles[f];
      if (content === null) {
        lines.push({ type: 'diff-remove', content: `\tdeleted:    ${f}` });
      } else if (!(f in headFiles)) {
        lines.push({ type: 'diff-add', content: `\tnew file:   ${f}` });
      } else {
        lines.push({ type: 'diff-add', content: `\tmodified:   ${f}` });
      }
    });
  }

  // Unstaged changes
  const modified: string[] = [];
  const deleted: string[] = [];

  for (const [file, content] of Object.entries(store.workingDirectory)) {
    const stagedContent = file in store.stagedFiles ? store.stagedFiles[file] : headFiles[file];
    if (stagedContent !== undefined && content !== stagedContent) {
      modified.push(file);
    }
  }
  for (const file of Object.keys(headFiles)) {
    if (!(file in store.workingDirectory) && !(file in store.stagedFiles)) {
      deleted.push(file);
    }
  }

  if (modified.length > 0 || deleted.length > 0) {
    lines.push({ type: 'output', content: 'Changes not staged for commit:' });
    modified.forEach(f => lines.push({ type: 'diff-remove', content: `\tmodified:   ${f}` }));
    deleted.forEach(f => lines.push({ type: 'diff-remove', content: `\tdeleted:    ${f}` }));
  }

  // Untracked files
  const untracked = Object.keys(store.workingDirectory).filter(f => !(f in headFiles) && !(f in store.stagedFiles));
  if (untracked.length > 0) {
    lines.push({ type: 'output', content: 'Untracked files:' });
    untracked.forEach(f => lines.push({ type: 'error', content: `\t${f}` }));
  }

  if (stagedKeys.length === 0 && modified.length === 0 && deleted.length === 0 && untracked.length === 0) {
    lines.push({ type: 'output', content: 'nothing to commit, working tree clean' });
  }

  return lines;
}

function handleAdd(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: "Nothing specified. Did you mean 'git add .'?" }];
  }

  if (args[0] === '.' || args[0] === '-A' || args[0] === '--all') {
    store.stageAllFiles();
    return [{ type: 'success', content: 'Staged all changes.' }];
  }

  const results: OutputLine[] = [];
  for (const file of args) {
    if (file in store.workingDirectory || file in (store.commits[store.branches[store.head] || store.head]?.files || {})) {
      store.stageFile(file);
      results.push({ type: 'success', content: `add '${file}'` });
    } else {
      results.push({ type: 'error', content: `pathspec '${file}' did not match any files` });
    }
  }
  return results;
}

function handleCommit(args: string[], store: GitState): OutputLine[] {
  const message = extractFlag(args, '-m');
  if (!message) {
    return [{ type: 'error', content: "Please supply a message with -m flag: git commit -m \"your message\"" }];
  }

  const stagedBefore = Object.keys(store.stagedFiles).length;
  if (stagedBefore === 0) {
    return [{ type: 'warning' as OutputLine['type'], content: 'nothing to commit (use "git add" to stage changes)' }].map(l => ({ ...l, type: l.type as OutputLine['type'] }));
  }

  store.commit(message);
  const newHead = store.branches[store.head] || store.head;
  return [
    { type: 'success', content: `[${store.head} ${newHead.substring(0, 7)}] ${message}` },
    { type: 'output', content: ` ${stagedBefore} file(s) changed` }
  ];
}

function handleBranch(args: string[], store: GitState): OutputLine[] {
  // git branch (list)
  if (args.length === 0) {
    const lines: OutputLine[] = [];
    Object.keys(store.branches).sort().forEach(b => {
      const isCurrent = b === store.head;
      lines.push({ 
        type: isCurrent ? 'success' : 'output', 
        content: `${isCurrent ? '* ' : '  '}${b}` 
      });
    });
    return lines;
  }

  // git branch -d/-D <name>
  if (hasFlag(args, '-d', '-D')) {
    const name = args.find(a => a !== '-d' && a !== '-D');
    if (!name) return [{ type: 'error', content: 'Branch name required' }];
    store.deleteBranch(name);
    return [{ type: 'success', content: `Deleted branch ${name}` }];
  }

  // git branch <name> (create without checkout)
  const name = args[0];
  if (store.branches[name]) {
    return [{ type: 'error', content: `fatal: A branch named '${name}' already exists.` }];
  }
  
  const currentCommit = store.branches[store.head] || store.head;
  // Create branch without switching (unlike createBranch in store which auto-switches)
  const currentHead = store.head;
  store.createBranch(name);
  // Switch back to original branch
  if (currentHead !== name) {
    store.checkout(currentHead);
  }
  return [{ type: 'success', content: `Created branch '${name}' at ${currentCommit.substring(0, 7)}` }];
}

function handleCheckout(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: 'Specify a branch or commit to checkout.' }];
  }

  // git checkout -b <name> (create + checkout)
  if (hasFlag(args, '-b')) {
    const name = args.find(a => a !== '-b');
    if (!name) return [{ type: 'error', content: 'Branch name required after -b' }];
    store.createBranch(name);
    return [{ type: 'success', content: `Switched to a new branch '${name}'` }];
  }

  const target = args[0];
  const resolvedId = resolveRef(target, store);
  const isBranch = !!store.branches[target];

  if (!resolvedId) {
    return [{ type: 'error', content: `error: pathspec '${target}' did not match any known branch or commit.` }];
  }

  store.checkout(isBranch ? target : resolvedId); 
  
  if (isBranch) {
    return [{ type: 'success', content: `Switched to branch '${target}'` }];
  } else {
    return [{ type: 'info', content: `HEAD is now at ${resolvedId.substring(0, 7)} (detached HEAD)` }];
  }
}

function handleMerge(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: 'Specify a branch to merge.' }];
  }
  const branch = args[0];
  if (!store.branches[branch]) {
    return [{ type: 'error', content: `merge: ${branch} - not something we can merge` }];
  }

  store.merge(branch);

  if (store.conflictState) {
    return [
      { type: 'error', content: `Auto-merging failed.` },
      { type: 'error', content: `CONFLICT: Merge conflicts in ${Object.keys(store.conflictState.files).join(', ')}` },
      { type: 'info', content: `Fix conflicts and then commit the result.` }
    ];
  }

  return [{ type: 'success', content: `Merged '${branch}' into '${store.head}'` }];
}

function handleRebase(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: 'Specify a branch to rebase onto.' }];
  }

  const branch = args[0];
  const resolvedId = resolveRef(branch, store);
  if (!resolvedId) {
    return [{ type: 'error', content: `fatal: invalid upstream '${branch}'` }];
  }

  store.rebase(branch); // rebase usually takes a branch name but can take a commit ID
  return [{ type: 'success', content: `Successfully rebased onto '${branch}'` }];
}

function handleLog(args: string[], store: GitState): OutputLine[] {
  const lines: OutputLine[] = [];
  let currentId = store.branches[store.head] || store.head;
  const maxCount = extractFlag(args, '-n') ? parseInt(extractFlag(args, '-n')!) : 10;
  let count = 0;

  const visited = new Set<string>();
  const queue = [currentId];

  while (queue.length > 0 && count < maxCount) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const commit = store.commits[id];
    if (!commit) continue;

    const isHead = (store.branches[store.head] === id) || (store.head === id);
    const branchNames = Object.entries(store.branches)
      .filter(([, cId]) => cId === id)
      .map(([name]) => name);
    const tagNames = Object.entries(store.tags)
      .filter(([, tag]) => tag.commitId === id)
      .map(([name]) => name);

    let refInfo = '';
    const refs: string[] = [];
    if (isHead) refs.push('HEAD -> ' + store.head);
    else refs.push(...branchNames);
    refs.push(...tagNames.map(t => `tag: ${t}`));
    if (refs.length > 0) refInfo = ` (${refs.join(', ')})`;

    lines.push({ type: 'diff-header', content: `commit ${id}${refInfo}` });
    lines.push({ type: 'output', content: `    ${commit.message}` });
    lines.push({ type: 'output', content: '' });

    commit.parents.forEach(p => queue.push(p));
    count++;
  }

  if (lines.length === 0) {
    lines.push({ type: 'output', content: 'No commits yet.' });
  }

  return lines;
}

function handleDiff(store: GitState): OutputLine[] {
  const headCommit = store.branches[store.head] ? store.commits[store.branches[store.head]] : store.commits[store.head];
  const headFiles = headCommit?.files || {};
  
  const diffs = computeFileDiffs(headFiles, store.workingDirectory);
  
  if (diffs.length === 0) {
    return [{ type: 'output', content: 'No changes detected.' }];
  }

  const lines: OutputLine[] = [];
  diffs.forEach(diff => {
    lines.push({ type: 'diff-header', content: `diff --git a/${diff.filename} b/${diff.filename}` });
    lines.push({ type: 'diff-header', content: `--- a/${diff.filename}` });
    lines.push({ type: 'diff-header', content: `+++ b/${diff.filename}` });
    
    diff.lines.forEach(l => {
      if (l.type === 'add') {
        lines.push({ type: 'diff-add', content: `+${l.content}` });
      } else if (l.type === 'remove') {
        lines.push({ type: 'diff-remove', content: `-${l.content}` });
      } else {
        lines.push({ type: 'output', content: ` ${l.content}` });
      }
    });
  });

  return lines;
}

function handleStash(args: string[], store: GitState): OutputLine[] {
  const subCmd = args[0]?.toLowerCase();
  
  if (!subCmd || subCmd === 'push') {
    const msg = extractFlag(args, '-m') || undefined;
    store.stashChanges(msg);
    return [{ type: 'success', content: `Saved working directory and index state` }];
  }

  if (subCmd === 'pop') {
    if (store.stash.length === 0) {
      return [{ type: 'error', content: 'No stash entries found.' }];
    }
    store.stashPop();
    return [{ type: 'success', content: 'Applied and dropped stash@{0}' }];
  }

  if (subCmd === 'list') {
    if (store.stash.length === 0) {
      return [{ type: 'output', content: 'No stash entries.' }];
    }
    return store.stash.map((entry, i) => ({
      type: 'output' as const,
      content: `stash@{${i}}: ${entry.message} (${entry.branch})`
    }));
  }

  return [{ type: 'error', content: `git stash ${subCmd} is not supported. Try: push, pop, list` }];
}

function handleCherryPick(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: 'Specify a commit ID to cherry-pick.' }];
  }
  
  const commitId = args[0];
  // Try partial match
  const match = Object.keys(store.commits).find(id => id.startsWith(commitId));
  if (!match) {
    return [{ type: 'error', content: `fatal: bad revision '${commitId}'` }];
  }

  store.cherryPick(match);
  return [{ type: 'success', content: `Cherry-picked commit ${match.substring(0, 7)}` }];
}

function handleTag(args: string[], store: GitState): OutputLine[] {
  // git tag (list)
  if (args.length === 0) {
    const tags = Object.keys(store.tags).sort();
    if (tags.length === 0) return [{ type: 'output', content: 'No tags.' }];
    return tags.map(t => ({ type: 'output' as const, content: t }));
  }

  // git tag -d <name>
  if (hasFlag(args, '-d')) {
    const name = args.find(a => a !== '-d');
    if (!name) return [{ type: 'error', content: 'Tag name required' }];
    store.deleteTag(name);
    return [{ type: 'success', content: `Deleted tag '${name}'` }];
  }

  // git tag <name>
  store.createTag(args[0]);
  return [{ type: 'success', content: `Created tag '${args[0]}'` }];
}

function handleReset(args: string[], store: GitState): OutputLine[] {
  const isHard = hasFlag(args, '--hard');
  const type = isHard ? 'hard' : 'soft';
  
  const targetId = args.find(a => !a.startsWith('-'));
  
  if (targetId) {
    const resolvedId = resolveRef(targetId, store);
    if (!resolvedId) {
      return [{ type: 'error', content: `fatal: '${targetId}' is not a valid commit` }];
    }
    store.reset(type, resolvedId);
    return [{ type: 'success', content: `HEAD is now at ${resolvedId.substring(0, 7)}` }];
  }

  store.reset(type);
  const headId = store.branches[store.head] || store.head;
  return [{ type: 'success', content: `HEAD is now at ${headId.substring(0, 7)}` }];
}

function handleRm(args: string[], store: GitState): OutputLine[] {
  if (args.length === 0) {
    return [{ type: 'error', content: 'Specify files to remove.' }];
  }

  const results: OutputLine[] = [];
  for (const file of args) {
    if (file in store.workingDirectory) {
      store.deleteFile(file);
      store.stageFile(file); // Stage the deletion
      results.push({ type: 'success', content: `rm '${file}'` });
    } else {
      results.push({ type: 'error', content: `pathspec '${file}' did not match any files` });
    }
  }
  return results;
}

function getDetailedCommandHelp(command: string): OutputLine[] {
  const normalized = command.startsWith('git ') ? command.slice(4).toLowerCase() : command.toLowerCase();
  const doc = GIT_COMMANDS.find(c => c.name === normalized);

  if (!doc) {
    return [{ type: 'error', content: `No detailed documentation found for command: ${command}` }];
  }

  const lines: OutputLine[] = [
    { type: 'info', content: `COMMAND: git ${normalized}` },
    { type: 'output', content: '' },
    { type: 'output', content: doc.description },
    { type: 'output', content: '' },
  ];

  if (doc.situations && doc.situations.length > 0) {
    lines.push({ type: 'info', content: 'WHEN TO USE:' });
    lines.push({ type: 'output', content: `  • ${doc.situations[0]}` });
    lines.push({ type: 'output', content: '' });
  }

  lines.push({ type: 'diff-header', content: 'Usage:' });
  lines.push({ type: 'output', content: `  ${doc.usage}` });
  lines.push({ type: 'output', content: '' });
  lines.push({ type: 'diff-header', content: 'Examples:' });

  doc.examples.forEach(ex => {
    lines.push({ type: 'output', content: `  $ ${ex}` });
  });

  lines.push({ type: 'output', content: '' });
  lines.push({ type: 'info', content: '💡 Tip: Open the "Docs" page for full troubleshooting & FAQ.' });

  return lines;
}

function getHelpOutput(): OutputLine[] {
  return [
    { type: 'info', content: '╔══════════════════════════════════════════╗' },
    { type: 'info', content: '║     Git Sandbox — Available Commands      ║' },
    { type: 'info', content: '╚══════════════════════════════════════════╝' },
    { type: 'output', content: '' },
    { type: 'output', content: 'Type "git help <command>" for detailed info.' },
    { type: 'output', content: '' },
    { type: 'diff-header', content: 'Getting Started:' },
    { type: 'output', content: '  git init              Initialize a new repository' },
    { type: 'output', content: '  git status            Show working tree status' },
    { type: 'output', content: '' },
    { type: 'diff-header', content: 'Staging & Committing:' },
    { type: 'output', content: '  git add <file>        Stage a file' },
    { type: 'output', content: '  git commit -m "msg"   Create a commit' },
    { type: 'output', content: '  git rm <file>         Remove and stage deletion' },
    { type: 'output', content: '' },
    { type: 'diff-header', content: 'Branching:' },
    { type: 'output', content: '  git branch            List/create branches' },
    { type: 'output', content: '  git checkout <target> Switch branch or commit' },
    { type: 'output', content: '' },
    { type: 'diff-header', content: 'Merging & Rebasing:' },
    { type: 'output', content: '  git merge <branch>    Merge branch into HEAD' },
    { type: 'output', content: '  git rebase <branch>   Rebase HEAD onto branch' },
    { type: 'output', content: '' },
    { type: 'diff-header', content: 'Advanced:' },
    { type: 'output', content: '  git stash             Save changes temporarily' },
    { type: 'output', content: '  git cherry-pick <id>  Apply a specific commit' },
    { type: 'output', content: '  git tag <name>        Create a tag' },
    { type: 'output', content: '  git reset <type>      Reset HEAD to commit' },
    { type: 'output', content: '' },
    { type: 'info', content: '  clear                 Clear terminal' },
    { type: 'info', content: '  help [command]        Show this help or detailed docs' },
  ];
}

/**
 * Get command suggestions for autocomplete
 */
export function getAutocompleteSuggestions(input: string, store: GitState): string[] {
  const parts = parseArgs(input);
  
  if (parts.length <= 1) {
    const commands = ['git', 'clear', 'help'];
    return commands.filter(c => c.startsWith(input.toLowerCase()));
  }

  if (parts[0] !== 'git') return [];

  const subCommands = [
    'init', 'status', 'add', 'commit', 'branch', 'checkout', 'switch',
    'merge', 'rebase', 'log', 'diff', 'stash', 'cherry-pick', 'tag', 'reset', 'rm'
  ];

  if (parts.length === 2) {
    return subCommands.filter(c => c.startsWith(parts[1].toLowerCase())).map(c => `git ${c}`);
  }

  // Context-aware suggestions for 3rd part
  const sub = parts[1].toLowerCase();
  if (['checkout', 'switch', 'merge', 'rebase'].includes(sub)) {
    const branches = Object.keys(store.branches);
    const partial = parts[2] || '';
    return branches.filter(b => b.startsWith(partial)).map(b => `git ${sub} ${b}`);
  }

  if (sub === 'add' || sub === 'rm') {
    const files = Object.keys(store.workingDirectory);
    const partial = parts[2] || '';
    return ['.', ...files].filter(f => f.startsWith(partial)).map(f => `git ${sub} ${f}`);
  }

  return [];
}
