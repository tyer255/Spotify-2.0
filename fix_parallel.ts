import fs from 'fs';

let content = fs.readFileSync('server/services/spotifyCanvasService.ts', 'utf8');

// I'll just rewrite the whole resolveSpotifyIdDynamically function to use Promise.allSettled
const newFunc = `  private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string[]> {
    if (!title) return [];
    
    const ids: string[] = [];
    const hardcoded = this.getHardcodedId(title, artist);
    if (hardcoded) {
        ids.push(hardcoded);
        return ids;
    }

    try {
        const provider = new SpotifyMusicProvider();
        if (provider.isConfigured()) {
            const query = \`\${title} \${artist || ''}\`.trim();
            const res = await provider.search(query);
            if (res && res.tracks && res.tracks.length > 0) {
                for (const t of res.tracks.slice(0, 3)) if (t.id) ids.push(t.id);
                if (ids.length > 0) return ids;
            }
        }
    } catch (e: any) { }

    // PARALLELIZE FALLBACKS TO AVOID 15-SECOND LATENCY
    const promises = [];

    // YouTube Strict
    promises.push((async () => {
        try {
            const ytSearch = (await import('yt-search')).default;
            const query = \`\${title} \${artist || ''} "open.spotify.com/track"\`.trim();
            const res = await ytSearch(query);
            if (res?.videos?.length > 0) {
                for (const v of res.videos.slice(0, 3)) {
                    try {
                        const htmlRes = await fetch(\`https://www.youtube.com/watch?v=\${v.videoId}\`, {
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            signal: AbortSignal.timeout(3000)
                        });
                        const html = await htmlRes.text();
                        const spot = html.match(/open\\.spotify\\.com(?:%2F|\\\\\\/|\\/)track(?:%2F|\\\\\\/|\\/)([a-zA-Z0-9]{22})/);
                        if (spot && spot[1]) return spot[1];
                    } catch (e) {}
                }
            }
        } catch (e) {}
        return null;
    })());

    // YouTube Loose
    promises.push((async () => {
        try {
            const ytSearch = (await import('yt-search')).default;
            const query = \`\${title} \${artist || ''} spotify\`.trim();
            const res = await ytSearch(query);
            if (res?.videos?.length > 0) {
                for (const v of res.videos.slice(0, 3)) {
                    try {
                        const htmlRes = await fetch(\`https://www.youtube.com/watch?v=\${v.videoId}\`, {
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                            signal: AbortSignal.timeout(3000)
                        });
                        const html = await htmlRes.text();
                        const spot = html.match(/open\\.spotify\\.com(?:%2F|\\\\\\/|\\/)track(?:%2F|\\\\\\/|\\/)([a-zA-Z0-9]{22})/);
                        if (spot && spot[1]) return spot[1];
                    } catch (e) {}
                }
            }
        } catch (e) {}
        return null;
    })());

    // MusicBrainz
    promises.push((async () => {
        try {
            const mbQuery = encodeURIComponent(\`\${title} AND artist:\${artist || ''}\`.trim());
            const mbRes = await fetch(\`https://musicbrainz.org/ws/2/recording/?query=\${mbQuery}&fmt=json\`, {
                headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
                signal: AbortSignal.timeout(4000)
            });
            if (mbRes.ok) {
                const data: any = await mbRes.json();
                for (const rec of (data.recordings || []).slice(0, 2)) {
                    const relRes = await fetch(\`https://musicbrainz.org/ws/2/recording/\${rec.id}?inc=url-rels&fmt=json\`, {
                        headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
                        signal: AbortSignal.timeout(3000)
                    }).catch(() => null);
                    if (relRes && relRes.ok) {
                        const relData: any = await relRes.json();
                        const urls = relData.relations?.filter((r: any) => r.url?.resource?.includes('spotify.com/track/')) || [];
                        if (urls.length > 0) {
                            const match = urls[0].url.resource.match(/track\\/([a-zA-Z0-9]{22})/);
                            if (match && match[1]) return match[1];
                        }
                    }
                }
            }
        } catch (e) {}
        return null;
    })());

    // Deezer -> MusicBrainz
    promises.push((async () => {
        try {
            const dzQuery = encodeURIComponent(\`\${title} \${artist || ''}\`.trim());
            const dzRes = await fetch(\`https://api.deezer.com/search?q=\${dzQuery}&limit=1\`, { signal: AbortSignal.timeout(4000) });
            if (dzRes.ok) {
                const dzData: any = await dzRes.json();
                if (dzData.data?.length > 0) {
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
                                        if (match && match[1]) return match[1];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {}
        return null;
    })());

    const results = await Promise.allSettled(promises);
    for (const res of results) {
        if (res.status === 'fulfilled' && res.value && !ids.includes(res.value)) {
            ids.push(res.value);
        }
    }

    return ids;
  }`;

const regex = /private static async resolveSpotifyIdDynamically[\s\S]*?return ids;\n  }/;
content = content.replace(regex, newFunc);
fs.writeFileSync('server/services/spotifyCanvasService.ts', content);
