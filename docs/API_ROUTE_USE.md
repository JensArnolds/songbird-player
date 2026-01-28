# API Route Usage Documentation

This document summarizes the two backend APIs used by Starchild Music and their respective endpoints.

## Table of Contents

- [Primary Music API (`NEXT_PUBLIC_API_URL`)](#primary-music-api-next_public_api_url)
- [Songbird Recommendations API (`SONGBIRD_PUBLIC_API_URL`)](#songbird-recommendations-api-songbird_public_api_url)
- [Environment Variables](#environment-variables)
- [Fallback Strategy](#fallback-strategy)

---

## Primary Music API (`NEXT_PUBLIC_API_URL`)

**Purpose:** Main music backend for Deezer proxy, streaming, and track/album/artist metadata
**Required:** Yes
**Fallback:** Deezer API (<https://api.deezer.com>) for track/album/artist endpoints
**Authentication:** Uses `STREAMING_KEY` environment variable
**Note:** `/api/music/search` and `/api/stream` now go through V2; V1 remains for track metadata fallback and legacy endpoints.

### API Routes

Below is a quick overview of the **frontend API routes** under `src/app/api` and how they proxy to the underlying backends.

| Route | Category | Purpose | Backend / Target |
|-------|----------|---------|------------------|
| **Search & Discovery** ||||
| `/api/music/search` | Search | Search tracks, albums, artists | `GET {NEXT_PUBLIC_V2_API_URL}/music/search?key={SONGBIRD_API_KEY}&kbps=320&q={query}[&offset]` (V2 only) |
| **Streaming** ||||
| `/api/stream` | Streaming | Get audio stream URL for playback (supports `Range`) | `GET {NEXT_PUBLIC_V2_API_URL}/music/stream?key={SONGBIRD_API_KEY}&kbps={kbps}&(id|q)` (V2 only, no Deezer fallback) |
| **Track Operations** ||||
| `/api/track/[id]` | Track metadata | Fetch track metadata by Deezer ID with smart fallbacks | `GET {NEXT_PUBLIC_V2_API_URL}/music/tracks/batch?ids={id}` (V2, `X-API-Key`) → `GET {NEXT_PUBLIC_API_URL}/music/track/{id}?key={STREAMING_KEY}` (V1) → `GET https://api.deezer.com/track/{id}` |
| `/track/[id]/page.tsx` | Track SEO | Generate SEO metadata + OG image for track pages | `GET {NEXT_PUBLIC_V2_API_URL}/music/tracks/batch?ids={id}` (V2, `X-API-Key`) → fallback to `GET https://api.deezer.com/track/{id}` |
| **Album Operations** ||||
| `/api/album/[id]` | Album metadata | Fetch album details + tracks | `GET https://api.deezer.com/album/{id}` (direct Deezer proxy) |
| `/api/album/[id]/tracks` | Album tracks | Fetch album tracks only | `GET {NEXT_PUBLIC_API_URL}/music/album/{id}/tracks?key={STREAMING_KEY}` (V1, with Deezer fallback if configured as such) |
| **Artist Operations** ||||
| `/api/artist/[id]` | Artist metadata | Fetch artist details | `GET https://api.deezer.com/artist/{id}` (direct Deezer proxy) |
| `/api/artist/[id]/tracks` | Artist top tracks | Fetch artist top tracks | `GET {NEXT_PUBLIC_API_URL}/music/artist/{id}/tracks?key={STREAMING_KEY}` (V1, with Deezer fallback if configured as such) |
| **OG Images & Health** ||||
| `/api/og` | OG images | Track share previews and search OG images | Track: `302` redirect to `{NEXT_PUBLIC_V2_API_URL}/api/track/{deezerId}/preview` (V2) → fallback to `{NEXT_PUBLIC_API_URL}/api/preview?q={query}` (V1) → final fallback to static `/og-image.png` |
| `/api/health` | Health | App + DB health check for the frontend server | Local health JSON (DB ping + memory) used by UI; separate external health checks use `NEXT_PUBLIC_API_HEALTH_URL` and `NEXT_PUBLIC_API_V2_HEALTH_URL` from the browser (see `Header.tsx`) |

### tRPC Procedures

| Procedure | Purpose | Backend Endpoint |
|-----------|---------|------------------|
| `music.getIntelligentRecommendations` | Get AI-powered track recommendations | `POST /recommendations/intelligent` |
| `music.generateSmartMix` | Generate personalized playlists | `POST /recommendations/smart-mix` |

### Client-Side Services

| Service File | Purpose | Backend Endpoint |
|--------------|---------|------------------|
| `services/smartQueue.ts` | Fetch similar tracks for queue | `POST /recommendations/similar` |

### Fallback Behavior

If `NEXT_PUBLIC_V2_API_URL` + `SONGBIRD_API_KEY` are configured, `/api/track/[id]` first tries V2 `/music/tracks/batch?ids={id}`. If V2 fails or returns no track, it falls back to V1, then Deezer.
`/api/music/search` and `/api/stream` now require V2 (`key` + `kbps=320`) and no longer fall back to V1.

When `NEXT_PUBLIC_API_URL` is unavailable (404/400 errors), the following routes fall back to Deezer API:

- `/api/track/[id]` → `https://api.deezer.com/track/{id}`
- `/api/album/[id]` → `https://api.deezer.com/album/{id}`
- `/api/artist/[id]` → `https://api.deezer.com/artist/{id}`

**Note:** `/api/stream` has no Deezer fallback. If V2 is unavailable, streaming fails.

---

## Songbird Recommendations API (`NEXT_PUBLIC_V2_API_URL`)

**Purpose:** Enhanced AI/ML-powered music recommendations
**Required:** No (optional)
**Fallback:** Deezer API for basic artist radio
**Authentication:** Uses `SONGBIRD_API_KEY` via `X-API-Key` header

### OG Images (V2)

| Use | Songbird Endpoint |
|-----|-------------------|
| Track OG image | `GET /api/track/{deezerId}/preview` |

### tRPC Procedures

Only one tRPC procedure uses this API, but it implements **5 different fallback strategies**:

| Procedure | Purpose | Songbird Endpoints (in fallback order) |
|-----------|---------|----------------------------------------|
| `music.getSimilarTracks` | Get similar tracks using multiple strategies | See detailed breakdown below |

### `getSimilarTracks` Fallback Chain

The procedure tries these Songbird API endpoints in order until one succeeds:

1. **Batch Track Fetch**
   `GET /music/tracks/batch?ids={deezer_ids}`
   Fetches multiple tracks by Deezer IDs

2. **Spotify → Deezer Conversion**
   `POST /api/deezer/tracks/convert`
   Converts Spotify track IDs to Deezer IDs
   **Body:** `{ spotifyIds: string[] }`

3. **AI Recommendations**
   `POST /api/recommendations`
   Gets AI-powered track recommendations
   **Body:** `{ seedTracks: Track[], count: number }`

4. **Last.fm Similar Tracks**
   `GET /api/lastfm/track/similar?artist={artist}&track={track}&limit={limit}`
   Fetches similar tracks from Last.fm

5. **Spotify Recommendations**
   `POST /api/spotify/recommendations`
   Gets Spotify-based recommendations
   **Body:** `{ seedTracks: string[], limit: number }`

### Final Fallback

If all Songbird endpoints fail, the procedure falls back to:

- Deezer Artist Radio: `https://api.deezer.com/artist/{artistId}/top`

---

## Environment Variables

### Required Variables

```bash
# Primary Music API (Required)
NEXT_PUBLIC_API_URL=https://api.starchildmusic.com
STREAMING_KEY=your_streaming_key_here
```

### Optional Variables

```bash
# Songbird Recommendations API (Optional - enhances recommendations)
NEXT_PUBLIC_V2_API_URL=https://songbird-api.example.com
# OR (server-side only)
NEXT_PUBLIC_V2_API_URL=https://songbird-api.example.com

SONGBIRD_API_KEY=your_songbird_api_key_here
```

### Development Defaults

If not configured, services default to:

- `NEXT_PUBLIC_API_URL`: `http://localhost:3222`
- Songbird API: Skips entirely, uses Deezer fallback

---

## Fallback Strategy

### Recommendation Flow

```
User requests similar tracks
          ↓
1. Try Songbird API (if configured)
   ├─ Batch fetch
   ├─ Spotify conversion
   ├─ AI recommendations
   ├─ Last.fm similar
   └─ Spotify recommendations
          ↓
2. If Songbird unavailable or fails:
   Use Deezer Artist Radio
          ↓
3. Cache results in database
```

### Track/Album/Artist Flow

```
User requests track/album/artist data
          ↓
1. Try Primary Music API
   (NEXT_PUBLIC_API_URL)
          ↓
2. If 404/400 error:
   Fall back to Deezer API directly
          ↓
3. Return data to client
```

### Streaming Flow

```
User plays track
          ↓
1. Call /api/stream with track ID
          ↓
2. Primary Music API generates stream URL
          ↓
3. If API unavailable:
   ERROR - No streaming fallback
   (User must configure backend)
```

---

## API Comparison

| Feature | Primary Music API | Songbird API |
|---------|-------------------|--------------|
| **Purpose** | Core music operations | Enhanced recommendations |
| **Required** | ✅ Yes | ❌ No |
| **Handles** | Streaming, metadata, search | AI recommendations, conversions |
| **Fallback** | Deezer API (partial) | Deezer Artist Radio |
| **Auth** | `STREAMING_KEY` | `SONGBIRD_API_KEY` |
| **Used by** | 10+ routes/procedures | 1 procedure (5 strategies) |

---

## Notes

1. **Localhost Detection:** The OG image route (`/api/og`) skips localhost backend URLs in production to avoid unreachable endpoints.

2. **Deezer as Last Resort:** All music operations ultimately fall back to Deezer's public API if both backend APIs are unavailable.

3. **Caching:** Recommendations from Songbird API are cached in the database to reduce API calls and improve response times.

4. **Type Safety:** All API responses are typed via TypeScript interfaces defined in `src/types/index.ts`.

5. **Error Handling:** API routes return appropriate HTTP status codes:
   - `500`: Configuration error (API URL not set)
   - `502`: Connection error (backend unreachable)
   - `504`: Timeout error (backend not responding)

---

**Last Updated:** 2026-01-23
