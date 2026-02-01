# Songbird Frontend – Repository Overview

This document summarizes the **songbird-frontend** (Starchild Music) codebase for quick orientation and future prompts.

---

## What It Is

**Starchild Music** is a full-stack music streaming and discovery platform. Users search for tracks/albums/artists, play audio with an in-app player (equalizer, visualizers), manage playlists and favorites, and get AI-style recommendations. The app runs as a **web app** (Next.js) and as a **desktop app** (Electron). Default dev port: **3222**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, standalone output) |
| **Language** | TypeScript 5.9 (strict) |
| **UI** | React 19, TailwindCSS v4 |
| **API (internal)** | tRPC 11, TanStack Query 5 |
| **Auth** | NextAuth.js 5 (Discord OAuth) |
| **DB** | Drizzle ORM, PostgreSQL (Neon serverless), `pg` / `postgres` |
| **Env** | `@t3-oss/env-nextjs` + Zod |
| **Desktop** | Electron 39, electron-builder |
| **Tests** | Vitest, React Testing Library |

---

## Repository Structure

```sh
songbird-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (providers, Header, PersistentPlayer, etc.)
│   │   ├── page.tsx            # Home (search + recent)
│   │   ├── api/                # REST-style proxy routes
│   │   │   ├── music/search/   # V2 search proxy
│   │   │   ├── stream/         # V2 stream proxy (audio)
│   │   │   ├── track/[id]/     # Track metadata (V2 → V1 → Deezer fallback)
│   │   │   ├── album/[id]/     # Album (Deezer direct)
│   │   │   ├── artist/[id]/    # Artist (Deezer direct)
│   │   │   ├── og/             # OG image redirect (V2 preview / V1 fallback)
│   │   │   ├── health/         # App + DB health (local)
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── trpc/[trpc]/
│   │   ├── track/[id]/         # Track SEO page + redirect
│   │   ├── album/[id]/, artist/[id]/, playlists/, library/, settings/, admin/
│   │   └── [userhash]/         # User profile pages
│   ├── components/             # Shared UI (Header, MiniPlayer, Equalizer, visualizers, etc.)
│   ├── contexts/               # AudioPlayerContext, MenuContext, ToastContext, etc.
│   ├── hooks/                  # useAudioPlayer, useMediaQuery, useEqualizer, etc.
│   ├── server/                 # Backend logic
│   │   ├── api/                # tRPC root + routers (music, equalizer, admin, post)
│   │   ├── auth/               # NextAuth config
│   │   ├── db/                 # Drizzle schema + pool
│   │   └── services/           # recommendations, etc.
│   ├── trpc/                   # tRPC React provider + server caller
│   ├── services/               # smartQueue, songbird, storage (client/server)
│   ├── utils/                  # api, healthStatus, haptics, getBaseUrl, etc.
│   ├── types/                  # Track, Album, Artist, SearchResponse, etc.
│   ├── config/                 # audioDefaults, constants, features, storage
│   ├── styles/globals.css
│   ├── env.js                  # Env validation (Zod)
│   └── __tests__/              # Vitest tests (API routes, player, OG, etc.)
├── electron/                   # Electron main, preload, build config
├── drizzle/                   # SQL migrations
├── scripts/                    # server.js, ensure-build, Electron helpers
├── public/                     # Icons, images, manifest, sw.js
├── docs/                       # API_ROUTE_USE.md, etc.
├── next.config.js
├── package.json
└── REPOSITORY_OVERVIEW.md      # This file
```

---

## Main Features

- **Search & discovery**: Search tracks/albums/artists via `/api/music/search` (V2) and tRPC; results in Deezer-like shape.
- **Playback**: HTML5 Audio + Web Audio (equalizer). Stream URL from `/api/stream` (V2). Queue, shuffle, repeat, speed, history.
- **Equalizer**: 9-band, presets, persisted for logged-in users via tRPC.
- **Visualizers**: FlowFieldRenderer (80+ patterns), Kaleidoscope, LightweightParticleBackground.
- **Auth**: Discord OAuth; session in DB; profile at `/[userhash]`.
- **Library**: Playlists, favorites, listening history, preferences (tRPC + DB).
- **Recommendations**: Smart queue / similar tracks via Songbird API (and tRPC procedures with multiple fallbacks).
- **Responsive**: Mobile header + hamburger + mini player + full-screen player; desktop header + bottom player.
- **SEO & sharing**: `/track/[id]` for metadata; `/api/og` for OG images (V2 preview or V1 fallback).
- **Health**: `/api/health` (local DB + memory); Header can show API status using `NEXT_PUBLIC_API_HEALTH_URL` and `NEXT_PUBLIC_API_V2_HEALTH_URL`.

