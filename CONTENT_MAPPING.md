# CONTENT_MAPPING

Project: KEIS Legal Group  
Branch: `premium-redesign-dorai`  
Status: content strategy and mapping only  
Implementation: not approved, not started

## 0. Repro

Base documents:

- `DESIGN_RESTRUCTURE_PLAN.md`
- `DESIGN_RESTRUCTURE_REVIEW.md`
- `EXPERIENCE_ARCHITECTURE.md`
- `VISUAL_DIRECTION.md`

Canonical content sources:

- Root pages: `index.html`, `scam/*`, `zpp/*`, `auto-law/*`, `news/index.html`, legal utility pages.
- Reviews: `assets/reviews/reviews.json`.
- News feed: `news/news.json`.
- Visual assets: `assets/block`, `assets/scenarios`, `assets/cases`, `assets/reviews`, `assets/news`, `assets/icons`.

Non-canonical sources:

- `dist-timeweb` is a deploy/build duplicate.
- `variant_2` is an experimental reference.
- Temporary screenshots and `.tmp`/`tmp` artifacts are not content sources.

Core mapping principle:

**Content is not rewritten. It is assigned a new role in the journey: stabilize -> recognize -> protect -> structure -> decode -> prove -> decide -> contact.**

## 1. Full Existing Content Map

### 1.1 Text

Text inventory by source:

| Source | Existing text groups | New role |
|---|---|---|
| `/` | Main H1, three direction descriptions, reviews/footer text | Home worldview, practice systems, selected trust |
| `/scam/` | Fraud H1, frequent problems, trust process, signs, situations, why hard, what helps, cases, FAQ | Fraud reconstruction journey |
| `/scam/broker/` | Broker H1, scheme types, signs, card transfer, crypto, extra fees, proof, why hard, what helps, cases, FAQ | Broker stop-loss and money trail |
| `/scam/pressure/` | Pressure H1, pressure sequence, signs, self-transfer objection, bank refusal, recipient recovery, cases, FAQ | Pressure reconstruction and refusal decoder |
| `/scam/hack/` | Unauthorized credit H1, access route, delayed discovery, credit proof, money movement, bank refusal, FAQ | Access trace and credit-risk clock |
| `/zpp/` | Consumer H1, problem types, preparation, signals, violation proof, calculation, demands, why hard, process, cases, FAQ | Consumer claim-builder hub |
| `/zpp/services/` | Poor-service H1, problems, preparation, signs, result gap, calculation, demand, FAQ | Service result-gap claim |
| `/zpp/refund/` | Defective goods H1, problems, preparation, defect proof, refund calculation, seller demand, FAQ | Product defect proof |
| `/zpp/insurance/` | Forced-insurance H1, problems, preparation, contract/insurance proof, premium calculation, bank/insurer demand, FAQ | Contract anatomy and deadline logic |
| `/zpp/contractor/` | Contractor H1, problems, preparation, work defects, loss calculation, demand, FAQ | Scope/acts/refusal claim |
| `/zpp/furniture/` | Furniture H1, problems, preparation, defect/mismatch, refund calculation, demand, FAQ | Specification and delivery evidence |
| `/zpp/renovation/` | Renovation H1, problems, preparation, repair defects, cost/neustoyka, demand, FAQ | Defect atlas and acceptance risk |
| `/zpp/build-contract/` | Construction H1, problems, preparation, construction defects/deadlines, calculation, demand, FAQ | Schedule/defect/extra-charge pressure map |
| `/zpp/lawyer-claim/` | Lawyer-claim H1, problems, preparation, non-performance, missed deadlines, refund/doc transfer, FAQ | Promised work vs actual work ledger |
| `/zpp/med-error/` | Medical H1, problems, preparation, error signs, records, harm/expense proof, clinic demand, FAQ | Medical chronology and record control |
| `/news/` | Journal hero, sections, news feed, ask form | Legal Signals Desk |
| Legal pages | Privacy/cookie policy text | Trust appendix and legal assurance |
| `/thanks/` | Sent request confirmation | Confirmation guidance |

### 1.2 Images

Image inventory by group:

| Group | Count | Examples | New role |
|---|---:|---|---|
| `assets/block` | 106 | `kazan4-*`, `2blockteam-*`, `bubu`, `buoffer1-*`, `zpp*`, `broker-*`, `kred*`, `map-podval` | hero candidates, office trust, service atmosphere, background only if meaningful |
| `assets/scenarios` | 74 | `zpp*`, `med*`, `strah*`, `rem*`, `pod*`, `jr*`, `scp*`, `scc*` | scenario cards, evidence-context imagery |
| `assets/cases` | 32 | `pret/*`, `isk/*`, `resh/*`, `ispol/*` | proof/evidence surfaces |
| `assets/reviews` | 14 avatars | named review avatars | human trust support |
| `assets/news/editorial-covers` | 14 | legal/finance/court/medical covers | journal curation |
| `assets/icons` | 12 | phone, telegram, service icons, map pins | utility only, not primary visual language |

### 1.3 CTA

Existing CTA inventory:

