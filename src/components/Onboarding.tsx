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
  highlight?: string; // CSS selector
  spotlightArea?: { top: string; left: string; width: string; height: string }; // Fallback/Welcome
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Git Sandbox! 🎉',
    description: 'This is your interactive Git learning playground. Let me give you a quick tour of all the tools at your disposal.',
    icon: Sparkles,
    spotlightArea: { top: '6%', left: '1%', width: '98%', height: '92%' },
    position: 'center',
    tips: ['Everything runs in your browser — no server needed', 'Your progress is saved automatically'],
  },
  {
    id: 'lessons',
    title: 'Lessons Panel',
    description: 'Choose from 12 guided scenarios organized by difficulty. Each lesson teaches a different Git concept with step-by-step tasks, concept explanations, and hints.',
    icon: BookOpen,
    highlight: '#app-lessons',
    position: 'right',
    tips: ['Filter by difficulty: Beginner → Advanced', 'Click hints if you get stuck', 'Completed scenarios are saved'],
  },
  {
    id: 'explorer',
    title: 'File Explorer',
    description: 'Your project files live here. Create new files, see which ones are modified (M), new (A), or have conflicts (C). The staging area at the bottom shows what\'s ready to commit.',
    icon: FileCode,
    highlight: '#app-explorer',
    position: 'right',
    tips: ['Green dot = file is staged', 'Status badges: M (modified), A (added)', 'Click + to create new files'],
  },
  {
    id: 'editor',
    title: 'Code Editor',
    description: 'Edit files with tabs, line numbers, and file status indicators. Changes appear in real-time. Use Ctrl+S to save your changes.',
    icon: FileCode,
    highlight: '#app-editor',
    position: 'right',
    tips: ['Ctrl+S to save', 'Tab key for indentation', 'Unsaved changes show an amber dot'],
  },
  {
    id: 'graph',
    title: 'Commit Graph',
    description: 'A visual representation of your repository\'s history. See branches as lanes, commits as nodes, and merge paths as curved lines. Click any commit to checkout.',
    icon: GitBranch,
    highlight: '#app-graph',
    position: 'left',
    tips: ['Click a commit node to checkout', 'Hover for commit details', 'Toggle "All branches" to filter'],
  },
  {
    id: 'terminal',
    title: 'Git Terminal',
    description: 'Type real Git commands! Supports 16+ commands including git add, commit, branch, merge, stash, cherry-pick, and more. Use ↑↓ for command history and Tab for autocomplete.',
    icon: TerminalSquare,
    highlight: '#app-terminal',
    position: 'top',
    tips: ['Type "help" to see all commands', '↑/↓ arrows for command history', 'Tab for autocomplete', 'Ctrl+` to toggle terminal'],
  },
  {
    id: 'actions',
    title: 'Action Panel',
    description: 'Quick-access buttons for commit, branch, merge, rebase, stash, and tags. Everything you can do in the terminal, you can also do here with one click.',
    icon: Layers,
    highlight: '#app-actions',
    position: 'top',
    tips: ['Click "Stage all changes" before committing', 'Expand "Stash & Tags" for advanced features'],
  },
];

const STORAGE_KEY = 'git-sandbox-tour-complete';

export const OnboardingTour: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [spotlightCoords, setSpotlightCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  useEffect(() => {
    const updateCoords = () => {
      if (step.highlight) {
        const el = document.querySelector(step.highlight);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Add a small padding
          const padding = 4;
          setSpotlightCoords({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          });
          return;
        }
      }
      
      // Fallback to percentage-based or center
      if (step.spotlightArea) {
        const top = parseFloat(step.spotlightArea.top) * window.innerHeight / 100;
        const left = parseFloat(step.spotlightArea.left) * window.innerWidth / 100;
        const width = parseFloat(step.spotlightArea.width) * window.innerWidth / 100;
        const height = parseFloat(step.spotlightArea.height) * window.innerHeight / 100;
        setSpotlightCoords({ top, left, width, height });
      }
    };

    // Small delay to ensure layout has settled
    const timer = setTimeout(updateCoords, 100);
    window.addEventListener('resize', updateCoords);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoords);
    };
  }, [currentStep, step]);

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
                x={spotlightCoords.left}
                y={spotlightCoords.top}
                width={spotlightCoords.width}
                height={spotlightCoords.height}
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
          className="absolute border border-blue-500/50 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)] pointer-events-none"
          animate={{
            top: spotlightCoords.top,
            left: spotlightCoords.left,
            width: spotlightCoords.width,
            height: spotlightCoords.height,
            opacity: 1,
            scale: 1
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 30, stiffness: 250 }}
          key={step.id + '-border'}
        />

        {/* Tour Card */}
        <motion.div
          key={step.id}
          className={`absolute z-10 w-[380px] ${getCardPosition(step)}`}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#18181b] border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Icon size={20} className="text-blue-500" />
                </div>
                <h3 className="text-white font-bold text-[13px] tracking-tight uppercase tracking-[0.1em]">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-zinc-400 text-[13px] leading-relaxed mb-4">{step.description}</p>

              {step.tips && (
                <div className="space-y-2 mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-white/[0.03]">
                  {step.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[11px] text-zinc-500 font-medium leading-normal">
                      <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-6">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep 
                        ? 'bg-blue-500 w-8' 
                        : i < currentStep 
                          ? 'bg-blue-500/20 w-2' 
                          : 'bg-zinc-800 w-2'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-zinc-700 font-bold ml-auto uppercase tracking-widest">{currentStep + 1} / {tourSteps.length}</span>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                <button
                  onClick={handleSkip}
                  className="text-[11px] font-bold text-zinc-600 hover:text-white transition-all uppercase tracking-widest"
                >
                  Skip tour
                </button>
                <div className="flex gap-2">
                  {!isFirst && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-white/5"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-6 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                  >
                    {isLast ? (
                      <>Get Started <Sparkles size={14} /></>
                    ) : (
                      <>Next Step <ChevronRight size={14} /></>
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
