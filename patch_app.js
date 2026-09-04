import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove import
content = content.replace(/import \{ ClonePlaylistModal \} from '.\/components\/Common\/ClonePlaylistModal';\n/, '');

// Remove ClonePlaylistModal prop from CreateActionMenu
content = content.replace(/onSelectClonePlaylist=\{.*?\}\n?\s*/g, '');

// Remove ClonePlaylistModal rendering
content = content.replace(/<ClonePlaylistModal[\s\S]*?\/>\n?\s*/, '');

fs.writeFileSync('src/App.tsx', content);
console.log('Removed clone playlist from App.tsx');
