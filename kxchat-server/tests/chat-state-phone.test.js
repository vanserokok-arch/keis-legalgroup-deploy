const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizePhone, buildConversationState } = require('../src/services/chat-state');

test('phone normalization supports 987..., +7..., 8...', () => {
  assert.equal(normalizePhone('9876543210'), '+79876543210');
  assert.equal(normalizePhone('+7 (987) 654-32-10'), '+79876543210');
  assert.equal(normalizePhone('8 987 654 32 10'), '+79876543210');
});

test('phone normalization rejects incomplete number', () => {
  assert.equal(normalizePhone('+7 987 654 32'), null);
  assert.equal(normalizePhone(''), null);
});

test('state model includes required lead/runtime fields', () => {
  const state = buildConversationState([], { name: 'Женя', phone: '8 987 654 32 10' }, '', {
    sessionId: 's1',
    conversationId: 10,
    pageContext: { source_url: 'https://site/scam/hack/' }
  });

  assert.equal(state.meta.session_id, 's1');
  assert.equal(state.meta.conversation_id, 10);
  assert.equal(state.meta.site_key, 'keis-legalgroup');
  assert.equal(state.lead.contact_state, 'complete');
  assert.equal(typeof state.lead.name_confirmation_required, 'boolean');
  assert.equal(state.runtime.fallback_mode_active, false);
  assert.equal(Object.prototype.hasOwnProperty.call(state.dialogue, 'asked_question_keys'), true);
});
