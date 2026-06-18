import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:5516';
const pages = [
  '/scam/',
  '/scam/broker/',
  '/scam/pressure/',
  '/scam/hack/',
  '/zpp/',
  '/zpp/refund/',
  '/zpp/insurance/',
  '/zpp/contractor/',
  '/zpp/furniture/',
  '/zpp/med-error/',
  '/zpp/renovation/',
  '/zpp/services/',
  '/zpp/build-contract/',
  '/zpp/lawyer-claim/',
];
const widths = [390, 430, 768, 1024, 1200, 1440, 1920];
const shotDir = 'tmp/video-bg-carousel-shots';
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const pagePath of pages) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const badResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(base) && response.status() >= 400) {
      badResponses.push(`${response.status()} ${url}`);
    }
  });
  await page.goto(`${base}${pagePath}#kgx-stories-carousel`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const section = document.querySelector('#kgx-stories-carousel');
    const video = section?.querySelector('video.kgx-stories__video-bg');
    const before = video?.currentTime ?? 0;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hasSection: Boolean(section),
          videoCount: section ? section.querySelectorAll('video.kgx-stories__video-bg').length : 0,
          sourceCount: video ? video.querySelectorAll('source').length : 0,
          src: video?.currentSrc || '',
          readyState: video?.readyState ?? null,
          paused: video?.paused ?? null,
          muted: video?.muted ?? null,
          loop: video?.loop ?? null,
          duration: Number.isFinite(video?.duration) ? video.duration : null,
          currentTimeBefore: before,
          currentTimeAfter: video?.currentTime ?? 0,
          videoWidth: video?.videoWidth ?? null,
          videoHeight: video?.videoHeight ?? null,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        });
      }, 900);
    });
  });
  results.push({ pagePath, ...info, errors, badResponses });
  await context.close();
}

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 430 ? 900 : width <= 768 ? 900 : 950 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${base}/scam/pressure/#kgx-stories-carousel`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  const section = page.locator('#kgx-stories-carousel');
  await section.screenshot({ path: `${shotDir}/kgx-stories-${width}-smooth.png` });
  await context.close();
}

await browser.close();

console.log(JSON.stringify(results, null, 2));