| CTA | Current source | New role |
|---|---|---|
| `Записаться` | Header/modal across pages | Secondary persistent action, not first-screen pressure |
| `Получить консультацию` | Hero/form/modal | Replace role with low-risk case review |
| `Получить консультацию ->` | Mid-page CTA | Use only after proof or evidence logic |
| `Нужна консультация ->` | FAQ ask block | Use after objection has been answered |
| `Написать нам` | Footer/home | Human contact fallback |
| `Подробнее` | Home/scam routes | Diagnostic route continuation |
| `Показать ещё` | News | Journal pagination only |
| `Консультация` | Legal pages | Utility support, low emphasis |
| `Вернуться` | Legal pages | Utility navigation |
| `На главную` | Auto placeholders | Placeholder recovery only, not target experience |

### 1.4 Reviews

Existing review source: `assets/reviews/reviews.json`, 14 reviews.

Review clusters:

| Review names | Content theme | New placement |
|---|---|---|
| Rebekka 100 | Illegal credit / credit dispute | `/scam/hack/`, unauthorized credit proof |
| Андрей Кур | Hard case after other firms failed | Home trust, complex-case confidence |
| Екатерина Басова, Полина Игоревна | Auto purchase defects | Future auto-law / DKP pages |
| Андрей К., dsw-sergei, Денис Малыгин, Александр Коскин | Consumer protection / services / goods | `/zpp/`, `/zpp/services/`, `/zpp/furniture/`, `/zpp/refund/` |
| Елизавета Г., Илья Рысаев, Белла, Дарина Поваляева | Court process / lawyer accountability / support | Firm trust and process proof |
| Ионов Д., Татьяна Громова | General satisfaction | Footer/trust support only, not primary proof |

### 1.5 Cases

Existing cases are embedded as `data-title`, `data-lead`, `data-result`, `data-duration`, `data-tags`, `data-docs` on page case showcases.

Case families:

| Source | Case theme | New role |
|---|---|---|
| `/scam/` | mixed fraud recovery examples | Fraud hub case-file sampler |
| `/scam/broker/` | broker/crypto/card-recipient recovery | Broker case-file proof |
| `/scam/pressure/` | pressure transfer, Mir Pay, SBP, bank transfer | Pressure reconstruction proof |
| `/scam/hack/` | limited extracted cases in current markup | Needs dedicated unauthorized-credit cases or matched review proof |
| `/zpp/*` | many pages currently reuse fraud-like case titles | Must be remapped or treated as placeholder mismatch until page-specific case content exists |

### 1.6 FAQ

FAQ inventory groups:

| Group | Existing FAQ examples | New timing |
|---|---|---|
| Fraud general | self-transfer, bank refusal, police, card owner, months passed | before CTA, after refusal decoder |
| Broker | card recipient, crypto, foreign recipient, tax/commission, documents | stop-loss and evidence phases |
| Pressure | self-transfer, bank refusal, recipient, months passed, new payment, deleted chats | before trust and before CTA |
| Hack | current FAQ overlaps broker questions | requires page-specific review before Figma |
| ZPP general | seller silent, no receipt, service deadline, expertise, forced insurance | during claim-builder, before CTA |
| Services | no paper contract, first step, court, rework vs refund, cost | objection/decision phase |
| Refund | seller refusal, no receipt, quality check, expert dispute | before calculation and CTA |
| Insurance | cooling-off, bank/insurer refusal, hidden terms | deadline/refusal decoder |
| Contractor/renovation/construction | signed act, expertise, extra works, delay/neustoyka | defect/acceptance risk phase |
| Lawyer claim | no result, complaint, documents, missed deadline, no contract | promised-vs-actual ledger |
| Medical | first days, records, expert review, DMS/insurer, amounts, duration | medical chronology and record control |

### 1.7 Forms

Existing forms:

- Hero form: name, phone, message, consent.
- Mid-page CTA form: name, phone, consent.
- Modal form: name, phone, message, consent.
- News ask form.
- Legal utility modal form.

New role:

- Keep as content/function inventory.
- Reframe as `Start a case file`.
- Do not let forms dominate early experience.
- Use only after user sees method, evidence, or a low-risk reason to contact.

### 1.8 Evidence

Existing evidence content appears in:

- cases `data-docs`: pretension, claim, court decision, enforcement writ, bank statements, payment documents.
- FAQ and process text: chats, screenshots, receipts, contracts, medical records, expert reports, acts, refusal letters.
- assets/cases document images.

New role:

- Convert into evidence surfaces:
  - `Evidence Strength Meter`;
  - `Document Anatomy`;
  - `Case File Proof`;
  - `Refusal Decoder`.

### 1.9 Statistics

Existing statistics:

- `30+ лет` practice per lawyer.
- `400 млн+` returned.
- `24/7` lawyer availability.
- `1700 дел+` cases.
- case-specific result amounts and durations.

New role:

- Do not lead with broad metrics.
- Use broad metrics after method trust.
- Use case-specific result/duration inside case files.
- Use statistics as proof context, not hero decoration.

### 1.10 Icons

Existing icons:

- phone;
- telegram;
- service icons `s1`-`s6`;
- hand icon;
- Yandex map pins;
- logo marks.

New role:

- Utility only.
- Do not use as primary visual system.
- Replace service-icon logic with case-file labels/status language.

### 1.11 Documents

Existing document assets:

- `assets/cases/pret/*` — претензия.
- `assets/cases/isk/*` — иск.
- `assets/cases/resh/*` — решение.
- `assets/cases/ispol/*` — исполнительный лист.

New role:

