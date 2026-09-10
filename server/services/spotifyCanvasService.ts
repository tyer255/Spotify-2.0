// @ts-ignore
import { SPClient } from 'spotify-canvas/lib/SPClient.js';
// @ts-ignore
import { Protobuf } from 'spotify-canvas/lib/Protobuf.js';

export interface CanvasVerificationInput {
  trackId?: string;
  spotifyUri?: string;
  spotifyId?: string;
  isrc?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
}

export interface SpotifyCanvasResult {
  requestedTrackId?: string;
  canonicalSpotifyTrackId?: string;
  canvasTrackId?: string;
  canvasAssetId?: string;
  canvasEntityUri?: string;
  canvasUrl?: string;
  videoUrl?: string;
  trackUri?: string;
  trackId: string;
  isrc?: string;
  title: string;
  artist: string;
  album?: string;
  artistUri?: string;
  canvasType?: string;
  trackMatched: boolean;
  canvasAssetMatched: boolean;
  verified: boolean;
  verificationReason: string;
  status: 'CANVAS_FOUND' | 'CANVAS_NOT_AVAILABLE' | 'CANVAS_FETCH_FAILED' | 'CANVAS_AUTH_FAILED';
}

interface CandidateSpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  albumName?: string;
  durationMs?: number;
  isSingle?: boolean;
}

export class SpotifyCanvasService {
  private static token: string | null = null;
  private static tokenExpires: number = 0;
  private static tokenPromise: Promise<string> | null = null;
  
  // Canonical Canvas cache keyed strictly by canonical Spotify Track ID (e.g. '2ZDOzySC2g3YF1p26TPzBt')
  private static canonicalCanvasCache = new Map<string, { data: SpotifyCanvasResult, expiry: number }>();

  // Track resolution map mapping client/proprietary trackId to canonical Spotify Track ID
  private static trackResolutionCache = new Map<string, { spotifyTrackId: string, expiry: number }>();

