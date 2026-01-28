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

