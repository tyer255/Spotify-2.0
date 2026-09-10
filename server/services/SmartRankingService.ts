

export interface MusicEvent {
  id?: string;
  user_id: string;
  song_id: string;
  event_type: 'search' | 'play' | 'play_completed' | 'click' | 'like';
  timestamp: number;
  session_id?: string;
}

class SmartRankingService {
  // Memory cache to avoid hitting Firestore on every search
  private cachedEvents: MusicEvent[] = [];
  private lastFetch: number = 0;

  async logEvent(event: Omit<MusicEvent, 'id' | 'timestamp'>) {
    const timestamp = Date.now();
    
    // Deduplication / Rate limiting check against cache
    const recentDuplicate = this.cachedEvents.find(
      e => e.user_id === event.user_id && 
           e.song_id === event.song_id && 
           e.event_type === event.event_type && 
           (timestamp - e.timestamp) < 30000
    );

    if (recentDuplicate) {
      return; // Skip duplicate
    }

    const newEvent = {
      ...event,
      timestamp
    };
    
    // Optimistic cache update
    this.cachedEvents.push(newEvent);
    // Bound memory
    if (this.cachedEvents.length > 50000) {
      this.cachedEvents = this.cachedEvents.slice(10000);
    }
  }

  // Calculate scores and re-rank songs
  async rankSongs(songs: any[], userId: string, queryStr: string) {
    if (!songs || songs.length === 0) return songs;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Pre-calculate user history for personalization (Requirement 6)
    const userPlays = this.cachedEvents.filter(e => e.user_id === userId && (e.event_type === 'play' || e.event_type === 'play_completed'));
    const userFrequentSongIds = new Set(userPlays.map(e => e.song_id));

    const rankedSongs = songs.map((song, index) => {
      // 1. Text Match Score
      const textMatchScore = song._searchScore !== undefined ? song._searchScore : Math.max(0, 1000 - (index * 20));

      const songEvents = this.cachedEvents.filter(e => e.song_id === song.id);
      
      let totalSearches = 0;
      let totalPlays = 0;
      let uniqueUsers = new Set<string>();
      let trendingScore = 0;

      songEvents.forEach(e => {
        uniqueUsers.add(e.user_id);
        if (e.event_type === 'search') totalSearches++;
        if (e.event_type === 'play' || e.event_type === 'play_completed') totalPlays++;
        
        const hoursAgo = (now - e.timestamp) / oneHour;
        const timeDecay = Math.exp(-hoursAgo / 24);
        
        let eventWeight = 0;
        if (e.event_type === 'play') eventWeight = 2;
        if (e.event_type === 'play_completed') eventWeight = 3;
        if (e.event_type === 'search') eventWeight = 1;
        if (e.event_type === 'like') eventWeight = 4;
        if (e.event_type === 'click') eventWeight = 0.5;

        trendingScore += (eventWeight * timeDecay);
      });

      const globalPopularityScore = (totalPlays * 0.5) + (totalSearches * 0.2) + (uniqueUsers.size * 2);
      trendingScore = trendingScore * 5; 

      let userPreferenceScore = 0;
      if (userFrequentSongIds.has(song.id)) {
        userPreferenceScore = 15;
      }
      
      const finalScore = textMatchScore + globalPopularityScore + trendingScore + userPreferenceScore;

      return {
        song,
        finalScore
      };
    });

    rankedSongs.sort((a, b) => b.finalScore - a.finalScore);
    return rankedSongs.map(rs => rs.song);
  }
}

export const smartRankingService = new SmartRankingService();