- Primary proof/evidence visual system.
- Use as case-file sequence:
  - claim -> lawsuit -> decision -> enforcement.
- Use carefully with redaction/annotation rules during design.

## 2. Element Mapping By Page

### 2.1 Home `/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| `Юридическая защита по ключевым направлениям` | `index.html` H1 | Home | Worldview Hero | Hero | Keep as source intent, but role becomes firm-level thesis rather than category intro |
| `Мошенничество` direction | `index.html` H2/card | Home | Practice System: Fraud Reconstruction | Decision | Route by problem after worldview |
| `Защита прав потребителей` direction | `index.html` H2/card | Home | Practice System: Consumer Claim Builder | Decision | Show consumer disputes as claim-building system |
| `Автоюрист` direction | `index.html` H2/card | Home | Practice System: Auto Dispute | Support | Keep visible only as future/limited practice until real content approved |
| Home reviews | `index.html` | Home | Selected Human Proof | Trust | Use 1-2 contextual reviews, not carousel |
| Footer contact/about/directions | `index.html` | Global | Firm Trust Close | Support | Keep as utility trust and navigation |

### 2.2 Fraud Hub `/scam/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Fraud H1 | `/scam/` | Fraud Hub | Crisis Recognition Hero | Hero | Names money-loss state immediately |
| `Частые проблемы` | `/scam/` | Fraud Hub | What Happened Diagnostic | Decision | Converts problem cards into plain-language route |
| `Выстраиваем честные отношения` | `/scam/` | Fraud Hub/Home | KEIS Standards | Trust | Becomes restraint and method proof, not generic trust |
| `Признаки обмана` | `/scam/` | Fraud Hub | Designed Pressure System | Problem/Objection | Helps user stop self-blame |
| `Ситуации... ежедневно` | `/scam/` | Fraud Hub | Recognition Scenarios | Decision | User recognizes self before choosing service |
| `Почему самостоятельно... сложно` | `/scam/` | Fraud Hub | Why Refusal Is Not The End | Objection | Belongs after evidence orientation |
| `Что поможет...` | `/scam/` | Fraud Hub | First Evidence Checklist | Evidence | Immediate practical value |
| Fraud cases | `/scam/` | Fraud Hub | Case File Sampler | Proof | Mixed proof after method |
| Fraud FAQ | `/scam/` | Fraud Hub | Refusal/Decision Questions | FAQ/Objection | Show before CTA, not at bottom only |

### 2.3 Broker Fraud `/scam/broker/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Broker H1 | `/scam/broker/` | Broker Fraud | Withdrawal Blocked Hero | Hero | Immediate match to user panic |
| `Частые проблемы` broker schemes | `/scam/broker/` | Broker Fraud | Scheme Identification | Problem/Decision | User finds exact scheme |
| `Признаки обмана` | `/scam/broker/` | Broker Fraud | Fake Broker Signals | Problem | Recognition after stop-loss |
| Card transfer text | `/scam/broker/` | Broker Fraud | Money Trail: Card Recipient | Evidence | Explains recipient logic |
| Crypto text | `/scam/broker/` | Broker Fraud | Money Trail: Crypto | Evidence | Specific evidence path |
| Extra fee/tax text | `/scam/broker/` | Broker Fraud | Stop-Loss Alert | Objection/Decision | Must appear early to prevent new payment |
| Proof text | `/scam/broker/` | Broker Fraud | Evidence Strength Meter | Evidence | Helps user know what matters |
| Broker cases | `/scam/broker/` | Broker Fraud | Broker Case Files | Proof | Exact page-level proof |
| Broker FAQ | `/scam/broker/` | Broker Fraud | Payment/Recipient/Document Questions | FAQ | Before CTA after evidence map |

### 2.4 Pressure Transfer `/scam/pressure/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Pressure H1 | `/scam/pressure/` | Pressure Transfer | Self-Transfer Reframed Hero | Hero/Objection | The central emotion is self-blame |
| `Что обычно происходит...` | `/scam/pressure/` | Pressure Transfer | Pressure Reconstruction Timeline | Timeline | Shows manipulation sequence |
| `Признаки давления` | `/scam/pressure/` | Pressure Transfer | Designed Pressure Signals | Problem | Supports shame reduction |
| `Я сам перевёл...` | `/scam/pressure/` | Pressure Transfer | Self-Transfer Objection Breaker | Objection | Central page spine |
| `Банк ответил...` | `/scam/pressure/` | Pressure Transfer | Bank Refusal Decoder | Objection/Evidence | Converts refusal into analyzable object |
| `Деньги уже переведены...` | `/scam/pressure/` | Pressure Transfer | Recipient Recovery Route | Decision/Evidence | Shows hope after refusal |
| Pressure cases | `/scam/pressure/` | Pressure Transfer | Pressure Case Files | Proof | Demonstrates similar patterns |
| Pressure FAQ | `/scam/pressure/` | Pressure Transfer | Shame/Refusal/Timing Questions | FAQ | Before CTA after case proof |

