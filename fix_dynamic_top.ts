import fs from 'fs';

let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');

const regex = /private static async resolveSpotifyIdDynamically\(title: string, artist: string\): Promise<string\[\]> \{\n    if \(!title\) return \[\];\n    \n    const ids: string\[\] = \[\];/;

const newStart = `  private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string[]> {
    if (!title) return [];
    
    const originalTitle = title;
    title = this.cleanTitle(title);
    
    const ids: string[] = [];`;

content = content.replace(regex, newStart);
fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
