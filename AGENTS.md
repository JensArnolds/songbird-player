# Agent Guide (songbird-player / Starchild Monorepo)

This file is the primary project context for coding agents in this repository.
Always read this file before making changes.

## Read Order

1. `AGENTS.md` (this file)
2. `CONTEXT.md`
3. `README.md`
4. `docs/README.md`
5. `docs/architecture.md`
6. `docs/API_ROUTE_USE.md`
7. `docs/API_V2_SWAGGER.yaml` (upstream API contract, not this repo API surface)

## High-Level Architecture

This is a Turborepo-style monorepo with multiple app runtimes and shared packages.

- Apps:
  - `apps/web`: Primary Next.js App Router product (tRPC + NextAuth + Drizzle/Postgres).
  - `apps/desktop`: Electron wrapper and packaging scripts.
  - `apps/mobile`: Scaffolded mobile shell (currently minimal wiring).
- Shared packages:
  - `packages/api-client`, `packages/auth`, `packages/config`, `packages/types`
  - `packages/player-core`, `packages/player-react`, `packages/audio-adapters`
  - `packages/ui`, `packages/visualizers`
- Infra/runtime config:
  - Root scripts and build config in `package.json`, `turbo.json`, `vercel.json`, `Dockerfile`, `ecosystem*.cjs`
  - SQL migrations in `apps/web/drizzle`

Note on NestJS APIs:
- This repo does not host in-repo NestJS modules; it integrates with upstream services (documented by `docs/API_V2_SWAGGER.yaml`) via Next.js proxy routes.

## Where Core Logic Lives

- Auth/session:
  - NextAuth server config: `apps/web/src/server/auth/*`
  - NextAuth route handler: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
  - Upstream auth proxy helpers/routes: `apps/web/src/app/api/auth/*`
- Playback:
  - Main player context/hook: `packages/player-react/src/AudioPlayerContext.tsx`, `packages/player-react/src/useAudioPlayer.ts`
  - Core player/domain logic: `packages/player-core/src/*`
  - Audio adapters: `packages/audio-adapters/src/*`
- Streaming:
  - Stream proxy endpoint: `apps/web/src/app/api/stream/route.ts`
  - Client stream URL helpers: `packages/api-client/src/rest.ts`
  - V2 proxy utilities: `apps/web/src/app/api/v2/_lib.ts`
- tRPC/data:
  - tRPC base/context/procedures: `apps/web/src/server/api/trpc.ts`
  - Router composition: `apps/web/src/server/api/root.ts`
  - Domain routers: `apps/web/src/server/api/routers/*`
- Database:
  - Drizzle schema: `apps/web/src/server/db/schema.ts`
  - DB runtime/pool: `apps/web/src/server/db/index.ts`
  - Migrations: `apps/web/drizzle/*`
- Shared types/utilities/config:
  - Types: `packages/types/src/*`
  - Config/constants/storage keys: `packages/config/src/*`
  - Auth helpers: `packages/auth/src/*`
  - App-local utils: `apps/web/src/utils/*`

## Routing, tRPC, and API Module Conventions

- Next.js routing:
  - App pages/layouts: `apps/web/src/app/**/page.tsx`, `layout.tsx`
  - API route handlers: `apps/web/src/app/api/**/route.ts`
- tRPC:
  - Use `createTRPCRouter`, `publicProcedure`, `protectedProcedure` from `apps/web/src/server/api/trpc.ts`
  - Register new routers in `apps/web/src/server/api/root.ts`
  - Keep business logic in routers/services, not in React components
- API modules:
  - Prefer tRPC for first-party app data
  - Keep `apps/web/src/app/api/*` focused on proxying/upstream integration and transport concerns
  - Reuse existing proxy helpers (`_lib.ts`) when possible

## Environment and Config Rules

- Use `apps/web/src/env.js` for server env access and validation.
- Do not introduce new direct `process.env` usage in app/server code when `env` is available.
- When adding/changing env vars, update both:
  - `.env.example`
  - `apps/web/src/env.js`
- URL env conventions:
  - Use `NEXTAUTH_URL` as the single app/auth base URL env (do not add `NEXT_PUBLIC_NEXTAUTH_*` variants).
  - `API_V2_HEALTH_URL` is deprecated; health checks use route paths (`/api/v2/status`, `/api/v2/health`, `/api/health`).
  - For protected upstream V2/auth proxy calls, forward caller-provided app JWT bearer tokens (`Authorization`) instead of injecting a static key.
- Dev server env loading behavior is defined in `apps/web/scripts/server.js`.

## Navigation and Indexing Expectations

- Work with whole-repo context, not single-file context.
- Prefer cross-file navigation and existing definitions over duplicating logic.
- Before editing for multi-module tasks, identify key files and each file’s role.
- Search for existing patterns first (routers, mutations, proxy handlers, error handling, logging) and follow them.

## Repo-Specific Patterns to Reuse

- Type-safe boundary-first coding with shared types from `@starchild/types`.
- Existing tRPC procedure style for auth gating and error formatting.
- Existing API error/logging style in route handlers (structured logs, no secret leakage).
- Existing DB conflict handling patterns in routers (retry/sync where sequence drift is known).
- Existing UI/provider patterns in `packages/player-react` and `apps/web/src/contexts/*`.
- For Spotify OAuth in cross-origin setups (`NEXT_PUBLIC_AUTH_API_ORIGIN` differs from frontend origin), initiate browser login on the canonical auth API origin (`${NEXT_PUBLIC_AUTH_API_ORIGIN}/api/auth/spotify?...`) so PKCE/session cookies are issued on the callback origin.

## Change Behavior for Future Tasks

- Before implementation, summarize:
  - Files to touch
  - Existing patterns being followed
- Keep changes minimal and localized.
- Avoid global architectural/config changes unless explicitly requested.
- Add concise comments only where logic is non-obvious.
- Validate with targeted checks/tests relevant to edited modules.

## Maintenance Rule

- Treat `AGENTS.md` as the single source of truth for repository workflows.
- Update this file whenever new architectural details or working conventions are discovered.
