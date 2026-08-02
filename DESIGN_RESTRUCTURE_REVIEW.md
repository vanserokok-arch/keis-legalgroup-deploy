# DESIGN_RESTRUCTURE_REVIEW

Project: KEIS Legal Group  
Object of review: `DESIGN_RESTRUCTURE_PLAN.md`  
Status: critical audit only  
Implementation: not approved, not started

## 0. Position

This review does not defend the previous plan. It treats it as a draft that must survive the standards of a senior creative direction review.

Judgement:
- The plan is useful as a strategic cleanup.
- It is not yet a world-class creative product concept.
- It still thinks too much in "website sections".
- It does not yet define a memorable proprietary experience for KEIS.
- It would improve conversion and trust, but it would probably not win Awwwards, CSS Design Awards, or FWA in its current form.

## 1. What To Keep

Keep these decisions because they are strategically correct:

- Treat the current site as content archive, not design source.
- Preserve SSOT distinction: root pages are canonical; `dist-timeweb` and `variant_2` are not.
- Split page logic into fraud, consumer, journal, and legal utility patterns.
- Move evidence and cases higher than generic FAQ/process.
- Remove duplicate metric bridges.
- Treat CTA as intent-specific, not one generic "consultation" everywhere.
- Keep existing legal copy as raw material.
- Keep case/evidence assets as proof material.
- Keep office/map/contact as trust anchors.
- Rebuild typography instead of inheriting current Roboto Slab direction.
- Require real photography for team/work/evidence.
- Use DORAI as a decision framework per block.

These are foundational, but foundational is not the same as award-level.

## 2. What Looks Weak

### 2.1 The plan is still too modular

The previous plan replaces old blocks with better blocks, but the mental model remains:

Hero -> router -> proof -> cases -> objections -> process -> FAQ -> CTA.

That is competent. It is not exceptional. A top-tier studio would ask for a concept that makes the whole experience feel inevitable, not a sequence of improved sections.

### 2.2 The core creative idea is too generic

"Calm legal command center" is directionally right, but not ownable. It could describe any premium law firm, insurance claim service, compliance product, or financial dispute platform.

KEIS needs a sharper product idea, for example:

- "From chaos to claim."
- "A legal evidence engine for people who have already been harmed."
- "The system that turns panic, receipts, chats, contracts, and refusals into legal pressure."

The plan needs one controlling metaphor and one interaction model.

### 2.3 DORAI is used as annotation, not as design engine

The plan says every block has Reference, Pattern, Genes, Why, but many blocks still use generic pattern names:

- Evidence Map.
- Case Spotlight.
- Process Timeline.
- Trust Section.
- Final CTA.

These are not yet DORAI-grade patterns. They are labels.

### 2.4 The emotional arc is underdesigned

The user journey is mostly rational:

problem -> evidence -> case -> process -> CTA.

But people arriving after fraud, medical harm, bad renovation, or a legal-service failure are in a charged state. The plan does not choreograph emotional transitions precisely enough:

1. shock;
2. shame or self-blame;
3. fear of being dismissed;
4. need for proof that there is a path;
5. readiness to act.

The current plan jumps too quickly from anxiety to information architecture.

### 2.5 The home page is still a directory

The new home page is better than the current one, but still functions as:

Hero -> router -> proof -> cases -> insights -> reviews -> CTA.

That is a high-quality service homepage, not a signature digital product. It lacks a memorable first interaction or worldview.

### 2.6 Cases are not designed as a system of persuasion

"Case Spotlight" is correct but shallow. Award-level case storytelling should expose:

- initial mess;
- what the opponent claimed;
- what evidence changed the case;
- what legal move created pressure;
- what outcome happened;
- what the user should learn.

The plan currently treats cases as proof cards, not legal narratives.

### 2.7 Trust is still too dependent on reviews and metrics

Reviews and metrics help, but they are common. Premium trust should come from:

