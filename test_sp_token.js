import fetch from 'node-fetch';
async function test() {
    const sp_dc = process.env.SPOTIFY_SP_DC || "AQASO79dkJqiGjAaYRQgdeG_Tk_uDibYmbSCxPwnkeI6Tv9U0-E-ogVgHbJZVpGeraEnZSEpUQzOa2U6kk0LxFBAysIsCNcFeZzp2FSfPAmteW7NPgs1TfdAyAn17STis15CRHPeWPemPJ4bS0_Tn2Sdcqf-oVpAfxaIjrrroPNH8ABrAMaXZD7f8ugn4YBZ0J5xpaJpeUs78Ye6Cg0pPG9xzvO0GOwz9E4M3rgx_iB9v2D4b9NW8sIILfeVTEmsaaxinIKFgeAfAtc";
    const res = await fetch(`https://open.spotify.com/get_access_token?reason=transport&productType=web_player`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Cookie": `sp_dc=${sp_dc}`
        }
    });
    const data = await res.json();
    console.log("Token:", data.accessToken ? data.accessToken.substring(0,20) : data);
    
    // Now try to search with this token
    if (data.accessToken) {
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=Sajni&type=track&limit=1`, {
            headers: {
                "Authorization": `Bearer ${data.accessToken}`
            }
        });
        console.log("Search status:", searchRes.status);
        if (searchRes.ok) {
            const searchData = await searchRes.json();
            console.log("Track:", searchData.tracks?.items?.[0]?.id);
        } else {
            console.log("Error:", await searchRes.text());
        }
    }
}
test().catch(console.error);
