const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// The replacement was slightly messed up, let's fix it by completely replacing the header section
code = code.replace(/<aside className="hidden md:flex flex-col w-\[300px\] lg:w-\[350px\] xl:w-\[400px\] h-full liquid-glass-sidebar border-l border-white\/5 flex-shrink-0 z-30 p-4 overflow-y-auto">([\s\S]*?)<div className="flex flex-col h-full gap-6">/,
`<aside className="hidden md:flex flex-col w-[300px] lg:w-[350px] xl:w-[400px] h-full liquid-glass-sidebar border-l border-white/5 flex-shrink-0 z-30 p-4 overflow-y-auto pb-20">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsFullscreenOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Fullscreen Player"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M5.5 5.5v13h13v-13h-13zM4 4h16v16H4V4z"></path>
                <path d="M9 13.5l4-3v6l-4-3z"></path>
              </svg>
            </div>
          </button>
          
          <button 
            className="text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                <path d="M4.93 7.93a1 1 0 0 1 1.41 0L12 13.59l5.66-5.66a1 1 0 1 1 1.41 1.41l-6.36 6.37a1 1 0 0 1-1.42 0L4.93 9.34a1 1 0 0 1 0-1.41z"></path>
              </svg>
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center flex-1 mx-2">
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Playing from Playlist</h2>
          <h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">Chill ☕️ songs</h3>
        </div>

        <button 
          className="text-neutral-400 hover:text-white transition-colors"
          title="More options"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path>
            </svg>
          </div>
        </button>
      </div>

      <div className="flex flex-col h-full gap-6">`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
