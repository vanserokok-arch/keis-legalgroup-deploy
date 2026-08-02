# DESIGN_RESTRUCTURE_PLAN

Project: KEIS Legal Group  
Status: research and design planning only  
Implementation: not started  
Approval gate: required before any HTML/CSS/JS/page/content changes

## 0. Method

Flow used: repro -> root-cause search -> information architecture -> design system -> design direction -> design plan -> approval wait.

Sources inspected:
- Canonical local pages outside `dist-timeweb` and outside experimental `variant_2`.
- `sitemap.xml`.
- Shared assets in `assets/block`, `assets/scenarios`, `assets/cases`, `assets/reviews`, `assets/news`.
- Reviews source: `assets/reviews/reviews.json`.
- News source: `news/news.json`.
- Current shared CSS only as diagnostic evidence, not as design source.
- References: WilmerHale and HLC as design orientation only.

Important SSOT decision:
- `dist-timeweb` is treated as a build/deploy duplicate, not canonical IA.
- `variant_2` is treated as experimental reference, not canonical content.
- Canonical content sources are the root pages, `/scam`, `/zpp`, `/news`, legal pages, and shared JSON/assets.

## 1. Repro: Current Site Map

### 1.1 Canonical Public Pages

| Type | URL/path | Current role | Keep as content source |
|---|---|---:|---:|
| Home | `/` / `index.html` | Direction gateway | Yes |
| Fraud hub | `/scam/` | Fraud overview | Yes |
| Fraud service | `/scam/broker/` | Broker/investment fraud | Yes |
| Fraud service | `/scam/pressure/` | Transfer under pressure | Yes |
| Fraud service | `/scam/hack/` | Account hack / unauthorized credit | Yes |
| Consumer hub | `/zpp/` | Consumer protection overview | Yes |
| Consumer service | `/zpp/med-error/` | Medical error | Yes |
| Consumer service | `/zpp/refund/` | Defective goods/refund | Yes |
| Consumer service | `/zpp/insurance/` | Forced insurance | Yes |
| Consumer service | `/zpp/renovation/` | Poor renovation | Yes |
| Consumer service | `/zpp/furniture/` | Furniture defects | Yes |
| Consumer service | `/zpp/contractor/` | Contractor dispute | Yes |
| Consumer service | `/zpp/lawyer-claim/` | Claim against lawyer | Yes |
| Consumer service | `/zpp/build-contract/` | Construction contract | Yes |
| Consumer service | `/zpp/services/` | Poor services | Yes |
| Auto law placeholder | `/auto-law/` | Unavailable page | Weak, needs product decision |
| Auto law placeholder | `/auto-law/dkp/` | Unavailable page | Weak, needs product decision |
| Auto law placeholder | `/auto-law/forced-addons/` | Unavailable page | Weak, needs product decision |
| News | `/news/` | Legal journal | Yes |
| Privacy | `/privacy-policy.html` | Legal policy | Yes |
| Cookies | `/cookies/` | Cookie policy | Yes |
| Thanks | `/thanks/` | Lead confirmation | Yes |

### 1.2 Current Repeated Blocks

The 16 main service/hub pages largely repeat one sequence:

1. Header with service menu, phone, Telegram, booking CTA.
2. Hero with lead form.
3. Stories/problem carousel.
4. Trust/parallax block.
5. Metric bridge.
6. Flags/signals grid.
7. Three or four explanatory content blocks.
8. Mid-page CTA form.
9. Process.
10. Cases.
11. Metric bridge.
12. FAQ.
13. Reviews.
14. Footer with map and contact CTA.
15. Contact modal.
16. Success modal.

This is valuable as content inventory, but weak as product architecture: every situation receives the same dramatic rhythm, so the site does not guide by urgency, evidence type, risk, or user state.

### 1.3 Current Forms and CTA Inventory

Primary CTAs:
- `Записаться`.
- `Получить консультацию`.
- `Получить консультацию ->`.
- `Нужна консультация ->`.
- `Написать нам`.
- `Подробнее`.
- News: `Показать ещё`.

