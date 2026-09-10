const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/Sidebar.tsx', 'utf8');

code = code.replace(
  /<SpotifyLogo size=\{36\} showText=\{true\} className="hidden xl:flex" \/>\s*<SpotifyLogo size=\{36\} showText=\{false\} className="flex xl:hidden" \/>/,
  `<div className="hidden xl:flex">
          <SpotifyLogo size={36} showText={true} />
        </div>
        <div className="flex xl:hidden">
          <SpotifyLogo size={36} showText={false} />
        </div>`
);

fs.writeFileSync('src/components/Navigation/Sidebar.tsx', code);
