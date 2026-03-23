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
    <div className="flex flex-col h-full bg-slate-800/50 text-slate-300 border-r border-slate-700/50">
      <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/80">
        <h2 className="font-semibold text-white text-sm">Explorer</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          title="New File"
        >
          <FilePlus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="p-2 flex gap-1 border-b border-slate-700/50">
            <input
              autoFocus
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs w-full outline-none focus:border-blue-500"
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
                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer group text-xs transition-colors ${
                  isActive ? 'bg-blue-600/20 text-white border-l-2 border-blue-500' : 'hover:bg-slate-700/30 border-l-2 border-transparent'
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
      <div className="border-t border-slate-700/50 p-3 bg-slate-900/50">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Staged</div>
        {Object.keys(stagedFiles).length === 0 ? (
          <p className="text-xs text-slate-600 italic">No files staged</p>
        ) : (
          <div className="space-y-0.5">
            {Object.keys(stagedFiles).map(f => (
              <div key={f} className="text-xs text-emerald-400 flex items-center gap-1">
                <Circle size={4} className="fill-emerald-400" />
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
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-600 flex-col gap-3">
        <FileCode size={48} className="text-slate-700" />
        <p className="text-sm">Select a file to edit</p>
        <p className="text-xs text-slate-700">Ctrl+S to save</p>
      </div>
    );
  }

  const isConflict = conflictState?.files[activeFile];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 min-w-0 h-full overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-slate-800 bg-slate-850 overflow-x-auto shrink-0">
        {openFiles.map(file => {
          const isActive = file === activeFile;
          const status = getFileStatus(file, workingDirectory, headFiles, stagedFiles, conflictState?.files);
          return (
            <div
              key={file}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-slate-800 min-w-0 shrink-0 transition-colors ${
                isActive 
                  ? 'bg-slate-900 text-white border-t-2 border-t-blue-500' 
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border-t-2 border-t-transparent'
              }`}
              onClick={() => setActiveFile(file)}
            >
              <FileCode size={12} className={status === 'conflict' ? 'text-red-400' : 'text-blue-400'} />
              <span className="truncate max-w-[120px]">{file}</span>
              <FileStatusBadge status={status} />
              <button
                className="ml-1 p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file);
                  if (file === activeFile) {
                    const remaining = openFiles.filter(f => f !== file);
                    setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
                  }
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{activeFile}</span>
          {isConflict && <span className="px-1.5 py-0.5 bg-red-900/50 text-red-400 text-[10px] rounded border border-red-800">CONFLICT</span>}
          {isDirty && <span className="w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />}
          <span className="text-[10px] text-slate-600">{lineCount} lines</span>
        </div>
        <button 
          onClick={handleSave}
          disabled={!isDirty}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-xs transition-colors"
        >
          <Save size={12} /> Save
        </button>
      </div>

      {/* Editor body with line numbers */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="bg-slate-900 text-slate-600 text-xs font-mono p-3 pr-2 text-right select-none overflow-y-auto border-r border-slate-800 shrink-0 w-12"
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
          className="flex-1 bg-slate-900 text-slate-200 font-mono text-xs p-3 outline-none resize-none leading-relaxed overflow-auto"
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};