Forms:
- Hero form on main service pages: name, phone, situation text, consent.
- Mid-page CTA form: name, phone, consent.
- Modal form: name, phone, situation text, consent.
- News consultation form.

Problem:
- CTA language is repetitive and generic.
- Forms appear early and often, but without differentiated intent: urgent fraud, evidence review, claim calculation, second opinion, and document audit are all treated as the same consultation.

### 1.4 Current Image Inventory

High-value existing images to reuse:
- Firm/space/team mood: `assets/block/kazan4-*`, `assets/block/2blockteam-*`, `assets/block/great_K-*`, `assets/block/people.webp`, `assets/block/mediumspaces-*`, `assets/block/topspaces.webp`.
- Fraud hero/category assets: `assets/block/bubu.webp`, `assets/block/buoffer1-*`, `assets/block/offer2-*`, `assets/block/offer3-*`, `assets/block/broker-*`, `assets/block/kred*.webp`, mobile-specific `mobu*.webp`.
- Consumer assets: `assets/block/zpp*.webp`, `assets/scenarios/zpp*.webp`, service-specific `med*`, `strah*`, `rem*`, `pod*`, `jr*`, `scc*`, `scp*`.
- Case evidence images: `assets/cases/pret`, `assets/cases/isk`, `assets/cases/resh`, `assets/cases/ispol`.
- News editorial assets: `assets/news/editorial-covers/*`, `assets/news/news-*.webp`.
- Reviews avatars: `assets/reviews/avatars/*`.
- Footer/map assets: `assets/block/map-podval.webp`, `assets/block/cab-podval.webp`, `assets/block/footer-map-overlay.svg`.

Assets requiring caution:
- AI-generated or overly generic images with file names like `ChatGPT Image ...`: usable only as secondary atmosphere, not as trust-critical proof.
- Repeated 2752x1536 service images: strong resolution, but current use creates sameness across consumer pages.
- External Yandex avatars: keep for review authenticity only; do not over-style them into premium portraits.

## 2. Root-Cause Findings

### 2.1 Strong Points

- Large amount of relevant legal content already exists.
- Clear service clusters: fraud, consumer protection, auto law, legal journal.
- Good proof ingredients: cases, reviews, process, FAQ, evidence/legal-document imagery.
- Real contact anchors: phone, Telegram, office/map, policy pages.
- The copy often has practical legal specificity: recipients, bank refusals, claims, evidence, limitation risks, independent expertise.

### 2.2 Weak Points

- Home page is only a direction launcher; it does not establish premium firm authority.
- Main service pages feel template-driven; different user anxieties are forced into the same block order.
- "Trust" is stated repeatedly instead of demonstrated through hierarchy, evidence, authored expertise, and case logic.
- Current CTA strategy asks for a consultation before the user understands what will happen next.
- Auto-law pages are publicly present but unavailable, weakening perceived completeness.
- Legal journal content currently looks like a feed import, not an editorial product.
- Typography direction is not premium enough: current Roboto Slab + Inter mixture reads like local landing pages, not an international legal practice.
- Card system is overused; many cards carry similar weight, making scanning slower.
- Current content has local wording errors/roughness on some pages, for example "карта", "дефектыми", "что не такми", "ваши договор и переписка". These should be fixed only after content approval.

### 2.3 Logical/UX Problems

- Evidence blocks often appear after generic problem blocks; users need evidence logic earlier.
- Cases are too low. For legal services, cases are a trust driver and should appear before long FAQ.
- FAQ comes late and is repetitive; convert parts into contextual objections near relevant sections.
- Process is generic and can be moved below proof and evidence, or shortened to a timeline.
- Repeated metric bridges interrupt narrative and can feel decorative.
- Reviews repeat across pages without page-specific matching; a medical-error page should not rely on unrelated auto/furniture sentiment.

## 3. Information Architecture

### 3.1 New Top-Level IA

Recommended main navigation:

1. `Экспертиза`
   - Мошенничество и возврат денег
   - Защита прав потребителей
   - Автоюрист
   - Судебные споры
