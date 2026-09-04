import fetch from 'node-fetch';
async function test() {
    const isrc = 'INS182400369';
    const relRes = await fetch(`https://musicbrainz.org/ws/2/isrc/${isrc}?inc=url-rels&fmt=json`, {
        headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' }
    });
    const relData = await relRes.json();
    console.log("MusicBrainz:", relData.recordings?.length);
}
test().catch(console.error);
