# Context (songbird-player / Starchild Music)

Last updated: 2026-02-17

## What This Repo Is

- Turborepo monorepo with a Next.js web app and an Electron desktop wrapper.
- Primary app: `apps/web` (Next.js App Router + tRPC + NextAuth + Drizzle/Postgres).
- Desktop wrapper: `apps/desktop/electron` (legacy compatibility wrappers also exist under `electron/`).
- API model:
  - Internal app data: tRPC (`/api/trpc`).
  - External music integrations: Next.js proxy routes under `apps/web/src/app/api/**` (Songbird V2 + Deezer).

## Read First

1. `README.md`
2. `docs/README.md`
3. `docs/architecture.md`
4. `docs/API_ROUTE_USE.md`
5. `docs/API_V2_SWAGGER.yaml` (or `docs/API_V2_SWAGGER.json`)

## Workspace Map

- `apps/web/` Next.js app (main product)
  - `apps/web/src/app/` pages, layouts, and API route handlers
  - `apps/web/src/app/api/trpc/[trpc]/route.ts` tRPC endpoint
  - `apps/web/src/app/api/auth/[...nextauth]/route.ts` auth endpoint
  - `apps/web/src/server/api/routers/*` tRPC routers (`music`, `equalizer`, `admin`, ...)
  - `apps/web/src/server/auth/*` NextAuth configuration/helpers
  - `apps/web/src/server/db/*` Drizzle schema + `pg` pool
  - `apps/web/src/services/smartQueue.ts` client smart-queue service calls
  - `apps/web/src/proxy.ts` API rate-limit/security headers + CSP
  - `apps/web/src/env.js` env schema validation (`@t3-oss/env-nextjs`)
  - `apps/web/drizzle/` SQL migrations
- `apps/desktop/electron/` Electron main/preload + builder helpers
- `packages/*` shared libraries (import via `@starchild/*`)
  - `packages/api-client` tRPC React provider + REST helpers
  - `packages/types`, `packages/config`, `packages/auth`
  - `packages/player-core`, `packages/player-react`, `packages/audio-adapters`
  - `packages/ui`, `packages/visualizers`

Player internals moved out of app-local `src/`:

- `packages/player-react/src/AudioPlayerContext.tsx`
- `packages/player-react/src/useAudioPlayer.ts`

## Runtime Flow (Mental Model)

- UI -> `@starchild/api-client/trpc/react` -> `/api/trpc` -> `apps/web/src/server/api/*` -> Postgres (Drizzle).
- UI -> `/api/*` proxy routes -> Songbird V2 / Deezer.
- Auth -> `/api/auth/*` -> NextAuth -> DB-backed sessions.
- Electron -> loads local web app (`http://localhost:3222` in dev).

## Commands (Run From Repo Root)

- Install deps: `npm ci`
- Dev (custom server, loads only `.env`): `npm run dev`
- Dev (Next.js only): `npm run dev:next`
- Build: `npm run build`
- Start (prod custom server): `npm run start`
- Lint + types: `npm run check`
- Tests: `npm run test`
- Format: `npm run format:write`
- Electron dev: `npm run electron:dev`
- Workspace tasks: `npm run ws:build`, `npm run ws:check`, `npm run ws:test`

## Env + Config Rules

- When adding/changing env vars, update both:
  - `.env.example`
  - `apps/web/src/env.js`
- Runtime DB code requires `DATABASE_URL` (`apps/web/src/server/db/index.ts` throws if missing).
- Custom server env loading is defined in `apps/web/scripts/server.js`:
  - `NODE_ENV=development`: loads only `.env` with override.
  - production: loads `.env.local`, then `.env.production`, then `.env` (no override).

## Change Guide (Where To Edit)

- Add first-party app data API: add/modify tRPC router in `apps/web/src/server/api/routers/*`, then register in `apps/web/src/server/api/root.ts`.
- Add external upstream proxy endpoint: create route handler in `apps/web/src/app/api/**/route.ts`.
- Change DB schema: edit `apps/web/src/server/db/schema.ts`, then run Drizzle commands.
- Change playback behavior: edit `packages/player-react/*` and/or `packages/player-core/*`.
- Change shared types: edit `packages/types/src/*`.
- Change shared constants/config: edit `packages/config/src/*`.

## Import/Boundary Rules

- In `apps/web`, use:
  - `@/` for app-local imports
  - `@starchild/*` for shared workspace packages
- In `packages/*`, do not import from `apps/web`; only package-to-package imports.
- Boundary checks: `npm run check:boundaries`.

## Notes

- `scripts/server.js` at repo root delegates to `apps/web/scripts/server.js`.
- `docs/API_V2_SWAGGER.yaml` describes the upstream API configured by `API_V2_URL` (not this repo's API surface).