### 2.5 Unauthorized Credit `/scam/hack/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Hack H1 | `/scam/hack/` | Unauthorized Credit | Debt Is Not The Whole Story Hero | Hero | Reframes debt panic |
| `Как получают доступ` | `/scam/hack/` | Unauthorized Credit | Access Route | Evidence/Timeline | Shows digital trace |
| `Почему люди долго не замечают` | `/scam/hack/` | Unauthorized Credit | Delayed Discovery Reassurance | Trust/Problem | Reduces shame |
| `Кредит оформили...` | `/scam/hack/` | Unauthorized Credit | Credit Formation Map | Evidence | Shows what to check |
| `Деньги ушли...` | `/scam/hack/` | Unauthorized Credit | Money Movement Map | Evidence | Connects credit to loss |
| `Банк не отменил кредит` | `/scam/hack/` | Unauthorized Credit | Bank Argument Simulator | Objection | Anticipates opposition |
| `Почему самостоятельно...` | `/scam/hack/` | Unauthorized Credit | Credit History Risk Clock | Decision | Should move higher than old placement |
| Hack FAQ | `/scam/hack/` | Unauthorized Credit | Needs correction | FAQ | Current overlap with broker FAQ requires content decision |

### 2.6 Consumer Hub `/zpp/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| ZPP H1 | `/zpp/` | Consumer Hub | Claim Builder Hero | Hero | Establishes recoverable claim logic |
| `Частые проблемы` | `/zpp/` | Consumer Hub | Consumer Problem Diagnostic | Decision | Routes by lived dispute |
| `Почему дело нужно готовить заранее` | `/zpp/` | Consumer Hub | Claim Validity Primer | Trust/Evidence | Explains why documents matter |
| `Сигналы что нарушено` | `/zpp/` | Consumer Hub | Violation Signals | Problem | Helps recognition |
| `Сначала показываем...` | `/zpp/` | Consumer Hub | Violation Proof | Evidence | Starts legal reasoning |
| `Считаем...` | `/zpp/` | Consumer Hub | Recoverable Amount | Decision | After validity, before CTA |
| `Переходим к требованиям` | `/zpp/` | Consumer Hub | Demand Route | Timeline | Shows next legal move |
| `Почему в одиночку тяжело` | `/zpp/` | Consumer Hub | Seller/Executor Objection Logic | Objection | Contextual, not bottom text |
| ZPP FAQ | `/zpp/` | Consumer Hub | Claim Questions | FAQ | During claim-builder and before CTA |

### 2.7 ZPP Service Pages

| Existing element family | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Service H1 | every `/zpp/*` | Same service page | Service-Specific Hero | Hero | Preserve legal issue and outcome |
| `Частые проблемы` | every `/zpp/*` | Same service page | Diagnostic Scenarios | Problem/Decision | Convert equal cards to lived situations |
| `Почему дело нужно готовить заранее` | every `/zpp/*` | Same service page | Evidence Readiness | Trust/Evidence | Shows why early structure matters |
| `Признаки/Сигналы` | every `/zpp/*` | Same service page | Violation Signals | Problem | Recognition |
| Three explanatory blocks | every `/zpp/*` | Same service page | Claim Builder Sequence | Evidence/Timeline/Decision | Combine into one legal path |
| `Почему сложно` | every `/zpp/*` | Same service page | Opponent Logic | Objection | Move near refusal/defense |
| `Как идёт работа` | every `/zpp/*` | Same service page | Legal Pressure Map | Timeline | Replace generic process |
| Cases | every `/zpp/*` | Same service page | Page-Specific Case Files | Proof | Current repeated fraud-like cases need validation |
| FAQ | every `/zpp/*` | Same service page | Contextual Questions | FAQ | Place by timing, not bottom bucket |

### 2.8 News `/news/`

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| `Юридический журнал KEIS` | `/news/` | Journal | Legal Signals Hero | Hero | Establish practical editorial purpose |
| `Главное сегодня` | `/news/` | Journal | Priority Legal Signals | Decision/Support | What matters now |
| `Популярные разборы` | `/news/` | Journal | Practical Explainers | Support | Authority and search |
| `Все новости` | `/news/` | Journal | Curated Feed | Support | Must be cleaned, not raw dump |
| `Последние изменения законодательства` | `/news/` | Journal | Change Tracker | Support/Decision | User consequence lens |
| `Что проверить сегодня` | `/news/` | Journal | Checklist | Decision | Links news to action |
| Ask form | `/news/` | Journal | Ask About This | CTA | Only after issue relevance |

### 2.9 Legal Utility Pages

| Existing element | From | New page | New block | Type | Why there |
|---|---|---|---|---|---|
| Privacy policy sections | `privacy-policy.html` | Privacy | Legal Assurance Document | Support | Trust appendix |
| Cookie sections | `cookies/index.html` | Cookies | Legal Utility Document | Support | Compliance |
| Thanks H1 | `thanks/index.html` | Confirmation | Submission Confirmation | Support/CTA | Must become next-step guidance |

## 3. Text Block Type Mapping

### 3.1 Type Definitions

| Type | Role in journey |
|---|---|
| Hero | first recognition and central promise |
| Problem | lived situation or symptom |
| Trust | reason to believe tone/method/people |
| Evidence | document, trace, proof material |
| Proof | case, review, result, document sequence |
| FAQ | residual or contextual question |
| Timeline | sequence of events or legal moves |
| CTA | next action |
| Support | utility or secondary context |
| Decision | helps user choose or act |
| Objection | answers doubt/refusal/opponent position |
| Stop-Loss | protects user from harmful next action |
| Case File | narrative proof structure |
| Refusal Decoder | converts refusal into analyzable next step |
| Counsel Note | expert judgement |

