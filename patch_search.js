import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `    try {
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
    }`;

const replace1 = `    try {
        const query1 = \`\${title} \${artist || ''} spotify\`.trim();
        
        // Dynamic import yt-search
        const ytSearch = (await import('yt-search')).default;
        
        const checkVideosForSpotifyId = async (videos: any[]) => {
            for (const v of videos) {
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
            return null;
        };

        // Strategy 1: Search normally (e.g., song title + artist + spotify)
        let ytResult = await ytSearch(query1);
        if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
            const id1 = await checkVideosForSpotifyId(ytResult.videos.slice(0, 3));
            if (id1) return id1;
        }
        
        // Strategy 2: Search specifically for YouTube videos that contain Spotify tracking links!
        const query2 = \`\${title} \${artist || ''} "open.spotify.com/track"\`.trim();
        ytResult = await ytSearch(query2);
        if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
            const id2 = await checkVideosForSpotifyId(ytResult.videos.slice(0, 3));
            if (id2) return id2;
        }
    } catch(e) {
        console.warn("[SpotifyCanvasService] YouTube Spotify ID resolve failed", e);
    }`;

code = code.replace(target1, replace1);

fs.writeFileSync(path, code);
console.log("Patched Strategy successfully");
