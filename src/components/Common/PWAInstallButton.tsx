import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setJustInstalled(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isInstalled) {
        alert('Spotify 2.0 is already installed on your device as a standalone PWA!');
      } else {
        alert(
          'To install Spotify 2.0:\n\n• On Chrome/Edge: Click the install icon in the URL address bar or select "Install Spotify".\n• On iOS Safari: Tap Share (⎋) and choose "Add to Home Screen".'
        );
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setJustInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled && !justInstalled && variant !== 'sidebar') {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleInstallClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
          isInstalled
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40'
        } ${className}`}
        title={isInstalled ? 'App installed' : 'Install Spotify App'}
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isInstalled ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {isInstalled ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-semibold">{isInstalled ? 'App Installed' : 'Install App'}</span>
          <span className="text-[10px] text-neutral-400">
            {isInstalled ? 'Standalone Mode' : 'PWA Fast Offline'}
          </span>
        </div>
      </button>
    );
  }

  if (variant === 'full') {
    if (isInstalled) {
      return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
          <CheckCircle className="w-4 h-4" />
          <span>App Installed</span>
        </div>
      );
    }
    if (!deferredPrompt && !justInstalled) {
      return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md bg-neutral-800 text-neutral-400 border border-neutral-700 ${className}`} title="Installation is managed via your browser menu">
          <Smartphone className="w-4 h-4 opacity-50" />
          <span>Install from Browser</span>
        </div>
      );
    }
    
    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md cursor-pointer ${
          justInstalled
            ? 'bg-emerald-500 text-black'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-emerald-500/50'
        } ${className}`}
      >
        {justInstalled ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Installed!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Install App</span>
          </>
        )}
      </button>
    );
  }

  // Compact badge for TopBar
  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-white/10 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer ${className}`}
      title="Install Spotify PWA on your device"
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};
