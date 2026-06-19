# News polish iterations

## Iteration 1 - layout and visual weight

- Repro: desktop page had a narrow centered-left composition on wide screens, heavy hero, dark card surfaces and visually empty right side.
- Cause: source CSS capped the news container too aggressively on `1800px+`, kept a heavy full-page background, and used dark card overlays.
- Fix:
  - centered `1480px` container on wide screens;
  - compact hero typography and spacing;
  - warmer card surfaces and lighter image overlays;
  - filled sidebar with an additional "Что проверить сегодня" block;
  - shortened fallback copy in cards.

## Iteration 2 - clipped stream

- Repro: after first polish, full-page screenshot showed a black empty area below the editorial block.
- Cause: `.kg-news` inherited `overflow: hidden`, while the stream continued below the first viewport.
- Fix:
  - set `.kg-news` overflow back to visible;
  - added a dedicated `page-news-root` class on `<html>` to restore content-height scrolling for `/news/`.

## Iteration 3 - mobile stream and images

- Repro: mobile stream collapsed into a narrow vertical strip; offscreen card images appeared as brown placeholders in full-page screenshots.
- Cause:
  - final desktop stream grid overrode older tablet/mobile grid rules;
  - card images were lazy-loaded and not always decoded before visual capture.
- Fix:
  - explicitly forced hero/editorial/stream to one column under `1024px`;
  - set rendered news card images to `loading="eager"`;
  - brightened the darkest category images and kept the same filenames/paths.

## Final verification

- Local server: `dist-timeweb`, port `5516`.
- Checked `/news/` at `390`, `430`, `768`, `1024`, `1440`, `1920`.
- Results:
  - JS errors: `0`;
  - same-origin 404: `0`;
  - horizontal scroll: `false`;
  - visible failed images: `0`;
  - cookie/chat overlap with news buttons: `false`.
- Screenshots:
  - `tmp/news-redesign-shots/final-polish-390.png`
  - `tmp/news-redesign-shots/final-polish-430.png`
  - `tmp/news-redesign-shots/final-polish-768.png`
  - `tmp/news-redesign-shots/final-polish-1024.png`
  - `tmp/news-redesign-shots/final-polish-1440.png`
  - `tmp/news-redesign-shots/final-polish-1920.png`
