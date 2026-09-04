import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /  useEffect\(\(\) => \{\n    let isMounted = true;\n    \n    const historyArtists = profile\.history\.map\(t => t\.artist\);/g,
  "  useEffect(() => {\n    let isMounted = true;\n    \n    if (!profile || !profile.history) return;\n    const historyArtists = profile.history.map(t => t.artist);"
);

code = code.replace(
  /  \}, \[profile\.history\]\);/g,
  "  }, [profile?.history]);"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