  /**
   * Cleans title string for search and canonical matching
   */
  private static cleanTitle(title: string): string {
    if (!title) return '';
    return title
      .replace(/[\(\[].*?[\)\]]/g, ' ') // Remove parenthesized tags like (From "...") or [HINDI]
      .replace(/ft\..*|feat\..*/i, ' ')  // Remove ft. / feat.
      .replace(/[^\w\s\u0900-\u097F]/gi, ' ') // Preserve alphanumeric and Devanagari chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Cleans artist string to extract primary artist
   */
  private static cleanArtist(artist: string): string {
    if (!artist) return '';
    return artist
      .split(/[,;&\/]/)[0]
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Retrieves active Spotify access token using embed cookie
   */
  private static async getAccessToken(trackId?: string): Promise<string> {
    if (this.token && Date.now() < this.tokenExpires) {
      return this.token;
    }

    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = (async () => {
      // Sanitize SP_DC: Strip whitespace, quotes, and ignore placeholders from .env.example
      let sp_dc = (process.env.SPOTIFY_SP_DC || '').trim().replace(/^["']|["']$/g, '');
      if (!sp_dc || sp_dc.includes('YOUR_SP_DC') || sp_dc.includes('COOKIE') || sp_dc.length < 50) {
        sp_dc = "AQASO79dkJqiGjAaYRQgdeG_Tk_uDibYmbSCxPwnkeI6Tv9U0-E-ogVgHbJZVpGeraEnZSEpUQzOa2U6kk0LxFBAysIsCNcFeZzp2FSfPAmteW7NPgs1TfdAyAn17STis15CRHPeWPemPJ4bS0_Tn2Sdcqf-oVpAfxaIjrrroPNH8ABrAMaXZD7f8ugn4YBZ0J5xpaJpeUs78Ye6Cg0pPG9xzvO0GOwz9E4M3rgx_iB9v2D4b9NW8sIILfeVTEmsaaxinIKFgeAfAtc";
      }

      const testTrackIds = [
        (trackId && /^[a-zA-Z0-9]{22}$/.test(trackId)) ? trackId : null,
        '4P8A6n0w0Og4NQb28PBzKF',
        '0wHYuCTWPntEgWiUVED4wB',
        '4cOdK2wGLETKBW3PvgPWqT'
      ].filter(Boolean) as string[];

      let lastErrorDetail = '';

      for (const sampleTrackId of testTrackIds) {
        // 1. Try with cookie & full browser headers (9000ms timeout)
        try {
          const headers: any = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "iframe",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Referer": "https://open.spotify.com/",
            "Cookie": `sp_dc=${sp_dc}`
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 9000); 

          const res = await fetch(`https://open.spotify.com/embed/track/${sampleTrackId}`, {
            headers,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const text = await res.text();
            const tokenMatch = text.match(/"accessToken":"([^"]+)"/) || text.match(/accessToken["\s:]+([^",\s}]+)/);
            if (tokenMatch && tokenMatch[1]) {
              this.token = tokenMatch[1];
              this.tokenExpires = Date.now() + 3500 * 1000;
              return this.token;
            } else {
              lastErrorDetail = `HTTP ${res.status}, no accessToken in HTML (len=${text.length})`;
            }
          } else {
            lastErrorDetail = `HTTP ${res.status} ${res.statusText}`;
          }
        } catch (e: any) {
          lastErrorDetail = e?.name === 'AbortError' ? 'timeout after 9s' : (e?.message || String(e));
        }

        // 2. Fallback: try without cookie
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`https://open.spotify.com/embed/track/${sampleTrackId}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Referer": "https://open.spotify.com/"
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const text = await res.text();
            const tokenMatch = text.match(/"accessToken":"([^"]+)"/) || text.match(/accessToken["\s:]+([^",\s}]+)/);
            if (tokenMatch && tokenMatch[1]) {
              this.token = tokenMatch[1];
              this.tokenExpires = Date.now() + 3500 * 1000;
              return this.token;
            }
          }
        } catch (e: any) {
          // Continue to next track
        }
      }

      throw new Error(lastErrorDetail || 'AUTH_FAILED');
    })().finally(() => {
      this.tokenPromise = null;
    });

    return this.tokenPromise;
  }

  /**
   * Directly fetches Canvas Protobuf binary data using native fetch to avoid node-fetch/CJS conflicts
   */
  private static async fetchCanvasDirect(canonicalId: string, token: string): Promise<any> {
    const trackUri = `spotify:track:${canonicalId}`;
    let body: any;
    try {
      body = Protobuf.encodeRequest(trackUri);
    } catch (e) {
      return { canvases: [] };
    }

    const endpoints = [
      'https://spclient.wg.spotify.com/canvaz-cache/v0/canvases',
      'https://gae2-spclient.spotify.com:443/canvaz-cache/v0/canvases',
      'https://gue1-spclient.spotify.com:443/canvaz-cache/v0/canvases',
      'https://gew1-spclient.spotify.com:443/canvaz-cache/v0/canvases'
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-protobuf',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
          },
          body,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const ab = await res.arrayBuffer();
          const decoded = Protobuf.decodeResponse(new Uint8Array(ab));
          if (decoded && decoded.canvases && decoded.canvases.length > 0) {
            return decoded;
          }
          return { canvases: [] };
        }
      } catch (e) {
        // try next endpoint
      }
    }
    return { canvases: [] };
  }

  /**
   * Dynamically queries official Spotify Catalog via Pathfinder GraphQL searchDesktop operation
   */
  private static async searchSpotifyCatalog(searchTerm: string, token: string): Promise<CandidateSpotifyTrack[]> {
    const candidates: CandidateSpotifyTrack[] = [];
    const seenIds = new Set<string>();

    try {
      const vars = JSON.stringify({
        searchTerm,
        offset: 0,
        limit: 8,
        numberOfTopResults: 5
      });
      const ext = JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: '75bbf6bfcfdf85b8fc828417bfad92b7cd66bf7f556d85670f4da8292373ebec'
        }
      });
      const url = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables=${encodeURIComponent(vars)}&extensions=${encodeURIComponent(ext)}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4500)
      });

      if (!res.ok) return candidates;

      const data: any = await res.json();
      const tracks = data?.data?.search?.tracks?.items || [];
      const albums = data?.data?.search?.albums?.items || [];

      // 1. Direct Track results
      for (const t of tracks) {
        const item = t.track;
        if (item?.id && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          candidates.push({
            id: item.id,
            name: item.name,
            artists: (item.artists?.items || []).map((a: any) => a.profile?.name).filter(Boolean),
            albumName: item.album?.name,
            durationMs: item.duration?.totalMilliseconds
          });
        }
      }

      // 2. Album / Single releases matching the search (crucial for singles with Canvas)
      const cleanTerm = this.cleanTitle(searchTerm).toLowerCase();
      for (const a of albums.slice(0, 3)) {
        const albumName = (a.name || '').toLowerCase();
        if (albumName.includes(cleanTerm) && a.uri?.startsWith('spotify:album:')) {
          const albId = a.uri.split(':').pop();
          if (albId) {
            try {
              const albRes = await fetch(`https://open.spotify.com/embed/album/${albId}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(3000)
              });
              if (albRes.ok) {
                const albText = await albRes.text();
                const albNextMatch = albText.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
                if (albNextMatch) {
                  const albParsed = JSON.parse(albNextMatch[1]);
                  const trackList = albParsed.props?.pageProps?.state?.data?.entity?.trackList || [];
                  for (const tr of trackList) {
                    const trId = (tr.id || tr.uri || '').split(':').pop();
                    if (trId && !seenIds.has(trId)) {
                      seenIds.add(trId);
                      candidates.push({
                        id: trId,
                        name: tr.title || tr.name || a.name,
                        artists: (a.artists?.items || []).map((x: any) => x.profile?.name).filter(Boolean),
                        albumName: a.name,
                        isSingle: true
                      });
                    }
                  }
                }
              }
            } catch (err) {}
          }
        }
      }
    } catch (e: any) {
      console.warn('[SpotifyCatalog] Search error:', e?.message || e);
    }

    return candidates;
  }

