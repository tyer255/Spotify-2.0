const ytdl = require('@distube/ytdl-core');
ytdl.getInfo('q8icF9_Rpls').then(info => {
  console.log("Success", info.videoDetails.title);
}).catch(console.error);
