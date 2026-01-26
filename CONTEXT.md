# CONTEXT.md

Quick context for working efficiently in this repo. Read this before making changes.

## Project Summary
- Starchild Music frontend (Next.js App Router) with TRPC, NextAuth, Drizzle, Tailwind v4, Framer Motion.
- Runs as web app and Electron desktop (Next.js standalone build).
- Primary playback uses a global HTMLAudioElement with optional Web Audio processing.

## Architecture Map
- App Router in `src/app` (RSC by default, client components marked with `use client`).
- Root layout in `src/app/layout.tsx` composes providers:
  SessionProvider, TRPCReactProvider, ToastProvider, AudioPlayerProvider, Menu and context menus.
- TRPC endpoint: `/api/trpc` in `src/app/api/trpc/[trpc]/route.ts`; client in `src/trpc/react.tsx`.
- NextAuth config in `src/server/auth/config.ts`; exported in `src/server/auth/index.ts`.
- DB in `src/server/db/index.ts` (Postgres via Drizzle); schema in `src/server/db/schema.ts`.
- Middleware in `src/middleware.ts` rate limits `/api/*` and sets CSP for pages.

## Routes and Screens
- Home: `src/app/page.tsx` + `src/app/HomePageClient.tsx`
- Profile: `src/app/[userhash]`
- Library and playlists: `src/app/library`, `src/app/playlists`
- Detail pages: `src/app/album`, `src/app/artist`, `src/app/track`
- Settings and license: `src/app/settings`, `src/app/license`
- Admin UI: `src/app/admin` (guarded by admin session flag)
- Service worker registration: `src/app/register-sw.tsx` (production only)

## Audio System
- Core logic: `src/hooks/useAudioPlayer.ts` (queue, history, smart queue, persistence).
- Global access: `src/contexts/AudioPlayerContext.tsx` (`useGlobalPlayer()`).
- Global audio element gets `data-audio-element="global-player"` (created in `useAudioPlayer`).
- Web Audio chain: `src/utils/audioContextManager.ts` (gain node, analyser hook-up, equalizer filters).
- iOS Safari: Web Audio is bypassed to keep background playback alive; equalizer UI disables when unsupported.
- Visualizer: `src/hooks/useAudioVisualizer.ts` + `src/components/visualizers/*`; state in `src/utils/visualizerState.ts`.
- Haptics: `src/utils/haptics.ts` and `src/hooks/useHapticCallbacks.ts`.

## Feature Flags and Constants
- Feature flags: `src/config/features.ts` (`audioFeatures`, `smartQueue`).
- Core constants: `src/config/constants.ts` (audio, UI breakpoints, cache).
- Player defaults: `src/config/player.ts`, `src/config/audioDefaults.ts`.
- Visualizer constants: `src/constants/visualizer.ts`.

## Data Model (Drizzle)
- Table prefix: `hexmusic-stream_` via `createTable`.
- Core tables: users, sessions, accounts, playlists, playlistTracks, favorites,
  listeningHistory, searchHistory, userPreferences, recommendationCache,
  recommendationLogs, listeningAnalytics, audioFeatures, playerSessions, playbackState.
- `users.admin` boolean default false; first-ever user auto-promoted in NextAuth signIn.
- Migrations: SQL in `drizzle/*.sql` and snapshots in `drizzle/meta/*_snapshot.json`
  plus `drizzle/meta/_journal.json`.

## Server API (tRPC + Next.js routes)
- TRPC routers in `src/server/api/routers/*` (registered in `src/server/api/root.ts`):
  - `music` (search, stream URLs, playlists, favorites, history, smart queue, preferences)
  - `equalizer` (preset storage)
  - `admin` (list users, set admin)
  - `post` (example)
- Note: `preferencesRouter` exists but is not mounted in `appRouter`.
- Next.js API routes in `src/app/api/*` proxy to backend:
  - `/api/music/search` -> Darkfloor API search
  - `/api/stream` -> Darkfloor stream with `STREAMING_KEY`
  - `/api/album`, `/api/artist`, `/api/track`, `/api/health`, `/api/og`

## External Services and Env
- Env validation in `src/env.js` (server + client).
- Required: `AUTH_SECRET`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`, `STREAMING_KEY`.
- Backend APIs:
  - `NEXT_PUBLIC_API_URL` (Darkfloor API, search/stream)
  - `NEXT_PUBLIC_SONGBIRD_API_URL` or `SONGBIRD_PUBLIC_API_URL` + `SONGBIRD_API_KEY`
- Songbird client helper: `src/services/songbird.ts`.
- Smart queue helpers: `src/services/smartQueue.ts`.
- `ELECTRON_BUILD=true` relaxes secure cookies and image optimization for desktop.

## Storage and Persistence
- Local storage keys in `src/config/storage.ts` (prefix `hexmusic_`).
- Storage wrapper in `src/services/storage.ts` with quota handling.
- Queue state: local storage for all users, DB persistence for authenticated users.
- User preferences read via `api.music.getUserPreferences` (queue panel, equalizer, visualizer flags).

## UI and Styling
- Tailwind v4 with CSS variables in `src/styles/globals.css`.
- Backgrounds and visual effects are layered in global CSS and `FlowFieldBackground`.
- Desktop header in `src/components/Header.tsx`.
- Mobile header/menu in `src/components/MobileHeader.tsx` and `src/components/HamburgerMenu.tsx`.
- Player surfaces: `src/components/PersistentPlayer.tsx`, `src/components/MiniPlayer.tsx`,
  `src/components/MobilePlayer.tsx`.

## Electron (Desktop)
- Entry in `electron/main.cjs`:
  - Loads `.env.local` if present.
  - Starts Next.js standalone server and loads it in BrowserWindow.
  - Uses persistent partition, media key shortcuts, and external navigation guards.
- Preload exposes `window.electron` for media key events (`electron/preload.cjs`).
- `ElectronStorageInit` and `src/utils/electronStorage.ts` help persistence debugging.

## Build, Deploy, Tests
- `next.config.js` uses `output: "standalone"`, ignores TS/ESLint build errors,
  and strips console in production.
- PM2 scripts and server validation live in `scripts/` and `ecosystem.config.cjs`.
- Tests in `src/__tests__` with Vitest; setup in `src/test/setup.ts`.
- Lint can fail due to ESLint config recursion; run only when asked.

## Versioning and Changelog
- Bump patch version per overarching change.
- Update both `CHANGELOG.md` and `public/CHANGELOG.md`.
- Date format: YYYY-MM-DD.

## Working Rules
- Use `audioContextManager` for Web Audio; do not create AudioContext directly.
- For iOS, keep background playback by avoiding Web Audio.
- Prefer TRPC procedures over direct fetch for app data; API routes are for backend proxying.
- Prefer `rg` for search and `apply_patch` for single-file edits.
