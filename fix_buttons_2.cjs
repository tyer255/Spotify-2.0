const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<Heart className=\{`w-6 h-6 transition-all \$\{isLiked \? 'text-emerald-500 fill-emerald-500 scale-105' : 'text-neutral-400 hover:text-white'\}\`\} \/>/,
  `<div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-black">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M10.814.5a1.658 1.658 0 0 1 2.372 0l2.512 2.572 3.595-.043a1.658 1.658 0 0 1 1.678 1.678l-.043 3.595 2.572 2.512c.667.65.667 1.722 0 2.372l-2.572 2.512.043 3.595a1.658 1.658 0 0 1-1.678 1.678l-3.595-.043-2.512 2.572a1.658 1.658 0 0 1-2.372 0l-2.512-2.572-3.595.043a1.658 1.658 0 0 1-1.678-1.678l.043-3.595L.5 13.186a1.658 1.658 0 0 1 0-2.372l2.572-2.512-.043-3.595a1.658 1.658 0 0 1 1.678-1.678l3.595.043L10.814.5zm6.584 9.12a1 1 0 0 0-1.414-1.413l-6.011 6.01-1.894-1.893a1 1 0 0 0-1.414 1.414l2.6 2.6a1 1 0 0 0 1.415 0l6.718-6.718z"></path>
              </svg>
            </div>`);

// Replace the previous play controls div
code = code.replace(/<div className="flex items-center justify-between w-full">([\s\S]*?)<div className="flex items-center gap-3 w-full">/,
`<div className="flex items-center justify-between w-full px-1">
          <button
            onClick={toggleShuffle}
            className={\`p-2 transition-colors \${shuffleEnabled ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}\`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={previousTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current translate-x-[2px]" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
          </div>
          <button
            onClick={toggleRepeat}
            className={\`p-2 transition-colors \${repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}\`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-between gap-3 w-full px-1">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M16 15H2v-1.5h14V15zm0-4.5H2V9h14v1.5zm-8.011 5.95H2V15h5.989v1.45zM22 6.5v11c0 .276-.224.5-.5.5h-4v-1.5h3.5v-10h-13V10H6.5V6.5c0-.276.224-.5.5-.5h14c.276 0 .5.224.5.5z"></path>
            </svg>
          </button>
          <button className="text-neutral-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M15 15.5c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path>
              <path d="M1.513 9.37A1 1 0 0 1 2.291 9h19.418a1 1 0 0 1 .979 1.208l-2.339 11a1 1 0 0 1-.978.792H4.63a1 1 0 0 1-.978-.792l-2.14-11a1 1 0 0 1 .001-.838zM2.686 11l1.913 9h14.802l1.913-9H2.686z"></path>
            </svg>
          </button>
        </div>`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