2. `Практика`
   - Кейсы
   - Документы
   - Исполнение
   - Отзывы
3. `Журнал`
   - Разборы
   - Новости законодательства
   - Проверочные списки
4. `О фирме`
   - Подход
   - Команда
   - Контакты
5. Primary CTA: `Обсудить дело`

Why:
- Mirrors premium law-firm logic from references: solutions/practices, insights/news, people/about.
- Reduces menu fragmentation.
- Moves proof and expertise into first-class navigation.

### 3.2 New Page Families

#### Home
Role: establish KEIS as a calm, credible legal practice, then route users by problem and urgency.

#### Practice Hubs
- `/scam/`: emergency asset recovery hub.
- `/zpp/`: consumer dispute hub.
- `/auto-law/`: either rebuild as real hub or hide from main navigation until ready.

#### Service Pages
Role: single-problem conversion pages with page-specific proof, evidence, and next action.

#### Practice / Cases
Currently cases are embedded. Recommendation: introduce a future canonical `Практика` section or page using existing case data/assets. Do not implement until approved.

#### News / Journal
Role: thought leadership and search traffic, not generic legal feed.

#### Legal Utility Pages
Privacy, cookies, thanks: keep functional, quieter, visually aligned.

## 4. Design System Direction

### 4.1 Brand Feeling

Target:
- expensive;
- calm;
- modern;
- international;
- legally rigorous;
- not aggressive;
- not "landing page";
- not decorative luxury.

### 4.2 Typography

Do not keep current typographic system.

Recommended direction:
- Display/editorial serif for H1 and major proof statements: high-contrast, restrained, legal/editorial mood.
- Humanist sans for UI, body, forms, navigation.
- Numeric style for metrics: tabular, precise, institutional.

Type behavior:
- H1: fewer lines, stronger editorial wording, no over-fragmented `<br>` logic in future implementation.
- H2: short, declarative, not marketing questions everywhere.
- Body: measured line length, case-note rhythm.
- Cards: headings must be compact, not hero-sized.

### 4.3 Color

Recommended palette:
- Ink: near-black charcoal, not pure black.
- Paper: warm white / legal paper neutral.
- Stone: grey-beige only as support, not dominant.
- Accent: restrained copper/amber for action and evidence markers.
- Risk accent: deep red only for high-risk fraud states.
- Success/proof accent: muted green for returned money/result markers.

Avoid:
- one-note dark blue/slate;
- heavy purple gradients;
- decorative glow/orb language;
- overuse of orange/brown.

### 4.4 Card System Inspired by DORAI

DORAI decision method for every block:
- Reference: what outside pattern informs the decision.
- Pattern: structural model used.
- Genes: reusable design DNA.
- Why: UX/emotion/conversion/trust logic.

Card families:

1. `Evidence Cards`
   - For documents, payments, chats, medical records, contracts.
   - Genes: paper texture, small labels, legal sequence number, quiet hover.

2. `Case Cards`
   - For result stories.
   - Genes: result first, dispute type, timeline, documents used, outcome.

3. `Signal Cards`
   - For "you may have a case if...".
   - Genes: compact sign, risk severity, next proof needed.

4. `Route Cards`
   - For home/hub navigation.
   - Genes: problem title, urgency, expected first action.

5. `Insight Cards`
   - For journal.
   - Genes: topic, date/source, affected user group, practical consequence.

6. `Objection Cards`
   - For "банк говорит...", "продавец отказал...", "нет чека...".
   - Genes: objection, legal counterpoint, what to preserve.

## 5. Block Library: DORAI Decisions

### 5.1 Hero: Editorial Proof Hero

- Goal: state who KEIS helps, what outcome is realistic, and what happens first.
- Reference: WilmerHale hero hierarchy and confidence; HLC large statement rhythm.
- Pattern: split editorial statement + proof rail + one restrained CTA.
- Genes: large serif title, quiet proof metrics, one image or cinematic background, no visual noise.
- Why: legal users need confidence before conversion; premium hero should slow panic without hiding urgency.

