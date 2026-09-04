import { api } from '../services/apiClient';
import { Track } from '../types';
import { PersonalizationContext, isFollowedArtistMatch } from './searchRanker';

export async function getAutoplayRecommendation(
  currentTrack: Track,
  personalization: PersonalizationContext
): Promise<Track | null> {
  const candidates: Track[] = [];
  
  try {
    // 1. Fetch songs by the same artist
    if (currentTrack.artist) {
      const artistRes = await api.search(currentTrack.artist);
      if (artistRes.success && artistRes.data?.songs) {
        candidates.push(...artistRes.data.songs);
      }
    }

    // 2. Fetch generic recommendations
    // Get primary genre if available, or try to extract from tags
    let genre = (currentTrack as any).genre || '';
    if (!genre && currentTrack.title.toLowerCase().includes('hindi')) genre = 'hindi';
    
    const recRes = await api.getRecommendations(currentTrack.id, genre);
    if (recRes.success && recRes.data) {
      candidates.push(...recRes.data);
    }
    
    // Deduplicate
    const uniqueMap = new Map<string, Track>();
    for (const c of candidates) {
      if (c.id !== currentTrack.id) {
        uniqueMap.set(c.id, c);
      }
    }
    const uniqueCandidates = Array.from(uniqueMap.values());
    if (uniqueCandidates.length === 0) return null;

    // Filter out recently played from history if possible
    const recentlyPlayedIds = new Set(
      (personalization.recentHistory || []).slice(0, 15).map(h => h.track.id)
    );
    let freshCandidates = uniqueCandidates.filter(t => !recentlyPlayedIds.has(t.id));
    if (freshCandidates.length === 0) {
      freshCandidates = uniqueCandidates; // Fallback if all were recently played
    }

    // Rank based on user's rules:
    // 1. Same artist
    // 2. Same language/genre (inferred from text)
    // 3. User's personal listening preferences (likes, replays)
    // 4. Popularity
    
    freshCandidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. Same Artist
      if (a.artist === currentTrack.artist) scoreA += 1000;
      if (b.artist === currentTrack.artist) scoreB += 1000;
      
      if (a.artistId === currentTrack.artistId && a.artistId) scoreA += 1000;
      if (b.artistId === currentTrack.artistId && b.artistId) scoreB += 1000;

      // 2. Personal Preferences
      if (personalization.likes?.has(a.id)) scoreA += 300;
      if (personalization.likes?.has(b.id)) scoreB += 300;

      if (isFollowedArtistMatch(a.artist, a.artistId, personalization.followedArtists, personalization.followedArtistNames)) scoreA += 400;
      if (isFollowedArtistMatch(b.artist, b.artistId, personalization.followedArtists, personalization.followedArtistNames)) scoreB += 400;

      const playsA = personalization.trackPlays?.[a.id] || 0;
      const playsB = personalization.trackPlays?.[b.id] || 0;
      scoreA += Math.min(200, playsA * 10);
      scoreB += Math.min(200, playsB * 10);

      // 3. Language / Genre string matching heuristic
      const aText = `${a.title} ${a.album}`.toLowerCase();
      const bText = `${b.title} ${b.album}`.toLowerCase();
      const cText = `${currentTrack.title} ${currentTrack.album}`.toLowerCase();
      
      const keywords = ['hindi', 'punjabi', 'lofi', 'acoustic', 'remix', 'live', 'bollywood'];
      for (const kw of keywords) {
        if (cText.includes(kw)) {
          if (aText.includes(kw)) scoreA += 200;
          if (bText.includes(kw)) scoreB += 200;
        }
      }

      // 4. Global Popularity
      const popA = a.plays || a.play_count || a.views || 0;
      const popB = b.plays || b.play_count || b.views || 0;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      return popB - popA;
    });

    return freshCandidates[0];
  } catch (e) {
    console.error('Autoplay resolution failed', e);
    return null;
  }
}
