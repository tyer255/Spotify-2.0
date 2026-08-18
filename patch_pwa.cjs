const fs = require('fs');
let code = fs.readFileSync('src/components/Common/PWAInstallButton.tsx', 'utf8');

// If variant full and not supported
code = code.replace(
  /if \(variant === 'full'\) \{([\s\S]*?)  \}/,
  `if (variant === 'full') {
    if (isInstalled) {
      return (
        <div className={\`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 \${className}\`}>
          <CheckCircle className="w-4 h-4" />
          <span>App Installed</span>
        </div>
      );
    }
    if (!deferredPrompt && !justInstalled) {
      return (
        <div className={\`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md bg-neutral-800 text-neutral-400 border border-neutral-700 \${className}\`} title="Installation is managed via your browser menu">
          <Smartphone className="w-4 h-4 opacity-50" />
          <span>Install from Browser</span>
        </div>
      );
    }
    return (
      <button
        onClick={handleInstallClick}
        className={\`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md cursor-pointer \${
          justInstalled
            ? 'bg-emerald-500 text-black'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-emerald-500/50'
        } \${className}\`}
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
  }`
);

fs.writeFileSync('src/components/Common/PWAInstallButton.tsx', code);
