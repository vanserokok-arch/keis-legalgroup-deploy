const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectIntent,
  isNeutralOpeningMessage,
  hasStrongScenarioSignal,
  isCorrectionMessage
} = require('../src/services/chat-intents');

const baseInput = overrides => ({
  current: '',
  normalized_current: '',
  current_topic: null,
  previous_topic: null,
  page_topic: null,
  page_group: 'news',
  context_depth: 0,
  ...overrides
});

test('neutral opening detector catches greetings and generic entries', () => {
  assert.equal(isNeutralOpeningMessage('Добрый день'), true);
  assert.equal(isNeutralOpeningMessage('Нужна консультация'), true);
  assert.equal(isNeutralOpeningMessage('вопрос'), true);
  assert.equal(isNeutralOpeningMessage('брокер'), false);
});

test('strong scenario detector requires explicit scenario cues', () => {
  assert.equal(hasStrongScenarioSignal('брокер не выводит деньги'), true);
  assert.equal(hasStrongScenarioSignal('взлом госуслуг'), true);
  assert.equal(hasStrongScenarioSignal('добрый день'), false);
});

test('correction detector catches explicit correction phrases', () => {
  assert.equal(isCorrectionMessage('я не это сказал'), true);
  assert.equal(isCorrectionMessage('я не говорил что не дают вывести'), true);
  assert.equal(isCorrectionMessage('добрый день'), false);
});

test('neutral opening does not jump into scenario', () => {
  const intent = detectIntent(baseInput({
    current: 'Нужна консультация',
    normalized_current: 'нужна консультация',
    page_topic: 'legal/fraud/unauthorized_credit',
    page_group: 'scam/hack'
  }));
  assert.equal(intent.group, 'neutral');
  assert.equal(intent.type, 'greeting_reply');
  assert.equal(intent.topic, null);
  assert.equal(intent.source, 'explicit');
});

test('page context stays bias: explicit broker overrides hack page', () => {
  const intent = detectIntent(baseInput({
    current: 'брокер',
    normalized_current: 'брокер',
    page_topic: 'legal/fraud/unauthorized_credit',
    page_group: 'scam/hack'
  }));
  assert.equal(intent.group, 'practice-specific');
  assert.equal(intent.type, 'broker');
  assert.equal(intent.topic, 'legal/fraud/broker');
  assert.equal(intent.source, 'explicit');
});

test('correction intent resets topic hypothesis', () => {
  const intent = detectIntent(baseInput({
    current: 'я не говорил что не дают вывести',
    normalized_current: 'я не говорил что не дают вывести',
    current_topic: 'legal/fraud/broker',
    context_depth: 3
  }));
  assert.equal(intent.type, 'correction');
  assert.equal(intent.reset_topic, true);
});

test('neutral broad message on scenario page stays neutral ask_help', () => {
  const intent = detectIntent(baseInput({
    current: 'мошенничество',
    normalized_current: 'мошенничество',
    page_topic: 'legal/fraud/unauthorized_credit',
    page_group: 'scam/hack'
  }));
  assert.equal(intent.group, 'neutral');
  assert.equal(intent.type, 'ask_help');
  assert.equal(intent.topic, 'legal/fraud/unauthorized_credit');
  assert.equal(intent.source, 'page');
});

test('mandatory intent groups are detected', () => {
  const trust = detectIntent(baseInput({
    current: 'без звонка',
    normalized_current: 'без звонка'
  }));
  assert.equal(trust.group, 'trust');

  const scam = detectIntent(baseInput({
    current: 'брокер не выводит деньги',
    normalized_current: 'брокер не выводит деньги'
  }));
  assert.equal(scam.group, 'practice-specific');

  const zpp = detectIntent(baseInput({
    current: 'хочу возврат денег за товар',
    normalized_current: 'хочу возврат денег за товар'
  }));
  assert.equal(zpp.group, 'practice-specific');

  const autoLaw = detectIntent(baseInput({
    current: 'договор купли продажи авто',
    normalized_current: 'договор купли продажи авто'
  }));
  assert.equal(autoLaw.group, 'practice-specific');

  const short = detectIntent(baseInput({
    current: 'да',
    normalized_current: 'да',
    current_topic: 'legal/fraud/unauthorized_credit'
  }));
  assert.equal(short.group, 'short');

  const neutral = detectIntent(baseInput({
    current: 'добрый день',
    normalized_current: 'добрый день'
  }));
  assert.equal(neutral.group, 'neutral');

  const location = detectIntent(baseInput({
    current: 'Как к вам подъехать?',
    normalized_current: 'как к вам подъехать'
  }));
  assert.equal(location.type, 'ask_location');

  const robot = detectIntent(baseInput({
    current: 'вы вообще человек?',
    normalized_current: 'вы вообще человек?'
  }));
  assert.equal(robot.type, 'robot_check');

  const insult = detectIntent(baseInput({
    current: 'опять тупой мозг?',
    normalized_current: 'опять тупой мозг?'
  }));
  assert.equal(insult.type, 'insult_or_irritation');

  const fear = detectIntent(baseInput({
    current: 'вы мошенники?',
    normalized_current: 'вы мошенники?'
  }));
  assert.equal(fear.type, 'fraud_fear');

  const scamAnger = detectIntent(baseInput({
    current: 'мошенники пидорасы',
    normalized_current: 'мошенники пидорасы',
    page_topic: 'legal/fraud/broker',
    page_group: 'scam/broker'
  }));
  assert.equal(scamAnger.type, 'scam_anger');
  assert.equal(scamAnger.topic, 'legal/fraud/broker');
});
