const test = require('node:test');
const assert = require('node:assert/strict');

const { planFallbackReply } = require('../src/services/chat-fallback');

const baseState = () => ({
  meta: {
    current_topic: null
  },
  dialogue: {
    asked_question_keys: [],
    last_assistant_question_key: null,
    answered_fact_map: {
      transfer_to_card: false,
      messenger_channel: false,
      has_docs: false,
      no_docs: false,
      bank_contact: false,
      police_contact: false
    }
  }
});

test('fallback keeps topic flow and does not reset conversation', () => {
  const state = baseState();
  state.meta.current_topic = 'legal/fraud/broker';

  const reply = planFallbackReply({
    state,
    input: { page_group: 'scam/hack', page_topic: 'legal/fraud/unauthorized_credit' },
    intent: { type: 'ask_help', topic: null, source: 'recent' }
  });

  assert.match(reply.scope, /^fb-topic:/);
  assert.equal(reply.question_key !== null, true);
  assert.equal(/по какому вопросу нужна помощь/i.test(reply.text), false);
});

test('fallback uses page soft prompt when topic unknown', () => {
  const reply = planFallbackReply({
    state: baseState(),
    input: { page_group: 'scam/hack', page_topic: 'legal/fraud/unauthorized_credit' },
    intent: { type: 'unclear', source: 'page' }
  });

  assert.match(reply.text, /переписка|взлом|кредит/i);
});

test('fallback respects trust/no-call intents', () => {
  const noCall = planFallbackReply({
    state: baseState(),
    input: { page_group: 'news', page_topic: null },
    intent: { type: 'no_call', source: 'explicit' }
  });
  assert.equal(noCall.text, 'Хорошо, можем без звонка и продолжить здесь.');

  const robot = planFallbackReply({
    state: baseState(),
    input: { page_group: 'news', page_topic: null },
    intent: { type: 'robot_check', source: 'explicit' }
  });
  assert.match(robot.text, /почему так кажется/i);
});

test('fallback serves location response without technical text', () => {
  const location = planFallbackReply({
    state: baseState(),
    input: { page_group: 'news', page_topic: null },
    intent: { type: 'ask_location', source: 'explicit' }
  });
  assert.match(location.text, /адрес/i);
  assert.equal(/недоступ|ошибк|попробуйте/i.test(location.text), false);
});
