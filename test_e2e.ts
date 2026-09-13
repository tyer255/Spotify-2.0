import { MusicService } from './server/services/musicService.js';
const ytdl = require('@distube/ytdl-core');

// Mock prefetch logic since it's inside server.ts, not musicService.js
// We'll just test the MusicService directly.

(async () => {
  console.log("1. User searches...");
  const searchStart = Date.now();
  const res = await MusicService.search("Despacito");
  console.log("Search took:", Date.now() - searchStart, "ms");
  
  const track = res.topResult.data;
  
  // Pre-resolve is kicked off asynchronously
  const preResolveStart = Date.now();
  MusicService.resolvePlayback(track.id, track.title, track.artist, track.duration).catch(() => {});
  console.log("Pre-resolve triggered in:", Date.now() - preResolveStart, "ms");

  console.log("User looking at results for 1.5 seconds...");
  await new Promise(r => setTimeout(r, 1500));
  
  console.log("2. User clicks PLAY");
  const playClick = Date.now();
  const playback = await MusicService.resolvePlayback(track.id, track.title, track.artist, track.duration);
  console.log("Client resolvePlayback took:", Date.now() - playClick, "ms");
  console.log("URL:", playback.url);
  
  // If youtube, simulate pre-fetch that would have happened
  let streamInfoWait = 0;
  if (playback.url.includes('youtube:')) {
    const s = Date.now();
    await ytdl.getInfo(playback.url.split(':')[1]);
    streamInfoWait = Date.now() - s;
    console.log("Client streaming start delay (simulate ytdl.getInfo if not cached):", streamInfoWait, "ms");
  }
})();
