'use strict';

const { OPENAI_API_KEY, OPENAI_MODEL } = require('../config');
const { error: logError } = require('../utils/logger');
const { buildConversationState, buildIntentInput, normalizeText } = require('./chat-state');
const { detectIntent } = require('./chat-intents');
const { planReply, sanitizeReplyText, getIntentAlternatives, TEXTS } = require('./chat-replies');
const { planFallbackReply } = require('./chat-fallback');
const { getPhrasePack } = require('./phrase-pack-loader');

const isOpenAIConfigured = () => Boolean((OPENAI_API_KEY || '').trim() && (OPENAI_MODEL || '').trim());

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

const getLastAssistantMessage = conversationHistory => {
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const row = history[i];
    if (!row || !row.role) continue;
    if (row.role !== 'operator_ai' && row.role !== 'operator' && row.role !== 'system') continue;
    return String(row.message || '').trim();
  }
  return '';
};

const responseWouldDuplicateLastAssistant = (conversationHistory, candidateText) => {
  const candidate = normalizeText(candidateText);
  if (!candidate) return false;
  const last = normalizeText(getLastAssistantMessage(conversationHistory));
  if (!last) return false;
  return last === candidate;
};

const responseWasUsedRecently = (conversationHistory, candidateText, limit = 8) => {
  const candidate = normalizeText(candidateText);
  if (!candidate) return false;
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  let checked = 0;
  for (let i = history.length - 1; i >= 0 && checked < limit; i -= 1) {
    const row = history[i];
    if (!row || !row.role) continue;
    if (row.role !== 'operator_ai' && row.role !== 'operator' && row.role !== 'system') continue;
    checked += 1;
    if (normalizeText(row.message || '') === candidate) return true;
  }
  return false;
};

const applyStatePatch = (state, patch) => {
  if (!patch || typeof patch !== 'object') return;
  Object.keys(patch).forEach(scope => {
    if (!state[scope] || typeof state[scope] !== 'object') return;
    Object.assign(state[scope], patch[scope]);
  });
};

const applyQuestionTracking = (state, reply) => {
  if (!reply || !reply.question_key) return;
  state.dialogue.last_assistant_question_key = reply.question_key;
  if (!Array.isArray(state.dialogue.asked_question_keys)) state.dialogue.asked_question_keys = [];
  if (!state.dialogue.asked_question_keys.includes(reply.question_key)) {
    state.dialogue.asked_question_keys.push(reply.question_key);
  }
};

const phrasePack = getPhrasePack();

const shouldAskPhone = ({ state, intent, input }) => {
  if (!state || !state.lead) return false;
  if (state.lead.phone_normalized) return false;
  const type = intent && intent.type ? intent.type : 'unclear';
  if (['ask_location', 'robot_check', 'fraud_fear', 'no_call', 'postpone', 'greeting_reply', 'correction', 'topic_switch'].includes(type)) return false;
  if (Number(state.meta && state.meta.context_depth ? state.meta.context_depth : 0) < 2) return false;

  const current = String(input && input.current ? input.current : '').trim();
  if (!current || current.length < 8) return false;
  if (/^\+?\d[\d\s\-()]{8,}$/.test(current)) return false;
  return true;
};

const inferNextStep = ({ intent, shouldAskPhoneFlag, shouldOfferLocationFlag, hasPhone }) => {
  if (shouldOfferLocationFlag) return 'share_location';
  if (shouldAskPhoneFlag) return 'ask_phone';
  if (hasPhone) return 'handoff';
  const type = intent && intent.type ? intent.type : 'unclear';
  if (['correction', 'topic_switch'].includes(type)) return 'clarify_topic';
  return 'clarify_case';
};

const buildModelMessages = ({ conversationHistory, visitorMessage, state, intent, draftReply }) => {
  const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [];
  const pageContext = state && state.meta ? state.meta.page_context : {};
  const pageGroup = pageContext ? pageContext.page_group : 'news';
  const domain = pageContext ? pageContext.domain_area : 'general';
  const practice = pageContext ? pageContext.practice_area : 'general';
  const issue = pageContext ? pageContext.issue_type : 'general';

  const messages = [
    {
      role: 'system',
      content: `Ты первичный оператор юридической компании. Пиши коротко и по делу.
Ограничения:
- максимум 2-3 коротких предложения;
- максимум 1 вопрос;
- сначала понимание, потом вопрос;
- нельзя использовать канцелярит и фразы: "в таких ситуациях важно", "для более точной консультации", "необходимо зафиксировать".
Контекст:
- site_key: ${(state && state.meta && state.meta.site_key) || 'unknown'}
- page_group: ${pageGroup}
- domain_area: ${domain}
- practice_area: ${practice}
- issue_type: ${issue}
- current_topic: ${(state && state.meta && state.meta.current_topic) || 'none'}
- intent: ${intent.type}
Черновик ответа: ${draftReply}`
    }
  ];

  history.forEach(row => {
    const text = String(row && row.message ? row.message : '').trim();
    if (!text) return;
    if (row.role === 'visitor') {
      messages.push({ role: 'user', content: text });
      return;
    }
    if (row.role === 'operator_ai' || row.role === 'operator' || row.role === 'system') {
      messages.push({ role: 'assistant', content: text });
    }
  });

  messages.push({ role: 'user', content: String(visitorMessage || '').trim() });
  return messages;
};

