import QRCode from 'qrcode';
import { Track } from '../types';

/**
 * Builds the canonical deep link for a song in Spotiz.
 */
export function getSongDeepLink(songId: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://spotiz.app';
  return `${origin}/song/${encodeURIComponent(songId)}`;
}

/**
 * Generates a deterministic high-resolution QR code PNG data URL for a given track.
 */
export async function generateSongQrDataUrl(track: Track): Promise<string> {
  const payload = getSongDeepLink(track.id);
  return QRCode.toDataURL(payload, {
    width: 380,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Validates and extracts a song's internal identifier from a scanned QR payload.
 * Returns the song ID if valid, or null if invalid / third-party.
 */
export function parseSongIdFromQr(payload: string): string | null {
  if (!payload || typeof payload !== 'string') return null;

  const trimmed = payload.trim();

  // Pattern 1: Canonical app URL - https://<domain>/song/<songId> or /song/<songId>
  const urlSongMatch = trimmed.match(/^(?:https?:\/\/[^\/]+)?\/song\/([a-zA-Z0-9_\-\.\:\@]+)(?:\?.*)?$/i);
  if (urlSongMatch && urlSongMatch[1]) {
    try {
      return decodeURIComponent(urlSongMatch[1]);
    } catch {
      return urlSongMatch[1];
    }
  }

  // Pattern 2: Custom URI scheme - spotiz://song/<songId> or spotiz:track:<songId>
  const uriMatch = trimmed.match(/^spotiz:(?:\/\/)?(?:song\/|track:)([a-zA-Z0-9_\-\.\:\@]+)$/i);
  if (uriMatch && uriMatch[1]) {
    try {
      return decodeURIComponent(uriMatch[1]);
    } catch {
      return uriMatch[1];
    }
  }

  // Pattern 3: Query or hash params - ?song=<id>, ?track=<id>, #track=<id>
  const queryOrHashMatch = trimmed.match(/[?&#](?:song|track)=([a-zA-Z0-9_\-\.\:\@]+)/i);
  if (queryOrHashMatch && queryOrHashMatch[1]) {
    try {
      return decodeURIComponent(queryOrHashMatch[1]);
    } catch {
      return queryOrHashMatch[1];
    }
  }

  // Explicitly reject known external streaming services (YouTube, official Spotify URLs, Apple Music, etc.)
  if (
    trimmed.includes('spotify.com') ||
    trimmed.includes('spotify:') ||
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('music.apple.com') ||
    trimmed.includes('soundcloud.com')
  ) {
    return null;
  }

  return null;
}
