import fetch from 'node-fetch';

async function test() {
    const sp_dc = process.env.SPOTIFY_SP_DC || "AQASO79dkJqiGjAaYRQgdeG_Tk_uDibYmbSCxPwnkeI6Tv9U0-E-ogVgHbJZVpGeraEnZSEpUQzOa2U6kk0LxFBAysIsCNcFeZzp2FSfPAmteW7NPgs1TfdAyAn17STis15CRHPeWPemPJ4bS0_Tn2Sdcqf-oVpAfxaIjrrroPNH8ABrAMaXZD7f8ugn4YBZ0J5xpaJpeUs78Ye6Cg0pPG9xzvO0GOwz9E4M3rgx_iB9v2D4b9NW8sIILfeVTEmsaaxinIKFgeAfAtc";
    
    // get token
    const tokenRes = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Cookie": `sp_dc=${sp_dc}`
        }
    });
    
    const tokenData = await tokenRes.json();
    const token = tokenData.accessToken;
    console.log("Token acquired:", token.substring(0, 20) + "...");
    
    // test search
    const query = encodeURIComponent(`track: Tauba Tauba artist: Karan Aujla`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (searchRes.ok) {
        const data = await searchRes.json();
        console.log("Search worked!", data.tracks.items[0]?.id);
    } else {
        console.log("Search failed:", searchRes.status, await searchRes.text());
        
        // Let's try the partner API for web player search
        const partnerRes = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables=%7B%22searchTerm%22%3A%22Tauba%20Tauba%20Karan%20Aujla%22%2C%22offset%22%3A0%2C%22limit%22%3A10%2C%22numberOfTopResults%22%3A5%2C%22includeAudiobooks%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22123%22%7D%7D`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "App-Platform": "WebPlayer"
            }
        });
        console.log("Partner search status:", partnerRes.status);
    }
}
test().catch(console.error);