### 5.2 Situation Router

- Goal: route by problem, not by internal service labels.
- Reference: HLC sector/practice navigation.
- Pattern: interactive route grid.
- Genes: `Что произошло`, `Сколько времени прошло`, `Какие документы есть`, `Первый шаг`.
- Why: improves speed of perception and helps users self-identify.

### 5.3 Evidence Map

- Goal: show how KEIS turns facts into legal action.
- Reference: WilmerHale case-study proof; DORAI evidence-card pattern.
- Pattern: horizontal or stepped evidence chain.
- Genes: payment/chat/contract/claim/court/enforcement.
- Why: converts anxiety into a rational plan.

### 5.4 Case Spotlight

- Goal: demonstrate outcomes before asking users to read long process text.
- Reference: HLC case studies; WilmerHale case spotlight.
- Pattern: one large case + supporting smaller cases.
- Genes: result, duration, documents, opponent, legal mechanism.
- Why: case specificity builds trust faster than generic promises.

### 5.5 Objection Breaker

- Goal: address the exact reason users hesitate.
- Reference: premium legal FAQ patterns, but moved into narrative.
- Pattern: objection/counterpoint/proof needed.
- Genes: "Банк говорит...", "Продавец отказал...", "Нет чека...", "Сам перевёл...".
- Why: handles conversion blockers earlier than FAQ.

### 5.6 Process Timeline

- Goal: explain what happens after contact.
- Reference: WilmerHale restrained rhythm; HLC scroll depth.
- Pattern: 4-stage timeline.
- Genes: audit -> claim -> court/negotiation -> enforcement.
- Why: reduces fear of legal complexity.

### 5.7 Trust Section

- Goal: prove firm credibility without generic badges.
- Reference: WilmerHale client experience/testimonials.
- Pattern: firm facts + selected review + office/team image.
- Genes: years, recovered amount, cases, review source, office contact.
- Why: trust must be institutional, not just decorative.

### 5.8 Journal / Insight Strip

- Goal: position KEIS as legally current.
- Reference: WilmerHale Insights & News.
- Pattern: curated legal insight row, not raw feed.
- Genes: consequence, affected audience, date, action.
- Why: supports authority and SEO without distracting from conversion.

### 5.9 Final CTA

- Goal: ask for the next step at the correct moment.
- Reference: HLC clear footer/contact pattern.
- Pattern: calm consultation panel.
- Genes: what to prepare, response time, privacy note, phone/Telegram fallback.
- Why: stronger than repeated generic forms.

## 6. New Architecture By Page

### 6.1 Home `/`

New sequence:

1. `Hero: Legal clarity when the matter is already urgent`
   - Goal: establish KEIS as a serious legal group.
   - Why here: first screen must build trust, not just route.
   - Reference: WilmerHale.
   - Pattern: editorial hero + proof rail.
   - Genes: office/team image, 3 proof metrics, one CTA.
   - Why genes: moves the brand from local landing to firm-level authority.

2. `Situation Router`
   - Goal: route users by lived problem.
   - Why here: after trust, users need orientation.
   - Reference: HLC practices/sectors.
   - Pattern: route cards.
   - Genes: fraud, consumer, auto, legal services.
   - Why genes: service names become human decisions.

3. `Practice Proof`
   - Goal: show that KEIS works through evidence and procedure.
   - Why here: prevents site from feeling like a call-center lead page.
   - Reference: WilmerHale case spotlight.
   - Pattern: evidence map.
   - Genes: claim, lawsuit, decision, enforcement.

4. `Selected Cases`
   - Goal: show outcomes across clusters.
   - Why here: proof before long explanations.
   - Reference: HLC case studies.
   - Pattern: large case + two compact cases.
   - Genes: result, duration, mechanism.

5. `Insights`
   - Goal: show legal expertise and freshness.
   - Reference: WilmerHale Insights.
   - Pattern: curated journal strip.
   - Genes: legal update, practical consequence.

