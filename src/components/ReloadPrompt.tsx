import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] bg-neutral-900 border border-[#1DB954]/50 rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            {needRefresh ? (
              <>
                <RefreshCw className="w-4 h-4 text-[#1DB954]" />
                Update Available
              </>
            ) : (
              'App Ready Offline'
            )}
          </h3>
          <p className="text-neutral-400 text-sm mt-1">
            {needRefresh
              ? 'A new version of Spotiz is available. Refresh to update.'
              : 'App has been downloaded and is ready to work offline.'}
          </p>
        </div>
        {!needRefresh && (
          <button onClick={close} className="p-1 -mr-2 -mt-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          className="w-full py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-lg transition-colors mt-1 active:scale-[0.98]"
        >
          Refresh for latest version
        </button>
      )}
    </div>
  );
}
