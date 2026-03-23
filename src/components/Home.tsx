import type { FC } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, BookOpen, Terminal, Award, ArrowRight, GitMerge, Tag } from 'lucide-react';
import { scenarios, difficultyColors } from '../store/scenarios';
import useGitStore from '../store/gitStore';
import type { ScenarioDifficulty } from '../types';

const featureCards = [
  { icon: Terminal, title: 'CLI Terminal', description: 'Real git commands with autocomplete and syntax-highlighted output', color: 'text-emerald-400' },
  { icon: GitBranch, title: 'Visual Graph', description: 'Interactive DAG visualization of your repository\'s commit history', color: 'text-blue-400' },
  { icon: GitMerge, title: 'Merge & Rebase', description: 'Practice conflict resolution, cherry-pick, and interactive rebase', color: 'text-purple-400' },
  { icon: Tag, title: 'Stash & Tags', description: 'Save work-in-progress and mark releases with git tags', color: 'text-amber-400' },
];

// Removed unused motion variants as they are no longer used in the new design.

export const Home: FC<{ onOpenPlayground: () => void, onOpenDocs: () => void }> = ({ onOpenPlayground, onOpenDocs }) => {
  const { loadScenario, initRepo, completedScenarios } = useGitStore();

  const groupedScenarios: Record<ScenarioDifficulty, typeof scenarios> = {
    beginner: scenarios.filter(s => s.difficulty === 'beginner'),
    intermediate: scenarios.filter(s => s.difficulty === 'intermediate'),
    advanced: scenarios.filter(s => s.difficulty === 'advanced'),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#a1a1aa] overflow-y-auto selection:bg-white/10 selection:text-white relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg className="absolute w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Animated Branches */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M -100 200 Q 200 150 400 300 T 800 200 T 1200 400"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.2 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
          />
          <motion.path
            d="M -100 400 Q 300 350 500 500 T 900 400 T 1300 600"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.1 }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut", delay: 1 }}
          />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Nodes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-16">
          <div className="flex flex-col gap-8 flex-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40">
                Interactive Learning Platform v2.0
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] max-w-4xl"
            >
              Master Git with <br/>
              <span className="text-blue-500 relative">
                Visual
                <motion.svg
                  viewBox="0 0 100 20"
                  className="absolute -bottom-2 left-0 w-full h-3 text-blue-500/30"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M 0 10 Q 50 0 100 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </motion.svg>
              </span> Precision
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#71717a] max-w-xl leading-relaxed font-medium"
            >
              A professional-grade interactive sandbox. Practice real git commands, 
              visualize branches in real-time, and master complex workflows.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 mt-4"
            >
              <button
                onClick={() => {
                  initRepo();
                  useGitStore.setState({ activeScenarioId: null });
                  onOpenPlayground();
                }}
                className="group flex items-center gap-3 bg-white text-black font-bold py-4 px-8 rounded-full transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-white/10"
              >
                <span>Launch Sandbox</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onOpenDocs}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-full border border-white/10 transition-all hover:border-white/20"
              >
                <BookOpen size={18} className="text-blue-500" />
                <span>Documentation</span>
              </button>
            </motion.div>
          </div>

          {/* Premium Hero SVG Illustration */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 hidden lg:flex justify-end items-center relative"
          >
            <div className="relative w-[500px] h-[500px]">
              {/* Decorative Background Glow */}
              <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
              
              <svg viewBox="0 0 500 500" className="w-full h-full relative z-10 drop-shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Main Backbone */}
                <motion.path
                  d="M 100 400 L 100 100"
                  stroke="white"
                  strokeWidth="1"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />

                {/* Animated Data Packets along Trunk */}
                <motion.circle r="3" fill="#3b82f6" filter="url(#glow)">
                  <animateMotion
                    dur="4s"
                    repeatCount="indefinite"
                    path="M 100 400 L 100 100"
                  />
                </motion.circle>

                {/* Anchoring Lines for Tooltips */}
                <g className="anchors" opacity="0.2">
                  <motion.path
                    d="M 400 150 L 450 80"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 2 }}
                  />
                  <motion.path
                    d="M 180 150 L 100 350"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.8 }}
                  />
                </g>

                {/* Complex Branching Structure */}
                <g className="branches">
                  {/* Branch 1: The feature path */}
                  <motion.path
                    d="M 100 350 Q 250 350 250 200 T 400 150"
                    fill="none"
                    stroke="url(#branchGrad)"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.5 }}
                    filter="url(#glow)"
                  />
                  {/* Branch 2: The hotfix path */}
                  <motion.path
                    d="M 100 250 Q 180 250 180 150"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 1 }}
                    opacity="0.6"
                  />
                </g>

                {/* Commit Nodes */}
                <g className="nodes">
                  <motion.circle cx="100" cy="350" r="10" fill="#3b82f6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
                  <motion.circle cx="250" cy="200" r="8" fill="#8b5cf6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }} />
                  <motion.circle cx="400" cy="150" r="12" fill="#3b82f6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 }} filter="url(#glow)" />
                  <motion.circle cx="180" cy="150" r="6" fill="#10b981" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.5 }} />
                </g>

                {/* Flowing Data Packet on Branch */}
                <motion.circle r="4" fill="white" filter="url(#glow)">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 100 350 Q 250 350 250 200 T 400 150"
                  />
                </motion.circle>
              </svg>

              {/* Floating UI Tooltip (Static) */}
              <div
                className="absolute top-[8%] right-[5%] p-5 bg-white/[0.03] border border-blue-500/20 rounded-2xl backdrop-blur-3xl z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] font-mono text-[8px] leading-none p-2 pointer-events-none select-none">
                  {Array(10).fill("commit 7f2d9c1\n").join("")}
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6]" />
                    <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase font-bold">Merge Request</span>
                  </div>
                  <div className="text-[14px] font-black text-white mb-4 tracking-tight">Feature: Logic Optimization</div>
                  <div className="flex gap-2">
                    <div className="h-1.5 w-12 bg-emerald-500/30 rounded-full" />
                    <div className="h-1.5 w-8 bg-emerald-500/30 rounded-full" />
                    <div className="h-1.5 w-4 bg-red-500/30 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Verified Checkout Tooltip (Static) */}
              <div
                className="absolute bottom-[25%] left-[5%] p-5 bg-white/[0.03] border border-emerald-500/20 rounded-2xl backdrop-blur-3xl z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] font-mono text-[8px] leading-none p-2 pointer-events-none select-none">
                  {Array(10).fill("git checkout main\n").join("")}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
                    <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase font-bold">Verified Checkout</span>
                  </div>
                  <div className="font-mono text-[12px] text-zinc-300 font-bold mb-1">cd8f2k1 → main</div>
                  <div className="text-[10px] text-zinc-500 font-mono">2 minutes ago</div>
                </div>
              </div>

              {/* Orbital Rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[400px] h-[400px] border border-white/[0.03] rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="w-[300px] h-[300px] absolute border border-white/[0.05] rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 overflow-hidden rounded-2xl">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#0a0a0a] p-10 hover:bg-[#111111] transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500" />
              
              {/* Decorative SVG Node background */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <motion.circle 
                    cx="50" cy="50" r="40" 
                    fill="none" stroke="white" strokeWidth="2" 
                    whileHover={{ scale: 1.2, strokeWidth: 4 }}
                  />
                  <motion.path 
                    d="M 50 10 L 50 90 M 10 50 L 90 50" 
                    stroke="white" strokeWidth="1"
                    whileHover={{ rotate: 90 }}
                  />
                </svg>
              </div>

              <feature.icon size={32} className="text-white mb-8 group-hover:text-blue-500 transition-colors" />
              <h3 className="text-white font-bold text-xl mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-[#71717a] leading-relaxed font-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="flex flex-col gap-16">
          {(['beginner', 'intermediate', 'advanced'] as ScenarioDifficulty[]).map(difficulty => {
            const group = groupedScenarios[difficulty];
            const colors = difficultyColors[difficulty];
            
            return (
              <section key={difficulty} className="flex flex-col md:flex-row gap-8 md:gap-24">
                <div className="md:w-48 shrink-0">
                  <div className="sticky top-12">
                    <div className={`inline-flex px-3 py-1 rounded-full border ${colors.border} ${colors.bg} mb-4`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                        {difficulty}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-2 capitalize">{difficulty}</h2>
                    <p className="text-sm text-[#71717a]">{group.length} scenarios available</p>
                  </div>
                </div>
                
                <div className="flex-1 grid md:grid-cols-2 gap-4">
                  {group.map((scenario) => {
                    const isComplete = completedScenarios.includes(scenario.id);
                    return (
                      <motion.div
                        key={scenario.id}
                        whileHover={{ y: -4 }}
                        className={`group bg-[#111111] border p-8 rounded-2xl cursor-pointer transition-all ${
                          isComplete ? 'border-emerald-500/40' : 'border-white/5 hover:border-white/20'
                        }`}
                        onClick={() => {
                          loadScenario(scenario.setup, scenario.id);
                          onOpenPlayground();
                        }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <h3 className="text-white font-bold text-lg leading-snug group-hover:text-blue-500 transition-colors">
                            {scenario.title}
                          </h3>
                          {isComplete && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <Award size={14} className="text-emerald-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[#71717a] leading-relaxed mb-8">{scenario.description}</p>
                        <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{scenario.tasks.length} tasks</span>
                          </div>
                          {isComplete && (
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">Completed</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-12 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
          Git Sandbox — Precision Interactive Environment
        </p>
      </div>
    </div>
  );
};