6. `Reviews + Office Trust`
   - Goal: human trust.
   - Reference: WilmerHale client experience.
   - Pattern: testimonial panel + map/office.
   - Genes: Yandex source, review quote, office address.

7. `Final CTA`
   - Goal: contact after understanding.
   - Pattern: calm form + phone/Telegram.

Delete/merge:
- Merge current three direction cards into the router.
- Remove generic "direction launcher" feel.

### 6.2 Fraud Hub `/scam/`

New sequence:

1. `Emergency Hero`
   - Goal: users understand money may still be traceable.
   - Reference: HLC depth + WilmerHale calm confidence.
   - Pattern: urgent editorial hero.
   - Genes: time sensitivity, recipient tracing, evidence preservation.

2. `What Happened?`
   - Goal: route to broker, pressure, hack, service scam.
   - Pattern: route cards.
   - Genes: user story, first evidence, risk level.

3. `First 24 Hours Evidence Checklist`
   - Goal: immediate utility.
   - Pattern: evidence cards.
   - Genes: bank statement, chats, phone logs, screenshots, receipts.

4. `How Money Recovery Works`
   - Goal: explain legal mechanism.
   - Pattern: evidence map.
   - Genes: recipient identification -> claim -> lawsuit -> enforcement.

5. `Case Spotlight`
   - Goal: prove outcomes.
   - Pattern: large fraud case.

6. `Objections`
   - Goal: answer "I transferred myself", "bank refused", "police is silent".
   - Pattern: objection cards.

7. `Process`
   - Goal: reduce legal fear.

8. `FAQ`
   - Goal: residual questions only.

9. `Reviews`
   - Goal: trust.

10. `Final CTA`
   - Goal: evidence audit.

Delete/merge:
- Combine current "Признаки обмана" and "Ситуации..." into route/evidence logic.
- Remove duplicate metric bridge.

### 6.3 Broker Fraud `/scam/broker/`

New sequence:

1. `Hero: Withdrawal blocked / fake broker`
   - Goal: match user panic and show route.
   - Pattern: proof hero.
   - Genes: platform, card transfers, crypto, extra fees.

2. `Which Scheme Was Used?`
   - Goal: diagnose pseudo-broker, messenger investment, crypto platform, tax/fee demand.
   - Pattern: signal cards.

3. `Payment Trail`
   - Goal: explain why recipient matters more than broker website.
   - Pattern: evidence map.
   - Genes: card recipient, SBP, crypto wallet, payment purpose.

4. `Do Not Pay Again`
   - Goal: prevent further loss.
   - Pattern: high-risk warning block.
   - Genes: tax, insurance deposit, code, guarantor.

5. `Case Spotlight`
   - Goal: results for broker losses.

6. `Documents Needed`
   - Goal: prepare user.
   - Pattern: evidence cards.

7. `Process`
   - Goal: claim/court/enforcement path.

8. `FAQ + CTA`

Images:
- Keep `buoffer1-*`, `broker-drop-cards-*`, `broker-crypto-tracing.webp`, `broker-international-recovery.webp`.
- Replace generic decorative broker scenes if they do not show legal/evidence context.

### 6.4 Transfer Under Pressure `/scam/pressure/`

New sequence:

1. `Hero: Transfer was made under control and pressure`
2. `Pressure Pattern Timeline`
   - Goal: show that "I transferred myself" can still be legally contestable.
   - Genes: fake bank call, isolation, urgency, dictated requisites.
3. `Bank Objection Breaker`
   - Goal: answer "you confirmed the transfer".
4. `Evidence to Preserve`
5. `Recipient Recovery Route`
6. `Case Spotlight`
7. `Process`
8. `FAQ`
9. `Final CTA`

Images:
- Keep `offer3-*`, `mobu2.webp` as mood.
- Need new or recomposed hero showing psychological pressure/evidence, not generic danger.

### 6.5 Hack / Unauthorized Credit `/scam/hack/`

New sequence:

1. `Hero: Unauthorized credit after account access`
2. `Access Route`
   - SMS code, phishing, Gosuslugi, mobile bank, remote loan.
