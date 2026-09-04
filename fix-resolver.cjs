const fs = require('fs');
let file = fs.readFileSync('src/lib/scanner/pipeline/MusicResolver.ts', 'utf8');

file = file.replace("let searchQuery = 'Top Hits';", "let searchQuery = '';");
file = file.replace(
    "if (!spotifyId.match(/^[0-7]+$/) && spotifyId.length > 3) {",
    "if (!searchQuery && !spotifyId.match(/^[0-7]+$/) && spotifyId.length > 3) {"
);

file = file.replace(
    "try {\n      const res = await api.search(searchQuery);",
    "if (!searchQuery) return null;\n    try {\n      const res = await api.search(searchQuery);"
);

fs.writeFileSync('src/lib/scanner/pipeline/MusicResolver.ts', file);
