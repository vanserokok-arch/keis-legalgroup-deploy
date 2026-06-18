'use strict';

const { TEXTS, getOperatorOpeningQuestion, planReply } = require('./chat-replies');

const asReply = (text, options = {}) => ({
  text: String(text || '').trim(),
  question_key: options.question_key || null,
  scope: options.scope || 'fallback',
  state_patch: options.state_patch || null
});

const chooseTopic = ({ intent, state, input }) => {
  if (intent && intent.topic) return intent.topic;
  if (state && state.meta && state.meta.current_topic) return state.meta.current_topic;
  if (input && input.page_topic) return input.page_topic;
  return null;
};

const wasQuestionAskedRecently = (state, key) => {
  const asked = state && state.dialogue && Array.isArray(state.dialogue.asked_question_keys)
    ? state.dialogue.asked_question_keys
    : [];
  const last = state && state.dialogue ? state.dialogue.last_assistant_question_key : null;
  if (last === key) return true;
  if (!asked.length) return false;
  return asked.slice(-2).includes(key);
};

const fallbackQuestionByTopic = ({ topic, state, pageGroup }) => {
  const picked = getOperatorOpeningQuestion({ topic, pageGroup });
  if (!wasQuestionAskedRecently(state, picked.key)) return picked;
  return { key: 'core_incident', text: 'Поняла. Скажите, что именно произошло дальше?' };
};

const planFallbackReply = ({ state, input, intent }) => {
  const type = intent && intent.type ? intent.type : 'unclear';

  if (type === 'correction' || type === 'topic_switch') {
    return asReply(TEXTS.correction_ack, { question_key: 'core_incident', scope: 'fb-correction' });
  }
  if (type === 'robot_check') {
    return asReply(TEXTS.robot, { question_key: 'core_incident', scope: 'fb-robot' });
  }
  if (type === 'fraud_fear') {
    return asReply(TEXTS.fear, { scope: 'fb-fear' });
  }
  if (type === 'insult_or_irritation') {
    return asReply(TEXTS.irritation || 'Поняла вас. Давайте без лишнего — что именно у вас произошло?', {
      question_key: 'core_incident',
      scope: 'fb-irritation'
    });
  }
  if (type === 'scam_anger' || type === 'fraud_report' || type === 'emotional_fraud_entry') {
    const topic = chooseTopic({ intent, state, input });
    const followup = getOperatorOpeningQuestion({ topic, pageGroup: input ? input.page_group : null });
    return asReply(followup.text, {
      question_key: followup.key,
      scope: `fb-scam-entry:${topic || (input ? input.page_group : 'generic') || 'generic'}`
    });
  }
  if (type === 'can_help') {
    return asReply(TEXTS.can_help, { question_key: 'core_incident', scope: 'fb-can-help' });
  }
  if (type === 'no_call') {
    return asReply(TEXTS.no_call, {
      scope: 'fb-no-call',
      state_patch: { dialogue: { call_declined: true, call_declined_messages_since: 0 } }
    });
  }
  if (type === 'ask_location') {
    const locationReply = planReply({ intent: { type: 'ask_location' }, state, input });
    return asReply(locationReply.text, {
      question_key: locationReply.question_key || 'location_origin',
      scope: 'fb-location'
    });
  }
  if (type === 'greeting_reply') {
    return asReply(TEXTS.neutral_opening, { question_key: 'core_incident', scope: 'fb-neutral-opening' });
  }

  const topic = chooseTopic({ intent, state, input });
  if (topic || (input && input.page_group)) {
    const followup = fallbackQuestionByTopic({
      topic,
      state,
      pageGroup: input ? input.page_group : null
    });
    return asReply(followup.text, {
      question_key: followup.key,
      scope: `fb-topic:${topic || input.page_group || 'generic'}`
    });
  }

  return asReply(TEXTS.fallback, { question_key: 'core_incident', scope: 'fb-generic' });
};

module.exports = {
  planFallbackReply
};
