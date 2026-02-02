# Context

## Project Summary
- Starchild Music (songbird-frontend) is a Next.js + Electron music streaming and discovery app with smart recommendations and a tRPC backend.
- Uses a Deezer-style track model and integrates Darkfloor API (search/stream) plus Songbird API (recommendations and multi-source discovery).

## Key Paths
- `src/app/` Next.js App Router pages and API proxy routes.
- `src/server/api/` tRPC routers; `src/server/services/` server-side recommendation logic.
- `src/hooks/useAudioPlayer.ts` player, queue, and smart queue behavior.
- `src/services/smartQueue.ts` client-side recommendation calls and conversions.
- `src/env.js` environment validation and env var wiring.

## Commands
- `npm run dev` start the custom dev server (default port 3222).
- `npm run dev:next` start Next.js dev server only.
- `npm run build` production build.
- `npm run start` production server.
- `npm run test` run vitest.
- `npm run lint` run eslint.

## Runtime Endpoints
- Local app: http://localhost:3222
- Darkfloor API (search/stream): https://api.darkfloor.art/
- Songbird API (recommendations/discovery): https://songbird.darkfloor.art/
