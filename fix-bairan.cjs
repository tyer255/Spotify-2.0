const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// The original pattern we want to replace back:
code = code.replace(
  /let largeArt = rawArt \? rawArt\.replace\('150x150', '500x500'\) : 'https:\/\/images\.unsplash\.com\/photo-1511671782779-c97d3d27a1d4\?w=600&auto=format&fit=crop&q=80';\s*\/\/\ Custom metadata overrides for specific artist tracks that have aggregator conflicts\s*if \(title\.toLowerCase\(\)\.trim\(\) === 'bairan' && artist\.toLowerCase\(\)\.includes\('banjaare'\)\) \{\s*largeArt = 'https:\/\/is1-ssl\.mzstatic\.com\/image\/thumb\/Music211\/v4\/3c\/bd\/01\/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d\/821530642238\.jpg\/600x600bb\.jpg';\s*\}/g,
  "let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';"
);

// We need to append the override logic *after* title and artist are extracted.
// For Saavn tracks, they usually have title and artist extracted. Let's find where they are defined, 
// then inject the override.

// We can just add it into the trackObj creation or just after title and artist are defined.
const injectTarget = /(const artist = extractSaavnArtist(?:Id)?\([^;]+;\s*)/g;
code = code.replace(injectTarget, "$1\n            if (title && artist && title.toLowerCase().trim() === 'bairan' && artist.toLowerCase().includes('banjaare')) { largeArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3c/bd/01/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d/821530642238.jpg/600x600bb.jpg'; }\n");

// Also check for `const saavnArtist = extractSaavnArtist(...)` which might be used in other places.
const injectTarget2 = /(const saavnArtist = extractSaavnArtist[^;]+;\s*)/g;
code = code.replace(injectTarget2, "$1\n            if (item.title && saavnArtist && item.title.toLowerCase().trim() === 'bairan' && saavnArtist.toLowerCase().includes('banjaare')) { largeArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3c/bd/01/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d/821530642238.jpg/600x600bb.jpg'; }\n");

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Fixed Bairan thumbnail in Saavn');
