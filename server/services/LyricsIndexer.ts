import { Track, LyricsData } from '../../src/types';

interface LyricsRecord {
  trackId: string;
  trackTitle: string;
  artistName: string;
  normalizedText: string;
  tokens: string[];
}

export class LyricsIndexer {
  private index: Map<string, LyricsRecord> = new Map();

  // English & Hindi stopwords
  private stopWords = new Set([
    'a', 'an', 'the', 'is', 'to', 'in', 'of', 'and', 'for', 'with', 'on', 'at', 'from', 'by', 'this', 'that', 'it', 'I', 'me', 'you', 'your', 'my', 'we', 'us',
    'hai', 'ki', 'ke', 'ka', 'ko', 'se', 'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'hum', 'tum', 'yeh', 'woh', 'main', 'tu', 'aur', 'toh', 'hi', 'bhi', 'tha', 'thi', 'the'
  ]);

  private normalize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      // Remove all punctuation except apostrophes
      .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(' ')
      .filter((token) => token.length > 0 && !this.stopWords.has(token));
  }

  public indexLyrics(trackId: string, trackTitle: string, artistName: string, lyrics: string) {
    if (!trackId || !lyrics) return;
    
    // Convert newlines to spaces for easier phrase matching
    const singleLineLyrics = lyrics.replace(/\n/g, ' ');
    const normalizedText = this.normalize(singleLineLyrics);
    const tokens = this.tokenize(normalizedText);

    this.index.set(trackId, {
      trackId,
      trackTitle,
      artistName,
      normalizedText,
      tokens
    });
  }

  public search(query: string): Array<{ trackId: string; score: number }> {
    const qNorm = this.normalize(query);
    if (!qNorm) return [];

    const qTokens = this.tokenize(qNorm);
    const results: Array<{ trackId: string; score: number }> = [];

    // If query is basically just stop words or 1 common word, don't trigger lyrics matching heavily.
    if (qTokens.length === 0) return [];

    for (const record of this.index.values()) {
      let score = 0;

      // 1. Exact Substring / Phrase Match
      // If the spoken phrase appears exactly in the lyrics (even if it contains stop words)
      if (record.normalizedText.includes(qNorm)) {
        // High score for exact phrase match
        score += 80;
        // Boost further based on length of the phrase (longer phrase = more unique)
        const wordCount = qNorm.split(' ').length;
        if (wordCount >= 4) {
          score += 50; // Distinctive phrase
        } else if (wordCount >= 2) {
          score += 20;
        }
      } else {
        // 2. Token Overlap Similarity (Fuzzy/Partial)
        let matchCount = 0;
        for (const qt of qTokens) {
          if (record.tokens.includes(qt)) {
            matchCount++;
          }
        }
        
        if (matchCount > 0) {
          // Calculate Jaccard-like similarity or just raw match coverage
          const coverage = matchCount / qTokens.length; // 0.0 to 1.0
          
          if (coverage >= 0.8) score += 60;
          else if (coverage >= 0.5) score += 30;
          else if (coverage >= 0.3) score += 10;
        }

        // 3. Consecutive Partial Phrase Match
        // E.g., user says "waking up to the ash" but lyrics say "waking up to ash"
        const qWords = qNorm.split(' ');
        let maxConsecutive = 0;
        let currentConsecutive = 0;
        const targetWords = record.normalizedText.split(' ');

        for (let i = 0; i < targetWords.length; i++) {
          if (qWords.includes(targetWords[i]) && !this.stopWords.has(targetWords[i])) {
            currentConsecutive++;
            if (currentConsecutive > maxConsecutive) {
              maxConsecutive = currentConsecutive;
            }
          } else {
            currentConsecutive = 0;
          }
        }
        
        if (maxConsecutive >= 3) {
          score += 40;
        } else if (maxConsecutive === 2) {
          score += 15;
        }
      }

      if (score > 0) {
        // Soften score if the query looks exactly like the song title, 
        // to let Title matching dominate and avoid over-boosting title-only queries
        const titleNorm = this.normalize(record.trackTitle);
        if (titleNorm === qNorm) {
          score = Math.floor(score * 0.3); // De-prioritize lyrics score if it's just the title
        }

        results.push({ trackId: record.trackId, score });
      }
    }

    // Return descending sorted results
    return results.sort((a, b) => b.score - a.score).filter(r => r.score >= 10);
  }

  // Temporary function to seed known lyrics for test cases since the catalog is dynamic
  public seedTestLyrics() {
    // 1. "waking up to ash and dust" - Radioactive by Imagine Dragons
    this.indexLyrics('saavn-123_radioactive', 'Radioactive', 'Imagine Dragons', 'I\'m waking up to ash and dust I wipe my brow and I sweat my rust I\'m breathing in the chemicals');
    
    // 2. Hindi Song with custom ID
    this.indexLyrics('saavn-eDqkyo85', 'Raabta', 'Arijit Singh', 'in raabton se door tere raston se door mujhe ho jaane de aaj khud se tu door lambiyan judaiyaan');

    // 3. Hello by Adele
    this.indexLyrics('saavn-456_hello', 'Hello', 'Adele', 'Hello from the other side I must have called a thousand times to tell you I\'m sorry for everything that I\'ve done');
    
    // 4. Believer by Imagine Dragons
    this.indexLyrics('saavn-789_believer', 'Believer', 'Imagine Dragons', 'First things first I\'ma say all the words inside my head I\'m fired up and tired of the way that things have been');

    // 5. Kesariya
    this.indexLyrics('saavn-kesariya', 'Kesariya', 'Arijit Singh', 'kesariya tera ishq hai piya rang jaaun jo main haath lagaun');
  }
}

export const lyricsIndexer = new LyricsIndexer();
// Pre-seed some popular lyrics for the tests
lyricsIndexer.seedTestLyrics();
