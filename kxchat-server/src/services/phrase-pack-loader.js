'use strict';

const phrasePack = require('../config/phrase-pack.json');

const packsByKey = new Map(
  (Array.isArray(phrasePack.packs) ? phrasePack.packs : [])
    .map(entry => [String(entry.pack_key || '').trim(), entry])
    .filter(([key]) => key)
);

const defaultPackKey = String(phrasePack.default_pack_key || '').trim();

const getPhrasePack = packKey => {
  const requested = String(packKey || '').trim();
  if (requested && packsByKey.has(requested)) return packsByKey.get(requested);
  if (defaultPackKey && packsByKey.has(defaultPackKey)) return packsByKey.get(defaultPackKey);
  const first = packsByKey.values().next();
  return first.done ? null : first.value;
};

module.exports = {
  getPhrasePack,
  defaultPackKey
};
