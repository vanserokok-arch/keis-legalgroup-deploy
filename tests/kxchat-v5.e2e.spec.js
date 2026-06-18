const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');

const REQUIRED_PAGES = ['/', '/news/', '/scam/broker/', '/scam/hack/', '/zpp/med-error/', '/auto-law/dkp/'];
const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 375, height: 812 }
];

const CONTACT_SAVED_TEXT = 'Спасибо, контакт получила. Можете коротко описать ситуацию.';
const CLIENT_NETWORK_FALLBACK_TEXT = 'Поняла. Коротко расскажите, что у вас произошло?';
const QUICK_REPLY_TEXTS = ['Нужна консультация', 'Хочу описать ситуацию', 'Как к вам подъехать?'];

const WIDGET_TEST_CONFIG = {
  CHECK_DELAY_FIRST_MS: 3000,
  CHECK_DELAY_NEXT_MS: 2000,
  AUTO_OPEN_DELAY_DESKTOP_MS: 60000,
  AUTO_OPEN_DELAY_MOBILE_MS: 60000,
  REOPEN_DELAY_DESKTOP_MS: 650,
  REOPEN_DELAY_MOBILE_MS: 750,
  CONTACT_IDLE_PROMPT_DESKTOP_MS: 700,
  CONTACT_IDLE_PROMPT_MOBILE_MS: 900,
  CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS: 120,
  REOPEN_INTERACTION_GUARD_MS: 120,
  TYPING_START_MIN_MS: 1000,
  TYPING_START_MAX_MS: 2000,
  TYPING_SHORT_MIN_MS: 4000,
  TYPING_SHORT_MAX_MS: 6000,
  TYPING_MEDIUM_MIN_MS: 7000,
  TYPING_MEDIUM_MAX_MS: 9000,
  TYPING_LONG_MIN_MS: 10000,
  TYPING_LONG_MAX_MS: 12000
};

let backendProc = null;
test.setTimeout(180000);

const waitForHealth = async (timeoutMs = 30000) => {
  const started = Date.now();
  while ((Date.now() - started) < timeoutMs) {
    try {
      const response = await fetch('http://127.0.0.1:8787/api/health');
      if (response.ok) return;
    } catch (_) {
      // ignore
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('KXCHAT backend did not start in time');
};

const injectWidgetConfig = async page => {
  await page.addInitScript(config => {
    window.KXCHAT_CONFIG = config;
  }, WIDGET_TEST_CONFIG);
};

const ensureChatOpen = async page => {
  const widget = page.locator('#kxchat-widget');
  const launcher = page.locator('#kxchat-launcher');
  if (!await widget.evaluate(el => el.classList.contains('open'))) {
    await launcher.click();
  }
  await expect(page.locator('#kxchat-widget.open')).toBeVisible();
};

const openChatOnPage = async (page, route, viewport, baseURL) => {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await injectWidgetConfig(page);
  await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#kxchat-launcher', { state: 'visible' });
  await ensureChatOpen(page);
  await expect(page.locator('#kxchat-messages')).toContainText('Меня зовут Ольга Сергеевна');
};

const completeContactForm = async page => {
  if (!await page.locator('#kxchat-contact-submit').isVisible().catch(() => false)) {
    return;
  }
  await page.fill('#kxchat-contact-phone', '89876543210');
  await expect(page.locator('#kxchat-contact-phone')).toHaveValue('+7 987 654-32-10');
  await page.fill('#kxchat-contact-name', 'Ирина');
  await expect(page.locator('#kxchat-contact-submit')).toHaveText('Отправить');
  await page.click('#kxchat-contact-submit');
  await expect(page.locator('#kxchat-contact-submit')).toHaveText('Спасибо !');
  await expect(page.locator('#kxchat-messages')).toContainText(CONTACT_SAVED_TEXT);
};

const sendAndWaitAssistantReply = async (page, text) => {
  const assistantLocator = page.locator('#kxchat-messages .kxchat-message-operator_ai .kxchat-bubble-text');
  const before = await assistantLocator.count();
  await page.fill('#kxchat-textarea', text);
  await page.keyboard.press('Enter');
  await expect(page.locator('#kxchat-messages .kxchat-message-visitor .kxchat-bubble-text').last()).toHaveText(text);
  await page.waitForFunction(prev => {
    const count = document.querySelectorAll('#kxchat-messages .kxchat-message-operator_ai .kxchat-bubble-text').length;
    return count > prev;
  }, before, { timeout: 30000 });
  return (await assistantLocator.last().innerText()).trim();
};

test.beforeAll(async () => {
  const backendCwd = path.join(__dirname, '..', 'kxchat-server');
  backendProc = spawn('node', ['src/server.js'], {
    cwd: backendCwd,
    env: {
      ...process.env,
      PORT: '8787',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: '',
      CORS_ORIGIN: 'http://127.0.0.1:19365,http://localhost:19365,http://127.0.0.1:5507,http://localhost:5507'
    },
    stdio: 'pipe'
  });

  await waitForHealth();
});

test.afterAll(async () => {
  if (!backendProc) return;
  backendProc.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!backendProc.killed) backendProc.kill('SIGKILL');
});

test('pages + viewports smoke: widget, form and quick replies', async ({ browser, baseURL }) => {
  for (const viewport of VIEWPORTS) {
    for (const route of REQUIRED_PAGES) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await openChatOnPage(page, route, viewport, baseURL);
      await expect(page.locator('#kxchat-contact-submit')).toBeVisible();
      await expect(page.locator('#kxchat-contact-submit')).toHaveText('Отправить');
      for (const option of QUICK_REPLY_TEXTS) {
        await expect(page.locator('.kxchat-quick-reply', { hasText: option })).toBeVisible();
      }
      await context.close();
    }
  }
});

