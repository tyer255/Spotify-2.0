const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const searchNav = Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'Search');
    if (searchNav) searchNav.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  fs.writeFileSync('dom-dump-search.html', html);
  
  console.log('Search DOM saved');
  await browser.close();
})();