- authored legal judgement;
- named experts;
- procedural transparency;
- document craft;
- restraint;
- the ability to say "we may not take this case".

The previous plan does not introduce a strong "case acceptance" or "legal triage" pattern.

### 2.8 The visual direction is under-specified

"Editorial serif, humanist sans, paper, charcoal, copper" is plausible but also common. It risks becoming another premium beige legal site.

The plan needs a more distinctive visual language:

- evidence as layers;
- redactions;
- stamped procedural states;
- trace lines;
- legal-document grids;
- calm cinematic photography;
- precise microcopy;
- restrained but memorable spatial behavior.

### 2.9 The plan does not define signature motion

The animation section is safe, but not creative. "Fade/slide", "quiet hover", "parallax" are baseline. Award-level motion needs narrative function:

- evidence assembling into a claim;
- scattered facts aligning into a timeline;
- bank/seller/clinic objection collapsing into a legal counterargument;
- a case file moving from intake to enforcement.

### 2.10 It still resembles the old site in vocabulary

Several planned blocks are old blocks with better names:

- `Signals` is still "Признаки".
- `Evidence Checklist` is still "Что поможет".
- `Process Timeline` is still "Как идёт работа".
- `FAQ` remains as a late generic bucket.
- `CTA` still closes pages in a familiar landing-page way.

The plan needs stronger structural invention.

## 3. Blocks In The Wrong Place

### 3.1 Home: Situation Router too early

In the previous plan the router comes immediately after the hero. That preserves the old "choose direction" behavior. For a premium firm, users should first understand why KEIS is different.

Better order:
1. Hero worldview.
2. Signature evidence-to-claim interaction.
3. Selected proof/cases.
4. Then problem router.

Why: route after conviction, not before.

### 3.2 Fraud Hub: First 24 Hours Checklist too early without reassurance

A checklist immediately after routing may feel procedural and cold. Fraud users often need to hear "you are not stupid, this is a designed pressure system" before being told what to collect.

Better order:
1. Hero.
2. "This is how the scheme controlled the situation."
3. "What can still be traced."
4. Then checklist.

### 3.3 Broker Page: Do Not Pay Again should be higher

The previous order places `Do Not Pay Again` after scheme diagnosis and payment trail. In broker fraud, preventing the next payment is the most urgent conversion and protection moment.

Better order:
1. Hero.
2. Stop-loss warning.
3. Scheme diagnosis.
4. Payment trail.

### 3.4 Pressure Page: Bank Objection Breaker should be the central spine

The strongest hook is "I transferred it myself." This is not a subsection; it is the page concept.

The whole page should revolve around reconstructing absence of free will.

### 3.5 Hack Page: Credit History / Debt Pressure too low

People with unauthorized credit fear collectors, credit history, and bank pressure. This should appear before cases, not after them.

### 3.6 ZPP Hub: What Can Be Recovered too early

Money recovery is important, but consumer pages first need to establish claim validity. Otherwise it can feel like a compensation calculator without legal seriousness.

Better:
1. Problem router.
2. Claim validity.
3. Evidence.
4. Recoverable amount.

### 3.7 Reviews remain too late

Reviews are late across most proposed sequences. Some pages need one highly relevant review or quote much earlier, not a large review block near the end.

### 3.8 FAQ remains too default

FAQ at the bottom is a leftover web convention. Many questions should be distributed as contextual objections; the remaining FAQ should be short, almost legal appendix-like.

## 4. Blocks To Remove Entirely

Remove these from the future concept unless they earn a precise role:

- Generic `Trust Section`.
- Generic `Final CTA`.
- Generic `FAQ`.
- Generic `Process Timeline` repeated on every service page.
- Generic `Reviews` block repeated everywhere.
- Generic `Insights` strip on pages where it interrupts case urgency.
- Any route card that merely links to another page without diagnostic value.
- Any metric without source, context, or relation to the user's problem.
- Any parallax that exists only for depth.
- Any card grid that has six equal cards with equal visual weight.

