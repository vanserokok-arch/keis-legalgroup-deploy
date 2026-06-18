// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('FAQ block (8) — first card expanded by default', () => {
  const pagesWithFaq = [
    '/zpp/',
    '/zpp/refund/',
    '/zpp/med-error/',
    '/scam/',
    '/scam/broker/',
  ];

  for (const path of pagesWithFaq) {
    test(`${path}: first .faq-item has is-open and aria-expanded="true"`, async ({ page }) => {
      await page.goto(path);
      await page.waitForSelector('.investment-faq .faq-item', { state: 'visible', timeout: 10000 });
      const firstItem = page.locator('.investment-faq .faq-item').first();
      await expect(firstItem).toHaveClass(/is-open/);
      await expect(firstItem.locator('.faq-question')).toHaveAttribute('aria-expanded', 'true');
    });
  }
});
