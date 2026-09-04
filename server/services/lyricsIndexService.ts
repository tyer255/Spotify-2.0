import { Track } from '../../src/types';
import * as fs from 'fs';
import * as path from 'path';

interface IndexedLyric {
  trackId: string;
  title: string;
  artist: string;
  plainLyrics: string;
  trackData: Track;
}

export class LyricsIndexService {
  private cacheFilePath = path.join(process.cwd(), 'lyrics_index.json');
  private indexedTracks: Map<string, IndexedLyric> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const raw = fs.readFileSync(this.cacheFilePath, 'utf8');
        const parsed: IndexedLyric[] = JSON.parse(raw);
        parsed.forEach(pt => this.indexedTracks.set(pt.trackId, pt));
      }
    } catch (err) {
      console.warn('[LyricsIndexService] Failed to load lyrics index from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const data = Array.from(this.indexedTracks.values());
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn('[LyricsIndexService] Failed to save lyrics index to disk:', err);
    }
  }

  public indexLyrics(track: Track, plainLyrics: string) {
    if (!plainLyrics || !plainLyrics.trim()) return;
    
    this.indexedTracks.set(track.id, {
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      plainLyrics: plainLyrics.toLowerCase(),
      trackData: track
    });

    this.saveToDisk();
  }

  public searchLyrics(query: string): Track[] {
    const q = query.trim().toLowerCase();
    if (q.length < 5) return [];

    const matches: { track: Track; score: number }[] = [];

    for (const [id, indexed] of this.indexedTracks.entries()) {
      if (indexed.plainLyrics.includes(q)) {
        // High score for exact phrase match
        matches.push({ track: indexed.trackData, score: 100 });
      } else {
        // Fallback: Check if all significant words are in the lyrics near each other
        const words = q.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
          const allFound = words.every(w => indexed.plainLyrics.includes(w));
          if (allFound) {
            matches.push({ track: indexed.trackData, score: 50 });
          }
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.map(m => m.track);
  }
}

export const lyricsIndexService = new LyricsIndexService();

// Seed Radioactive
lyricsIndexService.indexLyrics({
  id: "985680392",
  title: "Radioactive",
  artist: "Imagine Dragons",
  artistId: "123",
  album: "Night Visions",
  albumId: "456",
  duration: 186,
  images: { small: '', medium: '', large: '' },
  provider: 'deezer',
  playbackAvailability: true,
  streamUrl: '',
  mimeType: ''
}, "I'm waking up to ash and dust\nI wipe my brow and I sweat my rust");