## 5. Blocks To Combine

Combine these to reduce section count and increase narrative force:

- `Signals` + `Objection Breaker` -> `Why They Refuse / Why It Can Still Work`.
- `Evidence Checklist` + `Process` -> `From Evidence To Action`.
- `Case Spotlight` + `Documents Needed` -> `The Evidence That Changed The Case`.
- `Reviews` + `Case Outcome` -> `Client Outcome`.
- `Trust Section` + `About Firm` -> `How KEIS Decides And Acts`.
- `Journal` + `Practice Links` -> `Legal Updates With Consequence`.
- `Final CTA` + `What To Prepare` -> `Start With A Case File`.

## 6. Where User Logic Breaks

### 6.1 User is asked to self-route before they have language

Many users do not know whether their issue is "fraud", "consumer protection", "bank dispute", "claim", or "civil recovery". The router should help name the situation, not ask users to already know the category.

### 6.2 Legal mechanism appears too abstract

"Evidence -> claim -> court -> enforcement" is too universal. Fraud, medical, construction, and forced insurance have different pressure points. The plan needs mechanism per domain.

### 6.3 The plan assumes users want to read

Award-level IA should allow scanning through states:

- "this happened";
- "this means";
- "save this";
- "do not do this";
- "we can check this";
- "here is proof".

The previous plan still depends on section-by-section reading.

### 6.4 The CTA does not respect hesitation

Some users are not ready for a full consultation. They may want:

- "Check if this refusal is final";
- "Check if I still have a deadline";
- "Check which document matters";
- "Check if paying again is dangerous".

The plan's CTA variants are better than current, but not emotionally granular enough.

### 6.5 Hubs and service pages may duplicate too much

If hubs and services both have hero, router, evidence, cases, objections, process, reviews, CTA, the user experiences deja vu. Hubs should diagnose; service pages should prosecute the argument.

## 7. Where Emotional Engagement Falls

- After the hero, the plan often becomes operational too quickly.
- The user does not get a strong "we understand the manipulation" moment.
- There is no human expert voice early enough.
- There is no decisive visual moment where chaos becomes order.
- Cases are treated as proof, not suspense.
- The office/team appears as trust support, not as a living authority.
- The journal is utilitarian, not intellectually magnetic.
- Final CTA is polite but not memorable.

## 8. Where The Site Becomes Template-Like

The template smell appears in these repeated patterns:

- Hero with proof rail.
- Six signal cards.
- Evidence map.
- Objection cards.
- Case spotlight.
- Process timeline.
- FAQ.
- Final CTA.

The issue is not that these blocks are wrong. The issue is that they become predictable when every page uses the same grammar.

Award-level fix:
- Each practice family needs a distinct dramatic structure.
- Fraud pages should feel like reconstruction.
- Consumer pages should feel like claim-building.
- Medical pages should feel like forensic review.
- Journal should feel like an editorial desk.
- Home should feel like the KEIS operating system.

## 9. Not Premium Enough

These ideas need elevation:

- `Route Cards`: should become diagnostic scenarios, not menu cards.
- `Evidence Cards`: should feel like legal artifacts with hierarchy, not decorative document cards.
- `Case Cards`: should become narrative case files.
- `Trust Section`: should become a standards/decision section.
- `Final CTA`: should become an intake experience with dignity.
- `Insights`: should become editorial intelligence, not a feed.
- `Process`: should become a legal pressure map.
- `Reviews`: should become contextual proof, not a carousel.
- `Typography`: needs exact art direction and specimen logic, not just serif/sans.
- `Color`: must avoid "premium beige legal" sameness.

## 10. Still Too Close To The Old Site

The previous plan still inherits:

- service-page landing logic;
- repeated block order;
- card-grid reliance;
- late reviews;
- late FAQ;
- consultation-first conversion;
- page-by-page duplication;
- broad "trust" language;
- evidence/process separation;
- current service taxonomy without enough user-language translation.

It rejects the old design, but it does not reject the old web-product model hard enough.

