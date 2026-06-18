(function() {
  'use strict';

  if (window.KXchatWidget) return;
  window.KXchatWidget = true;

  const CONFIG = window.KXCHAT_CONFIG || {};

  const PHRASES = (CONFIG && CONFIG.PHRASES && typeof CONFIG.PHRASES === 'object') ? CONFIG.PHRASES : {};
  const GREETING_TEXT = String(PHRASES.greeting || [
    '👋🏽Здравствуйте',
    'Меня зовут Ольга Сергеевна',
    'Если у вас есть вопрос — напишите',
    'я здесь и готова помочь',
    '',
    'Горячая линия',
    '📞 8-800-300-4624',
    '',
    'Телефон руководства',
    '📞 8-904-808-5909'
  ].join('\n'));
  const CONTACT_SAVED_TEXT = String(PHRASES.contact_saved || 'Спасибо, контакт получила. Можете коротко описать ситуацию.');
  const CONTACT_IDLE_TEXT = String(PHRASES.idle_after_contact || 'Если удобно, коротко опишите ситуацию — я подскажу, с чего лучше начать.');
  const REOPEN_TEXT = String(PHRASES.reopen || 'Если что, я здесь — можете задать вопрос, возможно так ответ узнаете быстрее.');
  const CLIENT_EMPTY_REPLY_FALLBACK_TEXT = String(PHRASES.client_empty_reply_fallback || 'Поняла. Коротко расскажите, что именно произошло дальше?');
  const CLIENT_NETWORK_FALLBACK_TEXT = String(PHRASES.client_network_fallback || 'Поняла. Коротко расскажите, что у вас произошло?');

  const STORAGE_SESSION_ID = 'kxchat_sessionId';
  const STORAGE_CONVERSATION_ID = 'kxchat_conversationId';
  const STORAGE_AUTO_OPENED = 'kxchat_auto_opened_once_v4';

  const MESSAGE_DEDUPE_WINDOW_MS = 8000;

  const getPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return parsed > 0 ? parsed : fallback;
  };

  const CHECK_DELAY_FIRST_MS = getPositiveNumber(CONFIG.CHECK_DELAY_FIRST_MS, 3000);
  const CHECK_DELAY_NEXT_MS = getPositiveNumber(CONFIG.CHECK_DELAY_NEXT_MS, 2000);
  const AUTO_OPEN_DELAY_DESKTOP_MS = getPositiveNumber(CONFIG.AUTO_OPEN_DELAY_DESKTOP_MS, 5200);
  const AUTO_OPEN_DELAY_MOBILE_MS = getPositiveNumber(CONFIG.AUTO_OPEN_DELAY_MOBILE_MS, 9000);
  const REOPEN_DELAY_DESKTOP_MS = getPositiveNumber(CONFIG.REOPEN_DELAY_DESKTOP_MS, 48000);
  const REOPEN_DELAY_MOBILE_MS = getPositiveNumber(CONFIG.REOPEN_DELAY_MOBILE_MS, 70000);
  const CONTACT_IDLE_PROMPT_DESKTOP_MS = getPositiveNumber(CONFIG.CONTACT_IDLE_PROMPT_DESKTOP_MS, 26000);
  const CONTACT_IDLE_PROMPT_MOBILE_MS = getPositiveNumber(CONFIG.CONTACT_IDLE_PROMPT_MOBILE_MS, 34000);
  const CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS = getPositiveNumber(CONFIG.CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS, 8000);
  const REOPEN_INTERACTION_GUARD_MS = getPositiveNumber(CONFIG.REOPEN_INTERACTION_GUARD_MS, 12000);
  const TYPING_START_MIN_MS = getPositiveNumber(CONFIG.TYPING_START_MIN_MS, 1000);
  const TYPING_START_MAX_MS = getPositiveNumber(CONFIG.TYPING_START_MAX_MS, 2000);
  const TYPING_SHORT_MIN_MS = getPositiveNumber(CONFIG.TYPING_SHORT_MIN_MS, 4000);
  const TYPING_SHORT_MAX_MS = getPositiveNumber(CONFIG.TYPING_SHORT_MAX_MS, 6000);
  const TYPING_MEDIUM_MIN_MS = getPositiveNumber(CONFIG.TYPING_MEDIUM_MIN_MS, 7000);
  const TYPING_MEDIUM_MAX_MS = getPositiveNumber(CONFIG.TYPING_MEDIUM_MAX_MS, 9000);
  const TYPING_LONG_MIN_MS = getPositiveNumber(CONFIG.TYPING_LONG_MIN_MS, 10000);
  const TYPING_LONG_MAX_MS = getPositiveNumber(CONFIG.TYPING_LONG_MAX_MS, 12000);
  const TYPING_MAX_MS = 12000;

  const normalizeBase = value => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed.replace(/\/+$/, '');
  };

  const resolveApiBaseCandidates = () => {
    const out = [];
    const push = value => {
      const normalized = normalizeBase(value);
      if (!normalized) return;
      if (!out.includes(normalized)) out.push(normalized);
    };

    push(CONFIG.API_BASE);
    if (Array.isArray(CONFIG.FALLBACK_API_BASES)) {
      CONFIG.FALLBACK_API_BASES.forEach(push);
    }

    const host = (window.location && window.location.hostname) || '';
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(host);
    if (isLocalHost) {
      push('http://127.0.0.1:8787');
    } else if (window.location && window.location.origin) {
      push(window.location.origin);
      push(window.location.origin + '/kxchat-api');
    }
    return out;
  };

  const API_BASE_CANDIDATES = resolveApiBaseCandidates();
  let activeApiBase = API_BASE_CANDIDATES[0] || normalizeBase(window.location.origin || '') || '';

  const runtime = {
    sessionId: null,
    conversationId: null,
    isOpen: false,
    unreadCount: 0,
    sentVisitorCount: 0,
    hasUserMessages: false,
    historyLoaded: false,
    closeCycleId: 0,
    reopenShownCycleId: null,
    contactIdlePromptSent: false,
    contactIdlePromptSuppressed: false,
    leadCompletionNotified: false,
    lastUserInteractionAt: Date.now(),
    lastReplyTopic: null,
    nextAssistantEarliestAt: 0
  };

  const leadData = {
    name: null,
    phone: null
  };

  const messageDedupeSet = new Set();
  const outgoingStatusTimers = new WeakMap();

  let widget = null;
  let launcher = null;
  let messagesContainer = null;
  let textarea = null;
  let sendButton = null;
  let contactCardEl = null;
  let contactNameInput = null;
  let contactPhoneInput = null;
  let contactSubmitButton = null;
  let contactHint = null;
  let quickRepliesEl = null;

  let autoReopenTimer = null;
  let idlePromptTimer = null;
  let typingIndicatorEl = null;
  let assistantRenderActive = false;
  const assistantQueue = [];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const isMobileViewport = () => window.matchMedia('(max-width: 980px)').matches;

  const safeStorageGet = (storage, key) => {
    try {
      return storage.getItem(key);
    } catch (_) {
      return null;
    }
  };

  const safeStorageSet = (storage, key, value) => {
    try {
      storage.setItem(key, value);
    } catch (_) {
      // ignore
    }
  };

  const safeStorageRemove = (storage, key) => {
    try {
      storage.removeItem(key);
    } catch (_) {
      // ignore
    }
  };

  const normalizeText = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const parseCreatedAtToMs = createdAt => {
    if (typeof createdAt === 'number' && Number.isFinite(createdAt)) return createdAt;
    if (typeof createdAt === 'string' && createdAt.trim()) {
      const asNumber = Number(createdAt);
      if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
      const parsed = Date.parse(createdAt);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  };

  const hashString = input => {
    let hash = 5381;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) + hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const getMessageDedupeKey = (role, message, options = {}) => {
    const messageId = options.messageId == null ? null : String(options.messageId);
    const createdAt = parseCreatedAtToMs(options.createdAt);
    const scope = options.scope || 'default';
    if (messageId) return `id:${role}:${messageId}`;
    if (createdAt != null) {
      return `ts:${role}:${hashString(normalizeText(message))}:${Math.floor(createdAt / 1000)}`;
    }
    const bucket = Math.floor(Date.now() / MESSAGE_DEDUPE_WINDOW_MS);
    return `hash:${scope}:${role}:${hashString(normalizeText(message))}:${bucket}`;
  };

  const textFromSelector = selector => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const text = String(el.textContent || '').trim().replace(/\s+/g, ' ');
    return text || null;
  };

  const collectHeroText = () => {
    const candidates = [
      '[data-kx-hero]',
      '.hero',
      '.offer',
      '[class*="hero"]',
      '[class*="offer"]'
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const el = document.querySelector(candidates[i]);
      if (!el) continue;
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) return text.slice(0, 400);
    }
    return null;
  };

  const collectBullets = () => {
    const list = [];
    const nodes = document.querySelectorAll('main li, [data-kx-bullets] li, .hero li, .offer li');
    for (let i = 0; i < nodes.length; i += 1) {
      const text = String(nodes[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (list.includes(text)) continue;
      list.push(text);
      if (list.length >= 8) break;
    }
    return list;
  };

  const getCurrentPageContext = () => {
    const sourceUrl = window.location.href;
    const pageTitle = document.title || '';
    const pathname = window.location.pathname || '/';
    const bodyDataPage = document.body ? (document.body.getAttribute('data-page') || '').trim() : '';
    const contextEl = document.getElementById('kx-page-context');
    const dataset = contextEl && contextEl.dataset ? contextEl.dataset : {};
    const htmlDataset = document.documentElement && document.documentElement.dataset ? document.documentElement.dataset : {};

    const summary = (dataset.summary || '').trim();
    const heroText = collectHeroText();
    const h1Text = textFromSelector('h1');
    const metaDescriptionEl = document.querySelector('meta[name="description"]');
    const metaDescription = metaDescriptionEl ? String(metaDescriptionEl.getAttribute('content') || '').trim() : '';
    const pageGroup = (dataset.group || bodyDataPage || pathname || '/').trim();

    return {
      site_key: (dataset.site || htmlDataset.kxSite || CONFIG.SITE_KEY || '').trim() || null,
      domain_area: (dataset.domain || '').trim() || null,
      practice_area: (dataset.practice || '').trim() || null,
      issue_type: (dataset.issue || '').trim() || null,
      source_url: sourceUrl,
      page_title: pageTitle,
      page_group: pageGroup,
      page_summary: summary || null,
      h1: h1Text,
      hero_text: heroText,
      bullets: collectBullets(),
      meta_description: metaDescription || null
    };
  };

  const updateSafeBottomOffset = () => {
    const root = document.documentElement;
    if (!root) return;
    const cookie = document.querySelector('.kg-cookie');
    let offset = 0;
    if (cookie && cookie.isConnected && !cookie.classList.contains('is-hiding')) {
      const styles = window.getComputedStyle(cookie);
      if (styles.display !== 'none' && styles.visibility !== 'hidden') {
        const rect = cookie.getBoundingClientRect();
        if (rect.height > 0) offset = Math.ceil(rect.height + 14);
      }
    }
    root.style.setProperty('--kxchat-safe-offset', offset + 'px');
  };

  const formatTimestamp = ts => {
    const date = ts ? new Date(ts) : new Date();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const escapeHtml = text => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const scrollToBottom = force => {
    if (!messagesContainer) return;
    const apply = () => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    apply();
    if (force) {
      apply();
      requestAnimationFrame(apply);
      setTimeout(apply, 80);
      return;
    }
    requestAnimationFrame(apply);
    setTimeout(apply, 60);
  };

  const markUserInteraction = () => {
    runtime.lastUserInteractionAt = Date.now();
  };

  const updateUnread = increment => {
    if (increment) runtime.unreadCount += 1;
    else runtime.unreadCount = 0;

    const unreadEl = document.getElementById('kxchat-unread');
    if (!unreadEl) return;
    if (runtime.unreadCount > 0) {
      unreadEl.textContent = runtime.unreadCount > 9 ? '9+' : String(runtime.unreadCount);
      unreadEl.style.display = 'flex';
    } else {
      unreadEl.style.display = 'none';
    }
  };

  const createCheckIcon = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.classList.add('kxchat-check-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 8.5 6.5 12 13 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  };

  const createDoubleCheckIcon = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 18 16');
    svg.classList.add('kxchat-check-icon', 'kxchat-check-double');
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M2.5 8.5 6 12 11 4');
    p1.setAttribute('fill', 'none');
    p1.setAttribute('stroke', 'currentColor');
    p1.setAttribute('stroke-width', '1.6');
    p1.setAttribute('stroke-linecap', 'round');
    p1.setAttribute('stroke-linejoin', 'round');
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', 'M7.5 9 11 12 16 4');
    p2.setAttribute('fill', 'none');
    p2.setAttribute('stroke', 'currentColor');
    p2.setAttribute('stroke-width', '1.6');
    p2.setAttribute('stroke-linecap', 'round');
    p2.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p1);
    svg.appendChild(p2);
    return svg;
  };

  const setOutgoingCheckState = (checkWrap, delivered) => {
    if (!checkWrap) return;
    checkWrap.classList.toggle('is-processed', !!delivered);
    const iconWrap = checkWrap.querySelector('.kxchat-check');
    if (!iconWrap) return;
    iconWrap.innerHTML = '';
    if (delivered) iconWrap.appendChild(createDoubleCheckIcon());
    else iconWrap.appendChild(createCheckIcon());
  };

  const scheduleOutgoingCheckTransition = (checkWrap, delayMs) => {
    if (!checkWrap) return;
    if (outgoingStatusTimers.has(checkWrap)) {
      clearTimeout(outgoingStatusTimers.get(checkWrap));
      outgoingStatusTimers.delete(checkWrap);
    }
    const timer = setTimeout(() => {
      outgoingStatusTimers.delete(checkWrap);
      if (!checkWrap.isConnected) return;
      setOutgoingCheckState(checkWrap, true);
    }, delayMs);
    outgoingStatusTimers.set(checkWrap, timer);
  };

  const getTypingTiming = text => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    const startDelay = Math.round(randomInRange(TYPING_START_MIN_MS, TYPING_START_MAX_MS));
    let duration = 0;
    if (words <= 20) {
      duration = Math.round(randomInRange(TYPING_SHORT_MIN_MS, TYPING_SHORT_MAX_MS));
    } else if (words <= 45) {
      duration = Math.round(randomInRange(TYPING_MEDIUM_MIN_MS, TYPING_MEDIUM_MAX_MS));
    } else {
      duration = Math.round(randomInRange(TYPING_LONG_MIN_MS, TYPING_LONG_MAX_MS));
    }
    return { startDelay, duration: Math.min(duration, TYPING_MAX_MS) };
  };

  const showTypingIndicator = () => {
    if (!messagesContainer || typingIndicatorEl) return;
    const indicator = document.createElement('div');
    indicator.className = 'kxchat-message kxchat-typing-indicator';
    indicator.innerHTML = `
      <div class="kxchat-message-bubble kxchat-typing-bubble">
        <div class="kxchat-typing-dots">
          <span class="kxchat-typing-dot"></span>
          <span class="kxchat-typing-dot"></span>
          <span class="kxchat-typing-dot"></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    typingIndicatorEl = indicator;
    scrollToBottom();
  };

  const hideTypingIndicator = () => {
    if (!typingIndicatorEl) return;
    typingIndicatorEl.remove();
    typingIndicatorEl = null;
  };

  const clearReopenTimer = () => {
    if (!autoReopenTimer) return;
    clearTimeout(autoReopenTimer);
    autoReopenTimer = null;
  };

  const clearIdlePromptTimer = () => {
    if (!idlePromptTimer) return;
    clearTimeout(idlePromptTimer);
    idlePromptTimer = null;
  };

  const getContactState = () => {
    const hasName = !!leadData.name;
    const hasPhone = !!leadData.phone;
    if (hasName && hasPhone) return 'complete';
    if (hasName) return 'name_only';
    if (hasPhone) return 'phone_only';
    return 'none';
  };

  const normalizeNameInput = raw => {
    if (typeof raw !== 'string') return null;
    const value = raw.trim();
    if (!value) return null;
    if (value.length < 2 || value.length > 40) return null;
    if (!/^[\p{L}\s-]+$/u.test(value)) return null;
    const parts = value.split(/[\s-]+/).filter(Boolean);
    if (!parts.length || parts.length > 3) return null;
    if (parts.some(part => part.length < 2 || part.length > 20)) return null;
    return value;
  };

  const collectDigitsMeta = (rawValue, caretPos) => {
    const value = String(rawValue || '');
    const safeCaret = typeof caretPos === 'number' ? caretPos : value.length;
    const digits = [];
    let digitsBeforeCaret = 0;

    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (!/\d/.test(ch)) continue;
      digits.push(ch);
      if (i < safeCaret) digitsBeforeCaret += 1;
    }

    return {
      rawDigits: digits.join(''),
      digitsBeforeCaret,
      startsWithPlus: /^\s*\+/.test(value)
    };
  };

  const normalizeRawPhoneDigits = (rawDigits, startsWithPlus) => {
    let digits = String(rawDigits || '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits[0] === '8') {
      digits = digits.slice(1);
    } else if (digits[0] === '7' && (startsWithPlus || digits.length > 10)) {
      digits = digits.slice(1);
    }

    if (digits.length > 10) digits = digits.slice(0, 10);
    return digits;
  };

  const parsePhoneMaskInput = (rawValue, caretPos) => {
    const meta = collectDigitsMeta(rawValue, caretPos);
    const digits = normalizeRawPhoneDigits(meta.rawDigits, meta.startsWithPlus);
    const beforeCaretRaw = meta.rawDigits.slice(0, meta.digitsBeforeCaret);
    const digitsBeforeCaret = normalizeRawPhoneDigits(beforeCaretRaw, meta.startsWithPlus).length;

    return {
      digits,
      digitsBeforeCaret: Math.min(digitsBeforeCaret, digits.length)
    };
  };

  const formatPhoneDigits = (digits, withMap) => {
    const normalized = String(digits || '').replace(/\D/g, '').slice(0, 10);
    let out = '+7';
    const map = [out.length];

    if (normalized.length > 0) out += ' ';
    for (let i = 0; i < normalized.length; i += 1) {
      if (i === 3) out += ' ';
      if (i === 6 || i === 8) out += '-';
      out += normalized[i];
      map[i + 1] = out.length;
    }

    if (!withMap) return out;
    return { text: out, map };
  };

  const applyPhoneMask = inputEl => {
    if (!inputEl) return;
    const caret = typeof inputEl.selectionStart === 'number'
      ? inputEl.selectionStart
      : String(inputEl.value || '').length;
    const parsed = parsePhoneMaskInput(inputEl.value, caret);
    const formatted = formatPhoneDigits(parsed.digits, true);

    inputEl.value = formatted.text;
    const nextCaret = formatted.map[parsed.digitsBeforeCaret] || formatted.text.length;
    requestAnimationFrame(() => {
      if (!inputEl.isConnected) return;
      try {
        inputEl.setSelectionRange(nextCaret, nextCaret);
      } catch (_) {
        // mobile browsers can throw
      }
    });
  };

  const normalizePhoneForPayload = rawValue => {
    const parsed = parsePhoneMaskInput(rawValue, String(rawValue || '').length);
    if (parsed.digits.length !== 10) return null;
    return `+7${parsed.digits}`;
  };

  const applyContactCardState = () => {
    if (!contactCardEl) return;
    const state = getContactState();
    const textEl = contactCardEl.querySelector('.kxchat-contact-card-text');
    const phoneCheck = contactCardEl.querySelector('#kxchat-phone-check');
    const nameCheck = contactCardEl.querySelector('#kxchat-name-check');

    if (textEl) {
      if (state === 'complete') textEl.textContent = 'Данные для связи сохранены.';
      else if (state === 'name_only') textEl.textContent = 'Имя сохранено. Добавьте номер телефона.';
      else if (state === 'phone_only') textEl.textContent = 'Номер сохранён. Добавьте имя для обращения.';
      else textEl.textContent = 'Укажите имя и номер, чтобы юрист могла связаться с вами.';
    }

    if (phoneCheck) {
      phoneCheck.classList.toggle('visible', !!normalizePhoneForPayload(contactPhoneInput ? contactPhoneInput.value : ''));
    }
    if (nameCheck) {
      nameCheck.classList.toggle('visible', !!normalizeNameInput(contactNameInput ? contactNameInput.value : ''));
    }

    if (contactSubmitButton) {
      if (state === 'complete') {
        contactSubmitButton.disabled = true;
        contactSubmitButton.textContent = 'Спасибо !';
      } else {
        contactSubmitButton.disabled = false;
        contactSubmitButton.textContent = 'Отправить';
      }
    }
  };

  const scheduleIdlePrompt = (overrideDelayMs) => {
    clearIdlePromptTimer();
    if (!runtime.isOpen) return;
    if (getContactState() !== 'complete') return;
    if (runtime.hasUserMessages || runtime.contactIdlePromptSent || runtime.contactIdlePromptSuppressed) return;

    const delay = overrideDelayMs != null
      ? Math.max(overrideDelayMs, 1000)
      : (isMobileViewport() ? CONTACT_IDLE_PROMPT_MOBILE_MS : CONTACT_IDLE_PROMPT_DESKTOP_MS);

    idlePromptTimer = setTimeout(() => {
      idlePromptTimer = null;
      if (!runtime.isOpen) return;
      if (getContactState() !== 'complete') return;
      if (runtime.hasUserMessages || runtime.contactIdlePromptSent || runtime.contactIdlePromptSuppressed) return;
      if (textarea && textarea.value.trim()) return;

      const sinceInteraction = Date.now() - runtime.lastUserInteractionAt;
      if (sinceInteraction < CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS) {
        scheduleIdlePrompt(CONTACT_IDLE_PROMPT_INTERACTION_GUARD_MS - sinceInteraction + 800);
        return;
      }

      runtime.contactIdlePromptSent = true;
      addMessage('system', CONTACT_IDLE_TEXT, {
        scope: 'contact-idle',
        dedupeWindowMs: 600000
      });
    }, delay);
  };

  const scheduleReopen = cycleId => {
    clearReopenTimer();
    const delay = isMobileViewport() ? REOPEN_DELAY_MOBILE_MS : REOPEN_DELAY_DESKTOP_MS;
    autoReopenTimer = setTimeout(() => {
      autoReopenTimer = null;
      if (runtime.isOpen) return;
      if (cycleId !== runtime.closeCycleId) return;
      if (runtime.reopenShownCycleId === cycleId) return;

      const sinceInteraction = Date.now() - runtime.lastUserInteractionAt;
      if (sinceInteraction < REOPEN_INTERACTION_GUARD_MS) {
        scheduleReopen(cycleId);
        return;
      }

      openWidget({ auto: true });
      runtime.reopenShownCycleId = cycleId;
      addMessage('system', REOPEN_TEXT, {
        scope: `reopen:${cycleId}`,
        dedupeWindowMs: 600000
      });
    }, delay);
  };

  const addMessage = (rawRole, message, options = {}) => {
    const role = rawRole === 'operator' ? 'operator_ai' : rawRole;
    const text = String(message || '').trim();
    if (!text) return;

    const dedupeKey = getMessageDedupeKey(role, text, {
      messageId: options.messageId,
      createdAt: options.createdAt,
      scope: options.scope || 'default'
    });
    if (messageDedupeSet.has(dedupeKey)) return;
    messageDedupeSet.add(dedupeKey);

    const ts = parseCreatedAtToMs(options.createdAt) || Date.now();
    const messageEl = document.createElement('div');
    messageEl.className = `kxchat-message kxchat-message-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'kxchat-message-bubble';
    const label = role === 'visitor'
      ? '<div class="kxchat-bubble-label">Вы</div>'
      : '<div class="kxchat-bubble-label">Юридическая компания Кейс</div>';
    const status = role === 'visitor'
      ? '<span class="kxchat-message-checks is-sent"><span class="kxchat-check kxchat-check-1"></span></span>'
      : '';
    bubble.innerHTML = `
      ${label}
      <div class="kxchat-bubble-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="kxchat-meta">
        <span class="kxchat-time">${formatTimestamp(ts)}</span>
        ${status}
      </div>
    `;

    if (role === 'visitor') {
      if (quickRepliesEl) {
        quickRepliesEl.remove();
        quickRepliesEl = null;
      }
      messageEl.appendChild(bubble);
      const checksEl = bubble.querySelector('.kxchat-message-checks');
      if (checksEl) {
        setOutgoingCheckState(checksEl, false);
        const delay = runtime.sentVisitorCount === 0 ? CHECK_DELAY_FIRST_MS : CHECK_DELAY_NEXT_MS;
        runtime.sentVisitorCount += 1;
        scheduleOutgoingCheckTransition(checksEl, delay);
      }
      runtime.hasUserMessages = true;
      runtime.contactIdlePromptSuppressed = true;
      clearIdlePromptTimer();
    } else if (role === 'system') {
      messageEl.classList.add('kxchat-message-system-info');
      messageEl.appendChild(bubble);
    } else {
      const avatar = document.createElement('div');
      avatar.className = 'kxchat-avatar-small';
      avatar.innerHTML = '<img src="/assets/kxchat/avatar.png" decoding="async" alt="Юрист">';
      messageEl.appendChild(avatar);
      messageEl.appendChild(bubble);
    }

    if (options.messageId != null) {
      messageEl.dataset.messageId = String(options.messageId);
    }
    messageEl.dataset.role = role;
    messageEl.dataset.createdAt = String(ts);

    messagesContainer.appendChild(messageEl);

    if (!runtime.isOpen && role !== 'visitor' && !options.suppressUnread) {
      updateUnread(true);
    }

    if (normalizeText(text) === normalizeText(CONTACT_IDLE_TEXT)) {
      runtime.contactIdlePromptSent = true;
    }
    if (normalizeText(text) === normalizeText(REOPEN_TEXT)) {
      runtime.reopenShownCycleId = runtime.closeCycleId;
    }

    scrollToBottom();
  };

  const removeQuickReplies = () => {
    if (!quickRepliesEl) return;
    quickRepliesEl.remove();
    quickRepliesEl = null;
  };

  const ensureQuickReplies = () => {
    if (!messagesContainer) return;
    if (quickRepliesEl) return;
    if (runtime.hasUserMessages) return;
    if (!QUICK_REPLY_OPTIONS.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'kxchat-message kxchat-message-system kxchat-quick-replies';
    const buttons = QUICK_REPLY_OPTIONS
      .map(label => `<button class=\"kxchat-quick-reply\" type=\"button\" data-kxchat-quick=\"${escapeHtml(label)}\">${escapeHtml(label)}</button>`)
      .join('');
    wrap.innerHTML = `<div class=\"kxchat-quick-replies-wrap\">${buttons}</div>`;
    messagesContainer.appendChild(wrap);
    quickRepliesEl = wrap;

    wrap.querySelectorAll('[data-kxchat-quick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = String(btn.getAttribute('data-kxchat-quick') || '').trim();
        if (!value || !textarea) return;
        textarea.value = value;
        handleTextareaInput();
        sendMessage();
      });
    });

    scrollToBottom();
  };

  const queueAssistantMessage = payload => {
    assistantQueue.push(payload);
    processAssistantQueue();
  };

  const processAssistantQueue = () => {
    if (assistantRenderActive) return;
    if (!assistantQueue.length) return;

    const payload = assistantQueue.shift();
    const text = String(payload.message || '').trim();
    if (!text) {
      processAssistantQueue();
      return;
    }

    assistantRenderActive = true;
    const timing = payload.withTyping === false
      ? { startDelay: 0, duration: 0 }
      : getTypingTiming(text);

    let startDelay = timing.startDelay;
    if (payload && Number.isFinite(payload.earliestStartAt) && payload.earliestStartAt > 0) {
      const gap = payload.earliestStartAt - Date.now();
      if (gap > 0) {
        startDelay = Math.max(startDelay, gap);
      } else {
        startDelay = 180;
      }
    }

    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        addMessage(payload.role || 'operator_ai', text, {
          createdAt: payload.createdAt || Date.now(),
          messageId: payload.messageId || null,
          scope: payload.scope || 'assistant'
        });
        assistantRenderActive = false;
        processAssistantQueue();
      }, timing.duration);
    }, startDelay);
  };

  const buildApiUrl = (path, base) => normalizeBase(base) + String(path || '');

  const fetchWithApiFallback = async (path, initOptions) => {
    const candidates = [...new Set([activeApiBase, ...API_BASE_CANDIDATES])].filter(Boolean);
    let lastError = null;
    const shouldFallbackByStatus = status => status === 404 || status === 405 || status >= 500;

    for (let i = 0; i < candidates.length; i += 1) {
      const base = candidates[i];
      try {
        const response = await fetch(buildApiUrl(path, base), initOptions);
        if (!response.ok && shouldFallbackByStatus(response.status)) {
          lastError = new Error('HTTP_' + response.status);
          continue;
        }
        activeApiBase = base;
        return response;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Network error');
  };

  const resolveEmergencyTopicFromContext = pageContext => {
    const ctx = pageContext && typeof pageContext === 'object' ? pageContext : {};
    const explicit = [ctx.topic_key, ctx.issue_type, ctx.practice_area, ctx.page_group, ctx.page_summary]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (/broker|брокер|scam\/broker/.test(explicit)) return 'broker';
    if (/hack|взлом|unauthorized_credit|кредит|scam\/hack|scam\/pressure/.test(explicit)) return 'hack';
    if (/zpp|refund|возврат|consumer|медицин|товар|услуг/.test(explicit)) return 'consumer';
    if (/auto|dkp|дкп|дтп|осаго|каско/.test(explicit)) return 'auto';
    return null;
  };

  const resolveEmergencyTopicFromMessage = message => {
    const text = String(message || '').trim().toLowerCase();
    if (!text) return null;
    if (/(^|\s)(добрый\s+день|здравствуйте|привет)($|\s)/i.test(text)) return 'greeting';
    if (/(брокер|broker|не\s*вывод|вывести\s+деньги|платформ)/i.test(text)) return 'broker';
    if (/(взлом|взломали|без\s+согласия|кредит|госуслуг|под\s+влиянием|давили)/i.test(text)) return 'hack';
    if (/(перев[её]л|перевод|на\s+карту|карта\s+физлица|p2p)/i.test(text)) return 'transfer';
    if (/(возврат|брак|услуг|подрядчик|исполнитель|медицин)/i.test(text)) return 'consumer';
    if (/(дкп|авто|дтп|осаго|каско|навязанн)/i.test(text)) return 'auto';
    return null;
  };

  const buildEmergencyFallbackReply = (message, pageContext, fallbackKind) => {
    const messageTopic = resolveEmergencyTopicFromMessage(message);
    const contextTopic = resolveEmergencyTopicFromContext(pageContext);
    const topic = messageTopic || runtime.lastReplyTopic || contextTopic;
    if (topic === 'greeting') return 'Здравствуйте. Коротко расскажите, что у вас произошло?';
    if (topic === 'broker') return 'Поняла. Это брокер или инвестиционная платформа?';
    if (topic === 'transfer') return 'Поняла. Деньги переводили на карту или через платформу?';
    if (topic === 'hack') return 'Поняла. Это связано со взломом или с кредитом без вашего согласия?';
    if (topic === 'consumer') return 'Поняла. Это вопрос по товару, услуге или возврату денег?';
    if (topic === 'auto') return 'Поняла. Это вопрос по ДКП, навязанным услугам или ДТП?';
    if (fallbackKind === 'empty-reply') return CLIENT_EMPTY_REPLY_FALLBACK_TEXT;
    return CLIENT_NETWORK_FALLBACK_TEXT;
  };

  const enqueueClientSafetyFallback = (kind = 'network', message = '', pageContext = null) => {
    const semanticReply = buildEmergencyFallbackReply(message, pageContext, kind);
    queueAssistantMessage({
      role: 'operator_ai',
      message: semanticReply,
      createdAt: Date.now(),
      scope: `client-fallback:${kind}`,
      earliestStartAt: runtime.nextAssistantEarliestAt || 0
    });
  };

  const collectLeadPayload = () => {
    const name = normalizeNameInput(contactNameInput ? contactNameInput.value : '') || leadData.name || null;
    const phone = normalizePhoneForPayload(contactPhoneInput ? contactPhoneInput.value : '') || leadData.phone || null;

    if (name) leadData.name = name;
    if (phone) leadData.phone = phone;
    applyContactCardState();

    return {
      visitorName: leadData.name || null,
      visitorPhone: leadData.phone || null
    };
  };

  const sendMessageToBackend = async message => {
    const leadPayload = collectLeadPayload();
    const pageContext = getCurrentPageContext();

    try {
      const response = await fetchWithApiFallback('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: runtime.sessionId,
          message,
          page: window.location.href,
          title: document.title,
          pageContext,
          visitorName: leadPayload.visitorName,
          visitorPhone: leadPayload.visitorPhone
        })
      });

      if (!response.ok) {
        throw new Error('HTTP_' + response.status);
      }

      const data = await response.json();
      if (data && data.ok && data.conversationId) {
        runtime.conversationId = data.conversationId;
        safeStorageSet(localStorage, STORAGE_CONVERSATION_ID, String(runtime.conversationId));
      }
      if (data && data.replyMeta && typeof data.replyMeta.topic === 'string' && data.replyMeta.topic.trim()) {
        runtime.lastReplyTopic = data.replyMeta.topic.trim();
      }

      const replyText = data && typeof data.reply === 'string' ? data.reply.trim() : '';
      if (!replyText) {
        enqueueClientSafetyFallback('empty-reply', message, pageContext);
        return;
      }

      queueAssistantMessage({
        role: 'operator_ai',
        message: replyText,
        messageId: data.replyMessageId || null,
        createdAt: data.replyCreatedAt || Date.now(),
        scope: 'rest-reply',
        earliestStartAt: runtime.nextAssistantEarliestAt || 0
      });
    } catch (_) {
      enqueueClientSafetyFallback('network', message, pageContext);
    }
  };

  const autoResizeTextarea = () => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleTextareaInput = () => {
    markUserInteraction();
    const value = textarea ? textarea.value.trim() : '';
    if (value && getContactState() === 'complete') {
      runtime.contactIdlePromptSuppressed = true;
      clearIdlePromptTimer();
    }
    if (sendButton) sendButton.disabled = !value;
    autoResizeTextarea();
  };

  const sendMessage = () => {
    markUserInteraction();
    const text = textarea ? textarea.value.trim() : '';
    if (!text) return;
    const checkDelay = runtime.sentVisitorCount === 0 ? CHECK_DELAY_FIRST_MS : CHECK_DELAY_NEXT_MS;
    runtime.nextAssistantEarliestAt = Date.now() + checkDelay + Math.round(randomInRange(1000, 2000));

    addMessage('visitor', text, {
      createdAt: Date.now(),
      scope: 'visitor-send'
    });

    if (textarea) textarea.value = '';
    if (sendButton) sendButton.disabled = true;
    autoResizeTextarea();
    sendMessageToBackend(text);
  };

  const handleContactSubmit = () => {
    const name = normalizeNameInput(contactNameInput ? contactNameInput.value : '');
    const phone = normalizePhoneForPayload(contactPhoneInput ? contactPhoneInput.value : '');
    const previousState = getContactState();

    if (name) leadData.name = name;
    if (phone) leadData.phone = phone;

    if (!leadData.name && !leadData.phone) {
      if (contactHint) {
        contactHint.textContent = 'Добавьте хотя бы имя или номер телефона.';
        contactHint.classList.add('error');
      }
      return;
    }

    if (contactHint) {
      contactHint.classList.remove('error');
      contactHint.textContent = '';
    }

    applyContactCardState();

    if (getContactState() === 'complete') {
      const shouldNotify = !runtime.leadCompletionNotified || previousState !== 'complete';
      runtime.leadCompletionNotified = true;
      runtime.contactIdlePromptSent = false;
      runtime.contactIdlePromptSuppressed = false;
      clearIdlePromptTimer();
      scheduleIdlePrompt();

      if (shouldNotify) {
        addMessage('system', CONTACT_SAVED_TEXT, {
          scope: 'contact-saved',
          dedupeWindowMs: 600000
        });
      }
      ensureQuickReplies();
      if (contactCardEl) {
        if (contactSubmitButton) {
          contactSubmitButton.disabled = true;
          contactSubmitButton.textContent = 'Спасибо !';
        }
        setTimeout(() => {
          if (!contactCardEl) return;
          contactCardEl.remove();
          contactCardEl = null;
          contactNameInput = null;
          contactPhoneInput = null;
          contactSubmitButton = null;
          contactHint = null;
        }, 420);
      }
    } else {
      clearIdlePromptTimer();
      if (contactHint) {
        if (getContactState() === 'name_only') contactHint.textContent = 'Имя сохранено. Добавьте номер телефона.';
        if (getContactState() === 'phone_only') contactHint.textContent = 'Номер сохранён. Добавьте имя для обращения.';
      }
    }
  };

  const ensureContactCard = () => {
    if (!messagesContainer) return;
    if (contactCardEl) return;
    if (getContactState() === 'complete') return;

    const card = document.createElement('div');
    card.className = 'kxchat-message kxchat-message-system kxchat-contact-card';
    card.innerHTML = `
      <div class="kxchat-message-bubble kxchat-contact-card-bubble">
        <div class="kxchat-contact-card-text">Укажите имя и номер, чтобы юрист могла связаться с вами.</div>
        <div class="kxchat-contact-card-fields">
          <div class="kxchat-contact-field phone-row">
            <input class="kxchat-contact-card-input phone-input" type="tel" autocomplete="tel" inputmode="numeric" id="kxchat-contact-phone" placeholder="+7 987 654-32-10" value="+7">
            <span class="kxchat-contact-check" id="kxchat-phone-check">✓</span>
          </div>
          <div class="kxchat-contact-field name-field" id="kxchat-name-field">
            <input class="kxchat-contact-card-input" type="text" autocomplete="name" id="kxchat-contact-name" placeholder="Имя">
            <span class="kxchat-contact-check" id="kxchat-name-check">✓</span>
          </div>
          <button class="kxchat-contact-card-submit" type="button" id="kxchat-contact-submit">Отправить</button>
        </div>
        <div class="kxchat-contact-card-hint" id="kxchat-contact-hint"></div>
      </div>
    `;

    messagesContainer.appendChild(card);
    contactCardEl = card;
    contactPhoneInput = card.querySelector('#kxchat-contact-phone');
    contactNameInput = card.querySelector('#kxchat-contact-name');
    contactSubmitButton = card.querySelector('#kxchat-contact-submit');
    contactHint = card.querySelector('#kxchat-contact-hint');

    if (contactPhoneInput) {
      contactPhoneInput.addEventListener('focus', () => {
        if (!contactPhoneInput.value || contactPhoneInput.value === '+') {
          contactPhoneInput.value = '+7';
        }
      });
      contactPhoneInput.addEventListener('input', () => {
        applyPhoneMask(contactPhoneInput);
        applyContactCardState();
      });
      contactPhoneInput.addEventListener('paste', () => {
        requestAnimationFrame(() => {
          applyPhoneMask(contactPhoneInput);
          applyContactCardState();
        });
      });
      contactPhoneInput.addEventListener('keydown', () => {
        runtime.contactIdlePromptSuppressed = true;
        clearIdlePromptTimer();
      });
    }

    if (contactNameInput) {
      contactNameInput.addEventListener('input', () => {
        applyContactCardState();
      });
    }

    if (contactSubmitButton) {
      contactSubmitButton.addEventListener('click', () => {
        markUserInteraction();
        handleContactSubmit();
      });
    }

    if (leadData.name && contactNameInput) {
      contactNameInput.value = leadData.name;
    }
    if (leadData.phone && contactPhoneInput) {
      contactPhoneInput.value = formatPhoneDigits(leadData.phone.replace(/\D/g, '').slice(-10));
    }

    applyContactCardState();
    scrollToBottom();
  };

  const openWidget = options => {
    if (runtime.isOpen) {
      scrollToBottom(true);
      return;
    }
    runtime.isOpen = true;
    clearReopenTimer();
    if (widget) widget.classList.add('open');
    if (launcher) launcher.classList.add('hidden');
    updateUnread(false);
    ensureContactCard();
    ensureQuickReplies();
    scrollToBottom(true);
    if (!(options && options.auto)) markUserInteraction();
    scheduleIdlePrompt();
  };

  const closeWidget = options => {
    if (!runtime.isOpen) return;
    runtime.isOpen = false;
    if (widget) widget.classList.remove('open');
    if (launcher) launcher.classList.remove('hidden');
    clearIdlePromptTimer();

    if (options && options.manual) {
      markUserInteraction();
      runtime.closeCycleId += 1;
      runtime.reopenShownCycleId = null;
      scheduleReopen(runtime.closeCycleId);
    }
  };

  const toggleWidget = () => {
    if (runtime.isOpen) closeWidget({ manual: true });
    else openWidget({ auto: false });
  };

  const canAutoOpenWidgetNow = () => {
    if (runtime.isOpen) return false;
    if (!widget || !launcher) return false;
    if (document.body.classList.contains('modal-open')) return false;
    if (document.querySelector('.keis-success-modal.is-open')) return false;
    return true;
  };

  const scheduleAutoOpen = () => {
    const alreadyOpened = safeStorageGet(sessionStorage, STORAGE_AUTO_OPENED) === '1';
    if (alreadyOpened) return;

    const delay = isMobileViewport() ? AUTO_OPEN_DELAY_MOBILE_MS : AUTO_OPEN_DELAY_DESKTOP_MS;
    setTimeout(() => {
      if (!canAutoOpenWidgetNow()) return;
      openWidget({ auto: true });
      safeStorageSet(sessionStorage, STORAGE_AUTO_OPENED, '1');
    }, delay);
  };

  const addGreetingIfNeeded = () => {
    const key = 'local:greeting:v4';
    if (messageDedupeSet.has(key)) return;
    messageDedupeSet.add(key);
    addMessage('operator_ai', GREETING_TEXT, {
      messageId: key,
      createdAt: Date.now(),
      scope: 'greeting',
      suppressUnread: true
    });
  };

  const createWidget = () => {
    const html = `
      <div class="kxchat-widget" id="kxchat-widget">
        <div class="kxchat-header">
          <div class="kxchat-left">
            <div class="kxchat-avatar" id="kxchat-avatar">
              <img src="/assets/kxchat/avatar.png" loading="eager" decoding="async" alt="Ольга Сергеевна — Юрист">
            </div>
          </div>
          <div class="kxchat-brand">
            <h3 class="kxchat-brand-title">Ольга Сергеевна</h3>
            <div class="kxchat-brand-subblock">
              <p class="kxchat-brand-specialty">Юрист по делам о мошенничестве</p>
              <p class="kxchat-brand-company">Юридической компании КЕЙС</p>
            </div>
          </div>
          <div class="kxchat-right-top">
            <div class="kxchat-brand-status">
              <span class="kxchat-status-dot"></span>
              На связи
            </div>
          </div>
        </div>
        <div class="kxchat-messages" id="kxchat-messages"></div>
        <div class="kxchat-input-area">
          <div class="kxchat-input-group">
            <textarea class="kxchat-textarea" id="kxchat-textarea" placeholder="Напишите, что произошло..." rows="1"></textarea>
            <button class="kxchat-send" id="kxchat-send" disabled>
              <svg class="kxchat-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <p class="kxchat-helper">Все данные передаются безопасно и конфиденциально</p>
        </div>
        <button class="kxchat-shell-close" id="kxchat-close" aria-label="Закрыть чат" type="button">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" />
          </svg>
        </button>
      </div>
      <button class="kxchat-launcher" id="kxchat-launcher" type="button" aria-label="Открыть чат">
        <svg class="kxchat-launcher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="kxchat-unread" id="kxchat-unread" style="display:none;"></span>
      </button>
    `;

    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) document.body.appendChild(temp.firstChild);

    widget = document.getElementById('kxchat-widget');
    launcher = document.getElementById('kxchat-launcher');
    messagesContainer = document.getElementById('kxchat-messages');
    textarea = document.getElementById('kxchat-textarea');
    sendButton = document.getElementById('kxchat-send');

    if (launcher) launcher.addEventListener('click', () => {
      markUserInteraction();
      toggleWidget();
    });
    const closeBtn = document.getElementById('kxchat-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeWidget({ manual: true }));
    if (textarea) {
      textarea.addEventListener('input', handleTextareaInput);
      textarea.addEventListener('focus', () => {
        markUserInteraction();
        ensureContactCard();
      });
      textarea.addEventListener('keydown', event => {
        markUserInteraction();
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          if (sendButton && !sendButton.disabled) sendMessage();
        }
      });
    }
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        markUserInteraction();
        sendMessage();
      });
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && runtime.isOpen) {
        closeWidget({ manual: true });
      }
    });

    if (messagesContainer) {
      messagesContainer.addEventListener('click', () => {
        markUserInteraction();
      });
    }
  };

  const loadHistory = async () => {
    if (!runtime.conversationId) return false;

    try {
      const response = await fetchWithApiFallback(`/api/conversations/${runtime.conversationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          safeStorageRemove(localStorage, STORAGE_CONVERSATION_ID);
          runtime.conversationId = null;
          return false;
        }
        throw new Error('history-http');
      }

      const data = await response.json();
      if (!data || !data.ok || !data.data || !Array.isArray(data.data.messages)) return false;

      if (data.data.conversation) {
        const c = data.data.conversation;
        const name = normalizeNameInput(c.visitor_name || '');
        const phone = normalizePhoneForPayload(c.visitor_phone || '');
        if (name) leadData.name = name;
        if (phone) leadData.phone = phone;
      }

      messagesContainer.innerHTML = '';
      quickRepliesEl = null;
      messageDedupeSet.clear();
      runtime.sentVisitorCount = 0;
      runtime.unreadCount = 0;
      runtime.hasUserMessages = false;

      data.data.messages.forEach(msg => {
        addMessage(msg.role, msg.message, {
          createdAt: msg.created_at,
          messageId: msg.id,
          scope: 'history',
          suppressUnread: true
        });
      });

      runtime.hasUserMessages = data.data.messages.some(msg => msg.role === 'visitor');
      runtime.leadCompletionNotified = getContactState() === 'complete';
      runtime.contactIdlePromptSuppressed = runtime.hasUserMessages || getContactState() === 'complete';
      runtime.historyLoaded = true;
      updateUnread(false);
      return data.data.messages.length > 0;
    } catch (_) {
      return false;
    }
  };

  const initSessionAndContext = () => {
    const storedSession = safeStorageGet(localStorage, STORAGE_SESSION_ID);
    runtime.sessionId = storedSession || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    safeStorageSet(localStorage, STORAGE_SESSION_ID, runtime.sessionId);

    const storedConversation = safeStorageGet(localStorage, STORAGE_CONVERSATION_ID);
    runtime.conversationId = storedConversation ? Number(storedConversation) || storedConversation : null;
  };

  const init = async () => {
    initSessionAndContext();
    createWidget();

    const hasHistory = await loadHistory();
    if (!hasHistory) addGreetingIfNeeded();

    ensureContactCard();
    applyContactCardState();
    ensureQuickReplies();
    scrollToBottom(true);

    updateSafeBottomOffset();
    window.addEventListener('resize', updateSafeBottomOffset, { passive: true });
    window.addEventListener('orientationchange', updateSafeBottomOffset, { passive: true });
    scheduleAutoOpen();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof window !== 'undefined') {
    window.__KXCHAT_TEST_API__ = {
      addMessage,
      queueAssistantMessage,
      openWidget,
      closeWidget,
      parsePhoneMaskInput,
      formatPhoneDigits,
      normalizePhoneForPayload
    };
  }
})();
  const QUICK_REPLY_OPTIONS = [
    'Нужна консультация',
    'Хочу описать ситуацию',
    'Как к вам подъехать?'
  ];
