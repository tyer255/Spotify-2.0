const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// replace `return applyMetadataOverrides(applyMetadataOverrides` ...
while(code.includes('applyMetadataOverrides(applyMetadataOverrides(')) {
    code = code.replace(/applyMetadataOverrides\(applyMetadataOverrides\(([^)]+)\)\)/g, 'applyMetadataOverrides($1)');
}

// Fix the infinite recursion in the function itself
code = code.replace(/function applyMetadataOverrides[\s\S]*?return applyMetadataOverrides\(track\);\n\}/, 
`function applyMetadataOverrides(track: any) {
  try {
    if (track && typeof track.title === 'string' && typeof track.artist === 'string' && track.title.toLowerCase().trim() === 'bairan' && track.artist.toLowerCase().includes('banjaare')) {
      const overrideArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3c/bd/01/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d/821530642238.jpg/600x600bb.jpg';
      if (track.images) {
        track.images.small = overrideArt;
        track.images.medium = overrideArt;
        track.images.large = overrideArt;
      }
    }
  } catch (e) {
    console.warn('applyMetadataOverrides error', e);
  }
  return track;
}`);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Fixed applyMetadataOverrides recursion');
