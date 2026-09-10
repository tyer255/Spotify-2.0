import { Track, Artist } from '../../src/types';
import { providerManager } from '../providers/ProviderManager';

export class RadioRecommendationService {
  /**
   * Generates a Radio playlist based on a seed.
   */
  static async generateRadio(seedType: 'artist' | 'song' | 'album', seedId: string, seedTitle?: string): Promise<Track[]> {
    console.log(`[Radio Service] Generating radio for ${seedType} ${seedId} (${seedTitle || ''})`);
    
    // Attempt Spotify recommendations if available
    const provider = providerManager.getProvider();
    
    // Determine seed parameters for Spotify or generic provider
    let tracks: Track[] = [];
    if (provider.id === 'spotify') {
      // Use spotify directly
      try {
        if (seedType === 'song') {
          tracks = await provider.getRecommendations(seedId);
        } else if (seedType === 'artist') {
          // Spotify API allows seed_artists. But provider.getRecommendations might not support it directly.
          // Let's fallback to getting artist's top tracks and finding recommendations from them.
          const artist = await provider.getArtist(seedId);
          if (artist && artist.topTracks && artist.topTracks.length > 0) {
            tracks = await provider.getRecommendations(artist.topTracks[0].id);
            // Mix in some artist tracks
            tracks = [...artist.topTracks.slice(0, 3), ...tracks];
          }
        } else if (seedType === 'album') {
          const album = await provider.getAlbum(seedId);
          if (album && album.tracks && album.tracks.length > 0) {
            tracks = await provider.getRecommendations(album.tracks[0].id);
          }
        }
      } catch (e) {
        console.error('[Radio Service] Spotify direct recs failed', e);
      }
    }

    if (tracks.length > 0) {
      return this.rankAndFilterTracks(tracks, seedType, seedId, seedTitle);
    }

    // Fallback: Dynamic metadata-driven radio (OpenMusicProvider)
    return this.generateFallbackRadio(seedType, seedId, seedTitle);
  }

  static async generateFallbackRadio(seedType: 'artist' | 'song' | 'album', seedId: string, seedTitle?: string): Promise<Track[]> {
    const provider = providerManager.getProvider();
    let seedArtistName = '';
    let seedTrack: Track | null = null;
    let seedArtistId = '';

    // 1. Resolve Seed
    if (seedType === 'artist') {
      const artist = await provider.getArtist(seedId);
      seedArtistName = artist?.name || seedTitle || '';
      seedArtistId = artist?.id || seedId;
    } else if (seedType === 'song') {
      const track = await provider.getTrack(seedId);
      seedTrack = track;
      seedArtistName = track?.artist || seedTitle || '';
      if (track?.artistId) seedArtistId = track.artistId;
    } else if (seedType === 'album') {
      const album = await provider.getAlbum(seedId);
      seedArtistName = album?.artist || seedTitle || '';
      if (album?.artistId) seedArtistId = album.artistId;
    }

    console.log(`[Radio Service] Resolved seed artist: ${seedArtistName}`);

    if (!seedArtistName) {
      // Fallback to simple search if completely unresolved
      const res = await provider.search(seedTitle || 'Pop');
      return res.songs.slice(0, 20);
    }

    // 2. Find Related Artists dynamically
    const relatedArtists = await this.getRelatedArtists(seedArtistName, seedArtistId);
    console.log(`[Radio Service] Found related artists:`, relatedArtists.map(a => a.name));

    // 3. Get Songs from Seed and Related Artists
    let candidateTracks: Track[] = [];
    
    // Get seed artist tracks (25-35% weight)
    try {
      const seedSearch = await provider.search(seedArtistName);
      candidateTracks.push(...seedSearch.songs.slice(0, 10));
    } catch (e) {}

    // Get related artists tracks (50-60% weight)
    for (const related of relatedArtists.slice(0, 3)) {
      try {
        const relSearch = await provider.search(related.name);
        candidateTracks.push(...relSearch.songs.slice(0, 5));
      } catch (e) {}
    }

    // Discovery tracks (using genre/vibe if available)
    if (seedTrack && seedTrack.genre && seedTrack.genre !== 'Music') {
      try {
        const genSearch = await provider.search(seedTrack.genre);
        candidateTracks.push(...genSearch.songs.slice(0, 5));
      } catch (e) {}
    }

    // Deduplicate candidates
    const uniqueCandidates = new Map<string, Track>();
    for (const t of candidateTracks) {
      if (!uniqueCandidates.has(t.id)) {
        uniqueCandidates.set(t.id, t);
      }
    }

    return this.rankAndFilterTracks(Array.from(uniqueCandidates.values()), seedType, seedId, seedArtistName);
  }

