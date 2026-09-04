const fs = require('fs');
let code = fs.readFileSync('src/components/Common/AlbumCard.tsx', 'utf8');

code = code.replace(
  /\{album\.images\?\.large \|\| album\.images\?\.medium \|\| album\.images\?\.small \? \(/g,
  "{album.images?.large || album.images?.medium || album.images?.small || (album as any).coverImage ? ("
);

code = code.replace(
  /album\.images\?\.large \|\|/g,
  "album.images?.large ||"
);

code = code.replace(
  /album\.images\?\.small/g,
  "album.images?.small || (album as any).coverImage"
);

fs.writeFileSync('src/components/Common/AlbumCard.tsx', code);
console.log('Patched AlbumCard');
