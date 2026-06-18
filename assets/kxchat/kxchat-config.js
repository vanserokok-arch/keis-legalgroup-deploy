// KXchat Widget Configuration (server-first runtime)
(function initKxchatConfig() {
  var host = (window.location && window.location.hostname) || '';
  var origin = (window.location && window.location.origin) || '';
  var isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(host);

  var runtimeBase = '';
  if (typeof window.__KXCHAT_API_BASE__ === 'string' && window.__KXCHAT_API_BASE__.trim()) {
    runtimeBase = window.__KXCHAT_API_BASE__.trim();
  }

  var primaryBase = runtimeBase || (isLocalHost ? 'http://127.0.0.1:8787' : origin);
  var fallbackBases = [];
  fallbackBases.push(origin + '/kxchat-api');

  var defaults = {
    SITE_KEY: 'keis-legalgroup',
    API_BASE: primaryBase,
    FALLBACK_API_BASES: fallbackBases,
    AUTO_OPEN_DELAY_DESKTOP_MS: 5200,
    AUTO_OPEN_DELAY_MOBILE_MS: 9000,
    REOPEN_DELAY_DESKTOP_MS: 48000,
    REOPEN_DELAY_MOBILE_MS: 70000,
    CONTACT_IDLE_PROMPT_DESKTOP_MS: 26000,
    CONTACT_IDLE_PROMPT_MOBILE_MS: 34000,
    CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS: 8000,
    REOPEN_INTERACTION_GUARD_MS: 12000,
    CHECK_DELAY_FIRST_MS: 3000,
    CHECK_DELAY_NEXT_MS: 2000,
    TYPING_START_MIN_MS: 1000,
    TYPING_START_MAX_MS: 2000,
    TYPING_SHORT_MIN_MS: 4000,
    TYPING_SHORT_MAX_MS: 6000,
    TYPING_MEDIUM_MIN_MS: 7000,
    TYPING_MEDIUM_MAX_MS: 9000,
    TYPING_LONG_MIN_MS: 10000,
    TYPING_LONG_MAX_MS: 12000,
    PHRASES: {
      greeting: '👋🏽Здравствуйте\nМеня зовут Ольга Сергеевна\nЕсли у вас есть вопрос — напишите\nя здесь и готова помочь\n\nГорячая линия\n📞 8-800-300-4624\n\nТелефон руководства\n📞 8-904-808-5909',
      contact_saved: 'Спасибо, контакт получила. Можете коротко описать ситуацию.',
      idle_after_contact: 'Если удобно, коротко опишите ситуацию — я подскажу, с чего лучше начать.',
      reopen: 'Если что, я здесь — можете задать вопрос, возможно так ответ узнаете быстрее.',
      robot: 'Понимаю, почему так кажется.\nДавайте по делу — что именно случилось?',
      fear: 'Понимаю сомнения.\nСначала просто разберём ситуацию и честно скажем, есть ли смысл дальше что-то делать.',
      can_help: 'Да, можно разобраться. Что именно у вас произошло?',
      no_call: 'Хорошо, можем без звонка и продолжить здесь.',
      client_empty_reply_fallback: 'Поняла. Коротко расскажите, что именно произошло дальше?',
      client_network_fallback: 'Поняла. Коротко расскажите, что у вас произошло?'
    }
  };

  var existing = (window.KXCHAT_CONFIG && typeof window.KXCHAT_CONFIG === 'object')
    ? window.KXCHAT_CONFIG
    : {};

  window.KXCHAT_CONFIG = Object.assign({}, defaults, existing);
})();
