const fs = require('fs');

// 1. Fix server.ts to disable caching for HTML and change console.log
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /app\.use\(express\.static\(distPath\)\);/g,
  `app.use(express.static(distPath, { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));`
);
serverContent = serverContent.replace(
  /app\.get\('\*', \(req, res\) => \{/g,
  `app.get('*', (req, res) => {\n      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');`
);
serverContent = serverContent.replace(/Spotify 2\.0/g, 'Spotiz');
serverContent = serverContent.replace(/Spotify/g, 'Spotiz');
fs.writeFileSync('server.ts', serverContent);

// 2. Reduce API client memory cache
let apiClientContent = fs.readFileSync('src/services/apiClient.ts', 'utf8');
apiClientContent = apiClientContent.replace(/300000/g, '30000'); // 5 mins to 30 seconds
fs.writeFileSync('src/services/apiClient.ts', apiClientContent);

// 3. Make HomeView bypass cache for dynamic requests
let homeContent = fs.readFileSync('src/views/HomeView.tsx', 'utf8');
homeContent = homeContent.replace(/api\.search\(mostListenedArtist\)/g, 'api.search(mostListenedArtist, true)');
fs.writeFileSync('src/views/HomeView.tsx', homeContent);

