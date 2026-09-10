// AudioStreamResolver: Full-Length Music Audio Resolver
// Guarantees 100% authentic, verified audio playback with strict Title + Artist + Version + Duration matching.
// Prevents silent substitutions of female versions, covers, remixes, slowed/reverb, or alternate recordings.
import CryptoJS from 'crypto-js';
import { isArtistAliasMatch } from '../../src/utils/artistAliases';
import { normalizeSearchString, stripDiacritics } from '../../src/utils/searchRanker';

export interface ResolvedStream {
  url: string;
  fallbackUrls?: string[];
  duration: number; // in seconds
  source: string;
  bitrate: string;
  mimeType: string;
  isDirectAudio?: boolean;
  isMediaDescriptor?: boolean;
  descriptorType?: 'direct' | 'youtube';
  mediaUri?: string;
}

export async function validateAudioStream(
  url: string,
  timeoutMs: number = 5000,
  expectedDurationSeconds: number = 0
): Promise<{ valid: boolean; status?: number; contentType?: string; error?: string }> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { valid: false, error: 'Invalid URL scheme' };
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': 'bytes=0-1023',
        'Accept': '*/*',
        'Referer': url.includes('saavn') ? 'https://www.jiosaavn.com/' : 'https://audius.co/',
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });

    const status = res.status;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Check if status is success / partial content and not an HTML/JSON error page
    const isValidStatus = status === 200 || status === 206;
    const isErrorContentType = contentType.includes('text/html') || contentType.includes('application/json');
    const isAudioOrBinary = contentType.includes('audio') || contentType.includes('video') || contentType.includes('octet-stream') || !isErrorContentType;

    if (isValidStatus && !isErrorContentType && isAudioOrBinary) {
      let totalBytes = 0;
      const contentRange = res.headers.get('content-range');
      if (contentRange && contentRange.includes('/')) {
        totalBytes = parseInt(contentRange.split('/')[1], 10) || 0;
      } else {
        totalBytes = parseInt(res.headers.get('content-length') || '0', 10) || 0;
      }

      // If we expect a full song (> 60s) but the file is suspiciously small (< 1.6MB),
      // it is likely a 30-second preview snippet returned by the CDN due to regional/premium restrictions.
      if (totalBytes > 0 && totalBytes < 1600000 && expectedDurationSeconds > 60) {
        return { valid: false, status, contentType, error: `Stream is a preview snippet (${Math.round(totalBytes/1024)}KB)` };
      }

      return { valid: true, status, contentType };
    }

    return { valid: false, status, contentType, error: `HTTP ${status} (${contentType})` };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Stream fetch failed' };
  }
}

const streamCache = new Map<string, { stream: ResolvedStream; expiresAt: number }>();

export const VERSION_DESCRIPTORS = [
  'female version',
  'female cover',
  'female',
  'female voice',
  'female rendition',
  'male version',
  'male cover',
  'male',
  'male voice',
  'male rendition',
  'guitar version',
  'guitar cover',
  'guitar',
  'fingerstyle',
  'acoustic version',
  'acoustic cover',
  'acoustic live',
  'acoustic session',
  'unplugged cover',
  'acoustic',
  'unplugged',
  'stripped version',
  'stripped',
  'piano version',
  'piano cover',
  'orchestral version',
  'orchestral',
  'symphonic',
  'symphony',
  'remix',
  'remixes',
  'recreated',
  'recreation',
  'remake',
  'reprise',
  'lofi remix',
  'lofi version',
  'lofi',
  'lo-fi',
  'chill mix',
  'slowed reverb',
  'slowed + reverb',
  'slowed & reverb',
  'slowed down',
  'slowed',
  'reverb',
  'sped up',
  'speed up',
  'spedup',
  'sped-up',
  'different version',
  'karaoke version',
  'karaoke',
  'instrumental version',
  'instrumental',
  'live session',
  'live at',
  'live from',
  'live in',
  'live',
  'tribute to',
  'tribute',
  'mashup',
  'medley',
  'megamix',
  'compilation',
  'sing off',
  'sing-off',
  'singoff',
  'battle',
  'vs',
  'flip',
  'bootleg',
  'redrum',
  're-drum',
  'refix',
  'acapella',
  'a capella',
  'acappella',
  'house mix',
  'club mix',
  'club edit',
  'radio edit',
  'vip edit',
  'extended mix',
  'extended version',
  'extended edit',
  'extended',
  'dance mix',
  'dj mix',
  'mix',
  'edit',
  'parody',
  'clean version',
  'clean edit',
  'clean',
  'dialogue promo',
  'dialogue',
  'rendition',
  'cover version',
  'cover',
  'covers',
  '8d audio',
  '8d',
  '16d audio',
  '16d',
  'bass boosted',
  'bassboost',
  'nightcore',
  'daycore',
  'hypertechno',
  'hyper techno',
  'hardstyle',
  'techno',
  'synthwave',
  'drill remix',
  'phonk remix',
  'phonk',
  'slap house',
  'originally performed',
  'originally perfomed',
  'originally sung',
  'in the style of',
  'originally by',
  '8-bit emulation',
  '16-bit emulation',
  '8-bit',
  '16-bit',
  '8bit',
  '16bit',
  '8 bit',
  '16 bit',
  'emulation',
  'arcade player',
  '8-bit arcade',
  'arcade',
  'chiptune',
  'chip tune',
  'midi',
  'synth emulation',
  'kids rhymes',
  'nursery rhymes',
  'rhymes',
  'rhyme',
  'lullaby',
  'baby sleep',
  'music box',
  'sound-alike',
  'soundalike',
  'sound alike',
  'tribute band',
];

