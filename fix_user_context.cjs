const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

code = code.replace(
  /  useEffect\(\(\) => \{\n\s*try \{\n\s*localStorage\.setItem\('spotify_user_playlists', JSON\.stringify\(playlists\)\);\n\s*\} catch \(e\) \{\}\n\s*\}, \[playlists\]\);\n/,
  ""
);

fs.writeFileSync('src/context/UserContext.tsx', code);
