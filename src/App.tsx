import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import useGitStore from './store/gitStore';
import { FileExplorer, CodeEditor } from './components/Editor';
import { ActionPanel } from './components/ActionPanel';
import { GitGraph } from './components/GitGraph';
import { LessonsPanel } from './components/LessonsPanel';
import { Home } from './components/Home';
import { Terminal } from './components/Terminal';
import { Documentation } from './components/Documentation';
import { ToastContainer, useKeyboardShortcuts } from './components/Toast';
import { OnboardingTour, useShouldShowTour } from './components/Onboarding';
import { BookOpen, GitBranch, Home as HomeIcon, PanelLeftClose, PanelLeftOpen, TerminalSquare } from 'lucide-react';

function App() {
  const { commits, head, branches, detachedHead } = useGitStore();
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'playground' | 'documentation'>('home');
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
        <Home 
          onOpenPlayground={() => { setView('playground'); if (shouldShowTour) setShowTour(true); }} 
          onOpenDocs={() => setView('documentation')}
        />
        <ToastContainer />
      </>
    );
  }

  if (view === 'documentation') {
    return (
      <>
        <Documentation 
          onBack={() => setView('home')} 
          onPlay={() => { setView('playground'); if (shouldShowTour) setShowTour(true); }} 
        />
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
    <div className="h-screen w-screen bg-[#050505] text-zinc-400 overflow-hidden flex flex-col font-sans selection:bg-white/10 selection:text-white">
      {/* Header */}
      <header id="app-header" className="h-12 border-b border-white/5 flex items-center px-6 shrink-0 bg-[#050505] justify-between z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all p-1.5 hover:bg-white/5 rounded-lg"
            title="Back to Home"
          >
            <HomeIcon size={18} />
          </button>
          <div className="w-px h-4 bg-white/5" />
          <div className="flex items-center gap-2 text-white font-black text-sm tracking-tighter uppercase px-1">
            <GitBranch className="text-blue-500" size={16} />
            Git Sandbox
          </div>
          <button 
            onClick={() => setIsLessonsOpen(!isLessonsOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all ml-2"
            title={isLessonsOpen ? 'Hide lessons' : 'Show lessons'}
          >
            {isLessonsOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-6 text-[11px] font-medium font-mono">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-lg group-hover:border-emerald-500/30 transition-all">
              <svg width="24" height="12" viewBox="0 0 24 12" className="text-emerald-500/50">
                <motion.path
                  d="M 2 6 L 22 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 8"
                  animate={{ strokeDashoffset: [0, -12] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <circle cx="4" cy="6" r="2" fill="currentColor" className="text-emerald-500" />
              </svg>
              <span className="text-zinc-300 uppercase tracking-widest font-bold">{currentBranch}</span>
            </div>
          </div>
          {detachedHead && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold border border-amber-500/20 text-[10px] tracking-widest">
              DETACHED
            </span>
          )}
          <span className="text-zinc-700 uppercase tracking-widest">{headCommitId.substring(0, 7)}</span>
          <div className="w-px h-4 bg-white/5" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('documentation')}
              className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition-all flex items-center gap-2"
            >
              <BookOpen size={12} />
              Docs
            </button>
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`p-1.5 rounded-lg transition-all ${isTerminalOpen ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
              title="Toggle Terminal (Ctrl+`)"
            >
              <TerminalSquare size={16} />
            </button>
            <span className="text-zinc-800 uppercase tracking-widest text-[9px]">Ctrl+` terminal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <div className={`transition-all duration-300 overflow-hidden flex shrink-0 ${isLessonsOpen ? 'w-64' : 'w-0'}`}>
          <div id="app-lessons" className="w-64 shrink-0 h-full border-r border-white/5 bg-[#050505]">
            <LessonsPanel />
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Top: Editor + Graph */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* File Explorer */}
            <div id="app-explorer" className="w-48 shrink-0 overflow-hidden">
              <FileExplorer
                openFiles={openFiles}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
                onOpenFile={handleOpenFile}
                onCloseFile={handleCloseFile}
              />
            </div>

            {/* Code Editor */}
            <div id="app-editor" className="flex-1 min-w-[280px] border-r border-white/5 overflow-hidden">
              <CodeEditor
                activeFile={activeFile}
                openFiles={openFiles}
                setActiveFile={setActiveFile}
                onCloseFile={handleCloseFile}
              />
            </div>

            {/* Git Graph */}
            <div id="app-graph" className="w-[40%] min-w-[300px] overflow-hidden">
              <GitGraph />
            </div>
          </div>

          {/* Terminal Panel */}
          {isTerminalOpen && (
            <div 
              id="app-terminal"
              className="border-t border-white/5 shrink-0 bg-[#050505]"
              style={{ height: terminalHeight }}
            >
              {/* Terminal resize handle */}
              <div
                className="h-1 bg-[#0a0a0a] cursor-row-resize hover:bg-blue-500/20 transition-all group flex items-center justify-center border-b border-white/5"
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
                <div className="w-12 h-1 bg-white/5 rounded-full group-hover:bg-blue-500/40 transition-all" />
              </div>
              <div className="h-[calc(100%-4px)]">
                <Terminal />
              </div>
            </div>
          )}

          {/* Action Panel */}
          <div id="app-actions">
            <ActionPanel />
          </div>
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
