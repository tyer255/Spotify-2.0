var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/services/AudioStreamResolver.ts
function extractSaavnArtist(item, fallbackName = "Artist") {
  try {
    const allNames = [];
    const seen = /* @__PURE__ */ new Set();
    const addName = (n) => {
      if (typeof n === "string" && n.trim().length > 0) {
        const clean = n.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
        for (const part of clean.split(/,\s*|\s*&\s*|\s*\|\s*/)) {
          const p = part.trim();
          if (p && !seen.has(p.toLowerCase())) {
            seen.add(p.toLowerCase());
            allNames.push(p);
          }
        }
      }
    };
    if (item?.more_info?.artistMap?.primary_artists?.length > 0) {
      item.more_info.artistMap.primary_artists.forEach((a) => addName(a.name));
    } else if (item?.primary_artists) {
      addName(item.primary_artists);
    }
    if (item?.more_info?.singers) {
      if (Array.isArray(item.more_info.singers)) {
        item.more_info.singers.forEach((s) => addName(s.name || s));
      } else if (typeof item.more_info.singers === "string") {
        addName(item.more_info.singers);
      }
    }
    if (item?.more_info?.artistMap?.featured_artists?.length > 0) {
      item.more_info.artistMap.featured_artists.forEach((a) => addName(a.name));
    }
    if (item?.more_info?.music) {
      addName(item.more_info.music);
    }
    if (allNames.length > 0) return allNames.join(", ");
    if (item?.subtitle && typeof item.subtitle === "string") {
      const sub = item.subtitle.split("-")[0]?.trim();
      if (sub && sub.length > 0) return sub;
    }
  } catch (e) {
  }
  return fallbackName || "Artist";
}
async function safeFetchJson(url, timeoutMs = 3e3) {
  try {
    const fetch = (await import("node-fetch")).default;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function decryptSaavnMediaUrl(encrypted) {
  try {
    if (!encrypted) return null;
    const CryptoJS = await import("crypto-js");
    const key = CryptoJS.enc.Utf8.parse("38346591");
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted)
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const url = decrypted.toString(CryptoJS.enc.Utf8);
    const base = url.replace(/_\d+\.mp4$/, "");
    return {
      primaryUrl: `${base}_320.mp4`,
      fallbackUrls: [
        `${base}_320.mp4`,
        `${base}_160.mp4`,
        `${base}_96.mp4`,
        url
      ]
    };
  } catch {
    return null;
  }
}
function hasWord(text, word) {
  if (!text || !word) return false;
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}
var AudioStreamResolver = class {
  static async resolveFullTrack(trackId, title, artist, expectedDuration, options) {
    const cleanT = (title || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const cleanA = (artist || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (!cleanT) return null;
    const promises = [];
    promises.push((async () => {
      try {
        const q = encodeURIComponent(`${cleanT} ${cleanA}`.trim());
        const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
        const searchData = await safeFetchJson(searchUrl, 3e3);
        let results = searchData?.results || [];
        if (results.length > 0) {
          for (const entry of results.slice(0, 4)) {
            const resTitle = (entry.title || "").toLowerCase();
            const resSubtitle = (entry.subtitle || "").toLowerCase();
            const resSingers = (entry.more_info?.singers || "").toLowerCase();
            let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(" ").some((w) => w.length > 3 && hasWord(resTitle, w));
            let artistMatch = !cleanA ? true : cleanA.split(" ").some((w) => w.length > 1 && (hasWord(resSubtitle, w) || hasWord(resSingers, w) || hasWord(resTitle, w) && resTitle.includes("feat")));
            if (!titleMatch && !artistMatch) continue;
            let encryptedUrl = entry.more_info?.encrypted_media_url;
            if (!encryptedUrl && entry.id) {
              const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${entry.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
              const detailData = await safeFetchJson(detailUrl, 2500);
              encryptedUrl = detailData?.songs?.[0]?.more_info?.encrypted_media_url;
            }
            if (encryptedUrl) {
              const streamResult = await decryptSaavnMediaUrl(encryptedUrl);
              if (streamResult) {
                return {
                  url: streamResult.primaryUrl,
                  fallbackUrls: streamResult.fallbackUrls,
                  duration: parseInt(entry.more_info?.duration || "0", 10) || (expectedDuration || 210),
                  source: `JioSaavn (${entry.title})`,
                  bitrate: "320kbps AAC",
                  mimeType: "audio/mp4",
                  isDirectAudio: true,
                  isMediaDescriptor: false,
                  descriptorType: "direct",
                  resolvedTrackId: `saavn-${entry.id}`,
                  resolvedTitle: entry.title,
                  resolvedArtist: extractSaavnArtist(entry),
                  provider: "saavn"
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn("[AudioStreamResolver] JioSaavn error:", e);
      }
      return null;
    })());
    if (!options?.directAudioOnly) {
      promises.push((async () => {
        try {
          const ytSearch = (await import("yt-search")).default;
          const query = `${cleanT} ${cleanA} song`;
          const searchResults = await ytSearch(query);
          let videos = searchResults?.videos || [];
          if (videos.length > 0) {
            const scored = videos.map((vid, index) => {
              const vidTitle = (vid.title || "").toLowerCase();
              const vidAuthor = (vid.author?.name || "").toLowerCase();
              let score = Math.max(0, (10 - index) * 10);
              if (vidAuthor.includes("- topic")) score += 50;
              if (vidTitle.includes("official audio") || vidTitle.includes("lyric")) score += 30;
              if (cleanT.split(" ").every((w) => hasWord(vidTitle, w) || w.length > 4 && vidTitle.includes(w.substring(0, w.length - 1)))) score += 100;
              else if (cleanT.split(" ").some((w) => w.length > 3 && hasWord(vidTitle, w))) score += 50;
              if (cleanA && cleanA.split(" ").some((w) => w.length > 1 && (hasWord(vidAuthor, w) || hasWord(vidTitle, w)))) score += 100;
              if (expectedDuration) {
                const diff = Math.abs((vid.seconds || vid.duration?.seconds || 0) - expectedDuration);
                if (diff <= 5) score += 80;
                else if (diff <= 15) score += 40;
                else score -= diff;
              }
              return { vid, score };
            });
            scored.sort((a, b) => b.score - a.score);
            const bestVid = scored[0].vid;
            return {
              url: `youtube:${bestVid.videoId}`,
              fallbackUrls: [`youtube:${bestVid.videoId}`],
              duration: bestVid.seconds || 0,
              source: `YouTube (${bestVid.title})`,
              bitrate: "320kbps",
              mimeType: "video/youtube",
              isDirectAudio: false,
              isMediaDescriptor: true,
              descriptorType: "youtube",
              mediaUri: `youtube:${bestVid.videoId}`,
              resolvedTrackId: `yt-${bestVid.videoId}`,
              resolvedTitle: bestVid.title,
              resolvedArtist: bestVid.author?.name || "YouTube",
              provider: "youtube"
            };
          }
        } catch (e) {
          console.warn("[AudioStreamResolver] YouTube error:", e);
        }
        return null;
      })());
    }
    promises.push((async () => {
      try {
        const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(cleanT + " " + cleanA)}&app_name=spotiz`;
        const audiusData = await safeFetchJson(audiusUrl, 3e3);
        const audiusTracks = audiusData?.data || [];
        if (audiusTracks.length > 0) {
          const topTrack = audiusTracks[0];
          const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${topTrack.id}/stream?app_name=spotiz`;
          return {
            url: streamUrl,
            fallbackUrls: [streamUrl],
            duration: topTrack.duration || (expectedDuration || 210),
            source: `Audius (${topTrack.title})`,
            bitrate: "320kbps MP3",
            mimeType: "audio/mpeg",
            isDirectAudio: true,
            isMediaDescriptor: false,
            descriptorType: "direct",
            resolvedTrackId: `audius-${topTrack.id}`,
            resolvedTitle: topTrack.title,
            resolvedArtist: topTrack.user?.name || "",
            provider: "audius"
          };
        }
      } catch (e) {
        console.warn("[AudioStreamResolver] Audius error:", e);
      }
      return null;
    })());
    try {
      const winner = await Promise.any(promises.map(async (p) => {
        const res = await p;
        if (!res) throw new Error("Null stream");
        return res;
      }));
      return winner;
    } catch {
      return null;
    }
  }
};

// time-resolve.ts
(async () => {
  const start = Date.now();
  const res = await AudioStreamResolver.resolveFullTrack("123", "Shape of You", "Ed Sheeran");
  console.log("Time taken:", Date.now() - start, "ms");
  console.log(JSON.stringify(res, null, 2));
})();
