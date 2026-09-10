const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<div className="min-w-0 flex-1">([\s\S]*?)<\/div>/,
`<div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-white truncate hover:underline cursor-pointer">
              {track.title}
            </h1>
            <p className="text-sm lg:text-base text-neutral-400 truncate hover:underline cursor-pointer mt-0.5">
              {track.artist}
            </p>
          </div>`);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