3. `Credit and Money Movement Map`
   - loan issued -> money moved -> bank evidence -> challenge.
4. `What Bank Will Argue`
   - confirmation codes, device, login, user negligence.
5. `How We Prove Hack`
6. `Case Spotlight`
7. `Credit History / Debt Pressure`
8. `Process`
9. `FAQ`
10. `CTA`

Images:
- Keep `offer2-*`, `kred*.webp`.
- Need stronger hero around digital trace/legal audit.

### 6.6 Consumer Protection Hub `/zpp/`

New sequence:

1. `Hero: Consumer dispute translated into a recoverable claim`
2. `Problem Router`
   - medical, renovation, refund, insurance, furniture, contractor, lawyer claim, construction, services.
3. `What Can Be Recovered`
   - refund, penalty, fine, losses, expenses, moral harm where applicable.
4. `Evidence Starter`
   - contract, receipt, photos, chats, expert report, complaint.
5. `Case Spotlight`
6. `Objections`
   - no receipt, seller blames buyer, service "accepted", insurer/bank redirects.
7. `Process`
8. `Reviews`
9. `CTA`

Delete/merge:
- Merge current "Сигналы", "Сначала показываем", "Считаем", "Переходим" into one claim-builder narrative.

### 6.7 ZPP Service Pages: Shared Architecture

Use one canonical service pattern with page-specific front-loaded evidence:

1. `Hero`
   - Goal: state concrete dispute and recoverable outcome.
   - Reference: WilmerHale clarity.
   - Pattern: editorial hero.
   - Genes: dispute, opponent, legal result, first action.

2. `Signals`
   - Goal: self-identification.
   - Reference: DORAI signal cards.
   - Pattern: 6 compact signals.
   - Genes: what happened, risk, needed proof.

3. `Claim Builder`
   - Goal: show how facts become demands.
   - Pattern: evidence/claim map.
   - Genes: document -> defect -> calculation -> demand -> court.

4. `Objection Breaker`
   - Goal: answer likely refusal.
   - Pattern: objection cards.

5. `Recoverable Amount`
   - Goal: conversion through value clarity.
   - Pattern: calculation block.
   - Genes: payment, penalty, fine, expenses, losses.

6. `Case Spotlight`
   - Goal: proof.

7. `Process`
   - Goal: operational clarity.

8. `FAQ`
   - Goal: residual questions.

9. `CTA`
   - Goal: document audit.

Apply page-specific emphasis:

| Page | Above-the-fold emphasis | Critical evidence | Main objection |
|---|---|---|---|
| `/zpp/med-error/` | health harm and medical record control | medical card, consent, discharge summary, expert opinion | clinic refuses records / says complication is normal |
| `/zpp/refund/` | defective product and seller refusal | receipt, order, photos/video, claim, quality check | "buyer caused defect" |
| `/zpp/insurance/` | forced service inside loan/sale | loan contract, insurance statement, payment trail, refusal | bank sends to insurer / missed cooling-off period |
| `/zpp/renovation/` | defective renovation and missed deadlines | contract, estimate, photos, acts, expert report | contractor says work accepted |
| `/zpp/furniture/` | mismatch/defect after delivery/assembly | order spec, photos, delivery act, chats | custom order cannot be returned |
| `/zpp/contractor/` | poor contractor work / no result | contract, estimate, acts, correspondence, photos | dispute over volume/scope |
| `/zpp/lawyer-claim/` | lawyer took payment but did not work | legal services contract, receipts, filings, correspondence | "service was consulting only" |
| `/zpp/build-contract/` | construction defects / delay / extra charges | contract, schedule, estimate, acts, expert report | hidden work / extra charges |
| `/zpp/services/` | service not performed or poor result | contract, result evidence, messages, refusal | "service was provided" |

### 6.8 Auto Law Pages

Current state:
- `/auto-law/`, `/auto-law/dkp/`, `/auto-law/forced-addons/` are unavailable placeholders.

