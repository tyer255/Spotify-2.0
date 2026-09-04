import fetch from 'node-fetch';
async function test() {
    const isrc = 'INS182400369';
    const relRes = await fetch(`https://musicbrainz.org/ws/2/isrc/${isrc}?inc=url-rels&fmt=json`, {
        headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' }
    });
    const relData = await relRes.json();
    for (const rec of relData.recordings || []) {
        const urls = rec.relations?.filter(r => r.url?.resource?.includes('spotify.com/track/')) || [];
        if (urls.length > 0) {
            console.log("Found Spotify:", urls[0].url.resource);
        } else {
            console.log("No Spotify link in MB!");
        }
    }
}
test().catch(console.error);
