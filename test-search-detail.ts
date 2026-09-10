import ytSearch from 'yt-search';

async function test() {
  console.log("Testing YouTube search for BTS Dynamite:");
  const ytRes = await ytSearch("Dynamite BTS official audio");
  const vids = ytRes.videos.slice(0, 5);
  for (const v of vids) {
    console.log(`- "${v.title}" by ${v.author?.name} (${v.seconds}s, ID: ${v.videoId})`);
  }

  console.log("\nTesting YouTube search for Taio Cruz Dynamite:");
  const ytRes2 = await ytSearch("Dynamite Taio Cruz official audio");
  const vids2 = ytRes2.videos.slice(0, 5);
  for (const v of vids2) {
    console.log(`- "${v.title}" by ${v.author?.name} (${v.seconds}s, ID: ${v.videoId})`);
  }
}

test();
