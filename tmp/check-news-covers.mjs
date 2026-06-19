import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:5518';
const widths = [390, 430, 768, 1024, 1440, 1920];
await fs.mkdir('tmp/news-redesign-shots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: width <= 430 ? 900 : 1000 },
  });
  const errors = [];
  const bad = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      bad.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${base}/news/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.kg-news-card:not(.is-skeleton)', { timeout: 20000 });
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += Math.max(360, Math.floor(innerHeight * 0.75))) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.kg-news-card__media img,.kg-news-featured__image,.kg-news-today-item img')]
      .map((img) => img.currentSrc || img.src);
    const cardImgs = [...document.querySelectorAll('.kg-news-card__media img')]
      .map((img) => img.getAttribute('src'));
    const forbidden = imgs.filter((src) => /\/assets\/(block|scenarios|cases|reviews)\//.test(src) || /\/assets\/news\/news-/.test(src));
    const adjacent = [];
    for (let i = 1; i < cardImgs.length; i += 1) {
      if (cardImgs[i] === cardImgs[i - 1]) adjacent.push([i - 1, i, cardImgs[i]]);
    }
    const failed = [...document.querySelectorAll('.kg-news img')]
      .filter((img) => !img.complete || img.naturalWidth < 1)
      .map((img) => img.src);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1,
      cardCount: cardImgs.length,
      uniqueCardImages: new Set(cardImgs).size,
      firstCardImages: cardImgs.slice(0, 12),
      forbidden,
      adjacent,
      failed,
    };
  });

  await page.screenshot({
    path: `tmp/news-redesign-shots/covers-${width}.png`,
    fullPage: true,
  });
  results.push({ width, ...metrics, errors, bad });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