Recommendation:
- Do not keep them prominent in top navigation until rebuilt.
- Option A: rebuild as full third practice family using existing home auto image `assets/block/auto1.webp` and available review/case content.
- Option B: keep URLs indexable only if there is real content and expectation management.

New future architecture:
1. Auto-law hub.
2. Defective car / DKP termination.
3. Forced add-ons / insurance / dealer packages.
4. Evidence: contract, diagnostics, dealer refusal, expert report.
5. Cases and reviews.

### 6.9 News `/news/`

New sequence:

1. `Editorial Hero`
   - Goal: KEIS legal journal as practical decision support.
   - Reference: WilmerHale Insights.
   - Pattern: featured insight + topic filters.

2. `Today / Important`
   - Goal: what changed and who is affected.
   - Pattern: curated cards.

3. `Legal Explainers`
   - Goal: evergreen SEO and trust.
   - Pattern: insight cards.

4. `Practice Links`
   - Goal: connect news to services.
   - Pattern: topic-to-action bridge.

5. `Ask About This`
   - Goal: convert reader uncertainty.

Problems to fix later:
- Current `news/news.json` appears imported and uses default images for many items.
- Need editorial taxonomy and source cleanup before premium UI can work.

### 6.10 Privacy, Cookies, Thanks

Recommendation:
- Keep simple and legally readable.
- Align header/footer with global system.
- Reduce marketing weight.
- Thanks page should explain next steps: expected call time, what to prepare, fallback contact.

## 7. What To Delete

Delete from future architecture, not from files yet:
- Duplicate metric bridges between major blocks.
- Generic repeated "Выстраиваем честные отношения" block on every service page; convert into one firm/trust pattern and page-specific process.
- Generic mid-page CTA where it interrupts evidence logic.
- Overly broad FAQ items that repeat process text.
- Placeholder auto-law prominence until real content exists.
- Any decorative cards that do not help routing, evidence, proof, objection handling, or conversion.

## 8. What To Merge

- `Признаки` + `Частые проблемы` -> `Signals`.
- `Что поможет` + parts of FAQ -> `Evidence Checklist`.
- `Почему самостоятельно сложно` + objections -> `Objection Breaker`.
- `Как идёт работа` + legal mechanism -> `Process Timeline`.
- Reviews + map + office facts -> `Trust Section`.
- Cases embedded across pages -> future canonical `Practice / Cases` system while retaining page-specific case highlights.

## 9. What To Split

- Current universal service template should split into:
  - fraud emergency pattern;
  - consumer claim-builder pattern;
  - journal/editorial pattern;
  - legal utility pattern.
- CTA should split by intent:
  - `Проверить шансы возврата`;
  - `Разобрать документы`;
  - `Оценить отказ банка/продавца`;
  - `Рассчитать требования`;
  - `Обсудить дело`.
- Cases should split by service relevance, not one shared carousel everywhere.

## 10. Image Decisions

### 10.1 Keep

- `assets/block/kazan4-*`, `2blockteam-*`, `great_K-*`, `people.webp`: firm atmosphere and authority.
- `assets/block/map-podval.webp`, `cab-podval.webp`, `footer-map-overlay.svg`: contact trust.
- `assets/cases/*`: evidence/proof system.
- `assets/reviews/avatars/*`: review credibility.
- `assets/news/editorial-covers/*`: journal if taxonomy is curated.
- Service-specific `zpp*.webp`, `broker-*`, `kred*.webp` after selection.

### 10.2 Replace Or Recompose

- Generic AI-style images that do not show legal work, documents, people, or real context.
- Repeated consumer hero compositions that make all ZPP pages feel identical.
- News default images for imported feed items.
- Any hero that relies on dark atmospheric danger without inspectable subject matter.

### 10.3 Needs New Photography

Highest priority:
- Real KEIS team portraits in office, serious but approachable.
- Work process: document review, evidence board, client consultation, court/preparation context.
- Office detail shots: table, documents, books, city context, signage.

Secondary:
- Page-specific still-life sets for evidence: payment receipts, claim drafts, medical documents, contract/expert report. These can be staged, but must feel real and restrained.

