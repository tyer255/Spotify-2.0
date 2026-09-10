const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<div className="p-4 pt-1 z-20">\s*<p className="font-bold text-white text-lg">\{track.artist\}<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/aside>/,
`<div className="p-4 pt-1 z-20">
               <p className="font-bold text-white text-lg">{track.artist}</p>
             </div>
          </div>
        </div>
    </aside>`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