  /**
   * Secondary search fallback using Deezer + MusicBrainz ISRC relations
   */
  private static async searchDeezerMusicBrainz(title: string, artist: string): Promise<CandidateSpotifyTrack[]> {
    const candidates: CandidateSpotifyTrack[] = [];
    try {
      const q = encodeURIComponent(`${this.cleanTitle(title)} ${this.cleanArtist(artist)}`.trim());
      const dzRes = await fetch(`https://api.deezer.com/search?q=${q}&limit=2`, { signal: AbortSignal.timeout(3500) });
      if (!dzRes.ok) return candidates;

      const dzData: any = await dzRes.json();
      if (!dzData.data || dzData.data.length === 0) return candidates;

      for (const dzTrack of dzData.data.slice(0, 2)) {
        try {
          const trackDetailRes = await fetch(`https://api.deezer.com/track/${dzTrack.id}`, { signal: AbortSignal.timeout(3000) });
          if (!trackDetailRes.ok) continue;
          const trackDetail: any = await trackDetailRes.json();
          const isrc = trackDetail.isrc;
          if (!isrc) continue;

          const mbRes = await fetch(`https://musicbrainz.org/ws/2/isrc/${isrc}?inc=url-rels&fmt=json`, {
            headers: { 'User-Agent': 'Spotiz/1.0.0 ( contact@spotiz.app )' },
            signal: AbortSignal.timeout(3500)
          });
          if (!mbRes.ok) continue;

          const mbData: any = await mbRes.json();
          for (const rec of mbData.recordings || []) {
            const urls = rec.relations?.filter((r: any) => r.url?.resource?.includes('spotify.com/track/')) || [];
            for (const u of urls) {
              const match = u.url?.resource?.match(/track\/([a-zA-Z0-9]{22})/);
              if (match && match[1]) {
                candidates.push({
                  id: match[1],
                  name: rec.title || dzTrack.title,
                  artists: [dzTrack.artist?.name].filter(Boolean),
                  durationMs: (dzTrack.duration || 0) * 1000
                });
              }
            }
          }
        } catch (err) {}
      }
    } catch (e) {}
    return candidates;
  }