---

## Backend APIs (Proxied / Used)

- **V2 (Songbird) – `NEXT_PUBLIC_V2_API_URL` + `SONGBIRD_API_KEY`**  
  Used for: search (`/music/search`), stream (`/music/stream`), track batch (`/music/tracks/batch`), OG preview (`/api/track/{id}/preview`). Required for search and stream; no Deezer fallback for those.
- **V1 (Primary) – `NEXT_PUBLIC_API_URL` + `STREAMING_KEY`**  
  Used for: track metadata fallback (`/music/track/{id}`), OG fallback (`/api/preview?q=...`). Some routes still reference it for fallback.
- **Deezer**  
  Direct `https://api.deezer.com` for track/album/artist when configured as fallback (e.g. `/api/track/[id]`, track page, album/artist routes that proxy to Deezer).

See **docs/API_ROUTE_USE.md** for the full route table and fallback behavior.

---

## Conventions & Patterns

- **Path alias**: `@/` → `src/`.
- **Client components**: `"use client"` where needed (player, modals, hooks).
- **Server data**: tRPC for app data; REST routes in `src/app/api` only as proxies to backends.
- **Env**: All vars in `src/env.js`; server-only secrets (e.g. `STREAMING_KEY`, `SONGBIRD_API_KEY`) not exposed to client.
- **Audio**: User gesture required before starting Web Audio (e.g. equalizer); use shared `audioContextManager` where applicable.
- **Mobile**: `pt-16 pb-24` for content to clear header + player; z-index order: content &lt; header/mini player &lt; menu &lt; modals.

---

## Key Files for Common Tasks

| Task | Files |
|------|--------|
| Add / change API proxy | `src/app/api/*/route.ts` or `route.tsx` |
| Backend URL / env | `src/env.js`, `docs/API_ROUTE_USE.md` |
| tRPC procedures | `src/server/api/routers/*.ts`, `src/server/api/root.ts` |
| Player & queue logic | `src/contexts/AudioPlayerContext.tsx`, `src/hooks/useAudioPlayer.ts` |
| Stream URL | `src/app/api/stream/route.ts` (V2 only) |
| Search | `src/app/api/music/search/route.ts` (V2), tRPC `music` router |
| Track metadata & SEO | `src/app/api/track/[id]/route.ts`, `src/app/track/[id]/page.tsx` |
| OG images | `src/app/api/og/route.tsx` |
| Health | `src/app/api/health/route.ts`, `src/utils/healthStatus.ts`, `Header.tsx` |
| DB schema | `src/server/db/schema.ts`, `drizzle/` |
| Tests | `src/__tests__/*.test.ts(x)`, `src/test/setup.ts` |

---

## Scripts (package.json)

- **Dev**: `npm run dev` (custom server, port from env, default 3222), `npm run dev:next` (Next only).
- **Build / run**: `npm run build`, `npm run start`.
- **PM2**: `npm run pm2:start`, `pm2:reload`, `pm2:logs`, `deploy` (build + reload).
- **DB**: `npm run db:generate`, `db:migrate`, `db:push`, `db:studio`.
- **Quality**: `npm run typecheck`, `lint`, `format:write`, `test`.
- **Electron**: `npm run electron:dev`, `electron:build:win` / `mac` / `linux`.

---

## Notes

- **No middleware file** present at repo root or under `src/`; CORS/security for API routes are handled in Next.js and/or backend config.
- **Preferences router** exists in `src/server/api/routers/preferences.ts` but is not mounted in `root.ts` in the reviewed snippet; confirm if it is added elsewhere.
- **Starchild Music** = product name; **songbird-frontend** = repo/PM2 app name; **starchildmusic** = npm package name.

Use this overview together with **README.md**, **CLAUDE.md** (if present), and **docs/API_ROUTE_USE.md** for consistent edits and onboarding.