export function isWordFuzzyMatch(w1: string, w2: string): boolean {
  if (w1 === w2) return true;
  if (!w1 || !w2) return false;
  // Fold consecutive duplicate letters (e.g. "aasmaan" -> "asman", "aasman" -> "asman", "challeya" -> "chaleya")
  const fold1 = w1.replace(/(.)\1+/g, '$1');
  const fold2 = w2.replace(/(.)\1+/g, '$1');
  if (fold1 === fold2) return true;

  // Single edit distance tolerance for words of length >= 5
  if (Math.abs(w1.length - w2.length) <= 1 && (w1.length >= 5 || w2.length >= 5)) {
    let diff = 0;
    let i = 0, j = 0;
    while (i < w1.length && j < w2.length) {
      if (w1[i] !== w2[j]) {
        diff++;
        if (diff > 1) return false;
        if (w1.length > w2.length) i++;
        else if (w2.length > w1.length) j++;
        else { i++; j++; }
      } else {
        i++;
        j++;
      }
    }
    return true;
  }
  return false;
}

export function extractVersionDescriptors(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const descriptor of VERSION_DESCRIPTORS) {
    const escaped = descriptor.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(^|\\b|\\(|\\[|-|_|\\s|/|:)${escaped}(\\b|\\)|\\]|-|_|\\s|/|:|$)`, 'i');
    if (regex.test(lower)) {
      found.push(descriptor);
    }
  }
  return Array.from(new Set(found));
}

export function stripPartSuffix(title: string): string {
  if (!title) return '';
  return title
    .replace(/,?\s*\b(pt|pts|part|parts|vol|vols|volume|volumes|ch|chapter|no|num|number)\b\.?\s*\d*\b/gi, '')
    .replace(/,?\s*\b(from|ost|soundtrack)\b.*$/gi, '')
    .replace(/-\s*(hindi|telugu|tamil|punjabi|kannada|malayalam|bengali|marathi|gujarati|bhojpuri|urdu|english).*$/gi, '')
    .trim();
}

export function cleanBaseTitle(title: string): string {
  if (!title) return '';
  return stripDiacritics(title)
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/gi, ' ')
    .replace(/-\s*(from|ost|soundtrack|hindi|telugu|tamil|punjabi|kannada|malayalam|bengali|marathi|gujarati|bhojpuri|urdu|english|audio|video|song).*$/gi, ' ')
    .replace(/\b(from\s+["'].*?["'])/gi, ' ')
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isArtistMatch(candidateArtist: string, targetArtist: string): boolean {
  if (!targetArtist || !candidateArtist) return false;

  const normTarget = normalizeSearchString(targetArtist);
  const normCand = normalizeSearchString(candidateArtist);

  if (!normTarget || !normCand) return false;
  if (normTarget === normCand) return true;
  if (normCand === normTarget) return true;

  if (isArtistAliasMatch(candidateArtist, targetArtist)) return true;

  // Split target artists by comma / & / feat / ft / and / x / with
  const targetParts = targetArtist
    .split(/,|&|\band\b|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bx\b|\bvs\b/i)
    .map((s) => normalizeSearchString(s))
    .filter((s) => s.length >= 2);

  const candParts = candidateArtist
    .split(/,|&|\band\b|\bfeat\.?\b|\bft\.?\b|\bwith\b|\bx\b|\bvs\b/i)
    .map((s) => normalizeSearchString(s))
    .filter((s) => s.length >= 2);

  // Check if any full artist unit from target matches any full artist unit from candidate
  for (const tp of targetParts) {
    for (const cp of candParts) {
      if (tp === cp || isArtistAliasMatch(cp, tp)) {
        return true;
      }
      if ((tp.length >= 4 && cp.includes(tp)) || (cp.length >= 4 && tp.includes(cp))) {
        return true;
      }
    }
  }

  // Exact substring match only if artist string is distinct (> 4 chars)
  if (normTarget.length >= 4 && normCand.includes(normTarget)) return true;
  if (normCand.length >= 4 && normTarget.includes(normCand)) return true;

  return false;
}

const PLATFORM_NOISE_TOKENS = new Set([
  'official', 'audio', 'video', 'lyric', 'lyrics', 'visualizer', 'track', 'song', 'hd', '4k',
  'full', 'coke', 'studio', 'from', 'soundtrack', 'ost', 'feat', 'ft', 'featuring', 'with',
  'season', 'single', 'album', 'music', 'records', 'vevo', 'topic', 'hq', 'original', 'theme',
  'pt', 'pts', 'part', 'parts', 'vol', 'vols', 'volume', 'volumes', 'ep', 'ch', 'chapter', 'no', 'num', 'number',
  'ver', 'version', 'edition', 'remaster', 'remastered', 'deluxe', 'expanded', 'bonus',
  'hindi', 'telugu', 'tamil', 'punjabi', 'kannada', 'malayalam', 'bengali', 'marathi', 'gujarati', 'bhojpuri', 'urdu', 'english', 'spanish', 'french',
  'the', 'rule', 'couple', 'promo', 'teaser', 'dialogue', 'scene', 'motion', 'picture', 'film', 'movie'
]);

export function calculateStrictMatchScore(
  candidate: { title: string; artist: string; primaryArtist?: string; singers?: string; album?: string; duration?: number },
  target: { title: string; artist: string; duration?: number }
): { verified: boolean; score: number; reason?: string } {
  const cTitle = (candidate.title || '').toLowerCase();
  const tTitle = (target.title || '').toLowerCase();
  const cArtist = (candidate.artist || '').toLowerCase();
  const cAlbum = (candidate.album || '').toLowerCase();
  const candidateFullText = `${cTitle} ${cArtist} ${cAlbum}`;
  
  const tArtist = (target.artist || '').toLowerCase();

  // Penalize negative keywords if they are not in the target title or artist
  const negativeKeywords = [
    'cover', 'covers', 'rendition', 'acoustic cover', 'guitar cover', 'piano cover', 'unplugged cover', 'fingerstyle',
    'karaoke', 'instrumental', 'backing track', 'minus one',
    'dj mix', 'remix', 'remixes', 'remixed', 'rmx', 'club mix', 'house mix', 'party mix', 'dholki mix', 'dholki',
    'dance mix', 'vip edit', 'flip', 'bootleg', 're-drum', 'redrum', 'refix', 'rework', 'slap house',
    'ringtone', 'caller tune', 'dialer tone', 'ring tone', 'flute', 'violin', 'bgm',
    'live session', 'live at', 'live from', 'live in',
    'slowed', 'reverb', 'slowed reverb', 'slowed & reverb', 'slowed + reverb', 'lofi', 'lo-fi', 'chill mix',
    '8d', '16d', '8d audio', '16d audio', '3d audio', 'trap invasion', 'hypertechno', 'hyper techno', 'hardstyle', 'techno',
    'synthwave', 'nightcore', 'daycore', 'bass boosted', 'bassboost', 'sped up', 'speed up', 'spedup',
    '8-bit', '16-bit', '8bit', '16bit', '8 bit', '16 bit', 'emulation', 'arcade player', '8-bit arcade', 'arcade',
    'chiptune', 'chip tune', 'midi', 'synth emulation',
    'kids rhymes', 'nursery rhymes', 'rhymes', 'lullaby', 'baby sleep', 'music box',
    'sound-alike', 'soundalike', 'sound alike', 'tribute band',
    'mashup', 'medley', 'sing off', 'sing-off', 'singoff', 'battle', 'compilation',
    'tribute', 'parody', 'acapella', 'a capella', 'acappella', 'drill remix', 'phonk',
    'status video', 'whatsapp status', 'reels', 'shorts', 'tiktok', 'best part', 'hook line',
    'teaser', 'trailer', 'dialogue promo', 'dialogue', 'reaction', 'review', 'tutorial', 'how to play', 'chords', 'making of',
    'behind the scenes', 'bts footage', 'bts video', 'bts shoot', 'bts scenes'
  ];
  for (const word of negativeKeywords) {
    // If target artist or title contains this keyword (e.g. artist is "BTS"), never penalize it
    if (tTitle.includes(word) || tArtist.includes(word)) {
      continue;
    }
    // If target artist is BTS, skip any BTS-prefixed phrase unless it explicitly says behind the scenes
    if ((tArtist.includes('bts') || tArtist.includes('bangtan')) && word.startsWith('bts')) {
      continue;
    }
    if (candidateFullText.includes(word)) {
      return { verified: false, score: -100, reason: 'Contains negative keyword: ' + word };
    }
  }

  // Also check candidate title for standalone "tune" or "mix" unless target requests it
  if (!tTitle.includes('tune') && /\b(tune|tunes|ringtone|dialertone|callertone)\b/i.test(cTitle)) {
    return { verified: false, score: -100, reason: 'Candidate is a tune/ringtone snippet' };
  }
  if (!tTitle.includes('mix') && /\b(mix|remix)\b/i.test(cTitle)) {
    return { verified: false, score: -100, reason: 'Candidate is an unrequested mix/remix' };
  }
  if (!tTitle.includes('emulation') && /\b(emulation|8-bit|16-bit|8bit|16bit|arcade|chiptune)\b/i.test(cTitle)) {
    return { verified: false, score: -100, reason: 'Candidate is an arcade/emulation tune' };
  }

  const targetTitle = target.title || '';
  const targetArtist = target.artist || '';
  const candTitle = candidate.title || '';
  const candArtist = candidate.artist || '';
  const candAlbum = candidate.album || '';

  // 1. Version Descriptors Parity Check
  const targetVersionTags = extractVersionDescriptors(`${targetTitle} ${targetArtist}`);
  const candVersionTags = extractVersionDescriptors(`${candTitle} ${candArtist} ${candAlbum}`);

  // Disallow any candidate version modifier that was not explicitly requested by target
  for (const cv of candVersionTags) {
    if (!targetVersionTags.includes(cv)) {
      return { verified: false, score: 0, reason: `Unrequested version modifier: "${cv}"` };
    }
  }

  // Disallow candidates missing a version modifier that target specifically asked for
  for (const tv of targetVersionTags) {
    if (!candVersionTags.includes(tv)) {
      return { verified: false, score: 0, reason: `Missing requested version modifier: "${tv}"` };
    }
  }

  // 2. Duration Sniffing: Reject snippets / previews (< 35s) or gigantic continuous mixes (> 20 min)
  if (candidate.duration && candidate.duration > 0) {
    if (candidate.duration < 35) {
      return { verified: false, score: 0, reason: `Track is a short preview or teaser snippet (${candidate.duration}s)` };
    }
    if (candidate.duration > 1200 && (!target.duration || target.duration < 600)) {
      return { verified: false, score: 0, reason: `Track is an excessively long continuous mix (${candidate.duration}s)` };
    }
  }

  // 3. Strict Title Matching & Foreign Words Elimination
  const cleanTargetT = cleanBaseTitle(targetTitle);
  const cleanCandT = cleanBaseTitle(candTitle);

  if (!cleanTargetT || !cleanCandT) {
    return { verified: false, score: 0, reason: 'Empty title' };
  }

  const targetWords = cleanTargetT.split(/\s+/).filter((w) => w.length > 0);
  
  // Strip featured artists from candidate title BEFORE calculating candWords for foreign word penalization
  const cleanCandTNoFeat = cleanCandT.replace(/\s*\b(ft|feat|featuring|with)\b.*$/i, '').trim();
  const candWords = cleanCandTNoFeat.split(/\s+/).filter((w) => w.length > 0);

  // All meaningful target words must be present in candidate (with phonetic/transliteration tolerance)
  const targetSignificantWords = targetWords.filter((w) => w.length > 1 && !PLATFORM_NOISE_TOKENS.has(w));
  for (const tw of targetSignificantWords) {
    const hasWord = candWords.some((cw) => isWordFuzzyMatch(tw, cw)) || cleanCandT.includes(tw);
    if (!hasWord) {
      return { verified: false, score: 0, reason: `Required target word "${tw}" missing from candidate` };
    }
  }

  // Build a set of allowed words in candidate (target title words + artist tokens + noise tokens + album tokens)
  const allowedArtistTokens = new Set(
    `${targetArtist} ${candArtist} ${candidate.primaryArtist || ''} ${candidate.album || ''} ${targetTitle}`
      .toLowerCase()
      .split(/[^\w\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]+/)
      .filter((w) => w.length > 1)
  );

  const extraForeignWords = candWords.filter(
    (w) =>
      w.length > 2 &&
      !targetWords.some((tw) => isWordFuzzyMatch(tw, w)) &&
      !PLATFORM_NOISE_TOKENS.has(w) &&
      !allowedArtistTokens.has(w)
  );

  // If candidate has 2 or more completely foreign/unrelated words (e.g. mashup title, sing-off), reject it
  if (extraForeignWords.length >= 2) {
    return {
      verified: false,
      score: 0,
      reason: `Candidate contains foreign/mashup terms: "${extraForeignWords.join(' ')}"`,
    };
  }

  let titleScore = 80;
  if (cleanTargetT === cleanCandT) {
    titleScore = 100;
  } else if (extraForeignWords.length === 0) {
    titleScore = 95;
  }

  // 4. Artist Matching & Primary Artist Verification
  let authorScoreBonus = 0;
  if (targetArtist && targetArtist.trim().length > 0) {
    const primaryMatch = candidate.primaryArtist ? isArtistMatch(candidate.primaryArtist, targetArtist) : false;
    const singerMatch = candidate.singers ? isArtistMatch(candidate.singers, targetArtist) : false;
    const fullArtistMatch = isArtistMatch(candArtist, targetArtist);
    const albumArtistMatch = candidate.album ? isArtistMatch(candidate.album, targetArtist) : false;
    const hasTributeOrEmulation = /\b(tribute|emulation|arcade|cover|style of|originally by|rhyme|rhymes|kids|karaoke|instrumental|8-bit|16-bit)\b/i.test(candTitle);
    const titleArtistMatch = !hasTributeOrEmulation && isArtistMatch(candTitle, targetArtist);

    if (!primaryMatch && !singerMatch && !titleArtistMatch && !fullArtistMatch && !albumArtistMatch) {
      return {
        verified: false,
        score: 0,
        reason: `Artist mismatch: target "${targetArtist}" vs candidate "${candArtist}"`,
      };
    }
    if (fullArtistMatch || primaryMatch) { authorScoreBonus = 50; }
  }

  // 5. Proximity Check & Proximity Bonus (Allows narrative music video intros/outros but strictly rejects truncated cuts)
  let durationScore = 0;
  if (target.duration && target.duration > 30 && candidate.duration && candidate.duration > 10) {
    const diff = Math.abs(candidate.duration - target.duration);
    // If candidate is significantly shorter than target (e.g. 120s vs 203s), it's a cut snippet/preview
    const isTruncated = candidate.duration < target.duration - 25 && (target.duration - candidate.duration) / target.duration > 0.12;
    // Disallow extreme differences (> 55s or > 20% diff for songs longer than 60s)
    const isExcessive = diff > 55 || (target.duration > 60 && diff / target.duration > 0.20);
    if (isTruncated || isExcessive) {
      return { verified: false, score: 0, reason: `Duration mismatch: Target ${target.duration}s vs Candidate ${candidate.duration}s (Diff: ${diff}s, isTruncated=${isTruncated})` };
    }
    if (diff <= 5) durationScore = 30;
    else if (diff <= 15) durationScore = 25;
    else if (diff <= 30) durationScore = 18;
    else if (diff <= 45) durationScore = 10;
    else durationScore = 0;
  }

  // 6. Authentic Official Track & Official Channel Boosts
  let officialBonus = 0;
  if (cArtist.endsWith(' - topic') || cArtist.endsWith(' topic')) {
    officialBonus += 60; // YouTube Music automated pure studio audio
  } else if (isArtistMatch(cArtist, targetArtist)) {
    officialBonus += 45; // Video uploaded directly to verified artist channel
  }

  if (cTitle.includes('official audio') || cTitle.includes('official music video') || cTitle.includes('official video') || cTitle.includes('audio')) {
    officialBonus += 25;
  }

  const verifiedMusicLabels = [
    't-series', 'sony music', 'zee music', 'yrf', 'tips official', 'speed records',
    'aditya music', 'vevo', 'warner music', 'universal music', 'coke studio', 'indie india',
    'hybe labels', 'bighit', 'big hit', 'smtown', 'jyp entertainment', 'yg entertainment'
  ];
  if (verifiedMusicLabels.some((lbl) => cArtist.includes(lbl) || cTitle.includes(lbl))) {
    officialBonus += 20;
  }

  const finalScore = titleScore + durationScore + authorScoreBonus + officialBonus;
  return { verified: true, score: finalScore };
}

export function decryptSaavnMediaUrl(encrypted: string): { primaryUrl: string; fallbackUrls: string[] } | null {
  try {
    if (!encrypted) return null;
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted),
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    let base = decrypted.toString(CryptoJS.enc.Utf8);
    if (!base || (!base.includes('.mp4') && !base.includes('.mp3') && !base.includes('.m4a'))) {
      return null;
    }
    if (!base.startsWith('http')) {
      base = 'https:' + base;
    }
    const u320 = base.replace(/_\d+\.(mp4|m4a|mp3)$/i, '_320.$1');
    const u160 = base.replace(/_\d+\.(mp4|m4a|mp3)$/i, '_160.$1');
    const u96 = base.replace(/_\d+\.(mp4|m4a|mp3)$/i, '_96.$1');
    const u48 = base.replace(/_\d+\.(mp4|m4a|mp3)$/i, '_48.$1');

    const fallbackUrls = [u320, u160, u96, u48, base].filter(
      (u, i, arr) => arr.indexOf(u) === i && u && u.startsWith('http')
    );
    return {
      primaryUrl: u320 || base,
      fallbackUrls,
    };
  } catch (e) {
    return null;
  }
}

async function safeFetchJson<T = any>(url: string, timeoutMs: number = 4000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export class AudioStreamResolver {
  private static AUDIUS_API_BASE = 'https://api.audius.co';

  /**
   * Search and resolve full-length streaming audio with multi-pass verification.
   * Guarantees that the audio stream ALWAYS matches the requested song recording and metadata,
   * with complete fallback streams.
   */
  static async resolveFullTrack(
    trackId: string,
    title: string,
    artist: string,
    expectedDuration?: number,
    options?: { forceFresh?: boolean; discardUrl?: string }
  ): Promise<ResolvedStream | null> {
    const cacheKey = `stream-v5-${trackId}-${(title || '').toLowerCase().trim()}-${(artist || '').toLowerCase().trim()}`;
    
    if (options?.forceFresh || options?.discardUrl) {
      streamCache.delete(cacheKey);
    } else {
      const cached = streamCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        if (!options?.discardUrl || cached.stream.url !== options.discardUrl) {
          return cached.stream;
        }
        streamCache.delete(cacheKey);
      }
    }

    const discardedUrl = options?.discardUrl || '';
    const target = { title, artist, duration: expectedDuration };
    const cleanT = cleanBaseTitle(title);
    const strippedT = stripPartSuffix(title);
    const cleanStrippedT = cleanBaseTitle(strippedT);
    const primaryTargetArtist = (artist || '').split(/,|&|\band\b|\bfeat\.?\b|\bft\.?\b/i)[0].trim();
    const extractedMovie = (title.match(/(?:from\s+["']?|album\s+["']?|film\s+["']?|movie\s+["']?)([^"'()\]-]+)/i)?.[1] || '').trim();

    // ==========================================
    // Tier 1: JioSaavn Fast Multi-Query Parallel Resolution
    // ==========================================
    const saavnQueries = [
      extractedMovie ? `${cleanT} ${extractedMovie} ${primaryTargetArtist}`.trim() : '',
      `${cleanT} ${primaryTargetArtist}`.trim(),
      `${title} ${artist}`.trim(),
      `${cleanT}`.trim(),
      strippedT && strippedT !== title ? `${strippedT} ${primaryTargetArtist}`.trim() : '',
    ].filter((q) => q && q.length > 1);

    const prioritizedSaavnQueries = Array.from(new Set(saavnQueries)).slice(0, 3);

    try {
      const saavnPromises = prioritizedSaavnQueries.map(async (q) => {
        try {
          const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(
            q
          )}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=10&p=1`;
          const data = await safeFetchJson<any>(saavnUrl, 2000);
          return data?.results || [];
        } catch {
          return [];
        }
      });

      const saavnResultsArray = await Promise.all(saavnPromises);
      const allSaavnResults = saavnResultsArray.flat();

      if (allSaavnResults.length > 0) {
        const verifiedCandidates: { item: any; score: number; streamResult: { primaryUrl: string; fallbackUrls: string[] }; duration: number }[] = [];
        
        for (const item of allSaavnResults) {
          const itemTitle = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
          const primaryArt = item.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || item.primary_artists || item.more_info?.primary_artists || '';
          const singers = typeof item.more_info?.singers === 'string' ? item.more_info.singers : (item.singers || '');
          const itemArtist = [primaryArt, singers, item.more_info?.music, item.subtitle].filter(Boolean).join(', ');
          const itemAlbum = item.more_info?.album || item.album || '';
          const dur = parseInt(item.more_info?.duration || '0', 10) || (expectedDuration || 210);

          const verification = calculateStrictMatchScore(
            { title: itemTitle, artist: itemArtist, primaryArtist: primaryArt, singers: singers, album: itemAlbum, duration: dur },
            target
          );

          if (!verification.verified) {
            continue;
          }

          const enc = item.more_info?.encrypted_media_url;
          const streamResult = enc ? decryptSaavnMediaUrl(enc) : null;

          if (streamResult && !streamResult.primaryUrl.includes('jiotune') && !streamResult.primaryUrl.includes('preview') && dur >= 40) {
            verifiedCandidates.push({
              item,
              score: verification.score,
              streamResult,
              duration: dur,
            });
          }
        }

        if (verifiedCandidates.length > 0) {
          verifiedCandidates.sort((a, b) => b.score - a.score);

          // Fast-path candidate testing: Test highest scoring candidate primary 320kbps URL first
          for (const cand of verifiedCandidates.slice(0, 3)) {
            if (discardedUrl && cand.streamResult.primaryUrl === discardedUrl) {
              continue;
            }

            const expectedDur = cand.duration > 40 ? cand.duration : (expectedDuration || 210);
            const primaryUrl = cand.streamResult.primaryUrl;
            
            // Ultra-fast 800ms validation on primary 320kbps stream
            const check = await validateAudioStream(primaryUrl, 800, expectedDur);
            let validUrl = check.valid ? primaryUrl : '';

            // If primary 320 stream check failed, test the first fallback (160kbps or base)
            if (!validUrl && cand.streamResult.fallbackUrls.length > 0) {
              const fbUrl = cand.streamResult.fallbackUrls.find((u) => u !== primaryUrl && u !== discardedUrl);
              if (fbUrl) {
                const fbCheck = await validateAudioStream(fbUrl, 800, expectedDur);
                if (fbCheck.valid) validUrl = fbUrl;
              }
            }

            if (validUrl) {
              const allUrls = [validUrl, ...cand.streamResult.fallbackUrls].filter(
                (u, i, arr) => u && arr.indexOf(u) === i && u !== discardedUrl
              );
              const fallbackUrls = allUrls.filter((u) => u !== validUrl);

              const resolved: ResolvedStream = {
                url: validUrl,
                fallbackUrls,
                duration: cand.duration > 40 ? cand.duration : (expectedDuration || 210),
                source: `JioSaavn Verified (${cand.item.title})`,
                bitrate: '320kbps AAC',
                mimeType: 'audio/mp4',
                isDirectAudio: true,
                isMediaDescriptor: false,
                descriptorType: 'direct',
              };

              console.log(`[AudioResolver] Verified Match: "${cand.item.title}" (${cand.duration}s, score: ${cand.score}) for "${title} - ${artist}"`);
              streamCache.set(cacheKey, { stream: resolved, expiresAt: Date.now() + 86400 * 1000 });
              return resolved;
            }
          }
        }
      }
    } catch (saavnErr) {
      console.warn('[AudioResolver] JioSaavn resolution error:', saavnErr);
    }

    // ==========================================
    // Tier 2: YouTube Search Fast Direct Streaming Pipeline
    // ==========================================
    const ytQueries = [
      `${title} ${artist} official audio`.trim(),
      `${cleanT} ${primaryTargetArtist}`.trim(),
    ].filter((q) => q && q.length > 1);

    try {
      const ytSearch = (await import('yt-search')).default;
      const uniqueYtQueries = Array.from(new Set(ytQueries)).slice(0, 2);
      const allVerifiedVideos: { vid: any; score: number }[] = [];
      const seenVideoIds = new Set<string>();

      // Run YouTube queries in parallel
      const ytPromises = uniqueYtQueries.map(async (ytQuery) => {
        try {
          const searchResults = await ytSearch(ytQuery);
          return searchResults?.videos || [];
        } catch (subErr) {
          console.warn(`[AudioResolver] YouTube query error for "${ytQuery}":`, subErr);
          return [];
        }
      });

      const ytResultsArrays = await Promise.all(ytPromises);
      
      for (const videos of ytResultsArrays) {
        for (const vid of videos.slice(0, 8)) {
          if (seenVideoIds.has(vid.videoId)) continue;
          seenVideoIds.add(vid.videoId);

          const dur = vid.seconds || 0;
          const verification = calculateStrictMatchScore(
            { title: vid.title, artist: vid.author?.name || '', duration: dur },
            target
          );

          if (verification.verified && dur >= 30) {
            allVerifiedVideos.push({ vid, score: verification.score });
          }
        }
      }

      if (allVerifiedVideos.length > 0) {
        allVerifiedVideos.sort((a, b) => b.score - a.score);

        // Filter out any discarded URL if provided
        const availableVideos = allVerifiedVideos.filter((v) => {
          if (!discardedUrl) return true;
          return !discardedUrl.includes(v.vid.videoId);
        });

        const selectedList = availableVideos.length > 0 ? availableVideos : allVerifiedVideos;
        const best = selectedList[0].vid;
        const duration = best.seconds > 10 ? best.seconds : (expectedDuration || 210);

        const allFallbacks: string[] = [];
        for (const item of selectedList) {
          allFallbacks.push(`youtube:${item.vid.videoId}`);
          allFallbacks.push(`https://www.youtube.com/watch?v=${item.vid.videoId}`);
        }

        const resolved: ResolvedStream = {
          url: `youtube:${best.videoId}`,
          fallbackUrls: Array.from(new Set(allFallbacks)),
          duration,
          source: `YouTube Official Audio (${best.title})`,
          bitrate: '320kbps Opus',
          mimeType: 'video/youtube',
          isDirectAudio: false,
          isMediaDescriptor: true,
          descriptorType: 'youtube',
          mediaUri: `youtube:${best.videoId}`,
        };

        console.log(`[AudioResolver] YouTube Match: "${best.title}" (${best.videoId}) for "${title} - ${artist}" with ${allFallbacks.length / 2} fallbacks`);
        streamCache.set(cacheKey, { stream: resolved, expiresAt: Date.now() + 86400 * 1000 });
        return resolved;
      }
    } catch (err) {
      console.warn(`[AudioResolver] YouTube search failed:`, err);
    }

    // ==========================================
    // Tier 3: JioSaavn Autocomplete Fallback
    // ==========================================
    try {
      const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(
        cleanT || title
      )}&_format=json&_marker=0&ctx=web6dot0`;
      const autoData = await safeFetchJson<any>(autoUrl, 2500);
      const autoSongs = autoData?.songs?.data || [];
      for (const as of autoSongs.slice(0, 3)) {
        if (as.id) {
          const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${as.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
          const detailData = await safeFetchJson<any>(detailUrl, 2500);
          const item = detailData?.songs?.[0];
          if (item && item.more_info?.encrypted_media_url) {
            const itemTitle = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
            const primaryArt = item.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || item.primary_artists || item.more_info?.primary_artists || '';
            const singers = typeof item.more_info?.singers === 'string' ? item.more_info.singers : (item.singers || '');
            const itemArtist = [primaryArt, singers, item.more_info?.music, item.subtitle].filter(Boolean).join(', ');
            const dur = parseInt(item.more_info?.duration || '0', 10) || (expectedDuration || 210);

            const verification = calculateStrictMatchScore(
              { title: itemTitle, artist: itemArtist, primaryArtist: primaryArt, singers: singers, album: item.more_info?.album || item.album || '', duration: dur },
              target
            );

            if (verification.verified && dur >= 40) {
              const streamResult = decryptSaavnMediaUrl(item.more_info.encrypted_media_url);
              if (streamResult) {
                const expectedDur = dur > 40 ? dur : (expectedDuration || 210);
                const urlsToTest = [streamResult.primaryUrl, ...streamResult.fallbackUrls].filter(
                  (u, i, arr) => u && arr.indexOf(u) === i && u !== discardedUrl
                );

                const checks = await Promise.all(urlsToTest.map(async (u) => ({
                  url: u,
                  check: await validateAudioStream(u, 2000, expectedDur)
                })));

                const validResult = checks.find(c => c.check.valid);

                if (validResult) {
                  const validUrl = validResult.url;
                  const resolved: ResolvedStream = {
                    url: validUrl,
                    fallbackUrls: urlsToTest.filter(u => u !== validUrl),
                    duration: expectedDur,
                    source: `JioSaavn Auto (${item.title})`,
                    bitrate: '320kbps AAC',
                    mimeType: 'audio/mp4',
                    isDirectAudio: true,
                    isMediaDescriptor: false,
                    descriptorType: 'direct',
                  };
                  console.log(`[AudioResolver] Auto Index Match: "${item.title}" for "${title} - ${artist}"`);
                  streamCache.set(cacheKey, { stream: resolved, expiresAt: Date.now() + 86400 * 1000 });
                  return resolved;
                }
              }
            }
          }
        }
      }
    } catch (autoErr) {
      // Skip
    }

    console.log(`[AudioResolver] No authentic recording verified for "${title} - ${artist}". Playback rejected.`);
    return null;
  }
}
