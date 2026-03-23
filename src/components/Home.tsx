import type { FC } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, BookOpen, Play, Terminal, Award, ArrowRight, GitMerge, Tag } from 'lucide-react';
import { scenarios, difficultyColors } from '../store/scenarios';
import useGitStore from '../store/gitStore';
import type { ScenarioDifficulty } from '../types';

const featureCards = [
  { icon: Terminal, title: 'CLI Terminal', description: 'Real git commands with autocomplete and syntax-highlighted output', color: 'text-emerald-400' },
  { icon: GitBranch, title: 'Visual Graph', description: 'Interactive DAG visualization of your repository\'s commit history', color: 'text-blue-400' },
  { icon: GitMerge, title: 'Merge & Rebase', description: 'Practice conflict resolution, cherry-pick, and interactive rebase', color: 'text-purple-400' },
  { icon: Tag, title: 'Stash & Tags', description: 'Save work-in-progress and mark releases with git tags', color: 'text-amber-400' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const Home: FC<{ onOpenPlayground: () => void }> = ({ onOpenPlayground }) => {
  const { loadScenario, initRepo, completedScenarios } = useGitStore();

  const totalCompleted = completedScenarios.length;

  const groupedScenarios: Record<ScenarioDifficulty, typeof scenarios> = {
    beginner: scenarios.filter(s => s.difficulty === 'beginner'),
    intermediate: scenarios.filter(s => s.difficulty === 'intermediate'),
    advanced: scenarios.filter(s => s.difficulty === 'advanced'),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-y-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-950 to-purple-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <motion.div 
          className="relative max-w-6xl mx-auto px-6 pt-16 pb-12"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-900/30">
              <GitBranch size={28} className="text-white" />
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="text-emerald-400 text-xs font-semibold">v2.0 — Interactive Platform</span>
            </div>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Learn Git by
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Doing</span>
          </motion.h1>
          
          <motion.p variants={item} className="text-lg text-slate-400 max-w-2xl mb-8 leading-relaxed">
            A fully interactive, client-side Git learning platform. Practice real git commands in a built-in terminal, 
            visualize branches with a live DAG graph, and master Git through {scenarios.length} guided scenarios.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
            <button
              onClick={() => {
                initRepo();
                useGitStore.setState({ activeScenarioId: null });
                onOpenPlayground();
              }}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
            >
              <Play size={18} />
              Open Sandbox
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const firstIncomplete = scenarios.find(s => !completedScenarios.includes(s.id));
                if (firstIncomplete) {
                  loadScenario(firstIncomplete.setup, firstIncomplete.id);
                  onOpenPlayground();
                }
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl border border-slate-700 transition-colors"
            >
              <BookOpen size={18} />
              {totalCompleted > 0 ? 'Continue Learning' : 'Start Learning'}
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item} className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <BookOpen size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{scenarios.length}</p>
                <p className="text-xs text-slate-500">Scenarios</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <Award size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{totalCompleted}/{scenarios.length}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <Terminal size={18} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">16+</p>
                <p className="text-xs text-slate-500">Git Commands</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {featureCards.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors group"
            >
              <feature.icon size={24} className={`${feature.color} mb-3`} />
              <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Scenarios by Difficulty */}
        {(['beginner', 'intermediate', 'advanced'] as ScenarioDifficulty[]).map(difficulty => {
          const group = groupedScenarios[difficulty];
          const colors = difficultyColors[difficulty];
          
          return (
            <motion.section 
              key={difficulty} 
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-2.5 py-1 rounded-md ${colors.bg} ${colors.border} border`}>
                  <span className={`text-xs font-bold uppercase ${colors.text}`}>{difficulty}</span>
                </div>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.map((scenario) => {
                  const isComplete = completedScenarios.includes(scenario.id);
                  return (
                    <motion.div
                      key={scenario.id}
                      whileHover={{ scale: 1.02 }}
                      className={`group bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
                        isComplete ? 'border-emerald-800/40' : 'border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => {
                        loadScenario(scenario.setup, scenario.id);
                        onOpenPlayground();
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">
                          {scenario.title}
                        </h3>
                        {isComplete && <Award size={16} className="text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{scenario.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">{scenario.tasks.length} tasks</span>
                        {isComplete && <span className="text-[10px] text-emerald-500 font-bold">✓ Done</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-800/50">
          <p className="text-xs text-slate-600">
            Git Sandbox — 100% client-side, no data leaves your browser
          </p>
        </div>
      </div>
    </div>
  );
};
