import ytdl from '@distube/ytdl-core';
(async () => {
  try {
    const info = await ytdl.getBasicInfo('https://www.youtube.com/watch?v=-C2pqs1DSgw');
    console.log(info.videoDetails.title, info.videoDetails.lengthSeconds);
  } catch (e) {
    console.log(e.message);
  }
})();
