import { safeFetchJson } from './server/utils/network.ts';

function hasWord(str: string, word: string) {
  return new RegExp(`\\b${word}\\b`, 'i').test(str);
}

async function decryptSaavnMediaUrl(encrypted: string): Promise<{ primaryUrl: string; fallbackUrls: string[] } | null> {
  try {
    if (!encrypted) return null;
    const CryptoJS = (await import('crypto-js')).default;
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
    const u320 = base.replace(/_\d+\.mp4$/, '_320.mp4').replace(/_96\.mp4$/, '_320.mp4');
    const fallbackUrls = [
      u320,
      u320.replace('_320.mp4', '_160.mp4'),
      u320.replace('_320.mp4', '_96.mp4'),
      u320.replace('_320.mp4', '_48.mp4')
    ];
    return { primaryUrl: u320, fallbackUrls };
  } catch (e) {
    return null;
  }
}

async function main() {
    const title = "Tere Bina";
    const artist = "HIGH-BORN";
    
    const cleanT = (title || '').toLowerCase().replace(/[^a-z0-9 \-]/g, '').trim();
    const cleanA = (artist || '').toLowerCase().replace(/[^a-z0-9 \-]/g, '').trim();
    
    const q = encodeURIComponent(`${cleanT} ${cleanA}`.trim());
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
    console.log("Search URL:", searchUrl);
    
    const fetch = (await import('node-fetch')).default;
    const searchData = await fetch(searchUrl).then(r => r.json());
    let results = searchData?.results || [];
    
    for (const entry of results.slice(0, 4)) {
        const resTitle = (entry.title || '').toLowerCase();
        const resSubtitle = (entry.subtitle || '').toLowerCase();
        const resSingers = (entry.more_info?.singers || '').toLowerCase();
        
        let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
        
        let artistMatch = true;
        if (cleanA) { 
           const singersList = resSingers.split(',').map((s: string) => s.trim().toLowerCase());
           const subtitleParts = resSubtitle.split(' - ').map((s: string) => s.trim());
           const subtitleArtists = subtitleParts[0].split(',').map((s: string) => s.trim().toLowerCase());
           
           const requestedArtistWords = cleanA.split(' ');
           const cleanANoSpace = cleanA.replace(/[ \-]/g, '');
           const singersNoSpace = singersList.map((s: string) => s.replace(/[^a-z0-9]/g, ''));
           const subtitleArtistsNoSpace = subtitleArtists.map((s: string) => s.replace(/[^a-z0-9]/g, ''));
           
           const exactMatch = singersList.includes(cleanA) || subtitleArtists.includes(cleanA);
           const noSpaceMatch = singersNoSpace.includes(cleanANoSpace) || subtitleArtistsNoSpace.includes(cleanANoSpace) || singersNoSpace.some((s: string) => s.includes(cleanANoSpace));
           const partialMatch = requestedArtistWords.some(w => w.length > 2 && (singersList.includes(w) || subtitleArtists.includes(w) || singersNoSpace.some((s: string) => s.includes(w))));
           
           artistMatch = exactMatch || noSpaceMatch || partialMatch || resTitle.includes('feat ' + cleanA);
        }
        console.log(`Checking ${resTitle} by ${resSubtitle}: Title=${titleMatch}, Artist=${artistMatch}`);
        if (!titleMatch || !artistMatch) continue;
        
        let encryptedUrl = entry.more_info?.encrypted_media_url;
        console.log("Found encrypted URL:", encryptedUrl);
        if (!encryptedUrl && entry.id) {
          const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${entry.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
          const detailData = await fetch(detailUrl).then(r => r.json());
          encryptedUrl = detailData?.songs?.[0]?.more_info?.encrypted_media_url;
        }
        if (encryptedUrl) {
          const streamResult = await decryptSaavnMediaUrl(encryptedUrl);
          if (streamResult) {
              console.log("SUCCESS!", streamResult.primaryUrl);
              return;
          } else {
              console.log("Failed to decrypt");
          }
        }
    }
}
main().catch(console.error);
