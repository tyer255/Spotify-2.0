export function suppressYouTubeErrors() {
  if (typeof window === 'undefined') return;
  
  const originalError = console.error;
  console.error = function (...args: any[]) {
    // Ignore YouTube Error 150
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      if (args[0].data === 150 || (args[0].target && args[0].target.playerInfo)) {
        return; // Suppress
      }
    }
    originalError.apply(console, args);
  };
  
  const originalWarn = console.warn;
  console.warn = function (...args: any[]) {
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      if (args[0].data === 150 || (args[0].target && args[0].target.playerInfo)) {
        return; // Suppress
      }
    }
    if (args[0] === 'ReactPlayer playback error:' && args[1] && args[1].data === 150) {
      return;
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('error', (e) => {
    if (e.error && typeof e.error === 'object') {
      if (e.error.data === 150 || (e.error.target && e.error.target.playerInfo)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && typeof e.reason === 'object') {
      if (e.reason.data === 150 || (e.reason.target && e.reason.target.playerInfo)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });
}
