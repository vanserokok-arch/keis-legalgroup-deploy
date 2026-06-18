const test = require('node:test');
const assert = require('node:assert/strict');

const { TEXTS, planReply, sanitizeReplyText } = require('../src/services/chat-replies');

const baseState = () => ({
  meta: {
    current_topic: null,
    previous_topic: null,
    context_depth: 2
  },
  lead: {
    name_confirmation_required: false,
    name_confirmation_asked: false,
    name_raw: null
  },
  dialogue: {
    asked_question_keys: [],
    answered_fact_map: {
      transfer_to_card: false,
      messenger_channel: false,
      has_docs: false,
      no_docs: false,
      bank_contact: false,
      police_contact: false
    },
    value_shown: false,
    call_declined: false,
    call_declined_messages_since: 999
  }
});

const baseInput = overrides => ({
  page_group: 'news',
  page_topic: null,
  ...overrides
});

test('mandatory trust texts are returned exactly', () => {
  const state = baseState();
  const input = baseInput();

  assert.equal(planReply({ intent: { type: 'robot_check' }, state, input }).text, TEXTS.robot);
  assert.equal(planReply({ intent: { type: 'fraud_fear' }, state, input }).text, TEXTS.fear);
  assert.equal(planReply({ intent: { type: 'no_call' }, state, input }).text, TEXTS.no_call);
  assert.equal(planReply({ intent: { type: 'can_help' }, state, input }).text, TEXTS.can_help);
});

test('neutral greeting reply is used for neutral opening', () => {
  const reply = planReply({
    intent: { type: 'greeting_reply', source: 'explicit' },
    state: baseState(),
    input: baseInput()
  });
  assert.equal(reply.text, TEXTS.neutral_opening);
  assert.equal(reply.question_key, 'core_incident');
});

test('page-aware ask_help uses operator opening question', () => {
  const reply = planReply({
    intent: { type: 'ask_help', source: 'page', topic: 'legal/fraud/unauthorized_credit' },
    state: baseState(),
    input: baseInput({ page_group: 'scam/hack', page_topic: 'legal/fraud/unauthorized_credit' })
  });
  assert.match(reply.text, /кредит/i);
  assert.match(reply.text, /оформлен|уведомлен/i);
});

test('correction reply resets topic in state patch', () => {
  const state = baseState();
  state.meta.current_topic = 'legal/fraud/broker';

  const reply = planReply({
    intent: { type: 'correction', source: 'explicit' },
    state,
    input: baseInput()
  });

  assert.equal(reply.text, TEXTS.correction_ack);
  assert.equal(reply.question_key, 'core_incident');
  assert.deepEqual(reply.state_patch, {
    meta: {
      previous_topic: 'legal/fraud/broker',
      current_topic: null
    }
  });
});

test('sanitize strips banned style and extra questions', () => {
  const sanitized = sanitizeReplyText('В таких ситуациях важно.\nПоняла?\nЧто произошло?\nИ когда?');
  assert.equal(/в таких ситуациях важно/i.test(sanitized), false);
  assert.equal((sanitized.match(/\?/g) || []).length <= 1, true);
});