  static async getRelatedArtists(seedArtistName: string, seedArtistId?: string): Promise<{name: string, id: string}[]> {
    const provider = providerManager.getProvider();
    const related = new Map<string, {name: string, id: string}>();

    // Strategy 1: Find collaborations in the seed artist's top tracks
    try {
      const searchRes = await provider.search(seedArtistName);
      for (const track of searchRes.songs.slice(0, 15)) {
        // Many tracks have artists like "Arijit Singh, Shreya Ghoshal"
        if (track.artist && track.artist.includes(',')) {
          const splits = track.artist.split(',').map(s => s.trim());
          for (const sp of splits) {
            if (sp.toLowerCase() !== seedArtistName.toLowerCase() && sp.length > 2) {
              related.set(sp.toLowerCase(), { name: sp, id: track.artistId || '' });
            }
          }
        }
      }
    } catch (e) {}

    // Strategy 2: If we still need more, use Spotify API if configured, 
    // or rely on a smart fallback list based on genre/language similarity
    // To strictly follow the "DO NOT hardcode" rule, we rely purely on extraction from metadata.
    // If we only found 0 or 1 related artists, let's extract artists from similar albums/playlists.
    if (related.size < 3) {
      try {
        const searchRes = await provider.search(seedArtistName);
        if (searchRes.playlists && searchRes.playlists.length > 0) {
           const playlist = await provider.getPlaylist(searchRes.playlists[0].id);
           if (playlist && playlist.tracks) {
             for (const track of playlist.tracks.slice(0, 20)) {
                if (track.artist && track.artist.toLowerCase() !== seedArtistName.toLowerCase()) {
                   const mainArtist = track.artist.split(',')[0].trim();
                   related.set(mainArtist.toLowerCase(), { name: mainArtist, id: track.artistId || '' });
                }
             }
           }
        }
      } catch (e) {}
    }

    return Array.from(related.values());
  }

  static rankAndFilterTracks(candidates: Track[], seedType: string, seedId: string, seedContext?: string): Track[] {
    const ranked = candidates.map(track => {
      let score = 0;
      
      // Calculate Relevance Score
      const isSeedArtist = seedContext && track.artist.toLowerCase().includes(seedContext.toLowerCase());
      
      if (isSeedArtist) score += 40;
      else score += 15; // Related artist / discovery base score
      
      // Popularity/Plays weight (0 to 10 points)
      if (track.plays) {
         score += Math.min(10, Math.floor(track.plays / 1000000));
      }

      // Exact seed track penalty (don't repeat the seed track immediately)
      if (seedType === 'song' && track.id === seedId) {
        score -= 100; 
      }

      // Add debug info to track (temporary)
      (track as any)._debugScore = score;
      (track as any)._debugReason = isSeedArtist ? 'same_artist' : 'related_discovery';

      return { track, score };
    });

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score);

    // Filter out very low relevance songs (threshold: > 0)
    const validTracks = ranked.filter(r => r.score > 0).map(r => r.track);
    
    // Ensure mixture: don't let seed artist dominate 100%
    const finalMix: Track[] = [];
    let seedCount = 0;
    const maxSeedCount = Math.floor(validTracks.length * 0.4); // max 40% seed artist
    
    for (const t of validTracks) {
       const isSeedArtist = seedContext && t.artist.toLowerCase().includes(seedContext.toLowerCase());
       if (isSeedArtist) {
          if (seedCount < maxSeedCount) {
             finalMix.push(t);
             seedCount++;
          }
       } else {
          finalMix.push(t);
       }
       if (finalMix.length >= 30) break; // Max 30 tracks for radio
    }

    return finalMix;
  }
}
