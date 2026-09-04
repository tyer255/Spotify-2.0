const fs = require('fs');
let code = fs.readFileSync('src/components/Player/FullscreenPlayer.tsx', 'utf8');

const regex = /<img\s*src=\{artistImage \|\| artworkUrl \|\| undefined\}\s*alt=\{track\.artist\}\s*className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"\s*\/>/m;
const replacement = `{artistImage ? (
                    <img 
                      src={artistImage} 
                      alt={track.artist} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center opacity-60">
                      <svg viewBox="0 0 24 24" className="w-24 h-24 text-white/20 fill-current"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                  )}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/Player/FullscreenPlayer.tsx', code);
