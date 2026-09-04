const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldSpotify = `import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);`;

const newSpotify = `import spotifyUrlInfo from 'spotify-url-info';
const customFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });
};
const spotify = spotifyUrlInfo(customFetch);`;

if (content.includes(oldSpotify)) {
  content = content.replace(oldSpotify, newSpotify);
  fs.writeFileSync('server.ts', content);
  console.log("Updated spotify fetch with Googlebot UA.");
} else {
  console.log("Could not find the old spotify import.");
}
