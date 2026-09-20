const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Set to mobile viewport
  await page.setViewport({ width: 375, height: 812 });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Wait for our interval to mount it
  await new Promise(r => setTimeout(r, 4000));
  
  const heroRoot = await page.evaluate(() => {
    const root = document.getElementById('spotiz-mobile-hero-root');
    if (!root) return 'NOT FOUND';
    return root.outerHTML;
  });
  
  console.log(heroRoot.substring(0, 1000));
  await browser.close();
})();
