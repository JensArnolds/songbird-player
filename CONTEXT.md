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

**API Context:**

- NEXT_PUBLIC_API_URL and NEXT_PUBLIC_V2_API_URL are the main API URLs for the application.
- The goal is to migrate to the V2 API, but we need to keep the V1 API for backwards compatibility for now.

Analysis of current API usage:

## Primary Music API (`NEXT_PUBLIC_API_URL`)

This base URL points at the **primary music backend** (search, metadata, streaming).

| Frontend usage / route                      | Backend path (relative to `NEXT_PUBLIC_API_URL`) | Purpose                                                                 |
|--------------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------|
| `GET /api/music/search`                    | `music/search`                                   | Search tracks/albums/artists (typed `SearchResponse`)                  |
| `GET /api/track/[id]`                      | `music/track/{id}`                               | Fetch track metadata by Deezer ID (with `STREAMING_KEY`)               |
| `GET /track/[id]` (page SEO loader)        | `music/track/{id}`                               | Server-side fetch for SEO metadata and redirect logic                  |
| `GET /api/stream?id={id}`                  | `music/stream?id={id}&key={STREAMING_KEY}`       | Audio streaming proxy (supports `Range` for partial content)           |
| `GET /api/og?q=...` (backend fallback)     | `api/preview?q={query}`                          | OG image generation fallback when Songbird preview is not available    |
| tRPC `music` router (server-side)          | `music/*` and related endpoints                  | Core music operations: search, metadata, recommendations, queue, etc.  |
| `src/services/smartQueue.ts` (service)     | `*` under `NEXT_PUBLIC_API_URL`                  | Smart queue helper calls into primary music API from Node context      |

> **Note:** All these calls normalize trailing slashes, so `NEXT_PUBLIC_API_URL` may end with `/` or not.

---

## V2 / Songbird API (`NEXT_PUBLIC_V2_API_URL`)

This base URL points at the **v2 / Songbird-style backend**, used for OG images and advanced recommendations.

| Frontend usage / route                      | Backend path (relative to `NEXT_PUBLIC_V2_API_URL`) | Purpose                                                                 |
|--------------------------------------------|-----------------------------------------------------|-------------------------------------------------------------------------|
| `src/services/songbird.ts` (`songbird.request`) | Various (`/music/tracks/batch`, `/api/recommendations`, etc.) | Songbird / v2 recommendation flows and related helper endpoints        |
| `GET /api/og?trackId={id}`                 | `api/preview?title=...&artist=...&album=...`       | Track-specific OG image generation (server builds params, v2 renders)  |
| `GET /api/og?q=...` (primary path)         | `api/preview?title=...&artist=...&album=...`       | Query-based OG image generation via track search + v2 preview          |
| `GET /api/og` (no params, default)         | `api/preview/default`                              | Default OG image when no track/query data is available                 |
| App metadata (`src/app/layout.tsx`)        | `api/preview/default`                              | Default OG / Twitter image for the site                                |
| Search page metadata (`src/app/page.tsx`)  | `api/preview/default`                              | Default OG image for search landing pages                              |

> **Note:** `NEXT_PUBLIC_V2_API_URL` is also normalized for trailing slashes before paths are appended.

### OpenAPI documentation for API V1

