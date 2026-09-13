
export interface ResolvedStream {
  url: string;
  fallbackUrls?: string[];
  duration?: number;
  source?: string;
  bitrate?: string;
  mimeType?: string;
  isDirectAudio?: boolean;
  isMediaDescriptor?: boolean;
  descriptorType?: string;
  mediaUri?: string;
  resolvedTrackId?: string;
  resolvedTitle?: string;
  resolvedArtist?: string;
  provider?: string;
}

function extractSaavnArtist(item: any, fallbackName: string = 'Artist'): string {
  try {
    const allNames: string[] = [];
    const seen = new Set<string>();

    const addName = (n: any) => {
      if (typeof n === 'string' && n.trim().length > 0) {
        const clean = n.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim();
        for (const part of clean.split(/,\s*|\s*&\s*|\s*\|\s*/)) {
          const p = part.trim();
          if (p && !seen.has(p.toLowerCase())) {
            seen.add(p.toLowerCase());
            allNames.push(p);
          }
        }
      }
    };

    if (item?.more_info?.artistMap?.primary_artists?.length > 0) {
      item.more_info.artistMap.primary_artists.forEach((a: any) => addName(a.name));
    } else if (item?.primary_artists) {
      addName(item.primary_artists);
    }
    if (item?.more_info?.singers) {
      if (Array.isArray(item.more_info.singers)) {
        item.more_info.singers.forEach((s: any) => addName(s.name || s));
      } else if (typeof item.more_info.singers === 'string') {
        addName(item.more_info.singers);
      }
    }
    if (item?.more_info?.artistMap?.featured_artists?.length > 0) {
      item.more_info.artistMap.featured_artists.forEach((a: any) => addName(a.name));
    }
    if (item?.more_info?.music) {
      addName(item.more_info.music);
    }

    if (allNames.length > 0) return allNames.join(', ');
    if (item?.subtitle && typeof item.subtitle === 'string') {
      const sub = item.subtitle.split('-')[0]?.trim();
      if (sub && sub.length > 0) return sub;
    }
  } catch (e) {}
  return fallbackName || 'Artist';
}

