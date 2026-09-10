import { MusicService } from './server/services/musicService.js';

async function test() {
  console.log("Searching for Dynamite...");
  const searchResults = await MusicService.searchTracks("Dynamite");
  console.log(`Found ${searchResults.length} tracks.`);
  
  for (let i = 0; i < Math.min(5, searchResults.length); i++) {
    const t = searchResults[i];
    console.log(`\n--- Track ${i+1}: "${t.title}" by "${t.artist}" (ID: ${t.id}, Provider: ${t.provider}, Duration: ${t.duration}) ---`);
    console.log(`Initial streamUrl: ${t.streamUrl}`);
    
    // Test stream resolution
    try {
      const streamRes = await MusicService.resolvePlayback(t.id, t.title, t.artist, t.duration);
      console.log(`Resolved stream:`, streamRes?.stream?.url);
      console.log(`Fallback URLs (${streamRes?.stream?.fallbackUrls?.length || 0}):`, streamRes?.stream?.fallbackUrls);
    } catch (e: any) {
      console.error(`Error resolving stream:`, e.message || e);
    }
  }
}

test();
