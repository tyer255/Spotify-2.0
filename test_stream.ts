import ytdl from '@distube/ytdl-core';
(async () => {
  try {
    const info = await ytdl.getInfo('fHI8X4OXluQ');
    console.log(info.videoDetails.title);
  } catch (e) {
    console.error(e);
  }
})();