function cleanBaseTitle(title: string): string {
  const noParens = (title || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  return noParens.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

async function safeFetchJson<T>(url: string, timeoutMs: number = 3000): Promise<T | null> {
  try {
    const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal as any });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

async function decryptSaavnMediaUrl(encrypted: string): Promise<{ primaryUrl: string; fallbackUrls: string[] } | null> {
  try {
    if (!encrypted) return null;
    const CryptoJS = (await import('crypto-js')) as any;
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const url = decrypted.toString(CryptoJS.enc.Utf8);
    const base = url.replace(/_\d+\.mp4$/, '');
    return {
      primaryUrl: `${base}_320.mp4`,
      fallbackUrls: [
        `${base}_320.mp4`,
        `${base}_160.mp4`,
        `${base}_96.mp4`,
        url
      ],
    };
  } catch {
    return null;
  }
}


function hasWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}

export class AudioStreamResolver {
      static async resolveFullTrack(
    trackId: string,
    title: string,
    artist: string,
    expectedDuration?: number,
    options?: { directAudioOnly?: boolean; allowFallbackTitle?: boolean; forceFresh?: boolean; discardUrl?: string }
  ): Promise<ResolvedStream | null> {
    const cleanT = (title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const cleanA = (artist || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (!cleanT) return null;

    const jioSaavnTask = (async () => {
      try {
        const q = encodeURIComponent(`${cleanT} ${cleanA}`.trim());
        const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
        const searchData = await safeFetchJson<any>(searchUrl, 3000);
        let results = searchData?.results || [];
        if (results.length > 0) {
          for (const entry of results.slice(0, 4)) {
            const resTitle = (entry.title || '').toLowerCase();
            const resSubtitle = (entry.subtitle || '').toLowerCase();
            const resSingers = (entry.more_info?.singers || '').toLowerCase();
            
            let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
            
            // STRICT ARTIST MATCHING to prevent "AUR" matching Hindi word "aur"
            let artistMatch = true;
            if (cleanA) {
               const singersList = resSingers.split(',').map((s: string) => s.trim().toLowerCase());
               const subtitleParts = resSubtitle.split('-').map((s: string) => s.trim());
               const subtitleArtists = subtitleParts[0].split(',').map((s: string) => s.trim().toLowerCase());
               
               const requestedArtistWords = cleanA.split(' ');
               
               // Either the full requested artist is in the singers list exactly,
               // OR it is in the subtitle artists exactly
               const exactMatch = singersList.includes(cleanA) || subtitleArtists.includes(cleanA);
               
               // Or at least one word from the requested artist matches exactly in the singers list
               const partialMatch = requestedArtistWords.some(w => w.length > 2 && (singersList.includes(w) || subtitleArtists.includes(w)));
               
               artistMatch = exactMatch || partialMatch || resTitle.includes('feat ' + cleanA);
            }
            
            if (!titleMatch || !artistMatch) continue; // MUST MATCH BOTH TITLE AND ARTIST STRICTLY
            
            let encryptedUrl = entry.more_info?.encrypted_media_url;
            if (!encryptedUrl && entry.id) {
              const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${entry.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
              const detailData = await safeFetchJson<any>(detailUrl, 2500);
              encryptedUrl = detailData?.songs?.[0]?.more_info?.encrypted_media_url;
            }
            if (encryptedUrl) {
              const streamResult = await decryptSaavnMediaUrl(encryptedUrl);
              if (streamResult) {
                return {
                  url: streamResult.primaryUrl,
                  fallbackUrls: streamResult.fallbackUrls,
                  duration: parseInt(entry.more_info?.duration || '0', 10) || (expectedDuration || 210),
                  source: `JioSaavn (${entry.title})`,
                  bitrate: '320kbps AAC',
                  mimeType: 'audio/mp4',
                  isDirectAudio: true,
                  isMediaDescriptor: false,
                  descriptorType: 'direct',
                  resolvedTrackId: `saavn-${entry.id}`,
                  resolvedTitle: entry.title,
                  resolvedArtist: extractSaavnArtist(entry),
                  provider: 'saavn'
                };
              }
            }
          }
        }
      } catch (e) { console.warn('[AudioStreamResolver] JioSaavn error:', e); }
      throw new Error("JioSaavn failed");
    })();

    const youtubeTask = (async () => {
      if (options?.directAudioOnly) throw new Error("Skipped YT");
      try {
        const ytSearch = (await import('yt-search')).default;
        const query = `${cleanT} ${cleanA} song`;
        const searchResults = await ytSearch(query);
        let videos = searchResults?.videos || [];
        if (videos.length > 0) {
          const scored = videos.map((vid, index) => {
             const vidTitle = (vid.title || '').toLowerCase();
             const vidAuthor = (vid.author?.name || '').toLowerCase();
             let score = Math.max(0, (10 - index) * 10);
             if (vidAuthor.includes('- topic')) score += 50;
             if (vidTitle.includes('official audio') || vidTitle.includes('lyric')) score += 30;
             if (cleanT.split(' ').every(w => hasWord(vidTitle, w) || (w.length > 4 && vidTitle.includes(w.substring(0, w.length - 1))))) score += 100;
             else if (cleanT.split(' ').some(w => w.length > 3 && hasWord(vidTitle, w))) score += 50;
             if (cleanA && cleanA.split(' ').some(w => w.length > 1 && (hasWord(vidAuthor, w) || hasWord(vidTitle, w)))) score += 100;
             if (expectedDuration) {
                const diff = Math.abs((vid.seconds || vid.duration?.seconds || 0) - expectedDuration);
                if (diff <= 5) score += 80;
                else if (diff <= 15) score += 40;
                else score -= diff;
             }
             return { vid, score };
          });
          scored.sort((a, b) => b.score - a.score);
          const bestVid = scored[0].vid;
          return {
            url: `youtube:${bestVid.videoId}`,
            fallbackUrls: [`youtube:${bestVid.videoId}`],
            duration: bestVid.seconds || 0,
            source: `YouTube (${bestVid.title})`,
            bitrate: '320kbps',
            mimeType: 'video/youtube',
            isDirectAudio: false,
            isMediaDescriptor: true,
            descriptorType: 'youtube',
            mediaUri: `youtube:${bestVid.videoId}`,
            resolvedTrackId: `yt-${bestVid.videoId}`,
            resolvedTitle: bestVid.title,
            resolvedArtist: bestVid.author?.name || 'YouTube',
            provider: 'youtube'
          };
        }
      } catch (e) { console.warn('[AudioStreamResolver] YouTube error:', e); }
      throw new Error("YouTube failed");
    })();

    // Race JioSaavn and YouTube. First to return a valid stream wins.
    try {
      const winner = await Promise.any([jioSaavnTask, youtubeTask]);
      return winner;
    } catch {
      // If both fail, try Audius as a last resort
      try {
        const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(cleanT + ' ' + cleanA)}&app_name=spotiz`;
        const audiusData = await safeFetchJson<any>(audiusUrl, 3000);
        const audiusTracks = audiusData?.data || [];
        if (audiusTracks.length > 0) {
          const topTrack = audiusTracks[0];
          const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${topTrack.id}/stream?app_name=spotiz`;
          return {
            url: streamUrl,
            fallbackUrls: [streamUrl],
            duration: topTrack.duration || (expectedDuration || 210),
            source: `Audius (${topTrack.title})`,
            bitrate: '320kbps MP3',
            mimeType: 'audio/mpeg',
            isDirectAudio: true,
            isMediaDescriptor: false,
            descriptorType: 'direct',
            resolvedTrackId: `audius-${topTrack.id}`,
            resolvedTitle: topTrack.title,
            resolvedArtist: topTrack.user?.name || '',
            provider: 'audius'
          };
        }
      } catch (e) { console.warn('[AudioStreamResolver] Audius error:', e); }
    }
    
    return null;
  }
}

export async function validateAudioStream(url: string, timeoutMs = 800, minDuration = 0, isItunes = false): Promise<{ valid: boolean; reason?: string }> {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(url, { method: 'HEAD', timeout: timeoutMs } as any);
    if (res.ok || res.status === 206) return { valid: true };
    return { valid: false, reason: 'Invalid status' };
  } catch {
    return { valid: false, reason: 'Timeout or error' };
  }
}
