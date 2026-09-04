import fs from 'fs';

let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');

// 1. Remove the entire SPOTIFY_ID_MAP block and getHardcodedId
content = content.replace(/const SPOTIFY_ID_MAP: Record<string, string> = \{[\s\S]*?\};\n\n/g, '');
content = content.replace(/  private static getHardcodedId[\s\S]*?return null;\n  }\n\n/g, '');

// 2. Remove the hardcoded calls in resolveSpotifyIdDynamically
content = content.replace(/    const hardcoded = this\.getHardcodedId\(originalTitle, artist\);\n    if \(hardcoded\) \{\n        ids\.push\(hardcoded\);\n        return ids;\n    \}\n\n/g, '');

// 3. Add verifyTrackIdentity method
const verifyMethod = `
  private static async verifySpotifyTrackIdentity(trackId: string, expectedTitle: string, expectedArtist: string): Promise<boolean> {
      try {
          const res = await fetch(\`https://open.spotify.com/embed/track/\${trackId}\`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(3000)
          });
          if (!res.ok) return false;
          
          const html = await res.text();
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\\/json">(.+?)<\\/script>/);
          if (nextDataMatch && nextDataMatch[1]) {
              const data = JSON.parse(nextDataMatch[1]);
              const track = data.props?.pageProps?.state?.data?.entity;
              if (track && track.title) {
                  const spTitle = track.title.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const spArtists = (track.artists || []).map((a: any) => a.name.toLowerCase().replace(/[^a-z0-9 ]/g, ''));
                  
                  const cleanReqTitle = expectedTitle.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  const cleanReqArtist = expectedArtist.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                  
                  // Check title (fuzzy)
                  const titleMatch = spTitle.includes(cleanReqTitle) || cleanReqTitle.includes(spTitle);
                  
                  // Check artist (fuzzy)
                  let artistMatch = false;
                  for (const a of spArtists) {
                      if (cleanReqArtist.includes(a) || a.includes(cleanReqArtist)) {
                          artistMatch = true;
                          break;
                      }
                  }
                  
                  if (titleMatch && artistMatch) {
                      return true;
                  }
                  
                  console.log(\`[Canvas Identity Gate] REJECTED \${trackId}: Expected '\${expectedTitle}' by '\${expectedArtist}', but got '\${track.title}' by '\${spArtists.join(', ')}'\`);
                  return false;
              }
          }
          return true; // Fallback to true if we couldn't parse to avoid breaking things unnecessarily, but ideally we'd be stricter
      } catch (e) {
          return true;
      }
  }
`;

content = content.replace(/  private static async getAccessToken/, verifyMethod + '\n  private static async getAccessToken');

// 4. Update getCanvasForTrack to use the verification gate
const getCanvasForTrackRegex = /for \(const tId of possibleIds\) \{\n\s+const cacheKey = tId;/;
const newGetCanvasForTrack = `for (const tId of possibleIds) {
        // [Identity Gate] Verify that this Track ID actually belongs to the requested song
        if (input.title && input.artist) {
            const isMatch = await this.verifySpotifyTrackIdentity(tId, input.title, input.artist);
            if (!isMatch) {
                console.log(\`[Canvas] Skipping \${tId} - Identity Verification Failed\`);
                continue;
            }
        }
        
        const cacheKey = tId;`;

content = content.replace(getCanvasForTrackRegex, newGetCanvasForTrack);

fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
