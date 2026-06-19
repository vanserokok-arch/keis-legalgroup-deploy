import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://127.0.0.1:5516';
const widths = [390, 430, 768, 1024, 1440, 1920];
const shotDir = 'tmp/news-redesign-shots';
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const height = width <= 430 ? 900 : width <= 768 ? 920 : 1000;
  const context = await browser.newContext({
    viewport: { width, height },
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

  await page.goto(`${base}/news/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('.kg-news-card:not(.is-skeleton), .kg-news-feedback.is-error', { timeout: 15000 });
  await page.waitForTimeout(1400);
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += Math.max(360, Math.floor(innerHeight * 0.8))) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.kg-news-card:not(.is-skeleton)')];
    const images = [...document.querySelectorAll('.kg-news img')].filter((img) => {
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 2 && r.height > 2;
    });
    const failedImages = images
      .filter((img) => !img.complete || img.naturalWidth < 1)
      .map((img) => img.currentSrc || img.src);
    const buttons = [...document.querySelectorAll('.kg-news-featured__btn, .kg-news-card__link, .kg-news-consult-btn, .kg-news-load-more__btn')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, text: el.textContent.trim() };
      });
    const fixed = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return false;
        if (String(el.className || '').includes('jv-pseudo-height')) return false;
        if (el.closest('[aria-hidden="true"]')) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 20 || r.height < 20) return false;
        return r.bottom > 0 && r.right > 0 && r.x < innerWidth && r.y < innerHeight;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, cls: el.className || el.id || el.tagName };
      });
    const intersects = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
    return {
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1,
      cards: cards.length,
      editorialColumns: getComputedStyle(document.querySelector('.kg-news-editorial')).gridTemplateColumns,
      streamColumns: getComputedStyle(document.querySelector('.kg-news-list')).gridTemplateColumns,
      sidebarTop: document.querySelector('.kg-news-sidebar')?.getBoundingClientRect().top ?? null,
      failedImages,
      fixedOverlapButtons: fixed
        .filter((fx) => buttons.some((btn) => intersects(fx, btn)))
        .map((fx) => fx.cls.toString().slice(0, 120)),
    };
  });

  await page.screenshot({
    path: `${shotDir}/final-polish-${width}.png`,
    fullPage: true,
  });
  results.push({ width, ...metrics, errors, badResponses });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
