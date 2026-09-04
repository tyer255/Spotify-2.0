const fs = require('fs');

// 1. Update ContextMenu.tsx
let contextMenu = fs.readFileSync('src/components/Common/ContextMenu.tsx', 'utf8');

contextMenu = contextMenu.replace(
  /onDeleteFromHistory\?: \(\) => void;\n\s*showRemoveFromHistory\?: boolean;/,
  `onDeleteFromHistory?: () => void;
  showRemoveFromHistory?: boolean;
  onRemoveFromPlaylist?: () => void;`
);

contextMenu = contextMenu.replace(
  /onDeleteFromHistory,\n\s*showRemoveFromHistory,/,
  `onDeleteFromHistory,
  showRemoveFromHistory,
  onRemoveFromPlaylist,`
);

const removePlaylistJSX = `
                {onRemoveFromPlaylist && (
                  <button
                    onClick={() => {
                      onRemoveFromPlaylist();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors text-left text-red-400 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-400/10 flex items-center justify-center group-hover:bg-red-400/20">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Remove from this playlist</span>
                  </button>
                )}
`;

if (!contextMenu.includes('Trash2')) {
  contextMenu = contextMenu.replace(/import \{([\s\S]*?)Heart([\s\S]*?)\} from 'lucide-react';/, "import {$1Heart, Trash2$2} from 'lucide-react';");
}

contextMenu = contextMenu.replace(
  /\{canRemoveFromHistory && \(/,
  `${removePlaylistJSX}
                {canRemoveFromHistory && (`
);

fs.writeFileSync('src/components/Common/ContextMenu.tsx', contextMenu);

// 2. Update TrackRow.tsx
let trackRow = fs.readFileSync('src/components/Common/TrackRow.tsx', 'utf8');

trackRow = trackRow.replace(
  /onNavigate\?: \(view: ViewState\) => void;\n\s*variant\?: 'standard' \| 'artist-popular';/,
  `onNavigate?: (view: ViewState) => void;
  variant?: 'standard' | 'artist-popular';
  onRemoveFromPlaylist?: () => void;`
);

trackRow = trackRow.replace(
  /onNavigate,\n\s*variant = 'standard',\n\}\) => \{/,
  `onNavigate,
  variant = 'standard',
  onRemoveFromPlaylist,
}) => {`
);

trackRow = trackRow.replace(
  /<ContextMenu\n\s*track=\{track\}\n\s*isOpen=\{showMenu\}\n\s*onClose=\{\(\) => setShowMenu\(false\)\}\n\s*onNavigate=\{onNavigate\}\n\s*\/>/,
  `<ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
      />`
);

fs.writeFileSync('src/components/Common/TrackRow.tsx', trackRow);

// 3. Update PlaylistView.tsx
let playlistView = fs.readFileSync('src/views/PlaylistView.tsx', 'utf8');

playlistView = playlistView.replace(
  /<TrackRow\n\s*track=\{track\}\n\s*index=\{idx\}\n\s*queueContext=\{playlist\.tracks\}\n\s*onNavigate=\{onNavigate\}\n\s*\/>/,
  `<TrackRow
                    track={track}
                    index={idx}
                    queueContext={playlist.tracks}
                    onNavigate={onNavigate}
                    onRemoveFromPlaylist={playlist.id !== 'liked-songs' && playlist.id !== 'downloaded-tracks' && playlist.id !== 'new-episodes' ? () => handleRemoveTrack(track.id) : undefined}
                  />`
);

fs.writeFileSync('src/views/PlaylistView.tsx', playlistView);