## 11. Animation Recommendations

No implementation now.

Header:
- Transparent/quiet on hero, becomes compact solid surface on scroll.
- Mega menu opens with depth, not a flat dropdown.
- Active section indicator for long pages.

Parallax:
- Use slow image plane movement only on hero/trust/case spotlight.
- Avoid heavy scroll gimmicks on legal text.

Cards:
- Signal cards: slight elevation + evidence marker reveal.
- Case cards: result number settles first, documents reveal second.
- Route cards: hover changes problem state, not color-only decoration.

CTA:
- Button feedback should be tactile but quiet.
- Form should not feel like a pop-up trap; modal must preserve calm.

Block entrance:
- Editorial fade/slide with staggered evidence elements.
- Respect reduced motion.

Page transitions:
- Use restrained crossfade/clip for practice navigation if future app shell supports it.

## 12. Strongest And Weakest Pages

### Strongest

1. `/scam/broker/`
   - Strong specificity: card recipients, crypto, taxes/fees, fake broker mechanics.
   - Good basis for premium case/evidence storytelling.

2. `/scam/pressure/`
   - Strong emotional and legal hook: "I transferred myself" objection.
   - Can become a very persuasive page with a pressure timeline.

3. `/zpp/med-error/`
   - High-stakes domain with clear evidence needs.
   - Needs careful trust/medical expertise framing.

4. `/zpp/insurance/`
   - Clear recoverable-money logic and common objection pattern.

### Weakest

1. `/auto-law/`, `/auto-law/dkp/`, `/auto-law/forced-addons/`
   - Public placeholders; harm completeness.

2. `/`
   - Too little firm authority; acts as a category menu, not a premium home page.

3. `/news/`
   - Strong idea, weak editorial control; imported feed/default images reduce trust.

4. ZPP long-tail service pages as a group
   - Good content, but too similar in sequence and visual rhythm.

## 13. Maximum Product Quality Growth

Priority 1: rebuild Home as a premium firm-level product entry.
- Biggest perception jump.
- Moves KEIS away from a collection of landing pages.

Priority 2: create canonical page patterns by intent.
- Fraud emergency pattern.
- Consumer claim-builder pattern.
- Journal editorial pattern.
- Legal utility pattern.

Priority 3: move evidence and cases higher.
- More trust per scroll.
- Better conversion before fatigue.

Priority 4: create a real card system.
- Cards become functional: route, evidence, objection, case, insight.
- Removes decorative sameness.

Priority 5: fix CTA strategy.
- Match CTA to user state and page context.
- Fewer generic forms, stronger intent.

Priority 6: photo/art direction.
- Keep best existing assets.
- Add real team/work photography for credibility.

Priority 7: editorialize news.
- Turn raw news into a legal journal with practical consequence.

## 14. Design Direction Summary

The new KEIS product should feel like:
- an international legal practice adapted to Russian consumer/fraud disputes;
- a calm legal command center;
- a place where panic is converted into evidence, claims, court strategy, and enforcement;
- editorial, restrained, document-driven, not decorative.

Reference use:
- WilmerHale: hero confidence, typographic hierarchy, editorial trust, insights rhythm.
- HLC: depth, scroll storytelling, case-study energy, navigation by practices/sectors.
- DORAI: every block must have Reference, Pattern, Genes, Why.

## 15. Risks And How They Were Checked

Risk 1: treating deploy duplicates as separate pages.
- Check: compared `sitemap.xml`, root files, and `dist-timeweb`; plan uses canonical root pages only.

Risk 2: over-relying on current visual design.
- Check: current site was used only as content inventory; references and new IA define structure.

Risk 3: losing useful existing assets.
- Check: inventoried major asset groups and identified keep/replace/new-photo categories.

## 16. Approval Gate

No implementation is approved by this document.

Before any implementation:
1. Approve or adjust new IA.
2. Approve page-pattern split.
3. Approve image policy.
4. Approve typography/design direction.
5. Approve first implementation scope.

Until approval: wait.
