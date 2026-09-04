const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

// Remove the Track ID display from the SUCCESS state
const oldUI = `<div className="w-full bg-black/40 rounded-lg p-3 text-left mb-6 border border-white/5">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Track ID:</p>
                <p className="text-green-400 font-mono text-sm break-all">{tag.spotifyId}</p>
              </div>`;

const newUI = `<div className="w-full bg-black/40 rounded-lg p-3 text-center mb-6 border border-white/5">
                <p className="text-green-400 font-mono text-sm">Extracting track info...</p>
              </div>`;

if (file.includes('Track ID:')) {
    file = file.replace(oldUI, newUI);
    fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
    console.log("Removed noisy Track ID from UI");
} else {
    console.log("Track ID UI not found");
}