## 11. Gap Against Reference Level

### 11.1 WilmerHale

WilmerHale's strength is institutional confidence, editorial hierarchy, and client-experience proof. The KEIS plan borrows the hierarchy but not the institutional poise. It still over-explains.

### 11.2 HLC

HLC uses deep scroll narratives, business-context framing, and case-study momentum. The KEIS plan has case blocks, but not yet the same transformation arc.

### 11.3 Anthropic

Anthropic's site expresses a worldview: research, safety, policy, trust, products. The KEIS plan lacks an equally clear worldview. It says "we solve cases"; it should say "we convert disorder into legal leverage."

### 11.4 Apple

Apple's homepage is ruthless about focus: product, image, one line, two actions. KEIS is still text-heavy and block-heavy. It needs more confidence in fewer ideas.

### 11.5 Linear

Linear demonstrates product operations through live-feeling interface narratives and workflows. KEIS should similarly demonstrate legal operations: intake, evidence, claim, court, enforcement as a living system.

### 11.6 Notion

Notion organizes around tasks and uses flexible product surfaces to make abstract work visible. KEIS can learn from this: legal work must become visible and navigable, not merely described.

## 12. Award Check: Would It Win?

Honest answer: no, not yet.

It could become a strong commercial redesign. It would not yet win Awwwards, CSS Design Awards, or FWA because:

1. It lacks a singular creative concept.
2. It does not define a signature first-screen interaction.
3. The page architecture is still conventional.
4. It is too dependent on block sequencing.
5. It does not turn legal work into a distinctive product interface.
6. It does not yet have a memorable visual system.
7. The motion language is too generic.
8. The case storytelling is not cinematic or investigative enough.
9. The evidence system is described, not designed as an experience.
10. The home page still behaves like a premium directory.
11. The route system is not sufficiently diagnostic.
12. The typography direction is not specific enough.
13. The image direction is not strict enough.
14. The journal is not editorially differentiated.
15. The trust strategy is common: metrics, reviews, office.
16. There is no strong authored expert layer.
17. The emotional arc is incomplete.
18. The design language risks "premium legal beige".
19. The plan does not define enough contrast between page families.
20. FAQ remains as a conventional leftover.
21. CTA remains form-led instead of experience-led.
22. It does not specify a unique interaction for cases.
23. It does not specify a unique interaction for evidence.
24. It does not establish a spatial system that could be recognized as KEIS.
25. It does not yet have the boldness of Apple-level reduction.
26. It does not have Anthropic-level worldview clarity.
27. It does not have Linear-level operational product clarity.
28. It does not have Notion-level task-oriented flexibility.
29. It does not yet show why a jury would remember it after reviewing 100 legal sites.
30. It improves trust, but does not yet create awe.

## 13. What To Change

### 13.1 Replace "site restructure" with "legal operating system"

New product thesis:

KEIS is not a set of legal service pages. KEIS is a system that turns a damaged situation into a structured legal case.

This should affect every page:
- Home introduces the operating system.
- Hubs diagnose the situation.
- Service pages build the case.
- Cases prove the system.
- Journal updates the system.

### 13.2 Introduce a signature interaction

Recommended signature:

`Case File Builder`

It is not a form. It is a visual intake pattern that shows:

1. what happened;
2. what evidence exists;
3. what the opponent will argue;
4. what KEIS can check;
5. what first legal move follows.

This can later become a real interactive product, but for now it is a design-planning pattern only.

### 13.3 Reframe cases as "case files"

Every case should have:
- Situation.
- Breakdown point.
- Evidence found.
- Legal move.
- Result.
- What this means for similar users.

### 13.4 Create page-family dramaturgy

Fraud:
- emotional frame: panic -> reconstruction -> stop-loss -> legal pressure.
- visual frame: scattered traces align into a case file.

Consumer:
- emotional frame: frustration -> validation -> calculation -> demand.
- visual frame: contract/defect/refusal becomes a claim.

