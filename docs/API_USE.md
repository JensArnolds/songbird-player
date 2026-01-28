## Primary Music API (`NEXT_PUBLIC_API_URL`)

This base URL points at the **primary music backend** (legacy metadata fallback, recommendations, smart queue).

| Frontend usage / route                      | Backend path (relative to `NEXT_PUBLIC_API_URL`) | Purpose                                                                 |
|--------------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------|
| `GET /api/track/[id]`                      | `music/track/{id}?key={STREAMING_KEY}`           | Fallback track metadata when V2 fails                                  |
| `GET /api/og?q=...` (backend fallback)     | `api/preview?q={query}`                          | OG image generation fallback when Songbird preview is not available    |
| tRPC `music` router (server-side)          | `music/*` and related endpoints                  | Core music operations: search, metadata, recommendations, queue, etc.  |
| `src/services/smartQueue.ts` (service)     | `*` under `NEXT_PUBLIC_API_URL`                  | Smart queue helper calls into primary music API from Node context      |

> **Note:** All these calls normalize trailing slashes, so `NEXT_PUBLIC_API_URL` may end with `/` or not. Search/stream now go through V2.

---

## V2 / Songbird API (`NEXT_PUBLIC_V2_API_URL`)

This base URL points at the **v2 / Songbird-style backend**, used for OG images and advanced recommendations.

| Frontend usage / route                      | Backend path (relative to `NEXT_PUBLIC_V2_API_URL`) | Purpose                                                                 |
|--------------------------------------------|-----------------------------------------------------|-------------------------------------------------------------------------|
| `src/services/songbird.ts` (`songbird.request`) | Various (`/music/tracks/batch`, `/api/recommendations`, etc.) | Songbird / v2 recommendation flows and related helper endpoints        |
| `GET /api/music/search`                    | `music/search?key={SONGBIRD_API_KEY}&kbps=320&q={query}` | V2 search when configured                                              |
| `GET /api/stream?id={id}`                  | `music/stream?key={SONGBIRD_API_KEY}&kbps=320&id={id}` | V2 streaming when configured                                           |
| `GET /api/track/[id]`                      | `music/tracks/batch?ids={id}`                       | V2 track metadata (primary)                                            |
| `GET /track/[id]` (page SEO loader)        | `music/tracks/batch?ids={id}`                       | V2 track metadata for SEO                                              |
| `GET /api/og?trackId={id}`                 | `api/track/{deezerId}/preview`                    | Track-specific OG image generation (direct V2 preview)                 |
| `GET /api/og?q=...` (primary path)         | `api/track/{deezerId}/preview`                    | Query-based OG image generation via track search + V2 preview          |
| `GET /api/og` (no params, default)         | `api/preview/default`                              | Default OG image when no track/query data is available                 |
| App metadata (`src/app/layout.tsx`)        | `api/preview/default`                              | Default OG / Twitter image for the site                                |
| Search page metadata (`src/app/page.tsx`)  | `api/preview/default`                              | Default OG image for search landing pages                              |

> **Note:** `NEXT_PUBLIC_V2_API_URL` is also normalized for trailing slashes before paths are appended.
