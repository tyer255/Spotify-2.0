import fs from 'fs';

let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');

const regex = /private static async resolveSpotifyIdDynamically[\s\S]*?return ids;\n  }/;
let match = content.match(regex);
if (match) {
    let func = match[0];
    
    // Replace title with cleaned title in query strings
    func = func.replace(/const query = \`\\\$\\{title\\} /g, 'const cTitle = this.cleanTitle(title);\n            const query = \`\${cTitle} ');
    func = func.replace(/const mbQuery = encodeURIComponent\(\`\\\$\\{title\\}/, 'const cTitle = this.cleanTitle(title);\n            const mbQuery = encodeURIComponent(\`\${cTitle}');
    func = func.replace(/const dzQuery = encodeURIComponent\(\`\\\$\\{title\\}/, 'const cTitle = this.cleanTitle(title);\n            const dzQuery = encodeURIComponent(\`\${cTitle}');
    
    content = content.replace(regex, func);
    fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
}
