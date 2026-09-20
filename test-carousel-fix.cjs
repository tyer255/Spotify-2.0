const jsdom = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('dom-dump-mobile2.html', 'utf-8');
const dom = new jsdom.JSDOM(html);
const document = dom.window.document;

const filterRow = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'All')?.closest('.sticky');

console.log('Found filter row:', !!filterRow);

const itemNodes = Array.from(document.querySelectorAll('.group'));
const extracted = [];
itemNodes.forEach((node, idx) => {
  const img = node.querySelector('img');
  const titleEl = node.querySelector('h2, h3, h4, h5, .font-semibold, .font-bold');
  const artistEl = node.querySelector('p, .text-neutral-400');
  if (img && img.src && !img.src.includes('data:image') && titleEl && img.className.includes('object-cover')) {
    extracted.push({
      title: titleEl.textContent?.trim() || 'Unknown',
      artist: artistEl?.textContent?.trim() || 'Artist',
      imgSrc: img.src,
    });
  }
});
console.log('Extracted cards:', extracted.length);
if (extracted.length > 0) console.log(extracted[0]);
