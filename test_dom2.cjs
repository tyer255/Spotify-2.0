const { JSDOM } = require('jsdom');
JSDOM.fromURL("http://localhost:3000/", {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true
}).then(dom => {
  dom.window.addEventListener('error', (event) => {
    console.log('Error:', event.error);
  });
  dom.window.addEventListener('unhandledrejection', (event) => {
    console.log('Unhandled:', event.reason);
  });
  setTimeout(() => {
    console.log('App root:', dom.window.document.getElementById('root').innerHTML.substring(0, 300));
    process.exit(0);
  }, 4000);
});