```yaml
openapi: 3.0.0
paths:
  /health:
    get:
      operationId: getHealth
      parameters: []
      responses:
        '200':
          description: ''
  /api-yaml:
    get:
      operationId: getApiYaml
      parameters: []
      responses:
        '200':
          description: ''
      tags:
        - documentation
  /public/{filename}:
    get:
      operationId: servePublicFile
      parameters:
        - name: filename
          required: true
          in: path
          schema:
            type: string
      responses:
        '200':
          description: ''
  /auth/register:
    post:
      operationId: register
      summary: Register a new user
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterDto'
      responses:
        '201':
          description: The user has been successfully created.
        '400':
          description: Bad Request.
        '401':
          description: Unauthorized.
      tags:
        - auth
  /auth/login:
    post:
      operationId: login
      summary: Log in a user
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginDto'
      responses:
        '200':
          description: User successfully logged in.
        '400':
          description: Bad Request.
        '401':
          description: Unauthorized.
      tags:
        - auth
  /auth/me:
    get:
      operationId: getProfile
      summary: Get current user info
      parameters: []
      responses:
        '200':
          description: Return current user info
        '400':
          description: Bad Request.
        '401':
          description: Unauthorized.
      tags:
        - auth
      security:
        - bearer: []
  /users/profile:
    get:
      operationId: getProfile
      summary: Get user profile
      parameters: []
      responses:
        '200':
          description: Return user profile
      tags:
        - users
      security:
        - bearer: []
    put:
      operationId: updateProfile
      summary: Update user profile
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserDto'
      responses:
        '200':
          description: Return updated user profile
      tags:
        - users
      security:
        - bearer: []
  /music/stream:
    get:
      operationId: streamMusic
      summary: Stream music
      parameters:
        - name: key
          required: true
          in: query
          schema:
            type: string
        - name: id
          required: false
          in: query
          schema:
            type: string
        - name: q
          required: false
          in: query
          schema:
            type: string
        - name: link
          required: false
          in: query
          schema:
            type: boolean
        - name: file
          required: false
          in: query
          schema:
            type: boolean
        - name: kbps
          required: false
          in: query
          schema:
            type: number
        - name: offset
          required: false
          in: query
          schema:
            type: number
      responses:
        '200':
          description: Stream begins or link provided.
        '400':
          description: Invalid request parameters.
        '401':
          description: Invalid or missing API key.
        '404':
          description: No results found.
        '500':
          description: Server error during streaming or download.
      tags:
        - music
  /music/health:
    get:
      operationId: healthCheck
      summary: Health check endpoint
      parameters: []
      responses:
        '200':
          description: Service is healthy
      tags:
        - music
  /music/search:
    get:
      operationId: searchMusic
      summary: Search music on Deezer
      parameters:
        - name: q
          required: true
          in: query
          schema:
            type: string
        - name: offset
          required: false
          in: query
          description: 'Result offset for pagination (default: 0)'
          schema:
            type: number
      responses:
        '200':
          description: Search results from Deezer.
        '500':
          description: Error during the search operation.
      tags:
        - music
  /music/cleanup:
    get:
      operationId: cleanupDownloadFolder
      summary: Clean up download folder
      parameters: []
      responses:
        '200':
          description: Cleanup successful.
        '500':
          description: Error during the cleanup operation.
      tags:
        - music
  /music/tracks/batch:
    get:
      operationId: getBatchTrackMetadata
      summary: Get metadata for multiple tracks
      parameters:
        - name: ids
          required: true
          in: query
          description: Comma-separated Deezer track IDs
          schema:
            type: string
      responses:
        '200':
          description: Array of track metadata
        '400':
          description: Invalid track IDs
      tags:
        - music
  /music/search/advanced:
    get:
      operationId: advancedSearch
      summary: Advanced search with filters
      parameters:
        - name: q
          required: true
          in: query
          description: Search query
          schema:
            type: string
        - name: artist
          required: false
          in: query
          description: Filter by artist
          schema:
            type: string
        - name: album
          required: false
          in: query
          description: Filter by album
          schema:
            type: string
        - name: durationMin
          required: false
          in: query
          description: Minimum duration in seconds
          schema:
            type: number
        - name: durationMax
          required: false
          in: query
          description: Maximum duration in seconds
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: Pagination offset
          schema:
            type: number
        - name: limit
          required: false
          in: query
          description: Results limit
          schema:
            type: number
      responses:
        '200':
          description: Filtered search results
      tags:
        - music
  /music/stream-static:
    get:
      operationId: streamStaticMusic
      summary: Stream static music file
      parameters:
        - name: id
          required: true
          in: query
          schema:
            type: number
        - name: range
          required: false
          in: query
          description: Percentage range of the song to stream, e.g., "0-20" or "20-40".
          schema:
            type: string
      responses:
        '200':
          description: Streaming of the music file started.
        '400':
          description: Invalid ID or ID out of range.
        '500':
          description: Error during streaming.
      tags:
        - music
  /music/favorites/{trackId}:
    post:
      operationId: addFavorite
      summary: Add a track to favorites
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        '201':
          description: Track added to favorites
        '401':
          description: Unauthorized
        '404':
          description: Track not found
        '409':
          description: Track already in favorites
      tags:
        - favorites
      security:
        - bearer: []
    delete:
      operationId: removeFavorite
      summary: Remove a track from favorites
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        '204':
          description: Track removed from favorites
        '401':
          description: Unauthorized
        '404':
          description: Favorite not found
      tags:
        - favorites
      security:
        - bearer: []
  /music/favorites:
    get:
      operationId: getFavorites
      summary: Get all favorite tracks
      parameters:
        - name: limit
          required: false
          in: query
          description: 'Limit results (default: 50)'
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: 'Offset for pagination (default: 0)'
          schema:
            type: number
      responses:
        '200':
          description: List of favorite tracks
        '401':
          description: Unauthorized
      tags:
        - favorites
      security:
        - bearer: []
  /music/favorites/check/{trackId}:
    get:
      operationId: checkFavorite
      summary: Check if a track is in favorites
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        '200':
          description: 'Returns { isFavorite: boolean }'
        '401':
          description: Unauthorized
      tags:
        - favorites
      security:
        - bearer: []
  /music/favorites/count:
    get:
      operationId: getFavoriteCount
      summary: Get total count of favorite tracks
      parameters: []
      responses:
        '200':
          description: 'Returns { count: number }'
        '401':
          description: Unauthorized
      tags:
        - favorites
      security:
        - bearer: []
  /music/favorites/batch-check:
    post:
      operationId: batchCheckFavorites
      summary: Batch check if tracks are favorited
      parameters:
        - name: trackIds
          required: true
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Returns object with track IDs as keys and boolean values
        '401':
          description: Unauthorized
      tags:
        - favorites
      security:
        - bearer: []
  /music/history:
    get:
      operationId: getHistory
      summary: Get listening history
      parameters:
        - name: limit
          required: false
          in: query
          description: 'Limit results (default: 50)'
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: 'Offset for pagination (default: 0)'
          schema:
            type: number
      responses:
        '200':
          description: Listening history
        '401':
          description: Unauthorized
      tags:
        - listening-history
      security:
        - bearer: []
    delete:
      operationId: clearHistory
      summary: Clear listening history
      parameters: []
      responses:
        '204':
          description: Listening history cleared
        '401':
          description: Unauthorized
      tags:
        - listening-history
      security:
        - bearer: []
  /music/history/recent:
    get:
      operationId: getRecentlyPlayed
      summary: Get recently played tracks (unique)
      parameters:
        - name: limit
          required: false
          in: query
          description: 'Limit results (default: 20)'
          schema:
            type: number
      responses:
        '200':
          description: Recently played tracks
        '401':
          description: Unauthorized
      tags:
        - listening-history
      security:
        - bearer: []
  /music/history/stats:
    get:
      operationId: getStats
      summary: Get listening statistics
      parameters:
        - name: days
          required: false
          in: query
          description: 'Number of days to include in stats (default: 30)'
          schema:
            type: number
      responses:
        '200':
          description: Listening statistics
        '401':
          description: Unauthorized
      tags:
        - listening-history
      security:
        - bearer: []
  /music/playlists:
    post:
      operationId: createPlaylist
      summary: Create a new playlist
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePlaylistDto'
      responses:
        '201':
          description: Playlist created successfully
        '401':
          description: Unauthorized
      tags:
        - playlists
      security:
        - bearer: []
    get:
      operationId: getUserPlaylists
      summary: Get all playlists for the authenticated user
      parameters: []
      responses:
        '200':
          description: List of playlists
        '401':
          description: Unauthorized
      tags:
        - playlists
      security:
        - bearer: []
  /music/playlists/{playlistId}:
    get:
      operationId: getPlaylist
      summary: Get a specific playlist by ID
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      responses:
        '200':
          description: Playlist details
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - playlist is private
        '404':
          description: Playlist not found
      tags:
        - playlists
      security:
        - bearer: []
    put:
      operationId: updatePlaylist
      summary: Update a playlist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePlaylistDto'
      responses:
        '200':
          description: Playlist updated successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - not playlist owner
        '404':
          description: Playlist not found
      tags:
        - playlists
      security:
        - bearer: []
    delete:
      operationId: deletePlaylist
      summary: Delete a playlist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      responses:
        '204':
          description: Playlist deleted successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - not playlist owner
        '404':
          description: Playlist not found
      tags:
        - playlists
      security:
        - bearer: []
  /music/playlists/{playlistId}/tracks:
    post:
      operationId: addTrack
      summary: Add a track to a playlist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AddToPlaylistDto'
      responses:
        '201':
          description: Track added to playlist
        '400':
          description: Track already in playlist
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - not playlist owner
        '404':
          description: Playlist or track not found
      tags:
        - playlists
      security:
        - bearer: []
  /music/playlists/{playlistId}/tracks/{trackId}:
    delete:
      operationId: removeTrack
      summary: Remove a track from a playlist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        '200':
          description: Track removed from playlist
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - not playlist owner
        '404':
          description: Playlist or track not found
      tags:
        - playlists
      security:
        - bearer: []
  /music/playlists/{playlistId}/tracks/reorder:
    put:
      operationId: reorderTrack
      summary: Reorder a track in a playlist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReorderPlaylistDto'
      responses:
        '200':
          description: Track reordered successfully
        '400':
          description: Invalid position
        '401':
          description: Unauthorized
        '403':
          description: Forbidden - not playlist owner
        '404':
          description: Playlist or track not found
      tags:
        - playlists
      security:
        - bearer: []
  /spotify/auth/url:
    get:
      operationId: getAuthUrl
      summary: Get Spotify OAuth authorization URL
      parameters:
        - name: state
          required: false
          in: query
          description: CSRF state parameter
          schema:
            type: string
      responses:
        '200':
          description: Authorization URL returned
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/auth/callback:
    post:
      operationId: handleCallback
      summary: Handle Spotify OAuth callback
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SpotifyAuthCallbackDto'
      responses:
        '200':
          description: Successfully authenticated with Spotify
        '401':
          description: Authentication failed
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/auth/disconnect:
    delete:
      operationId: disconnect
      summary: Disconnect Spotify account
      parameters: []
      responses:
        '200':
          description: Successfully disconnected
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/auth/status:
    get:
      operationId: getConnectionStatus
      summary: Check Spotify connection status
      parameters: []
      responses:
        '200':
          description: Connection status
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/playlists:
    get:
      operationId: getUserPlaylists
      summary: Get user playlists from Spotify
      parameters:
        - name: limit
          required: false
          in: query
          description: Results limit (max 50)
          schema:
            type: number
      responses:
        '200':
          description: Array of Spotify playlists
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/playlists/{playlistId}:
    get:
      operationId: getPlaylist
      summary: Get Spotify playlist details
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Spotify playlist ID
          schema:
            type: string
      responses:
        '200':
          description: Playlist details
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/playlists/import:
    post:
      operationId: importPlaylist
      summary: Import Spotify playlist and match to Deezer
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ImportPlaylistDto'
      responses:
        '200':
          description: Playlist import result
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/tracks/{trackId}:
    get:
      operationId: getTrack
      summary: Get Spotify track details
      parameters:
        - name: trackId
          required: true
          in: path
          description: Spotify track ID
          schema:
            type: string
      responses:
        '200':
          description: Track details
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/tracks/analyze:
    post:
      operationId: analyzeTrack
      summary: Analyze track for BPM, mood, and musical characteristics
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AnalyzeTrackDto'
      responses:
        '200':
          description: Enhanced track analysis
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/tracks/analyze-batch:
    post:
      operationId: analyzeBatch
      summary: Analyze multiple tracks in batch
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BatchAnalyzeTracksDto'
      responses:
        '200':
          description: Array of enhanced track analyses
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/tracks/{trackId}/audio-features:
    get:
      operationId: getAudioFeatures
      summary: Get audio features for a track
      parameters:
        - name: trackId
          required: true
          in: path
          description: Spotify track ID
          schema:
            type: string
      responses:
        '200':
          description: Audio features
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/tracks/{trackId}/audio-analysis:
    get:
      operationId: getAudioAnalysis
      summary: Get detailed audio analysis for a track
      parameters:
        - name: trackId
          required: true
          in: path
          description: Spotify track ID
          schema:
            type: string
      responses:
        '200':
          description: Detailed audio analysis
      tags:
        - spotify
      security:
        - bearer: []
  /spotify/search:
    get:
      operationId: search
      summary: Search Spotify catalog
      parameters:
        - name: q
          required: true
          in: query
          description: Search query
          schema:
            type: string
        - name: type
          required: true
          in: query
          description: 'Search type: track, playlist, album, artist'
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Results limit (max 50)
          schema:
            type: number
      responses:
        '200':
          description: Search results
      tags:
        - spotify
      security:
        - bearer: []
  /hexmusic/search/tracks:
    get:
      operationId: searchTracks
      summary: Search for tracks
      description: >-
        Search Spotify for tracks by name, artist, or any search term. Returns
        up to 10 tracks with details including ID, name, artists, album, and
        cover art. Results are cached for 24 hours.
      parameters:
        - name: query
          required: true
          in: query
          description: Search query string (track name, artist, or keywords)
          schema:
            example: Bohemian Rhapsody Queen
            type: string
      responses:
        '200':
          description: Successfully retrieved track search results
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TrackResponseDto'
        '500':
          description: Failed to search tracks (Spotify API error)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/search/playlists:
    get:
      operationId: searchPlaylists
      summary: Search for playlists
      description: >-
        Search Spotify for playlists by name or keywords. Returns up to 20
        playlists with metadata including ID, name, description, owner, and
        track count. Results are cached for 24 hours.
      parameters:
        - name: query
          required: true
          in: query
          description: Search query string (playlist name or keywords)
          schema:
            example: Rock Classics
            type: string
      responses:
        '200':
          description: Successfully retrieved playlist search results
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PlaylistSearchResultDto'
        '500':
          description: Failed to search playlists (Spotify API error)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/playlist/{playlistId}:
    get:
      operationId: getSpotifyPlaylist
      summary: Get playlist details
      description: >-
        Retrieve detailed information about a specific Spotify playlist
        including all tracks, metadata, and cover art.
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Spotify playlist ID
          schema:
            example: 37i9dQZF1DWXRqgorJj26U
            type: string
      responses:
        '200':
          description: Successfully retrieved playlist details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlaylistDetailResponseDto'
        '500':
          description: Failed to fetch Spotify playlist
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/playlist/{playlistId}:
    get:
      operationId: getRecommendationsFromPlaylist
      summary: Get recommendations from a playlist
      description: >-
        Generate song recommendations based on the first 5 tracks from a Spotify
        playlist. Returns 20 recommended tracks similar to the playlist content.
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Spotify playlist ID to base recommendations on
          schema:
            example: 37i9dQZF1DWXRqgorJj26U
            type: string
      responses:
        '200':
          description: Successfully generated recommendations from playlist
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                    artists:
                      type: string
                    album:
                      type: string
                    previewUrl:
                      type: string
                      nullable: true
                    imageUrl:
                      type: string
                      nullable: true
        '500':
          description: Failed to generate recommendations
      tags:
        - Music & Recommendations
  /hexmusic/playlist-recommendations:
    get:
      operationId: getPlaylistRecommendations
      summary: Search playlists and get recommendations
      description: >-
        Search for playlists by query, select the first result, and generate
        recommendations based on it. Results are saved to the database.
      parameters:
        - name: query
          required: true
          in: query
          description: Playlist search query
          schema:
            example: Chill Vibes
            type: string
      responses:
        '200':
          description: Successfully searched playlist and generated recommendations
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  query:
                    type: string
                  selectedPlaylist:
                    type: object
                    properties:
                      id:
                        type: string
                      name:
                        type: string
                      description:
                        type: string
                      owner:
                        type: string
                      tracksTotal:
                        type: number
                      imageUrl:
                        type: string
                        nullable: true
                  recommendations:
                    type: array
                    items:
                      type: object
        '404':
          description: No playlists found for query
        '500':
          description: Failed to process request
      tags:
        - Music & Recommendations
  /hexmusic/recommendations:
    post:
      operationId: getRecommendations
      summary: Get song recommendations (flexible input)
      description: >-
        Generate personalized song recommendations based on 1-5 seed tracks.
        Supports flexible input: provide track IDs, track names (with optional
        artist), or a mix of both. Configurable recommendation limit (1-100).
        Results are cached for 24 hours. This is the primary recommendation
        endpoint with the most flexibility.
      parameters: []
      requestBody:
        required: true
        description: Recommendation request with flexible track input
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RecommendationRequestDto'
            examples:
              Track IDs:
                value:
                  tracks:
                    - id: 3n3Ppam7vgaVa1iaRUc9Lp
                    - id: 5ChkMS8OtdzJeqyybCc9R5
                  limit: 20
                summary: Using Spotify track IDs
              Track Names:
                value:
                  tracks:
                    - name: Bohemian Rhapsody
                      artist: Queen
                    - name: Stairway to Heaven
                      artist: Led Zeppelin
                  limit: 30
                summary: Using track names with artists
              Mixed Input:
                value:
                  tracks:
                    - id: 3n3Ppam7vgaVa1iaRUc9Lp
                    - name: Hotel California
                    - name: Wonderwall
                      artist: Oasis
                  limit: 15
                summary: Mix of IDs and names
      responses:
        '200':
          description: Successfully generated recommendations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TrackWithPreviewResponseDto'
        '400':
          description: Could not resolve any of the provided tracks
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
        '500':
          description: Failed to fetch recommendations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/legacy:
    post:
      operationId: getRecommendationsLegacy
      summary: Get recommendations (legacy endpoint)
      description: >-
        Legacy endpoint for backward compatibility. Accepts only track IDs and
        returns exactly 20 recommendations. Use the /recommendations endpoint
        instead for more flexibility.
      parameters: []
      requestBody:
        required: true
        description: Legacy recommendation request with track IDs only
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LegacyRecommendationRequestDto'
            examples:
              default:
                value:
                  trackIds:
                    - 3n3Ppam7vgaVa1iaRUc9Lp
                    - 5ChkMS8OtdzJeqyybCc9R5
                    - 0c6xIDDpzE81m2q797ordA
      responses:
        '200':
          description: Successfully generated 20 recommendations
        '500':
          description: Failed to fetch recommendations
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/generate/{playlistSearchId}:
    post:
      operationId: generateAndSaveRecommendations
      summary: Generate and save recommendations from playlist search
      description: >-
        Generate recommendations based on a previously saved playlist search
        result. Uses the first playlist from the search results. Recommendations
        are saved to database.
      parameters:
        - name: playlistSearchId
          required: true
          in: path
          description: ID of a previously saved playlist search
          schema:
            example: clx1234567890abcdef
            type: string
      responses:
        '201':
          description: Successfully generated and saved recommendations
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  playlistSearchId:
                    type: string
                  recommendations:
                    type: array
                    items:
                      type: object
                  createdAt:
                    type: string
                    format: date-time
                  updatedAt:
                    type: string
                    format: date-time
        '404':
          description: Playlist search not found
        '500':
          description: Failed to generate recommendations
      tags:
        - Music & Recommendations
  /hexmusic/songs:
    get:
      operationId: fetchSongs
      summary: Fetch songs (search tracks)
      description: >-
        Search for tracks on Spotify with a customizable limit. Similar to
        /search/tracks but with configurable result count. Returns track details
        including preview URLs and cover art.
      parameters:
        - name: query
          required: true
          in: query
          description: Search query for tracks
          schema:
            example: The Beatles
            type: string
        - name: limit
          required: false
          in: query
          description: Maximum number of results to return
          schema:
            example: 10
            type: number
      responses:
        '200':
          description: Successfully fetched songs
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                    name:
                      type: string
                    artists:
                      type: array
                      items:
                        type: string
                      example:
                        - The Beatles
                    album:
                      type: string
                    previewUrl:
                      type: string
                      nullable: true
                    imageUrl:
                      type: string
                      nullable: true
        '500':
          description: Failed to fetch songs
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/bulk:
    post:
      operationId: getBulkRecommendations
      summary: Get recommendations from bulk songs
      description: >-
        Submit an array of songs and receive recommendations. Accepts any number
        of songs (uses up to 5 as seeds due to Spotify API limits). Each song
        can be specified by ID, name, or name+artist. The "n" parameter controls
        how many recommendations to return (defaults to the number of input
        songs). Perfect for getting recommendations based on a playlist or
        collection of songs.
      parameters: []
      requestBody:
        required: true
        description: Bulk songs recommendation request
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BulkSongsRecommendationDto'
            examples:
              With IDs and Names:
                value:
                  giveSongs:
                    - id: 3n3Ppam7vgaVa1iaRUc9Lp
                      name: Mr. Brightside
                    - name: Somebody Told Me
                      artist: The Killers
                    - name: When You Were Young
                      artist: The Killers
                    - id: 0eGsygTp906u18L0Oimnem
                  'n': 10
                summary: Mixed IDs and names with custom count
              Only Names:
                value:
                  giveSongs:
                    - name: Blinding Lights
                      artist: The Weeknd
                    - name: Levitating
                      artist: Dua Lipa
                    - name: Save Your Tears
                      artist: The Weeknd
                    - name: Don't Start Now
                      artist: Dua Lipa
                    - name: Peaches
                      artist: Justin Bieber
                summary: Using only track names (returns 5 recommendations by default)
              Large Playlist:
                value:
                  giveSongs:
                    - name: Bohemian Rhapsody
                      artist: Queen
                    - name: Stairway to Heaven
                      artist: Led Zeppelin
                    - name: Hotel California
                      artist: Eagles
                    - name: Imagine
                      artist: John Lennon
                    - name: Sweet Child O Mine
                      artist: Guns N' Roses
                    - name: November Rain
                      artist: Guns N' Roses
                    - name: Dream On
                      artist: Aerosmith
                  'n': 20
                summary: 7 classic rock songs, requesting 20 recommendations
      responses:
        '200':
          description: Successfully generated bulk recommendations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TrackWithPreviewResponseDto'
        '400':
          description: Could not resolve any of the provided songs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
        '500':
          description: Failed to generate bulk recommendations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/deezer:
    post:
      operationId: getDeezerRecommendations
      summary: Get Deezer recommendations from track names
      description: >-
        Submit an array of track names and receive Deezer track recommendations
        with Deezer IDs. Track names can be simple titles or "Artist - Track"
        format for better accuracy. The "n" parameter controls how many
        recommendations to return (defaults to the number of input tracks).
        Perfect for getting Deezer-based recommendations that can be used with
        the Deezer API or player. Results are cached for 24 hours and stored in
        the database.
      parameters: []
      requestBody:
        required: true
        description: Deezer recommendation request with track names and optional mode
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeezerRecommendationRequestDto'
            examples:
              Strict Mode - Same Artists:
                value:
                  trackNames:
                    - Queen - Bohemian Rhapsody
                    - Queen - We Will Rock You
                    - Led Zeppelin - Stairway to Heaven
                  'n': 10
                  mode: 0
                summary: 'Strict mode (0): Returns more tracks from the same artists'
              Balanced Mode - Related Artists:
                value:
                  trackNames:
                    - Bohemian Rhapsody
                    - Stairway to Heaven
                    - Hotel California
                    - Imagine
                  'n': 15
                  mode: 1
                summary: >-
                  Balanced mode (1): Returns tracks from related artists in
                  similar genres
              Diverse Mode - Genre Variety:
                value:
                  trackNames:
                    - The Weeknd - Blinding Lights
                    - Dua Lipa - Levitating
                    - Pink Floyd - Comfortably Numb
                  'n': 20
                  mode: 2
                summary: >-
                  Diverse mode (2): Returns varied tracks with loose genre
                  adherence
              Default Mode (Balanced):
                value:
                  trackNames:
                    - Blinding Lights
                    - Levitating
                    - Save Your Tears
                  'n': 10
                summary: No mode specified - defaults to Balanced (1)
      responses:
        '200':
          description: Successfully generated Deezer recommendations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/DeezerTrackResponseDto'
        '400':
          description: Could not resolve any of the provided track names
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
        '500':
          description: Failed to generate Deezer recommendations
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponseDto'
      tags:
        - Music & Recommendations
  /hexmusic/recommendations/json:
    post:
      operationId: getRecommendationsFromJson
      summary: Get recommendations from JSON string (legacy)
      description: >-
        Legacy endpoint that accepts a JSON string of song objects. Parses the
        JSON and generates recommendations from the song IDs. Use the
        /recommendations/bulk endpoint instead for better type safety.
      parameters: []
      requestBody:
        required: true
        description: JSON string containing array of song objects with IDs
        content:
          application/json:
            schema:
              type: object
              properties:
                songs:
                  type: string
                  example: >-
                    [{"id":"3n3Ppam7vgaVa1iaRUc9Lp","name":"Mr.
                    Brightside"},{"id":"5ChkMS8OtdzJeqyybCc9R5","name":"Somebody
                    Told Me"}]
              required:
                - songs
      responses:
        '200':
          description: Successfully generated recommendations from JSON
        '400':
          description: Invalid JSON input or empty array
        '500':
          description: Failed to fetch recommendations
      tags:
        - Music & Recommendations
  /version:
    get:
      operationId: getVersion
      parameters: []
      responses:
        '200':
          description: ''
info:
  title: Darkfloor API
  description: >-
    Comprehensive REST API for music discovery, search, and personalized
    recommendations powered by Spotify. Features include track and playlist
    search, flexible recommendation generation with configurable parameters, and
    intelligent track name resolution. All search and recommendation results are
    cached for optimal performance.
  version: 0.8.0
  contact:
    name: 'Discord: soul.wax'
    url: https://github.com/soulwax
    email: support@soulwax.dev
  license:
    name: Commercial
    url: ''
tags:
  - name: Music & Recommendations
    description: >-
      Endpoints for searching music, generating recommendations, and managing
      playlists
servers:
  - url: http://localhost:3111
    description: Local development server
  - url: https://starchildapi.battlecry.tech
    description: Production server
  - url: https://api.starchildmusic.com
    description: Legacy production server
  - url: https://api.isobelnet.de
    description: Isobelnet production server
  - url: https://api.www.isobelnet.de
    description: Isobelnet production server
  - url: https://api.dev.isobelnet.de
    description: Isobelnet development server
  - url: https://api.www.dev.isobelnet.de
    description: Isobelnet development server
  - url: https://api.*.isobelnet.de
    description: Isobelnet production server
  - url: https://api.*.www.isobelnet.de
    description: Isobelnet production server
  - url: https://api.*.dev.isobelnet.de
    description: Isobelnet development server
  - url: https://api.*.www.dev.isobelnet.de
    description: Isobelnet development server
components:
  securitySchemes:
    JWT-auth:
      scheme: bearer
      bearerFormat: JWT
      type: http
      description: Enter JWT token
      in: header
  schemas:
    RegisterDto:
      type: object
      properties:
        name:
          type: string
          example: John Doe
          description: The name of the user
        email:
          type: string
          example: john@example.com
          description: The email of the user
        password:
          type: string
          example: password123
          description: The password of the user
      required:
        - name
        - email
        - password
    LoginDto:
      type: object
      properties:
        email:
          type: string
          example: user@example.com
          description: The email of the user
        password:
          type: string
          example: password123
          description: The password of the user
      required:
        - email
        - password
    UpdateUserDto:
      type: object
      properties:
        name:
          type: string
        profileImage:
          type: string
    CreatePlaylistDto:
      type: object
      properties:
        name:
          type: string
          description: Playlist name
          example: My Chill Vibes
          maxLength: 100
        description:
          type: string
          description: Playlist description
          example: Perfect music for relaxing evenings
          maxLength: 500
        isPublic:
          type: boolean
          description: Whether the playlist is public
          example: true
          default: true
        coverImage:
          type: string
          description: Cover image URL
          example: https://example.com/cover.jpg
      required:
        - name
    UpdatePlaylistDto:
      type: object
      properties:
        name:
          type: string
          description: Playlist name
          example: My Updated Playlist
          maxLength: 100
        description:
          type: string
          description: Playlist description
          example: Updated description
          maxLength: 500
        isPublic:
          type: boolean
          description: Whether the playlist is public
          example: false
        coverImage:
          type: string
          description: Cover image URL
          example: https://example.com/new-cover.jpg
    AddToPlaylistDto:
      type: object
      properties:
        deezerTrackId:
          type: string
          description: Deezer track ID to add
          example: '3135556'
        position:
          type: number
          description: Position in playlist (optional, defaults to end)
          example: 5
      required:
        - deezerTrackId
    ReorderPlaylistDto:
      type: object
      properties:
        trackId:
          type: string
          description: Track ID to move
          example: 123e4567-e89b-12d3-a456-426614174000
        newPosition:
          type: number
          description: New position (0-based index)
          example: 3
      required:
        - trackId
        - newPosition
    SpotifyAuthCallbackDto:
      type: object
      properties:
        code:
          type: string
          description: Authorization code from Spotify OAuth callback
          example: AQD7f9...
        state:
          type: string
          description: State parameter for CSRF protection
      required:
        - code
    ImportPlaylistDto:
      type: object
      properties:
        playlistId:
          type: string
          description: Spotify playlist ID or full URL
          example: 37i9dQZF1DXcBWIGoYBM5M
        createPlaylist:
          type: boolean
          description: Create as new playlist in system
          default: true
        playlistName:
          type: string
          description: Name for the imported playlist (overrides Spotify name)
        isPublic:
          type: boolean
          description: Make the imported playlist public
          default: true
      required:
        - playlistId
    AnalyzeTrackDto:
      type: object
      properties:
        trackId:
          type: string
          description: Spotify track ID or URL
          example: 3n3Ppam7vgaVa1iaRUc9Lp
      required:
        - trackId
    BatchAnalyzeTracksDto:
      type: object
      properties:
        trackIds:
          description: Array of Spotify track IDs
          example:
            - 3n3Ppam7vgaVa1iaRUc9Lp
            - 7qiZfU4dY1lWllzX7mPBI
          type: array
          items:
            type: string
      required:
        - trackIds
    TrackResponseDto:
      type: object
      properties:
        id:
          type: string
          description: Spotify track ID
          example: 3z8h0TU7ReDPLIbEnYhWZb
        name:
          type: string
          description: Track name
          example: Bohemian Rhapsody
        artists:
          type: string
          description: Comma-separated list of artist names
          example: Queen
        album:
          type: string
          description: Album name
          example: A Night At The Opera
        imageUrl:
          type: string
          description: Album cover art URL
          example: https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b
          nullable: true
      required:
        - id
        - name
        - artists
        - album
    ErrorResponseDto:
      type: object
      properties:
        statusCode:
          type: number
          description: HTTP status code
          example: 400
        message:
          type: object
          description: Error message describing what went wrong
          example: Could not resolve any of the provided tracks
        error:
          type: string
          description: Error type/category
          example: Bad Request
      required:
        - statusCode
        - message
        - error
    PlaylistSearchResultDto:
      type: object
      properties:
        id:
          type: string
          description: Spotify playlist ID
          example: 37i9dQZF1DWXRqgorJj26U
        name:
          type: string
          description: Playlist name
          example: Rock Classics
        description:
          type: string
          description: Playlist description
          example: Rock legends & epic songs that continue to inspire generations.
        owner:
          type: string
          description: Playlist owner display name
          example: Spotify
        tracksTotal:
          type: number
          description: Total number of tracks in the playlist
          example: 150
        imageUrl:
          type: string
          description: Playlist cover image URL
          example: https://i.scdn.co/image/ab67706f00000003...
          nullable: true
      required:
        - id
        - name
        - description
        - owner
        - tracksTotal
    PlaylistDetailResponseDto:
      type: object
      properties:
        id:
          type: string
          description: Spotify playlist ID
          example: 37i9dQZF1DWXRqgorJj26U
        name:
          type: string
          description: Playlist name
          example: Rock Classics
        description:
          type: string
          description: Playlist description
          example: Rock legends & epic songs
        imageUrl:
          type: string
          description: Playlist cover image URL
          example: https://i.scdn.co/image/ab67706f00000003...
          nullable: true
        tracks:
          description: Array of tracks in the playlist
          type: array
          items:
            $ref: '#/components/schemas/TrackResponseDto'
      required:
        - id
        - name
        - description
        - tracks
    TrackInput:
      type: object
      properties:
        id:
          type: string
          description: Spotify track ID (mutually exclusive with name)
          example: 3n3Ppam7vgaVa1iaRUc9Lp
        name:
          type: string
          description: Track name for search-based resolution (mutually exclusive with id)
          example: Bohemian Rhapsody
        artist:
          type: string
          description: Artist name to improve search accuracy (used with name)
          example: Queen
    RecommendationRequestDto:
      type: object
      properties:
        tracks:
          description: >-
            Array of 1-5 tracks to base recommendations on. Each track can be
            specified by ID, name (with optional artist), or a mix of both.
          minItems: 1
          maxItems: 5
          example:
            - id: 3n3Ppam7vgaVa1iaRUc9Lp
            - name: Stairway to Heaven
              artist: Led Zeppelin
          type: array
          items:
            $ref: '#/components/schemas/TrackInput'
        limit:
          type: number
          description: >-
            Number of recommendations to return (1-100). Defaults to 20 if not
            specified.
          minimum: 1
          maximum: 100
          default: 20
          example: 30
      required:
        - tracks
    TrackWithPreviewResponseDto:
      type: object
      properties:
        id:
          type: string
          description: Spotify track ID
          example: 3z8h0TU7ReDPLIbEnYhWZb
        name:
          type: string
          description: Track name
          example: Bohemian Rhapsody
        artists:
          type: string
          description: Comma-separated list of artist names
          example: Queen
        album:
          type: string
          description: Album name
          example: A Night At The Opera
        imageUrl:
          type: string
          description: Album cover art URL
          example: https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b
          nullable: true
        previewUrl:
          type: string
          description: 30-second preview URL (if available)
          example: https://p.scdn.co/mp3-preview/...
          nullable: true
      required:
        - id
        - name
        - artists
        - album
    LegacyRecommendationRequestDto:
      type: object
      properties:
        trackIds:
          description: >-
            Array of 1-5 Spotify track IDs to base recommendations on. Always
            returns 20 recommendations.
          minItems: 1
          maxItems: 5
          example:
            - 3n3Ppam7vgaVa1iaRUc9Lp
            - 5ChkMS8OtdzJeqyybCc9R5
            - 0c6xIDDpzE81m2q797ordA
          type: array
          items:
            type: string
      required:
        - trackIds
    BulkSongsRecommendationDto:
      type: object
      properties:
        giveSongs:
          description: >-
            Array of song objects. Each song can have an ID or name (with
            optional artist). Will use up to 5 songs as seeds.
          minItems: 1
          example:
            - id: 3n3Ppam7vgaVa1iaRUc9Lp
              name: Mr. Brightside
            - name: Somebody Told Me
              artist: The Killers
            - name: When You Were Young
              artist: The Killers
            - id: 0eGsygTp906u18L0Oimnem
          type: array
          items:
            $ref: '#/components/schemas/TrackInput'
        'n':
          type: number
          description: >-
            Number of recommendations to return (1-100). Defaults to number of
            input songs if not specified.
          minimum: 1
          maximum: 100
          example: 10
      required:
        - giveSongs
    RecommendationMode:
      type: number
      description: >-
        Recommendation mode:

        - 0 (Strict): Returns tracks from the same artists as the seed tracks

        - 1 (Balanced): Returns tracks from related artists in similar genres
        (uses Spotify API internally)

        - 2 (Diverse): Returns tracks with vague genre adherence for more
        variety (uses Spotify API internally)

        Defaults to Balanced (1) if not specified.
      enum:
        - 0
        - 1
        - 2
    DeezerRecommendationRequestDto:
      type: object
      properties:
        trackNames:
          description: >-
            Array of track names to base recommendations on. Can be simple track
            names or "Artist - Track" format for better accuracy.
          minItems: 1
          example:
            - Bohemian Rhapsody
            - Queen - We Will Rock You
            - Led Zeppelin - Stairway to Heaven
            - Hotel California
          type: array
          items:
            type: string
        'n':
          type: number
          description: >-
            Number of recommendations to return. Defaults to the number of input
            tracks if not specified.
          minimum: 1
          maximum: 100
          example: 10
        mode:
          example: 1
          $ref: '#/components/schemas/RecommendationMode'
      required:
        - trackNames
    DeezerArtistResponseDto:
      type: object
      properties:
        id:
          type: number
          description: Deezer artist ID
          example: 27
        name:
          type: string
          description: Artist name
          example: Daft Punk
        link:
          type: string
          description: Deezer artist page URL
          example: https://www.deezer.com/artist/27
        picture:
          type: string
          description: Primary artist image
          example: https://api.deezer.com/artist/27/image
        picture_small:
          type: string
          description: Small artist image
          example: >-
            https://e-cdns-images.dzcdn.net/images/artist/12345/56x56-000000-80-0-0.jpg
        picture_medium:
          type: string
          description: Medium artist image
          example: >-
            https://e-cdns-images.dzcdn.net/images/artist/12345/250x250-000000-80-0-0.jpg
        picture_big:
          type: string
          description: Large artist image
          example: >-
            https://e-cdns-images.dzcdn.net/images/artist/12345/500x500-000000-80-0-0.jpg
        picture_xl:
          type: string
          description: Extra large artist image
          example: >-
            https://e-cdns-images.dzcdn.net/images/artist/12345/1000x1000-000000-80-0-0.jpg
        tracklist:
          type: string
          description: Tracklist URL for artist top tracks
          example: https://api.deezer.com/artist/27/top?limit=50
        type:
          type: string
          description: Object type identifier
          example: artist
      required:
        - id
        - name
        - link
        - picture
        - picture_small
        - picture_medium
        - picture_big
        - picture_xl
        - tracklist
        - type
    DeezerAlbumResponseDto:
      type: object
      properties:
        id:
          type: number
          description: Deezer album ID
          example: 302127
        title:
          type: string
          description: Album title
          example: Discovery
        cover:
          type: string
          description: Primary album cover
          example: https://api.deezer.com/album/302127/image
        cover_small:
          type: string
          description: Small album cover
          example: >-
            https://e-cdns-images.dzcdn.net/images/cover/12345/56x56-000000-80-0-0.jpg
        cover_medium:
          type: string
          description: Medium album cover
          example: >-
            https://e-cdns-images.dzcdn.net/images/cover/12345/250x250-000000-80-0-0.jpg
        cover_big:
          type: string
          description: Large album cover
          example: >-
            https://e-cdns-images.dzcdn.net/images/cover/12345/500x500-000000-80-0-0.jpg
        cover_xl:
          type: string
          description: Extra large album cover
          example: >-
            https://e-cdns-images.dzcdn.net/images/cover/12345/1000x1000-000000-80-0-0.jpg
        md5_image:
          type: string
          description: MD5 hash for the cover image
          example: 1a2b3c4d5e6f7890abcdef1234567890
        tracklist:
          type: string
          description: Tracklist URL for the album
          example: https://api.deezer.com/album/302127/tracks
        type:
          type: string
          description: Object type identifier
          example: album
      required:
        - id
        - title
        - cover
        - cover_small
        - cover_medium
        - cover_big
        - cover_xl
        - md5_image
        - tracklist
        - type
    DeezerTrackResponseDto:
      type: object
      properties:
        id:
          type: number
          description: Deezer track ID
          example: 3135556
        readable:
          type: boolean
          description: Whether the track is available for playback
          example: true
        title:
          type: string
          description: Track title
          example: Harder, Better, Faster, Stronger
        title_short:
          type: string
          description: Short track title
          example: Harder Better Faster Stronger
        title_version:
          type: string
          description: Track version information
          example: ''
        link:
          type: string
          description: Deezer track URL
          example: https://www.deezer.com/track/3135556
        duration:
          type: number
          description: Track duration in seconds
          example: 224
        rank:
          type: number
          description: Track popularity ranking
          example: 654321
        explicit_lyrics:
          type: boolean
          description: Whether the track contains explicit lyrics
          example: false
        explicit_content_lyrics:
          type: number
          description: Explicit lyrics flag (numeric)
          example: 0
        explicit_content_cover:
          type: number
          description: Explicit cover flag (numeric)
          example: 0
        preview:
          type: string
          description: Preview URL (30 seconds)
          example: https://cdns-preview-d.dzcdn.net/stream/abcdefg
          nullable: true
        md5_image:
          type: string
          description: MD5 hash for the track image
          example: 1a2b3c4d5e6f7890abcdef1234567890
        artist:
          description: Track artist details
          allOf:
            - $ref: '#/components/schemas/DeezerArtistResponseDto'
        album:
          description: Track album details
          allOf:
            - $ref: '#/components/schemas/DeezerAlbumResponseDto'
        type:
          type: string
          description: Object type identifier
          example: track
      required:
        - id
        - readable
        - title
        - title_short
        - title_version
        - link
        - duration
        - rank
        - explicit_lyrics
        - explicit_content_lyrics
        - explicit_content_cover
        - md5_image
        - artist
        - album
        - type
externalDocs:
  description: Additional Documentation
  url: https://github.com/soulwax/darkfloor-api
```

