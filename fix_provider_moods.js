import fs from 'fs';

let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(
  /image: satranga\?\.images/g,
  "image: barsaat?.images"
);
code = code.replace(
  /image: chaleya\?\.images/g,
  "image: bairan?.images"
);
code = code.replace(
  /image: kesariya\?\.images/g,
  "image: illuminati?.images"
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
