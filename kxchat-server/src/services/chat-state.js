'use strict';

const { getPhrasePack } = require('./phrase-pack-loader');
const { getSiteConfig } = require('./site-config-loader');
const { resolvePageContext } = require('./page-context-resolver');
const { getAllPracticePacks, getPracticePackByPageGroup, getPracticePackByTopic } = require('./practice-pack-loader');

const phrasePack = getPhrasePack();

const GREETING_TEXT = phrasePack.greeting;
const CONTACT_SAVED_TEXT = phrasePack.contact_saved;
const CONTACT_IDLE_TEXT = phrasePack.idle_after_contact;
const REOPEN_TEXT = phrasePack.reopen;

const NO_CALL_RE = /(не\s*хочу\s*звон|без\s*звонк|не\s*звоните|только\s*в\s*чате|неудобно\s*говорить|не\s*могу\s*говорить)/i;
const YES_RE = /^(да|ага|угу|ок|верно|правильно|именно|подтверждаю)$/i;

const NAME_ALIASES = {
  саня: 'Александр',
  саша: 'Александр',
  лёша: 'Алексей',
  леша: 'Алексей',
  дима: 'Дмитрий',
  миша: 'Михаил',
  женя: 'Евгений'
};

const FACT_PATTERNS = {
  transfer_to_card: /(на\s+карту|карта\s+физлица|карту\s+физлица|p2p|перевел[аи]?|перев[её]л)/i,
  messenger_channel: /(телеграм|telegram|в\s*тг|whatsapp|ватсап|viber|мессенджер|переписк)/i,
  has_docs: /(есть\s+документ|чек\s+есть|скрин|квитанц|договор\s+есть|сохранил|сохранились)/i,
  no_docs: /(нет\s+документ|нет\s+чек|ничего\s+не\s+сохранил|ничего\s+нет)/i,
  bank_contact: /(банк.*обращ|банк.*сообщ|чарджбэк|chargeback)/i,
  police_contact: /(полици|заявлени|талон-уведомлен)/i
};

const QUESTION_KEY_PATTERNS = [
  { key: 'core_incident', re: /(что\s+именно\s+случ|что\s+произошло|коротко\s+расскажите|коротко\s+опишите|опишите\s+ситуацию)/i },
  { key: 'operator_opening', re: /(деньги\s+уже\s+переводили|кредит\s+уже\s+оформлен|связано\s+с\s+товаром|вопрос\s+по\s+дкп|по\s+покупке\s+авто)/i },
  { key: 'location_origin', re: /(откуда\s+вам\s+удобнее\s+ехать|как\s+вам\s+удобнее\s+доехать)/i },
  { key: 'phone_request', re: /(оставьте,\s*пожалуйста,\s*номер|напишите,\s*пожалуйста,\s*номер|свяжется\s+с\s+вами)/i },
  { key: 'transfer_route', re: /(на\s+карту.*или.*через\s+платформ|перевод.*на\s+карту|через\s+платформ)/i },
  { key: 'messenger_contact', re: /(переписк|мессенджер|телеграм|whatsapp|ватсап|viber)/i },
  { key: 'docs_presence', re: /(документ|чек|скрин|квитанц|договор.*сохран|сохранил)/i },
  { key: 'bank_contact', re: /(банк.*обращ|банк.*сообщ|чарджбэк|chargeback)/i },
  { key: 'police_contact', re: /(полици|заявлени|талон-уведомлен)/i },
  { key: 'name_confirmation', re: /(как\s+к\s+вам\s+правильно|правильно\s+понимаю)/i }
];

const normalizeText = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const safeText = (value, max = 256) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
};

const normalizeNameToken = value => String(value || '').trim().toLowerCase().replace(/[^a-zа-яё-]/gi, '');

const getSuggestedFormalName = rawName => {
  const firstToken = normalizeNameToken(String(rawName || '').split(/\s+/)[0] || '');
  return NAME_ALIASES[firstToken] || null;
};

const isAmbiguousName = rawName => {
  const value = String(rawName || '').trim();
  if (!value) return false;
  const token = normalizeNameToken(value.split(/\s+/)[0] || '');
  if (token.length <= 3) return true;
  return !!NAME_ALIASES[token];
};

const normalizePhone = raw => {
  const onlyDigits = String(raw || '').replace(/\D/g, '');
  if (!onlyDigits) return null;

  let digits = onlyDigits;
  if (digits.length >= 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    digits = digits.slice(1);
  }
  if (digits.length < 10) return null;
  if (digits.length > 10) digits = digits.slice(-10);
  return `+7${digits}`;
};

const detectAssistantQuestionKey = text => {
  const value = String(text || '');
  const found = QUESTION_KEY_PATTERNS.find(item => item.re.test(value));
  return found ? found.key : null;
};

