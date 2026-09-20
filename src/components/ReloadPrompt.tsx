import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  const handleRefresh = async () => {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch (e) {
        console.warn('Cache clear error:', e);
      }
    }
    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-5 rounded-2xl shadow-2xl w-[320px] text-white"
        >
          <button 
            onClick={close} 
            className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 pr-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] leading-tight mb-1">Update Available</h3>
              <p className="text-neutral-400 text-[13px] leading-tight">
                A new version of Spotiz is ready.
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[14px]"
          >
            <RefreshCw className="w-4 h-4" />
            Update & Refresh
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
