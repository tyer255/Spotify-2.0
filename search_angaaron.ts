import { SpotifyMusicProvider } from './server/providers/SpotifyMusicProvider.ts';

async function run() {
    try {
        const ytSearch = (await import('yt-search')).default;
        const res = await ytSearch('Angaaron Pushpa 2');
        console.log(res.videos.slice(0, 3).map(v => v.title));
        
        const q = encodeURIComponent("Angaaron Shreya Ghoshal");
        const res2 = await fetch(`https://api.deezer.com/search?q=${q}&limit=1`);
        const dzData = await res2.json();
        console.log("Deezer:", dzData.data?.[0]?.title, dzData.data?.[0]?.artist?.name, dzData.data?.[0]?.isrc);
    } catch(e) {}
}
run();