const collectAskedQuestionKeys = assistantTexts => {
  const keys = [];
  assistantTexts.forEach(text => {
    const key = detectAssistantQuestionKey(text);
    if (key && !keys.includes(key)) keys.push(key);
  });
  return keys;
};

const collectAnsweredFacts = visitorTexts => {
  const map = {
    transfer_to_card: false,
    messenger_channel: false,
    has_docs: false,
    no_docs: false,
    bank_contact: false,
    police_contact: false
  };

  visitorTexts.forEach(text => {
    Object.keys(map).forEach(key => {
      if (FACT_PATTERNS[key].test(text)) map[key] = true;
    });
  });
  return map;
};

const messageLooksLikeNameConfirmation = (text, rawName) => {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (YES_RE.test(normalized)) return true;
  if (/^меня\s+зовут\s+[a-zа-яё-]+$/i.test(normalized)) return true;

  const rawToken = normalizeNameToken(rawName);
  const formalToken = normalizeNameToken(getSuggestedFormalName(rawName) || '');
  if (rawToken && normalized.includes(rawToken)) return true;
  if (formalToken && normalized.includes(formalToken)) return true;
  return false;
};

const inferTopicFromText = text => {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return null;
  const packs = getAllPracticePacks();

  let bestTopic = null;
  let bestScore = 0;
  packs.forEach(pack => {
    let score = 0;
    const patterns = pack && pack.intent_patterns && typeof pack.intent_patterns === 'object'
      ? pack.intent_patterns
      : {};
    Object.values(patterns).forEach(patternList => {
      (Array.isArray(patternList) ? patternList : []).forEach(pattern => {
        try {
          if (new RegExp(pattern, 'i').test(value)) score += 1;
        } catch (_) {
          // ignore invalid pattern
        }
      });
    });
    (Array.isArray(pack.summary_keywords) ? pack.summary_keywords : []).forEach(keyword => {
      const token = String(keyword || '').trim().toLowerCase();
      if (token && value.includes(token)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestTopic = pack.topic_key;
    }
  });

  return bestScore > 0 ? bestTopic : null;
};

const topicFromPageGroup = pageGroup => {
  const pack = getPracticePackByPageGroup(pageGroup);
  return pack ? pack.topic_key : null;
};

const buildContactState = visitorData => {
  const nameRaw = safeText(visitorData && visitorData.name, 80);
  const phoneNormalized = normalizePhone(visitorData && visitorData.phone);
  if (nameRaw && phoneNormalized) return { contact_state: 'complete', name_raw: nameRaw, phone_normalized: phoneNormalized };
  if (nameRaw) return { contact_state: 'name_only', name_raw: nameRaw, phone_normalized: null };
  if (phoneNormalized) return { contact_state: 'phone_only', name_raw: null, phone_normalized: phoneNormalized };
  return { contact_state: 'none', name_raw: null, phone_normalized: null };
};

const buildPageContext = (rawContext = {}, fallbackPage = null, fallbackTitle = null) => {
  return resolvePageContext({
    rawContext,
    page: fallbackPage,
    title: fallbackTitle,
    siteKey: rawContext && rawContext.site_key
  });
};

const buildConversationState = (conversationHistory, visitorData = {}, visitorMessage = '', options = {}) => {
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  const pageContext = buildPageContext(options.pageContext || {}, options.page || null, options.title || null);
  const siteConfig = getSiteConfig(pageContext.site_key);

  const visitorTexts = history
    .filter(row => row && row.role === 'visitor')
    .map(row => String(row.message || '').trim())
    .filter(Boolean);

  const assistantTexts = history
    .filter(row => row && (row.role === 'operator_ai' || row.role === 'system' || row.role === 'operator'))
    .map(row => String(row.message || '').trim())
    .filter(Boolean);

  const currentUserMessage = String(visitorMessage || '').trim();
  const contact = buildContactState(visitorData);
  const askedQuestionKeys = collectAskedQuestionKeys(assistantTexts);
  const answeredFactMap = collectAnsweredFacts(visitorTexts);

  const topicTrail = visitorTexts.map(text => inferTopicFromText(text)).filter(Boolean);
  const currentTopic = topicTrail.length ? topicTrail[topicTrail.length - 1] : (pageContext.topic_key || null);
  let previousTopic = null;
  for (let i = topicTrail.length - 2; i >= 0; i -= 1) {
    if (topicTrail[i] && topicTrail[i] !== currentTopic) {
      previousTopic = topicTrail[i];
      break;
    }
  }

  let nameConfirmationAsked = false;
  let nameConfirmed = !contact.name_raw || !isAmbiguousName(contact.name_raw);
  let lastNamePromptIndex = -1;
  history.forEach((row, index) => {
    if (!row || !row.role) return;
    const text = String(row.message || '').trim();
    if (!text) return;

    if ((row.role === 'operator_ai' || row.role === 'system' || row.role === 'operator')
      && detectAssistantQuestionKey(text) === 'name_confirmation') {
      nameConfirmationAsked = true;
      lastNamePromptIndex = index;
      return;
    }

    if (row.role === 'visitor' && lastNamePromptIndex >= 0 && index > lastNamePromptIndex) {
      if (messageLooksLikeNameConfirmation(text, contact.name_raw || '')) {
        nameConfirmed = true;
      }
    }
  });

  let callDeclinedIndex = -1;
  visitorTexts.forEach((text, index) => {
    if (NO_CALL_RE.test(text)) callDeclinedIndex = index;
  });

  const contextDepth = visitorTexts.length;
  const leadPolicy = siteConfig && siteConfig.lead_policy ? siteConfig.lead_policy : {};
  const shouldConfirmName = leadPolicy.confirm_ambiguous_name !== false;

  return {
    meta: {
      session_id: safeText(options.sessionId, 96) || null,
      conversation_id: options.conversationId || null,
      site_key: pageContext.site_key || (siteConfig && siteConfig.site_key) || null,
      page_context: pageContext,
      current_topic: currentTopic,
      previous_topic: previousTopic,
      context_depth: contextDepth
    },
    lead: {
      contact_state: contact.contact_state,
      name_raw: contact.name_raw,
      name_confirmed: !!nameConfirmed,
      name_confirmation_required: !!(shouldConfirmName && contact.name_raw && isAmbiguousName(contact.name_raw) && !nameConfirmed),
      name_confirmation_asked: !!nameConfirmationAsked,
      phone_normalized: contact.phone_normalized
    },
    dialogue: {
      greeted: assistantTexts.some(text => normalizeText(text).includes('меня зовут')),
      last_user_intent: null,
      last_assistant_question_key: askedQuestionKeys.length ? askedQuestionKeys[askedQuestionKeys.length - 1] : null,
      asked_question_keys: askedQuestionKeys,
      answered_fact_map: answeredFactMap,
      value_shown: assistantTexts.some(text => /(разбер[её]м|по\s+шагам|предметно)/i.test(text)),
      call_offered: assistantTexts.some(text => /(созвон|позвон|когда\s+вам\s+удобно)/i.test(text)),
      call_declined: callDeclinedIndex >= 0,
      call_declined_messages_since: callDeclinedIndex >= 0 ? Math.max(0, contextDepth - 1 - callDeclinedIndex) : 999
    },
    runtime: {
      fallback_mode_active: false,
      contact_idle_prompt_sent: assistantTexts.some(text => normalizeText(text) === normalizeText(CONTACT_IDLE_TEXT)),
      reopen_cycle_id: null,
      reopen_shown_after_close: assistantTexts.some(text => normalizeText(text) === normalizeText(REOPEN_TEXT)),
      typing_active: false
    },
    raw: {
      current_user_message: currentUserMessage,
      recent_visitor_messages: visitorTexts.slice(-6),
      recent_assistant_messages: assistantTexts.slice(-6)
    }
  };
};

const buildIntentInput = (visitorMessage, state) => {
  const current = String(visitorMessage || '').trim();
  const pageContext = state && state.meta ? state.meta.page_context : null;
  const pageGroup = pageContext ? pageContext.page_group : null;
  const topicFromPage = pageContext ? pageContext.topic_key : null;
  const practicePack = topicFromPage ? getPracticePackByTopic(topicFromPage) : null;

  return {
    current,
    normalized_current: normalizeText(current),
    recent_visitor_messages: Array.isArray(state && state.raw && state.raw.recent_visitor_messages)
      ? state.raw.recent_visitor_messages
      : [],
    recent_assistant_messages: Array.isArray(state && state.raw && state.raw.recent_assistant_messages)
      ? state.raw.recent_assistant_messages
      : [],
    page_group: pageGroup,
    page_topic: topicFromPage,
    page_domain_area: pageContext ? pageContext.domain_area : null,
    page_practice_area: pageContext ? pageContext.practice_area : null,
    page_issue_type: pageContext ? pageContext.issue_type : null,
    page_allowed_next_questions: pageContext ? pageContext.allowed_next_questions : [],
    page_soft_prompt: practicePack ? practicePack.page_soft_prompt : null,
    current_topic: state && state.meta ? state.meta.current_topic : null,
    previous_topic: state && state.meta ? state.meta.previous_topic : null,
    context_depth: state && state.meta ? Number(state.meta.context_depth || 0) : 0
  };
};

module.exports = {
  GREETING_TEXT,
  CONTACT_SAVED_TEXT,
  CONTACT_IDLE_TEXT,
  REOPEN_TEXT,
  normalizeText,
  normalizePhone,
  getSuggestedFormalName,
  inferTopicFromText,
  topicFromPageGroup,
  detectAssistantQuestionKey,
  buildPageContext,
  buildConversationState,
  buildIntentInput
};
