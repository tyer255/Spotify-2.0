import fetch from 'node-fetch';

async function searchDDG(query) {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const matches = html.match(/open\.spotify\.com(?:%2F|\/)track(?:%2F|\/)([a-zA-Z0-9]{22})/g);
    if (matches) {
        console.log("Found matches:", matches.slice(0, 3));
    } else {
        console.log("No matches found in HTML.");
    }
}

searchDDG("Sajni Arijit site:open.spotify.com/track").catch(console.error);
