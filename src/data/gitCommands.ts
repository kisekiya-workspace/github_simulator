export interface CommandDocumentation {
  id: string;
  name: string;
  description: string;
  usage: string;
  examples: string[];
  category: 'core' | 'branching' | 'advanced' | 'undo';
  situations: string[];
  troubleshooting: { question: string; answer: string }[];
}

export interface GitProblem {
  id: string;
  title: string;
  situation: string;
  solution: string;
  commands: string[];
}

export const GIT_COMMANDS: CommandDocumentation[] = [
  {
    id: 'init',
    name: 'init',
    category: 'core',
    description: 'Initializes a new, empty Git repository. Creates an initial commit on the "main" branch with a default README.md file.',
    usage: 'git init',
    examples: ['git init'],
    situations: [
      'You just started a new project and want to track its history.',
      'You have an existing folder of code that isn\'t yet a Git repository.',
      'You want to reset a project\'s Git history and start from scratch.'
    ],
    troubleshooting: [
      {
        question: 'What if I already have a .git folder?',
        answer: 'Running git init again is safe. it will not overwrite existing history unless you delete the .git folder manually.'
      }
    ]
  },
  {
    id: 'status',
    name: 'status',
    category: 'core',
    description: 'Displays the state of the working directory and the staging area.',
    usage: 'git status',
    examples: ['git status'],
    situations: [
      'You took a break and forgot which files you modified.',
      'You want to check if your changes are staged (green) or unstaged (red).',
      'You are about to commit and want to verify what will be included.'
    ],
    troubleshooting: [
      {
        question: 'Why are some files not appearing?',
        answer: 'Check your .gitignore file. Files matching patterns there are excluded from git status.'
      }
    ]
  },
  {
    id: 'add',
    name: 'add',
    category: 'core',
    description: 'Adds changes in the working directory to the staging area.',
    usage: 'git add <file> | git add .',
    examples: ['git add README.md', 'git add .', 'git add -A'],
    situations: [
      'You finished a logical unit of work and want to prepare it for a commit.',
      'You created a new file and need Git to start tracking it.',
      'You want to selectively pick which changes go into the next snapshot.'
    ],
    troubleshooting: [
      {
        question: 'How do I un-stage a file?',
        answer: 'Use "git reset <file>" to remove it from the staging area without losing your local changes.'
      }
    ]
  },
  {
    id: 'commit',
    name: 'commit',
    category: 'core',
    description: 'Saves your staged changes to the repository history.',
    usage: 'git commit -m "<message>"',
    examples: ['git commit -m "Initial feature"', 'git commit -m "Fix: resolve issue #12"'],
    situations: [
      'You\'ve reached a stable point or "save point" in your development.',
      'You\'ve fixed a bug and want to record the solution permanently.',
      'You want to "checkpoint" your progress before trying something risky.'
    ],
    troubleshooting: [
      {
        question: 'I made a typo in my commit message!',
        answer: 'Use "git commit --amend -m \'New message\'" to fix the last commit message.'
      },
      {
        question: 'I forgot to add a file to the commit!',
        answer: 'Stage the file with "git add <file>" and then run "git commit --amend --no-edit".'
      }
    ]
  },
  {
    id: 'branch',
    name: 'branch',
    category: 'branching',
    description: 'Lists, creates, or deletes branches.',
    usage: 'git branch [<name>] [-d <name>]',
    examples: ['git branch', 'git branch feature-x', 'git branch -d old-feature'],
    situations: [
      'You want to start working on a new feature without breaking the main code.',
      'You need to fix a bug in production while working on a long-term feature.',
      'You want to experiment with a new library safely.'
    ],
    troubleshooting: [
      {
        question: 'How do I rename a branch?',
        answer: 'Use "git branch -m <old-name> <new-name>".'
      }
    ]
  },
  {
    id: 'checkout',
    name: 'checkout',
    category: 'branching',
    description: 'Switches between branches or restores working tree files.',
    usage: 'git checkout <target> | git checkout -b <name>',
    examples: ['git checkout main', 'git checkout -b feature-y', 'git checkout a1b2c3d'],
    situations: [
      'You want to switch from your current feature back to "main".',
      'You want to create a new branch and switch to it immediately (-b).',
      'You want to view the state of the project at a specific past commit.'
    ],
    troubleshooting: [
      {
        question: 'Git won\'t let me switch branches!',
        answer: 'You likely have uncommitted changes that would be overwritten. Either commit them, stash them, or discard them.'
      }
    ]
  },
  {
    id: 'merge',
    name: 'merge',
    category: 'branching',
    description: 'Joins two or more development histories together.',
    usage: 'git merge <branch>',
    examples: ['git merge feature-x'],
    situations: [
      'Your feature is complete and you want to bring it into the "main" branch.',
      'You want to update your current branch with the latest changes from "main".'
    ],
    troubleshooting: [
      {
        question: 'Help! Merge conflicts occurred!',
        answer: 'Open the conflicted files, look for "<<<<<<", "======", and ">>>>>>", choose the correct code, and then run "git add" and "git commit".'
      }
    ]
  },
  {
    id: 'reset',
    name: 'reset',
    category: 'undo',
    description: 'Resets current HEAD to the specified state.',
    usage: 'git reset [--soft | --hard] [<commit-id>]',
    examples: ['git reset --soft HEAD~1', 'git reset --hard a1b2c3d'],
    situations: [
      'You committed something by mistake and want to "undo" the commit but keep the files (--soft).',
      'Everything is a mess and you want to go back to the last clean state (--hard).',
      'You want to discard all local changes and match the latest commit exactly.'
    ],
    troubleshooting: [
      {
        question: 'I accidentally did a --hard reset and lost my work!',
        answer: 'This is difficult to undo. Direct "git reset --hard" discards uncommitted changes permanently. If the work was committed, you might find it using "git reflog".'
      }
    ]
  },
  {
    id: 'stash',
    name: 'stash',
    category: 'advanced',
    description: 'Temporarily shelves (or stashes) changes you\'ve made to your working copy.',
    usage: 'git stash [push] | git stash pop | git stash list',
    examples: ['git stash', 'git stash push -m "unfinished work"', 'git stash pop'],
    situations: [
      'You\'re mid-feature but need to switch branches to fix an urgent bug.',
      'You want to pull the latest changes but have local conflicts.',
      'You want to "clean" your workspace without losing your current progress.'
    ],
    troubleshooting: [
      {
        question: 'How do I see what\'s in my stash?',
        answer: 'Use "git stash list" to see the stack, and "git stash show -p stash@{0}" to see the actual code changes.'
      }
    ]
  }
];

