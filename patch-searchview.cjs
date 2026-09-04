const fs = require('fs');
let code = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

code = code.replace(
  /results\.songs\.filter\(\(track, index, self\) => index === self\.findIndex\(\(t\) => t\.title\.toLowerCase\(\) === track\.title\.toLowerCase\(\) && \(t\.artist\.toLowerCase\(\)\.includes\(track\.artist\.toLowerCase\(\)\) \|\| track\.artist\.toLowerCase\(\)\.includes\(t\.artist\.toLowerCase\(\)\)\)\)\)\.map\(\(track, idx\) => \{/g,
  "results.songs.map((track, idx) => {"
);

fs.writeFileSync('src/views/SearchView.tsx', code);
console.log('Patched SearchView.tsx');
