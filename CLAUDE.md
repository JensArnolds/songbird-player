# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the **repo root** unless noted.

```bash
npm ci                    # Install dependencies
npm run dev               # Dev server (custom server, loads only .env)
npm run dev:next          # Next.js dev only (port 3222, turbopack)
npm run build             # Full production build
npm run start             # Production custom server
npm run check             # Package boundaries + ESLint + TypeScript (run this before committing)
npm run lint              # ESLint only
npm run typecheck         # TypeScript only
npm run test              # Vitest (jsdom environment)
npm run test:watch        # Vitest watch mode
npm run format:write      # Prettier (auto-fix)
npm run check:boundaries  # Enforce package import boundaries
npm run electron:dev      # Run app + Electron (requires built app)
```

**Database (Drizzle):**
```bash
npm run db:generate       # Generate migration from schema changes
npm run db:migrate        # Run pending migrations
npm run db:push           # Push schema directly (dev only)
npm run db:studio         # Drizzle Studio GUI
```

**Run a single test file:**
```bash
npx vitest run apps/web/src/__tests__/example.test.ts
```

## Architecture

**Monorepo**: Turborepo with `apps/web` (Next.js), `apps/desktop` (Electron), and `packages/*` (shared libs).

### Runtime data flow

```
UI → @starchild/api-client/trpc/react → /api/trpc → src/server/api/routers/* → Postgres (Drizzle)
UI → /api/** proxy routes → Bluesix V2 / Deezer external APIs
Auth → /api/auth/** → NextAuth v5 → DB-backed sessions
Electron → loads http://localhost:3222 (dev) / bundled standalone build (prod)
```

### Packages (`packages/`)

Import via `@starchild/*` alias — never import from `apps/web` inside packages.

| Package | Purpose |
|---|---|
| `@starchild/api-client` | tRPC React provider + REST helpers. Subpath exports: `./trpc/react`, `./trpc/server`, `./rest` |
| `@starchild/player-react` | `AudioPlayerContext`, `useAudioPlayer` hook, queue persistence |
| `@starchild/player-core` | Core audio engine, queue logic, Web Audio API primitives |
| `@starchild/audio-adapters` | Web Audio Context manager |
| `@starchild/visualizers` | 80+ canvas visualizers (`FlowFieldRenderer`, `FlowFieldCanvas`) |
| `@starchild/ui` | Shared components (Button, Toast, SmoothSlider) + `cn()` utility |
| `@starchild/types` | Domain types for music, player state, search, settings |
| `@starchild/config` | App-wide constants, localStorage keys, visualizer config |
| `@starchild/auth` | NextAuth helpers, Discord/Spotify OAuth providers |

### Key app directories (`apps/web/src/`)

- `app/` — Next.js App Router pages and API route handlers
- `app/api/v2/**` — Proxy routes to Bluesix V2 upstream (see `docs/API_ROUTE_USE.md`)
- `app/api/trpc/[trpc]/route.ts` — tRPC endpoint
- `server/api/routers/` — tRPC routers: `music`, `equalizer`, `preferences`, `admin`
- `server/api/root.ts` — Router registration
- `server/auth/` — NextAuth configuration
- `server/db/schema.ts` — Drizzle table definitions (19KB)
- `server/db/index.ts` — pg Pool init (throws if `DATABASE_URL` missing)
- `proxy.ts` — Rate-limit and CSP/security headers
- `env.js` — Zod env schema (`@t3-oss/env-nextjs`); all env vars go here

## Working conventions

**API boundaries:**
- First-party app data → tRPC (`server/api/routers/`). Register new routers in `server/api/root.ts`.
- External upstream calls → proxy route handlers in `app/api/**/route.ts`.

**Import aliases:**
- `@/` — app-local imports within `apps/web`
- `@starchild/*` — shared workspace packages

**Adding env vars:** Update both `.env.example` and `apps/web/src/env.js`. Never read `process.env` directly in server code; go through `env`.

**Env loading** (custom server `apps/web/scripts/server.js`):
- `NODE_ENV=development`: loads only `.env` with override
- production: loads `.env.local` → `.env.production` → `.env` (no override)

**Server vs. client components:**
- `@starchild/api-client/rest` uses `window.location.origin` — **throws on the server** unless `baseUrl` is provided. Use `getRequestBaseUrl()` from `@/utils/getBaseUrl` for server-side fetches.
- Keep client: Web Audio API, Canvas, `requestAnimationFrame`, `useGlobalPlayer()`, `useSession()`, `framer-motion`, `@dnd-kit`, gesture handlers.

**DB schema changes:** Edit `apps/web/src/server/db/schema.ts`, then run `npm run db:generate` + `npm run db:migrate`.

**Playback changes:** Edit `packages/player-react/` and/or `packages/player-core/`.

**Linting:** ESLint 9 flat config. `drizzle/enforce-delete-with-where` and `drizzle/enforce-update-with-where` are errors — always include `.where()` on destructive Drizzle queries.

## Documentation

- `CONTEXT.md` — Short orientation + key paths (read first)
- `docs/architecture.md` — System architecture diagram and data flows
- `docs/API_ROUTE_USE.md` — How proxy routes map to upstream backends
- `docs/API_V2_SWAGGER.yaml` — OpenAPI spec for the upstream Bluesix API (`API_V2_URL`), not this repo's surface
