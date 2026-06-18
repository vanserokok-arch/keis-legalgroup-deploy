(function initNewsPage() {
  const pageRoot = document.body;
  if (!pageRoot || pageRoot.dataset.page !== 'news') return;

  const BATCH_SIZE = 10;
  const MAX_ITEMS = 40;
  const FETCH_TIMEOUT_MS = 12000;
  const SYNC_INTERVAL_MS = 600000; // 10 min — только тихая синхронизация с сервера
  const PRIMARY_ENDPOINT = '/news/index.php?ajax=1';
  const STATIC_ENDPOINTS = ['./news.json', '/news/news.json', './news-cache.json', '/news/news-cache.json'];
  const PROXY_ENDPOINT = '/news/proxy.php';

  const refs = {
    list: document.getElementById('newsList'),
    status: document.getElementById('newsStatus'),
    search: document.getElementById('newsSearch'),
    sourceWrap: document.getElementById('newsSourceWrap'),
    sourceFilter: document.getElementById('newsSourceFilter'),
    loadMoreWrap: document.getElementById('newsLoadMoreWrap'),
    loadMoreBtn: document.getElementById('newsLoadMoreBtn')
  };

  if (!refs.list || !refs.status || !refs.search || !refs.sourceFilter || !refs.loadMoreWrap || !refs.loadMoreBtn) {
    return;
  }

  const state = {
    items: [],
    filtered: [],
    visibleCount: BATCH_SIZE,
    isLoading: false,
    phpUnavailable: true,
    lastProxySourceStatuses: null
  };
  let isNewsVisible = true;

  const escapeAttr = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const normalizeText = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
  };

  const setStatus = (text, mode) => {
    refs.status.textContent = text || '';
    refs.status.classList.remove('is-error', 'is-info', 'is-empty');
    if (mode) refs.status.classList.add(mode);
  };

  const formatUpdatedTime = () => {
    return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getItemKey = (item) => (item && (item.url || item.id)) || '';

  const normalizeItem = (item, index) => {
    const title = normalizeText(item?.title) || 'Без заголовка';
    const summary = normalizeText(item?.summary) || 'Краткое описание пока недоступно.';
    const source = normalizeText(item?.source) || 'Источник';
    const dateHuman = normalizeText(item?.dateHuman) || 'Дата не указана';
    const dateISO = normalizeText(item?.dateISO);
    const rawUrl = normalizeText(item?.url);

    let url = '';
    try {
      url = rawUrl ? new URL(rawUrl, window.location.origin).toString() : '';
    } catch (error) {
      url = '';
    }

    return {
      id: normalizeText(item?.id) || `news-${index}`,
      title,
      summary,
      source,
      dateHuman,
      dateISO,
      url
    };
  };

  const extractPayload = (payload) => {
    if (Array.isArray(payload)) {
      return {
        items: payload
      };
    }

    if (payload && typeof payload === 'object') {
      return {
        items: Array.isArray(payload.items) ? payload.items : []
      };
    }

    return { items: [] };
  };

  const fillSourceFilter = (preferredValue, proxySourceStatuses = null) => {
    const fromItems = [...new Set(state.items.map((item) => item.source).filter(Boolean))];
    let sourceSet = new Set(fromItems);
    if (proxySourceStatuses && typeof proxySourceStatuses === 'object') {
      Object.values(proxySourceStatuses).forEach((st) => {
        const name = st && typeof st.name === 'string' ? st.name.trim() : '';
        if (!name) return;
        if (sourceSet.has(name)) return;
        sourceSet.add(name);
      });
    }
    const sources = Array.from(sourceSet);
    const options = ['<option value="all">Все источники</option>', ...sources.map((source) => {
      const fromItemsHas = fromItems.includes(source);
      const label = fromItemsHas ? source : (source + ' (нет данных)');
      const disabledAttr = fromItemsHas ? '' : ' disabled';
      return `<option value="${escapeAttr(source)}"${disabledAttr}>${escapeHtml(label)}</option>`;
    })];
    refs.sourceFilter.innerHTML = options.join('');

    if (preferredValue && [...refs.sourceFilter.options].some((option) => option.value === preferredValue)) {
      refs.sourceFilter.value = preferredValue;
    } else {
      refs.sourceFilter.value = 'all';
    }

    refs.sourceWrap.hidden = sources.length <= 1;
  };

  const applyFilters = () => {
    const query = refs.search.value.trim().toLowerCase();
    const source = refs.sourceFilter.value;

    state.filtered = state.items.filter((item) => {
      const titleOk = !query || item.title.toLowerCase().includes(query);
      const sourceOk = source === 'all' || item.source === source;
      return titleOk && sourceOk;
    });

    if (state.visibleCount < BATCH_SIZE) {
      state.visibleCount = BATCH_SIZE;
    }

    renderList();
  };

  const renderList = () => {
    if (state.filtered.length === 0) {
      refs.list.innerHTML = '';
      refs.list.setAttribute('aria-busy', 'false');
      refs.loadMoreWrap.hidden = true;
      setStatus('По вашему запросу ничего не найдено.', 'is-empty');
      return;
    }

    const visible = state.filtered.slice(0, Math.min(state.visibleCount, state.filtered.length));

    refs.list.innerHTML = visible.map((item) => {
      const dateMarkup = item.dateISO
        ? `<time class="kg-news-card__date" datetime="${escapeAttr(item.dateISO)}">${escapeHtml(item.dateHuman)}</time>`
        : `<span class="kg-news-card__date">${escapeHtml(item.dateHuman)}</span>`;
      const sourceLink = item.url
        ? `<a class="kg-news-card__link" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">Читать в источнике</a>`
        : '';
      const actionsMarkup = sourceLink
        ? `<div class="kg-news-card__actions">${sourceLink}</div>`
        : '';
      const newsKey = item.url || item.id;
      const dataAttrs = newsKey ? ` data-news-id="${escapeAttr(item.id)}" data-news-url="${escapeAttr(item.url || '')}"` : '';

      return `
        <li class="kg-news-card"${dataAttrs}>
          <p class="kg-news-card__meta">
            <span class="kg-news-card__source">${escapeHtml(item.source)}</span>
            ${dateMarkup}
          </p>
          <h2 class="kg-news-card__title">${escapeHtml(item.title)}</h2>
          <p class="kg-news-card__summary">${escapeHtml(item.summary)}</p>
          ${actionsMarkup}
        </li>
      `;
    }).join('');

    refs.list.setAttribute('aria-busy', 'false');
    refs.loadMoreWrap.hidden = visible.length >= state.filtered.length;
    refs.loadMoreBtn.disabled = visible.length >= state.filtered.length;
    setStatus('', '');
  };

  const handleError = (message) => {
    if (state.items.length === 0) {
      refs.list.innerHTML = '';
      refs.list.setAttribute('aria-busy', 'false');
      refs.loadMoreWrap.hidden = true;
      setStatus(message || 'Не удалось загрузить новости. Попробуйте позже.', 'is-error');
      return;
    }
    setStatus(message || '', message ? 'is-info' : '');
  };

  const fetchJson = async (endpoint, { cache = 'no-store' } = {}) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache,
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const buildItems = (rawPayload) => {
    const payload = extractPayload(rawPayload);
    return payload.items
      .map(normalizeItem)
      .filter((item) => Boolean(item.title))
      .sort((a, b) => {
        const aTime = Date.parse(a.dateISO || '') || 0;
        const bTime = Date.parse(b.dateISO || '') || 0;
        return bTime - aTime;
      })
      .slice(0, MAX_ITEMS);
  };

  const applyLoadedItems = (items, { keepState = false } = {}) => {
    state.items = items;
    if (state.items.length === 0) {
      refs.list.innerHTML = '';
      refs.list.setAttribute('aria-busy', 'false');
      refs.loadMoreWrap.hidden = true;
      setStatus('Пока новостей нет. Загляните позже.', 'is-empty');
      return;
    }

    const previousState = {
      query: refs.search.value,
      source: refs.sourceFilter.value,
      visibleCount: state.visibleCount,
      scrollY: window.scrollY
    };

    fillSourceFilter(keepState ? previousState.source : 'all', state.lastProxySourceStatuses);
    refs.search.value = keepState ? previousState.query : '';
    state.visibleCount = keepState ? Math.min(previousState.visibleCount, MAX_ITEMS) : BATCH_SIZE;
    applyFilters();

    if (keepState) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: previousState.scrollY, behavior: 'auto' });
      });
    }
  };

  /** Один элемент списка в HTML (как в renderList) */
  const cardToHtml = (item) => {
    const dateMarkup = item.dateISO
      ? `<time class="kg-news-card__date" datetime="${escapeAttr(item.dateISO)}">${escapeHtml(item.dateHuman)}</time>`
      : `<span class="kg-news-card__date">${escapeHtml(item.dateHuman)}</span>`;
    const sourceLink = item.url
      ? `<a class="kg-news-card__link" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">Читать в источнике</a>`
      : '';
    const actionsMarkup = sourceLink ? `<div class="kg-news-card__actions">${sourceLink}</div>` : '';
    const dataAttrs = (item.url || item.id) ? ` data-news-id="${escapeAttr(item.id)}" data-news-url="${escapeAttr(item.url || '')}"` : '';
    return `<li class="kg-news-card"${dataAttrs}>
  <p class="kg-news-card__meta">
    <span class="kg-news-card__source">${escapeHtml(item.source)}</span>
    ${dateMarkup}
  </p>
  <h2 class="kg-news-card__title">${escapeHtml(item.title)}</h2>
  <p class="kg-news-card__summary">${escapeHtml(item.summary)}</p>
  ${actionsMarkup}
</li>`;
  };

  /** Добавить только новые карточки сверху без полного ре-рендера */
  const prependNewCards = (newItems) => {
    if (!newItems.length) return;
    const fragment = document.createDocumentFragment();
    const parser = new DOMParser();
    for (const item of newItems) {
      const doc = parser.parseFromString(cardToHtml(item), 'text/html');
      const li = doc.body.firstChild;
      if (li) fragment.appendChild(li);
    }
    refs.list.insertBefore(fragment, refs.list.firstChild);
    state.visibleCount += newItems.length;
    setStatus('Обновлено: ' + formatUpdatedTime(), 'is-info');
  };

  /** Первая загрузка: primary endpoint (быстрый кеш), при недоступности — статика */
  const loadInitial = async () => {
    if (state.isLoading) return;
    state.isLoading = true;
    refs.list.setAttribute('aria-busy', 'true');

    try {
      const data = await fetchJson(PRIMARY_ENDPOINT, { cache: 'default' });
      const items = buildItems(data);
      if (items.length > 0) {
        state.phpUnavailable = false;
        state.lastProxySourceStatuses = (data && data.sourceStatuses && typeof data.sourceStatuses === 'object') ? data.sourceStatuses : null;
        applyLoadedItems(items, { keepState: false });
        refs.list.setAttribute('aria-busy', 'false');
        state.isLoading = false;
        startSilentSync();
        return;
      }
    } catch (_) {
      /* primary недоступен (например локальный статик без PHP) — fallback */
    }

    state.phpUnavailable = true;
    let staticPayload = null;
    for (const endpoint of STATIC_ENDPOINTS) {
      try {
        staticPayload = await fetchJson(endpoint, { cache: 'no-store' });
        break;
      } catch {
        continue;
      }
    }

    if (staticPayload) {
      state.lastProxySourceStatuses = (staticPayload && staticPayload.sourceStatuses && typeof staticPayload.sourceStatuses === 'object') ? staticPayload.sourceStatuses : null;
      applyLoadedItems(buildItems(staticPayload), { keepState: false });
      setStatus('', '');
    } else {
      handleError('Не удалось загрузить новости. Проверьте /news/news.json или доступность сервера.');
    }
    refs.list.setAttribute('aria-busy', 'false');
    state.isLoading = false;
    startSilentSync();
  };

  let syncTimerId = 0;

  const clearSyncTimer = () => {
    if (syncTimerId) {
      clearTimeout(syncTimerId);
      syncTimerId = 0;
    }
  };

  /** Тихая синхронизация: раз в 10 мин запрос proxy (без force), только новые — в начало списка */
  const runSilentSync = async () => {
    if (document.hidden || !isNewsVisible || state.isLoading) return;
    try {
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) return;
      const ct = (response.headers.get('Content-Type') || '').toLowerCase();
      if (!ct.includes('application/json')) return;
      const data = await response.json();
      if (!data || !Array.isArray(data.items)) return;
      const freshItems = buildItems(data);
      const existingKeys = new Set(state.items.map(getItemKey));
      const newItems = freshItems.filter((item) => !existingKeys.has(getItemKey(item)));
      if (newItems.length > 0) {
        state.items = [...newItems, ...state.items];
        state.lastProxySourceStatuses = (data.sourceStatuses && typeof data.sourceStatuses === 'object') ? data.sourceStatuses : null;
        const query = refs.search.value.trim().toLowerCase();
        const source = refs.sourceFilter.value;
        state.filtered = state.items.filter((item) => {
          const titleOk = !query || item.title.toLowerCase().includes(query);
          const sourceOk = source === 'all' || item.source === source;
          return titleOk && sourceOk;
        });
        fillSourceFilter(refs.sourceFilter.value, state.lastProxySourceStatuses);
        const toPrepend = newItems.filter((item) => {
          const titleOk = !query || item.title.toLowerCase().includes(query);
          const sourceOk = source === 'all' || item.source === source;
          return titleOk && sourceOk;
        });
        prependNewCards(toPrepend);
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('News silent sync failed:', err);
      }
    } finally {
      scheduleSync();
    }
  };

  const scheduleSync = () => {
    clearSyncTimer();
    if (document.hidden || !isNewsVisible) return;
    syncTimerId = window.setTimeout(() => {
      syncTimerId = 0;
      runSilentSync();
    }, SYNC_INTERVAL_MS);
  };

  const startSilentSync = () => {
    scheduleSync();
  };

  refs.search.addEventListener('input', () => {
    state.visibleCount = BATCH_SIZE;
    applyFilters();
  });

  refs.sourceFilter.addEventListener('change', () => {
    state.visibleCount = BATCH_SIZE;
    applyFilters();
  });

  refs.loadMoreBtn.addEventListener('click', () => {
    state.visibleCount = Math.min(state.visibleCount + BATCH_SIZE, state.filtered.length, MAX_ITEMS);
    renderList();
  });

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== refs.list) return;
        isNewsVisible = entry.isIntersecting;
        if (!isNewsVisible) {
          clearSyncTimer();
          return;
        }
        scheduleSync();
      });
    }, {
      root: null,
      threshold: 0,
      rootMargin: '220px 0px 220px 0px'
    });
    visibilityObserver.observe(refs.list);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearSyncTimer();
      return;
    }
    scheduleSync();
  });

  loadInitial();
})();
