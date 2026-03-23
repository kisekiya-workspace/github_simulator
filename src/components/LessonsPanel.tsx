import { useState } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGitStore from '../store/gitStore';
import { scenarios } from '../store/scenarios';
import type { ScenarioDifficulty } from '../types';
import { CheckCircle2, Circle, BookOpen, ChevronDown, ChevronRight, Lightbulb, Trophy, Sparkles } from 'lucide-react';

export const LessonsPanel: FC = () => {
  const state = useGitStore();
  const { activeScenarioId, loadScenario, completedScenarios, markScenarioComplete } = state;
  const [expandedScenario, setExpandedScenario] = useState<string | null>(activeScenarioId);
  const [showHints, setShowHints] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<ScenarioDifficulty | 'all'>('all');

  const currentScenario = scenarios.find(s => s.id === activeScenarioId);
  const filteredScenarios = filterDifficulty === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.difficulty === filterDifficulty);

  const totalCompleted = completedScenarios.length;
  const totalScenarios = scenarios.length;
  const progressPercent = Math.round((totalCompleted / totalScenarios) * 100);

  // Check if current scenario is fully complete
  if (currentScenario && currentScenario.tasks.every(t => t.check(state))) {
    if (!completedScenarios.includes(currentScenario.id)) {
      markScenarioComplete(currentScenario.id);
    }
  }

  return (
    <div className="w-64 bg-[#0a0a0a] flex flex-col h-full text-zinc-400 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#050505] shrink-0">
        <BookOpen size={18} className="text-white" />
        <span className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Lessons</span>
        <span className="ml-auto text-[10px] text-zinc-600 font-mono">{totalCompleted}/{totalScenarios}</span>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-4 bg-[#0a0a0a] border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Progress</span>
          <span className="text-[10px] text-emerald-500 font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex px-2 py-1.5 gap-1 border-b border-slate-800/50 shrink-0">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
          <button
            key={d}
            onClick={() => setFilterDifficulty(d)}
            className={`flex-1 text-[9px] py-1 rounded font-semibold uppercase tracking-wider transition-colors ${
              filterDifficulty === d 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {d === 'all' ? 'All' : d.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* Scenarios List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredScenarios.map(sc => {
          const isActive = activeScenarioId === sc.id;
          const isComplete = completedScenarios.includes(sc.id);
          const isExpanded = expandedScenario === sc.id;

          return (
            <div key={sc.id} className={`rounded-lg border transition-all ${
              isActive ? 'bg-white/[0.03] border-white/10' : 'border-transparent hover:bg-white/[0.02]'
            }`}>
              {/* Scenario header */}
              <button 
                className="w-full text-left p-3 flex items-center gap-3"
                onClick={() => {
                  setExpandedScenario(isExpanded ? null : sc.id);
                  if (!isActive) {
                    loadScenario(sc.setup, sc.id);
                  }
                }}
              >
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} className="text-zinc-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-zinc-400 text-medium'}`}>{sc.title}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={14} className="text-zinc-700" /> : <ChevronRight size={14} className="text-zinc-700" />}
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-3">
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{sc.description}</p>
                      
                      {/* Concept */}
                      <div className="bg-[#111111] p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={12} className="text-blue-500" />
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Concept</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">{sc.conceptExplanation}</p>
                      </div>

                      {/* Tasks */}
                      {isActive && (
                        <div className="space-y-2">
                          {sc.tasks.map((task, idx) => {
                            const isTaskComplete = task.check(state);
                            return (
                              <div key={task.id} className={`flex gap-3 items-start text-[11px] ${isTaskComplete ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                {isTaskComplete ? (
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <div className="w-[13px] h-[13px] rounded-full border border-zinc-700 shrink-0 mt-0.5" />
                                )}
                                <span className={isTaskComplete ? 'line-through opacity-50' : 'font-medium'}>{idx + 1}. {task.description}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hints toggle */}
                      {isActive && sc.hints.length > 0 && (
                        <button
                          onClick={() => setShowHints(!showHints)}
                          className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-all uppercase tracking-widest"
                        >
                          <Lightbulb size={12} className="text-blue-500" />
                          {showHints ? 'Hide hints' : 'Need a hint?'}
                        </button>
                      )}

                      {isActive && showHints && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-[#111111] p-3 rounded-lg border border-white/5 space-y-2"
                        >
                          {sc.hints.map((hint, i) => (
                            <p key={i} className="text-[10px] text-zinc-500 leading-relaxed font-medium tracking-tight">/ {hint}</p>
                          ))}
                        </motion.div>
                      )}

                      {/* Complete banner */}
                      {isActive && sc.tasks.every(t => t.check(state)) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Trophy size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Scenario Mastery Achieved</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
