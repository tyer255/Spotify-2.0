const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  let urlHome = await page.evaluate(() => window.location.href);
  
  await page.evaluate(() => {
    const searchNav = Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'Search');
    if (searchNav) searchNav.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  let urlSearch = await page.evaluate(() => window.location.href);
  
  console.log('HOME URL:', urlHome);
  console.log('SEARCH URL:', urlSearch);
  
  await browser.close();
})();
