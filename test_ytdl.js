const ytdl = require('@distube/ytdl-core');
ytdl.getInfo('ONb4aTtG6Ps').then(info => console.log('success')).catch(e => console.error(e));
