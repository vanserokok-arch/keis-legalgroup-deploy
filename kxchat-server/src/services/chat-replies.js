'use strict';

const { getSuggestedFormalName } = require('./chat-state');
const { getPhrasePack } = require('./phrase-pack-loader');
const { getSiteConfig } = require('./site-config-loader');
const { getPracticePackByTopic, getPracticePackByPageGroup } = require('./practice-pack-loader');

const STYLE_BANNED = [
  'в таких ситуациях важно',
  'для более точной консультации',
  'необходимо зафиксировать'
];

const phrasePack = getPhrasePack();

const asReply = (text, options = {}) => ({
  text: String(text || '').trim(),
  question_key: options.question_key || null,
  scope: options.scope || 'generic',
  state_patch: options.state_patch || null
});

const chooseTopic = ({ intent, state, input }) => {
  if (intent && intent.topic) return intent.topic;
  if (state && state.meta && state.meta.current_topic) return state.meta.current_topic;
  if (input && input.page_topic) return input.page_topic;
  return null;
};

const resolvePracticePack = ({ topic, pageGroup }) => {
  if (topic) {
    const byTopic = getPracticePackByTopic(topic);
    if (byTopic) return byTopic;
  }
  if (pageGroup) {
    const byPageGroup = getPracticePackByPageGroup(pageGroup);
    if (byPageGroup) return byPageGroup;
  }
  return null;
};

const getPageSoftPrompt = pageGroup => {
  const pack = resolvePracticePack({ pageGroup });
  if (pack && pack.page_soft_prompt) return String(pack.page_soft_prompt).trim();
  return phrasePack.neutral_opening;
};

const getOperatorOpeningQuestion = ({ topic, pageGroup }) => {
  const pack = resolvePracticePack({ topic, pageGroup });
  if (pack && pack.operator_opening_question) {
    return {
      key: 'operator_opening',
      text: String(pack.operator_opening_question).trim()
    };
  }
  if (pack && Array.isArray(pack.first_questions) && pack.first_questions.length) {
    const first = pack.first_questions.find(item => item && item.text);
    if (first) {
      return {
        key: String(first.key || 'operator_opening').trim() || 'operator_opening',
        text: String(first.text || '').trim()
      };
    }
  }
  return { key: 'core_incident', text: phrasePack.neutral_opening };
};

const pickQuestionByTopic = ({ topic, pageGroup }) => getOperatorOpeningQuestion({ topic, pageGroup });

const buildNameConfirmationReply = state => {
  const rawName = state && state.lead ? state.lead.name_raw : null;
  const formalName = getSuggestedFormalName(rawName || '');
  if (formalName) {
    const templated = String(phrasePack.name_confirmation_template || '')
      .replace('{{raw_name}}', String(rawName || ''))
      .replace('{{formal_name}}', String(formalName));
    return asReply(templated, {
      question_key: 'name_confirmation',
      scope: 'name-confirmation'
    });
  }
  return asReply(phrasePack.name_confirmation_unknown || 'Подскажите, как к вам правильно обращаться?', {
    question_key: 'name_confirmation',
    scope: 'name-confirmation'
  });
};

const buildLocationReply = state => {
  const site = getSiteConfig(state && state.meta ? state.meta.site_key : null) || {};
  const office = site && site.office && typeof site.office === 'object' ? site.office : {};

  const address = String(office.address || '').trim();
  const metro = String(office.nearest_metro || '').trim();
  const routeHint = String(office.route_hint || '').trim();
  const landmark = String(office.landmark || '').trim();
  const parking = String(office.parking || '').trim();

  if (!address) {
    return asReply('Подскажу адрес сразу после уточнения у коллег. Откуда вам удобнее ехать?', {
      question_key: 'location_origin',
      scope: 'service-location-missing'
    });
  }

  const parts = [`Мы находимся по адресу: ${address}.`];
  if (metro) parts.push(`Ближайшее метро: ${metro}.`);
  if (routeHint) parts.push(`Удобнее ехать: ${routeHint}.`);
  if (landmark) parts.push(`Ориентир: ${landmark}.`);
  if (parking) parts.push(`По парковке: ${parking}.`);

  if (!metro || !routeHint || !landmark || !parking) {
    parts.push('Если подскажете, откуда планируете ехать, сориентирую точнее.');
  }

  return asReply(parts.join('\n'), {
    question_key: 'location_origin',
    scope: 'service-location'
  });
};

