const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<div className="mt-4 bg-\[#2b2b2b\] rounded-xl p-4 flex flex-col h-auto cursor-pointer hover:bg-\[#333333\] transition-colors border border-white\/5 relative overflow-hidden group">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/aside>/,
`<div className="bg-[#2b2b2b] rounded-xl flex flex-col h-auto cursor-pointer hover:bg-[#333333] transition-colors border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 z-20">
                <button className="px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm border border-white/10">
                  <span className="text-white text-[11px] font-bold">Follow</span>
                </button>
             </div>
             
             <div className="w-full aspect-[16/9] bg-neutral-800 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#2b2b2b] via-transparent to-black/20 z-10"></div>
               <h3 className="absolute top-4 left-4 font-bold text-white z-10 text-sm">About the artist</h3>
               <img src={track.images?.large || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Artist" />
             </div>
             
             <div className="p-4 pt-1 z-20">
               <p className="font-bold text-white text-lg">{track.artist}</p>
             </div>
          </div>
        </div>
      </div>
    </aside>`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
