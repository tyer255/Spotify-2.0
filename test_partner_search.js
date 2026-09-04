import fetch from 'node-fetch';

async function test() {
    const trackId = '25Nxyrng0Z3jC5Q0hAibpw';
    const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`);
    const text = await res.text();
    const token = text.match(/"accessToken":"([^"]+)"/)[1];
    
    // Test Web Player search API
    // Need to use the exact pathfinder query format
    const query = encodeURIComponent("Dekha Tenu Mohammad Faiz");
    const partnerUrl = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables=%7B%22searchTerm%22%3A%22Dekha%20Tenu%20Mohammad%20Faiz%22%2C%22offset%22%3A0%2C%22limit%22%3A10%2C%22numberOfTopResults%22%3A5%2C%22includeAudiobooks%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22123%22%7D%7D`;
    
    // We don't have the sha256Hash for searchDesktop. Usually it's static per web player build.
    // Let's just try to hit `api.spotify.com/v1/search` with the client id? No.
    // What if we just search iTunes using Odesli and extract it? Odesli didn't work for Tauba Tauba because the iTunes ID was regional?
}
test().catch(console.error);
