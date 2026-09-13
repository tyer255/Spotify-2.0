import ytdl from '@distube/ytdl-core';
const stream = ytdl('Qn_7vrUpHj0', { filter: 'audioonly', quality: 'highestaudio' });
let bytes = 0;
stream.on('data', chunk => bytes += chunk.length);
stream.on('end', () => console.log('Finished. Bytes:', bytes));
stream.on('error', err => console.log('Error:', err));
