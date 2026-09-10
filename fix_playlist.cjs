const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/Sidebar.tsx', 'utf8');

// Fix playlists title
code = code.replace(/<span className="text-\[11px\] font-bold uppercase tracking-wider text-neutral-400 px-3">\s*Playlists\s*<\/span>/, 
  `<span className="hidden xl:block text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-2 mt-2">Playlists</span>`);

// Fix playlist mapping
code = code.replace(/className={\`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all cursor-pointer \${([\s\S]*?)}\`}\s*>\s*\{pl\.title\}\s*<\/button>/g,
  `className={\`w-full flex items-center justify-center xl:justify-start gap-0 xl:gap-3 px-0 xl:px-3 py-2 rounded-lg text-xs transition-all cursor-pointer \${$1}\`}
            >
              <div className="w-8 h-8 rounded-md bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                <span className="text-sm font-bold text-neutral-300">{pl.title.charAt(0).toUpperCase()}</span>
              </div>
              <span className="truncate hidden xl:block">{pl.title}</span>
            </button>`);

// Fix premium ACTIVE badge
code = code.replace(/<div className="flex items-center justify-between flex-1">/g, 
  `<div className="hidden xl:flex items-center justify-between flex-1">`);

fs.writeFileSync('src/components/Navigation/Sidebar.tsx', code);
