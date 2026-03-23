import { useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGitStore from '../store/gitStore';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: { bg: 'bg-emerald-950/80', border: 'border-emerald-700/50', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  error: { bg: 'bg-red-950/80', border: 'border-red-700/50', text: 'text-red-400', bar: 'bg-red-500' },
  warning: { bg: 'bg-amber-950/80', border: 'border-amber-700/50', text: 'text-amber-400', bar: 'bg-amber-500' },
  info: { bg: 'bg-blue-950/80', border: 'border-blue-700/50', text: 'text-blue-400', bar: 'bg-blue-500' },
};

export const ToastContainer: FC = () => {
  const { toasts, removeToast } = useGitStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          const colors = colorMap[toast.type];
          const duration = toast.duration || 3000;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`${colors.bg} ${colors.border} border backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden pointer-events-auto cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-start gap-3 p-3">
                <Icon size={18} className={`${colors.text} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${colors.text}`}>{toast.title}</p>
                  {toast.message && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{toast.message}</p>
                  )}
                </div>
              </div>
              <ToastProgress duration={duration} color={colors.bar} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const ToastProgress: FC<{ duration: number; color: string }> = ({ duration, color }) => {
  return (
    <div className="h-0.5 w-full bg-slate-800/50">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  );
};

// ── Keyboard Shortcut Hook ───────────────────────────────

export const useKeyboardShortcuts = (callbacks: {
  onToggleTerminal?: () => void;
  onSave?: () => void;
  onCommit?: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+` or Ctrl+J — Toggle terminal
      if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.key === 'j')) {
        e.preventDefault();
        callbacks.onToggleTerminal?.();
      }
      // Ctrl+S — Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        callbacks.onSave?.();
      }
      // Ctrl+Enter — Commit
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        callbacks.onCommit?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callbacks]);
};
