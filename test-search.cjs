const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click on Search navigation
  await page.evaluate(() => {
    const searchNav = Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'Search');
    if (searchNav) searchNav.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const searchAd = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.trim() === 'Advertisement');
    if(spans.length === 0) return null;
    let el = spans[0];
    while(el && !el.className.includes('relative') || el.tagName === 'SPAN') {
      if (el.tagName === 'BODY') break;
      el = el.parentElement;
    }
    return el.parentElement.className;
  });
  
  console.log('SEARCH AD CLASS:', searchAd);
  await browser.close();
})();