const planReply = ({ intent, state, input }) => {
  const safeFollowupIntents = new Set(['ask_help', 'unclear', 'greeting_reply', 'yes', 'no', 'dont_know', 'there_is', 'messenger_channel', 'telegram', 'whatsapp']);

  if (
    state && state.lead &&
    state.lead.name_confirmation_required &&
    !state.lead.name_confirmation_asked &&
    safeFollowupIntents.has(intent.type)
  ) {
    return buildNameConfirmationReply(state);
  }

  switch (intent.type) {
    case 'correction':
    case 'topic_switch':
      return asReply(phrasePack.correction_ack, {
        question_key: 'core_incident',
        scope: 'correction',
        state_patch: {
          meta: {
            previous_topic: state.meta.current_topic || null,
            current_topic: null
          }
        }
      });

    case 'robot_check':
      return asReply(phrasePack.robot, { question_key: 'core_incident', scope: 'trust-robot' });

    case 'fraud_fear':
      return asReply(phrasePack.fear, { scope: 'trust-fear' });

    case 'insult_or_irritation':
      return asReply(phrasePack.irritation || 'Поняла вас. Давайте без лишнего — что именно у вас произошло?', {
        question_key: 'core_incident',
        scope: 'trust-irritation'
      });

    case 'scam_anger':
    case 'fraud_report':
    case 'emotional_fraud_entry': {
      const topic = chooseTopic({ intent, state, input });
      const question = getOperatorOpeningQuestion({ topic, pageGroup: input.page_group });
      return asReply(question.text, {
        question_key: question.key,
        scope: topic ? `scam-entry:${topic}` : 'scam-entry:generic'
      });
    }

    case 'can_help':
      return asReply(phrasePack.can_help, { question_key: 'core_incident', scope: 'trust-can-help' });

    case 'no_call':
      return asReply(phrasePack.no_call, {
        scope: 'trust-no-call',
        state_patch: {
          dialogue: { call_declined: true, call_declined_messages_since: 0 }
        }
      });

    case 'postpone':
      return asReply(phrasePack.postpone, { scope: 'trust-postpone' });

    case 'ask_location':
      return buildLocationReply(state);

    case 'phone_call': {
      if (state && state.lead && state.lead.phone_normalized) {
        return asReply(phrasePack.handoff_confirmed || 'Спасибо, передам юристу. С вами свяжутся в ближайшее время.', {
          scope: 'handoff-confirmed'
        });
      }
      return asReply(phrasePack.phone_request || 'Поняла. Оставьте, пожалуйста, номер, и юрист свяжется с вами в ближайшее время.', {
        question_key: 'phone_request',
        scope: 'ask-phone'
      });
    }

    case 'greeting_reply': {
      const pageTopic = input && input.page_topic ? input.page_topic : null;
      if (pageTopic) {
        const question = getOperatorOpeningQuestion({ topic: pageTopic, pageGroup: input.page_group });
        return asReply(question.text, {
          question_key: question.key,
          scope: `page-opening:${pageTopic}`
        });
      }
      return asReply(phrasePack.neutral_opening, { question_key: 'core_incident', scope: 'neutral-greeting' });
    }

    case 'has_docs':
    case 'there_is':
      return asReply('Поняла. Отлично, это пригодится. Что случилось дальше?', {
        question_key: 'core_incident',
        scope: 'facts-docs'
      });

    case 'no_docs':
      return asReply('Поняла. Даже без документов можно начать. Что произошло дальше?', {
        question_key: 'core_incident',
        scope: 'facts-no-docs'
      });

    case 'bank_contact':
      return asReply('Поняла. Хорошо, что уже обратились в банк. Ответ банка у вас есть?', {
        question_key: 'bank_contact',
        scope: 'facts-bank'
      });

    case 'police_contact':
      return asReply('Поняла. Хорошо, что уже подали заявление. Талон-уведомление сохранился?', {
        question_key: 'police_contact',
        scope: 'facts-police'
      });

    case 'yes':
    case 'no':
    case 'dont_know':
    case 'telegram':
    case 'whatsapp':
    case 'messenger_channel':
    case 'ask_help':
    case 'unclear':
    default: {
      const topic = chooseTopic({ intent, state, input });
      const question = getOperatorOpeningQuestion({ topic, pageGroup: input.page_group });
      return asReply(question.text, {
        question_key: question.key,
        scope: topic ? `followup:${topic}` : 'neutral-generic'
      });
    }
  }
};

const sanitizeReplyText = text => {
  const raw = String(text || '').trim();
  if (!raw) return phrasePack.fallback;

  let cleaned = raw;
  STYLE_BANNED.forEach(fragment => {
    cleaned = cleaned.replace(new RegExp(fragment, 'ig'), '');
  });

  const lines = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  let out = lines.join('\n').trim();
  if (!out) out = phrasePack.fallback;

  const questions = (out.match(/\?/g) || []).length;
  if (questions > 1) {
    let seen = false;
    out = out.replace(/\?/g, () => {
      if (seen) return '.';
      seen = true;
      return '?';
    });
  }

  return out;
};

const getIntentAlternatives = intentType => {
  if (intentType === 'robot_check') {
    return Array.isArray(phrasePack.robot_alternatives) ? phrasePack.robot_alternatives : [];
  }
  if (intentType === 'insult_or_irritation') {
    return Array.isArray(phrasePack.irritation_alternatives) ? phrasePack.irritation_alternatives : [];
  }
  if (intentType === 'ask_help' || intentType === 'unclear' || intentType === 'greeting_reply') {
    return Array.isArray(phrasePack.neutral_alternatives) ? phrasePack.neutral_alternatives : [];
  }
  return [];
};

module.exports = {
  TEXTS: phrasePack,
  getPageSoftPrompt,
  pickQuestionByTopic,
  getOperatorOpeningQuestion,
  getIntentAlternatives,
  planReply,
  sanitizeReplyText
};
