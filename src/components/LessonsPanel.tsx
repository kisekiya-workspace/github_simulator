import { useState } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGitStore from '../store/gitStore';
import { scenarios, difficultyColors } from '../store/scenarios';
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
    <div className="w-64 bg-slate-900 flex flex-col h-full text-slate-300 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 flex items-center gap-2 bg-slate-950 font-semibold text-white shrink-0">
        <BookOpen size={16} className="text-amber-500" />
        <span className="text-sm">Lessons</span>
        <span className="ml-auto text-[10px] text-slate-500">{totalCompleted}/{totalScenarios}</span>
      </div>

      {/* Progress Bar */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Progress</span>
          <span className="text-[10px] text-emerald-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
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
          const colors = difficultyColors[sc.difficulty];

          return (
            <div key={sc.id} className={`rounded-lg border transition-all ${
              isActive ? 'bg-slate-800/50 border-amber-600/40' : 'border-slate-800/50 hover:border-slate-700'
            }`}>
              {/* Scenario header */}
              <button 
                className="w-full text-left p-2 flex items-center gap-2"
                onClick={() => {
                  setExpandedScenario(isExpanded ? null : sc.id);
                  if (!isActive) {
                    loadScenario(sc.setup, sc.id);
                  }
                }}
              >
                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <Circle size={14} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{sc.title}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border} border font-bold uppercase`}>
                      {sc.difficulty.charAt(0)}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
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
                    <div className="px-2 pb-2 space-y-2">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{sc.description}</p>
                      
                      {/* Concept */}
                      <div className="bg-blue-950/30 p-2 rounded border border-blue-800/30">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles size={10} className="text-blue-400" />
                          <span className="text-[9px] font-bold text-blue-400 uppercase">Concept</span>
                        </div>
                        <p className="text-[10px] text-blue-300/80 leading-relaxed">{sc.conceptExplanation}</p>
                      </div>

                      {/* Tasks */}
                      {isActive && (
                        <div className="space-y-1.5">
                          {sc.tasks.map((task, idx) => {
                            const isTaskComplete = task.check(state);
                            return (
                              <div key={task.id} className={`flex gap-1.5 items-start text-[11px] ${isTaskComplete ? 'text-slate-500' : 'text-slate-200'}`}>
                                {isTaskComplete ? (
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle size={13} className="text-slate-600 shrink-0 mt-0.5" />
                                )}
                                <span className={isTaskComplete ? 'line-through' : ''}>{idx + 1}. {task.description}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hints toggle */}
                      {isActive && sc.hints.length > 0 && (
                        <button
                          onClick={() => setShowHints(!showHints)}
                          className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Lightbulb size={10} />
                          {showHints ? 'Hide hints' : 'Need a hint?'}
                        </button>
                      )}

                      {isActive && showHints && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-amber-950/20 p-2 rounded border border-amber-800/30 space-y-1"
                        >
                          {sc.hints.map((hint, i) => (
                            <p key={i} className="text-[10px] text-amber-300/70">💡 {hint}</p>
                          ))}
                        </motion.div>
                      )}

                      {/* Complete banner */}
                      {isActive && sc.tasks.every(t => t.check(state)) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-2 bg-emerald-900/30 border border-emerald-800/50 rounded text-center"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Trophy size={14} className="text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">Complete!</span>
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
