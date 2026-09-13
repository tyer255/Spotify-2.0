import * as mm from 'music-metadata';
(async () => {
  const metadata = await mm.parseFile('e5c9337aa4a106fbd1622aaf027a2536_96.mp4');
  console.log("96 duration:", metadata.format.duration);
  const metadata320 = await mm.parseFile('e5c9337aa4a106fbd1622aaf027a2536_320.mp4');
  console.log("320 duration:", metadata320.format.duration);
})();
