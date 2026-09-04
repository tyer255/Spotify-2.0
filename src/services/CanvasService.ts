import { Track } from '../types';

export interface CanvasData {
  requestedTrackId: string;
  canonicalSpotifyTrackId?: string;
  canvasAssetId?: string;
  canvasEntityUri?: string;
  canvasTrackId?: string;
  canvasUrl?: string;
  videoUrl?: string;
  trackUri?: string;
  isrc?: string;
  title?: string;
  artist?: string;
  album?: string;
  artistUri?: string;
  canvasType?: string;
  trackMatched: boolean;
  canvasAssetMatched: boolean;
  verified: boolean;
  verificationReason: string;
  status?: 'CANVAS_FOUND' | 'CANVAS_NOT_AVAILABLE' | 'CANVAS_FETCH_FAILED' | 'CANVAS_AUTH_FAILED';
}

export class CanvasService {
  // STRICT CACHE: Keyed strictly by canonical track identity (trackId + isrc), NEVER title alone
  private static cache: Map<string, CanvasData | null> = new Map();

  /**
   * Generates a strictly scoped cache key using canonical track identity
   */
  private static getCacheKey(track: Track): string {
    const canonicalId = track.spotifyId || track.id || track.spotifyUri || '';
    const isrc = track.isrc || '';
    return `canonical_canvas:${canonicalId}:${isrc}`.toLowerCase();
  }

  static async getCanvasForTrack(track: Track): Promise<CanvasData | null> {
    if (!track?.id || !track?.title) {
      console.log('[CanvasService] Skip: missing track ID or title', track);
      return null;
    }

    const requestedTrackId = track.id;
    const cacheKey = this.getCacheKey(track);

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.requestedTrackId === requestedTrackId) {
        if (cached.status === 'CANVAS_FETCH_FAILED' || cached.status === 'CANVAS_AUTH_FAILED') {
           // Do not return failed states as definitive cache hits. Allow retry.
           // Actually, we can return it if we want the player to know it failed.
        }
        console.log(`[CanvasService] Cache HIT for track "${track.title}" (ID: ${track.id}): Asset ID: ${cached.canvasAssetId}`);
        return cached;
      } else if (cached === null) {
        return null;
      }
    }

    console.log(`[CanvasService] Requesting verified 1:1 Canvas asset for track: "${track.title}" by "${track.artist}" (ID: ${track.id}, ISRC: ${track.isrc || 'N/A'})`);
    
    try {
      const queryParams = new URLSearchParams({
        trackId: track.id,
        title: track.title,
        artist: track.artist || '',
        album: track.album || '',
        isrc: track.isrc || '',
        duration: track.duration ? String(track.duration) : '',
        spotifyUri: track.spotifyUri || '',
        spotifyId: track.spotifyId || '',
      }).toString();

      const requestUrl = `/api/canvas?${queryParams}`;
      const res = await fetch(requestUrl);
      
      // Even if res.ok is false, the backend might return { success: false, data: { status: 'CANVAS_NOT_AVAILABLE', ... } }
      // So we always parse json
      const json = await res.json().catch(() => null);
      const data = json?.data;
      
      if (data) {
          const result: CanvasData = {
            requestedTrackId,
            canonicalSpotifyTrackId: data.canonicalSpotifyTrackId || data.canvasTrackId,
            canvasAssetId: data.canvasAssetId,
            canvasEntityUri: data.canvasEntityUri,
            canvasTrackId: data.canvasTrackId || data.trackId || data.trackUri,
            canvasUrl: data.canvasUrl,
            videoUrl: data.videoUrl || data.canvasUrl,
            trackUri: data.trackUri,
            isrc: data.isrc || track.isrc,
            title: data.title || track.title,
            artist: data.artist || track.artist,
            album: data.album || track.album,
            artistUri: data.artistUri,
            canvasType: data.canvasType || 'IMAGE_LOOPING',
            trackMatched: Boolean(data.trackMatched),
            canvasAssetMatched: Boolean(data.canvasAssetMatched),
            verified: Boolean(data.verified),
            verificationReason: data.verificationReason || 'Server verified',
            status: data.status || (data.canvasUrl ? 'CANVAS_FOUND' : 'CANVAS_FETCH_FAILED')
          };

          console.log(`[CanvasService] Canvas API Response for "${track.title}":`, result.status, result.verificationReason);
          
          if (result.status === 'CANVAS_FOUND') {
            this.cache.set(cacheKey, result);
          } else {
            // For not available or errors, do not permanently cache in frontend memory so fresh retry can occur on next play
          }
          return result;
      }
    } catch (e: any) {
      console.warn(`[CanvasService] Error requesting canvas for "${track.title}":`, e?.message || e);
    }
    
    console.log(`[CanvasService] Network/API Error fetching Canvas for "${track.title}" (ID: ${track.id}). Strict fallback to album artwork.`);
    return {
      requestedTrackId,
      trackMatched: false,
      canvasAssetMatched: false,
      verified: false,
      verificationReason: 'Network/API Error',
      status: 'CANVAS_FETCH_FAILED'
    };
  }

  static clearCache() {
    this.cache.clear();
  }
}
