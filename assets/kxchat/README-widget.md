# KXchat Widget Integration

## Overview
KXchat is a production chat widget with server-first dialogue logic and frontend-only UI runtime.

## Files
- `kxchat-config.js` - Runtime API + timing config
- `kxchat-widget.css` - Widget UI (chat, typing, contact card)
- `kxchat-widget.js` - Frontend runtime (UI/events/network), server-first replies

## Integration
Add these lines before `</body>` in HTML pages:

```html
<link rel="stylesheet" href="/assets/kxchat/kxchat-widget.css">
<script src="/assets/kxchat/kxchat-config.js"></script>
<script src="/assets/kxchat/kxchat-widget.js"></script>
```

## Configuration
Edit `kxchat-config.js` to change API/timings:

```javascript
window.KXCHAT_CONFIG = {
  API_BASE: 'https://your-domain',
  FALLBACK_API_BASES: ['https://your-domain/kxchat-api'],
  AUTO_OPEN_DELAY_DESKTOP_MS: 5200,
  AUTO_OPEN_DELAY_MOBILE_MS: 9000,
  TYPING_START_MIN_MS: 650,
  TYPING_START_MAX_MS: 1400,
  TYPING_SHORT_MIN_MS: 8000,
  TYPING_SHORT_MAX_MS: 10000,
  TYPING_MEDIUM_MIN_MS: 12000,
  TYPING_MEDIUM_MAX_MS: 15000,
  TYPING_LONG_MIN_MS: 18000,
  TYPING_LONG_MAX_MS: 20000
};
```

## Storage
- `kxchat_sessionId` - Client session
- `kxchat_conversationId` - Last conversation id
- `kxchat_auto_opened_once_v4` - Auto-open marker per browser session

## Features
- Start contact form with validation + phone mask
- Server-first dialogue (`POST /api/chat/send`)
- Page-aware context extraction (`#kx-page-context` + DOM/title/meta/h1)
- Realistic typing timing (start delay + short/medium/long ranges)
- Outgoing checkmarks (single -> double)
- Reopen prompt and idle prompt
- Auto-scroll and dedupe rendering
- Mobile responsive
