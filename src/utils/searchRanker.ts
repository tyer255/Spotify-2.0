import { Track, SearchSuggestion, SearchResults, Artist, Album, Playlist } from '../types';
import { resolveArtist, isArtistAliasMatch, getArtistAliasNames } from './artistAliases';

export { resolveArtist, isArtistAliasMatch, getArtistAliasNames };

/**
 * Strips diacritics and accents (e.g. "Beyoncé" -> "Beyonce", "Motörhead" -> "Motorhead").
 */
export function stripDiacritics(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Strips bracketed metadata suffixes (e.g., "(Official Video)", "[From 'Gangubai']", "(Remix)", etc.)
 * and removes noisy punctuation for clean title matching.
 */
export function cleanSearchTitle(title: string): string {
  if (!title) return '';
  return stripDiacritics(title)
    .replace(/\s*[\(\[][^\)\]]*(?:Official|Video|Audio|Remix|Version|Female|Male|Cover|From|Soundtrack|OST|Lofi|Live|Deluxe|Reprise|Acoustic|Extended|Sped Up|Slowed|Reverb|Karaoke|Instrumental|Feat|Ft)[^\)\]]*[\)\]]/gi, '')
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes any text query or title string for strict comparison.
 */
export function normalizeSearchString(text: string): string {
  if (!text) return '';
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts a numeric epoch timestamp (ms) from release_date, releaseDate, created_at, createdAt, releaseYear, or year.
 */
export function extractReleaseTimestamp(item: any): number {
  if (!item) return 0;

  const dateStr = item.release_date || item.releaseDate || item.created_at || item.createdAt;
  if (typeof dateStr === 'string' && dateStr.trim().length > 0) {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    const yearMatch = dateStr.match(/^(\d{4})/);
    if (yearMatch) {
      const yr = parseInt(yearMatch[1], 10);
      if (yr > 1900 && yr < 2100) {
        return new Date(yr, 0, 1).getTime();
      }
    }
  }

  const yearVal = item.releaseYear ?? item.year;
  if (typeof yearVal === 'number' && yearVal > 1900 && yearVal < 2100) {
    return new Date(yearVal, 0, 1).getTime();
  }
  if (typeof yearVal === 'string' && yearVal.trim().length > 0) {
    const yr = parseInt(yearVal.trim(), 10);
    if (!isNaN(yr) && yr > 1900 && yr < 2100) {
      return new Date(yr, 0, 1).getTime();
    }
  }

  return 0;
}

/**
 * Extracts a numeric popularity / play count score from play_count, plays, views, or popularity.
 */
export function extractPlayCount(item: any): number {
  if (!item) return 0;
  const count = item.play_count ?? item.plays ?? item.views ?? item.popularity;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') {
    const parsed = parseInt(count, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Version keywords used to detect alternate versions (Female Version, Male Version, Remix, Live, Acoustic, etc.).
 */
export const VERSION_KEYWORDS = [
  'female version',
  'female',
  'male version',
  'male',
  'cover',
  'covers',
  'remix',
  'remixes',
  'recreated',
  'remake',
  'reprise',
  'acoustic',
  'unplugged',
  'lofi',
  'lo-fi',
  'slowed',
  'reverb',
  'sped up',
  'speed up',
  'karaoke',
  'instrumental',
  'live',
  'tribute',
  'mashup',
  'parody',
  'rendition',
  '8d',
  '8d audio',
  'bass boosted',
  'nightcore',
  'piano version',
  'hardstyle',
  'techno',
  'duet',
  'deluxe',
  'extended',
  'radio edit',
  'orchestral',
  'club mix',
  'originally performed',
];

/**
 * Fast Levenshtein distance calculation with an optional early-exit max distance threshold.
 */
export function levenshteinDistance(s1: string, s2: string, maxLimit: number = 10): number {
  if (s1 === s2) return 0;
  if (!s1) return s2.length;
  if (!s2) return s1.length;
  if (Math.abs(s1.length - s2.length) > maxLimit) return maxLimit + 1;

  const len1 = s1.length;
  const len2 = s2.length;
  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    let minInRow = currRow[0];
    const char1 = s1.charCodeAt(i - 1);

    for (let j = 1; j <= len2; j++) {
      const cost = char1 === s2.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
      if (currRow[j] < minInRow) minInRow = currRow[j];
    }

    if (minInRow > maxLimit) return maxLimit + 1;

    // Swap rows
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[len2];
}

/**
 * Computes a normalized string similarity ratio between 0.0 (no match) and 1.0 (exact match).
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = normalizeSearchString(str1);
  const s2 = normalizeSearchString(str2);
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen;
  }

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2, Math.floor(maxLen * 0.5) + 1);
  if (dist > maxLen) return 0;
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Parsed user search query metadata.
 */
export interface ParsedSearchQuery {
  raw: string;
  normalized: string;
  clean: string;
  tokens: string[];
  cleanTokens: string[];
  requestedVersions: string[];
  hasVersionIntent: boolean;
  isArtistSongPattern: boolean;
}

/**
 * Decomposes a search query into normalized tokens and detects intent (version requests, artist splits).
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const raw = (query || '').trim();
  const normalized = normalizeSearchString(raw);
  const clean = cleanSearchTitle(raw);

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const cleanTokens = clean.split(/\s+/).filter(Boolean);

  // Detect if user explicitly requested a specific version
  const requestedVersions: string[] = [];
  for (const kw of VERSION_KEYWORDS) {
    if (normalized.includes(kw)) {
      requestedVersions.push(kw);
    }
  }

  const hasVersionIntent = requestedVersions.length > 0;
  const isArtistSongPattern = rawTokens.length >= 2;

  return {
    raw,
    normalized,
    clean,
    tokens: rawTokens,
    cleanTokens,
    requestedVersions,
    hasVersionIntent,
    isArtistSongPattern,
  };
}

/**
 * Evaluates candidate version characteristics.
 */
export function inspectCandidateVersion(
  title: string,
  album?: string
): { isVersion: boolean; matchedKeywords: string[] } {
  const combined = ` ${title || ''} ${album || ''} `.toLowerCase();
  const matchedKeywords: string[] = [];

  for (const kw of VERSION_KEYWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s\\(\\)\\[\\]\\-_,.:;/"'|])${escaped}(?:$|[\\s\\(\\)\\[\\]\\-_,.:;/"'|])`, 'i');
    if (regex.test(combined)) {
      matchedKeywords.push(kw);
    }
  }

  return {
    isVersion: matchedKeywords.length > 0,
    matchedKeywords,
  };
}

export interface PersonalizationContext {
  trackPlays?: Record<string, number>;
  artistPlays?: Record<string, number>;
  searchSelections?: Record<string, Record<string, number>>;
  skips?: Record<string, number>;
  replays?: Record<string, number>;
  recentHistory?: { track: Track; playedAt: string }[];
  likes?: Set<string>;
  followedArtists?: Set<string>;
  followedArtistNames?: string[];
}

/**
 * Checks if a candidate artist name or artistId matches any artist followed by the user.
 * Supports exact IDs, normalized names, canonical names, and Spotiz aliases.
 */
export function isFollowedArtistMatch(
  artistName: string | undefined,
  artistId: string | undefined,
  followedArtists: Set<string> | undefined,
  followedArtistNames?: string[]
): boolean {
  if (
    (!followedArtists || followedArtists.size === 0) &&
    (!followedArtistNames || followedArtistNames.length === 0)
  ) {
    return false;
  }
  if (artistId && followedArtists.has(artistId)) return true;
  if (!artistName) return false;

  const norm = normalizeSearchString(artistName);
  const clean = cleanSearchTitle(artistName);

  for (const fa of followedArtists) {
    if (fa === artistId) return true;
    const faNorm = normalizeSearchString(fa);
    if (faNorm === norm || faNorm === clean) return true;
    if (isArtistAliasMatch(artistName, fa)) return true;
  }

  if (followedArtistNames && followedArtistNames.length > 0) {
    for (const faName of followedArtistNames) {
      const faNorm = normalizeSearchString(faName);
      if (faNorm === norm || faNorm === clean) return true;
      if (isArtistAliasMatch(artistName, faName)) return true;
    }
  }

  return false;
}

/**
 * Structured relevance score breakdown for an item against a parsed search query.
 */
export interface RelevanceScore {
  totalScore: number;
  exactTitleMatch: boolean;
  exactArtistMatch: boolean;
  comboMatch: boolean;
  fuzzyMatch: boolean;
  titleScore: number;
  artistScore: number;
  albumScore: number;
  comboScore: number;
  tokenScore: number;
  fuzzyScore: number;
  versionBonus: number;
  popularityScore: number;
  recencyScore: number;
  personalScore: number;
  originalArtistPriority: number;
  lengthDiff: number;
  lyricsScore: number;
  matchTier: number; // Tier 1: Exact / Heard in App, Tier 2: Prefix, Tier 3: Combo/High Relevance, Tier 4: Substring, Tier 5: Fuzzy/Partial
}

/**
 * Weights configuration for calculating relevance scores.
 */
export interface ScoringWeights {
  exactTitle: number;
  exactCleanTitle: number;
  exactTitleNoSpace: number;
  titlePrefix: number;
  titleWordPrefix: number;
  titleSubstring: number;
  exactArtist: number;
  artistPrefix: number;
  artistSubstring: number;
  exactAlbum: number;
  albumPrefix: number;
  albumSubstring: number;
  comboArtistSong: number;
  tokenCoverageMax: number;
  fuzzyTitleMax: number;
  fuzzyArtistMax: number;
  requestedVersionBonus: number;
  unrequestedVersionPenalty: number;
  popularityMax: number;
  recencyMax: number;
  personalListeningMax: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  exactTitle: 1400,
  exactCleanTitle: 1100,
  exactTitleNoSpace: 1050,
  titlePrefix: 700,
  titleWordPrefix: 550,
  titleSubstring: 400,
  exactArtist: 2000, // Strongly prioritize artist's songs for exact artist queries
  artistPrefix: 700,
  artistSubstring: 500,
  exactAlbum: 80,
  albumPrefix: 50,
  albumSubstring: 30,
  comboArtistSong: 1400,
  tokenCoverageMax: 300,
  fuzzyTitleMax: 450,
  fuzzyArtistMax: 350,
  requestedVersionBonus: 400,
  unrequestedVersionPenalty: -950,
  popularityMax: 400,
  recencyMax: 30,
  personalListeningMax: 2200,
};

/**
 * Calculates a comprehensive, Spotify-style relevance score for any candidate music entity,
 * integrating query intent, exact matches, version filters, popularity, and user listening history.
 */
export function calculateRelevanceScore(
  item: {
    id?: string;
    title?: string;
    name?: string;
    artist?: string;
    artistId?: string;
    album?: string;
    release_date?: string;
    releaseDate?: string;
    created_at?: string;
    createdAt?: string;
    releaseYear?: number;
    year?: number;
    plays?: number;
    play_count?: number;
    views?: number;
    popularity?: number;
    lyricsMatchScore?: number;
  },
  parsedQuery: ParsedSearchQuery,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  personalization?: PersonalizationContext
): RelevanceScore {
  const { raw, normalized: qNorm, clean: qClean, tokens: qTokens, hasVersionIntent, requestedVersions } = parsedQuery;

  if (!qNorm) {
    return {
      totalScore: 0,
      exactTitleMatch: false,
      exactArtistMatch: false,
      comboMatch: false,
      fuzzyMatch: false,
      titleScore: 0,
      artistScore: 0,
      albumScore: 0,
      comboScore: 0,
      tokenScore: 0,
      fuzzyScore: 0,
      versionBonus: 0,
      popularityScore: 0,
      recencyScore: 0,
      personalScore: 0,
      originalArtistPriority: 0,
      lengthDiff: 0,
      lyricsScore: 0,
      matchTier: 5,
    };
  }

  const rawTitle = (item.title || item.name || '').trim();
  const normTitle = normalizeSearchString(rawTitle);
  const cleanTitle = cleanSearchTitle(rawTitle);

  const rawArtist = (item.artist || '').trim();
  const normArtist = normalizeSearchString(rawArtist);
  const cleanArtist = cleanSearchTitle(rawArtist);

  const rawAlbum = (item.album || '').trim();
  const normAlbum = normalizeSearchString(rawAlbum);
  const cleanAlbum = cleanSearchTitle(rawAlbum);

  const plays = extractPlayCount(item);
  const releaseTimestamp = extractReleaseTimestamp(item);

  const candidateVersion = inspectCandidateVersion(rawTitle, rawAlbum);

  let titleScore = 0;
  let artistScore = 0;
  let albumScore = 0;
  let comboScore = 0;
  let tokenScore = 0;
  let fuzzyScore = 0;
  let versionBonus = 0;
  let exactTitleMatch = false;
  let exactArtistMatch = false;
  let comboMatch = false;
  let fuzzyMatch = false;
  let matchTier = 5;

  // -------------------------------------------------------------
  // 1. EXACT TITLE MATCHING (Highest priority for direct song queries)
  // -------------------------------------------------------------
  if (normTitle === qNorm) {
    titleScore = weights.exactTitle;
    exactTitleMatch = true;
    matchTier = 1;
  } else if (!candidateVersion.isVersion && (cleanTitle === qClean || cleanTitle === qNorm)) {
    titleScore = weights.exactCleanTitle;
    exactTitleMatch = true;
    matchTier = 1;
  } else if (!candidateVersion.isVersion && normTitle.replace(/\s+/g, '') === qNorm.replace(/\s+/g, '')) {
    titleScore = weights.exactTitleNoSpace;
    exactTitleMatch = true;
    matchTier = 1;
  } else if (normTitle.startsWith(qNorm) || cleanTitle.startsWith(qClean)) {
    titleScore = candidateVersion.isVersion && !hasVersionIntent ? Math.round(weights.titlePrefix * 0.4) : weights.titlePrefix;
    matchTier = candidateVersion.isVersion && !hasVersionIntent ? 3 : 2;
  } else if (normTitle.split(/\s+/).some((w) => w.startsWith(qNorm))) {
    titleScore = candidateVersion.isVersion && !hasVersionIntent ? Math.round(weights.titleWordPrefix * 0.4) : weights.titleWordPrefix;
    matchTier = candidateVersion.isVersion && !hasVersionIntent ? 3 : 2;
  } else if (normTitle.includes(qNorm) || cleanTitle.includes(qClean)) {
    titleScore = candidateVersion.isVersion && !hasVersionIntent ? Math.round(weights.titleSubstring * 0.4) : weights.titleSubstring;
    matchTier = 4;
  }

  // -------------------------------------------------------------
  // 2. ARTIST MATCHING (Real names, Spotiz names, and known aliases)
  // -------------------------------------------------------------
  const artistAliasMatch = normArtist ? isArtistAliasMatch(normArtist, qNorm) : false;
  const resolvedQueryArtist = resolveArtist(qNorm);
  const artistAliases = normArtist ? getArtistAliasNames(normArtist) : [];

  if (normArtist) {
    const isExactNameOrAlias =
      normArtist === qNorm ||
      cleanArtist === qClean ||
      artistAliasMatch ||
      artistAliases.includes(qNorm) ||
      (resolvedQueryArtist && isArtistAliasMatch(normArtist, resolvedQueryArtist.entry.canonicalName));

    if (isExactNameOrAlias) {
      artistScore = weights.exactArtist;
      exactArtistMatch = true;
      if (matchTier > 1) matchTier = 1;
    } else if (normArtist.startsWith(qNorm) || artistAliases.some((al) => al.startsWith(qNorm))) {
      artistScore = weights.artistPrefix;
      if (matchTier > 3) matchTier = 3;
    } else if (normArtist.includes(qNorm) || artistAliases.some((al) => al.includes(qNorm))) {
      artistScore = weights.artistSubstring;
      if (matchTier > 4) matchTier = 4;
    }
  }

  // -------------------------------------------------------------
  // 3. ALBUM MATCHING
  // -------------------------------------------------------------
  if (normAlbum) {
    if (normAlbum === qNorm || cleanAlbum === qClean) {
      albumScore = weights.exactAlbum;
    } else if (normAlbum.startsWith(qNorm)) {
      albumScore = weights.albumPrefix;
    } else if (normAlbum.includes(qNorm)) {
      albumScore = weights.albumSubstring;
    }
  }

  // -------------------------------------------------------------
  // 4. ARTIST + SONG COMBO RECOGNITION (e.g. "Tere Bina High Born", "Tere Bina Taabish", "The Weeknd Blinding Lights", "Abel Tesfaye Starboy", "Madhurxo Aarzu")
  // -------------------------------------------------------------
  if (resolvedQueryArtist && resolvedQueryArtist.matchType === 'combo' && resolvedQueryArtist.extractedSongTitle) {
    const extractedNorm = normalizeSearchString(resolvedQueryArtist.extractedSongTitle);
    const isSongMatch =
      normTitle.includes(extractedNorm) ||
      cleanTitle.includes(extractedNorm) ||
      extractedNorm.includes(normTitle) ||
      normTitle.split(/\s+/).some((w) => w.length >= 3 && extractedNorm.includes(w));

    const isArtistMatch = isArtistAliasMatch(normArtist, resolvedQueryArtist.entry.canonicalName);

    if (isSongMatch && isArtistMatch) {
      comboScore = weights.comboArtistSong * 1.5;
      comboMatch = true;
      exactArtistMatch = true;
      matchTier = 1;
    }
  }

  if (qTokens.length >= 2 && normTitle && normArtist) {
    // Check if query tokens are split between artist (including all aliases) and title
    let artistTokensMatched = 0;
    let titleTokensMatched = 0;

    const allArtistTokens = new Set<string>();
    for (const al of [normArtist, ...artistAliases]) {
      for (const tok of al.split(/\s+/)) {
        if (tok.length >= 2) allArtistTokens.add(tok);
      }
    }

    const titleTokens = normTitle.split(/\s+/);

    for (const token of qTokens) {
      if (token.length <= 1) continue;
      const inArtist = Array.from(allArtistTokens).some((at) => at.startsWith(token) || token.startsWith(at) || at === token);
      const inTitle = titleTokens.some((tt) => tt.startsWith(token) || token.startsWith(tt) || tt === token);

      if (inArtist) artistTokensMatched++;
      if (inTitle) titleTokensMatched++;
    }

    // If query contains parts of both artist and title, grant massive Combo boost
    if (artistTokensMatched >= 1 && titleTokensMatched >= 1) {
      const matchRatio = (artistTokensMatched + titleTokensMatched) / qTokens.length;
      comboScore = Math.max(comboScore, weights.comboArtistSong * 1.35 * Math.min(1.2, matchRatio));
      comboMatch = true;
      if (matchTier > 2) matchTier = 1;
    }

    // Direct check: query contains artist alias and title (or title and artist alias)
    for (const al of [normArtist, ...artistAliases]) {
      if (al && al.length >= 2) {
        const combo1 = `${al} ${normTitle}`;
        const combo2 = `${normTitle} ${al}`;
        if (
          qNorm === combo1 ||
          qNorm === combo2 ||
          (qNorm.includes(al) && (qNorm.includes(normTitle) || qNorm.includes(cleanTitle)))
        ) {
          comboScore = Math.max(comboScore, weights.comboArtistSong * 1.4);
          comboMatch = true;
          matchTier = 1;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 5. TOKEN COVERAGE (Coverage across all metadata including all artist aliases)
  // -------------------------------------------------------------
  if (qTokens.length > 0) {
    const allAliasesText = artistAliases.join(' ');
    const fullMetadata = `${normTitle} ${cleanTitle} ${normArtist} ${cleanArtist} ${allAliasesText} ${normAlbum} ${cleanAlbum}`;
    let matchedTokenCount = 0;

    for (const t of qTokens) {
      if (t.length <= 1) continue;
      if (fullMetadata.includes(t)) {
        matchedTokenCount++;
      }
    }

    const coverage = matchedTokenCount / qTokens.length;
    tokenScore = weights.tokenCoverageMax * coverage;
  }

  // -------------------------------------------------------------
  // 6. FUZZY MATCHING & TYPO TOLERANCE
  // -------------------------------------------------------------
  if (!exactTitleMatch && normTitle.length > 3) {
    const titleSim = stringSimilarity(normTitle, qNorm);
    const cleanTitleSim = stringSimilarity(cleanTitle, qClean);
    const bestTitleSim = Math.max(titleSim, cleanTitleSim);

    if (bestTitleSim >= 0.75) {
      fuzzyScore += weights.fuzzyTitleMax * bestTitleSim;
      fuzzyMatch = true;
      if (matchTier > 3) matchTier = 3;
    }
  }

  if (!exactArtistMatch && normArtist.length > 3) {
    const artistSim = stringSimilarity(normArtist, qNorm);
    if (artistSim >= 0.75) {
      fuzzyScore += weights.fuzzyArtistMax * artistSim;
      fuzzyMatch = true;
      if (matchTier > 3) matchTier = 3;
    }
  }

  // -------------------------------------------------------------
  // 7. VERSION & DUPLICATE INTELLIGENCE
  // -------------------------------------------------------------
  if (candidateVersion.isVersion) {
    if (hasVersionIntent) {
      const matched = requestedVersions.some((rv) => candidateVersion.matchedKeywords.includes(rv));
      if (matched) {
        versionBonus = weights.requestedVersionBonus;
      }
    } else {
      versionBonus = weights.unrequestedVersionPenalty;
    }
  }

  // -------------------------------------------------------------
  // 8. POPULARITY BONUS (Logarithmic scaling)
  // -------------------------------------------------------------
  let popularityScore = 0;
  if (plays > 0) {
    const logPlays = Math.log10(Math.max(1, plays));
    popularityScore = Math.min(weights.popularityMax, Math.round(logPlays * 45));
    if (plays < 500 && !exactArtistMatch) {
      popularityScore -= 120; // Penalize obscure same-name tracks with negligible listens
    }
  }

  // -------------------------------------------------------------
  // 9. RECENCY BONUS
  // -------------------------------------------------------------
  let recencyScore = 0;
  if (releaseTimestamp > 0) {
    const currentYear = new Date().getFullYear();
    const releaseYear = new Date(releaseTimestamp).getFullYear();
    if (releaseYear >= currentYear - 2) {
      recencyScore = weights.recencyMax;
    } else if (releaseYear >= currentYear - 5) {
      recencyScore = Math.round(weights.recencyMax * 0.6);
    } else if (releaseYear >= currentYear - 10) {
      recencyScore = Math.round(weights.recencyMax * 0.3);
    }
  }

  // -------------------------------------------------------------
  // 10. SPOTIFY PERSONALIZATION & PRIOR LISTENING AFFINITY (Dominant Signal)
  // When a user searches for a song they have previously heard in the app,
  // this elevates that exact song directly to Rank #1.
  // -------------------------------------------------------------
  let personalScore = 0;
  const itemId = item.id || '';

  const hasRelevanceMatch =
    exactTitleMatch ||
    exactArtistMatch ||
    comboMatch ||
    fuzzyMatch ||
    titleScore > 0 ||
    artistScore > 0 ||
    comboScore > 0 ||
    tokenScore > 50;

  if (hasRelevanceMatch && personalization && itemId) {
    let strongAffinity = false;

    // A. Prior Listening in recentHistory (Direct "Song we heard previously in our app")
    if (personalization.recentHistory && personalization.recentHistory.length > 0) {
      const histIdx = personalization.recentHistory.findIndex((h) => h.track && h.track.id === itemId);
      if (histIdx !== -1) {
        strongAffinity = true;
        if (histIdx < 3) {
          personalScore += 1800; // Listened in the last 3 songs (Immediate repeat intent)
        } else if (histIdx < 8) {
          personalScore += 1500;
        } else if (histIdx < 16) {
          personalScore += 1200;
        } else {
          personalScore += 900;
        }
      }
    }

    // B. Total Play Count for this track
    const trackPlayCount = personalization.trackPlays?.[itemId] || 0;
    if (trackPlayCount > 0) {
      strongAffinity = true;
      personalScore += Math.min(800, trackPlayCount * 150);
    }

    // C. Replays (User put song on repeat / replayed)
    const replayCount = personalization.replays?.[itemId] || 0;
    if (replayCount > 0) {
      strongAffinity = true;
      personalScore += Math.min(700, replayCount * 220);
    }

    // D. Search Selection History for this specific query (Navigational Memory)
    const querySelections = personalization.searchSelections?.[qNorm] || personalization.searchSelections?.[qClean];
    if (querySelections && querySelections[itemId]) {
      strongAffinity = true;
      personalScore += querySelections[itemId] * 2000;
    }

    // E. Liked / Saved Track
    if (personalization.likes && personalization.likes.has(itemId)) {
      strongAffinity = true;
      personalScore += 450;
    }

    // F. Artist Listening Affinity
    if (normArtist && personalization.artistPlays) {
      const artistPlayCount =
        personalization.artistPlays[normArtist] ||
        personalization.artistPlays[cleanArtist] ||
        personalization.artistPlays[rawArtist] ||
        0;
      if (artistPlayCount > 0) {
        personalScore += Math.min(450, artistPlayCount * 100);
      }
    }

    // G. Followed Artist Personalization Boost (Dominant priority for followed artists)
    if (
      ((personalization.followedArtists && personalization.followedArtists.size > 0) ||
       (personalization.followedArtistNames && personalization.followedArtistNames.length > 0)) &&
      isFollowedArtistMatch(
        rawArtist,
        item.artistId,
        personalization.followedArtists,
        personalization.followedArtistNames
      )
    ) {
      strongAffinity = true;
      // If the query matches the song title (exact, clean, prefix, or word match), elevate to Tier 1 with massive boost
      if (exactTitleMatch || titleScore >= weights.titlePrefix) {
        personalScore += 1400;
        matchTier = 1;
      } else if (titleScore >= weights.titleWordPrefix || normTitle.includes(qNorm)) {
        personalScore += 1000;
        if (matchTier > 2) matchTier = 1;
      } else {
        personalScore += 650;
        if (matchTier > 3) matchTier = 2;
      }
    }

    // H. Skips Penalty (User skipped this version before)
    const skipCount = personalization.skips?.[itemId] || 0;
    if (skipCount > 0) {
      personalScore -= Math.min(500, skipCount * 150);
    }
  }

  const lengthDiff = Math.abs(rawTitle.length - raw.length);

  // Compute final aggregated relevance score
  
  // -------------------------------------------------------------
  // 11. ORIGINAL/OFFICIAL ARTIST PRIORITY
  // -------------------------------------------------------------
  let originalArtistPriority = 0;
  if (exactTitleMatch || exactArtistMatch || titleScore >= weights.titlePrefix) {
    const vInfo = inspectCandidateVersion(rawTitle, rawAlbum);
    const combinedStr = `${rawTitle} ${rawAlbum} ${rawArtist}`.toLowerCase();
    
    const isCover = combinedStr.includes('cover') || combinedStr.includes('tribute') || combinedStr.includes('karaoke') || combinedStr.includes('instrumental') || combinedStr.includes('lullaby');
    const isRemix = combinedStr.includes('remix') || combinedStr.includes('mix') || combinedStr.includes('mashup') || combinedStr.includes('edit') || combinedStr.includes('bootleg') || combinedStr.includes('dj remix');
    const isSlowed = combinedStr.includes('slow') || combinedStr.includes('sped') || combinedStr.includes('reverb') || combinedStr.includes('nightcore') || combinedStr.includes('lofi') || combinedStr.includes('lo-fi');
    const isAlternate = combinedStr.includes('live') || combinedStr.includes('acoustic') || combinedStr.includes('unplugged') || combinedStr.includes('deluxe') || combinedStr.includes('radio edit') || combinedStr.includes('female') || combinedStr.includes('male') || combinedStr.includes('rendition') || combinedStr.includes('recreated') || combinedStr.includes('remake');

    const knownArtist = resolveArtist(rawArtist);

    if (isCover) {
      originalArtistPriority = -250;
    } else if (isRemix || isSlowed) {
      originalArtistPriority = hasVersionIntent ? 100 : -100;
    } else if (isAlternate || vInfo.isVersion) {
      originalArtistPriority = hasVersionIntent ? 100 : -200;
    } else {
      if (knownArtist) {
        originalArtistPriority = 350; // Strongest boost for canonical/original
      } else {
        originalArtistPriority = 30; // Unrelated same-title song / uncertain
      }
    }

    // Original Soundtrack / Studio Album boost vs generic repackaged compilations
    const lowerAlbum = rawAlbum.toLowerCase();
    if (lowerAlbum.includes('soundtrack') || lowerAlbum.includes('original motion picture') || lowerAlbum.includes('from "') || lowerAlbum.includes("from '")) {
      originalArtistPriority += 220;
    } else if (
      lowerAlbum.includes('special') ||
      lowerAlbum.includes('vibes only') ||
      lowerAlbum.includes('next on repeat') ||
      lowerAlbum.includes('wedding love') ||
      lowerAlbum.includes('hits 202') ||
      lowerAlbum.includes('best of ') ||
      lowerAlbum.includes('top bollywood')
    ) {
      originalArtistPriority -= 80;
    }
  }

  let lyricsScore = item.lyricsMatchScore || 0;
  if (lyricsScore > 0) {
    // If a strong lyrics match is present, bump the matchTier
    if (lyricsScore >= 80 && matchTier > 2) matchTier = 2;
    else if (lyricsScore >= 40 && matchTier > 3) matchTier = 3;
  }

  const totalScore = Math.round(
    titleScore +
      artistScore +
      albumScore +
      comboScore +
      tokenScore +
      fuzzyScore +
      versionBonus +
      popularityScore +
      recencyScore +
      personalScore +
      originalArtistPriority +
      lyricsScore
  );

  if (qNorm === 'aur' && (rawTitle.toLowerCase().includes('aur') || rawTitle.toLowerCase().includes('tu hai kahan'))) {
    console.log(`[Score Debug] Title: ${rawTitle}, Artist: ${rawArtist}, Total: ${totalScore}, Tier: ${matchTier}, TitleScore: ${titleScore}, ArtistScore: ${artistScore}, originalPriority: ${originalArtistPriority}`);
  }

  return {
    totalScore,
    exactTitleMatch,
    exactArtistMatch,
    comboMatch,
    fuzzyMatch,
    titleScore,
    artistScore,
    albumScore,
    comboScore,
    tokenScore,
    fuzzyScore,
    versionBonus,
    popularityScore,
    recencyScore,
    personalScore,
    originalArtistPriority,
    lengthDiff,
    lyricsScore,
    matchTier,
  };
}

/**
 * Strict comparator implementing Spotiz's multi-signal ranking hierarchy:
 * 1. Final Relevance Score (Descending)
 * 2. Match Tier (Tier 1 > Tier 2 > Tier 3 > Tier 4 > Tier 5)
 * 3. Title length closeness to query
 * 4. Recency (Epoch timestamp descending)
 * 5. Popularity (Plays count descending)
 */
export function compareSearchRank(
  a: {
    title?: string;
    name?: string;
    artist?: string;
    album?: string;
    release_date?: string;
    releaseDate?: string;
    created_at?: string;
    createdAt?: string;
    releaseYear?: number;
    year?: number;
    plays?: number;
    play_count?: number;
    views?: number;
    popularity?: number;
  },
  b: {
    title?: string;
    name?: string;
    artist?: string;
    album?: string;
    release_date?: string;
    releaseDate?: string;
    created_at?: string;
    createdAt?: string;
    releaseYear?: number;
    year?: number;
    plays?: number;
    play_count?: number;
    views?: number;
    popularity?: number;
  },
  query: string
): number {
  const parsed = parseSearchQuery(query);
  const scoreA = calculateRelevanceScore(a, parsed);
  const scoreB = calculateRelevanceScore(b, parsed);

  // 1. Primary: Aggregate Relevance Score (Highest Score First)
  if (scoreA.totalScore !== scoreB.totalScore) {
    return scoreB.totalScore - scoreA.totalScore;
  }

  // 2. Secondary: Match Tier (1 = Exact Title/Artist > 2 = Prefix/Combo > 3 = Fuzzy > 4 = Substring)
  if (scoreA.matchTier !== scoreB.matchTier) {
    return scoreA.matchTier - scoreB.matchTier;
  }

  // 3. Tertiary: Closeness of Title length to query
  if (scoreA.lengthDiff !== scoreB.lengthDiff) {
    return scoreA.lengthDiff - scoreB.lengthDiff;
  }

  // 4. Recency: Newer release dates first
  const dateA = extractReleaseTimestamp(a);
  const dateB = extractReleaseTimestamp(b);
  if (dateA !== dateB && (dateA > 0 || dateB > 0)) {
    return dateB - dateA;
  }

  // 5. Popularity: Highest play count first
  const playsA = extractPlayCount(a);
  const playsB = extractPlayCount(b);
  if (playsA !== playsB) {
    return playsB - playsA;
  }

  return (a.title || a.name || '').localeCompare(b.title || b.name || '');
}

/**
 * Sorts and ranks an array of Tracks using Spotify-style intent-aware relevance ranking
 * with candidate deduplication and personalized listening affinity to ensure songs you've heard rank at the top.
 */
export function rankAndSortTracks(
  tracks: Track[], 
  query: string, 
  personalization?: PersonalizationContext
): Track[] {
  if (!query || !query.trim() || !Array.isArray(tracks) || tracks.length === 0) {
    return tracks;
  }

  const parsed = parseSearchQuery(query);
  
  // Calculate score for each track incorporating personalization
  const scoredTracks = tracks.map((t) => ({
    track: t,
    relevance: calculateRelevanceScore(t, parsed, DEFAULT_SCORING_WEIGHTS, personalization),
  }));

  // Sort primarily by relevance + personal listening score
  scoredTracks.sort((a, b) => {
    if (a.relevance.totalScore !== b.relevance.totalScore) {
      return b.relevance.totalScore - a.relevance.totalScore;
    }
    if (a.relevance.matchTier !== b.relevance.matchTier) {
      return a.relevance.matchTier - b.relevance.matchTier;
    }
    return b.relevance.popularityScore - a.relevance.popularityScore;
  });


  // Apply STRICT deduplication:
  // If a track has the exact same title & overlapping artist, drop the duplicate completely.
  const uniqueTracks = [];
  
  for (const item of scoredTracks) {
    const isDuplicate = uniqueTracks.some((existingItem) => {
      const existingTitle = cleanSearchTitle(existingItem.track.title);
      const newTitle = cleanSearchTitle(item.track.title);
      
      if (existingTitle === newTitle) {
        const artist1 = existingItem.track.artist.toLowerCase();
        const artist2 = item.track.artist.toLowerCase();
        if (artist1.includes(artist2) || artist2.includes(artist1)) {
          return true;
        }
      }
      return false;
    });

    if (!isDuplicate) {
      uniqueTracks.push(item);
    }
  }

  const diversified = [];
  const resolvedQ = resolveArtist(parsed.normalized);

  for (const item of uniqueTracks) {
    const diversityPenalty = 0; // Removed diversity penalty as we are dropping duplicates completely
    let isOriginalTrack = false;
    if (resolvedQ && resolvedQ.extractedSongTitle) {
      const trackArtistMatch = isArtistAliasMatch(item.track.artist, resolvedQ.entry.canonicalName);
      const trackTitleLower = item.track.title.toLowerCase();
      const extractedLower = resolvedQ.extractedSongTitle.toLowerCase();

      if (
        trackArtistMatch &&
        trackTitleLower.includes(extractedLower) &&
        item.relevance.originalArtistPriority === 200
      ) {
        isOriginalTrack = true;
      }
    }

    diversified.push({
      track: { 
        ...item.track, 
        isOriginal: isOriginalTrack, 
        _searchScore: item.relevance.totalScore - diversityPenalty,
        _matchTier: item.relevance.matchTier
      },
      finalRankScore: item.relevance.totalScore - diversityPenalty,
    });
  }

  diversified.sort((a, b) => b.finalRankScore - a.finalRankScore);

  return diversified.map((d) => d.track);
}

/**
 * Sorts and ranks quick Search Suggestions using the same multi-signal scoring engine with personalization.
 */
export function rankAndSortSuggestions(
  suggestions: SearchSuggestion[], 
  query: string,
  personalization?: PersonalizationContext
): SearchSuggestion[] {
  if (!query || !query.trim() || !Array.isArray(suggestions) || suggestions.length === 0) {
    return suggestions;
  }

  const parsed = parseSearchQuery(query);

  const scored = suggestions.map((s) => {
    const rel = calculateRelevanceScore(s, parsed, DEFAULT_SCORING_WEIGHTS, personalization);
    return {
      suggestion: {
        ...s,
        score: rel.totalScore,
      },
      relevance: rel,
    };
  });

  scored.sort((a, b) => {
    if (a.relevance.totalScore !== b.relevance.totalScore) {
      return b.relevance.totalScore - a.relevance.totalScore;
    }
    if (a.relevance.matchTier !== b.relevance.matchTier) {
      return a.relevance.matchTier - b.relevance.matchTier;
    }
    return (b.suggestion.plays || 0) - (a.suggestion.plays || 0);
  });

  return scored.map((s) => s.suggestion);
}

/**
 * Sorts full SearchResults (topResult, songs, artists, albums, playlists) with intent-based ranking and personalization.
 */
export function rankAndSortSearchResults(
  results: SearchResults, 
  query: string,
  personalization?: PersonalizationContext
): SearchResults {
  const q = (query || '').trim();
  if (!q) return results;

  const parsed = parseSearchQuery(q);
  
  const qNorm = parsed.normalized;

  // 1. Sort Songs (with deep personalization)
  let rawSongs = results.songs || [];
  // Strict deduplication to avoid history/API duplicates
  rawSongs = rawSongs.filter((track, index, self) => {
    const normTitle = track.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
    const normArtist = track.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return index === self.findIndex((t) => {
      const tNormTitle = t.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
      const tNormArtist = t.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      return normTitle === tNormTitle && normArtist === tNormArtist;
    });
  });

  const sortedSongs = rankAndSortTracks(rawSongs, q, personalization);


  // 2. Sort Artists
  const resolvedQ = resolveArtist(qNorm);

  const rawArtists = [...(results.artists || [])];
  
  if (resolvedQ) {
    const canonicalName = resolvedQ.entry.canonicalName;
    const exists = rawArtists.some(a => isArtistAliasMatch(a.name, canonicalName));
    if (!exists) {
      rawArtists.unshift({
        id: `virtual-${canonicalName}`,
        name: canonicalName,
        image: resolvedQ.entry.portraitUrl || '',
        followers: resolvedQ.entry.followers || 0,
        monthlyListeners: 0,
        genres: resolvedQ.entry.genres || [],
        bio: resolvedQ.entry.bio || '',
        verified: true,
        topTracks: [],
        albums: [],
        singles: []
      } as any);
    }
  }

  const sortedArtists = rawArtists.sort((a, b) => {
    const aNorm = normalizeSearchString(a.name);
    const bNorm = normalizeSearchString(b.name);
    const qNorm = parsed.normalized;

    const aExact = aNorm === qNorm || isArtistAliasMatch(a.name, qNorm);
    const bExact = bNorm === qNorm || isArtistAliasMatch(b.name, qNorm);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    if (resolvedQ) {
      const aResolvedMatch = isArtistAliasMatch(a.name, resolvedQ.entry.canonicalName);
      const bResolvedMatch = isArtistAliasMatch(b.name, resolvedQ.entry.canonicalName);
      if (aResolvedMatch && !bResolvedMatch) return -1;
      if (!aResolvedMatch && bResolvedMatch) return 1;
    }

    const aStarts = aNorm.startsWith(qNorm);
    const bStarts = bNorm.startsWith(qNorm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Followed artist or artist played boost
    let aArtistScore = 0;
    let bArtistScore = 0;
    if (isFollowedArtistMatch(a.name, a.id, personalization?.followedArtists, personalization?.followedArtistNames)) {
      aArtistScore += 600;
    }
    if (isFollowedArtistMatch(b.name, b.id, personalization?.followedArtists, personalization?.followedArtistNames)) {
      bArtistScore += 600;
    }
    if (personalization?.artistPlays?.[aNorm]) aArtistScore += Math.min(200, personalization.artistPlays[aNorm] * 50);
    if (personalization?.artistPlays?.[bNorm]) bArtistScore += Math.min(200, personalization.artistPlays[bNorm] * 50);

    if (aArtistScore !== bArtistScore) {
      return bArtistScore - aArtistScore;
    }

    // Fuzzy artist similarity
    const simA = stringSimilarity(aNorm, qNorm);
    const simB = stringSimilarity(bNorm, qNorm);
    if (Math.abs(simA - simB) > 0.15) {
      return simB - simA;
    }

    return (b.followers || 0) - (a.followers || 0);
  });

  // 3. Sort Albums
  const sortedAlbums = [...(results.albums || [])].sort((a, b) => {
    const aNorm = normalizeSearchString(a.name);
    const bNorm = normalizeSearchString(b.name);
    const qNorm = parsed.normalized;

    const aExact = aNorm === qNorm;
    const bExact = bNorm === qNorm;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = aNorm.startsWith(qNorm);
    const bStarts = bNorm.startsWith(qNorm);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return (b.year || 0) - (a.year || 0);
  });

  // 4. Sort Playlists
  const sortedPlaylists = [...(results.playlists || [])].sort((a, b) => {
    const aNorm = normalizeSearchString(a.title);
    const bNorm = normalizeSearchString(b.title);
    const qNorm = parsed.normalized;

    const aExact = aNorm === qNorm;
    const bExact = bNorm === qNorm;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    return (b.likesCount || 0) - (a.likesCount || 0);
  });

  // 5. Determine Top Result with Spotify-style intelligence:
  // - If the user previously heard/played a song that matches the query, THAT SONG is crowned as the Top Result!
  // - If query matches an Artist (real name, Spotiz name, or alias) and user hasn't explicitly targeted a specific track, Artist is the Top Result.
  // - If query matches a Song Title or is a Song+Artist combo, the top Song is the Top Result.
  let topResult: SearchResults['topResult'] = null;

  const exactArtist = sortedArtists.find((a) => {
    const aNorm = normalizeSearchString(a.name);
    return (
      aNorm === qNorm ||
      isArtistAliasMatch(a.name, qNorm) ||
      (resolvedQ && isArtistAliasMatch(a.name, resolvedQ.entry.canonicalName))
    );
  });
  const exactAlbum = sortedAlbums.find((al) => normalizeSearchString(al.name) === qNorm);
  const topSong = sortedSongs[0] || null;

  if (topSong) {
    const songRelevance = calculateRelevanceScore(topSong, parsed, DEFAULT_SCORING_WEIGHTS, personalization);
    
    // If user has personal listening history for this song and it's a good text match (Tier <= 3)
    const hasStrongPersonalMatch = songRelevance.personalScore >= 450 && songRelevance.matchTier <= 3;

    // Check if query is an artist query vs a song combo
    const isPureArtistIntent =
      Boolean(exactArtist) &&
      (!resolvedQ || resolvedQ.matchType !== 'combo') &&
      normalizeSearchString(topSong.title) !== qNorm &&
      !hasStrongPersonalMatch;

    if (isPureArtistIntent && exactArtist) {
      // Direct exact artist search (e.g. "Abel Tesfaye", "The Weeknd", "Madhurxo", "Yo Yo Honey Singh", "MC Stan")
      topResult = { type: 'artist', data: exactArtist };
    } else if (hasStrongPersonalMatch || songRelevance.exactTitleMatch || songRelevance.comboMatch || songRelevance.matchTier <= 2) {
      topResult = { type: 'track', data: topSong };
    } else if (exactArtist) {
      topResult = { type: 'artist', data: exactArtist };
    } else if (exactAlbum) {
      topResult = { type: 'album', data: exactAlbum };
    } else {
      topResult = { type: 'track', data: topSong };
    }
  } else if (exactArtist) {
    topResult = { type: 'artist', data: exactArtist };
  } else if (exactAlbum) {
    topResult = { type: 'album', data: exactAlbum };
  } else if (sortedArtists.length > 0 && normalizeSearchString(sortedArtists[0].name).startsWith(qNorm)) {
    topResult = { type: 'artist', data: sortedArtists[0] };
  } else if (sortedAlbums.length > 0) {
    topResult = { type: 'album', data: sortedAlbums[0] };
  }

  return {
    topResult,
    songs: sortedSongs,
    artists: sortedArtists,
    albums: sortedAlbums,
    playlists: sortedPlaylists,
  };
}
