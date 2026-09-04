import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`"Dekha Tenu" AND artist:"Mohammad Faiz"`);
    const res = await fetch(`https://musicbrainz.org/ws/2/recording?query=${q}&fmt=json`, {
        headers: { "User-Agent": "SpotizCanvasResolver/1.0.0 ( test@example.com )" }
    });
    const data = await res.json();
    if (data.recordings && data.recordings.length > 0) {
        const mbid = data.recordings[0].id;
        console.log("Found MBID:", mbid);
        
        // Fetch relations
        const relRes = await fetch(`https://musicbrainz.org/ws/2/recording/${mbid}?inc=url-rels&fmt=json`, {
            headers: { "User-Agent": "SpotizCanvasResolver/1.0.0 ( test@example.com )" }
        });
        const relData = await relRes.json();
        const spotUrl = relData.relations?.find(r => r.url?.resource?.includes("spotify.com"));
        if (spotUrl) {
            console.log("Found Spotify:", spotUrl.url.resource);
        } else {
            console.log("No Spotify relation for Dekha Tenu.");
        }
    } else {
        console.log("Not found in MusicBrainz");
    }
}
test().catch(console.error);
