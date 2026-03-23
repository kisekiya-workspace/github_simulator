import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, FileCode, GitBranch, TerminalSquare, 
  Layers, ChevronRight, ChevronLeft, X, Sparkles
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: FC<{ size?: number; className?: string }>;
  highlight: string; // CSS selector or area name
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  spotlightArea: { top: string; left: string; width: string; height: string };
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Git Sandbox! 🎉',
    description: 'This is your interactive Git learning playground. Let me give you a quick tour of all the tools at your disposal.',
    icon: Sparkles,
    highlight: 'welcome',
    position: 'center',
    spotlightArea: { top: '6%', left: '1%', width: '98%', height: '92%' },
    tips: ['Everything runs in your browser — no server needed', 'Your progress is saved automatically'],
  },
  {
    id: 'lessons',
    title: 'Lessons Panel',
    description: 'Choose from 12 guided scenarios organized by difficulty. Each lesson teaches a different Git concept with step-by-step tasks, concept explanations, and hints.',
    icon: BookOpen,
    highlight: 'lessons',
    position: 'right',
    spotlightArea: { top: '5%', left: '0%', width: '21.5%', height: '92%' },
    tips: ['Filter by difficulty: Beginner → Advanced', 'Click hints if you get stuck', 'Completed scenarios are saved'],
  },
  {
    id: 'explorer',
    title: 'File Explorer',
    description: 'Your project files live here. Create new files, see which ones are modified (M), new (A), or have conflicts (C). The staging area at the bottom shows what\'s ready to commit.',
    icon: FileCode,
    highlight: 'explorer',
    position: 'right',
    spotlightArea: { top: '5%', left: '21.5%', width: '13%', height: '58%' },
    tips: ['Green dot = file is staged', 'Status badges: M (modified), A (added)', 'Click + to create new files'],
  },
  {
    id: 'editor',
    title: 'Code Editor',
    description: 'Edit files with tabs, line numbers, and file status indicators. Changes appear in real-time. Use Ctrl+S to save your changes.',
    icon: FileCode,
    highlight: 'editor',
    position: 'right',
    spotlightArea: { top: '5%', left: '34.5%', width: '28%', height: '58%' },
    tips: ['Ctrl+S to save', 'Tab key for indentation', 'Unsaved changes show an amber dot'],
  },
  {
    id: 'graph',
    title: 'Commit Graph',
    description: 'A visual representation of your repository\'s history. See branches as lanes, commits as nodes, and merge paths as curved lines. Click any commit to checkout.',
    icon: GitBranch,
    highlight: 'graph',
    position: 'left',
    spotlightArea: { top: '5%', left: '62.5%', width: '37%', height: '58%' },
    tips: ['Click a commit node to checkout', 'Hover for commit details', 'Toggle "All branches" to filter'],
  },
  {
    id: 'terminal',
    title: 'Git Terminal',
    description: 'Type real Git commands! Supports 16+ commands including git add, commit, branch, merge, stash, cherry-pick, and more. Use ↑↓ for command history and Tab for autocomplete.',
    icon: TerminalSquare,
    highlight: 'terminal',
    position: 'top',
    spotlightArea: { top: '63%', left: '21.5%', width: '78%', height: '24%' },
    tips: ['Type "help" to see all commands', '↑/↓ arrows for command history', 'Tab for autocomplete', 'Ctrl+` to toggle terminal'],
  },
  {
    id: 'actions',
    title: 'Action Panel',
    description: 'Quick-access buttons for commit, branch, merge, rebase, stash, and tags. Everything you can do in the terminal, you can also do here with one click.',
    icon: Layers,
    highlight: 'actions',
    position: 'top',
    spotlightArea: { top: '87%', left: '21.5%', width: '78%', height: '12%' },
    tips: ['Click "Stage all changes" before committing', 'Expand "Stash & Tags" for advanced features'],
  },
];

const STORAGE_KEY = 'git-sandbox-tour-complete';

export const OnboardingTour: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep(prev => prev - 1);
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (!isVisible) return null;

  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dark overlay with transparent cutout using SVG mask */}
        <svg className="absolute inset-0 w-full h-full" onClick={handleSkip}>
          <defs>
            <mask id="spotlight-mask">
              {/* White = visible (dark overlay shows), Black = hidden (cutout) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={step.spotlightArea.left}
                y={step.spotlightArea.top}
                width={step.spotlightArea.width}
                height={step.spotlightArea.height}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dark overlay with the cutout hole */}
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="rgba(2, 6, 23, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border glow around the cutout area */}
        <motion.div
          className="absolute border-2 border-blue-500/70 rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.3),inset_0_0_40px_rgba(59,130,246,0.05)] pointer-events-none"
          style={{
            top: step.spotlightArea.top,
            left: step.spotlightArea.left,
            width: step.spotlightArea.width,
            height: step.spotlightArea.height,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          key={step.id + '-border'}
        />

        {/* Tour Card */}
        <motion.div
          key={step.id}
          className={`absolute z-10 w-[380px] ${getCardPosition(step)}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-b border-slate-700/50 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-sm">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-700/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{step.description}</p>

              {step.tips && (
                <div className="space-y-1.5 mb-4">
                  {step.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Indicator */}
              <div className="flex items-center gap-1.5 mb-4">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep 
                        ? 'bg-blue-500 w-6' 
                        : i < currentStep 
                          ? 'bg-blue-500/40 w-2' 
                          : 'bg-slate-700 w-2'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-slate-600 ml-2">{currentStep + 1}/{tourSteps.length}</span>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {!isFirst && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-colors"
                    >
                      <ChevronLeft size={12} /> Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    {isLast ? (
                      <>Start Learning <Sparkles size={12} /></>
                    ) : (
                      <>Next <ChevronRight size={12} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function getCardPosition(step: TourStep): string {
  switch (step.position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    case 'right':
      return 'top-[15%] left-[50%]';
    case 'left':
      return 'top-[15%] right-[40%]';
    case 'top':
      return 'top-[20%] left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'bottom-[20%] left-1/2 -translate-x-1/2';
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}

/**
 * Hook to check if the tour should be shown
 */
export const useShouldShowTour = (): boolean => {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setShouldShow(!completed);
  }, []);

  return shouldShow;
};

/**
 * Reset the tour (for testing)
 */
export const resetTour = () => {
  localStorage.removeItem(STORAGE_KEY);
};
