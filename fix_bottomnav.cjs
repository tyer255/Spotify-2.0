const fs = require('fs');
const path = './src/components/Navigation/BottomNav.tsx';
let content = fs.readFileSync(path, 'utf8');

const classRegex = /className={`fixed z-40 liquid-glass-dock[^`]+`}/;
const newClass = 'className={`fixed z-40 liquid-glass-dock flex items-center justify-around px-2 select-none transition-all duration-500 ease-in-out bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-white/10 md:bottom-8 md:rounded-full md:border md:border-white/10 md:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] md:px-4 md:py-1 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] md:h-[72px] md:pb-0 md:w-[400px] md:max-w-[90vw] md:mx-auto ${hasTrack ? \'md:left-0 md:right-[50vw] lg:right-[450px] md:translate-x-0\' : \'md:left-0 md:right-0\'}`}';

content = content.replace(classRegex, newClass);
fs.writeFileSync(path, content);
