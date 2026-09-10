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
  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPWAInstallPrompt || null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const checkPrompt = () => {
      if ((window as any).deferredPWAInstallPrompt) {
        setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      }
    };
    
    // It might be set right after mount
    checkPrompt();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
      setTimeout(() => setJustInstalled(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', checkPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', checkPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isInstalled) {
        alert('Spotiz is already installed on your device as a standalone PWA!');
      } else {
        alert(
          'To install Spotiz:\n\n• On Chrome/Edge: Click the install icon in the URL address bar or select "Install Spotiz".\n• On iOS Safari: Tap Share (⎋) and choose "Add to Home Screen".'
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
    (window as any).deferredPWAInstallPrompt = null;
  };

  if (isInstalled && !justInstalled && variant !== 'sidebar') {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleInstallClick}
        className={`w-full flex items-center gap-0 xl:gap-3 px-0 xl:px-3 justify-center xl:justify-start py-2.5 rounded-xl text-xs font-medium transition-all ${
          isInstalled
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40'
        } ${className}`}
        title={isInstalled ? 'App installed' : 'Install Spotiz App'}
      >
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isInstalled ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {isInstalled ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
        </div>
        <div className="hidden xl:flex flex-col text-left">
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
      className={`p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-emerald-400 border border-white/5 transition-colors cursor-pointer ${className}`}
      title="Install Spotiz PWA on your device"
    >
      <Download className="w-4 h-4" />
    </button>
  );
};
