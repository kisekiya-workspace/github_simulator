import { useState, useEffect, useMemo, useRef } from 'react';
import type { FC } from 'react';
import useGitStore from '../store/gitStore';
import { getFileStatus, type FileStatus } from '../store/utils';
import { FileCode, FilePlus, Trash2, Save, X, Circle } from 'lucide-react';

// ── Status Badge ─────────────────────────────────────────────
const statusConfig: Record<FileStatus, { label: string; color: string; letter: string }> = {
  modified: { label: 'Modified', color: 'text-amber-400', letter: 'M' },
  added: { label: 'New File', color: 'text-emerald-400', letter: 'A' },
  deleted: { label: 'Deleted', color: 'text-red-400', letter: 'D' },
  conflict: { label: 'Conflict', color: 'text-red-500', letter: 'C' },
  unmodified: { label: '', color: 'text-slate-500', letter: '' },
};

const FileStatusBadge: FC<{ status: FileStatus }> = ({ status }) => {
  const config = statusConfig[status];
  if (status === 'unmodified') return null;
  return (
    <span className={`text-[10px] font-bold ${config.color} px-1 rounded`} title={config.label}>
      {config.letter}
    </span>
  );
};

// ── File Explorer ────────────────────────────────────────────
export const FileExplorer: FC<{ 
  openFiles: string[];
  activeFile: string | null;
  setActiveFile: (f: string | null) => void;
  onOpenFile: (f: string) => void;
  onCloseFile: (f: string) => void;
}> = ({ activeFile, setActiveFile, onOpenFile, onCloseFile }) => {
  const { workingDirectory, stagedFiles, saveFile, deleteFile, conflictState, commits, branches, head } = useGitStore();
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const files = Object.keys(workingDirectory).sort();
  const headCommit = branches[head] ? commits[branches[head]] : commits[head];
  const headFiles = headCommit?.files || {};

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      saveFile(newFileName.trim(), '');
      onOpenFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-400 border-r border-white/5">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#050505]">
        <h2 className="font-bold text-white text-[11px] uppercase tracking-[0.2em] px-1">Explorer</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
          title="New File"
        >
          <FilePlus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="p-3 flex gap-2 border-b border-white/5 bg-[#111111]">
            <input
              autoFocus
              className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs w-full text-white outline-none focus:border-white/40 transition-all"
              placeholder="filename.ext"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              onBlur={() => { if (!newFileName) setIsCreating(false); }}
            />
          </div>
        )}

        <ul className="py-1">
          {files.length === 0 && <li className="text-slate-500 text-xs italic p-3">Empty directory</li>}
          {files.map(file => {
            const status = getFileStatus(file, workingDirectory, headFiles, stagedFiles, conflictState?.files);
            const isActive = activeFile === file;
            const isStaged = file in stagedFiles;

            return (
              <li 
                key={file}
                className={`flex items-center justify-between px-4 py-2 cursor-pointer group text-xs transition-all ${
                  isActive ? 'bg-white/5 text-white border-l-2 border-blue-500' : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                }`}
                onClick={() => { setActiveFile(file); onOpenFile(file); }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode size={14} className={status === 'conflict' ? 'text-red-400' : 'text-blue-400'} />
                  <span className="truncate">{file}</span>
                  {isStaged && <Circle size={6} className="fill-emerald-500 text-emerald-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1">
                  <FileStatusBadge status={status} />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file);
                      onCloseFile(file);
                      if (activeFile === file) setActiveFile(null);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Staging area summary */}
      <div className="border-t border-white/5 p-4 bg-[#050505]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-3 px-1">Staged</div>
        {Object.keys(stagedFiles).length === 0 ? (
          <p className="text-[11px] text-zinc-700 italic px-1">No files staged</p>
        ) : (
          <div className="space-y-1.5 px-1">
            {Object.keys(stagedFiles).map(f => (
              <div key={f} className="text-xs text-emerald-500 flex items-center gap-2 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {f}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Code Editor with Tabs + Line Numbers ─────────────────────
export const CodeEditor: FC<{
  activeFile: string | null;
  openFiles: string[];
  setActiveFile: (f: string | null) => void;
  onCloseFile: (f: string) => void;
}> = ({ activeFile, openFiles, setActiveFile, onCloseFile }) => {
  const { workingDirectory, saveFile, conflictState, stagedFiles, commits, branches, head } = useGitStore();
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const headCommit = branches[head] ? commits[branches[head]] : commits[head];
  const headFiles = headCommit?.files || {};

  useEffect(() => {
    if (activeFile) {
      if (workingDirectory[activeFile] === undefined) {
        onCloseFile(activeFile);
        setActiveFile(null);
      } else {
        setContent(workingDirectory[activeFile] || '');
        setIsDirty(false);
      }
    }
  }, [activeFile, workingDirectory, onCloseFile, setActiveFile]);

  const handleSave = () => {
    if (activeFile) {
      saveFile(activeFile, content);
      setIsDirty(false);
    }
  };

  const lineCount = useMemo(() => content.split('\n').length, [content]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (openFiles.length === 0 || !activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] text-zinc-600 flex-col gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <FileCode size={32} className="text-zinc-800" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-400 tracking-tight">Select a file to edit</p>
          <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest mt-2 px-2 py-0.5 border border-white/5 rounded">Ctrl + S to save</p>
        </div>
      </div>
    );
  }

  const isConflict = conflictState?.files[activeFile];

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-w-0 h-full overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-white/5 bg-[#0a0a0a] overflow-x-auto shrink-0 no-scrollbar">
        {openFiles.map(file => {
          const isActive = file === activeFile;
          const status = getFileStatus(file, workingDirectory, headFiles, stagedFiles, conflictState?.files);
          return (
            <div
              key={file}
              className={`flex items-center gap-3 px-4 py-3 text-xs cursor-pointer border-r border-white/5 min-w-0 shrink-0 transition-all ${
                isActive 
                  ? 'bg-[#050505] text-white border-t-2 border-t-blue-500' 
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-t-2 border-t-transparent'
              }`}
              onClick={() => setActiveFile(file)}
            >
              <FileCode size={12} className={status === 'conflict' ? 'text-red-400' : 'text-blue-400'} />
              <span className="truncate max-w-[120px]">{file}</span>
              <FileStatusBadge status={status} />
              <button
                className="ml-2 p-1 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-white transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file);
                  if (file === activeFile) {
                    const remaining = openFiles.filter(f => f !== file);
                    setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
                  }
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">{activeFile}</span>
          {isConflict && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded border border-red-500/20 uppercase tracking-tighter">Conflict</span>}
          {isDirty && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Unsaved changes" />}
          <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">{lineCount} lines</span>
        </div>
        <button 
          onClick={handleSave}
          disabled={!isDirty}
          className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 disabled:bg-white/5 disabled:text-zinc-600 rounded-lg text-xs font-bold transition-all active:scale-95"
        >
          <Save size={14} /> Save
        </button>
      </div>

      {/* Editor body with line numbers */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="bg-[#050505] text-zinc-700 text-[11px] font-mono p-4 pr-3 text-right select-none overflow-y-auto border-r border-white/5 shrink-0 w-14 no-scrollbar"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-relaxed h-[1.625rem]">{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
          onScroll={syncScroll}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              handleSave();
            }
            // Tab indentation
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newContent = content.substring(0, start) + '  ' + content.substring(end);
              setContent(newContent);
              setIsDirty(true);
              setTimeout(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
              });
            }
          }}
          spellCheck={false}
          className="flex-1 bg-[#050505] text-zinc-300 font-mono text-[13px] p-4 outline-none resize-none leading-relaxed overflow-auto selection:bg-white/10"
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};
