const jsdom = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('dom-dump-mobile2.html', 'utf-8');
const dom = new jsdom.JSDOM(html);
const document = dom.window.document;

let targetNode = null;
const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'All');
if (allBtn) {
  let el = allBtn;
  while(el && !el.className.includes('sticky')) {
    if (el.tagName === 'BODY') break;
    el = el.parentElement;
  }
  targetNode = el;
}

if (targetNode) {
  console.log('Target Node class:', targetNode.className);
  console.log('Target Node parent class:', targetNode.parentElement.className);
} else {
  console.log('Not found');
}