const shouldUseModel = intent => {
  if (!isOpenAIConfigured()) return false;
  // Model is optional wording overlay, not a branching planner.
  return intent.type === 'ask_help' || intent.type === 'unclear';
};

const maybeGenerateModelReply = async ({ conversationHistory, visitorMessage, state, intent, draftReply }) => {
  if (!shouldUseModel(intent)) return null;

  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.25,
        max_tokens: 180,
        top_p: 0.9,
        messages: buildModelMessages({ conversationHistory, visitorMessage, state, intent, draftReply })
      })
    }, 12000);

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const payload = await response.json();
    const text = payload && payload.choices && payload.choices[0] && payload.choices[0].message
      ? String(payload.choices[0].message.content || '').trim()
      : '';
    return sanitizeReplyText(text);
  } catch (error) {
    logError(`KXCHAT model call failed: ${error.message}`);
    return null;
  }
};

const chooseReply = ({ conversationHistory, planned, fallback, allowFallback }) => {
  const plannedText = sanitizeReplyText(planned && planned.text ? planned.text : '');
  const fallbackText = sanitizeReplyText(fallback && fallback.text ? fallback.text : '');

  if (plannedText && !responseWouldDuplicateLastAssistant(conversationHistory, plannedText)) {
    return { ...planned, text: plannedText, from: 'planned' };
  }
  if (allowFallback && fallbackText && !responseWouldDuplicateLastAssistant(conversationHistory, fallbackText)) {
    return { ...fallback, text: fallbackText, from: 'fallback' };
  }
  if (allowFallback && fallbackText) return { ...fallback, text: fallbackText, from: 'fallback' };
  if (plannedText) return { ...planned, text: plannedText, from: 'planned' };
  return {
    text: TEXTS.fallback,
    question_key: 'core_incident',
    scope: 'fallback-empty',
    from: 'fallback'
  };
};

const intentAllowsFallback = intentType => {
  return intentType === 'unknown' || intentType === 'unclear';
};

const applyAlternativeIfDuplicate = ({ conversationHistory, replyText, intentType }) => {
  const normalized = sanitizeReplyText(replyText);
  if (!responseWasUsedRecently(conversationHistory, normalized, 8)) return normalized;

  const alternatives = getIntentAlternatives(intentType)
    .map(item => sanitizeReplyText(item))
    .filter(Boolean);
  for (const option of alternatives) {
    if (!responseWasUsedRecently(conversationHistory, option, 8)) return option;
  }
  return normalized;
};

const getEngineResponse = async ({
  conversationHistory,
  visitorMessage,
  visitorData,
  pageContext,
  sessionId,
  conversationId,
  page,
  title
}) => {
  const state = buildConversationState(conversationHistory, visitorData, visitorMessage, {
    sessionId,
    conversationId,
    pageContext,
    page,
    title
  });

  const input = buildIntentInput(visitorMessage, state);
  const intent = detectIntent(input, state);
  state.dialogue.last_user_intent = intent.type;

  if (intent.reset_topic) {
    state.meta.previous_topic = state.meta.current_topic || null;
    state.meta.current_topic = null;
  } else if (intent.topic && intent.topic !== state.meta.current_topic) {
    state.meta.previous_topic = state.meta.current_topic || null;
    state.meta.current_topic = intent.topic;
  }

  const planned = planReply({ intent, state, input });
  applyStatePatch(state, planned.state_patch);
  applyQuestionTracking(state, planned);

  const fallback = planFallbackReply({ state, input, intent });
  const allowFallback = intentAllowsFallback(intent.type);
  let selected = chooseReply({ conversationHistory, planned, fallback, allowFallback });

  const modelReply = await maybeGenerateModelReply({
    conversationHistory,
    visitorMessage,
    state,
    intent,
    draftReply: selected.text
  });

  if (modelReply && !responseWouldDuplicateLastAssistant(conversationHistory, modelReply)) {
    selected = {
      ...selected,
      text: modelReply,
      from: 'model'
    };
  }

  if (selected.from === 'fallback') {
    state.runtime.fallback_mode_active = true;
  }

  const shouldOfferLocationFlag = intent.type === 'ask_location';
  const shouldAskPhoneFlag = shouldAskPhone({ state, intent, input });
  if (shouldAskPhoneFlag) {
    const phonePrompt = String(phrasePack.phone_request || 'Поняла. Оставьте, пожалуйста, номер, и юрист свяжется с вами в ближайшее время.').trim();
    selected = {
      ...selected,
      text: phonePrompt,
      scope: 'ask-phone'
    };
  }

  const hasPhone = Boolean(state.lead && state.lead.phone_normalized);
  const nextStep = inferNextStep({
    intent,
    shouldAskPhoneFlag,
    shouldOfferLocationFlag,
    hasPhone
  });

  selected.text = applyAlternativeIfDuplicate({
    conversationHistory,
    replyText: selected.text,
    intentType: intent.type
  });

  return {
    ok: true,
    role: 'operator_ai',
    message: sanitizeReplyText(selected.text),
    meta: {
      intent: intent.type,
      topic: state.meta.current_topic || null,
      source: intent.source || 'fallback',
      nextStep,
      shouldAskPhone: shouldAskPhoneFlag,
      shouldOfferLocation: shouldOfferLocationFlag,
      fallback_mode_active: state.runtime.fallback_mode_active
    }
  };
};

module.exports = {
  getEngineResponse,
  isOpenAIConfigured
};
