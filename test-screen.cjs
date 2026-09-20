const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot.png' });
  const html = await page.content();
  console.log('HTML length:', html.length);
  const rootContent = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log('Root length:', rootContent.length);
  await browser.close();
})();
