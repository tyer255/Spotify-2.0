import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Sparkles, X } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  title = 'Coming Soon',
  description = 'Live Radio stations and personalized smart radio broadcasts will be available soon.',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm liquid-glass-capsule p-6 sm:p-7 text-white text-center shadow-2xl rounded-3xl overflow-hidden border border-white/20"
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glowing Radio Icon with soft animated waves */}
          <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/30 via-emerald-500/20 to-teal-400/30 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
              <Sparkles className="w-3 h-3 text-emerald-300" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6 px-2">
            {description}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            Got it
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
