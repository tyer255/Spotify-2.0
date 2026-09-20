const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Tablet View (768x1024)
  const tabletPage = await browser.newPage();
  await tabletPage.setViewport({ width: 768, height: 1024 });
  await tabletPage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Library on Tablet
  await tabletPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button, button'));
    const libBtn = btns.find(b => b.textContent.trim().includes('Your Library'));
    if (libBtn) libBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await tabletPage.screenshot({ path: 'library-tablet.png' });

  // 2. Desktop View (1440x900)
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Library on Desktop
  await desktopPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('nav button, button, aside button, aside a'));
    const libBtn = btns.find(b => b.textContent.trim().includes('Your Library'));
    if (libBtn) libBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await desktopPage.screenshot({ path: 'library-desktop.png' });

  // Analyze metrics on desktop
  const desktopMetrics = await desktopPage.evaluate(() => {
    const header = document.getElementById('library-header');
    const title = header?.querySelector('h1');
    const avatar = document.getElementById('library-profile-avatar-btn');
    const searchBtn = document.getElementById('library-search-toggle-btn');
    const createBtn = document.getElementById('library-create-playlist-btn');

    return {
      titleFontSize: title ? window.getComputedStyle(title).fontSize : null,
      titleFontWeight: title ? window.getComputedStyle(title).fontWeight : null,
      avatarSize: avatar ? { w: avatar.getBoundingClientRect().width, h: avatar.getBoundingClientRect().height } : null,
      searchBtnSize: searchBtn ? { w: searchBtn.getBoundingClientRect().width, h: searchBtn.getBoundingClientRect().height } : null,
      createBtnSize: createBtn ? { w: createBtn.getBoundingClientRect().width, h: createBtn.getBoundingClientRect().height } : null,
    };
  });
  console.log('Desktop Metrics:', desktopMetrics);

  await browser.close();
})();
