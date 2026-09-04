import fs from 'fs';

let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');
content = content.replace(
    /if \(hardcoded\) ids\.push\(hardcoded\);/,
    "if (hardcoded) {\n        ids.push(hardcoded);\n        return ids;\n    }"
);

content = content.replace(
    /for \(const t of res\.tracks\.slice\(0, 3\)\) if \(t\.id\) ids\.push\(t\.id\);\n            }/,
    "for (const t of res.tracks.slice(0, 3)) if (t.id) ids.push(t.id);\n                if (ids.length > 0) return ids;\n            }"
);

fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
