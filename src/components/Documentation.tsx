import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, GitBranch, Terminal, 
  Layers, ChevronRight, Home, Play, 
  Command, Cpu, Info, Sparkles, HelpCircle, Activity
} from 'lucide-react';
import { GIT_COMMANDS, GIT_PROBLEMS } from '../data/gitCommands';

interface DocumentationProps {
  onBack: () => void;
  onPlay: () => void;
}

export const Documentation = ({ onBack, onPlay }: DocumentationProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);

  const filteredCommands = useMemo(() => {
    return GIT_COMMANDS.filter(cmd => 
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const activeCommand = useMemo(() => {
    if (activeCommandId?.startsWith('prob-')) {
      return null;
    }
    return GIT_COMMANDS.find(cmd => cmd.id === activeCommandId) || filteredCommands[0];
  }, [activeCommandId, filteredCommands]);

  const activeProblem = useMemo(() => {
    if (activeCommandId?.startsWith('prob-')) {
      const id = activeCommandId.replace('prob-', '');
      return GIT_PROBLEMS.find(p => p.id === id);
    }
    return null;
  }, [activeCommandId]);

  const categories = [
    { id: 'core', label: 'Core Commands', icon: Cpu },
    { id: 'branching', label: 'Branching', icon: GitBranch },
    { id: 'advanced', label: 'Advanced Tools', icon: Layers },
    { id: 'undo', label: 'Undoing Changes', icon: Info },
  ] as const;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-400 font-sans selection:bg-white/10 selection:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-blue-500" />
            </div>
            <span className="font-black text-white text-sm tracking-tighter uppercase">Docs</span>
          </div>
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
          >
            <Home size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 px-6 border-b border-white/5">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-800"
            />
          </div>
        </div>

        {/* Categories & Commands */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {categories.map((category) => {
            const catCommands = filteredCommands.filter(c => c.category === category.id);
            if (catCommands.length === 0) return null;

            return (
              <div key={category.id} className="mb-8">
                <div className="flex items-center gap-2 px-3 mb-3">
                  <category.icon size={12} className="text-zinc-700" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{category.label}</span>
                </div>
                <div className="space-y-1">
                  {catCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => setActiveCommandId(cmd.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group ${
                        activeCommand?.id === cmd.id 
                          ? 'bg-blue-500/10 text-white shadow-sm ring-1 ring-blue-500/20' 
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${activeCommand?.id === cmd.id ? 'bg-blue-500' : 'bg-transparent group-hover:bg-zinc-700'}`} />
                        {cmd.name}
                      </div>
                      <ChevronRight size={14} className={`transition-all ${activeCommand?.id === cmd.id ? 'opacity-40 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {/* Common Problems Category */}
          <div className="mb-8">
            <div className="flex items-center gap-2 px-3 mb-3">
              <HelpCircle size={12} className="text-amber-500/50" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Common Issues</span>
            </div>
            <div className="space-y-1">
              {GIT_PROBLEMS.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => setActiveCommandId(`prob-${prob.id}`)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all group ${
                    activeCommandId === `prob-${prob.id}` 
                      ? 'bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors ${activeCommandId === `prob-${prob.id}` ? 'bg-amber-500' : 'bg-transparent group-hover:bg-zinc-700'}`} />
                    {prob.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-[#050505] p-12 lg:p-20 relative custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeProblem ? (
            <motion.div
              key={`prob-${activeProblem.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                  Troubleshooting
                </div>
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Git Solution Guide</span>
              </div>

              <h1 className="text-5xl font-black text-white tracking-tighter mb-8 max-w-2xl leading-[1.1]">
                {activeProblem.title}
              </h1>

              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Search size={14} className="text-zinc-500" />
                    </div>
                    <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">The Situation</h2>
                  </div>
                  <p className="text-xl text-zinc-300 leading-relaxed font-medium">
                    {activeProblem.situation}
                  </p>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Sparkles size={14} className="text-emerald-500" />
                    </div>
                    <h2 className="text-xs font-black text-emerald-500/50 uppercase tracking-[0.2em]">The Solution</h2>
                  </div>
                  <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <BookOpen size={64} className="text-white" />
                    </div>
                    <p className="text-zinc-400 mb-6 relative z-10">{activeProblem.solution}</p>
                    <div className="space-y-3 relative z-10">
                      {activeProblem.commands.map((cmd, i) => (
                        <div key={i} className="p-4 bg-black rounded-xl border border-white/10 font-mono text-sm text-white flex gap-4">
                          <span className="text-zinc-700 select-none">$</span>
                          {cmd}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-20 pt-12 border-t border-white/5">
                <button
                  onClick={onPlay}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-white/10"
                >
                  Apply in Sandbox <Terminal size={14} className="ml-2" />
                </button>
              </div>
            </motion.div>
          ) : activeCommand ? (
            <motion.div
              key={activeCommand.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  {activeCommand.category}
                </div>
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Standard Git Command</span>
              </div>

              <h1 className="text-7xl font-black text-white tracking-tighter mb-8 lowercase flex items-end gap-4 italic group">
                <span className="text-zinc-800 not-italic select-none opacity-50 group-hover:opacity-100 transition-opacity">git</span>
                {activeCommand.name}
                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mb-4 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                  <Sparkles size={16} className="text-white" />
                </span>
              </h1>

              <div className="space-y-12">
                {/* Description */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Command size={14} className="text-zinc-500" />
                    </div>
                    <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Description</h2>
                  </div>
                  <p className="text-xl text-zinc-300 leading-relaxed font-medium">
                    {activeCommand.description}
                  </p>
                </section>

                {/* Usage */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Cpu size={14} className="text-zinc-500" />
                    </div>
                    <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Usage</h2>
                  </div>
                  <div className="relative group">
                    <pre className="p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white font-mono text-sm shadow-2xl overflow-x-auto selection:bg-blue-500/30">
                      <code className="flex gap-4">
                        <span className="text-zinc-700 select-none">$</span>
                        {activeCommand.usage}
                      </code>
                    </pre>
                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  </div>
                </section>

                {/* Examples */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <Terminal size={14} className="text-zinc-500" />
                    </div>
                    <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Practical Examples</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                    {activeCommand.examples.map((ex, i) => (
                      <div 
                        key={i} 
                        className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                      >
                        <code className="text-zinc-300 font-mono text-sm">
                          <span className="text-zinc-700 mr-4 select-none">$</span>
                          {ex}
                        </code>
                        <div className="px-3 py-1 bg-zinc-900 rounded-lg text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to copy
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                {/* Situations */}
                {activeCommand.situations && activeCommand.situations.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                        <Activity size={14} className="text-blue-500" />
                      </div>
                      <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">When to use</h2>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCommand.situations.map((sit, i) => (
                        <li key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-sm text-zinc-400 leading-relaxed font-normal hover:bg-white/[0.03] transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mt-2 shrink-0" />
                          {sit}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Troubleshooting */}
                {activeCommand.troubleshooting && activeCommand.troubleshooting.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                        <HelpCircle size={14} className="text-amber-500" />
                      </div>
                      <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Common Dilemmas</h2>
                    </div>
                    <div className="space-y-4">
                      {activeCommand.troubleshooting.map((qa, i) => (
                        <div key={i} className="p-6 bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl group hover:bg-amber-500/[0.04] transition-all">
                          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-3">
                            <span className="text-amber-500/50">Q:</span> {qa.question}
                          </h4>
                          <p className="text-zinc-400 text-sm leading-relaxed pl-7 border-l border-amber-500/20">
                            {qa.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Call to Action */}
              <div className="mt-20 pt-12 border-t border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold mb-1">Ready to try it?</h4>
                  <p className="text-[11px] text-zinc-500">Practice this command in the interactive sandbox.</p>
                </div>
                <button
                  onClick={onPlay}
                  className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Go to Playground <Play size={14} fill="currentColor" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-800 flex-col gap-6">
              <Command size={48} className="opacity-10" />
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Select a command to begin</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
