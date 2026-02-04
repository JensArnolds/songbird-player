# Agent Guide (songbird-player / Starchild Music)

This repository is a **Next.js (App Router) + tRPC + Drizzle/Postgres** app with an **Electron** desktop wrapper.

## First files to read

- `CONTEXT.md` (short orientation + key paths)
- `README.md` (feature overview + setup)
- `docs/README.md` (documentation index)
- `docs/architecture.md` (system architecture + data flows)
- `docs/API_ROUTE_USE.md` (Next.js API proxy routes and backends)
- `docs/API_V2_SWAGGER.yaml` (upstream OpenAPI spec for the service configured as `API_V2_URL` — not this repo’s API)

## Quick commands

- Install deps: `npm ci`
- Dev (custom server, loads **only** `.env`): `npm run dev`
- Dev (Next.js only): `npm run dev:next`
- Build: `npm run build`
- Start (prod custom server): `npm run start`
- Lint + types: `npm run check`
- Tests: `npm run test`
- Format: `npm run format:write`
- Electron dev: `npm run electron:dev`

Default local URL: `http://localhost:3222`

## Environment variables

- Add/change variables in **both**:
  - `.env.example`
  - `src/env.js` (Zod validation via `@t3-oss/env-nextjs`)
- Runtime DB code requires `DATABASE_URL` (`src/server/db/index.ts` throws if missing).
- The custom server (`scripts/server.js`) loads env files differently:
  - `NODE_ENV=development`: loads **only** `.env` (override enabled)
  - production: loads `.env.local`, then `.env.production`, then `.env` (no override)

## Project layout (high-signal)

- UI / routes: `src/app/*`
- API proxies (Songbird V2 / Deezer): `src/app/api/*/route.ts(x)`
- tRPC: `src/server/api/*` + `src/app/api/trpc/[trpc]/route.ts`
- Auth (NextAuth): `src/server/auth/*` + `src/app/api/auth/[...nextauth]/route.ts`
- DB (Drizzle + pg Pool): `src/server/db/*` + `drizzle/` migrations
- Player: `src/contexts/AudioPlayerContext.tsx`, `src/hooks/useAudioPlayer.ts`
- Electron: `electron/*`

## Working conventions for this repo

- Prefer **tRPC** for app data; keep `src/app/api/*` focused on proxying external services.
- Keep changes minimal and consistent with existing TypeScript + ESM patterns (`package.json` has `"type": "module"`).
- When adding env usage in server code, route it through `env` (`src/env.js`) instead of `process.env` directly.

---

## Codex skills (optional)

If the user asks for a skill by name (e.g. `skill-installer`) or the task clearly matches a skill description, open that skill’s `SKILL.md` from the local skills directory and follow its workflow for the turn.
