const test = require('node:test');
const assert = require('node:assert/strict');

const { resolvePageContext } = require('../src/services/page-context-resolver');

test('page context resolver uses explicit data-kx-context first', () => {
  const context = resolvePageContext({
    rawContext: {
      site_key: 'keis-legalgroup',
      domain_area: 'legal',
      practice_area: 'fraud',
      issue_type: 'unauthorized_credit',
      page_group: 'scam/hack',
      page_summary: 'Оспаривание кредитов без согласия'
    },
    page: 'https://example.test/scam/hack/',
    title: 'Test title'
  });

  assert.equal(context.site_key, 'keis-legalgroup');
  assert.equal(context.practice_area, 'fraud');
  assert.equal(context.issue_type, 'unauthorized_credit');
  assert.equal(context.page_group, 'scam/hack');
  assert.equal(context.resolver_source, 'explicit');
});

test('page context resolver uses path mapping when explicit fields are absent', () => {
  const context = resolvePageContext({
    rawContext: {},
    page: 'https://example.test/auto-law/dkp/',
    title: 'ДКП авто'
  });

  assert.equal(context.page_group, 'auto-law/*');
  assert.equal(context.practice_area, 'auto_law');
  assert.equal(context.issue_type, 'dkp');
  assert.equal(context.topic_key, 'legal/auto_law/dkp');
  assert.equal(context.resolver_source, 'mapping');
});

test('page context resolver infers meaning from summary text', () => {
  const context = resolvePageContext({
    rawContext: {
      h1: 'Проблема с выводом денег от брокера',
      hero_text: 'Брокер не выводит деньги, пропал менеджер, переводы на карту физлица',
      bullets: ['перевод через платформу', 'переписка в telegram']
    },
    page: 'https://example.test/articles/case-1',
    title: 'Разбор ситуации'
  });

  assert.equal(context.topic_key, 'legal/fraud/broker');
  assert.equal(context.practice_area, 'fraud');
  assert.equal(context.resolver_source, 'inferred');
});