### 3.2 Existing Text To New Type

| Existing text group | New type |
|---|---|
| Page H1s | Hero |
| `Частые проблемы` | Problem + Decision |
| `Признаки`, `Сигналы` | Problem + Evidence |
| `Выстраиваем честные отношения` | Trust + Counsel Note |
| `Почему дело нужно готовить заранее` | Trust + Evidence |
| `Почему самостоятельно сложно` | Objection |
| `Что поможет` | Evidence + Stop-Loss |
| Broker tax/commission text | Stop-Loss + Objection |
| Pressure self-transfer text | Objection |
| Bank refusal text | Refusal Decoder |
| ZPP calculation text | Decision |
| ZPP demand text | Timeline + CTA support |
| Process text | Timeline / Legal Pressure Map |
| Case text | Case File + Proof |
| Review text | Proof + Human Trust |
| FAQ text | FAQ or Objection by timing |
| Legal policy text | Support |
| News text | Support + Decision |

## 4. Image Mapping

### 4.1 Image Decision Framework

| Decision | Meaning |
|---|---|
| Keep | Asset remains valuable with new role |
| Remove | Do not use in new product language |
| Replace | Current asset not strong enough; use better existing/new asset |
| Reshoot | Requires new real photography |
| Hero | Can carry first-screen meaning |
| Background | Can support atmosphere but not primary proof |
| Card | Useful inside scenario/evidence/case cards |
| Evidence | Can function as proof/document material |

### 4.2 Key Image Mapping

| Asset/group | Decision | New usage | Why |
|---|---|---|---|
| `assets/block/kazan4-*` | Keep / possibly Hero | Home or firm trust | Real/institutional atmosphere candidate |
| `assets/block/2blockteam-*` | Keep / reshoot later | Firm standards / human accountability | Team presence, but real-photo quality must be reviewed |
| `assets/block/great_K-*` | Keep / Background | Brand atmosphere | Use sparingly for institutional identity |
| `assets/block/people.webp` | Keep / Card or trust | Human trust | Secondary human proof |
| `assets/block/bubu.webp`, `mobubu.webp` | Keep / Background | Fraud hub atmosphere | Use only if not generic danger wallpaper |
| `assets/block/buoffer1-*`, `mobu1.webp` | Keep / Hero candidate | Broker page | Strong broker-specific visual if reframed as evidence context |
| `assets/block/offer3-*`, `mobu2.webp` | Keep / Hero candidate | Pressure page | Needs recomposition around pressure/evidence |
| `assets/block/offer2-*`, `mobu3.webp`, `kred*` | Keep / Hero or card | Unauthorized credit | Use for access trace/debt context |
| `assets/block/broker-*` | Keep / Evidence/background | Broker money trail | Useful for broker sections |
| `assets/block/zpp*.webp` | Keep / Card/Hero selective | Consumer pages | Must avoid sameness across ZPP pages |
| `assets/scenarios/*` | Keep / Card | Diagnostic scenarios | Good for lived situations if visually credible |
| `assets/cases/pret/*` | Keep / Evidence | Claim document step | Core document proof |
| `assets/cases/isk/*` | Keep / Evidence | Lawsuit step | Core document proof |
| `assets/cases/resh/*` | Keep / Evidence | Decision step | Core document proof |
| `assets/cases/ispol/*` | Keep / Evidence | Enforcement step | Core document proof |
| `assets/reviews/avatars/*` | Keep / Card | Contextual reviews | Use only with relevant review |
| `assets/news/editorial-covers/*` | Keep / Card | Curated journal | Better than default news images |
| `assets/news/news-*.webp` | Keep / replace selectively | Journal cards | Use only when matches article |
| `assets/icons/s1-s6.webp` | Replace/demote | Utility only | Old service-icon language feels generic |
| `assets/icons/phone.webp`, `telegram.webp` | Keep | Contact utility | Functional |
| Map assets | Keep | Footer/contact trust | Real location proof |
| AI-named images | Replace or demote | Secondary only | Not trust-critical |
| External Yandex avatars | Keep cautiously | Review proof | Authenticity support |

## 5. Case Mapping

### 5.1 Fraud Cases

| Case | Current source | New location | Why |
|---|---|---|---|
| Деньги ушли на карты физлиц | `/scam/` | Fraud Hub / Money Trail case file | Demonstrates recipient recovery |
| Перевод под давлением | `/scam/` | Pressure page + Fraud Hub | Central self-transfer objection |
| Кредит оформили после взлома | `/scam/` | Unauthorized Credit | Exact match for hack journey |
| Предоплата без услуги | `/scam/` | Fraud Hub or Services if validated | Crosses fraud/service boundary |
| Вывод заблокировали после доплат | `/scam/` | Broker page stop-loss proof | Supports "do not pay again" |
| Псевдообменник принял перевод и исчез | `/scam/` | Broker/Crypto money trail | Crypto/payment proof |
| Банк отказал после перевода под влиянием | `/scam/` | Pressure refusal decoder | Shows bank refusal not final |
| БКИ очистили после спорного кредита | `/scam/` | Unauthorized Credit credit-history proof | Addresses BKI anxiety |

### 5.2 Broker Cases

