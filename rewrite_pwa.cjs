const fs = require('fs');

let code = fs.readFileSync('src/components/Common/PWAInstallButton.tsx', 'utf8');

// Fix the double window assign
code = code.replace(
  /setDeferredPrompt\(null\);\s*\(window as any\)\.deferredPWAInstallPrompt = null;\s*\(window as any\)\.deferredPWAInstallPrompt = null;/g,
  'setDeferredPrompt(null);\n      (window as any).deferredPWAInstallPrompt = null;'
);

// Fix handleInstallClick
code = code.replace(
  /setDeferredPrompt\(null\);\n  \};\n\n  if \(isInstalled && !justInstalled/g,
  'setDeferredPrompt(null);\n    (window as any).deferredPWAInstallPrompt = null;\n  };\n\n  if (isInstalled && !justInstalled'
);

fs.writeFileSync('src/components/Common/PWAInstallButton.tsx', code);
