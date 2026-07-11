import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow animate-pulse-soft">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-500"
              animate={{ opacity: [.3, 1, .3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * .2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
