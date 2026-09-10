const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Also add down arrow next to the new fullscreen icon, and MoreVertical to the right
code = code.replace(
  /<div className="flex items-center justify-between mb-4 px-1">([\s\S]*?)<\/div>/,
  `<div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullscreenOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Fullscreen Player"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M5.5 5.5v13h13v-13h-13zM4 4h16v16H4V4z"></path>
                <path d="M9 13.5l4-3v6l-4-3z"></path>
              </svg>
            </div>
          </button>
          
          <button 
            className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors hidden xl:flex"
            title="Close"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
              <path d="M4.93 7.93a1 1 0 0 1 1.41 0L12 13.59l5.66-5.66a1 1 0 1 1 1.41 1.41l-6.36 6.37a1 1 0 0 1-1.42 0L4.93 9.34a1 1 0 0 1 0-1.41z"></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center flex-1">
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Playing from Playlist</h2>
          <h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">Chill ☕️ songs</h3>
        </div>

        <button 
          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="More options"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
            <path d="M12 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path>
          </svg>
        </button>
      </div>`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
