const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// The replacement was slightly messed up, let's fix it by completely replacing the header section
code = code.replace(/<div className="mt-4 flex-1">([\s\S]*?)<\/aside>/,
`<div className="mt-4 flex-1">
          <div className="bg-[#5a1c3e] rounded-xl p-4 flex flex-col h-auto min-h-[300px] cursor-pointer hover:bg-[#6c224a] transition-colors border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Lyrics preview</h3>
              <button className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <p className="text-xl font-bold text-white leading-tight">Chaand mera dil, chaand mera dil</p>
              <p className="text-xl font-bold text-white/50 leading-tight">Tu sitaaron bhara raat ka aasmaan</p>
              <p className="text-xl font-bold text-white/50 leading-tight">Chaand mera dil, chaand mera dil</p>
              <p className="text-xl font-bold text-white/50 leading-tight">Jo kabhi na dhale, chaahe</p>
            </div>

            <div className="mt-6 flex justify-start">
              <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition-transform">
                Show lyrics
              </button>
            </div>
          </div>
          
          <div className="mt-4 bg-[#2b2b2b] rounded-xl p-4 flex flex-col h-auto cursor-pointer hover:bg-[#333333] transition-colors border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4">
                <button className="p-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm">
                  <span className="text-white text-xs font-bold px-2">Follow</span>
                </button>
             </div>
             <h3 className="font-bold text-white z-10">About the artist</h3>
             
             {/* Artist content layout matching screenshot */}
             <div className="mt-2 w-full aspect-[2/1] bg-neutral-800 rounded-lg overflow-hidden relative">
               <img src={track.images?.large || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Artist" />
             </div>
          </div>
        </div>
      </div>
    </aside>`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
