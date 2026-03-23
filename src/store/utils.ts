import type { Commit, DiffLine, FileDiff } from '../types';

export const getCommit = (commits: Record<string, Commit>, idOrBranch: string, branches: Record<string, string>): Commit | undefined => {
  const commitId = branches[idOrBranch] || idOrBranch;
  return commits[commitId];
};

export const getAncestors = (commits: Record<string, Commit>, commitId: string): Set<string> => {
  const ancestors = new Set<string>();
  const queue = [commitId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    ancestors.add(current);
    const commit = commits[current];
    if (commit && commit.parents) {
      queue.push(...commit.parents);
    }
  }
  return ancestors;
};

export const findLCA = (commits: Record<string, Commit>, commitA: string, commitB: string): string | null => {
  const ancestorsA = getAncestors(commits, commitA);
  const queue = [commitB];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ancestorsA.has(current)) {
      return current; // Found the lowest common ancestor
    }
    const commit = commits[current];
    if (commit && commit.parents) {
      queue.push(...commit.parents);
    }
  }
  return null;
};

/**
 * Compute a simple line-by-line diff between two strings
 */
export const computeDiff = (oldContent: string, newContent: string): DiffLine[] => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const lines: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(oldLines, newLines);
  
  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const match of lcs) {
    // Emit removals (lines in old but not in common)
    while (oldIdx < match.oldIndex) {
      lines.push({ type: 'remove', content: oldLines[oldIdx], oldLineNum: oldLineNum++ });
      oldIdx++;
    }
    // Emit additions (lines in new but not in common)
    while (newIdx < match.newIndex) {
      lines.push({ type: 'add', content: newLines[newIdx], newLineNum: newLineNum++ });
      newIdx++;
    }
    // Emit context (common line)
    lines.push({ type: 'context', content: oldLines[oldIdx], oldLineNum: oldLineNum++, newLineNum: newLineNum++ });
    oldIdx++;
    newIdx++;
  }

  // Remaining old lines are removals
  while (oldIdx < oldLines.length) {
    lines.push({ type: 'remove', content: oldLines[oldIdx], oldLineNum: oldLineNum++ });
    oldIdx++;
  }
  // Remaining new lines are additions
  while (newIdx < newLines.length) {
    lines.push({ type: 'add', content: newLines[newIdx], newLineNum: newLineNum++ });
    newIdx++;
  }

  return lines;
};

interface LCSMatch {
  oldIndex: number;
  newIndex: number;
}

function computeLCS(oldLines: string[], newLines: string[]): LCSMatch[] {
  const m = oldLines.length;
  const n = newLines.length;
  
  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matches
  const matches: LCSMatch[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      matches.push({ oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matches.reverse();
}

/**
 * Compute file-level diff between two file snapshots
 */
export const computeFileDiffs = (
  oldFiles: Record<string, string>, 
  newFiles: Record<string, string>
): FileDiff[] => {
  const diffs: FileDiff[] = [];
  const allFiles = new Set([...Object.keys(oldFiles), ...Object.keys(newFiles)]);

  allFiles.forEach(filename => {
    const oldContent = oldFiles[filename] || '';
    const newContent = newFiles[filename] || '';

    if (oldContent !== newContent) {
      const lines = computeDiff(oldContent, newContent);
      diffs.push({
        filename,
        oldContent,
        newContent,
        lines,
        additions: lines.filter(l => l.type === 'add').length,
        deletions: lines.filter(l => l.type === 'remove').length,
      });
    }
  });

  return diffs;
};

/**
 * Get file status relative to HEAD commit
 */
export type FileStatus = 'modified' | 'added' | 'deleted' | 'conflict' | 'unmodified';

export const getFileStatus = (
  filename: string,
  workingDir: Record<string, string>,
  headFiles: Record<string, string>,
  stagedFiles: Record<string, string | null>,
  conflictFiles?: Record<string, unknown>
): FileStatus => {
  if (conflictFiles && conflictFiles[filename]) return 'conflict';
  
  const inHead = filename in headFiles;
  const inWorking = filename in workingDir;
  const isStaged = filename in stagedFiles;

  if (!inHead && (inWorking || isStaged)) return 'added';
  if (inHead && !inWorking && stagedFiles[filename] === null) return 'deleted';
  if (inHead && inWorking && workingDir[filename] !== headFiles[filename]) return 'modified';
  if (isStaged && stagedFiles[filename] !== headFiles[filename]) return 'modified';
  
  return 'unmodified';
};
