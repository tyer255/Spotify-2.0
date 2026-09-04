import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /import\s+spotifyUrlInfo\s+from\s+['"]spotify-url-info['"];\s*const\s+spotify\s*=\s*spotifyUrlInfo\(fetch\);/g;

const newCode = `import spotifyUrlInfo from 'spotify-url-info';
const customSpotifyFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });
};
const spotify = spotifyUrlInfo(customSpotifyFetch);`;

if (regex.test(content)) {
    content = content.replace(regex, newCode);
    fs.writeFileSync('server.ts', content);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find regex. Let's find it manually.");
    const match = content.match(/import\s+spotifyUrlInfo.*?\n.*?spotifyUrlInfo/g);
    console.log("Found:", match);
}
