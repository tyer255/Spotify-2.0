const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/CreateActionMenu.tsx', 'utf8');

const newOption = `
            {/* 1.5 Clone Playlist Option */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.2 }}
              onClick={() => { onClose(); onNavigate && onNavigate({ type: 'clone-playlist' } as any); }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800/90 border border-white/10 flex items-center justify-center text-neutral-200 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-neutral-800 transition-all flex-shrink-0 shadow-md">
                <Layers className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  Clone Playlist
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug truncate">
                  Import a playlist from Spotify via URL
                </p>
              </div>
            </motion.button>
`;

code = code.replace(/\{\/\* 2\. Collaborative Playlist Option/, `${newOption}\n            {/* 2. Collaborative Playlist Option`);

fs.writeFileSync('src/components/Navigation/CreateActionMenu.tsx', code);