Medical:
- emotional frame: fear -> record control -> expert review -> accountability.
- visual frame: medical chronology.

Journal:
- emotional frame: uncertainty -> practical consequence -> action.
- visual frame: editorial desk.

Home:
- emotional frame: authority -> system -> proof -> route.
- visual frame: KEIS operating system.

## 14. What To Delete From The Previous Plan

Delete or demote:

- Generic `Hero: Editorial Proof Hero`.
- Generic `Trust Section`.
- Generic `Final CTA`.
- Generic `Process Timeline`.
- Generic `FAQ` as default end section.
- Generic `Reviews` as mandatory page block.
- Universal six-card signal pattern.
- Universal evidence map pattern.
- `Insights` strip on conversion pages unless contextually relevant.
- Any page architecture that uses the same sequence across all services.

## 15. What To Strengthen

### 15.1 Expert Voice

Add a pattern:

`Counsel Note`

Purpose:
- one short expert judgement in plain language.
- appears near the user's biggest misconception.

Why:
- premium law firms feel authored, not anonymous.

### 15.2 Standards Of Acceptance

Add a pattern:

`We Take The Case When...`

Purpose:
- explain when KEIS can help and when the case is weak.

Why:
- restraint creates trust.

### 15.3 Opponent Logic

Add a pattern:

`What They Will Say`

Purpose:
- anticipate bank/seller/clinic/contractor objections.

Why:
- makes KEIS feel strategically ahead.

### 15.4 Legal Pressure Map

Replace generic process with:

`Pressure Map`

Purpose:
- show where leverage appears: claim, evidence, deadline, court, enforcement, complaint, expert report.

Why:
- more specific than a timeline.

### 15.5 Case File Builder

Add:

`Case File Builder`

Purpose:
- transforms user facts into legal structure.

Why:
- signature product behavior.

## 16. Ideas After Second Analysis

### 16.1 "Chaos To Claim"

A master concept where visual fragments of the user's situation become a legal case file.

### 16.2 "The Refusal Is Not The End"

A recurring pattern for bank/seller/clinic/contractor refusal pages. The refusal becomes an input, not a dead end.

### 16.3 "Evidence Has A Sequence"

A legal-evidence interaction showing that documents are not equally important; timing, recipient, source, and refusal matter.

### 16.4 "Do Not Do This Next"

Critical behavioral guidance before conversion:
- do not pay another broker fee;
- do not delete chats;
- do not sign acceptance acts without comments;
- do not rely only on phone calls;
- do not miss medical-record requests.

### 16.5 "Case Confidence, Not Empty Guarantees"

Replace promise language with a confidence model:
- strong;
- needs evidence;
- risky;
- time-sensitive.

### 16.6 "Legal Triage Desk"

Homepage or hub concept where KEIS appears as a serious intake desk, not a marketing funnel.

## 17. Blocks To Fully Redesign

### 17.1 Home Hero

Current plan: premium editorial hero.  
Problem: too expected.

New direction:
- hero shows the KEIS case system in motion;
- one strong line;
- one live-feeling case-file surface;
- no generic legal stock emotion.

### 17.2 Situation Router

Current plan: route cards.  
Problem: still a menu.

New direction:
- diagnostic sentence builder: "I paid / signed / was pressured / received refusal / discovered debt".
- output: "start here".

### 17.3 Evidence Map

Current plan: chain of documents.  
Problem: too linear.

New direction:
- evidence hierarchy: proof strength, source, timing, legal use.

### 17.4 Case Spotlight

Current plan: large case + smaller cases.  
Problem: too common.

New direction:
- interactive case file with tabs: facts, evidence, objection, legal move, outcome.

### 17.5 Trust Section

Current plan: facts + review + office/team image.  
Problem: predictable.

New direction:
- "How KEIS decides": standards, refusal honesty, escalation logic, who reviews the case.

### 17.6 CTA

Current plan: calm form.  
Problem: still a form.

