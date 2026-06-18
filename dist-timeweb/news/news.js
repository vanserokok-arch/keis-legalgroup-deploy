(function initNewsPage() {
  const pageRoot = document.body;
  if (!pageRoot || pageRoot.dataset.page !== 'news') return;

  const BATCH_SIZE = 9;
  const MAX_ITEMS = 40;
  const FETCH_TIMEOUT_MS = 12000;
  const SYNC_INTERVAL_MS = 600000;
  const PRIMARY_ENDPOINT = '/news/index.php?ajax=1';
  const STATIC_ENDPOINTS = ['./news.json', '/news/news.json', './news-cache.json', '/news/news-cache.json'];
  const PROXY_ENDPOINT = '/news/proxy.php';

  const RUBRICS = [
    'Все новости',
    'Кредиты и банки',
    'Мошенничество',
    'Защита прав потребителей',
    'Суды',
    'Недвижимость',
    'Автомобили',
    'Медицина',
    'Законы',
    'ЦБ РФ',
    'Прокуратура',
    'ФАС',
    'Роспотребнадзор'
  ];

  const CATEGORY_IMAGES = {
    'Все новости': '/assets/news/news-default.webp',
    'Кредиты и банки': '/assets/news/news-bank.webp',
    'Мошенничество': '/assets/news/news-fraud.webp',
    'Защита прав потребителей': '/assets/news/news-consumer.webp',
    'Суды': '/assets/news/news-court.webp',
    'Недвижимость': '/assets/news/news-real-estate.webp',
    'Автомобили': '/assets/news/news-auto.webp',
    'Медицина': '/assets/news/news-medical.webp',
    'Законы': '/assets/news/news-law.webp',
    'ЦБ РФ': '/assets/news/news-regulator.webp',
    'Прокуратура': '/assets/news/news-prosecutor.webp',
    'ФАС': '/assets/news/news-fas.webp',
    'Роспотребнадзор': '/assets/news/news-rospotreb.webp'
  };

  const EDITORIAL_IMAGE_SEQUENCE = [
    CATEGORY_IMAGES['ЦБ РФ'],
    CATEGORY_IMAGES['Кредиты и банки'],
    CATEGORY_IMAGES['Законы'],
    CATEGORY_IMAGES['Суды'],
    CATEGORY_IMAGES['Недвижимость'],
    CATEGORY_IMAGES['Защита прав потребителей'],
    CATEGORY_IMAGES['Прокуратура'],
    CATEGORY_IMAGES['Мошенничество'],
    CATEGORY_IMAGES['Все новости']
  ];

  const CATEGORY_COPY = {
    'Кредиты и банки': {
      summary: 'Изменения касаются банковских продуктов, ставок, лимитов или правил обслуживания. Для клиента это важно при кредите, вкладе, карте или споре с банком.',
      client: 'Проверьте договор, уведомления банка и платежный график. Если условия изменились без понятного основания, фиксируйте документы до обращения.'
    },
    'Мошенничество': {
      summary: 'Новость связана с переводами, картами, онлайн-сервисами или схемами обмана. В таких ситуациях важны скорость обращения и сохраненные доказательства.',
      client: 'Сохраните переписку, чеки, выписки и номера заявлений. Чем быстрее зафиксированы следы перевода, тем выше шанс выстроить позицию.'
    },
    'Защита прав потребителей': {
      summary: 'Изменение касается товаров, услуг, претензий, чеков или возврата денег. Для клиента ключевыми остаются сроки, доказательства и корректная претензия.',
      client: 'Соберите договор, чек, фото дефекта и переписку. До суда часто достаточно грамотно поданной претензии с расчетом требований.'
    },
    'Суды': {
      summary: 'Судебная практика уточняет, как применять нормы в спорах о деньгах, договорах, неустойке и ответственности сторон.',
      client: 'Сравните свою ситуацию с выводами суда: сроки, документы и поведение сторон часто решают больше, чем формальное название спора.'
    },
    'Недвижимость': {
      summary: 'Материал касается квартир, домов, регистрации, сделок или прав на недвижимость. Ошибка в документах может повлиять на деньги и сроки сделки.',
      client: 'Проверьте выписки, договор, оплату и историю объекта. Не подписывайте дополнительные бумаги, пока не понятны последствия.'
    },
    'Автомобили': {
      summary: 'Новость связана с автомобилями, ДТП, автокредитами, страховками или навязанными услугами при покупке.',
      client: 'Сохраните договор, акт приема, кредитные документы и переписку с продавцом. Отдельно проверьте платные опции и согласия.'
    },
    'Медицина': {
      summary: 'Изменение касается клиник, пациентов, медицинских документов или качества оказанной помощи.',
      client: 'Запросите медкарту, назначения и результаты обследований. Без документов сложно доказать ошибку или нарушение срока.'
    },
    'Законы': {
      summary: 'Опубликовано нормативное или правовое изменение. Для клиента важно понять, какие сроки и обязанности меняются на практике.',
      client: 'Проверьте, действует ли правило на вашу ситуацию сейчас или только после вступления в силу. От этого зависит порядок действий.'
    },
    'ЦБ РФ': {
      summary: 'Банк России обновил правила или данные для финансового рынка. Для обычных клиентов это может отразиться на ставках, кредитах и поведении банков.',
      client: 'Следите за уведомлениями банка и условиями действующих продуктов. При споре важны дата изменения и текст уведомления.'
    },
    'Прокуратура': {
      summary: 'Прокуратура сообщает о контроле, проверках или мерах реагирования. Это может быть важно, когда нарушены права граждан или сроки рассмотрения.',
      client: 'Если ситуация похожа на вашу, подготовьте обращение с документами и краткой хронологией. Чем точнее факты, тем проще проверить нарушение.'
    },
    'ФАС': {
      summary: 'Антимонопольная служба рассматривает рекламу, навязанные условия, конкуренцию и поведение компаний на рынке.',
      client: 'Проверьте, были ли навязанные услуги, скрытые платежи или спорная реклама. Сохраните скриншоты и договорные условия.'
    },
    'Роспотребнадзор': {
      summary: 'Роспотребнадзор разъясняет или проверяет вопросы качества товаров, услуг и защиты потребителей.',
      client: 'Для обращения понадобятся чек, договор, претензия и ответ продавца или исполнителя. Фиксируйте сроки и все контакты.'
    }
  };

  const CATEGORY_VARIANTS = {
    'Кредиты и банки': [
      {
        summary: 'Финансовые правила меняются не только для банков: такие решения постепенно отражаются на ставках, лимитах и условиях обслуживания клиентов.',
        client: 'Сверьте дату изменения с договором, графиком платежей и уведомлениями банка. Эти документы важны, если условия стали хуже.'
      },
      {
        summary: 'Регулятор уточняет порядок работы финансового рынка. Для клиента это сигнал внимательнее смотреть на кредит, вклад, карту или спор с банком.',
        client: 'Сохраните уведомления банка и текущие тарифы. В споре часто решает не сама новость, а то, как банк применил ее к вам.'
      }
    ],
    'Мошенничество': [
      {
        summary: 'Материал связан с переводами, картами и цифровыми схемами обмана. В таких делах важны первые часы после операции.',
        client: 'Зафиксируйте выписку, переписку, номера телефонов и обращения в банк. Не удаляйте личный кабинет и историю операций.'
      },
      {
        summary: 'Речь о рисках, которые возникают при дистанционных переводах и онлайн-сервисах. Чем точнее следы операции, тем сильнее позиция.',
        client: 'Соберите скриншоты, чеки, банковские ответы и номера заявлений. Эти данные нужны до претензии и до обращения в суд.'
      }
    ],
    'Защита прав потребителей': [
      {
        summary: 'Изменение касается покупки, услуги, претензии или возврата денег. На практике многое зависит от сроков и доказательств.',
        client: 'Держите вместе чек, договор, фото дефекта, акт и переписку. Претензию лучше подавать с расчетом суммы и сроков.'
      },
      {
        summary: 'Потребительские споры редко решаются одним звонком: важны документы, понятная хронология и корректно сформулированное требование.',
        client: 'До суда проверьте, есть ли письменный отказ, акт осмотра и подтверждение оплаты. Это ускоряет взыскание.'
      }
    ],
    'Суды': [
      {
        summary: 'Судебная практика показывает, какие аргументы работают в спорах о деньгах, договорах и ответственности сторон.',
        client: 'Сравните свою ситуацию с выводами суда: сроки, документы и поведение сторон часто важнее названия спора.'
      },
      {
        summary: 'Решение помогает понять, как суды смотрят на доказательства, неустойку и добросовестность участников спора.',
        client: 'Отдельно проверьте даты, переписку и подтверждение передачи денег или документов. Это основа позиции.'
      }
    ],
    'Законы': [
      {
        summary: 'Правило меняет порядок действий для граждан или организаций. Главное — понять срок вступления в силу и практические последствия.',
        client: 'Проверьте, действует ли норма уже сейчас. От даты зависит, что писать в претензии, жалобе или иске.'
      },
      {
        summary: 'Нормативное изменение важно не само по себе, а тем, какие обязанности, сроки или доказательства оно меняет.',
        client: 'Сопоставьте новую норму с вашим договором и документами. Если сроки уже идут, не откладывайте фиксацию нарушения.'
      }
    ]
  };

  const TITLE_RULES = [
    {
      test: /инсайдерская информация банка россии/,
      title: 'Банк России обновил раскрытие инсайдерской информации'
    },
    {
      test: /кредитование субъектов малого и среднего предпринимательства/,
      title: 'ЦБ опубликовал свежие данные по кредитованию малого бизнеса'
    },
    {
      test: /решения банка россии в отношении участников финансового рынка/,
      title: 'Банк России сообщил о решениях по участникам финансового рынка'
    },
    {
      test: /валютн(ый|ого) своп/,
      title: 'ЦБ уточнил условия валютных свопов'
    },
    {
      test: /депозит(ы|ных|н).*банк(е|а) россии|депозитн.*операц/,
      title: 'Банк России обновил порядок депозитных операций'
    },
    {
      test: /обеспечение по операциям репо/,
      title: 'Банк России обновил требования к обеспечению по РЕПО'
    },
    {
      test: /условия предоставления кредитов постоянного действия/,
      title: 'ЦБ уточнил условия постоянных кредитов для банков'
    },
    {
      test: /ценных бумагах.*обеспечение.*кредитам банка россии/,
      title: 'ЦБ обновил список бумаг для обеспечения по кредитам'
    },
    {
      test: /пострадавш.*атак/,
      title: 'Прокуратура контролирует соблюдение прав пострадавших'
    },
    {
      test: /меморандум о взаимопонимании/,
      title: 'Прокуратура расширяет международное сотрудничество'
    },
    {
      test: /pantone|товарн(ого|ый) знака/,
      title: 'Суд отказал в регистрации цвета Pantone как товарного знака'
    }
  ];

  const CONTEXT_RULES = [
    {
      test: /депозит|кредит|репо|своп|ключев|ставк|банк россии|цб/,
      summary: 'Регулятор обновляет условия для финансового рынка. Для клиентов это не всегда видно сразу, но такие решения влияют на ставки, лимиты и поведение банков.',
      client: 'Если у вас кредит, вклад или спор с банком, проверьте уведомления и дату изменения условий. Эти детали важны для претензии или расчета.'
    },
    {
      test: /прокуратур|пострадавш|провер(к|я)|нарушен/,
      summary: 'Прокуратура сообщает о проверке или мерах реагирования. Такие материалы помогают понять, какие нарушения государство считает значимыми.',
      client: 'Подготовьте краткую хронологию, документы и подтверждения ущерба. Это ускоряет проверку и снижает риск формального ответа.'
    },
    {
      test: /мошен|перевод|карта|онлайн-кредит|фишинг|обман/,
      summary: 'Материал связан с финансовыми рисками и переводами. В подобных историях решают скорость фиксации операции и качество доказательств.',
      client: 'Сразу сохраните выписку, переписку, номера телефонов и обращения в банк. Не удаляйте личный кабинет и историю операций.'
    },
    {
      test: /потребител|товар|услуг|чек|претенз|возврат/,
      summary: 'Изменение касается прав потребителей: качества товаров, услуг, возврата денег или порядка подачи требований.',
      client: 'Соберите чек, договор, фото, акт и переписку. До обращения в суд важно правильно посчитать сумму требований и сроки.'
    },
    {
      test: /суд|верховн|неустойк|решени|иск|доказательств/,
      summary: 'Судебная практика уточняет подход к спорным ситуациям. Это помогает заранее понять, какие доказательства и аргументы имеют вес.',
      client: 'Сравните факты своего дела с выводами суда. Если совпадают сроки, документы и поведение сторон, позиция может стать сильнее.'
    }
  ];

  const POPULAR_GUIDES = [
    {
      title: 'Как вернуть деньги за онлайн-кредит',
      category: 'Кредиты и банки',
      image: CATEGORY_IMAGES['Кредиты и банки'],
      url: '/scam/pressure/'
    },
    {
      title: 'Что делать, если банк навязал страховку',
      category: 'Защита прав потребителей',
      image: CATEGORY_IMAGES['Защита прав потребителей'],
      url: '/zpp/insurance/'
    },
    {
      title: 'Как снизить неустойку по кредиту',
      category: 'Суды',
      image: CATEGORY_IMAGES['Суды'],
      url: '/zpp/'
    },
    {
      title: 'Возврат товара без чека: какие доказательства помогут',
      category: 'Защита прав потребителей',
      image: CATEGORY_IMAGES['Защита прав потребителей'],
      url: '/zpp/refund/'
    },
    {
      title: 'Как защититься от мошенников после перевода',
      category: 'Мошенничество',
      image: CATEGORY_IMAGES['Мошенничество'],
      url: '/scam/'
    }
  ];

  const refs = {
    list: document.getElementById('newsList'),
    status: document.getElementById('newsStatus'),
    search: document.getElementById('newsSearch'),
    sourceWrap: document.getElementById('newsSourceWrap'),
    sourceFilter: document.getElementById('newsSourceFilter'),
    loadMoreWrap: document.getElementById('newsLoadMoreWrap'),
    loadMoreBtn: document.getElementById('newsLoadMoreBtn'),
    featured: document.getElementById('newsFeatured'),
    todayList: document.getElementById('newsTodayList'),
    popularTop: document.getElementById('newsPopularTop'),
    popularSidebar: document.getElementById('newsPopularSidebar'),
    lawChanges: document.getElementById('newsLawChanges'),
    resultCount: document.getElementById('newsResultCount'),
    categoryButtons: Array.from(document.querySelectorAll('[data-news-category]'))
  };

  if (!refs.list || !refs.status || !refs.search || !refs.sourceFilter || !refs.loadMoreWrap || !refs.loadMoreBtn) {
    return;
  }

  const state = {
    items: [],
    filtered: [],
    visibleCount: BATCH_SIZE,
    activeCategory: 'Все новости',
    isLoading: false,
    phpUnavailable: true,
    lastProxySourceStatuses: null
  };
  let isNewsVisible = true;
  let syncTimerId = 0;

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

  const normalizeMultiline = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\r/g, '').trim();
  };

  const clampText = (value, maxLength = 220) => {
    const text = normalizeText(value);
    if (text.length <= maxLength) return text;
    const slice = text.slice(0, maxLength - 3);
    const softCut = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf(';'), slice.lastIndexOf(','), slice.lastIndexOf(' '));
    return `${slice.slice(0, softCut > 120 ? softCut : maxLength - 3).trim()}...`;
  };

  const setStatus = (text, mode) => {
    refs.status.textContent = text || '';
    refs.status.classList.remove('is-error', 'is-info', 'is-empty', 'is-warn');
    refs.status.hidden = !text;
    if (mode) refs.status.classList.add(mode);
  };

  const formatUpdatedTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const getItemKey = (item) => (item && (item.url || item.id)) || '';

  const getHaystack = (item) => [
    item?.title,
    item?.summary,
    item?.source,
    item?.keisNote,
    item?.keisNoteAuto,
    item?.category
  ].filter(Boolean).join(' ').toLowerCase();

  const detectCategory = (item) => {
    const title = normalizeText(item?.title).toLowerCase();
    const source = normalizeText(item?.source).toLowerCase();
    const haystack = getHaystack(item);
    const has = (...parts) => parts.some((part) => haystack.includes(part));

    if (has('роспотребнадзор')) return 'Роспотребнадзор';
    if (has('генпрокуратур', 'прокуратур')) return 'Прокуратура';
    if (/(^|[^а-яё])фас([^а-яё]|$)/i.test(haystack) || has('антимонополь')) return 'ФАС';
    if (source.includes('цб') || has('банк россии', 'ключев', 'репо', 'депозит', 'валютный своп', 'финансового рынка')) return 'ЦБ РФ';
    if (has('мошен', 'фишинг', 'дроппер', 'обман', 'перевод под влиянием', 'украли деньги')) return 'Мошенничество';
    if (has('кредит', 'заем', 'займ', 'банк', 'вклад', 'ставк', 'мфо', 'страхов')) return 'Кредиты и банки';
    if (has('потребител', 'товар', 'услуг', 'чек', 'претенз', 'возврат товара', 'исполнитель услуг')) return 'Защита прав потребителей';
    if (/(^|[^а-яё])(суд|вс рф|иск|апелляц|кассац)([^а-яё]|$)|судебн|верховн|неустойк|решени[ея]\s+(суда|судебн)/i.test(haystack)) return 'Суды';
    if (has('недвижим', 'квартир', 'дом', 'регистрац', 'ипотек', 'застройщик')) return 'Недвижимость';
    if (has('автомоб', 'дтп', 'автокредит', 'осаго', 'каско', 'дилер', 'навязанн')) return 'Автомобили';
    if (has('медицин', 'клиник', 'пациент', 'врач', 'медкарт', 'лечение')) return 'Медицина';
    if (has('закон', 'кодекс', 'госдума', 'правительств', 'норматив', 'постановлен')) return 'Законы';
    if (title.includes('право') || source.includes('право')) return 'Законы';
    return 'Законы';
  };

  const parseKeisNote = (item) => {
    const raw = normalizeMultiline(item?.keisNote || item?.keisNoteAuto);
    const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const pick = (label) => {
      const line = lines.find((part) => part.toLowerCase().startsWith(label.toLowerCase()));
      return line ? normalizeText(line.replace(new RegExp(`^${label}\\s*:?\\s*`, 'i'), '')) : '';
    };
    return {
      happened: pick('Что произошло'),
      audience: pick('Кому важно'),
      step: pick('Практический шаг')
    };
  };

  const buildTitle = (rawTitle) => {
    const title = normalizeText(rawTitle) || 'Новость без заголовка';
    const lower = title.toLowerCase();
    const rule = TITLE_RULES.find((item) => item.test.test(lower));
    if (rule) return rule.title;
    return clampText(title.replace(/^официально:\s*/i, ''), 112);
  };

  const buildContext = (rawItem, category, title, note, index = 0) => {
    const haystack = getHaystack(rawItem);
    const rule = CONTEXT_RULES.find((item) => item.test.test(haystack));
    const categoryCopy = CATEGORY_COPY[category] || CATEGORY_COPY['Законы'];
    const variants = CATEGORY_VARIANTS[category] || CATEGORY_VARIANTS['Законы'] || [];
    const variant = variants.length > 0 ? variants[index % variants.length] : null;
    const rawSummary = normalizeText(rawItem?.summary);
    const summaryLooksUseful = rawSummary.length >= 80 && !/^(дл|юл|ип)\s*[–-]/i.test(rawSummary);

    return {
      summary: clampText(summaryLooksUseful ? rawSummary : (rule?.summary || note.happened || variant?.summary || categoryCopy.summary), 138),
      clientMeaning: clampText(rule?.client || note.step || variant?.client || categoryCopy.client, 128),
      audience: clampText(note.audience || '', 120),
      title
    };
  };

  const buildImage = (rawItem, category, index = 0) => {
    const image = normalizeText(rawItem?.image);
    if (image && !/def\.png|placeholder|default/i.test(image)) {
      try {
        return new URL(image, window.location.origin).pathname;
      } catch (_) {
        return CATEGORY_IMAGES[category] || EDITORIAL_IMAGE_SEQUENCE[index % EDITORIAL_IMAGE_SEQUENCE.length];
      }
    }
    const source = normalizeText(rawItem?.source).toLowerCase();
    const title = normalizeText(rawItem?.title).toLowerCase();
    const isRegulatorSeries = category === 'ЦБ РФ'
      || source.includes('банк россии')
      || source.includes('цб')
      || title.includes('банк россии')
      || title.includes('банком россии');
    if (isRegulatorSeries) {
      return EDITORIAL_IMAGE_SEQUENCE[index % EDITORIAL_IMAGE_SEQUENCE.length];
    }
    const categoryImage = CATEGORY_IMAGES[category];
    if (!categoryImage) return EDITORIAL_IMAGE_SEQUENCE[index % EDITORIAL_IMAGE_SEQUENCE.length];
    return index % 5 === 0 ? EDITORIAL_IMAGE_SEQUENCE[index % EDITORIAL_IMAGE_SEQUENCE.length] : categoryImage;
  };

  const buildReadingTime = (item) => {
    const words = [item.title, item.summary, item.clientMeaning].join(' ').split(/\s+/).filter(Boolean).length;
    return `${Math.min(6, Math.max(2, Math.ceil(words / 120) + 1))} мин`;
  };

  const formatDate = (dateISO, fallback) => {
    const parsed = Date.parse(dateISO || '');
    if (!parsed) return normalizeText(fallback) || 'Дата не указана';
    return new Date(parsed).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateISO, fallback) => {
    const parsed = Date.parse(dateISO || '');
    if (parsed) return new Date(parsed).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const match = normalizeText(fallback).match(/\b\d{1,2}:\d{2}\b/);
    return match ? match[0] : '';
  };

  const normalizeItem = (item, index) => {
    const category = detectCategory(item);
    const note = parseKeisNote(item);
    const title = buildTitle(item?.title);
    const context = buildContext(item, category, title, note, index);
    const source = normalizeText(item?.source) || 'Источник';
    const dateHuman = formatDate(item?.dateISO, item?.dateHuman);
    const dateTime = formatTime(item?.dateISO, item?.dateHuman);
    const dateISO = normalizeText(item?.dateISO);
    const rawUrl = normalizeText(item?.url);

    let url = '';
    try {
      url = rawUrl ? new URL(rawUrl, window.location.origin).toString() : '';
    } catch (_) {
      url = '';
    }

    const normalized = {
      id: normalizeText(item?.id) || `news-${index}`,
      title: context.title,
      originalTitle: normalizeText(item?.title),
      summary: context.summary,
      clientMeaning: context.clientMeaning,
      audience: context.audience,
      source,
      category,
      dateHuman,
      dateTime,
      dateISO,
      url,
      image: buildImage(item, category, index)
    };
    normalized.readingTime = buildReadingTime(normalized);
    return normalized;
  };

  const extractPayload = (payload) => {
    if (Array.isArray(payload)) return { items: payload };
    if (payload && typeof payload === 'object') {
      return {
        items: Array.isArray(payload.items) ? payload.items : [],
        sourceStatuses: payload.sourceStatuses && typeof payload.sourceStatuses === 'object' ? payload.sourceStatuses : null
      };
    }
    return { items: [], sourceStatuses: null };
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
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
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

  const fillSourceFilter = (preferredValue, proxySourceStatuses = null) => {
    const fromItems = [...new Set(state.items.map((item) => item.source).filter(Boolean))];
    const sourceSet = new Set(fromItems);
    if (proxySourceStatuses && typeof proxySourceStatuses === 'object') {
      Object.values(proxySourceStatuses).forEach((st) => {
        const name = st && typeof st.name === 'string' ? st.name.trim() : '';
        if (name) sourceSet.add(name);
      });
    }

    const sources = Array.from(sourceSet);
    refs.sourceFilter.innerHTML = [
      '<option value="all">Все источники</option>',
      ...sources.map((source) => {
        const fromItemsHas = fromItems.includes(source);
        const label = fromItemsHas ? source : `${source} (нет данных)`;
        const disabledAttr = fromItemsHas ? '' : ' disabled';
        return `<option value="${escapeAttr(source)}"${disabledAttr}>${escapeHtml(label)}</option>`;
      })
    ].join('');

    if (preferredValue && [...refs.sourceFilter.options].some((option) => option.value === preferredValue)) {
      refs.sourceFilter.value = preferredValue;
    } else {
      refs.sourceFilter.value = 'all';
    }

    if (refs.sourceWrap) refs.sourceWrap.hidden = sources.length <= 1;
  };

  const updateRubrics = () => {
    refs.categoryButtons.forEach((button) => {
      const isActive = button.dataset.newsCategory === state.activeCategory;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const applyFilters = () => {
    const query = refs.search.value.trim().toLowerCase();
    const source = refs.sourceFilter.value;
    const activeCategory = RUBRICS.includes(state.activeCategory) ? state.activeCategory : 'Все новости';

    state.filtered = state.items.filter((item) => {
      const searchable = [item.title, item.originalTitle, item.summary, item.clientMeaning, item.category, item.source].join(' ').toLowerCase();
      const queryOk = !query || searchable.includes(query);
      const sourceOk = source === 'all' || item.source === source;
      const categoryOk = activeCategory === 'Все новости' || item.category === activeCategory;
      return queryOk && sourceOk && categoryOk;
    });

    if (state.visibleCount < BATCH_SIZE) state.visibleCount = BATCH_SIZE;
    updateRubrics();
    renderAll();
  };

  const linkAttrs = (item) => {
    if (!item.url) return 'href="#newsTop"';
    const isInternal = item.url.startsWith('/') || item.url.startsWith(window.location.origin);
    const externalAttrs = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `href="${escapeAttr(item.url)}"${externalAttrs}`;
  };

  const dateMarkup = (item, className = 'kg-news-card__date') => item.dateISO
    ? `<time class="${className}" datetime="${escapeAttr(item.dateISO)}">${escapeHtml(item.dateHuman)}</time>`
    : `<span class="${className}">${escapeHtml(item.dateHuman)}</span>`;

  const renderFeatured = () => {
    if (!refs.featured) return;
    const item = state.filtered[0] || state.items[0];
    if (!item) {
      refs.featured.innerHTML = '';
      refs.featured.classList.add('is-empty');
      refs.featured.removeAttribute('aria-busy');
      return;
    }

    refs.featured.classList.remove('is-skeleton', 'is-empty');
    refs.featured.removeAttribute('aria-busy');
    refs.featured.innerHTML = `
      <a class="kg-news-featured__link" ${linkAttrs(item)}>
        <img class="kg-news-featured__image" src="${escapeAttr(item.image)}" alt="" loading="eager" decoding="async">
        <span class="kg-news-featured__shade" aria-hidden="true"></span>
        <span class="kg-news-featured__content">
          <span class="kg-news-featured__meta">
            <span class="kg-news-chip">${escapeHtml(item.category)}</span>
            ${dateMarkup(item, 'kg-news-featured__date')}
          </span>
          <span class="kg-news-featured__title">${escapeHtml(item.title)}</span>
          <span class="kg-news-featured__summary">${escapeHtml(item.summary)}</span>
          <span class="kg-news-featured__bottom">
            <span class="kg-news-featured__btn">Читать разбор</span>
            <span class="kg-news-readtime">${escapeHtml(item.readingTime)} чтения</span>
          </span>
        </span>
      </a>
    `;
  };

  const renderToday = () => {
    if (!refs.todayList) return;
    const pool = state.filtered.slice(1);
    const items = [];
    const usedCategories = new Set();
    pool.forEach((item) => {
      if (items.length >= 4) return;
      if (usedCategories.has(item.category)) return;
      items.push(item);
      usedCategories.add(item.category);
    });
    pool.forEach((item) => {
      if (items.length >= 4) return;
      if (!items.some((picked) => getItemKey(picked) === getItemKey(item))) items.push(item);
    });
    refs.todayList.removeAttribute('aria-busy');
    refs.todayList.innerHTML = items.map((item) => `
      <a class="kg-news-today-item" ${linkAttrs(item)}>
        <img src="${escapeAttr(item.image)}" alt="" loading="lazy" decoding="async">
        <span>
          <span class="kg-news-today-item__meta">
            <span>${escapeHtml(item.category)}</span>
            <time datetime="${escapeAttr(item.dateISO || '')}">${escapeHtml(item.dateTime || item.dateHuman)}</time>
          </span>
          <strong>${escapeHtml(item.title)}</strong>
        </span>
      </a>
    `).join('');
  };

  const renderPopular = (root) => {
    if (!root) return;
    const items = POPULAR_GUIDES;
    root.removeAttribute('aria-busy');
    root.innerHTML = items.map((item, index) => `
      <li class="kg-news-popular-item">
        <a ${linkAttrs(item)}>
          <span class="kg-news-popular-item__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="kg-news-popular-item__title">${escapeHtml(item.title)}</span>
          <img src="${escapeAttr(item.image)}" alt="" loading="lazy" decoding="async">
        </a>
      </li>
    `).join('');
  };

  const renderLawChanges = () => {
    if (!refs.lawChanges) return;
    const legalCategories = new Set(['Законы', 'ЦБ РФ', 'Прокуратура', 'ФАС', 'Роспотребнадзор', 'Суды']);
    const items = state.items.filter((item) => legalCategories.has(item.category)).slice(0, 5);
    refs.lawChanges.removeAttribute('aria-busy');
    refs.lawChanges.innerHTML = items.map((item) => `
      <a class="kg-news-law-item" ${linkAttrs(item)}>
        <span>${escapeHtml(item.dateHuman)}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    `).join('');
  };

  const cardToHtml = (item) => {
    const dataAttrs = (item.url || item.id)
      ? ` data-news-id="${escapeAttr(item.id)}" data-news-url="${escapeAttr(item.url || '')}"`
      : '';
    const sourceLink = item.url
      ? `<a class="kg-news-card__link" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">Читать подробнее</a>`
      : '';

    return `
      <li class="kg-news-card"${dataAttrs}>
        <article class="kg-news-card__article">
          <a class="kg-news-card__media" ${linkAttrs(item)} aria-label="${escapeAttr(item.title)}">
            <img src="${escapeAttr(item.image)}" alt="" loading="eager" decoding="async">
          </a>
          <div class="kg-news-card__body">
            <p class="kg-news-card__meta">
              <span class="kg-news-card__source">${escapeHtml(item.category)}</span>
              ${dateMarkup(item)}
            </p>
            <h2 class="kg-news-card__title">${escapeHtml(item.title)}</h2>
            <p class="kg-news-card__summary">${escapeHtml(item.summary)}</p>
            <div class="kg-news-card__client">
              <span>Что это значит для клиента</span>
              <p>${escapeHtml(item.clientMeaning)}</p>
            </div>
            <div class="kg-news-card__actions">
              ${sourceLink}
              <span class="kg-news-readtime">${escapeHtml(item.readingTime)} чтения</span>
            </div>
          </div>
        </article>
      </li>
    `;
  };

  const inlineCtaHtml = () => `
    <li class="kg-news-cta-inline">
      <div class="kg-news-cta-inline__icon" aria-hidden="true">§</div>
      <div class="kg-news-cta-inline__copy">
        <h2>Не знаете, касается ли это вас?</h2>
        <p>Юрист подскажет, как изменение может повлиять на вашу ситуацию.</p>
      </div>
      <button type="button" class="kg-news-consult-btn" data-news-consult>Получить консультацию</button>
      <ul class="kg-news-cta-inline__facts" aria-label="Условия консультации">
        <li>Ответим в течение 15 минут</li>
        <li>Конфиденциально</li>
      </ul>
    </li>
  `;

  const renderList = () => {
    if (refs.resultCount) {
      const count = state.filtered.length;
      refs.resultCount.textContent = count === 0 ? '0 материалов' : `${count} ${count === 1 ? 'материал' : 'материалов'}`;
    }

    if (state.filtered.length === 0) {
      refs.list.innerHTML = '';
      refs.list.setAttribute('aria-busy', 'false');
      refs.loadMoreWrap.hidden = true;
      setStatus('По вашему запросу ничего не найдено.', 'is-empty');
      return;
    }

    const visible = state.filtered.slice(0, Math.min(state.visibleCount, state.filtered.length));
    const html = [];
    visible.forEach((item, index) => {
      html.push(cardToHtml(item));
      if (index === 5 && state.filtered.length > 6) html.push(inlineCtaHtml());
    });

    refs.list.innerHTML = html.join('');
    refs.list.setAttribute('aria-busy', 'false');
    refs.loadMoreWrap.hidden = visible.length >= state.filtered.length;
    refs.loadMoreBtn.disabled = visible.length >= state.filtered.length;
    setStatus('', '');
  };

  const renderAll = () => {
    renderFeatured();
    renderToday();
    renderPopular(refs.popularTop);
    renderPopular(refs.popularSidebar);
    renderLawChanges();
    renderList();
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
      category: state.activeCategory,
      visibleCount: state.visibleCount,
      scrollY: window.scrollY
    };

    fillSourceFilter(keepState ? previousState.source : 'all', state.lastProxySourceStatuses);
    refs.search.value = keepState ? previousState.query : '';
    state.activeCategory = keepState ? previousState.category : 'Все новости';
    state.visibleCount = keepState ? Math.min(previousState.visibleCount, MAX_ITEMS) : BATCH_SIZE;
    applyFilters();

    if (keepState) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: previousState.scrollY, behavior: 'auto' });
      });
    }
  };

  const loadInitial = async () => {
    if (state.isLoading) return;
    state.isLoading = true;
    refs.list.setAttribute('aria-busy', 'true');

    try {
      const data = await fetchJson(PRIMARY_ENDPOINT, { cache: 'default' });
      const items = buildItems(data);
      if (items.length > 0) {
        state.phpUnavailable = false;
        state.lastProxySourceStatuses = extractPayload(data).sourceStatuses;
        applyLoadedItems(items, { keepState: false });
        refs.list.setAttribute('aria-busy', 'false');
        state.isLoading = false;
        startSilentSync();
        return;
      }
    } catch (_) {
      // Local static servers do not execute PHP; static JSON fallback is expected there.
    }

    state.phpUnavailable = true;
    let staticPayload = null;
    for (const endpoint of STATIC_ENDPOINTS) {
      try {
        staticPayload = await fetchJson(endpoint, { cache: 'no-store' });
        break;
      } catch (_) {
        continue;
      }
    }

    if (staticPayload) {
      state.lastProxySourceStatuses = extractPayload(staticPayload).sourceStatuses;
      applyLoadedItems(buildItems(staticPayload), { keepState: false });
    } else {
      handleError('Не удалось загрузить новости. Проверьте /news/news.json или доступность сервера.');
    }

    refs.list.setAttribute('aria-busy', 'false');
    state.isLoading = false;
    startSilentSync();
  };

  const clearSyncTimer = () => {
    if (syncTimerId) {
      clearTimeout(syncTimerId);
      syncTimerId = 0;
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
        state.lastProxySourceStatuses = extractPayload(data).sourceStatuses;
        applyLoadedItems([...newItems, ...state.items].slice(0, MAX_ITEMS), { keepState: true });
        setStatus(`Обновлено: ${formatUpdatedTime()}`, 'is-info');
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('News silent sync failed:', err);
      }
    } finally {
      scheduleSync();
    }
  };

  refs.search.addEventListener('input', () => {
    state.visibleCount = BATCH_SIZE;
    applyFilters();
  });

  refs.sourceFilter.addEventListener('change', () => {
    state.visibleCount = BATCH_SIZE;
    applyFilters();
  });

  refs.categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.newsCategory || 'Все новости';
      state.visibleCount = BATCH_SIZE;
      applyFilters();
    });
  });

  refs.loadMoreBtn.addEventListener('click', () => {
    state.visibleCount = Math.min(state.visibleCount + BATCH_SIZE, state.filtered.length, MAX_ITEMS);
    renderList();
  });

  pageRoot.addEventListener('click', (event) => {
    const consultButton = event.target.closest('[data-news-consult]');
    if (!consultButton) return;
    event.preventDefault();
    const modalTrigger = document.querySelector('[data-open-contact-modal]');
    if (modalTrigger) modalTrigger.click();
  });

  const setupJivoStartupGuard = () => {
    const closeJivoPopup = () => {
      try {
        if (window.jivo_api && typeof window.jivo_api.close === 'function') {
          window.jivo_api.close();
        }
      } catch (_) {
        // Jivo is optional and loaded asynchronously.
      }
    };

    const previousCallback = window.jivo_onLoadCallback;
    window.jivo_onLoadCallback = function handleNewsJivoLoad() {
      if (typeof previousCallback === 'function') {
        previousCallback.apply(this, arguments);
      }
      closeJivoPopup();
      window.setTimeout(closeJivoPopup, 600);
    };

    [1200, 2600, 5200].forEach((delay) => {
      window.setTimeout(closeJivoPopup, delay);
    });
  };

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

  setupJivoStartupGuard();
  setStatus('Загружаем материалы...', 'is-info');
  loadInitial();
})();
