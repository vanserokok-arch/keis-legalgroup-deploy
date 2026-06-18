'use strict';

const { inferTopicFromText } = require('./chat-state');
const { getAllPracticePacks, getPracticePackByTopic } = require('./practice-pack-loader');

const GENERIC_RE = {
  greeting_only: /^(добрый\s+день|доброго\s+дня|здравствуйте|привет|добрый\s+вечер|доброе\s+утро)$/i,
  ask_help: /(нужна\s+консультац|нужна\s+помощь|помогите|подскажите|хочу\s+задать\s+вопрос|нужен\s+юрист|консультация|есть\s+вопрос|вопрос|как\s+быть)/i,
  unclear: /^(не\s+знаю|не\s+понял|не\s+помню|сложно\s+сказать|не\s+уверен|не\s+разобрался)$/i,
  correction: /(не\s*это|не\s*так|не\s*про\s*вывод|не\s*про\s*это|я\s*не\s*это\s*сказал|я\s*не\s*это\s*имел\s*в\s*виду|вы\s*не\s*так\s*поняли|я\s*не\s*говорил)/i,
  topic_switch: /(другая\s+тема|другой\s+вопрос|переключим\s+тему|это\s+другое|сменим\s+тему)/i,
  ask_location: /(где\s+вы|ваш\s+адрес|как\s+проехать|как\s+добраться|как\s+подъехать|ближайш\w*\s+метро|на\s+машине|доехать|подъехать|офис)/i,

  robot_check: /(?:^|\s)(ты|вы)\s+робот|(?:^|\s)(ты|вы)\s+бот|(?:^|\s)робот(?:\s|$|[?!.,])|это\s+бот|(?:^|\s)бот(?:\s|$|[?!.,])|человек\s+или\s+бот|вы\s+вообще\s+человек|живой\s+человек|(?:^|\s)ии(?:\s|$|[?!.,])|автоответ/i,
  insult_or_irritation: /(туп(ой|ая)|тупой\s+мозг|ебанут|опять\s+херня|ничего\s+не\s+понима(ешь|ете)|хуйню\s+пиш(ешь|ете))/i,
  scam_anger: /(обманули|кинули|развели|лохотрон|скам|мошенники|брокер.*(урод|пидорас|твар)|деньг.*(урод|пидорас|твар)|мошенник.*(урод|пидорас|твар)|(урод|пидорас|твар).*(мошенник|брокер|деньг))/i,
  fraud_fear: /(обманете|вдруг.*обман|боюсь.*обман|не\s+доверя|развод|кидалов|мошенники?\s+ли\s+вы|вы\s+мошенники)/i,
  can_help: /(чем\s+(вы\s+)?(вообще\s+)?можете\s+помочь|что\s+вы\s+можете|поможете\??)/i,
  no_call: /(не\s*хочу\s*звон|без\s*звонк|не\s*звоните|только\s*в\s*чате|неудобно\s*говорить|не\s*могу\s*говорить)/i,
  postpone: /(потом|позже|не\s+сейчас|в\s+другой\s+раз|давайте\s+позже|отложим|подумаю)/i,

  yes: /^(да|ага|угу|ок|верно|именно|правильно|подтверждаю)$/i,
  no: /^(нет|неа|нету)$/i,
  dont_know: /^(не\s+знаю|не\s+помню|сложно\s+сказать)$/i,
  there_is: /^(есть|имеется|сохранилось|сохранились)$/i,
  messenger_channel: /(телеграм|telegram|в\s*тг|whatsapp|ватсап|viber|мессенджер|переписк)/i,
  telegram: /^(телеграм|telegram|в\s*тг)$/i,
  whatsapp: /^(whatsapp|ватсап)$/i,
  phone_call: /(созвон|позвон|давайте\s+созвон|можно\s+позвонить)/i
};

const neutralOpeningTokens = [
  'добрый день',
  'здравствуйте',
  'привет',
  'доброго дня',
  'нужна консультация',
  'хочу задать вопрос',
  'нужен юрист',
  'консультация',
  'вопрос',
  'есть вопрос'
];