| Case | New location | Why |
|---|---|---|
| Брокер не вывел деньги | Broker Case File primary | Strongest page match |
| Потребовали налог за вывод | Stop-Loss + case file | Warns against new payment |
| Выплаты прекратились после взносов | Scheme identification | Shows staged trust pattern |
| Прибыль показали, деньги не отдали | Platform deception proof | Addresses fake dashboard |
| Счёт заблокировали после пополнений | Objection/fee trap | Common user scenario |
| Договор не дали, деньги приняли | Evidence gap case | Shows missing contract not fatal by itself |
| Деньги ушли на карты физлиц | Money trail | Recipient logic |
| Псевдообменник принял перевод и исчез | Crypto/payment trail | Specific recovery path |

### 5.3 Pressure Cases

| Case | New location | Why |
|---|---|---|
| Пополнение по реквизитам через Mir Pay | Pressure timeline | Shows controlled action |
| Четыре перевода по одним реквизитам | Evidence sequence | Shows repeat recipient pattern |
| Пополнение через банкомат | Evidence preservation | Receipt/check matters |
| Крупный перевод с комментарием “возврат долга” | Opponent argument simulator | Shows misleading payment purpose |
| Перевод через СБП по номеру телефона | Recipient recovery map | Shows SBP trace |

### 5.4 ZPP Cases

Current issue:

- Many ZPP pages currently show repeated fraud-like cases.
- They should not be used as final page-specific proof unless validated.

Mapping decision:

| Existing repeated case | Temporary new use | Required decision before Figma |
|---|---|---|
| Обещали доход, деньги не вывели | Do not use as ZPP proof | Replace with consumer-specific case |
| Потребовали налог за вывод | Do not use as ZPP proof | Replace with insurance/refund/contractor case |
| Выплаты прекратились после взносов | Do not use as ZPP proof | Replace with page-specific case |
| Прибыль показали, деньги не отдали | Do not use as ZPP proof | Replace |
| Счёт заблокировали после пополнений | Do not use as ZPP proof | Replace |
| Договор не дали, деньги приняли | Possible services/contractor if context rewritten later | Needs validation |
| Оформили кредит под видом защиты | Possible fraud/credit, not general ZPP | Needs validation |
| Навязали услуги при покупке авто | Future auto/forced-addons | Not general ZPP |

## 6. FAQ Timing Mapping

### 6.1 Timing Rules

| Timing | Meaning |
|---|---|
| До доверия | Use when the question blocks recognition or shame reduction |
| После доверия | Use when the question requires belief in method first |
| Перед CTA | Use when the question blocks contact |
| После CTA | Use as reassurance/confirmation or legal appendix |

### 6.2 FAQ Mapping By Family

| FAQ/question theme | Source | Timing | Why |
|---|---|---|---|
| `Можно ли вернуть деньги, если переводил сам?` | Fraud/Pressure | До доверия | Removes self-blame early |
| `Банк ответил отказом / сами подтвердили` | Fraud/Pressure | До доверия / Перед CTA | Central refusal objection |
| `Нужно ли заявление в полицию?` | Fraud/Broker/Pressure | После доверия | Needs method context |
| `Можно ли взыскать с владельца карты?` | Fraud/Broker/Pressure | После доверия | After money trail explanation |
| `Прошло несколько месяцев` | Fraud/Pressure | Перед CTA | Timing concern blocks action |
| `Брокер требует налог/комиссию` | Broker/Pressure | До доверия | Stop-loss question |
| `Какие документы нужны` | Broker/Pressure | Перед CTA | Prepares contact |
| `Криптовалюта/кошелёк/другая страна` | Broker | После доверия | Needs evidence path first |
| `Если переписка удалена` | Pressure | Перед CTA | Missing evidence anxiety |
| `Нет бумажного договора/чека` | ZPP services/refund/furniture/construction | До доверия | Common shame/validity blocker |
| `Что делать первым делом` | ZPP services/furniture/construction/medical | До доверия | Immediate orientation |
| `Обязательно ли идти в суд` | ZPP | После доверия | Needs process explanation |
| `Исполнитель предлагает переделку` | Services/renovation | Перед CTA | Decision blocker |
| `Подписан акт` | Renovation/construction | До доверия | Critical acceptance risk |
| `Когда нужна экспертиза` | Medical/renovation/refund | После доверия | Needs evidence model |
| `Как получить историю болезни` | Medical | До доверия | Immediate document control |
| `Какие суммы можно требовать` | Medical/ZPP | После доверия | After claim validity |
| `Сколько стоит юрист` | ZPP service pages | Перед CTA | Contact blocker |
| `Что произойдёт после заявки` | ZPP hub | Перед CTA / После CTA | Converts contact anxiety |

## 7. CTA Mapping

| CTA | New moment | User decision | Why here |
|---|---|---|---|
| `Записаться` | Header/persistent secondary | "I already trust enough to talk" | Useful for returning users, too aggressive as main first-screen action |
| `Получить консультацию` | Replace role with `Начать разбор ситуации` | "I want a first review" | More aligned with low-risk case-file start |
| `Получить консультацию ->` | After case-file proof | "They have shown method; I can ask" | Must follow evidence/proof |
| `Нужна консультация ->` | After contextual FAQ/objection | "My objection was answered" | Works only after the question is resolved |
| `Написать нам` | Footer/contact trust | "I want human fallback" | Non-primary contact route |
| `Подробнее` | Diagnostic cards | "This looks like my situation" | Route decision |
| `Показать ещё` | Journal list | "I want more articles" | Content browsing only |
| `Консультация` | Legal pages | "I came from policy/cookie page and need help" | Low emphasis |
| `Вернуться` | Legal pages | "Return to previous journey" | Utility |
| `На главную` | Auto placeholders | "This page is unavailable" | Placeholder only, should disappear when auto content exists |

