import fetch from 'node-fetch';

async function test() {
    const sp_dc = "AQASO79dkJqiGjAaYRQgdeG_Tk_uDibYmbSCxPwnkeI6Tv9U0-E-ogVgHbJZVpGeraEnZSEpUQzOa2U6kk0LxFBAysIsCNcFeZzp2FSfPAmteW7NPgs1TfdAyAn17STis15CRHPeWPemPJ4bS0_Tn2Sdcqf-oVpAfxaIjrrroPNH8ABrAMaXZD7f8ugn4YBZ0J5xpaJpeUs78Ye6Cg0pPG9xzvO0GOwz9E4M3rgx_iB9v2D4b9NW8sIILfeVTEmsaaxinIKFgeAfAtc";
    
    // 1. Get token from embed (use a known track ID)
    const trackId = '25Nxyrng0Z3jC5Q0hAibpw'; // Tauba Tauba
    const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: { "Cookie": `sp_dc=${sp_dc}` }
    });
    const text = await res.text();
    const tokenMatch = text.match(/"accessToken":"([^"]+)"/);
    if (!tokenMatch) {
        console.log("Failed to get token from embed");
        return;
    }
    const token = tokenMatch[1];
    console.log("Got token from embed!", token.substring(0, 15) + "...");
    
    // 2. Use it to search for another song (Dekha Tenu)
    const query = encodeURIComponent(`track:Dekha Tenu artist:Mohammad Faiz`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    console.log("Search status:", searchRes.status);
    if (searchRes.ok) {
        const data = await searchRes.json();
        const foundId = data.tracks.items[0]?.id;
        console.log("Found ID:", foundId);
    } else {
        console.log(await searchRes.text());
    }
}
test().catch(console.error);