New direction:
- "Start a case file" with three minimal inputs and document-prep guidance.
- Phone/Telegram remain fallback, not the whole experience.

### 17.7 News

Current plan: curated journal.  
Problem: not enough editorial identity.

New direction:
- "Legal signals desk": each item says who is affected, what changed, what to check.

## 18. New World References

Use these as conceptual references, not copy sources:

### 18.1 Anthropic

Use for:
- worldview-led IA;
- trust center logic;
- research/policy/product coherence;
- serious institutional tone.

Pattern to extract:
- `Worldview First`.

### 18.2 Apple

Use for:
- radical reduction;
- product-first hero discipline;
- one idea per viewport;
- image as proof, not decoration.

Pattern to extract:
- `Single Product Moment`.

### 18.3 Linear

Use for:
- operational interface storytelling;
- workflow visibility;
- speed, priority, state, status;
- making complex work feel navigable.

Pattern to extract:
- `Live Operating Surface`.

### 18.4 Notion

Use for:
- flexible task-oriented IA;
- product surfaces that make work tangible;
- trust through use-case clarity;
- knowledge-base logic.

Pattern to extract:
- `Task Surface`.

### 18.5 Stripe

Use for:
- complex infrastructure made legible;
- docs/product/editorial fusion;
- trust through precise UI artifacts.

Pattern to extract:
- `Infrastructure Clarity`.

### 18.6 Mercury

Use for:
- premium financial calm;
- clear product hierarchy;
- restrained authority.

Pattern to extract:
- `Institutional Calm`.

### 18.7 Gov.uk

Use for:
- plain-language trust;
- user task clarity;
- no decorative ambiguity.

Pattern to extract:
- `Public-Service Clarity`.

### 18.8 The New York Times / Reuters Graphics

Use for:
- investigative chronology;
- evidence-led storytelling;
- timeline and causality.

Pattern to extract:
- `Investigative Narrative`.

### 18.9 Work & Co / Instrument Product Case Studies

Use for:
- product behavior over decoration;
- launchable systems;
- strong interaction logic.

Pattern to extract:
- `Designed Workflow`.

## 19. New DORAI Patterns

### 19.1 Case File Builder

- Reference: Linear operational UI + Notion task surface.
- Pattern: intake facts become structured legal file.
- Genes: situation, evidence, objection, risk, first action.
- Why: creates a signature KEIS product experience.

### 19.2 Opponent Argument Simulator

- Reference: litigation strategy + product explainers.
- Pattern: show what bank/seller/clinic will claim and how evidence responds.
- Genes: opponent statement, weak point, counter-proof, legal move.
- Why: builds strategic trust.

### 19.3 Evidence Strength Meter

- Reference: forensic/investigative graphics.
- Pattern: evidence graded by legal usefulness.
- Genes: source, date, authenticity, relation to claim, missing link.
- Why: teaches users what matters without legal jargon.

### 19.4 Stop-Loss Alert

- Reference: crisis UX and safety guidance.
- Pattern: immediate behavioral warning.
- Genes: do not pay, do not delete, do not sign, preserve proof.
- Why: high-conversion because it protects the user before selling.

### 19.5 Refusal Decoder

- Reference: Gov.uk clarity + legal objection handling.
- Pattern: translate formal refusal into next legal move.
- Genes: refusal phrase, meaning, what to request, deadline.
- Why: makes KEIS useful before contact.

### 19.6 Legal Pressure Map

- Reference: Linear workflow state + WilmerHale case proof.
- Pattern: map leverage points across claim, complaint, court, enforcement.
- Genes: actor, document, deadline, pressure, outcome.
- Why: replaces generic process with strategy.

### 19.7 Counsel Note

- Reference: premium law-firm authored expertise.
- Pattern: short expert judgement embedded in page.
- Genes: named/role-based author, plain statement, caution, next step.
- Why: creates human authority.

### 19.8 Case Confidence Model