  /**
   * Strict Identity Verification Algorithm
   * Scores title similarity, artist identity, and duration match.
   * Returns a confidence score between 0.0 and 1.0.
   */
  private static calculateIdentityConfidence(
    candidate: CandidateSpotifyTrack,
    expectedTitle: string,
    expectedArtist: string,
    expectedDurationSeconds?: number
  ): { confidence: number; reason: string } {
    const cleanExpTitle = this.cleanTitle(expectedTitle).toLowerCase();
    const cleanCandTitle = this.cleanTitle(candidate.name).toLowerCase();
    
    // 1. Title Token Overlap
    const expTokens = cleanExpTitle.split(/\s+/).filter(t => t.length > 1);
    const candTokens = cleanCandTitle.split(/\s+/).filter(t => t.length > 1);
    
    let matchedTokens = 0;
    for (const t of expTokens) {
      if (candTokens.includes(t) || cleanCandTitle.includes(t)) {
        matchedTokens++;
      }
    }
    const titleTokenRatio = expTokens.length > 0 ? (matchedTokens / expTokens.length) : 0;
    const directTitleMatch = cleanCandTitle.includes(cleanExpTitle) || cleanExpTitle.includes(cleanCandTitle);

    if (titleTokenRatio < 0.60 && !directTitleMatch) {
      return { confidence: 0, reason: `Title mismatch: "${candidate.name}" does not match "${expectedTitle}"` };
    }

    // 2. Artist Verification
    const cleanExpArtist = this.cleanArtist(expectedArtist).toLowerCase();
    let artistMatched = false;
    let partialArtistMatched = false;
    
    for (const a of candidate.artists) {
      const cleanA = a.toLowerCase();
      if (cleanA.includes(cleanExpArtist) || cleanExpArtist.includes(cleanA)) {
        artistMatched = true;
        break;
      }
      
      // Check first name or last name
      const expParts = cleanExpArtist.split(/\s+/).filter(p => p.length > 2);
      const candParts = cleanA.split(/\s+/).filter(p => p.length > 2);
      
      // If there are multiple parts (e.g. Aditya Rikhari), check if they contradict
      let matchCount = 0;
      let conflictCount = 0;
      for (const ep of expParts) {
        if (cleanA.includes(ep)) {
          matchCount++;
        } else if (candParts.length > 1) {
          conflictCount++;
        }
      }
      
      if (matchCount > 0) {
        if (conflictCount === 0 || matchCount >= expParts.length) {
          artistMatched = true;
          break;
        } else {
          // If we matched "Aditya" but not "Rikhari" on "Aditya Sharma", it's a conflict
          partialArtistMatched = true;
        }
      }
    }

    if (!artistMatched && candidate.artists.length > 0 && cleanExpArtist.length > 0) {
      return { confidence: 0, reason: `Artist mismatch: candidate artists [${candidate.artists.join(', ')}] do not strictly match "${expectedArtist}"` };
    }

    // 3. Duration Verification (if duration is provided and candidate duration is known)
    let durationScore = 1.0;
    if (expectedDurationSeconds && expectedDurationSeconds > 30 && candidate.durationMs && candidate.durationMs > 30000) {
      const candSec = Math.round(candidate.durationMs / 1000);
      const diff = Math.abs(candSec - Math.round(expectedDurationSeconds));
      if (diff > 45) {
        return { confidence: 0, reason: `Duration mismatch: candidate is ${candSec}s, expected ~${Math.round(expectedDurationSeconds)}s` };
      } else if (diff > 20) {
        durationScore = 0.8;
      }
    }

    // Combined confidence calculation
    const baseTitleScore = directTitleMatch ? 1.0 : titleTokenRatio;
    const confidence = (baseTitleScore * 0.55) + ((artistMatched ? 1.0 : 0.6) * 0.35) + (durationScore * 0.10);

    return {
      confidence,
      reason: `Exact match verified: "${candidate.name}" by [${candidate.artists.join(', ')}] (Score: ${(confidence * 100).toFixed(0)}%)`
    };
  }

