const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// Find processSaavnResults
const saavnOverride = `
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

            // Custom metadata overrides for specific artist tracks that have aggregator conflicts
            if (title.toLowerCase().trim() === 'bairan' && artist.toLowerCase().includes('banjaare')) {
              largeArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3c/bd/01/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d/821530642238.jpg/600x600bb.jpg';
            }
`;

code = code.replace(/const largeArt = rawArt \? rawArt\.replace\('150x150', '500x500'\) : 'https:\/\/images\.unsplash\.com\/photo-1511671782779-c97d3d27a1d4\?w=600&auto=format&fit=crop&q=80';/g, saavnOverride);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Patched Bairan thumbnail in Saavn');
