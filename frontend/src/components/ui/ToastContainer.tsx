import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { ToastData } from '../../types';

const icons = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  info:    'text-brand-400',
  warning: 'text-amber-400',
};

function Toast({ toast }: { toast: ToastData }) {
  const { removeToast } = useUIStore();
  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: .95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: .95 }}
      className="toast"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${colors[toast.type]}`} />
      <span className="flex-1 text-sm">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="text-surface-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
