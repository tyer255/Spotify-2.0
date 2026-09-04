import fetch from 'node-fetch';
async function run() {
    const relRes = await fetch(`https://musicbrainz.org/ws/2/isrc/INS182401598?inc=url-rels&fmt=json`, {
        headers: { 'User-Agent': 'OpenMusic/1.0.0 ( contact@openmusic.com )' },
    });
    const relData: any = await relRes.json();
    console.log(JSON.stringify(relData, null, 2));
}
run();