export const GIT_PROBLEMS: GitProblem[] = [
  {
    id: 'identity',
    title: 'Change Author Name/Email',
    situation: 'Your commits are showing the wrong name or an old email address.',
    solution: 'Update your global configuration. This will affect all future repositories.',
    commands: [
      'git config --global user.name "Your Name"',
      'git config --global user.email "your@email.com"'
    ]
  },
  {
    id: 'panic-reset',
    title: 'Panic: Rollback EVERYTHING',
    situation: 'Your working directory is a mess, you have conflicts everywhere, and you just want to go back to exactly how it was at the last commit.',
    solution: 'Use a hard reset to the HEAD. WARNING: This will discard all uncommitted changes forever.',
    commands: [
      'git reset --hard HEAD'
    ]
  },
  {
    id: 'wrong-branch',
    title: 'Committed to wrong branch',
    situation: 'You just made a commit but realized you should have been on a different branch.',
    solution: 'Undo the commit on the current branch (keeping changes), switch to the right branch, and commit there.',
    commands: [
      'git reset --soft HEAD~1',
      'git checkout <correct-branch>',
      'git commit -m "your message"'
    ]
  },
  {
    id: 'amend-message',
    title: 'Change last commit name',
    situation: 'You just committed something but noticed a typo in the message or forgot a small change.',
    solution: 'Use the amend flag to rewrite the most recent commit.',
    commands: [
      'git commit --amend -m "Corrected commit message"'
    ]
  },
  {
    id: 'undo-last',
    title: 'Undo last commit (keep work)',
    situation: 'You committed too early and want to add more changes to the same commit.',
    solution: 'Soft reset back one commit. Your changes will still be in the staging area.',
    commands: [
      'git reset --soft HEAD~1'
    ]
  }
];
