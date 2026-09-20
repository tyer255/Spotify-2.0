const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Find button with text "Create" in the bottom dock
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.textContent.trim().endsWith('Create') || b.title === 'Create');
    if (createBtn) {
      createBtn.click();
      return 'found and clicked Create button: ' + createBtn.outerHTML.slice(0, 100);
    }
    return 'create button not found';
  });
  console.log(clicked);
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'create-menu-active.png' });
  console.log('Saved create-menu-active.png');

  // Let's inspect the menu
  const menuDetails = await page.evaluate(() => {
    // Find the menu container with text "Create a playlist with songs"
    const allDivs = Array.from(document.querySelectorAll('div, button'));
    const playlistText = allDivs.find(d => d.textContent.includes('Create a playlist with songs or episodes'));
    if (!playlistText) return { found: false };

    // Find parent container
    let container = playlistText;
    while (container && !container.className?.includes('rounded-3xl')) {
      container = container.parentElement;
    }

    if (!container) return { found: true, container: null };

    const cRect = container.getBoundingClientRect();
    const cComputed = window.getComputedStyle(container);

    const items = Array.from(container.querySelectorAll('button')).map(btn => {
      const h4 = btn.querySelector('h4');
      const p = btn.querySelector('p');
      const icon = btn.querySelector('div');
      const textContainer = h4?.parentElement;

      return {
        btnText: btn.textContent,
        btnRect: btn.getBoundingClientRect(),
        btnDisplay: window.getComputedStyle(btn).display,
        btnFlexDirection: window.getComputedStyle(btn).flexDirection,
        iconRect: icon?.getBoundingClientRect(),
        textContainerRect: textContainer?.getBoundingClientRect(),
        textContainerComputed: textContainer ? {
          width: window.getComputedStyle(textContainer).width,
          minWidth: window.getComputedStyle(textContainer).minWidth,
          flex: window.getComputedStyle(textContainer).flex,
          display: window.getComputedStyle(textContainer).display,
        } : null,
        h4Rect: h4?.getBoundingClientRect(),
        h4Text: h4?.textContent,
        h4Computed: h4 ? {
          fontSize: window.getComputedStyle(h4).fontSize,
          display: window.getComputedStyle(h4).display,
          wordBreak: window.getComputedStyle(h4).wordBreak,
          whiteSpace: window.getComputedStyle(h4).whiteSpace,
          webkitLineClamp: window.getComputedStyle(h4).webkitLineClamp,
          width: window.getComputedStyle(h4).width,
        } : null,
        pRect: p?.getBoundingClientRect(),
        pText: p?.textContent,
        pComputed: p ? {
          fontSize: window.getComputedStyle(p).fontSize,
          width: window.getComputedStyle(p).width,
          whiteSpace: window.getComputedStyle(p).whiteSpace,
          overflow: window.getComputedStyle(p).overflow,
        } : null,
      };
    });

    return {
      found: true,
      containerClass: container.className,
      containerRect: cRect,
      containerStyle: {
        width: cComputed.width,
        position: cComputed.position,
        left: cComputed.left,
        right: cComputed.right,
        bottom: cComputed.bottom,
        maxWidth: cComputed.maxWidth,
      },
      items
    };
  });

  console.log('Menu Details:', JSON.stringify(menuDetails, null, 2));

  await browser.close();
})();
