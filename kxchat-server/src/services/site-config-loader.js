'use strict';

const siteConfig = require('../config/site-config.json');

const bySite = new Map(
  (Array.isArray(siteConfig.sites) ? siteConfig.sites : [])
    .map(entry => [String(entry.site_key || '').trim(), entry])
    .filter(([key]) => key)
);

const defaultSiteKey = String(siteConfig.default_site_key || '').trim();

const getSiteConfig = siteKey => {
  const requested = String(siteKey || '').trim();
  if (requested && bySite.has(requested)) return bySite.get(requested);
  if (defaultSiteKey && bySite.has(defaultSiteKey)) return bySite.get(defaultSiteKey);
  const first = bySite.values().next();
  return first.done ? null : first.value;
};

module.exports = {
  getSiteConfig,
  defaultSiteKey
};
