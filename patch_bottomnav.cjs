const fs = require('fs');
const path = './src/components/Navigation/BottomNav.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useUser import
if (!content.includes('useUser')) {
  content = content.replace("import { SpotifyLogo } from '../Common/SpotifyLogo';", "import { SpotifyLogo } from '../Common/SpotifyLogo';\nimport { useUser } from '../../context/UserContext';");
}

// 2. Add hook inside BottomNav
if (!content.includes('const { currentTrack } = useUser();')) {
  content = content.replace('const isHome = currentView.type', 'const { currentTrack } = useUser();\n  const hasTrack = !!currentTrack;\n\n  const isHome = currentView.type');
}

// 3. Update className and style
// Since I already edited it before, let's be careful. Let's just find `className="fixed bottom-0 ..."` or similar.
const classRegex = /className="[^"]*liquid-glass-dock[^"]*"/;
const newClass = 'className={`fixed z-40 liquid-glass-dock flex items-center justify-around px-2 select-none transition-all duration-500 ease-in-out bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-white/10 md:w-auto md:min-w-[420px] md:bottom-8 md:rounded-full md:border md:border-white/10 md:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] md:px-4 md:py-1 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] md:h-[72px] md:pb-0 ${hasTrack ? \'md:left-[25vw] lg:left-[calc(50vw-225px)] md:right-auto md:-translate-x-1/2\' : \'md:left-1/2 md:right-auto md:-translate-x-1/2\'}`}';
content = content.replace(classRegex, newClass);

// Remove inline style
const oldStyle = /style=\{\{[\s\S]*?\}\}/;
content = content.replace(oldStyle, '');

fs.writeFileSync(path, content);
