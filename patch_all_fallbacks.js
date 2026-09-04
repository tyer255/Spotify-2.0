import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `    try {
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

const replace1 = `    // We will use 4 powerful strategies to find the Spotify ID without needing a Premium API key

    // Strategy 1 & 2: YouTube Search Metadata Extractor
    try {
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
                } catch (e) { continue; }
            }
            return null;
        };

        // Strict query targeting Spotify track URLs
        const query2 = \`\${title} \${artist || ''} "open.spotify.com/track"\`.trim();
        let ytResult = await ytSearch(query2);
        if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
            const id2 = await checkVideosForSpotifyId(ytResult.videos.slice(0, 3));
            if (id2) return id2;
        }

        // Loose query
        const query1 = \`\${title} \${artist || ''} spotify\`.trim();
        ytResult = await ytSearch(query1);
        if (ytResult && ytResult.videos && ytResult.videos.length > 0) {
            const id1 = await checkVideosForSpotifyId(ytResult.videos.slice(0, 3));
            if (id1) return id1;
        }
    } catch(e) {
        console.warn("[CanvasService] YouTube fallback failed", e);
    }

    // Strategy 3: Direct MusicBrainz search
    try {
        const mbQuery = encodeURIComponent(\`\${title} AND artist:\${artist || ''}\`.trim());
        const mbRes = await fetch(\`https://musicbrainz.org/ws/2/recording/?query=\${mbQuery}&fmt=json\`, {
            headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
            signal: AbortSignal.timeout(4000)
        });
        if (mbRes.ok) {
            const data: any = await mbRes.json();
            for (const rec of (data.recordings || []).slice(0, 3)) {
                const relRes = await fetch(\`https://musicbrainz.org/ws/2/recording/\${rec.id}?inc=url-rels&fmt=json\`, {
                    headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
                    signal: AbortSignal.timeout(4000)
                }).catch(() => null);
                
                if (relRes && relRes.ok) {
                    const relData: any = await relRes.json();
                    const urls = relData.relations?.filter((r: any) => r.url?.resource?.includes('spotify.com/track/')) || [];
                    if (urls.length > 0) {
                        const match = urls[0].url.resource.match(/track\\/([a-zA-Z0-9]{22})/);
                        if (match && match[1]) {
                            console.log(\`[CanvasService] MusicBrainz mapping success for \${title}: \${match[1]}\`);
                            return match[1];
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.warn("[CanvasService] MusicBrainz fallback failed");
    }

    // Strategy 4: Deezer -> ISRC -> MusicBrainz
    try {
        const dzQuery = encodeURIComponent(\`\${title} \${artist || ''}\`.trim());
        const dzRes = await fetch(\`https://api.deezer.com/search?q=\${dzQuery}&limit=1\`, { signal: AbortSignal.timeout(4000) });
        if (dzRes.ok) {
            const dzData: any = await dzRes.json();
            if (dzData.data && dzData.data.length > 0) {
                const trRes = await fetch(\`https://api.deezer.com/track/\${dzData.data[0].id}\`, { signal: AbortSignal.timeout(4000) });
                if (trRes.ok) {
                    const trData: any = await trRes.json();
                    if (trData.isrc) {
                        const relRes = await fetch(\`https://musicbrainz.org/ws/2/isrc/\${trData.isrc}?inc=url-rels&fmt=json\`, {
                            headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
                            signal: AbortSignal.timeout(4000)
                        });
                        if (relRes.ok) {
                            const relData: any = await relRes.json();
                            for (const rec of (relData.recordings || [])) {
                                const urls = rec.relations?.filter((r: any) => r.url?.resource?.includes('spotify.com/track/')) || [];
                                if (urls.length > 0) {
                                    const match = urls[0].url.resource.match(/track\\/([a-zA-Z0-9]{22})/);
                                    if (match && match[1]) {
                                        console.log(\`[CanvasService] Deezer->MB mapping success for \${title}: \${match[1]}\`);
                                        return match[1];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch(e) {
        console.warn("[CanvasService] Deezer fallback failed");
    }`;

code = code.replace(target1, replace1);

fs.writeFileSync(path, code);
console.log("Patched 4 Strategies successfully");
