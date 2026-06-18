'use strict';

const { defaultSiteKey } = require('./site-config-loader');
const {
  getAllPracticePacks,
  getPracticePackByDomainPracticeIssue,
  getPracticePackByPageGroup,
  getPracticePackByTopic,
  getPageMapping,
  defaultDomainArea
} = require('./practice-pack-loader');

const safeText = (value, max = 600) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
};

const safeArray = (value, maxItems = 10, maxLen = 240) => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => safeText(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
};

const normalizePathname = pathname => {
  let out = String(pathname || '/').trim() || '/';
  if (!out.startsWith('/')) out = `/${out}`;
  out = out.replace(/\/{2,}/g, '/');
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1);
  return out || '/';
};

const extractPathname = sourceUrl => {
  const raw = String(sourceUrl || '').trim();
  if (!raw) return '/';
  try {
    const parsed = new URL(raw, 'https://kxchat.local');
    return normalizePathname(parsed.pathname || '/');
  } catch (_) {
    return normalizePathname(raw.split('?')[0].split('#')[0] || '/');
  }
};

const buildSummary = (source, fallbackTitle = null) => {
  const explicit = safeText(source.page_summary || source.summary, 600);
  if (explicit) return explicit;
  const parts = [
    safeText(source.hero_text || source.hero, 280),
    safeText(source.h1, 180),
    safeText(source.meta_description || source.metaDescription, 280),
    ...safeArray(source.bullets || source.supporting_points || [], 4, 140)
  ].filter(Boolean);
  if (parts.length) return parts.join(' | ').slice(0, 600);
  return safeText(fallbackTitle, 300);
};

const scorePackBySummary = (pack, summary) => {
  const text = String(summary || '').toLowerCase();
  if (!text) return 0;
  const keywords = Array.isArray(pack.summary_keywords) ? pack.summary_keywords : [];
  return keywords.reduce((sum, keyword) => {
    const token = String(keyword || '').toLowerCase().trim();
    if (!token) return sum;
    return text.includes(token) ? sum + 1 : sum;
  }, 0);
};

const inferPackFromSummary = summary => {
  const all = getAllPracticePacks();
  let best = null;
  let bestScore = 0;
  all.forEach(pack => {
    const score = scorePackBySummary(pack, summary);
    if (score > bestScore) {
      best = pack;
      bestScore = score;
    }
  });
  return bestScore >= 2 ? best : null;
};

const resolvePageContext = ({ rawContext = {}, page = null, title = null, siteKey = null } = {}) => {
  const source = rawContext && typeof rawContext === 'object' ? rawContext : {};
  const sourceUrl = safeText(source.source_url || source.sourceUrl || page, 2048) || '';
  const pathname = extractPathname(sourceUrl);
  const effectiveSiteKey = safeText(source.site_key || source.site || siteKey || defaultSiteKey, 120) || defaultSiteKey;
  const pageTitle = safeText(source.page_title || source.pageTitle || title, 320) || null;
  const pageSummary = buildSummary(source, pageTitle);

  const explicit = {
    page_type: safeText(source.page_type, 80),
    domain_area: safeText(source.domain_area || source.domain, 80),
    practice_area: safeText(source.practice_area || source.practice, 80),
    issue_type: safeText(source.issue_type || source.issue, 80),
    page_group: safeText(source.page_group || source.group, 120),
    topic_key: safeText(source.topic_key || source.topic, 160),
    allowed_next_questions: safeArray(source.allowed_next_questions, 10, 80)
  };

  const mapping = getPageMapping({ siteKey: effectiveSiteKey, pathname });
  let pack = null;

  if (explicit.topic_key) {
    pack = getPracticePackByTopic(explicit.topic_key);
  }
  if (!pack && explicit.page_group) {
    pack = getPracticePackByPageGroup(explicit.page_group);
  }
  if (!pack && (explicit.domain_area || explicit.practice_area || explicit.issue_type)) {
    pack = getPracticePackByDomainPracticeIssue(explicit);
  }
  if (!pack && mapping && mapping.topic_key) {
    pack = getPracticePackByTopic(mapping.topic_key);
  }
  if (!pack && mapping && mapping.page_group) {
    pack = getPracticePackByPageGroup(mapping.page_group);
  }
  if (!pack) {
    pack = inferPackFromSummary(pageSummary);
  }

  const domainArea = explicit.domain_area || (mapping && mapping.domain_area) || (pack && pack.domain_area) || defaultDomainArea;
  const practiceArea = explicit.practice_area || (mapping && mapping.practice_area) || (pack && pack.practice_area) || null;
  const issueType = explicit.issue_type || (mapping && mapping.issue_type) || (pack && pack.issue_type) || null;
  const pageGroup = explicit.page_group || (mapping && mapping.page_group) || (pack && Array.isArray(pack.page_groups) ? pack.page_groups[0] : null) || 'generic';
  const topicKey = explicit.topic_key || (mapping && mapping.topic_key) || (pack && pack.topic_key) || null;
  const allowedNextQuestions = explicit.allowed_next_questions.length
    ? explicit.allowed_next_questions
    : (pack && Array.isArray(pack.allowed_next_questions) ? pack.allowed_next_questions.slice(0, 10) : []);

  return {
    site_key: effectiveSiteKey,
    page_type: explicit.page_type || (mapping && mapping.page_type) || 'content',
    domain_area: domainArea,
    practice_area: practiceArea,
    issue_type: issueType,
    page_group: pageGroup,
    topic_key: topicKey,
    page_title: pageTitle,
    page_summary: pageSummary || null,
    source_url: sourceUrl || null,
    pathname,
    h1: safeText(source.h1, 240),
    hero_text: safeText(source.hero_text || source.hero, 400),
    meta_description: safeText(source.meta_description || source.metaDescription, 400),
    bullets: safeArray(source.bullets || source.supporting_points || [], 10, 180),
    allowed_next_questions: allowedNextQuestions,
    resolver_source: explicit.topic_key || explicit.page_group || explicit.practice_area
      ? 'explicit'
      : (mapping ? 'mapping' : (pack ? 'inferred' : 'generic'))
  };
};

module.exports = {
  resolvePageContext,
  extractPathname
};
