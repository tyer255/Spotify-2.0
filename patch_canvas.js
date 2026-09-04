import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  private static async resolveSpotifyIdFromDDG(title: string, artist: string): Promise<string | null> {
    if (!title) return null;
    
    // Check hardcoded map first to avoid proxy/DDG bans for popular songs
    const hardcoded = this.getHardcodedId(title, artist);
    if (hardcoded) return hardcoded;

    // Try Spotify API first if configured
    try {
        const provider = new SpotifyMusicProvider();
        if (provider.isConfigured()) {
            const query = \`\${title} \${artist || ''}\`.trim();
            const res = await provider.search(query);
            if (res && res.tracks && res.tracks.length > 0) {
                return res.tracks[0].id;
            }
        }
    } catch (e: any) {
        console.warn('[CanvasService] Spotify API fallback search failed:', e?.message || e);
    }

    try {
        const query = encodeURIComponent(\`\${title} \${artist || ''}\`.trim());
        
        // 1. Deezer Search
        const deezerSearchUrl = \`https://api.deezer.com/search?q=\${query}&limit=1\`;
        let res = await fetch(deezerSearchUrl, { signal: AbortSignal.timeout(2000) }).catch(() => null);
        if (!res || !res.ok) return null;
        let data: any = await res.json().catch(() => ({}));
        
        if (!data.data || data.data.length === 0) return null;
        const deezerTrackId = data.data[0].id;
        
        // 2. Deezer Track ISRC
        res = await fetch(\`https://api.deezer.com/track/\${deezerTrackId}\`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
        if (!res || !res.ok) return null;
        data = await res.json().catch(() => ({}));
        
        const isrc = data.isrc;
        if (!isrc) return null;
        
        // 3. MusicBrainz Spotify URL Resolution
        res = await fetch(\`https://musicbrainz.org/ws/2/isrc/\${isrc}?inc=url-rels&fmt=json\`, {
            headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
            signal: AbortSignal.timeout(2500)
        }).catch(() => null);
        
        if (!res || !res.ok) return null;
        data = await res.json().catch(() => ({}));
        
        if (data.recordings && data.recordings.length > 0) {
            for (const rec of data.recordings) {
                if (rec.relations) {
                    for (const rel of rec.relations) {
                        if (rel.url && rel.url.resource && rel.url.resource.includes('spotify.com/track/')) {
                            const match = rel.url.resource.match(/track\\/([a-zA-Z0-9]{22})/);
                            if (match && match[1]) {
                                return match[1];
                            }
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.warn("[SpotifyCanvasService] Deezer/MB Spotify ID resolve failed", e);
    }
    return null;
  }`;

const replace1 = `  private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string | null> {
    if (!title) return null;
    
    // Check hardcoded map first to avoid proxy/DDG bans for popular songs
    const hardcoded = this.getHardcodedId(title, artist);
    if (hardcoded) return hardcoded;

    // Try Spotify API first if configured
    try {
        const provider = new SpotifyMusicProvider();
        if (provider.isConfigured()) {
            const query = \`\${title} \${artist || ''}\`.trim();
            const res = await provider.search(query);
            if (res && res.tracks && res.tracks.length > 0) {
                return res.tracks[0].id;
            }
        }
    } catch (e: any) {
        console.warn('[CanvasService] Spotify API fallback search failed:', e?.message || e);
    }

    try {
        const query = \`\${title} \${artist || ''} spotify\`.trim();
        
        // Dynamic import yt-search
        const ytSearch = (await import('yt-search')).default;
        const ytResult = await ytSearch(query);
        
        if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
            // Check top 5 videos for Spotify links in description/page
            const topVideos = ytResult.videos.slice(0, 5);
            for (const v of topVideos) {
                try {
                    const res = await fetch(\`https://www.youtube.com/watch?v=\${v.videoId}\`, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                        signal: AbortSignal.timeout(3000)
                    });
                    if (!res.ok) continue;
                    const html = await res.text();
                    const spot = html.match(/open\\.spotify\\.com(?:%2F|\\\\\\/|\\/)track(?:%2F|\\\\\\/|\\/)([a-zA-Z0-9]{22})/);
                    if (spot && spot[1]) {
                        console.log(\`[CanvasService] YouTube mapping success for \${title}: \${spot[1]}\`);
                        return spot[1];
                    }
                } catch (e) {
                    continue;
                }
            }
        }
    } catch(e) {
        console.warn("[SpotifyCanvasService] YouTube Spotify ID resolve failed", e);
    }
    return null;
  }`;

code = code.replace(target1, replace1);
code = code.replace("const resolvedId = await this.resolveSpotifyIdFromDDG(input.title, input.artist || '');", "const resolvedId = await this.resolveSpotifyIdDynamically(input.title, input.artist || '');");

fs.writeFileSync(path, code);
console.log("Patched successfully");
