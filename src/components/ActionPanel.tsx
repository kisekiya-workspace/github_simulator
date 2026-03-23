import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import useGitStore from '../store/gitStore';
import { GitBranch, GitMerge, GitCommit, GitPullRequest, RotateCcw, Tag, Archive } from 'lucide-react';

export const ActionPanel: FC = () => {
  const { 
    head, branches, conflictState, stash,
    commit, createBranch, checkout, merge, rebase,
    resolveConflict, abortMerge, resetAll,
    stashChanges, stashPop, createTag,
    stageAllFiles
  } = useGitStore();

  const [message, setMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [tagName, setTagName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCommit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      commit(message.trim());
      setMessage('');
    }
  };

  const currentBranchName = branches[head] ? head : head;
  const otherBranches = Object.keys(branches).filter(b => b !== currentBranchName);

  if (conflictState) {
    return (
      <div className="bg-[#1a0c0c] border-t border-red-500/20 p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <GitMerge size={20} className="text-red-500" />
            <div>
              <h3 className="text-red-500 font-bold text-sm tracking-tight">Merge Conflict</h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                <span className="text-zinc-300">{conflictState.sourceBranch}</span> into <span className="text-zinc-300">{conflictState.targetBranch}</span>
                {' · '} {Object.keys(conflictState.files).length} files pending resolution
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                Object.keys(conflictState.files).forEach(f => {
                  const wd = useGitStore.getState().workingDirectory;
                  resolveConflict(f, wd[f]);
                });
                const resolvedState = useGitStore.getState();
                resolvedState.completeMerge(`Merge branch '${conflictState.sourceBranch}' into ${conflictState.targetBranch}`);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Resolve & Commit
            </button>
            <button 
              onClick={abortMerge}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-bold border border-white/5 transition-all"
            >
              Abort
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#050505] border-t border-white/5 p-4 shrink-0">
      <div className="max-w-7xl mx-auto flex gap-8 overflow-x-auto items-stretch pb-2 no-scrollbar">
        {/* Commit */}
        <form onSubmit={handleCommit} className="flex flex-col gap-2 min-w-[240px]">
          <h3 className="text-[10px] font-mono font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-[0.2em]">
            <GitCommit size={14} /> Commit
          </h3>
          <div className="flex gap-2">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 bg-[#111111] border border-white/5 p-2 px-3 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:border-white/20 outline-none transition-all min-w-0"
            />
            <button type="submit" className="bg-white text-black hover:bg-zinc-200 px-4 rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0">
              Commit
            </button>
          </div>
          <button
            type="button"
            onClick={() => { stageAllFiles(); }}
            className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors text-left uppercase tracking-wider"
          >
            Stage all changes
          </button>
        </form>

        <div className="w-px bg-white/5 self-stretch my-2" />

        {/* Branch */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          <h3 className="text-[10px] font-mono font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-[0.2em]">
            <GitBranch size={14} /> Branch
          </h3>
          <div className="flex gap-2">
            <input 
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="New branch..."
              className="flex-1 bg-[#111111] border border-white/5 p-2 px-3 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:border-white/20 outline-none transition-all min-w-0"
            />
            <button 
              onClick={() => { if(branchName) { createBranch(branchName); setBranchName(''); } }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0"
            >
              Create
            </button>
          </div>
          <select 
            value={currentBranchName}
            onChange={(e) => checkout(e.target.value)}
            className="bg-[#111111] border border-white/5 p-2 px-3 rounded-lg text-xs text-white outline-none cursor-pointer hover:border-white/10 focus:border-white/20"
          >
            {Object.keys(branches).map(b => (
              <option key={b} value={b}>{b} {b === currentBranchName ? '← HEAD' : ''}</option>
            ))}
          </select>
        </div>

        <div className="w-px bg-white/5 self-stretch my-2" />

        {/* Merge / Rebase */}
        <div className="flex flex-col gap-2 min-w-[260px]">
          <h3 className="text-[10px] font-mono font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-[0.2em]">
            <GitPullRequest size={14} /> Merge & Rebase
          </h3>
          <div className="flex gap-2">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="flex-1 bg-[#111111] border border-white/5 p-2 px-3 rounded-lg text-xs text-white outline-none cursor-pointer hover:border-white/10 focus:border-white/20 min-w-0"
            >
              <option value="" disabled>Select branch...</option>
              {otherBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button 
              onClick={() => selectedBranch && merge(selectedBranch)}
              disabled={!selectedBranch}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-xs font-bold disabled:opacity-20 transition-all active:scale-95 shrink-0"
            >
              Merge
            </button>
            <button 
              onClick={() => selectedBranch && rebase(selectedBranch)}
              disabled={!selectedBranch}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-lg text-xs font-bold disabled:opacity-20 transition-all active:scale-95 shrink-0"
            >
              Rebase
            </button>
          </div>
        </div>

        <div className="w-px bg-white/5 self-stretch my-2" />

        {/* Advanced: Stash / Tag */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-mono font-bold text-zinc-500 flex items-center gap-2 uppercase tracking-[0.2em] hover:text-zinc-300 transition-colors"
          >
            <Archive size={14} /> {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
          {showAdvanced && (
            <div className="flex flex-col gap-2 animate-slide-up">
              <div className="flex gap-2">
                <button 
                  onClick={() => stashChanges()}
                  className="flex-1 bg-[#111111] hover:bg-[#18181b] text-zinc-300 px-3 py-2 rounded-lg text-xs font-bold border border-white/5 transition-all active:scale-95"
                >
                  Stash {stash.length > 0 && `(${stash.length})`}
                </button>
                <button 
                  onClick={stashPop}
                  disabled={stash.length === 0}
                  className="flex-1 bg-[#111111] hover:bg-[#18181b] text-zinc-300 px-3 py-2 rounded-lg text-xs font-bold border border-white/5 disabled:opacity-20 transition-all active:scale-95"
                >
                  Pop
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="v1.0.0"
                  className="flex-1 bg-[#111111] border border-white/5 p-2 px-3 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:border-white/20 outline-none transition-all min-w-0"
                />
                <button 
                  onClick={() => { if (tagName) { createTag(tagName); setTagName(''); } }}
                  className="bg-amber-600/80 hover:bg-amber-600 text-white px-3 rounded-lg text-xs font-bold transition-all active:scale-95 shrink-0"
                >
                  <Tag size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="flex-1 flex justify-end items-center">
          <button 
            onClick={() => {
              if (confirm('Reset repository? All history will be lost.')) {
                resetAll();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg text-xs font-bold border border-white/5 hover:border-red-500/20 transition-all active:scale-95"
          >
            <RotateCcw size={14} /> Reset Repo
          </button>
        </div>
      </div>
    </div>
  );
};