  /**
   * Resolves verified Spotify Canvas dynamically for any track
   */
  static async getCanvasForTrack(input: CanvasVerificationInput): Promise<SpotifyCanvasResult> {
    const title = (input.title || '').trim();
    const artist = (input.artist || '').trim();
    const rawTrackId = input.trackId || input.spotifyId || '';
    const duration = input.duration ? Number(input.duration) : undefined;

    // Step 1: Check canonical Spotify Track ID resolution cache
    let canonicalSpotifyTrackId = /^[a-zA-Z0-9]{22}$/.test(rawTrackId) ? rawTrackId : undefined;
    if (!canonicalSpotifyTrackId && rawTrackId) {
      const resolved = this.trackResolutionCache.get(rawTrackId);
      if (resolved && Date.now() < resolved.expiry) {
        canonicalSpotifyTrackId = resolved.spotifyTrackId;
      }
    }

    // Step 2: If canonical ID is known, check canonical Canvas Cache (Primary Identity Key)
    if (canonicalSpotifyTrackId) {
      const cachedCanvas = this.canonicalCanvasCache.get(canonicalSpotifyTrackId);
      if (cachedCanvas && Date.now() < cachedCanvas.expiry) {
        // Return cloned result with requestedTrackId preserved for 1:1 binding
        return {
          ...cachedCanvas.data,
          requestedTrackId: rawTrackId,
          trackId: rawTrackId,
          canonicalSpotifyTrackId,
          canvasTrackId: canonicalSpotifyTrackId,
        };
      }
    }

    // Acquire Spotify Access Token
    let token: string;
    try {
      token = await this.getAccessToken(rawTrackId);
    } catch (e: any) {
      const authErr = e?.message || String(e);
      console.error('[SpotifyCanvas] Auth failure:', authErr);
      return this.createErrorResult(input, 'CANVAS_AUTH_FAILED', `Failed to authenticate with Spotify embed session (${authErr})`);
    }

    let sp: any = null;
    try {
      sp = await SPClient.create(token);
    } catch (e) {
      // SPClient init warning, direct fetch will be primary
    }
    const candidateTracks: CandidateSpotifyTrack[] = [];
    const seenCandidateIds = new Set<string>();

    // Step 3: If input is already a valid 22-char Spotify ID, test it as top candidate
    if (/^[a-zA-Z0-9]{22}$/.test(rawTrackId)) {
      seenCandidateIds.add(rawTrackId);
      candidateTracks.push({
        id: rawTrackId,
        name: title || 'Spotify Track',
        artists: artist ? [artist] : [],
        durationMs: duration ? duration * 1000 : undefined
      });
    }

    // Step 4: Dynamic Spotify Catalog Search via Pathfinder GraphQL
    if (title) {
      const cleanT = this.cleanTitle(title);
      const cleanA = this.cleanArtist(artist);
      const searchQueries = [
        `${cleanT} ${cleanA}`.trim(),
        cleanT
      ].filter(Boolean);

      for (const q of searchQueries) {
        const found = await this.searchSpotifyCatalog(q, token);
        for (const item of found) {
          if (!seenCandidateIds.has(item.id)) {
            seenCandidateIds.add(item.id);
            candidateTracks.push(item);
          }
        }
        if (candidateTracks.length >= 6) break;
      }
    }

    // Step 5: Secondary ISRC Search if no direct catalog tracks found
    if (candidateTracks.length === 0 && title) {
      const secondaryFound = await this.searchDeezerMusicBrainz(title, artist);
      for (const item of secondaryFound) {
        if (!seenCandidateIds.has(item.id)) {
          seenCandidateIds.add(item.id);
          candidateTracks.push(item);
        }
      }
    }

    // Step 6: Strict Verification & Canvas Resolution
    const verifiedCandidates: { candidate: CandidateSpotifyTrack; confidence: number; reason: string }[] = [];

    for (const c of candidateTracks) {
      if (!title) {
        // Track ID lookup without title (e.g. direct Spotify ID)
        verifiedCandidates.push({ candidate: c, confidence: 1.0, reason: 'Direct Spotify track lookup' });
        continue;
      }

      const check = this.calculateIdentityConfidence(c, title, artist, duration);
      if (check.confidence >= 0.70) {
        verifiedCandidates.push({ candidate: c, confidence: check.confidence, reason: check.reason });
      } else {
        console.log(`[Canvas Gate] Candidate rejected: ${c.name} (${c.id}) - ${check.reason}`);
      }
    }

    // Sort candidates: singles preferred, highest confidence first
    verifiedCandidates.sort((a, b) => {
      if (b.candidate.isSingle && !a.candidate.isSingle) return 1;
      if (a.candidate.isSingle && !b.candidate.isSingle) return -1;
      return b.confidence - a.confidence;
    });

    // Step 7: Test Canvas on verified candidates
    for (const item of verifiedCandidates) {
      const cand = item.candidate;
      const canonicalId = cand.id;

      // Remember resolution mapping for requested ID
      if (rawTrackId) {
        this.trackResolutionCache.set(rawTrackId, {
          spotifyTrackId: canonicalId,
          expiry: Date.now() + 24 * 3600 * 1000
        });
      }

      // Check if canonical canvas cache already contains this Spotify track
      const existingInCache = this.canonicalCanvasCache.get(canonicalId);
      if (existingInCache && Date.now() < existingInCache.expiry) {
        return {
          ...existingInCache.data,
          requestedTrackId: rawTrackId,
          trackId: rawTrackId,
          canonicalSpotifyTrackId: canonicalId,
          canvasTrackId: canonicalId,
        };
      }

      try {
        let canvasRes = await this.fetchCanvasDirect(canonicalId, token);
        if ((!canvasRes?.canvases || canvasRes.canvases.length === 0) && sp) {
          try {
            canvasRes = await sp.postCanvasRequest(`spotify:track:${canonicalId}`);
          } catch (spErr) {
            // Ignore SPClient error
          }
        }
        const canvasList = canvasRes?.canvases || [];
        if (canvasList.length > 0 && canvasList[0]?.url) {
          const cv = canvasList[0];
          
          // Successful Verified Canvas Match
          const result: SpotifyCanvasResult = {
            requestedTrackId: rawTrackId,
            canonicalSpotifyTrackId: canonicalId,
            canvasTrackId: canonicalId,
            canvasAssetId: cv.id || canonicalId,
            canvasEntityUri: cv.entityUri || `spotify:track:${canonicalId}`,
            canvasUrl: cv.url,
            videoUrl: cv.url,
            trackUri: `spotify:track:${canonicalId}`,
            trackId: rawTrackId || canonicalId,
            isrc: input.isrc,
            title: title || cand.name,
            artist: artist || (cand.artists.join(', ')),
            album: cand.albumName || input.album,
            artistUri: cv.artist?.uri,
            canvasType: cv.url.includes('.mp4') ? 'VIDEO' : 'IMAGE',
            trackMatched: true,
            canvasAssetMatched: true,
            verified: true,
            verificationReason: item.reason,
            status: 'CANVAS_FOUND'
          };

          console.log(`[Canvas Verified] "${title}" -> Found 1:1 Canvas (${canonicalId}): ${cv.url.slice(0, 60)}...`);
          // Store in Canonical Cache (Keyed strictly by canonicalSpotifyTrackId) for 6 hours
          this.canonicalCanvasCache.set(canonicalId, { data: result, expiry: Date.now() + 6 * 3600 * 1000 });
          return result;
        }
      } catch (err: any) {
        // Canvas not available on this candidate; proceed to next candidate
      }
    }

    // If verified candidates existed but none have Canvas uploaded
    const primaryCandidateId = verifiedCandidates[0]?.candidate?.id;
    if (primaryCandidateId && rawTrackId) {
      this.trackResolutionCache.set(rawTrackId, {
        spotifyTrackId: primaryCandidateId,
        expiry: Date.now() + 24 * 3600 * 1000
      });
    }

    const notAvailableResult = this.createErrorResult(
      input,
      'CANVAS_NOT_AVAILABLE',
      `No official Canvas available on Spotify for "${title}" by "${artist}". Strict fallback to album artwork.`
    );
    notAvailableResult.canonicalSpotifyTrackId = primaryCandidateId;
    notAvailableResult.canvasTrackId = undefined;
    notAvailableResult.requestedTrackId = rawTrackId;

    if (primaryCandidateId) {
      // Keep negative cache brief (60 seconds) so transient network or token refresh delays don't lock the song out
      this.canonicalCanvasCache.set(primaryCandidateId, { data: notAvailableResult, expiry: Date.now() + 60 * 1000 });
    }
    return notAvailableResult;
  }

  private static createErrorResult(
    input: CanvasVerificationInput,
    status: SpotifyCanvasResult['status'],
    reason: string
  ): SpotifyCanvasResult {
    return {
      trackId: input.trackId || input.spotifyId || 'unknown',
      title: input.title || 'Unknown Title',
      artist: input.artist || 'Unknown Artist',
      trackMatched: false,
      canvasAssetMatched: false,
      verified: false,
      verificationReason: reason,
      status
    };
  }
}