test('contact flow: one confirmation text and quick replies stay visible', async ({ page, baseURL }) => {
  await openChatOnPage(page, '/scam/broker/', VIEWPORTS[0], baseURL);
  await completeContactForm(page);
  await expect(page.locator('#kxchat-messages .kxchat-message-system-info', { hasText: CONTACT_SAVED_TEXT })).toHaveCount(1);
  for (const option of QUICK_REPLY_TEXTS) {
    await expect(page.locator('.kxchat-quick-reply', { hasText: option })).toBeVisible();
  }
});

test('timing: first and second checks plus typing window', async ({ page, baseURL }) => {
  await openChatOnPage(page, '/news/', VIEWPORTS[0], baseURL);
  await completeContactForm(page);

  const sendMessageAndMeasure = async text => {
    await page.fill('#kxchat-textarea', text);
    const sendAt = Date.now();
    await page.keyboard.press('Enter');

    const checks = page.locator('#kxchat-messages .kxchat-message-visitor .kxchat-message-checks').last();
    await expect(checks).toBeVisible();
    await page.waitForFunction(el => el.classList.contains('is-processed'), await checks.elementHandle(), { timeout: 8000 });
    const processedAt = Date.now();

    await page.waitForSelector('.kxchat-typing-indicator', { state: 'visible', timeout: 10000 });
    const typingShownAt = Date.now();
    await page.waitForSelector('.kxchat-typing-indicator', { state: 'hidden', timeout: 20000 });
    const typingHiddenAt = Date.now();

    return {
      checkDelay: processedAt - sendAt,
      typingDelayAfterSecondCheck: typingShownAt - processedAt,
      typingDuration: typingHiddenAt - typingShownAt
    };
  };

  const first = await sendMessageAndMeasure('Нужна консультация');
  expect(first.checkDelay).toBeGreaterThanOrEqual(2800);
  expect(first.checkDelay).toBeLessThanOrEqual(4200);
  expect(first.typingDelayAfterSecondCheck).toBeGreaterThanOrEqual(900);
  expect(first.typingDelayAfterSecondCheck).toBeLessThanOrEqual(2600);
  expect(first.typingDuration).toBeLessThanOrEqual(12100);

  const second = await sendMessageAndMeasure('Хочу описать ситуацию подробнее');
  expect(second.checkDelay).toBeGreaterThanOrEqual(1800);
  expect(second.checkDelay).toBeLessThanOrEqual(3200);
  expect(second.typingDelayAfterSecondCheck).toBeGreaterThanOrEqual(900);
  expect(second.typingDelayAfterSecondCheck).toBeLessThanOrEqual(2600);
  expect(second.typingDuration).toBeLessThanOrEqual(12100);
});

