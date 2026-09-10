const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Also add down arrow next to the new fullscreen icon, and MoreVertical to the right
code = code.replace(
  /<div className="min-w-0 flex-1">([\s\S]*?)<\/div>/,
  `<div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-white truncate hover:underline cursor-pointer">
              Chaand Mera Dil - Title Track
            </h1>
            <p className="text-sm lg:text-base text-neutral-400 truncate hover:underline cursor-pointer mt-0.5">
              Sachin-Jigar, Faheem Abdullah, Amitabh Bhattacharya
            </p>
          </div>`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
