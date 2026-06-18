const { chromium } = require('playwright');
const pages = [
  '/scam/broker/index.html','/scam/index.html','/scam/hack/index.html','/scam/pressure/index.html',
  '/zpp/index.html','/zpp/build-contract/index.html','/zpp/contractor/index.html','/zpp/furniture/index.html',
  '/zpp/insurance/index.html','/zpp/lawyer-claim/index.html','/zpp/med-error/index.html','/zpp/refund/index.html',
  '/zpp/renovation/index.html','/zpp/services/index.html',
];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [{ n: 'desktop', w: 1600, h: 950 },{ n: 'tablet', w: 1024, h: 900 },{ n: 'mobile', w: 390, h: 900 }];
  let errors = 0;
  for (const v of viewports) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
    for (const p of pages) {
      const page = await ctx.newPage();
      const cerr = [];
      page.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text()); });
      await page.goto(`http://127.0.0.1:5507${p}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.locator('#cases').scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const ok = await page.evaluate(() => {
        const root = document.querySelector('#cases.case-showcase');
        if (!root) return { root: false };
        const docs = [...root.querySelectorAll('.case-doc__image')];
        const labels = [...root.querySelectorAll('.case-doc-title')].map((n) => n.textContent.trim());
        const allow = ['Претензия', 'Исковое заявление', 'Решение суда', 'Исполнительный лист'];
        const validLabels = labels.every((x) => allow.includes(x));
        const bigDocs = docs.every((i) => i.getBoundingClientRect().height >= 150);
        const noRound = docs.every((i) => getComputedStyle(i).borderRadius === '0px');
        const hasBottomCarousel = !!root.querySelector('.case-showcase__carousel');
        const oldVertical = !!root.querySelector('.case-showcase__rail-viewport');
        const railPseudo = root.querySelector('.case-showcase__rail');
        const rightRailPseudo = railPseudo ? (getComputedStyle(railPseudo, '::before').content || 'none') !== 'none' : false;
        return { root: true, validLabels, bigDocs, noRound, hasBottomCarousel, oldVertical, rightRailPseudo };
      });
      if (cerr.length || !ok.root || !ok.validLabels || !ok.bigDocs || !ok.noRound || !ok.hasBottomCarousel || ok.oldVertical || ok.rightRailPseudo) {
        errors += Math.max(1, cerr.length);
        console.log('FAIL', v.n, p, JSON.stringify(ok), 'console', cerr.length);
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log('TOTAL_ERRORS', errors);
  process.exit(errors ? 1 : 0);
})();
