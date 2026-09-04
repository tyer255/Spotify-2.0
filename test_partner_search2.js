import fetch from 'node-fetch';

async function test() {
    const sp_dc = "AQASO79dkJqiGjAaYRQgdeG_Tk_uDibYmbSCxPwnkeI6Tv9U0-E-ogVgHbJZVpGeraEnZSEpUQzOa2U6kk0LxFBAysIsCNcFeZzp2FSfPAmteW7NPgs1TfdAyAn17STis15CRHPeWPemPJ4bS0_Tn2Sdcqf-oVpAfxaIjrrroPNH8ABrAMaXZD7f8ugn4YBZ0J5xpaJpeUs78Ye6Cg0pPG9xzvO0GOwz9E4M3rgx_iB9v2D4b9NW8sIILfeVTEmsaaxinIKFgeAfAtc";
    const res = await fetch(`https://open.spotify.com/embed/track/25Nxyrng0Z3jC5Q0hAibpw`, {
        headers: { "Cookie": `sp_dc=${sp_dc}` }
    });
    const token = (await res.text()).match(/"accessToken":"([^"]+)"/)[1];
    
    // Test Partner API generic query (not searchDesktop, maybe we can just query general search?)
    // Actually, maybe we can query by ISRC?
    // Let's try the unauthenticated search endpoint? There isn't one.
    // What if we try to use the user's Client ID again, but the user said they don't have premium.
}
test().catch(console.error);
