const fs = require('fs');
let code = fs.readFileSync('src/views/PlaylistView.tsx', 'utf8');
code = code.replace(/setEditTitle\(fromCtx\.title\)/g, "setEditTitle(fromCtx.title || '')");
code = code.replace(/setEditTitle\(res\.data\.title\)/g, "setEditTitle(res.data.title || '')");
code = code.replace(/setEditTitle\(localFound\.title\)/g, "setEditTitle(localFound.title || '')");
code = code.replace(/value=\{editTitle\}/g, "value={editTitle || ''}");
code = code.replace(/value=\{editDesc\}/g, "value={editDesc || ''}");
fs.writeFileSync('src/views/PlaylistView.tsx', code);
