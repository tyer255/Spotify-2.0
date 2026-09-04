import fetch from 'node-fetch';

async function run() {
  const ids = Array.from({length: 100}).map((_, i) => '7bxaFZ1O3cHkgLKMsdC3xR');
  const result = [];
  const BATCH_SIZE = 10;
  let ok = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const resolvedBatch = await Promise.all(
      batch.map(async (id) => {
        const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`;
        try {
          const res = await fetch(oembedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(3000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url && data.thumbnail_url.includes('scdn.co')) {
              ok++;
            }
          }
        } catch(e) {}
      })
    );
    if (i + BATCH_SIZE < ids.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  console.log(`Resolved: ${ok}/100`);
}
run();