const shortLabels = ['yes', 'no', 'dont_know', 'there_is', 'messenger_channel', 'telegram', 'whatsapp', 'phone_call'];

const toRegExp = pattern => {
  try {
    return new RegExp(String(pattern || ''), 'i');
  } catch (_) {
    return null;
  }
};

const buildPracticeIntentMatchers = () => {
  const out = [];
  getAllPracticePacks().forEach(pack => {
    const patterns = pack && pack.intent_patterns && typeof pack.intent_patterns === 'object'
      ? pack.intent_patterns
      : {};
    Object.entries(patterns).forEach(([intentType, patternList]) => {
      (Array.isArray(patternList) ? patternList : []).forEach(pattern => {
        const re = toRegExp(pattern);
        if (!re) return;
        out.push({
          topic: pack.topic_key,
          group: 'practice-specific',
          type: intentType,
          re
        });
      });
    });
  });
  return out;
};

const PRACTICE_MATCHERS = buildPracticeIntentMatchers();

const isNeutralOpeningMessage = text => {
  const normalized = String(text || '').trim().toLowerCase();
  return neutralOpeningTokens.includes(normalized);
};

const hasStrongScenarioSignal = text => {
  const value = String(text || '');
  return /(брокер|не\s+выводят|не\s*вывод|взлом|госуслуг|кредит\s+без\s+согласия|кредит\s+без\s+моего\s+ведома|оформили\s+кредит|займ|под\s+влиянием|перевел|перевёл|перевод\s+на\s+карту|карта\s+физлица|платформ|вынудили|заставили|медицин|дкп|дтп)/i.test(value);
};

const isCorrectionMessage = text => GENERIC_RE.correction.test(String(text || ''));

const detectGenericExplicit = (raw, normalized, input) => {
  // Priority order:
  // 1) robot_check 2) fraud_fear 3) scam_anger 4) insult_or_irritation 5) no_call 6) can_help
  // 7) correction 8) explicit practice intent 9) page-aware 10) neutral 11) fallback
  if (GENERIC_RE.robot_check.test(raw)) return { group: 'trust', type: 'robot_check', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.fraud_fear.test(raw)) return { group: 'trust', type: 'fraud_fear', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.scam_anger.test(raw)) return { group: 'practice-specific', type: 'scam_anger', topic: input.current_topic || input.page_topic || null, source: 'explicit' };
  if (GENERIC_RE.insult_or_irritation.test(raw)) return { group: 'trust', type: 'insult_or_irritation', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.no_call.test(raw)) return { group: 'trust', type: 'no_call', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.can_help.test(raw)) return { group: 'trust', type: 'can_help', topic: input.current_topic || null, source: 'explicit' };

  if (isCorrectionMessage(raw)) {
    return { group: 'neutral', type: 'correction', topic: null, source: 'explicit', reset_topic: true };
  }
  if (GENERIC_RE.topic_switch.test(raw)) {
    return { group: 'neutral', type: 'topic_switch', topic: null, source: 'explicit', reset_topic: true };
  }
  if (GENERIC_RE.ask_location.test(raw)) {
    return { group: 'service', type: 'ask_location', topic: input.current_topic || input.page_topic || null, source: 'explicit' };
  }
  if (GENERIC_RE.postpone.test(raw)) return { group: 'trust', type: 'postpone', topic: input.current_topic || null, source: 'explicit' };

  if (GENERIC_RE.yes.test(normalized)) return { group: 'short', type: 'yes', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.no.test(normalized)) return { group: 'short', type: 'no', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.dont_know.test(normalized)) return { group: 'short', type: 'dont_know', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.there_is.test(normalized)) return { group: 'short', type: 'there_is', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.telegram.test(normalized)) return { group: 'short', type: 'telegram', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.whatsapp.test(normalized)) return { group: 'short', type: 'whatsapp', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.phone_call.test(raw)) return { group: 'short', type: 'phone_call', topic: input.current_topic || null, source: 'explicit' };
  if (GENERIC_RE.messenger_channel.test(raw)) return { group: 'short', type: 'messenger_channel', topic: input.current_topic || null, source: 'explicit' };

  if (GENERIC_RE.greeting_only.test(raw)) return { group: 'neutral', type: 'greeting_reply', topic: null, source: 'explicit' };
  if (isNeutralOpeningMessage(raw) && !hasStrongScenarioSignal(raw)) return { group: 'neutral', type: 'greeting_reply', topic: null, source: 'explicit' };
  if (GENERIC_RE.ask_help.test(raw) && !hasStrongScenarioSignal(raw)) return { group: 'neutral', type: 'ask_help', topic: null, source: 'explicit' };

  if (/(мошенничеств|обман|проблема|сложная\s+ситуация)/i.test(raw) && !hasStrongScenarioSignal(raw)) {
    return {
      group: 'neutral',
      type: 'ask_help',
      topic: input.page_topic || null,
      source: input.page_topic ? 'page' : 'explicit'
    };
  }

  return null;
};

