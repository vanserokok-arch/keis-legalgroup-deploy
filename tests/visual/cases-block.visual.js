const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const pages = [
  '/scam/broker/index.html',
  '/scam/index.html',
  '/scam/hack/index.html',
  '/scam/pressure/index.html',
  '/zpp/index.html',
  '/zpp/build-contract/index.html',
  '/zpp/contractor/index.html',
  '/zpp/furniture/index.html',
  '/zpp/insurance/index.html',
  '/zpp/lawyer-claim/index.html',
  '/zpp/med-error/index.html',
  '/zpp/refund/index.html',
  '/zpp/renovation/index.html',
  '/zpp/services/index.html',
];

const viewports = [
  { name: 'desktop', width: 1600, height: 950 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 390, height: 900 },
];

const outDir = path.resolve('tests/visual/screenshots/cases');

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    for (const pagePath of pages) {
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:5507${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.locator('#cases').scrollIntoViewIfNeeded();
      await page.waitForTimeout(450);
      const slug = pagePath.replace(/^\//, '').replace(/\//g, '__').replace(/\.html$/, '');
      const target = path.join(outDir, `${slug}-${vp.name}.png`);
      await page.locator('#cases').screenshot({ path: target });
    }
    await context.close();
  }
  await browser.close();
  console.log('OK screenshots saved to', outDir);
})();
