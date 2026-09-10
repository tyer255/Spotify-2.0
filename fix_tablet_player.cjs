const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  /<h2 className="text-sm font-bold text-neutral-100 truncate">Now Playing<\/h2>/,
  `<div>
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Playing from Playlist</h2>
          <h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">Chill ☕️ songs</h3>
        </div>`
);

code = code.replace(
  /onClick=\{\(\) => setIsFullscreenOpen\(true\)\}\s*className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white\/10 transition-colors"\s*title="Fullscreen Player"\s*>\s*<Maximize2 className="w-4 h-4" \/>/,
  `onClick={() => setIsFullscreenOpen(true)}
          className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Fullscreen Player"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M5.5 5.5v13h13v-13h-13zM4 4h16v16H4V4z"></path>
              <path d="M9 13.5l4-3v6l-4-3z"></path>
            </svg>
          </div>`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
