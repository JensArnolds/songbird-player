Here’s an optimized, AI‑friendly version of your prompt — condensed, structured, and clarified for a coding agent while keeping all the key architecture and workflow context intact. It’s tuned for code assistants (e.g., GitHub Copilot, Cursor, or OpenAI o1‑preview) so they can infer project structure, conventions, and edit rules effectively.  

***

**Optimized Prompt for Coding Agent**

> **Context: Starchild Music Frontend**
>
> This repository contains the frontend for **Starchild Music** — a Next.js App Router project running as both a web app and an Electron desktop app.  
> It uses **TRPC**, **NextAuth**, **Drizzle (Postgres)**, **Tailwind v4**, **Framer Motion**, and a global **HTMLAudioElement** with optional Web Audio processing.

### Project Architecture

- **App Router:** in `src/app`; use RSC by default, mark client components with `use client`.
- **Root layout:** `src/app/layout.tsx` includes providers – `SessionProvider`, `TRPCReactProvider`, `ToastProvider`, `AudioPlayerProvider`, and UI elements (`Menu`, context menus).
- **API integration:**  
  - TRPC endpoint: `/api/trpc` → `src/app/api/trpc/[trpc]/route.ts`; React client: `src/trpc/react.tsx`.
  - Auth: `src/server/auth/config.ts` → exported in `src/server/auth/index.ts`.
  - DB: `src/server/db/index.ts` (Drizzle + Postgres), schema in `src/server/db/schema.ts`.  
  - Middleware: `src/middleware.ts` (rate limiting, CSP).

### Routes

- Main: `src/app/page.tsx` (+ `HomePageClient.tsx`)
- Profile: `src/app/[userhash]`
- Library: `src/app/library`
- Playlists: `src/app/playlists`
- Detail pages: album / artist / track
- Settings: `src/app/settings`
- License: `src/app/license`
- Admin area: `src/app/admin` (requires `session.user.admin`)
- Service worker: `src/app/register-sw.tsx` (prod only)

### Audio System

- Core logic: `src/hooks/useAudioPlayer.ts` (queue, history, persistence, smart queue)
- Global context: `src/contexts/AudioPlayerContext.tsx` → `useGlobalPlayer()`
- Web Audio utilities: `src/utils/audioContextManager.ts`
- Visualizer: hooks + components under `src/hooks/useAudioVisualizer.ts` and `src/components/visualizers/*`
- Haptics: `src/utils/haptics.ts`, `src/hooks/useHapticCallbacks.ts`
- On iOS, bypass Web Audio to allow background playback.

### Data and Persistence

- DB prefix: `hexmusic-stream_`
- Tables: users, sessions, playlists, favorites, history, preferences, analytics, etc.
- Migrations: `drizzle/*.sql` and `drizzle/meta/*`
- Local storage keys in `src/config/storage.ts` (`hexmusic_*` prefix)
- Storage wrapper: `src/services/storage.ts`
- Authenticated users sync queue/preferences with DB; guest users use local storage.

### APIs and Services

- TRPC routers: `src/server/api/routers/*`  
  Includes: `music`, `equalizer`, `admin`, `post` (example)
- Proxy API routes (`src/app/api/*`):
  - `/api/music/search` → Darkfloor API
  - `/api/stream` → Darkfloor stream (uses `STREAMING_KEY`)
  - `/api/album`, `/api/artist`, `/api/track`, `/api/og`, `/api/health`
- Songbird client: `src/services/songbird.ts`
- Smart queue service: `src/services/smartQueue.ts`
- Env vars validated in `src/env.js`; key vars:  
  `AUTH_SECRET`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`, `STREAMING_KEY`,  
  `NEXT_PUBLIC_API_URL`, `SONGBIRD_API_KEY`, etc.
- `ELECTRON_BUILD=true` relaxes secure cookies and image optimization.

### UI and Styling

- Tailwind v4 with CSS variables in `src/styles/globals.css`
- Main UI: `Header.tsx`, `MobileHeader.tsx`, `HamburgerMenu.tsx`
- Player components: `PersistentPlayer`, `MiniPlayer`, `MobilePlayer`
- Backgrounds and motion: `FlowFieldBackground` + `Framer Motion` animations.

### Electron Integration

- `electron/main.cjs` – loads `.env.local`, runs standalone Next.js server, and opens BrowserWindow.
- `electron/preload.cjs` exposes `window.electron` for media key events.
- `ElectronStorageInit` + `src/utils/electronStorage.ts` handle persistent state.

### Build, Deploy, and Testing

- `next.config.js`: `output: "standalone"`, ignores TS/ESLint build errors, strips console in production.
- PM2 scripts and config in `scripts/` and `ecosystem.config.cjs`.
- Tests: Vitest in `src/__tests__`, setup at `src/test/setup.ts`.
- Lint can fail due to recursive ESLint config; run only when needed.
- Versioning: bump patch for major changes, update both `CHANGELOG.md` and `public/CHANGELOG.md` (format `YYYY-MM-DD`).

### Working Rules for Edits

- Always use `audioContextManager` to interact with Web Audio (never `new AudioContext()` directly).
- For iOS, avoid Web Audio to preserve background playback.
- Use **tRPC procedures** to access data instead of direct `fetch`.
- API routes exist only for proxying external backends.
- Use **`rg`** for searching and **`apply_patch`** for file modifications.

***

**Instruction for the Coding Agent:**
> Use the above context to understand the project’s architecture, API design, and audio system.  
> Follow “Working Rules” strictly when generating, modifying, or refactoring code.  
> Maintain consistency with existing patterns, naming, and directory structure.  
> When editing, prefer minimal patches (`apply_patch`) and validate imports relative to `src/`.
