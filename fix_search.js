import fs from 'fs';

let code = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

code = code.replace(
  /\{\/\* Top 4 Songs Column \*\/\}/,
  "{/* Songs Column */}"
);

code = code.replace(
  /                  <button\n                    onClick=\{\(\) => setActiveFilter\('songs'\)\}\n                    className="text-xs text-neutral-400 hover:text-white font-semibold transition-colors cursor-pointer"\n                  >\n                    See all\n                  <\/button>/,
  ""
);

code = code.replace(
  /\{results\.songs\.slice\(0, 4\)\.map\(\(track, idx\) => \{/,
  "{results.songs.filter((track, index, self) => index === self.findIndex((t) => t.title.toLowerCase() === track.title.toLowerCase() && (t.artist.toLowerCase().includes(track.artist.toLowerCase()) || track.artist.toLowerCase().includes(t.artist.toLowerCase())))).map((track, idx) => {"
);

fs.writeFileSync('src/views/SearchView.tsx', code);
