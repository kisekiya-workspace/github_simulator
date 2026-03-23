import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import useGitStore from '../store/gitStore';
import { GitBranch, GitMerge, GitCommit, GitPullRequest, RotateCcw, Tag, Archive } from 'lucide-react';

export const ActionPanel: FC = () => {
  const { 
    head, branches, conflictState, tags, stash,
    commit, createBranch, checkout, merge, rebase,
    resolveConflict, abortMerge, resetAll,
    stashChanges, stashPop, createTag,
    stageAllFiles, completeMerge
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
      <div className="bg-red-950/20 border-t border-red-900/50 p-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitMerge size={18} className="text-red-400" />
            <div>
              <h3 className="text-red-400 font-bold text-sm">Merge Conflict</h3>
              <p className="text-xs text-slate-400">
                <strong>{conflictState.sourceBranch}</strong> → <strong>{conflictState.targetBranch}</strong>
                {' · '}Conflicting: {Object.keys(conflictState.files).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                Object.keys(conflictState.files).forEach(f => {
                  const wd = useGitStore.getState().workingDirectory;
                  resolveConflict(f, wd[f]);
                });
                const resolvedState = useGitStore.getState();
                resolvedState.completeMerge(`Merge branch '${conflictState.sourceBranch}' into ${conflictState.targetBranch}`);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors"
            >
              Resolve & Commit
            </button>
            <button 
              onClick={abortMerge}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
            >
              Abort
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border-t border-slate-700/50 p-3 shrink-0">
      <div className="flex gap-4 overflow-x-auto items-stretch">
        {/* Commit */}
        <form onSubmit={handleCommit} className="flex flex-col gap-1.5 min-w-[220px]">
          <h3 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <GitCommit size={12} /> Commit
          </h3>
          <div className="flex gap-1.5">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white focus:border-blue-500 outline-none min-w-0"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded text-xs font-semibold transition-colors shrink-0">
              Commit
            </button>
          </div>
          <button
            type="button"
            onClick={() => { stageAllFiles(); }}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors text-left"
          >
            Stage all changes
          </button>
        </form>

        <div className="w-px bg-slate-700/50 self-stretch" />

        {/* Branch */}
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <h3 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <GitBranch size={12} /> Branch
          </h3>
          <div className="flex gap-1.5">
            <input 
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="New branch..."
              className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white focus:border-blue-500 outline-none min-w-0"
            />
            <button 
              onClick={() => { if(branchName) { createBranch(branchName); setBranchName(''); } }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded text-xs font-semibold transition-colors shrink-0"
            >
              Create
            </button>
          </div>
          <select 
            value={currentBranchName}
            onChange={(e) => checkout(e.target.value)}
            className="bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white outline-none"
          >
            {Object.keys(branches).map(b => (
              <option key={b} value={b}>{b} {b === currentBranchName ? '← HEAD' : ''}</option>
            ))}
          </select>
        </div>

        <div className="w-px bg-slate-700/50 self-stretch" />

        {/* Merge / Rebase */}
        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <h3 className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <GitPullRequest size={12} /> Merge & Rebase
          </h3>
          <div className="flex gap-1.5">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white outline-none min-w-0"
            >
              <option value="" disabled>Select branch...</option>
              {otherBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button 
              onClick={() => selectedBranch && merge(selectedBranch)}
              disabled={!selectedBranch}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 rounded text-xs font-semibold disabled:opacity-40 transition-colors shrink-0"
            >
              Merge
            </button>
            <button 
              onClick={() => selectedBranch && rebase(selectedBranch)}
              disabled={!selectedBranch}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 rounded text-xs font-semibold disabled:opacity-40 transition-colors shrink-0"
            >
              Rebase
            </button>
          </div>
        </div>

        <div className="w-px bg-slate-700/50 self-stretch" />

        {/* Advanced: Stash / Tag */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <Archive size={12} /> Stash & Tags {showAdvanced ? '▼' : '▶'}
          </button>
          {showAdvanced && (
            <>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => stashChanges()}
                  className="flex-1 bg-cyan-600/80 hover:bg-cyan-500 text-white px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                >
                  Stash {stash.length > 0 && `(${stash.length})`}
                </button>
                <button 
                  onClick={stashPop}
                  disabled={stash.length === 0}
                  className="flex-1 bg-cyan-700/60 hover:bg-cyan-600 text-white px-2 py-1.5 rounded text-xs disabled:opacity-40 transition-colors"
                >
                  Pop
                </button>
              </div>
              <div className="flex gap-1.5">
                <input 
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="flex-1 bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-white focus:border-amber-500 outline-none min-w-0"
                />
                <button 
                  onClick={() => { if (tagName) { createTag(tagName); setTagName(''); } }}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 rounded text-xs font-semibold transition-colors shrink-0"
                >
                  <Tag size={12} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Reset */}
        <div className="flex-1 flex justify-end items-start">
          <button 
            onClick={() => {
              if (confirm('Reset repository? All history will be lost.')) {
                resetAll();
              }
            }}
            className="flex items-center gap-1.5 p-1.5 px-3 border border-red-900/50 text-red-400 hover:bg-red-900/20 rounded text-xs transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};