test('page-aware first question by route', async ({ browser, baseURL }) => {
  const matrix = [
    { route: '/scam/broker/', pattern: /деньги уже переводили|общались с платформой/i },
    { route: '/scam/hack/', pattern: /кредит уже оформлен|пришли уведомления/i },
    { route: '/zpp/med-error/', pattern: /товаром,\s*услугой\s*или\s*договором/i },
    { route: '/auto-law/dkp/', pattern: /покупке авто|навязанным услугам|дтп/i },
    { route: '/news/', pattern: /коротко расскажите,\s*что у вас произошло/i }
  ];

  for (const item of matrix) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await openChatOnPage(page, item.route, VIEWPORTS[0], baseURL);
    await completeContactForm(page);
    const reply = await sendAndWaitAssistantReply(page, 'Нужна консультация');
    if (!item.pattern.test(reply)) {
      throw new Error(`${item.route} unexpected reply: ${reply}`);
    }
    await context.close();
  }
});

test('location reply contains address and no technical errors', async ({ page, baseURL }) => {
  await openChatOnPage(page, '/auto-law/dkp/', VIEWPORTS[0], baseURL);
  await completeContactForm(page);
  const reply = await sendAndWaitAssistantReply(page, 'Как к вам подъехать?');
  expect(/адрес/i.test(reply)).toBeTruthy();
  expect(/Невский проспект/i.test(reply)).toBeTruthy();
  expect(/связь нестабильна|ошибка|чат недоступен|попробуйте позже/i.test(reply)).toBeFalsy();
});

test('server-first fallback: network error still shows semantic reply', async ({ page, baseURL }) => {
  await openChatOnPage(page, '/news/', VIEWPORTS[0], baseURL);
  const assistantBefore = await page.locator('#kxchat-messages .kxchat-message-operator_ai .kxchat-bubble-text').count();
  await page.route('**/api/chat/send', route => route.abort('failed'));
  await page.fill('#kxchat-textarea', 'Проверка fallback');
  await page.keyboard.press('Enter');
  await page.waitForFunction(prev => {
    const count = document.querySelectorAll('#kxchat-messages .kxchat-message-operator_ai .kxchat-bubble-text').length;
    return count > prev;
  }, assistantBefore, { timeout: 20000 });
  const lastAssistant = page.locator('#kxchat-messages .kxchat-message-operator_ai .kxchat-bubble-text').last();
  await expect(lastAssistant).toHaveText(CLIENT_NETWORK_FALLBACK_TEXT);
  await expect(lastAssistant).not.toContainText('Связь нестабильна');
  await expect(lastAssistant).not.toContainText('ошибка');
  await expect(lastAssistant).not.toContainText('попробуйте позже');
  await page.unroute('**/api/chat/send');
});

test('objection priority in UI: robot/insult/fear are not replaced by neutral and no duplicate robot reply', async ({ browser, baseURL }) => {
  for (const route of ['/scam/hack/', '/scam/broker/']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await openChatOnPage(page, route, VIEWPORTS[0], baseURL);
    await completeContactForm(page);

    const robot1 = await sendAndWaitAssistantReply(page, 'ты робот?');
    expect(/почему так кажется/i.test(robot1)).toBeTruthy();
    expect(/коротко расскажите, что у вас произошло/i.test(robot1)).toBeFalsy();

    const insult = await sendAndWaitAssistantReply(page, 'опять тупой мозг?');
    expect(/давайте без лишнего|давайте проще|коротко по делу/i.test(insult)).toBeTruthy();
    expect(/коротко расскажите, что у вас произошло/i.test(insult)).toBeFalsy();

    const fear = await sendAndWaitAssistantReply(page, 'вдруг вы обманете');
    expect(/понимаю сомнения/i.test(fear)).toBeTruthy();
    expect(/коротко расскажите, что у вас произошло/i.test(fear)).toBeFalsy();

    const robot2 = await sendAndWaitAssistantReply(page, 'ты робот?');
    expect(robot2.toLowerCase()).not.toBe(robot1.toLowerCase());
    expect(/связь нестабильна|ошибка|чат недоступен|попробуйте позже/i.test(robot2)).toBeFalsy();

    await context.close();
  }
});

test('scam anger entry on broker page is not handled as neutral fallback', async ({ page, baseURL }) => {
  await openChatOnPage(page, '/scam/broker/', VIEWPORTS[0], baseURL);
  await completeContactForm(page);
  const reply = await sendAndWaitAssistantReply(page, 'мошенники пидорасы');
  expect(/деньги уже переводили/i.test(reply)).toBeTruthy();
  expect(/коротко расскажите, что у вас произошло/i.test(reply)).toBeFalsy();
});
