import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ @ts-ignore\nconst spotify = spotifyUrlInfo\(fetch\);/g;

const newCode = `// @ts-ignore
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
}