## 8. Block Pattern Mapping

| Existing content | New block | Reference | Pattern | Genes | Visual Language | Emotion |
|---|---|---|---|---|---|---|
| H1s | Recognition Hero | WilmerHale + Apple | Worldview Hero | one exact claim, low density, evidence cue | editorial, calm, structured | calm recognition |
| Frequent problems | Diagnostic Scenarios | Notion + Gov.uk | Task Surface | lived situation, first evidence, route | clean diagnostic surface | recognition |
| Signs/priznaki | Pressure/Violation Signals | Reuters Graphics | Investigative Narrative | signal, meaning, next proof | annotated evidence cards | self-understanding |
| What helps | Stop-Loss + Evidence Checklist | Gov.uk | Public-Service Clarity | do not do, preserve, first step | direct warning, light surface | control |
| Why hard | Opponent Logic | Linear + legal strategy | Opponent Argument Simulator | they say, weak point, counter-proof | side-by-side argument | strategic trust |
| Bank/seller/clinic refusal | Refusal Decoder | Gov.uk + Anthropic | Refusal Decoder | refusal phrase, meaning, next request | document annotation | hope |
| Process | Legal Pressure Map | Linear | Live Operating Surface | state, actor, document, pressure | operational case surface | rational momentum |
| Cases | Case File | HLC + Reuters Graphics | Investigative Case File | facts, evidence, objection, move, result | case-file narrative | proof/trust |
| Reviews | Contextual Human Proof | WilmerHale | Client Outcome | quote, situation, relevance | restrained testimonial proof | human trust |
| Broad metrics | Scale Proof | Ankura | Institutional Context | number, source, relevance | quiet numeric hierarchy | confidence |
| Forms | Start Case File | Linear + Notion | Low-Risk Intake | situation, evidence, contact, next step | focused, non-sales | rational action |
| News | Legal Signals Desk | Anthropic + WilmerHale | Editorial Consequence | change, affected user, action | editorial cards | authority |
| Policy/cookie text | Trust Appendix | Gov.uk | Legal Utility | clarity, rights, contact | document clarity | safety |
| Thanks page | Confirmation Guidance | Apple + Gov.uk | Next-Step Confirmation | what next, prepare, do not delete/pay/sign | calm exactness | relief |

## 9. Missing Content

### 9.1 New Photography

Needed:

- real KEIS team portraits;
- lawyer reviewing documents;
- client-consultation scene without stock staging;
- office details;
- evidence desk;
- document review process;
- court/preparation atmosphere.

Why:

- existing generated/atmospheric images cannot carry trust-critical moments alone.

### 9.2 New Schemes / Infographics

Needed:

- fraud money-trail scheme;
- pressure timeline;
- unauthorized credit access trace;
- consumer claim-builder map;
- medical chronology;
- renovation defect/acceptance risk map;
- forced-insurance contract anatomy.

### 9.3 New Document/Evidence Material

Needed:

- redacted real or staged refusal letters;
- bank refusal examples;
- seller refusal examples;
- clinic record request example;
- acceptance act example;
- payment receipt examples;
- expert conclusion examples.

### 9.4 New Case Content

Needed:

- page-specific ZPP case files;
- unauthorized-credit case files;
- auto-law case files if auto pages are rebuilt;
- case outcomes matched to reviews.

### 9.5 New Icons / Labels

Needed:

- status labels, not decorative icons:
  - evidence strong;
  - missing link;
  - urgent;
  - refusal;
  - preserve;
  - deadline;
  - next action.

### 9.6 New Microcopy

Needed later, after approval:

- stop-loss warnings;
- low-risk intake explanation;
- confirmation next steps;
- case confidence labels;
- refusal decoder labels.

Note:

- This is content strategy need, not implementation.
- Existing content is not rewritten in this document.

## 10. Master Mapping Table

