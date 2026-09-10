const fs = require('fs');

let trackRow = fs.readFileSync('src/components/Common/TrackRow.tsx', 'utf8');

// Replace container classes
trackRow = trackRow.replace(
  /className=\{`group relative flex items-center justify-between px-3 py-1\.5 hover:bg-white\/5 transition-colors cursor-pointer \$\{/,
  "className={`group relative grid grid-cols-[minmax(0,1fr)_auto] ${showAlbum ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(120px,150px)]' : 'md:grid-cols-[minmax(0,1fr)_minmax(120px,150px)]'} items-center gap-3 px-3 py-1.5 hover:bg-white/5 transition-colors cursor-pointer ${"
);

// Replace title wrapper
trackRow = trackRow.replace(
  /<div className="flex items-center gap-3 min-w-0 flex-1">/,
  '<div className="flex items-center gap-3 min-w-0">'
);

// Replace album wrapper
trackRow = trackRow.replace(
  /className="hidden md:block w-1\/3 text-\[13px\] text-neutral-400 truncate hover:text-white hover:underline px-4"/,
  'className="hidden md:block text-[13px] text-neutral-400 truncate hover:text-white hover:underline pr-4"'
);

// Replace right actions wrapper
trackRow = trackRow.replace(
  /<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">/,
  '<div className="flex items-center justify-end gap-2 sm:gap-4 ml-auto">'
);

fs.writeFileSync('src/components/Common/TrackRow.tsx', trackRow, 'utf8');

let playlistView = fs.readFileSync('src/views/PlaylistView.tsx', 'utf8');

// Replace header
playlistView = playlistView.replace(
  /<div className="hidden sm:flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-transparentborder-white\/10 mb-2">[\s\S]*?<\/div>\s*<\/div>/,
  `<div className="hidden md:grid grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(120px,150px)] items-center gap-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/10 mb-2">
       <div className="flex items-center">
        <span className="ml-[52px]">Title</span>
       </div>
       <div className="flex items-center">
        <span>Album</span>
       </div>
       <div className="flex items-center justify-end pr-2">
        <Clock className="w-4 h-4 mr-[1.125rem]" />
       </div>
      </div>`
);

fs.writeFileSync('src/views/PlaylistView.tsx', playlistView, 'utf8');
