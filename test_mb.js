import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://musicbrainz.org/ws/2/recording/?query=Sajni%20AND%20artist:Arijit&fmt=json`, {
        headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' }
    });
    const data = await res.json();
    for (const rec of data.recordings.slice(0, 3)) {
        console.log(rec.title, rec.id);
        const relRes = await fetch(`https://musicbrainz.org/ws/2/recording/${rec.id}?inc=url-rels&fmt=json`, {
            headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' }
        });
        const relData = await relRes.json();
        const urls = relData.relations?.filter(r => r.url?.resource?.includes('spotify.com/track/')) || [];
        if (urls.length > 0) {
            console.log("Found Spotify:", urls[0].url.resource);
        }
    }
}
test().catch(console.error);