| Old content | New block | New page | Pattern | Reference | Emotion | Purpose | CTA |
|---|---|---|---|---|---|---|---|
| Home direction content | Practice Systems | Home | Task Surface | Notion | orientation | route after trust | Подробнее |
| Fraud H1 | Crisis Recognition Hero | Fraud Hub | Worldview Hero | WilmerHale | recognition | stabilize panic | Start case file later |
| Fraud problems | What Happened Diagnostic | Fraud Hub | Diagnostic Scenario | Notion/Gov.uk | recognition | self-identification | Подробнее |
| Fraud signs | Designed Pressure System | Fraud Hub | Investigative Narrative | Reuters Graphics | shame reduction | explain mechanism | none |
| Fraud what helps | First Evidence Checklist | Fraud Hub | Stop-Loss/Evidence | Gov.uk | control | protect user | Start review |
| Fraud cases | Fraud Case Sampler | Fraud Hub | Case File | HLC | trust | proof of method | CTA after proof |
| Broker H1 | Withdrawal Blocked Hero | Broker | Worldview Hero | Apple/WilmerHale | panic reduced | exact match | none first |
| Broker tax/commission | Stop-Loss Alert | Broker | Stop-Loss Alert | Gov.uk | urgency/control | prevent extra loss | Start review after warning |
| Broker card/crypto text | Money Trail | Broker | Evidence Map | Linear | hope | show traceability | none |
| Broker cases | Broker Case Files | Broker | Case File | HLC/Reuters | trust | proof | Start case file |
| Pressure H1 | Self-Transfer Reframed Hero | Pressure | Objection Hero | WilmerHale | shame reduction | reframe blame | none first |
| Pressure sequence | Pressure Reconstruction | Pressure | Timeline | Reuters Graphics | clarity | show manipulation | none |
| Bank refusal text | Bank Refusal Decoder | Pressure | Refusal Decoder | Gov.uk | hope | decode refusal | Start review |
| Pressure cases | Pressure Case Files | Pressure | Case File | HLC | trust | proof | Start case file |
| Hack access text | Access Trace | Hack | Evidence Trace | Linear | clarity | show digital path | none |
| Hack bank refusal | Bank Argument Simulator | Hack | Opponent Logic | Linear | strategic trust | anticipate bank | Start review |
| ZPP H1 | Claim Builder Hero | ZPP | Worldview Hero | WilmerHale | orientation | consumer claim framing | none first |
| ZPP problems | Consumer Diagnostic | ZPP | Task Surface | Notion | recognition | route disputes | Подробнее |
| ZPP calculation | Recoverable Amount | ZPP | Decision Model | Linear | rational interest | value clarity | Start document review |
| ZPP demands | Demand Route | ZPP | Pressure Map | Linear | momentum | next legal move | CTA after route |
| ZPP FAQ | Contextual Questions | ZPP | Objection Handling | Gov.uk | certainty | unblock contact | Start review |
| Medical records text | Medical Record Control | Med Error | Document Anatomy | Reuters/Gov.uk | control | get records | Start review |
| Renovation defect text | Defect Atlas | Renovation | Evidence Anatomy | Reuters | clarity | structure defects | Start review |
| Insurance contract text | Contract Anatomy | Insurance | Document Anatomy | Apple Newsroom/Reuters | discovery | expose hidden service | Start review |
| Lawyer claim text | Promise vs Work Ledger | Lawyer Claim | Ledger Surface | Linear | validation | show non-performance | Start review |
| News feed | Legal Signals Desk | News | Editorial Consequence | Anthropic/WilmerHale | authority | practical updates | Ask about this |
| Reviews | Contextual Human Proof | Relevant pages | Client Outcome | WilmerHale | human trust | corroborate method | none/secondary |
| Document images | Evidence Sequence | Case files/global proof | Case File Evidence | Reuters | proof | material trust | none |
| Broad metrics | Institutional Context | Home/Firm proof | Scale Proof | Ankura | confidence | scale after method | none |
| Forms | Start Case File | All conversion paths | Low-Risk Intake | Linear/Notion | rational action | contact safely | Submit review |
| Thanks text | Confirmation Guidance | Thanks | Next-Step Confirmation | Apple/Gov.uk | relief | reduce post-submit anxiety | phone/telegram fallback |

## 11. Final Figma Decision Check

### Are there still decisions that would need to be made during Figma?

Yes.

The documentation is strong enough to define direction, but not yet enough for a strong designer to build without asking additional content questions.

### Remaining decisions before Figma

1. Exact first-screen message for Home.
2. Exact first-screen message for Fraud Hub.
3. Exact first-screen message for Broker.
4. Exact stop-loss wording for Broker.
5. Exact stop-loss wording for Pressure.
6. Exact stop-loss wording for ZPP/renovation/contractor acceptance risks.
7. Case-file data model: which fields are mandatory.
8. Which real cases are legally safe to show.
9. Which ZPP pages have valid page-specific cases.
10. Which current ZPP case titles are placeholders and must be replaced.
11. Which reviews can be matched to which pages.
12. Which metrics have source confidence.
13. Which images are real, generated, staged, or external.
14. Which images may be used in trust-critical placements.
15. Which document images need redaction.
16. Which refusal decoder examples are approved.
17. Which FAQ items become contextual objections and which remain appendix.
18. Which forms keep message field and which become low-risk intake.
19. Which auto-law pages remain hidden/placeholder until content exists.
20. Which news items are editorially usable versus raw imported feed.
21. Which legal statements need lawyer review before public display.
22. Which "we may not take the case" language is acceptable.
23. Which case-result amounts can be displayed and where.
24. Which images require reshoot before premium design.
25. Which page family gets priority for the first Figma prototype.

### Approval recommendation

Do not move to Figma yet.

Next documentation step should be:

**CONTENT_GAPS_AND_COPY_BRIEF.md**

It should define:

- approved first-screen messages;
- approved stop-loss warnings;
- approved case-file fields;
- approved page-specific proof;
- content gaps by page;
- which existing content can be used as-is;
- which content requires legal/editorial review.

Until that is done, a strong designer can build the visual system direction, but will still be forced to make content decisions inside Figma. That would weaken the process.

## 12. Approval Gate

Before design work:

1. Approve this content mapping.
2. Decide whether ZPP cases are valid or placeholders.
3. Approve the case-file model.
4. Approve the FAQ timing model.
5. Approve image usage restrictions.
6. Approve which missing content must be produced before Figma.

Until approval, no implementation or interface drawing should begin.