const detectPracticeSpecific = (raw, input) => {
  const targetTopic = input.current_topic || input.page_topic || null;
  const hits = PRACTICE_MATCHERS.filter(matcher => matcher.re.test(raw));
  if (hits.length) {
    const preferred = targetTopic
      ? (hits.find(hit => hit.topic === targetTopic) || hits[0])
      : hits[0];
    return {
      group: 'practice-specific',
      type: preferred.type,
      topic: preferred.topic,
      source: 'explicit'
    };
  }

  if (targetTopic) {
    const pack = getPracticePackByTopic(targetTopic);
    if (pack) {
      const score = (Array.isArray(pack.summary_keywords) ? pack.summary_keywords : []).reduce((sum, keyword) => {
        const token = String(keyword || '').trim().toLowerCase();
        if (!token) return sum;
        return raw.toLowerCase().includes(token) ? sum + 1 : sum;
      }, 0);
      if (score >= 2) {
        return { group: 'neutral', type: 'ask_help', topic: targetTopic, source: 'recent' };
      }
    }
  }

  return null;
};

const detectExplicitIntent = input => {
  const raw = String(input && input.current ? input.current : '');
  const normalized = String(input && input.normalized_current ? input.normalized_current : '');
  if (!raw.trim()) return null;

  const genericHit = detectGenericExplicit(raw, normalized, input || {});
  if (genericHit) return genericHit;

  const practiceHit = detectPracticeSpecific(raw, input || {});
  if (practiceHit) return practiceHit;

  const inferredTopic = inferTopicFromText(raw);
  if (inferredTopic) {
    return { group: 'practice-specific', type: 'ask_help', topic: inferredTopic, source: 'explicit' };
  }

  return null;
};

const detectIntent = input => {
  const explicit = detectExplicitIntent(input || {});
  if (explicit) return explicit;

  const normalized = String(input && input.normalized_current ? input.normalized_current : '');
  const contextDepth = Number(input && input.context_depth ? input.context_depth : 0);

  if (input && input.current_topic && contextDepth > 1) {
    if (GENERIC_RE.unclear.test(normalized)) {
      return { group: 'neutral', type: 'unclear', topic: input.current_topic, source: 'recent' };
    }
    return { group: 'neutral', type: 'ask_help', topic: input.current_topic, source: 'recent' };
  }

  if (input && input.page_topic) {
    if (GENERIC_RE.unclear.test(normalized)) {
      return { group: 'neutral', type: 'unclear', topic: input.page_topic, source: 'page' };
    }
    return { group: 'neutral', type: 'ask_help', topic: input.page_topic, source: 'page' };
  }

  return { group: 'neutral', type: 'unclear', topic: null, source: 'fallback' };
};

module.exports = {
  detectIntent,
  isNeutralOpeningMessage,
  hasStrongScenarioSignal,
  isCorrectionMessage,
  shortLabels
};
