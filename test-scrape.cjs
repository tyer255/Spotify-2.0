const jsdom = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('dom-dump-desktop.html', 'utf-8');
const dom = new jsdom.JSDOM(html);
const document = dom.window.document;

const cards = Array.from(document.querySelectorAll('.group'));
const tracks = [];

for (const card of cards) {
  const img = card.querySelector('img');
  const title = card.querySelector('h3, h2, h4, h5');
  const artist = card.querySelector('p');
  
  if (img && title && artist && img.src && !img.src.includes('data:image')) {
    tracks.push({
      image: img.src,
      title: title.textContent.trim(),
      artist: artist.textContent.trim()
    });
  }
}

console.log(tracks.slice(0, 5));
