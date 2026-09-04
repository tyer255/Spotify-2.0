const search = async () => {
    try {
        let res = await fetch('https://open.spotify.com/search/Madhur%20Sharma/artists');
        let html = await res.text();
        const matches = [...html.matchAll(/https:\/\/i\.scdn\.co\/image\/[a-zA-Z0-9]+/g)];
        const unique = [...new Set(matches.map(m => m[0]))];
        console.log("Madhur Sharma images:", unique);
    } catch (e) {
        console.error(e);
    }
}
search();
