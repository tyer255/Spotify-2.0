const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const homeAd = await page.evaluate(() => {
    // find all elements containing 'Advertisement'
    const spans = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.trim() === 'Advertisement');
    if(spans.length === 0) return null;
    
    // find the closest wrapper
    let el = spans[0];
    while(el && !el.className.includes('relative') || el.tagName === 'SPAN') {
      if (el.tagName === 'BODY') break;
      el = el.parentElement;
    }
    // go up one more usually
    return el.parentElement.className;
  });
  
  console.log('HOME AD CLASS:', homeAd);
  await browser.close();
})();
