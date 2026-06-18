const test = require('node:test');
const assert = require('node:assert/strict');

const loadEngine = () => {
  process.env.OPENAI_API_KEY = '';
  process.env.OPENAI_MODEL = '';

  const configPath = require.resolve('../src/config');
  const enginePath = require.resolve('../src/services/chat-engine');
  delete require.cache[enginePath];
  delete require.cache[configPath];
  return require('../src/services/chat-engine');
};

const runEngine = async ({ message, history, pageGroup = 'news', sourceUrl = 'https://example.test/' }) => {
  const { getEngineResponse } = loadEngine();
  return getEngineResponse({
    conversationHistory: history,
    visitorMessage: message,
    visitorData: {},
    pageContext: {
      page_group: pageGroup,
      source_url: sourceUrl
    },
    sessionId: 's-test',
    conversationId: 123,
    page: sourceUrl,
    title: 'Test'
  });
};

test('neutral opening on scenario page asks page-aware starter question', async () => {
  const response = await runEngine({
    message: 'Добрый день',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history: [{ role: 'visitor', message: 'Добрый день' }]
  });

  assert.equal(response.ok, true);
  assert.match(response.message, /кредит/i);
  assert.match(response.message, /оформлен|уведомлен/i);
});

test('broad scam message on scam/hack page gives soft clarification', async () => {
  const response = await runEngine({
    message: 'мошенничество',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history: [{ role: 'visitor', message: 'мошенничество' }]
  });

  assert.match(response.message, /кредит/i);
  assert.match(response.message, /оформлен|уведомлен/i);
});

test('explicit broker overrides hack page bias', async () => {
  const response = await runEngine({
    message: 'брокер',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history: [{ role: 'visitor', message: 'брокер' }]
  });

  assert.match(response.message, /деньги уже переводили|общались с платформой/i);
  assert.equal(response.meta.topic, 'legal/fraud/broker');
});

test('correction resets wrong hypothesis and asks fresh question', async () => {
  const history = [
    { role: 'visitor', message: 'брокер' },
    { role: 'operator_ai', message: 'Поняла.\nСкажите, перевод был на карту физлица или через платформу?' },
    { role: 'visitor', message: 'я не говорил что не дают вывести' }
  ];
  const response = await runEngine({
    message: 'я не говорил что не дают вывести',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history
  });

  assert.equal(response.message, 'Поняла. Тогда уточните, что именно произошло?');
  assert.equal(response.meta.topic, null);
});

test('trust responses: robot, fear, no_call', async () => {
  const robot = await runEngine({
    message: 'ты робот',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'ты робот' }]
  });
  assert.equal(robot.message, 'Понимаю, почему так кажется.\nДавайте по делу — что именно случилось?');

  const fear = await runEngine({
    message: 'вдруг вы обманете',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'вдруг вы обманете' }]
  });
  assert.equal(fear.message, 'Понимаю сомнения.\nСначала просто разберём ситуацию и честно скажем, есть ли смысл дальше что-то делать.');

  const noCall = await runEngine({
    message: 'без звонка',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'без звонка' }]
  });
  assert.equal(noCall.message, 'Хорошо, можем без звонка и продолжить здесь.');
});

test('objection intents: robot and insult are not replaced by neutral fallback', async () => {
  const robot = await runEngine({
    message: 'ты робот?',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history: [{ role: 'visitor', message: 'ты робот?' }]
  });
  assert.equal(robot.message, 'Понимаю, почему так кажется.\nДавайте по делу — что именно случилось?');
  assert.equal(robot.meta.fallback_mode_active, false);
  assert.equal(/коротко расскажите/i.test(robot.message), false);

  const robot2 = await runEngine({
    message: 'вы бот?',
    pageGroup: 'scam/broker',
    sourceUrl: 'https://keis.test/scam/broker/',
    history: [{ role: 'visitor', message: 'вы бот?' }]
  });
  assert.equal(/почему так кажется|давайте просто по ситуации|давайте без лишнего/i.test(robot2.message), true);
  assert.equal(robot2.meta.fallback_mode_active, false);

  const insult = await runEngine({
    message: 'опять тупой мозг?',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'опять тупой мозг?' }]
  });
  assert.equal(insult.message, 'Поняла вас. Давайте без лишнего — что именно у вас произошло?');
  assert.equal(insult.meta.fallback_mode_active, false);
  assert.equal(/коротко расскажите/i.test(insult.message), false);
});

test('fear objections keep trust reply and do not fall back to neutral', async () => {
  const fear1 = await runEngine({
    message: 'вы мошенники?',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'вы мошенники?' }]
  });
  assert.equal(fear1.message, 'Понимаю сомнения.\nСначала просто разберём ситуацию и честно скажем, есть ли смысл дальше что-то делать.');
  assert.equal(fear1.meta.fallback_mode_active, false);

  const fear2 = await runEngine({
    message: 'вдруг вы обманете',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'вдруг вы обманете' }]
  });
  assert.equal(fear2.message, 'Понимаю сомнения.\nСначала просто разберём ситуацию и честно скажем, есть ли смысл дальше что-то делать.');
  assert.equal(fear2.meta.fallback_mode_active, false);
});

test('scam anger entry on broker page returns broker follow-up, not neutral fallback', async () => {
  const response = await runEngine({
    message: 'мошенники пидорасы',
    pageGroup: 'scam/broker',
    sourceUrl: 'https://keis.test/scam/broker/',
    history: [{ role: 'visitor', message: 'мошенники пидорасы' }]
  });

  assert.equal(response.meta.intent, 'scam_anger');
  assert.equal(/деньги уже переводили/i.test(response.message), true);
  assert.equal(/коротко расскажите/i.test(response.message), false);
  assert.equal(response.meta.fallback_mode_active, false);
});

test('repeated objection does not return same robot reply twice', async () => {
  const history = [
    { role: 'visitor', message: 'ты робот?' },
    { role: 'operator_ai', message: 'Понимаю, почему так кажется.\nДавайте по делу — что именно случилось?' },
    { role: 'visitor', message: 'ты робот?' }
  ];

  const response = await runEngine({
    message: 'ты робот?',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history
  });

  assert.notEqual(response.message, 'Понимаю, почему так кажется.\nДавайте по делу — что именно случилось?');
  assert.equal(/давайте просто по ситуации|давайте без лишнего/i.test(response.message), true);
});

test('location request returns address and marks location step', async () => {
  const response = await runEngine({
    message: 'Как к вам подъехать?',
    pageGroup: 'news',
    sourceUrl: 'https://keis.test/news/',
    history: [{ role: 'visitor', message: 'Как к вам подъехать?' }]
  });

  assert.match(response.message, /адрес/i);
  assert.match(response.message, /Невский проспект/i);
  assert.equal(response.meta.shouldOfferLocation, true);
  assert.equal(response.meta.nextStep, 'share_location');
});

test('phone is requested after scenario details when no phone in state', async () => {
  const response = await runEngine({
    message: 'Меня взломали, уже списали деньги и звонили из банка',
    pageGroup: 'scam/hack',
    sourceUrl: 'https://keis.test/scam/hack/',
    history: [
      { role: 'visitor', message: 'Нужна консультация' },
      { role: 'operator_ai', message: 'Поняла. Скажите, кредит уже оформлен или пока только пришли уведомления?' },
      { role: 'visitor', message: 'Меня взломали, уже списали деньги и звонили из банка' }
    ]
  });

  assert.match(response.message, /оставьте,\s*пожалуйста,\s*номер/i);
  assert.equal(response.meta.shouldAskPhone, true);
  assert.equal(response.meta.nextStep, 'ask_phone');
});
