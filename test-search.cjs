const { MusicService } = require('./dist/server.cjs');
(async () => {
  try {
    const res = await MusicService.search("Lambiyan");
    console.log("Success! " + res.songs.length);
  } catch (e) {
    console.error("FAIL", e);
  }
})();
