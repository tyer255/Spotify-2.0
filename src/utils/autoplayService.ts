import { api } from '../services/apiClient';
import { Track } from '../types';
import { PersonalizationContext, isFollowedArtistMatch } from './searchRanker';

export async function getAutoplayRecommendation(
  currentTrack: Track,
  personalization: PersonalizationContext,
  playedTrackIds: string[] = []
): Promise<Track | null> {
  const candidates: Track[] = [];
  
  try {
    if (currentTrack.artist) {
      const artistRes = await api.search(currentTrack.artist);
      if (artistRes.success && artistRes.data?.songs) {
        candidates.push(...artistRes.data.songs);
      }
    }

    let genre = (currentTrack as any).genre || '';
    if (!genre && currentTrack.title.toLowerCase().includes('hindi')) genre = 'hindi';
    if (!genre && currentTrack.title.toLowerCase().includes('punjabi')) genre = 'punjabi';
    if (!genre && currentTrack.title.toLowerCase().includes('telugu')) genre = 'telugu';
    if (!genre && currentTrack.title.toLowerCase().includes('tamil')) genre = 'tamil';
    
    const recRes = await api.getRecommendations(currentTrack.id, genre);
    if (recRes.success && recRes.data) {
      candidates.push(...recRes.data);
    }
    
    const uniqueMap = new Map<string, Track>();
    const recentSessionPlayedIds = new Set(playedTrackIds.slice(-50));
    
    const currentSignature = `${currentTrack.title.toLowerCase().trim()}|${currentTrack.artist.toLowerCase().trim()}`;

    for (const c of candidates) {
      const cSignature = `${c.title.toLowerCase().trim()}|${c.artist.toLowerCase().trim()}`;
      if (c.id === currentTrack.id || cSignature === currentSignature) {
        continue;
      }
      if (!recentSessionPlayedIds.has(c.id)) {
        uniqueMap.set(c.id, c);
      }
    }
    
    if (uniqueMap.size < 2) {
      const fallbackKeyword = genre || 'trending music';
      const fallbackRes = await api.search(fallbackKeyword);
      if (fallbackRes.success && fallbackRes.data?.songs) {
        for (const c of fallbackRes.data.songs) {
          const cSignature = `${c.title.toLowerCase().trim()}|${c.artist.toLowerCase().trim()}`;
          if (c.id !== currentTrack.id && cSignature !== currentSignature && !recentSessionPlayedIds.has(c.id)) {
            uniqueMap.set(c.id, c);
          }
        }
      }
      if (uniqueMap.size === 0) {
        for (const c of candidates) {
          const cSignature = `${c.title.toLowerCase().trim()}|${c.artist.toLowerCase().trim()}`;
          if (c.id !== currentTrack.id && cSignature !== currentSignature) {
            uniqueMap.set(c.id, c);
          }
        }
      }
    }

    const uniqueCandidates = Array.from(uniqueMap.values());
    if (uniqueCandidates.length === 0) return null;

    const recentlyPlayedIds = new Set(
      (personalization.recentHistory || []).slice(0, 30).map(h => h.track.id)
    );

    let freshCandidates = uniqueCandidates.filter(t => !recentlyPlayedIds.has(t.id));
    if (freshCandidates.length === 0) {
      freshCandidates = uniqueCandidates; 
    }

    freshCandidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const aIsSameArtist = a.artist.toLowerCase() === currentTrack.artist.toLowerCase() || (a.artistId === currentTrack.artistId && a.artistId);
      const bIsSameArtist = b.artist.toLowerCase() === currentTrack.artist.toLowerCase() || (b.artistId === currentTrack.artistId && b.artistId);
      
      if (aIsSameArtist) scoreA += 5000;
      if (bIsSameArtist) scoreB += 5000;
      
      const aText = `${a.title} ${a.album}`.toLowerCase();
      const bText = `${b.title} ${b.album}`.toLowerCase();
      const cText = `${currentTrack.title} ${currentTrack.album}`.toLowerCase();
      
      const languages = ['hindi', 'punjabi', 'telugu', 'tamil', 'english', 'spanish'];
      for (const lang of languages) {
        if (cText.includes(lang) || genre === lang) {
          if (aText.includes(lang)) scoreA += 2000;
          if (bText.includes(lang)) scoreB += 2000;
        }
      }

      if (personalization.likes?.has(a.id)) scoreA += 500;
      if (personalization.likes?.has(b.id)) scoreB += 500;
      
      if (isFollowedArtistMatch(a.artist, a.artistId, personalization.followedArtists, personalization.followedArtistNames)) scoreA += 400;
      if (isFollowedArtistMatch(b.artist, b.artistId, personalization.followedArtists, personalization.followedArtistNames)) scoreB += 400;

      const playsA = personalization.trackPlays?.[a.id] || 0;
      const playsB = personalization.trackPlays?.[b.id] || 0;
      scoreA += Math.min(200, playsA * 10);
      scoreB += Math.min(200, playsB * 10);
      
      const keywords = ['lofi', 'acoustic', 'remix', 'live', 'bollywood'];
      for (const kw of keywords) {
        if (cText.includes(kw)) {
          if (aText.includes(kw)) scoreA += 300;
          if (bText.includes(kw)) scoreB += 300;
        }
      }

      const popA = a.plays || a.play_count || a.views || 0;
      const popB = b.plays || b.play_count || b.views || 0;
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      return popB - popA;
    });

    return freshCandidates[0];
  } catch (e) {
    console.error('Autoplay resolution failed', e);
    return null;
  }
}