### OpenAPI documentation for API V2

```yaml
openapi: 3.0.0
paths:
  /:
    get:
      operationId: AppController_getLandingPage
      parameters: []
      responses:
        "200":
          description: Renders a short overview page and links to documentation
          content:
            application/json:
              schema:
                type: string
      summary: Landing page with interactive route explorer
      tags: &a1
        - Root
  /routes:
    get:
      operationId: AppController_getRoutes
      parameters: []
      responses:
        "200":
          description: JSON object containing all available routes organized by module
      summary: Get all available API routes
      tags: *a1
  /health:
    get:
      operationId: AppController_getHealth
      parameters: []
      responses:
        "200":
          description: Returns health status including database connectivity
      summary: Health check endpoint with critical system status
      tags: *a1
  /api/spotify/search/tracks:
    get:
      operationId: SpotifyController_searchTracks
      parameters:
        - name: query
          required: true
          in: query
          description: Search query string
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of results to return (default 10)
          schema:
            type: number
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/TrackDto"
      summary: Search for tracks on Spotify
      tags: &a2
        - Spotify
  /api/spotify/recommendations:
    get:
      operationId: SpotifyController_getRecommendations
      parameters:
        - name: seed_tracks
          required: false
          in: query
          description: Comma-separated Spotify track IDs
          schema:
            example: 4iV5W9uYEdYUVa79Axb7Rh,0VjIjW4GlUZ9YafUnjvTv7
            type: string
        - name: seed_artists
          required: false
          in: query
          description: Comma-separated Spotify artist IDs
          schema:
            example: 4Z8W4fKeB5YxbusRsdQVPb
            type: string
        - name: seed_genres
          required: false
          in: query
          description: Comma-separated genre names
          schema:
            example: rock,pop,indie
            type: string
        - name: limit
          required: false
          in: query
          description: Number of recommendations (1-100)
          schema:
            default: 20
            type: number
        - name: market
          required: false
          in: query
          description: Market code (ISO 3166-1 alpha-2)
          schema:
            type: string
        - name: target_danceability
          required: false
          in: query
          description: Target danceability (0.0-1.0)
          schema:
            type: number
        - name: target_popularity
          required: false
          in: query
          description: Target popularity (0-100)
          schema:
            type: number
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RecommendationResponseDto"
      summary: Get Spotify recommendations using seeds
      tags: *a2
  /api/spotify/recommendations/from-search:
    post:
      operationId: SpotifyController_getRecommendationsFromSearch
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RecommendationsFromSearchRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RecommendationResponseDto"
      summary: Search for a track and get recommendations seeded from it
      tags: *a2
  /api/spotify/recommendations/spice-up:
    post:
      operationId: SpotifyController_spiceUpPlaylist
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SpiceUpRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SpiceUpResponseDto"
      summary: Generate recommendations to spice up a playlist
      tags: *a2
  /api/spotify/recommendations/spice-up/unified:
    post:
      operationId: SpotifyController_spiceUpPlaylistUnified
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UnifiedSpiceUpRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UnifiedSpiceUpResponseDto"
      summary: Generate recommendations using multiple platforms (Spotify, Last.fm,
        Deezer)
      tags: *a2
  /api/lastfm/track/info:
    get:
      operationId: LastfmController_getTrackInfo
      parameters:
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
        - name: track
          required: true
          in: query
          description: Track name
          schema:
            type: string
        - name: mbid
          required: false
          in: query
          description: MusicBrainz ID
          schema:
            type: string
      responses:
        "200":
          description: Track information object
      summary: Get detailed information for a track
      tags: &a3
        - Last.fm
  /api/lastfm/artist/info:
    get:
      operationId: LastfmController_getArtistInfo
      parameters:
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
        - name: mbid
          required: false
          in: query
          description: MusicBrainz ID
          schema:
            type: string
      responses:
        "200":
          description: Artist information object
      summary: Get detailed information for an artist
      tags: *a3
  /api/lastfm/track/search:
    get:
      operationId: LastfmController_searchTracks
      parameters:
        - name: query
          required: true
          in: query
          description: Search query
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of results per page
          schema:
            type: number
        - name: page
          required: false
          in: query
          description: Page number
          schema:
            type: number
      responses:
        "200":
          description: Last.fm search result object
      summary: Search for tracks on Last.fm
      tags: *a3
  /api/lastfm/artist/search:
    get:
      operationId: LastfmController_searchArtists
      parameters:
        - name: query
          required: true
          in: query
          description: Search query
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of results per page
          schema:
            type: number
        - name: page
          required: false
          in: query
          description: Page number
          schema:
            type: number
      responses:
        "200":
          description: Last.fm search result object
      summary: Search for artists on Last.fm
      tags: *a3
  /api/lastfm/artist/top-tracks:
    get:
      operationId: LastfmController_getArtistTopTracks
      parameters:
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of tracks to return
          schema:
            type: number
        - name: page
          required: false
          in: query
          description: Page number
          schema:
            type: number
      responses:
        "200":
          description: Top tracks response from Last.fm
      summary: Get top tracks for an artist
      tags: *a3
  /api/lastfm/track/similar:
    get:
      operationId: LastfmController_getSimilarTracks
      parameters:
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
        - name: track
          required: true
          in: query
          description: Track name
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of similar tracks to return
          schema:
            type: number
      responses:
        "200":
          description: Similar tracks response from Last.fm
      summary: Get similar tracks for a given track
      tags: *a3
  /api/lastfm/recommendations/spice-up:
    post:
      operationId: LastfmController_spiceUpPlaylist
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LastfmSpiceUpRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LastfmSpiceUpResponseDto"
      summary: Generate recommendations using Last.fm similarity data
      tags: *a3
  /api/lastfm/recommendations/spice-up-with-deezer:
    post:
      operationId: LastfmController_spiceUpPlaylistWithDeezer
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LastfmSpiceUpWithDeezerRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LastfmSpiceUpWithDeezerResponseDto"
      summary: Generate Last.fm recommendations and convert them to Deezer track IDs
      tags: *a3
  /api/deezer/search/tracks:
    get:
      operationId: DeezerController_searchTracks
      parameters:
        - name: query
          required: true
          in: query
          description: Search query string
          schema:
            type: string
        - name: limit
          required: false
          in: query
          description: Number of results to return (max 25)
          schema:
            type: number
      responses:
        "200":
          description: Raw response from Deezer search API
      summary: Search for tracks on Deezer
      tags: &a4
        - Deezer
  /api/deezer/track/find-id:
    get:
      operationId: DeezerController_findTrackId
      parameters:
        - name: name
          required: true
          in: query
          description: Track title
          schema:
            type: string
        - name: artist
          required: false
          in: query
          description: Artist name to improve accuracy
          schema:
            type: string
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/FindTrackIdResponseDto"
      summary: Find a Deezer track ID by name and artist
      tags: *a4
  /api/deezer/tracks/convert:
    post:
      operationId: DeezerController_convertTracksToDeezerIds
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ConvertToDeezerRequestDto"
      responses:
        "200":
          description: ""
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ConvertToDeezerResponseDto"
      summary: Convert an array of tracks to Deezer track IDs
      tags: *a4
  /api/deezer/artist/{artistName}/tracks:
    get:
      operationId: DeezerController_getArtistTracks
      parameters:
        - name: artistName
          required: true
          in: path
          description: Artist name (URL-encoded)
          schema:
            example: Radiohead
            type: string
        - name: limit
          required: false
          in: query
          description: "Maximum number of tracks to return (default: 100)"
          schema:
            type: number
      responses:
        "200":
          description: Array of detailed track objects sorted by popularity
        "400":
          description: Artist not found or invalid request
      summary: Get all tracks from an artist sorted by popularity
      tags: *a4
  /api/deezer/album/{albumName}/tracks:
    get:
      operationId: DeezerController_getAlbumTracks
      parameters:
        - name: albumName
          required: true
          in: path
          description: Album name (URL-encoded)
          schema:
            example: OK Computer
            type: string
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
      responses:
        "200":
          description: Array of detailed track objects in track order
        "400":
          description: Album not found or invalid request
      summary: Get all tracks from an album in track order
      tags: *a4
  /api/track/preview:
    post:
      description: Accepts a track ID (number), search query (string), or track
        object. Returns a 1200x600px PNG image with album cover and track
        details in darkfloor theme.
      operationId: PreviewController_generatePreview
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PreviewRequestDto"
      responses:
        "200":
          description: PNG image buffer
          content:
            image/png:
              schema:
                type: string
                format: binary
        "400":
          description: Error generating preview - returns JSON error instead of image
      summary: Generate a social media preview image for a track
      tags: &a5
        - Preview Images
  /api/track/{id}/preview:
    get:
      operationId: PreviewController_generatePreviewFromId
      parameters:
        - name: id
          required: true
          in: path
          description: Track ID or Deezer track URL/URI
          schema:
            type: string
      responses:
        "200":
          description: PNG image buffer
          content:
            image/png:
              schema:
                type: string
                format: binary
      summary: Generate preview image from track ID (GET endpoint)
      tags: *a5
  /api/preview/test:
    get:
      description: Diagnostic endpoint to verify canvas library is working. Returns a
        simple colored test image.
      operationId: PreviewController_testCanvas
      parameters: []
      responses:
        "200":
          description: PNG test image
          content:
            image/png:
              schema:
                type: string
                format: binary
      summary: Test canvas library - generates a simple test image
      tags: *a5
  /api/preview/default:
    get:
      description: Returns a 1200x600px PNG image with Emily the Strange logo centered
        (slightly to the north) and "darkfloor.art - lossless music" text
        underneath. Uses the same ethereal dark background as track previews.
      operationId: PreviewController_generateDefaultPreview
      parameters: []
      responses:
        "200":
          description: PNG image buffer
          content:
            image/png:
              schema:
                type: string
                format: binary
      summary: Generate default darkfloor.art preview image
      tags: *a5
  /api/preview:
    get:
      description: >-
        GET endpoint that accepts a query parameter for easier OG generation.
        Extracts the search query from ?q= parameter and generates a track
        preview image. Falls back to default image if query is missing or track
        not found.


        **Important:** The query parameter must be properly URL-encoded. Use
        `encodeURIComponent()` on the client side. Examples:

        - ✅ Works: `?q=isobel%20bj%C3%B6rk` (properly encoded)

        - ✅ Works: Use `--data-urlencode` with curl

        - ❌ Fails: `?q=isobel+björk` (unencoded special characters are rejected
        by NestJS before reaching this handler)
      operationId: PreviewController_generatePreviewFromQuery
      parameters:
        - name: q
          required: false
          in: query
          description: Search query (e.g., "artist song")
          allowEmptyValue: true
          schema:
            type: string
      responses:
        "200":
          description: PNG image buffer
          content:
            image/png:
              schema:
                type: string
                format: binary
      summary: Generate preview image from query parameter (for OG/meta tags)
      tags: *a5
  /music/stream:
    get:
      operationId: MusicStreamingController_streamMusic
      parameters:
        - name: key
          required: true
          in: query
          schema:
            type: string
        - name: id
          required: false
          in: query
          schema:
            type: string
        - name: q
          required: false
          in: query
          schema:
            type: string
        - name: link
          required: false
          in: query
          schema:
            type: boolean
        - name: file
          required: false
          in: query
          schema:
            type: boolean
        - name: kbps
          required: false
          in: query
          schema:
            type: number
        - name: offset
          required: false
          in: query
          schema:
            type: number
      responses:
        "200":
          description: Stream begins or link provided.
        "400":
          description: Invalid request parameters.
        "401":
          description: Invalid or missing API key.
        "404":
          description: No results found.
        "500":
          description: Server error during streaming or download.
      summary: Stream music
      tags: &a6
        - music
  /music/stream/direct:
    get:
      description: Streams music directly from Deezer without filesystem operations.
        Ideal for Vercel and other serverless platforms. Supports HTTP range
        requests for seeking.
      operationId: MusicStreamingController_streamMusicDirect
      parameters:
        - name: key
          required: true
          in: query
          schema:
            type: string
        - name: id
          required: false
          in: query
          schema:
            type: string
        - name: q
          required: false
          in: query
          schema:
            type: string
        - name: kbps
          required: false
          in: query
          schema:
            type: number
        - name: offset
          required: false
          in: query
          schema:
            type: number
      responses:
        "200":
          description: Audio stream begins
          content:
            audio/mpeg:
              schema:
                type: string
                format: binary
        "400":
          description: Invalid request parameters
        "401":
          description: Unauthorized - invalid API key
        "500":
          description: Server error during streaming
      summary: Stream music directly from source (serverless-friendly)
      tags: *a6
  /music/health:
    get:
      operationId: MusicStreamingController_healthCheck
      parameters: []
      responses:
        "200":
          description: Service is healthy
      summary: Health check endpoint
      tags: *a6
  /music/search:
    get:
      operationId: MusicStreamingController_searchMusic
      parameters:
        - name: q
          required: true
          in: query
          schema:
            type: string
        - name: offset
          required: false
          in: query
          description: "Result offset for pagination (default: 0)"
          schema:
            type: number
      responses:
        "200":
          description: Search results from Deezer.
        "500":
          description: Error during the search operation.
      summary: Search music on Deezer
      tags: *a6
  /music/cleanup:
    get:
      operationId: MusicStreamingController_cleanupDownloadFolder
      parameters: []
      responses:
        "200":
          description: Cleanup successful.
        "500":
          description: Error during the cleanup operation.
      summary: Clean up download folder
      tags: *a6
  /music/tracks/batch:
    get:
      operationId: MusicStreamingController_getBatchTrackMetadata
      parameters:
        - name: ids
          required: true
          in: query
          description: Comma-separated Deezer track IDs
          schema:
            type: string
      responses:
        "200":
          description: Array of track metadata
        "400":
          description: Invalid track IDs
      summary: Get metadata for multiple tracks
      tags: *a6
  /music/search/advanced:
    get:
      operationId: MusicStreamingController_advancedSearch
      parameters:
        - name: q
          required: true
          in: query
          description: Search query
          schema:
            type: string
        - name: artist
          required: false
          in: query
          description: Filter by artist
          schema:
            type: string
        - name: album
          required: false
          in: query
          description: Filter by album
          schema:
            type: string
        - name: durationMin
          required: false
          in: query
          description: Minimum duration in seconds
          schema:
            type: number
        - name: durationMax
          required: false
          in: query
          description: Maximum duration in seconds
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: Pagination offset
          schema:
            type: number
        - name: limit
          required: false
          in: query
          description: Results limit
          schema:
            type: number
      responses:
        "200":
          description: Filtered search results
      summary: Advanced search with filters
      tags: *a6
  /music/stream-static:
    get:
      operationId: MusicStreamingController_streamStaticMusic
      parameters:
        - name: id
          required: true
          in: query
          schema:
            type: number
        - name: range
          required: false
          in: query
          description: Percentage range of the song to stream, e.g., "0-20" or "20-40".
          schema:
            type: string
      responses:
        "200":
          description: Streaming of the music file started.
        "400":
          description: Invalid ID or ID out of range.
        "500":
          description: Error during streaming.
      summary: Stream static music file
      tags: *a6
  /music/artist/{artistName}:
    get:
      operationId: MusicStreamingController_getArtistSongs
      parameters:
        - name: artistName
          required: true
          in: path
          description: Artist name (URL-encoded)
          schema:
            example: Radiohead
            type: string
        - name: limit
          required: false
          in: query
          description: "Maximum number of tracks to return (default: 100)"
          schema:
            type: number
      responses:
        "200":
          description: Array of detailed track objects sorted by popularity (rank)
        "400":
          description: Artist not found or invalid request
      summary: Get all songs from a particular artist sorted by popularity
      tags: *a6
  /music/album/{albumName}:
    get:
      operationId: MusicStreamingController_getAlbumSongs
      parameters:
        - name: albumName
          required: true
          in: path
          description: Album name (URL-encoded)
          schema:
            example: OK Computer
            type: string
        - name: artist
          required: true
          in: query
          description: Artist name
          schema:
            type: string
      responses:
        "200":
          description: Array of detailed track objects in track order (by track_position)
        "400":
          description: Album not found or invalid request
      summary: Get all songs from an album in track order
      tags: *a6
  /music/favorites/{trackId}:
    post:
      operationId: FavoritesController_addFavorite
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        "201":
          description: Track added to favorites
        "401":
          description: Unauthorized
        "404":
          description: Track not found
        "409":
          description: Track already in favorites
      security: &a7
        - bearer: []
      summary: Add a track to favorites
      tags: &a8
        - favorites
    delete:
      operationId: FavoritesController_removeFavorite
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        "204":
          description: Track removed from favorites
        "401":
          description: Unauthorized
        "404":
          description: Favorite not found
      security: *a7
      summary: Remove a track from favorites
      tags: *a8
  /music/favorites:
    get:
      operationId: FavoritesController_getFavorites
      parameters:
        - name: limit
          required: false
          in: query
          description: "Limit results (default: 50)"
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: "Offset for pagination (default: 0)"
          schema:
            type: number
      responses:
        "200":
          description: List of favorite tracks
        "401":
          description: Unauthorized
      security: *a7
      summary: Get all favorite tracks
      tags: *a8
  /music/favorites/check/{trackId}:
    get:
      operationId: FavoritesController_checkFavorite
      parameters:
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        "200":
          description: "Returns { isFavorite: boolean }"
        "401":
          description: Unauthorized
      security: *a7
      summary: Check if a track is in favorites
      tags: *a8
  /music/favorites/count:
    get:
      operationId: FavoritesController_getFavoriteCount
      parameters: []
      responses:
        "200":
          description: "Returns { count: number }"
        "401":
          description: Unauthorized
      security: *a7
      summary: Get total count of favorite tracks
      tags: *a8
  /music/favorites/batch-check:
    post:
      operationId: FavoritesController_batchCheckFavorites
      parameters:
        - name: trackIds
          required: true
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Returns object with track IDs as keys and boolean values
        "401":
          description: Unauthorized
      security: *a7
      summary: Batch check if tracks are favorited
      tags: *a8
  /music/history:
    get:
      operationId: ListeningHistoryController_getHistory
      parameters:
        - name: limit
          required: false
          in: query
          description: "Limit results (default: 50)"
          schema:
            type: number
        - name: offset
          required: false
          in: query
          description: "Offset for pagination (default: 0)"
          schema:
            type: number
      responses:
        "200":
          description: Listening history
        "401":
          description: Unauthorized
      security: &a9
        - bearer: []
      summary: Get listening history
      tags: &a10
        - listening-history
    delete:
      operationId: ListeningHistoryController_clearHistory
      parameters: []
      responses:
        "204":
          description: Listening history cleared
        "401":
          description: Unauthorized
      security: *a9
      summary: Clear listening history
      tags: *a10
  /music/history/recent:
    get:
      operationId: ListeningHistoryController_getRecentlyPlayed
      parameters:
        - name: limit
          required: false
          in: query
          description: "Limit results (default: 20)"
          schema:
            type: number
      responses:
        "200":
          description: Recently played tracks
        "401":
          description: Unauthorized
      security: *a9
      summary: Get recently played tracks (unique)
      tags: *a10
  /music/history/stats:
    get:
      operationId: ListeningHistoryController_getStats
      parameters:
        - name: days
          required: false
          in: query
          description: "Number of days to include in stats (default: 30)"
          schema:
            type: number
      responses:
        "200":
          description: Listening statistics
        "401":
          description: Unauthorized
      security: *a9
      summary: Get listening statistics
      tags: *a10
  /music/playlists:
    post:
      operationId: PlaylistController_createPlaylist
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreatePlaylistDto"
      responses:
        "201":
          description: Playlist created successfully
        "401":
          description: Unauthorized
      security: &a11
        - bearer: []
      summary: Create a new playlist
      tags: &a12
        - playlists
    get:
      operationId: PlaylistController_getUserPlaylists
      parameters: []
      responses:
        "200":
          description: List of playlists
        "401":
          description: Unauthorized
      security: *a11
      summary: Get all playlists for the authenticated user
      tags: *a12
  /music/playlists/{playlistId}:
    get:
      operationId: PlaylistController_getPlaylist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      responses:
        "200":
          description: Playlist details
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - playlist is private
        "404":
          description: Playlist not found
      security: *a11
      summary: Get a specific playlist by ID
      tags: *a12
    put:
      operationId: PlaylistController_updatePlaylist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdatePlaylistDto"
      responses:
        "200":
          description: Playlist updated successfully
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - not playlist owner
        "404":
          description: Playlist not found
      security: *a11
      summary: Update a playlist
      tags: *a12
    delete:
      operationId: PlaylistController_deletePlaylist
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      responses:
        "204":
          description: Playlist deleted successfully
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - not playlist owner
        "404":
          description: Playlist not found
      security: *a11
      summary: Delete a playlist
      tags: *a12
  /music/playlists/{playlistId}/tracks:
    post:
      operationId: PlaylistController_addTrack
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AddToPlaylistDto"
      responses:
        "201":
          description: Track added to playlist
        "400":
          description: Track already in playlist
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - not playlist owner
        "404":
          description: Playlist or track not found
      security: *a11
      summary: Add a track to a playlist
      tags: *a12
  /music/playlists/{playlistId}/tracks/{trackId}:
    delete:
      operationId: PlaylistController_removeTrack
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
        - name: trackId
          required: true
          in: path
          description: Deezer track ID
          schema:
            type: string
      responses:
        "200":
          description: Track removed from playlist
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - not playlist owner
        "404":
          description: Playlist or track not found
      security: *a11
      summary: Remove a track from a playlist
      tags: *a12
  /music/playlists/{playlistId}/tracks/reorder:
    put:
      operationId: PlaylistController_reorderTrack
      parameters:
        - name: playlistId
          required: true
          in: path
          description: Playlist ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ReorderPlaylistDto"
      responses:
        "200":
          description: Track reordered successfully
        "400":
          description: Invalid position
        "401":
          description: Unauthorized
        "403":
          description: Forbidden - not playlist owner
        "404":
          description: Playlist or track not found
      security: *a11
      summary: Reorder a track in a playlist
      tags: *a12
  /music/convert/playlist:
    post:
      description: Takes an array of song names and converts them to either Spotify or
        Deezer format. Returns full track data from the target platform for each
        song.
      operationId: PlaylistConversionController_convertPlaylist
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PlaylistConversionRequestDto"
      responses:
        "200":
          description: Conversion results with full track data from target platform
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PlaylistConversionResponseDto"
        "400":
          description: Invalid request
      summary: Convert playlist songs between Spotify and Deezer
      tags:
        - playlist-conversion
  /api/health:
    get:
      description: Returns detailed information about the server status, including
        database connectivity, external services configuration, memory usage,
        and system information.
      operationId: HealthController_getHealth
      parameters: []
      responses:
        "200":
          description: Health check information
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum:
                      - ok
                      - degraded
                      - unhealthy
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                  environment:
                    type: object
                  uptime:
                    type: object
                  memory:
                    type: object
                  services:
                    type: object
                  config:
                    type: object
      summary: Comprehensive health check endpoint
      tags:
        - Health
info:
  title: Darkfloor.one API
  description: Aggregated music intelligence from Spotify, Last.fm, and Deezer
    with unified authentication, caching, and playlist workflows.
  version: 1.0.0
  contact: {}
tags: []
servers:
  - url: https://darkfloor.one
    description: Production (HTTPS)
  - url: http://localhost:3333
    description: Local development
components:
  schemas:
    TrackArtistDto:
      type: object
      properties:
        name:
          type: string
          description: Artist name
        id:
          type: string
          description: Spotify artist ID
      required:
        - name
        - id
    TrackAlbumDto:
      type: object
      properties:
        name:
          type: string
          description: Album name
      required:
        - name
    TrackExternalUrlsDto:
      type: object
      properties:
        spotify:
          type: string
          description: Spotify URL for the track
      required:
        - spotify
    TrackDto:
      type: object
      properties:
        id:
          type: string
          description: Spotify track ID
        name:
          type: string
          description: Track title
        artists:
          description: List of track artists
          type: array
          items:
            $ref: "#/components/schemas/TrackArtistDto"
        album:
          description: Album information
          allOf:
            - $ref: "#/components/schemas/TrackAlbumDto"
        popularity:
          type: number
          description: Popularity score (0-100)
        preview_url:
          type: object
          description: 30 second preview MP3 URL
        external_urls:
          description: External URLs for the track
          allOf:
            - $ref: "#/components/schemas/TrackExternalUrlsDto"
      required:
        - id
        - name
        - artists
        - album
        - popularity
        - external_urls
    RecommendationSeedDto:
      type: object
      properties:
        id:
          type: string
          description: Seed identifier
        type:
          type: string
          description: Seed type (track, artist, genre)
        initialPoolSize:
          type: number
          description: Initial pool size used by Spotify
      required:
        - id
        - type
        - initialPoolSize
    RecommendationResponseDto:
      type: object
      properties:
        seeds:
          description: Seed details provided by Spotify
          type: array
          items:
            $ref: "#/components/schemas/RecommendationSeedDto"
        tracks:
          description: Recommended tracks
          type: array
          items:
            $ref: "#/components/schemas/TrackDto"
      required:
        - seeds
        - tracks
    RecommendationsFromSearchRequestDto:
      type: object
      properties:
        query:
          type: string
          description: Search query used to find a seed track
        limit:
          type: number
          description: Number of recommendations to return (1-100)
          default: 20
      required:
        - query
    SongInputDto:
      type: object
      properties:
        name:
          type: string
          description: Song title to use for seed search
        artist:
          type: string
          description: Artist name to use for seed search
        album:
          type: string
          description: Album name to use for seed search
    SpiceUpRequestDto:
      type: object
      properties:
        songs:
          minItems: 1
          description: Songs used to generate seed information
          type: array
          items:
            $ref: "#/components/schemas/SongInputDto"
        limit:
          type: number
          description: Number of recommendations to return (1-100)
          default: 20
        mode:
          type: string
          description: Diversity mode. strict -> most similar, balanced -> moderate
            variety, diverse -> maximum variety, wild -> experimental
            combinations
          enum: &a13
            - strict
            - balanced
            - diverse
            - wild
          default: balanced
      required:
        - songs
    SpiceUpSeedDto:
      type: object
      properties:
        id:
          type: string
          description: Seed identifier used by Spotify
        type:
          type: string
          description: Seed type (track, artist, genre)
        initialPoolSize:
          type: number
          description: Initial pool size for the seed
      required:
        - id
        - type
        - initialPoolSize
    SpiceUpSongResultDto:
      type: object
      properties:
        input:
          description: Original song input
          allOf:
            - $ref: "#/components/schemas/SongInputDto"
        track:
          description: Found track information
          allOf:
            - $ref: "#/components/schemas/TrackDto"
        confidence:
          type: number
          description: Search confidence score (0-1)
        searchMethod:
          type: string
          description: Search method used
        error:
          type: string
          description: Error message if search failed
      required:
        - input
        - confidence
        - searchMethod
    SeedQualityMetricsDto:
      type: object
      properties:
        overallScore:
          type: number
          description: Overall seed quality score (0-1)
        uniqueArtists:
          type: number
          description: Number of unique artists in seeds
        popularityRange:
          type: object
          description: Popularity range of seed tracks
        diversityScore:
          type: number
          description: Audio feature diversity score
        recommendations:
          description: Recommendations for improving seed quality
          type: array
          items:
            type: string
      required:
        - overallScore
        - uniqueArtists
        - popularityRange
        - diversityScore
    SpiceUpResponseDto:
      type: object
      properties:
        mode:
          type: string
          description: Diversity mode applied
        inputSongs:
          type: number
          description: Number of input songs provided
        foundSongs:
          type: number
          description: Number of songs successfully found
        recommendations:
          description: Recommended Spotify tracks
          type: array
          items:
            $ref: "#/components/schemas/TrackDto"
        seeds:
          description: Seed data returned by Spotify
          type: array
          items:
            $ref: "#/components/schemas/SpiceUpSeedDto"
        songResults:
          description: Detailed results for each input song
          type: array
          items:
            $ref: "#/components/schemas/SpiceUpSongResultDto"
        seedQuality:
          description: Seed quality analysis
          allOf:
            - $ref: "#/components/schemas/SeedQualityMetricsDto"
        warnings:
          description: Warning messages for partial failures
          type: array
          items:
            type: string
      required:
        - mode
        - inputSongs
        - foundSongs
        - recommendations
        - seeds
        - songResults
    UnifiedSpiceUpRequestDto:
      type: object
      properties:
        songs:
          minItems: 1
          description: Songs used to generate seed information
          type: array
          items:
            $ref: "#/components/schemas/SongInputDto"
        limit:
          type: number
          description: Number of recommendations to return (1-100)
          default: 20
        mode:
          type: string
          description: Diversity mode. strict -> most similar, balanced -> moderate
            variety, diverse -> maximum variety, wild -> experimental
            combinations
          enum: *a13
          default: balanced
        platforms:
          type: string
          description: Platforms to use for recommendations
          enum:
            - spotify
            - lastfm
            - deezer
            - auto
          default: auto
      required:
        - songs
    UnifiedSpiceUpResponseDto:
      type: object
      properties:
        mode:
          type: string
          description: Diversity mode applied
        inputSongs:
          type: number
          description: Number of input songs provided
        foundSongs:
          type: number
          description: Number of songs successfully found
        recommendations:
          description: Recommended Spotify tracks
          type: array
          items:
            $ref: "#/components/schemas/TrackDto"
        seeds:
          description: Seed data returned by Spotify
          type: array
          items:
            $ref: "#/components/schemas/SpiceUpSeedDto"
        songResults:
          description: Detailed results for each input song
          type: array
          items:
            $ref: "#/components/schemas/SpiceUpSongResultDto"
        seedQuality:
          description: Seed quality analysis
          allOf:
            - $ref: "#/components/schemas/SeedQualityMetricsDto"
        warnings:
          description: Warning messages for partial failures
          type: array
          items:
            type: string
        platformsUsed:
          description: Platforms used for generating recommendations
          type: array
          items:
            type: string
        platformResults:
          type: object
          description: Platform-specific results
      required:
        - mode
        - inputSongs
        - foundSongs
        - recommendations
        - seeds
        - songResults
        - platformsUsed
    LastfmSongInputDto:
      type: object
      properties:
        name:
          type: string
          description: Song title to use for Last.fm search
        artist:
          type: string
          description: Artist name to use for Last.fm search
        album:
          type: string
          description: Album name to use for Last.fm search
    LastfmSpiceUpRequestDto:
      type: object
      properties:
        songs:
          minItems: 1
          description: Songs used as seeds for Last.fm search
          type: array
          items:
            $ref: "#/components/schemas/LastfmSongInputDto"
        limit:
          type: number
          description: Number of recommended tracks to return (1-100)
          default: 20
        mode:
          type: string
          description: Diversity mode for recommendation variety
          enum: &a14
            - strict
            - normal
            - diverse
          default: normal
      required:
        - songs
    LastfmRecommendationDto:
      type: object
      properties:
        name:
          type: string
          description: Track name
        artist:
          type: string
          description: Artist name
        url:
          type: string
          description: Last.fm track URL
        match:
          type: number
          description: Match score provided by Last.fm
        mbid:
          type: string
          description: MusicBrainz ID if available
      required:
        - name
        - artist
        - url
    LastfmSpiceUpResponseDto:
      type: object
      properties:
        mode:
          type: string
          description: Diversity mode applied
        inputSongs:
          type: number
          description: Number of input songs provided
        recommendations:
          description: Recommended Last.fm tracks
          type: array
          items:
            $ref: "#/components/schemas/LastfmRecommendationDto"
        foundSongs:
          type: number
          description: Number of input songs successfully matched on Last.fm
      required:
        - mode
        - inputSongs
        - recommendations
        - foundSongs
    LastfmSpiceUpWithDeezerRequestDto:
      type: object
      properties:
        songs:
          minItems: 1
          description: Songs used as seeds for Last.fm search
          type: array
          items:
            $ref: "#/components/schemas/LastfmSongInputDto"
        limit:
          type: number
          description: Number of recommended tracks to return (1-100)
          default: 20
        mode:
          type: string
          description: Diversity mode for recommendation variety
          enum: *a14
          default: normal
        convertToDeezer:
          type: boolean
          description: Convert Last.fm recommendations to Deezer track IDs
          default: true
      required:
        - songs
    LastfmSpiceUpWithDeezerResponseRecommendationDto:
      type: object
      properties:
        name:
          type: string
          description: Track name
        artist:
          type: string
          description: Artist name
        url:
          type: string
          description: Last.fm track URL
        match:
          type: number
          description: Match score provided by Last.fm
        mbid:
          type: string
          description: MusicBrainz ID if available
        deezerId:
          type: object
          description: Deezer track ID if conversion succeeded
      required:
        - name
        - artist
        - url
    LastfmSpiceUpWithDeezerResponseDto:
      type: object
      properties:
        mode:
          type: string
          description: Diversity mode applied
        inputSongs:
          type: number
          description: Number of input songs provided
        foundSongs:
          type: number
          description: Number of input songs successfully matched on Last.fm
        recommendations:
          description: Recommended tracks with optional Deezer IDs
          type: array
          items:
            $ref: "#/components/schemas/LastfmSpiceUpWithDeezerResponseRecommendationDto"
        deezerConversion:
          type: object
          description: Summary of Deezer ID conversions
          example:
            converted: 18
            total: 20
      required:
        - mode
        - inputSongs
        - foundSongs
        - recommendations
    FindTrackIdResponseDto:
      type: object
      properties:
        name:
          type: string
          description: Original track title
        artist:
          type: string
          description: Original artist name
        deezerId:
          type: object
          description: Matched Deezer track ID
      required:
        - name
    TrackToConvertDto:
      type: object
      properties:
        name:
          type: string
          description: Track title to search on Deezer
        artist:
          type: string
          description: Artist name to improve Deezer search accuracy
      required:
        - name
    ConvertToDeezerRequestDto:
      type: object
      properties:
        tracks:
          minItems: 1
          description: Tracks to convert to Deezer IDs
          type: array
          items:
            $ref: "#/components/schemas/TrackToConvertDto"
      required:
        - tracks
    ConvertedTrackResultDto:
      type: object
      properties:
        name:
          type: string
          description: Original track title
        artist:
          type: string
          description: Original artist name
        deezerId:
          type: object
          description: Matched Deezer track ID
      required:
        - name
    ConvertToDeezerResponseDto:
      type: object
      properties:
        converted:
          type: number
          description: Number of tracks successfully converted
        total:
          type: number
          description: Total number of tracks processed
        tracks:
          description: Conversion results per track
          type: array
          items:
            $ref: "#/components/schemas/ConvertedTrackResultDto"
      required:
        - converted
        - total
        - tracks
    PreviewRequestDto:
      type: object
      properties:
        id:
          type: number
          description: Deezer track ID (number)
        query:
          type: string
          description: Search query string (will use first result)
        track:
          type: object
          description: Deezer track object (full track data)
    CreatePlaylistDto:
      type: object
      properties:
        name:
          type: string
          description: Playlist name
          example: My Chill Vibes
          maxLength: 100
        description:
          type: string
          description: Playlist description
          example: Perfect music for relaxing evenings
          maxLength: 500
        isPublic:
          type: boolean
          description: Whether the playlist is public
          example: true
          default: true
        coverImage:
          type: string
          description: Cover image URL
          example: https://example.com/cover.jpg
      required:
        - name
    UpdatePlaylistDto:
      type: object
      properties:
        name:
          type: string
          description: Playlist name
          example: My Updated Playlist
          maxLength: 100
        description:
          type: string
          description: Playlist description
          example: Updated description
          maxLength: 500
        isPublic:
          type: boolean
          description: Whether the playlist is public
          example: false
        coverImage:
          type: string
          description: Cover image URL
          example: https://example.com/new-cover.jpg
    AddToPlaylistDto:
      type: object
      properties:
        deezerTrackId:
          type: string
          description: Deezer track ID to add
          example: "3135556"
        position:
          type: number
          description: Position in playlist (optional, defaults to end)
          example: 5
      required:
        - deezerTrackId
    ReorderPlaylistDto:
      type: object
      properties:
        trackId:
          type: string
          description: Track ID to move
          example: 123e4567-e89b-12d3-a456-426614174000
        newPosition:
          type: number
          description: New position (0-based index)
          example: 3
      required:
        - trackId
        - newPosition
    PlaylistConversionRequestDto:
      type: object
      properties:
        songs:
          description: Array of songs to convert
          example:
            - name: Creep
              artist: Radiohead
            - name: Bohemian Rhapsody
              artist: Queen
          type: array
          items:
            $ref: "#/components/schemas/SongInputDto"
        output:
          type: string
          enum:
            - deezer
            - spotify
          description: Target platform for conversion
          example: deezer
      required:
        - songs
        - output
    PlaylistConversionResponseDto:
      type: object
      properties:
        output:
          type: string
          description: Target platform
        inputCount:
          type: number
          description: Number of input songs
        convertedCount:
          type: number
          description: Number of successfully converted songs
        results:
          description: Array of conversion results, one per input song
          type: array
          items:
            type: string
      required:
        - output
        - inputCount
        - convertedCount
        - results

```
