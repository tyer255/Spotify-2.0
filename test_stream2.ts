import ytdl from '@distube/ytdl-core';
(async () => {
  try {
    const info = await ytdl.getInfo('BaW_ywVDefc');
    console.log(info.videoDetails.title);
  } catch (e) {
    console.error(e);
  }
})();
