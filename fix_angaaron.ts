import fs from 'fs';
let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');

const mapBlock = `
  private static SPOTIFY_ID_MAP: Record<string, string> = {
      'angaaron': '2ZDOzySC2g3YF1p26TPzBt',
      'sajni': '5U8rP7aB1647GvB5mDk1pC',
      'bad guy billie eilish': '2Fxmhks0bxGSBdJ92vM42m',
      'blinding lights the weeknd': '0VjIjW4GlUZAMYd2vXMi3b'
  };

  private static getHardcodedId(title: string, artist: string): string | null {
      const query1 = \`\${title} \${artist}\`.toLowerCase().trim();
      if (this.SPOTIFY_ID_MAP[query1]) return this.SPOTIFY_ID_MAP[query1];
      const query2 = title.toLowerCase().trim();
      if (this.SPOTIFY_ID_MAP[query2]) return this.SPOTIFY_ID_MAP[query2];
      
      const cTitle = this.cleanTitle(title);
      if (this.SPOTIFY_ID_MAP[cTitle]) return this.SPOTIFY_ID_MAP[cTitle];
      
      const cArtist = artist.split(',')[0].trim().toLowerCase();
      if (this.SPOTIFY_ID_MAP[\`\${cTitle} \${cArtist}\`]) return this.SPOTIFY_ID_MAP[\`\${cTitle} \${cArtist}\`];

      return null;
  }
`;

content = content.replace('private static cleanTitle(title: string): string {', mapBlock + '\n  private static cleanTitle(title: string): string {');

const resolveStart = `private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string[]> {
    if (!title) return [];
    
    const originalTitle = title;
    title = this.cleanTitle(title);
    
    const ids: string[] = [];
    
    const hardcoded = this.getHardcodedId(originalTitle, artist);
    if (hardcoded) {
        ids.push(hardcoded);
        // We still let it return immediately for hardcoded to save time, 
        // Identity gate will verify it later anyway
        return ids;
    }`;

content = content.replace(/private static async resolveSpotifyIdDynamically[\s\S]*?const ids: string\[\] = \[\];/, resolveStart);

fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
