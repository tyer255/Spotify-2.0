import ytdl from '@distube/ytdl-core';
(async () => {
  try {
    const info = await ytdl.getInfo('kJQP7kiw5Fk'); // Despacito
    console.log(info.videoDetails.title);
  } catch (e) {
    console.error(e);
  }
})();
