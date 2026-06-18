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

## Smooth motion pass

Repro after the first stable rebuild:

- `justice-law-bg.mp4` was 1920x1080, 8 s, 24 fps, 192 frames.
- The source frame was clean, but the artificial motion was too small:
  - crop movement only `18px` horizontally and `10px` vertically at 24 fps;
  - browser playback rounded this into barely visible integer-pixel steps;
  - visually the video looked almost frozen and sometimes jerked.
- Motion audit sheets:
  - `tmp/video-motion-audit/stable-24fps-all.jpg`
  - `tmp/video-motion-audit/stable-keyframes.jpg`

Fix:

```bash
ffmpeg -y -loop 1 -framerate 60 -t 8 -i tmp/video-frame-audit/stable/justice-law-clean-frame.png -vf "scale=3840:2160:flags=lanczos,crop=3200:1800:x='320+150*sin(2*PI*n/480)':y='180+70*cos(2*PI*n/480)',scale=1920:1080:flags=lanczos,fps=60,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf 24 -row-mt 1 -deadline good -cpu-used 2 assets/block/video/justice-law-bg.webm
ffmpeg -y -loop 1 -framerate 60 -t 8 -i tmp/video-frame-audit/stable/justice-law-clean-frame.png -vf "scale=3840:2160:flags=lanczos,crop=3200:1800:x='320+150*sin(2*PI*n/480)':y='180+70*cos(2*PI*n/480)',scale=1920:1080:flags=lanczos,fps=60,format=yuv420p" -c:v libx264 -crf 18 -preset slow -movflags +faststart -pix_fmt yuv420p assets/block/video/justice-law-bg.mp4
rsync -a assets/block/video/justice-law-bg.webm assets/block/video/justice-law-bg.mp4 assets/block/video/justice-law-bg-poster.webp dist-timeweb/assets/block/video/
```

Result:

- `assets/block/video/justice-law-bg.webm` - 1.0 MB, VP9, 1920x1080, 60 fps, 8 s.
- `assets/block/video/justice-law-bg.mp4` - 2.7 MB, H.264, 1920x1080, 60 fps, 8 s.
- `assets/block/video/justice-law-bg-poster.webp` - 106 KB.
- Cache bust updated from `?v=20260618stable` to `?v=20260618smooth` in source and deploy CSS/JS.
- Motion audit sheets:
  - `tmp/video-motion-audit/smooth-sample.jpg`
  - `tmp/video-motion-audit/smooth-keyframes.jpg`
  - `tmp/video-motion-audit/smooth-first-second.jpg`

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

## Smooth motion verification

- `npm run build`: passed (`Static validation passed: 24 HTML/CSS files checked.`).
- `node --check script.js`: passed.
- `node --check dist-timeweb/script.js`: passed.
- `ffprobe`:
  - `justice-law-bg.webm`: VP9, 1920x1080, 60 fps, 8 s, 1,078,831 bytes.
  - `justice-law-bg.mp4`: H.264, 1920x1080, 60 fps, 8 s, 480 frames, 2,817,367 bytes.
- curl from `dist-timeweb` server on port `5516`:
  - `/assets/block/video/justice-law-bg.webm?v=20260618smooth`: `200 OK`, `Content-type: video/webm`, `Content-Length: 1078831`.
  - `/assets/block/video/justice-law-bg.mp4?v=20260618smooth`: `200 OK`, `Content-type: video/mp4`, `Content-Length: 2817367`.
  - `/assets/block/video/justice-law-bg-poster.webp?v=20260618smooth`: `200 OK`, `Content-type: image/webp`, `Content-Length: 108294`.
- Playwright checked all 14 pages with `#kgx-stories-carousel`:
  - one `.kgx-stories__video-bg` per page;
  - source is `justice-law-bg.webm?v=20260618smooth`;
  - `readyState: 4`, `paused: false`, `muted: true`, `loop: true`;
  - `duration: 8`, `videoWidth: 1920`, `videoHeight: 1080`;
  - `currentTime` grows during playback on every page;
  - same-origin `404`: none;
  - JS console/page errors: none;
  - horizontal overflow: none.
- Fresh smooth screenshots saved in `tmp/video-bg-carousel-shots/`:
  - `kgx-stories-390-smooth.png`
  - `kgx-stories-430-smooth.png`
  - `kgx-stories-768-smooth.png`
  - `kgx-stories-1024-smooth.png`
  - `kgx-stories-1200-smooth.png`
  - `kgx-stories-1440-smooth.png`
  - `kgx-stories-1920-smooth.png`
