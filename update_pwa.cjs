const fs = require('fs');

// 1. Update main.tsx
let mainCode = fs.readFileSync('src/main.tsx', 'utf8');
if (!mainCode.includes('window.deferredPWAInstallPrompt')) {
  mainCode = mainCode.replace(
    `import { registerSW } from 'virtual:pwa-register';`,
    `import { registerSW } from 'virtual:pwa-register';\n\n// Capture PWA install prompt globally\nwindow.addEventListener('beforeinstallprompt', (e) => {\n  e.preventDefault();\n  (window as any).deferredPWAInstallPrompt = e;\n  window.dispatchEvent(new Event('pwa-prompt-ready'));\n});`
  );
  fs.writeFileSync('src/main.tsx', mainCode);
}

// 2. Update PWAInstallButton.tsx
let pwaCode = fs.readFileSync('src/components/Common/PWAInstallButton.tsx', 'utf8');

const regex = /const \[deferredPrompt, setDeferredPrompt\] = useState<any>\(null\);[\s\S]*?\}, \[\]\);/;

const replacement = `const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPWAInstallPrompt || null);
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
  }, []);`;

pwaCode = pwaCode.replace(/const \[deferredPrompt, setDeferredPrompt\] = useState<any>\(null\);[\s\S]*?\}, \[\]\);/, replacement);

// Replace deferredPrompt.prompt() logic to reset window global too
pwaCode = pwaCode.replace(
  `setDeferredPrompt(null);`,
  `setDeferredPrompt(null);\n    (window as any).deferredPWAInstallPrompt = null;`
);

fs.writeFileSync('src/components/Common/PWAInstallButton.tsx', pwaCode);
