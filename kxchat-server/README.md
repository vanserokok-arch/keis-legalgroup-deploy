# KXchat Server MVP

Минимальный backend KXchat с Express + SQLite + Socket.IO.

## Setup

1. `cp .env.example .env`
2. при необходимости поменять `.env`
3. `npm install`
4. `npm run dev` (или `npm start`)

## Env

- `PORT=8787`
- `CORS_ORIGIN=http://localhost:3000`
- `DB_PATH=./kxchat.db`

## Scripts

- `npm run dev`
- `npm start`

## REST API

- `GET /api/health`
- `POST /api/chat/send`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/reply`
- `PATCH /api/conversations/:id/status`

## WebSocket

- событие: `joinRoom` со `{ conversationId, sessionId }`
- событие: `conversation:newMessage` с payload:
  - `role`, `conversationId`, `sessionId`, `message`, `created_at`