- Reference: decision-support products.
- Pattern: realistic case strength model.
- Genes: strong evidence, missing evidence, deadline risk, complexity.
- Why: avoids empty guarantees and increases trust.

### 19.9 Procedural Clock

- Reference: deadline-driven legal UX.
- Pattern: timeline based on legal risk windows.
- Genes: date of event, refusal date, claim date, court window.
- Why: makes urgency concrete.

### 19.10 Document Anatomy

- Reference: editorial graphics.
- Pattern: annotate contract/receipt/refusal/medical record.
- Genes: important line, hidden risk, missing clause, legal use.
- Why: turns documents into visual education.

## 20. Revised Product Architecture

### 20.1 Home

1. Worldview Hero: "From chaos to claim."
2. Live Case File Surface.
3. How KEIS Thinks: evidence, opponent, leverage, outcome.
4. Three practice systems: fraud reconstruction, consumer claim-building, auto dispute.
5. Featured case files.
6. Counsel notes / expert standards.
7. Legal signals desk.
8. Start a case file.

### 20.2 Fraud Hub

1. You are inside a designed pressure system.
2. Stop-loss alert.
3. Reconstruct what happened.
4. Trace evidence and recipients.
5. Refusal/objection decoder.
6. Case files.
7. Start a recovery file.

### 20.3 Broker Fraud

1. Stop paying before anything else.
2. Identify the scheme.
3. Map the money trail.
4. Decode the next fake demand.
5. Build recovery file.
6. Case file.
7. Counsel note.
8. Start review.

### 20.4 Pressure Transfer

1. "Self-transfer" does not describe the whole legal situation.
2. Pressure reconstruction.
3. Bank refusal decoder.
4. Evidence strength meter.
5. Recipient recovery map.
6. Case file.
7. Start review.

### 20.5 Unauthorized Credit

1. The debt is not the whole story.
2. Access trace.
3. Credit movement map.
4. Bank argument simulator.
5. Credit-history risk clock.
6. Case file.
7. Start review.

### 20.6 ZPP Hub

1. A bad purchase/service becomes a claim only when evidence is sequenced.
2. Diagnostic router.
3. Refusal decoder.
4. Claim builder.
5. Recoverable amount.
6. Case files.
7. Start document review.

### 20.7 ZPP Service Pages

Each page should choose one dominant mechanism, not reuse the same sequence:

- Medical error: medical chronology + record access + expert threshold.
- Refund: defect proof + seller refusal + examination logic.
- Insurance: contract anatomy + money recipient + deadline clock.
- Renovation: defect atlas + acceptance act risk + expert report.
- Furniture: specification mismatch + delivery/assembly evidence.
- Contractor: scope map + acts/refusal + loss calculation.
- Lawyer claim: promised work vs actual work ledger.
- Construction: schedule/defect/extra-charge pressure map.
- Services: result gap + acceptance/refusal decoder.

## 21. Decision: What The Previous Plan Becomes

The previous `DESIGN_RESTRUCTURE_PLAN.md` should not be discarded. It becomes:

- audit baseline;
- content map;
- first IA draft;
- risk inventory;
- asset inventory.

It should not become the implementation blueprint without a stronger creative concept layer.

## 22. Next Approval Question

Before implementation, approve one of these strategic directions:

1. Conservative premium rebuild.
   - Safer.
   - Faster.
   - Strong commercial quality.
   - Low award probability.

2. KEIS Legal Operating System.
   - More ambitious.
   - Requires stronger content modeling and visual system.
   - Higher award potential.
   - More design effort.

Recommended: option 2.

## 23. Final Critical Verdict

The first plan fixes the site.

It does not yet transform KEIS into a world-class legal product.

To reach the requested level, the next plan must stop asking "which block comes next?" and start asking:

- What is the proprietary KEIS experience?
- How does legal work become visible?
- Where does the user feel the moment of transformation?
- What will jurors remember?
- What can only this firm say and show?

Until those questions are answered, implementation should not begin.
