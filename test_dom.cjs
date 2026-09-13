const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.addEventListener('error', (event) => {
  console.log('Error from window:', event.error);
});
dom.window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled Rejection:', event.reason);
});
setTimeout(() => {
  console.log('HTML after 2s:', dom.window.document.body.innerHTML.substring(0, 500));
  process.exit(0);
}, 2000);
