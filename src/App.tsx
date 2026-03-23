import { useState, useCallback } from 'react';
import useGitStore from './store/gitStore';
import { FileExplorer, CodeEditor } from './components/Editor';
import { ActionPanel } from './components/ActionPanel';
import { GitGraph } from './components/GitGraph';
import { LessonsPanel } from './components/LessonsPanel';
import { Home } from './components/Home';
import { Terminal } from './components/Terminal';
import { ToastContainer, useKeyboardShortcuts } from './components/Toast';
import { OnboardingTour, useShouldShowTour } from './components/Onboarding';
import { GitBranch, Home as HomeIcon, PanelLeftClose, PanelLeftOpen, TerminalSquare } from 'lucide-react';

function App() {
  const { commits, head, branches, detachedHead } = useGitStore();
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'playground'>('home');
  const [isLessonsOpen, setIsLessonsOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [showTour, setShowTour] = useState(false);
  const shouldShowTour = useShouldShowTour();

  const handleOpenFile = useCallback((f: string) => {
    setOpenFiles(prev => prev.includes(f) ? prev : [...prev, f]);
    setActiveFile(f);
  }, []);

  const handleCloseFile = useCallback((f: string) => {
    setOpenFiles(prev => prev.filter(x => x !== f));
    if (activeFile === f) {
      const remaining = openFiles.filter(x => x !== f);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  }, [activeFile, openFiles]);

  useKeyboardShortcuts({
    onToggleTerminal: () => setIsTerminalOpen(prev => !prev),
    onSave: () => {
      if (activeFile) {
        const store = useGitStore.getState();
        const content = store.workingDirectory[activeFile];
        if (content !== undefined) store.saveFile(activeFile, content);
      }
    },
  });

  if (view === 'home') {
    return (
      <>
        <Home onOpenPlayground={() => { setView('playground'); if (shouldShowTour) setShowTour(true); }} />
        <ToastContainer />
      </>
    );
  }

  if (Object.keys(commits).length === 0) {
    return <div className="h-screen w-screen bg-slate-950 items-center justify-center flex text-white">Loading...</div>;
  }

  const currentBranch = branches[head] ? head : head.substring(0, 7);
  const headCommitId = branches[head] || head;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-300 overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="h-10 border-b border-slate-800/50 flex items-center px-4 shrink-0 bg-slate-950 justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded"
            title="Back to Home"
          >
            <HomeIcon size={16} />
          </button>
          <div className="w-px h-5 bg-slate-800" />
          <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
            <GitBranch className="text-blue-500" size={16} />
            Git Sandbox
          </div>
          <button 
            onClick={() => setIsLessonsOpen(!isLessonsOpen)}
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            title={isLessonsOpen ? 'Hide lessons' : 'Show lessons'}
          >
            {isLessonsOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} className="text-emerald-400" />
            <span className="text-slate-400">{currentBranch}</span>
          </div>
          {detachedHead && (
            <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded text-[10px] border border-amber-800/40">
              DETACHED
            </span>
          )}
          <span className="text-slate-600 text-[10px] font-mono">{headCommitId.substring(0, 7)}</span>
          <div className="w-px h-4 bg-slate-800" />
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`p-1 rounded transition-colors ${isTerminalOpen ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
            title="Toggle Terminal (Ctrl+`)"
          >
            <TerminalSquare size={14} />
          </button>
          <span className="text-slate-700 text-[10px]">Ctrl+` terminal</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Lessons Panel */}
        <div className={`transition-all duration-300 overflow-hidden flex shrink-0 ${isLessonsOpen ? 'w-64' : 'w-0'}`}>
          <div className="w-64 shrink-0 h-full border-r border-slate-700/50">
            <LessonsPanel />
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Top: Editor + Graph */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* File Explorer */}
            <div className="w-44 shrink-0 overflow-hidden">
              <FileExplorer
                openFiles={openFiles}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                onOpenFile={handleOpenFile}
                onCloseFile={handleCloseFile}
              />
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-w-[280px] border-r border-slate-800/50 overflow-hidden">
              <CodeEditor
                activeFile={activeFile}
                openFiles={openFiles}
                setActiveFile={setActiveFile}
                onCloseFile={handleCloseFile}
              />
            </div>

            {/* Git Graph */}
            <div className="w-[40%] min-w-[300px] overflow-hidden">
              <GitGraph />
            </div>
          </div>

          {/* Terminal Panel */}
          {isTerminalOpen && (
            <div 
              className="border-t border-slate-700/50 shrink-0"
              style={{ height: terminalHeight }}
            >
              {/* Terminal resize handle */}
              <div
                className="h-1 bg-slate-800 cursor-row-resize hover:bg-blue-600/30 transition-colors group flex items-center justify-center"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startHeight = terminalHeight;
                  const onMove = (ev: MouseEvent) => {
                    const delta = startY - ev.clientY;
                    setTerminalHeight(Math.max(100, Math.min(500, startHeight + delta)));
                  };
                  const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
              >
                <div className="w-8 h-0.5 bg-slate-600 rounded group-hover:bg-blue-400 transition-colors" />
              </div>
              <div className="h-[calc(100%-4px)]">
                <Terminal />
              </div>
            </div>
          )}

          {/* Action Panel */}
          <ActionPanel />
        </div>
      </div>

      {/* Onboarding Tour */}
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default App;
