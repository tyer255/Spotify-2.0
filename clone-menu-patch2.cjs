const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/CreateActionMenu.tsx', 'utf8');
code = code.replace(/onClick=\{\(\) => \{ onClose\(\); onNavigate && onNavigate\(\{ type: 'clone-playlist' \} as any\); \}\}/, 
"onClick={() => { onClose(); (props as any).onSelectClonePlaylist?.(); }}");
// Actually, I can just change the props of CreateActionMenu
code = code.replace(/onSelectCreatePlaylist: \(\) => void;/, "onSelectCreatePlaylist: () => void;\n  onSelectClonePlaylist?: () => void;");
code = code.replace(/onSelectCreatePlaylist,\n\}\) => \{/, "onSelectCreatePlaylist,\n  onSelectClonePlaylist,\n}) => {");
code = code.replace(/onClick=\{\(\) => \{ onClose\(\); onNavigate && onNavigate\(\{ type: 'clone-playlist' \} as any\); \}\}/, "onClick={() => { onClose(); onSelectClonePlaylist && onSelectClonePlaylist(); }}");
fs.writeFileSync('src/components/Navigation/CreateActionMenu.tsx', code);
