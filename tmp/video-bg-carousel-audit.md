# Video background carousel audit

## Repro

- Target block: `#kgx-stories-carousel.kgx-stories`.
- The block is the shared second carousel/card section used by scam and ZPP landing pages.
- Current section background was a static CSS `background` in `styles.css` for desktop and mobile/tablet:
  - `image-set(url("./assets/block/kazan4-1920.webp") 1x, url("./assets/block/kazan4-2560.webp") 2x)`.
- Card images are separate `.kgx-stories__media` backgrounds and are intentionally left unchanged.

## Pages with the block

Source:

- `scam/index.html`
- `scam/broker/index.html`
- `scam/pressure/index.html`
- `scam/hack/index.html`
- `zpp/index.html`
- `zpp/refund/index.html`
- `zpp/insurance/index.html`
- `zpp/contractor/index.html`
- `zpp/furniture/index.html`
- `zpp/med-error/index.html`
- `zpp/renovation/index.html`
- `zpp/services/index.html`
- `zpp/build-contract/index.html`
- `zpp/lawyer-claim/index.html`

Deploy:

- `dist-timeweb/scam/index.html`
- `dist-timeweb/scam/broker/index.html`
- `dist-timeweb/scam/pressure/index.html`
- `dist-timeweb/scam/hack/index.html`
- `dist-timeweb/zpp/index.html`
- `dist-timeweb/zpp/refund/index.html`
- `dist-timeweb/zpp/insurance/index.html`
- `dist-timeweb/zpp/contractor/index.html`
- `dist-timeweb/zpp/furniture/index.html`
- `dist-timeweb/zpp/med-error/index.html`
- `dist-timeweb/zpp/renovation/index.html`
- `dist-timeweb/zpp/services/index.html`
- `dist-timeweb/zpp/build-contract/index.html`
- `dist-timeweb/zpp/lawyer-claim/index.html`

No `#kgx-stories-carousel` found on `/`, `/auto-law/`, `/auto-law/dkp/`, `/auto-law/forced-addons/`, `/news/`.

## Cause

- The carousel section had only a static CSS background layer.
- There was no shared HTML template for this block; pages contain copied markup.
- The stable SSOT entry point is `initKgxStoriesSlider()` in `script.js`, which runs on every page with `#kgx-stories-carousel`.

## Fix

- Added one shared background video layer from `script.js`:
  - class: `.kgx-stories__video-bg`
  - root-relative sources:
    - `/assets/block/video/justice-law-bg.webm`
    - `/assets/block/video/justice-law-bg.mp4`
  - poster:
    - `/assets/block/video/justice-law-bg-poster.webp`
  - attributes: `autoplay`, `muted`, `loop`, `playsinline`, `preload="metadata"`, `aria-hidden="true"`.
- Added CSS layer rules in `styles.css`:
  - section keeps poster fallback as CSS background;
  - video is `position:absolute`, `object-fit:cover`, `pointer-events:none`, `z-index:0`;
  - overlay is above video with `z-index:1`;
  - content remains above with `z-index:2`;
  - `prefers-reduced-motion: reduce` hides the video and keeps poster fallback.
- Synced `script.js`, `styles.css`, and video assets to `dist-timeweb`.

## Video preparation

Source:

- `assets/block/video/Justice_Law.mp4`
- 1280x720, 24 fps, 5.21 s, no audio stream.

Commands used:

```bash
mkdir -p assets/block/video dist-timeweb/assets/block/video tmp/video-bg-carousel-shots
ffmpeg -y -i assets/block/video/Justice_Law.mp4 -an -map_metadata -1 -sn -dn -vf "scale='min(1920,iw)':-2,fps=24" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 assets/block/video/justice-law-bg.webm
ffmpeg -y -i assets/block/video/Justice_Law.mp4 -an -map_metadata -1 -sn -dn -vf "scale='min(1920,iw)':-2,fps=24" -c:v libx264 -crf 27 -preset slow -movflags +faststart -pix_fmt yuv420p assets/block/video/justice-law-bg.mp4
ffmpeg -y -ss 00:00:02 -i assets/block/video/Justice_Law.mp4 -frames:v 1 -vf "scale='min(1920,iw)':-2" tmp/justice-law-bg-poster.png
cwebp -quiet -q 76 tmp/justice-law-bg-poster.png -o assets/block/video/justice-law-bg-poster.webp
rsync -a assets/block/video/justice-law-bg.webm assets/block/video/justice-law-bg.mp4 assets/block/video/justice-law-bg-poster.webp dist-timeweb/assets/block/video/
```

Result:

- `assets/block/video/justice-law-bg.webm` - 1.2 MB, VP9, 1280x720, 24 fps.
- `assets/block/video/justice-law-bg.mp4` - 847 KB, H.264, 1280x720, 24 fps.
- `assets/block/video/justice-law-bg-poster.webp` - 41 KB.
- Same files exist under `dist-timeweb/assets/block/video/`.

## Verification

- `npm run build`: passed (`Static validation passed: 24 HTML/CSS files checked.`).
- `node --check script.js`: passed.
- `node --check dist-timeweb/script.js`: passed.
- Local server: `dist-timeweb`, port `5516`.
- curl:
  - `/assets/block/video/justice-law-bg.webm`: `200 OK`, `Content-type: video/webm`, `Content-Length: 1233953`.
  - `/assets/block/video/justice-law-bg.mp4`: `200 OK`, `Content-type: video/mp4`, `Content-Length: 867046`.
  - `/assets/block/video/justice-law-bg-poster.webp`: `200 OK`, `Content-type: image/webp`, `Content-Length: 41876`.
- Playwright checked all pages with the block:
  - one `.kgx-stories__video-bg` per page;
  - two sources per video;
  - video is muted, looped, `preload="metadata"`, `pointer-events: none`;
  - no same-origin `404`;
  - no JS console errors or page errors;
  - no horizontal overflow;
  - carousel transform changes after next-arrow click.
- Reduced-motion check:
  - `.kgx-stories__video-bg` has `display: none`;
  - section keeps `/assets/block/video/justice-law-bg-poster.webp` fallback;
  - no horizontal overflow.
- Screenshots saved in `tmp/video-bg-carousel-shots/`:
  - `kgx-stories-390.png`
  - `kgx-stories-430.png`
  - `kgx-stories-768.png`
  - `kgx-stories-1024.png`
  - `kgx-stories-1200.png`
  - `kgx-stories-1440.png`
  - `kgx-stories-1920.png`
