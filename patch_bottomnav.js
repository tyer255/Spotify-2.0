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
const oldClass = /className="fixed bottom-0 left-0 md:right-\[50vw\] lg:right-\[450px\] z-40 liquid-glass-dock flex items-center justify-around px-2 select-none"/;
const newClass = 'className={`fixed z-40 liquid-glass-dock flex items-center justify-around px-2 select-none transition-all duration-500 ease-in-out bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-white/10 md:w-auto md:min-w-[420px] md:bottom-8 md:rounded-full md:border md:border-white/10 md:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] md:px-4 md:py-1 ${hasTrack ? \'md:left-[25vw] lg:left-[calc(50vw-225px)] md:right-auto md:-translate-x-1/2\' : \'md:left-1/2 md:right-auto md:-translate-x-1/2\'}`}';
content = content.replace(oldClass, newClass);

// Remove inline style that hardcodes height and padding-bottom for md+
const oldStyle = /style=\{\{\s*height: 'calc\(4rem \+ env\(safe-area-inset-bottom, 0px\)\)',\s*paddingBottom: 'env\(safe-area-inset-bottom, 0px\)'\s*\}\}/;
const newStyle = 'style={{ height: \'calc(4rem + env(safe-area-inset-bottom, 0px))\', paddingBottom: \'env(safe-area-inset-bottom, 0px)\' }}';
// Actually, I can conditionally apply style or just use CSS.
// React inline styles don't easily do media queries. Let's do this:
// style={{ height: 'var(--bottom-nav-height)' }} and define it, or just use tailwind classes.
// Wait, `md:h-16 md:pb-0` in className can override inline styles? No, inline style has priority.
// So let's conditionally set style if we can. But window.innerWidth is not reactive.
// Let's just remove height from style and put it in Tailwind!
// `h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:h-16 pb-[env(safe-area-inset-bottom,0px)] md:pb-0`

const twStyleClass = 'h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] md:h-[72px] md:pb-0';
content = content.replace(newClass, newClass.replace('md:py-1', 'md:py-1 ' + twStyleClass));
content = content.replace(oldStyle, '');

fs.writeFileSync(path, content);
