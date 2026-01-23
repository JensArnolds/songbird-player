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

### API Routes

| Route | Purpose | Backend Endpoint |
|-------|---------|------------------|
| **Search & Discovery** |
| `/api/music/search` | Search for tracks, albums, artists | `GET /music/search?q={query}` |
| **Streaming** |
| `/api/stream` | Get audio stream URL for playback | `GET /stream/{trackId}?key={STREAMING_KEY}` |
| **Track Operations** |
| `/api/track/[id]` | Fetch track metadata by ID | `GET /music/track/{id}?key={STREAMING_KEY}` |
| `/track/[id]/page.tsx` | Generate SEO metadata for track pages | `GET /music/track/{id}?key={STREAMING_KEY}` |
| **Album Operations** |
| `/api/album/[id]` | Fetch album details + tracks | `GET /music/album/{id}?key={STREAMING_KEY}` |
| `/api/album/[id]/tracks` | Fetch album tracks only | `GET /music/album/{id}/tracks?key={STREAMING_KEY}` |
| **Artist Operations** |
| `/api/artist/[id]` | Fetch artist details | `GET /music/artist/{id}?key={STREAMING_KEY}` |
| `/api/artist/[id]/tracks` | Fetch artist top tracks | `GET /music/artist/{id}/tracks?key={STREAMING_KEY}` |

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

When `NEXT_PUBLIC_API_URL` is unavailable (404/400 errors), the following routes fall back to Deezer API:

- `/api/track/[id]` → `https://api.deezer.com/track/{id}`
- `/api/album/[id]` → `https://api.deezer.com/album/{id}`
- `/api/artist/[id]` → `https://api.deezer.com/artist/{id}`

**Note:** `/api/stream` does NOT have a fallback - streaming requires the backend API.

---

## Songbird Recommendations API (`SONGBIRD_PUBLIC_API_URL`)

**Purpose:** Enhanced AI/ML-powered music recommendations
**Required:** No (optional)
**Fallback:** Deezer API for basic artist radio
**Authentication:** Uses `SONGBIRD_API_KEY` via `X-API-Key` header

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
NEXT_PUBLIC_SONGBIRD_API_URL=https://songbird-api.example.com
# OR (server-side only)
SONGBIRD_PUBLIC_API_URL=https://songbird-api.example.com

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
