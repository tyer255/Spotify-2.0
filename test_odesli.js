import fetch from 'node-fetch';

async function test() {
    // 1. Search iTunes
    const q = encodeURIComponent("Dekha Tenu Mohammad Faiz");
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=1`);
    const itunesData = await itunesRes.json();
    if (!itunesData.results || itunesData.results.length === 0) {
        console.log("Not found in iTunes");
        return;
    }
    const trackId = itunesData.results[0].trackId;
    console.log("iTunes ID:", trackId);
    
    // 2. Fetch Odesli
    const odesliRes = await fetch(`https://api.song.link/v1-alpha.1/links?platform=itunes&type=song&id=${trackId}`);
    if (odesliRes.ok) {
        const odesliData = await odesliRes.json();
        const spotifyEntity = Object.values(odesliData.entitiesByUniqueId).find(e => e.platforms.includes("spotify"));
        if (spotifyEntity) {
            console.log("Spotify ID:", spotifyEntity.id, spotifyEntity.title);
        } else {
            console.log("No Spotify link in Odesli");
        }
    } else {
        console.log("Odesli failed:", odesliRes.status);
    }
}
test().catch(console.error);
