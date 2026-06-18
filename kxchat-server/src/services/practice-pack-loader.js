'use strict';

const practiceConfig = require('../config/practice-packs.json');

const asArray = value => (Array.isArray(value) ? value : []);

const packs = asArray(practiceConfig.practice_packs);
const byTopic = new Map(
  packs
    .map(entry => [String(entry.topic_key || '').trim(), entry])
    .filter(([key]) => key)
);

const pageMappings = asArray(practiceConfig.page_mappings).map(entry => {
  const pattern = String(entry.pathname_pattern || '').trim();
  let pathnameRe = null;
  if (pattern) {
    try {
      pathnameRe = new RegExp(pattern, 'i');
    } catch (_) {
      pathnameRe = null;
    }
  }
  return {
    ...entry,
    pathnameRe
  };
});

const getPracticePackByTopic = topicKey => {
  const key = String(topicKey || '').trim();
  if (!key) return null;
  return byTopic.get(key) || null;
};

const getPracticePackByPageGroup = pageGroup => {
  const target = String(pageGroup || '').trim();
  if (!target) return null;
  return packs.find(pack => asArray(pack.page_groups).includes(target)) || null;
};

const getPracticePackByDomainPracticeIssue = ({ domain_area, practice_area, issue_type }) => {
  const domain = String(domain_area || '').trim();
  const practice = String(practice_area || '').trim();
  const issue = String(issue_type || '').trim();
  if (!domain && !practice && !issue) return null;
  return packs.find(pack => {
    if (domain && pack.domain_area !== domain) return false;
    if (practice && pack.practice_area !== practice) return false;
    if (issue && pack.issue_type !== issue) return false;
    return true;
  }) || null;
};

const getPageMapping = ({ siteKey, pathname }) => {
  const normalizedPath = String(pathname || '/').trim() || '/';
  const key = String(siteKey || '').trim();
  return pageMappings.find(mapping => {
    if (mapping.site_key && key && mapping.site_key !== key) return false;
    if (!mapping.pathnameRe) return false;
    return mapping.pathnameRe.test(normalizedPath);
  }) || null;
};

const getAllPracticePacks = () => packs.slice();

module.exports = {
  getAllPracticePacks,
  getPracticePackByTopic,
  getPracticePackByPageGroup,
  getPracticePackByDomainPracticeIssue,
  getPageMapping,
  defaultDomainArea: String(practiceConfig.default_domain_area || '').trim() || 'general'
};
