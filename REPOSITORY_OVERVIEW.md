# Repository Overview: Songbird Frontend

**Version:** 0.9.7  
**Last Updated:** January 2026  
**License:** GPL-3.0  
**Homepage:** https://darkfloor.art

---

## 📋 Executive Summary

**Songbird Frontend** (also known as **darkfloor.art**) is a modern, full-stack music streaming and discovery platform built with Next.js 15, React 19, and TypeScript. The application provides a Spotify-like experience with advanced audio features, intelligent recommendations, and comprehensive user management. It supports both web and desktop (Electron) deployment.

### Key Highlights

- **Type-Safe Architecture**: End-to-end type safety with tRPC, TypeScript strict mode, and Drizzle ORM
- **Advanced Audio Features**: 9-band equalizer, real-time audio visualizers, Web Audio API integration
- **Smart Recommendations**: Similarity-based queue suggestions using Songbird API
- **Responsive Design**: Mobile-first with dedicated mobile player and desktop interfaces
- **Production-Ready**: PM2 process management, health checks, automatic restarts, graceful shutdowns
- **Cross-Platform**: Web application with Electron desktop support (Windows, macOS, Linux)

---

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 15.5.9 | Server-side rendering, routing, API routes |
| **Language** | TypeScript | 5.9.3 | Type-safe development with strict mode |
| **UI Library** | React | 19.2.3 | Component-based UI framework |
| **Styling** | TailwindCSS | 4.1.18 | Utility-first CSS with CSS variables |
| **API Layer** | tRPC | 11.0.0 | End-to-end type-safe API calls |
| **State Management** | TanStack Query | 5.90.16 | Server state, caching, mutations |
| **Client State** | React Context | Built-in | Global player & UI state management |
| **Authentication** | NextAuth.js | 5.0.0-beta.30 | OAuth 2.0 (Discord), session management |
| **Database ORM** | Drizzle ORM | 0.41.0 | PostgreSQL schema & type-safe queries |
| **Database** | PostgreSQL | - | Primary data store (Neon/self-hosted) |
| **Audio Playback** | HTML5 Audio API | Native | Core playback engine |
| **Audio Processing** | Web Audio API | Native | Equalizer, real-time effects, visualizers |
| **Animation** | Framer Motion | 12.25.0 | UI animations, gestures, transitions |
| **Desktop** | Electron | 39.2.7 | Cross-platform desktop application |
| **Process Manager** | PM2 | - | Production deployment & monitoring |
| **Environment** | @t3-oss/env-nextjs | 0.12.0 | Type-safe environment configuration |

### Project Structure

```
songbird-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [userhash]/        # User profile pages (dynamic route)
│   │   ├── album/             # Album detail pages
│   │   ├── artist/            # Artist detail pages
│   │   ├── library/           # User library (playlists, favorites)
│   │   ├── playlists/         # Playlist management
│   │   ├── settings/          # User settings page
│   │   ├── api/               # API routes (NextAuth, health checks, tRPC)
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx            # Home page (search interface)
│   │
│   ├── components/            # React components (50+ components)
│   │   ├── Player.tsx         # Basic audio player
│   │   ├── EnhancedPlayer.tsx # Advanced player with equalizer
│   │   ├── MobilePlayer.tsx   # Full-screen mobile player
│   │   ├── MiniPlayer.tsx     # Compact bottom player bar
│   │   ├── Queue.tsx          # Queue management
│   │   ├── EnhancedQueue.tsx  # Advanced queue with multi-select
│   │   ├── TrackCard.tsx      # Track display component
│   │   ├── AudioVisualizer.tsx # Audio visualization wrapper
│   │   ├── Equalizer.tsx      # 9-band equalizer component
│   │   ├── Header.tsx         # Desktop header
│   │   ├── MobileHeader.tsx   # Mobile header with search
│   │   ├── MobileNavigation.tsx # Bottom navigation
│   │   ├── HamburgerMenu.tsx  # Mobile menu drawer
│   │   └── visualizers/       # Visualization components
│   │       ├── FlowFieldRenderer.ts # 80+ visualization patterns
│   │       ├── KaleidoscopeRenderer.ts
│   │       └── ...
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AudioPlayerContext.tsx  # Global player state
│   │   ├── ToastContext.tsx        # Toast notifications
│   │   ├── MenuContext.tsx         # Menu state
│   │   └── TrackContextMenuContext.tsx # Context menu state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Core audio player logic (1,800+ lines)
│   │   ├── useEqualizer.ts    # Equalizer processing
│   │   ├── useMediaQuery.ts   # Responsive breakpoints
│   │   └── ...
│   │
│   ├── server/                # Server-side code
│   │   ├── api/               # tRPC API layer
│   │   │   ├── routers/       # API route handlers
│   │   │   │   ├── music.ts   # Music operations (2,200+ lines)
│   │   │   │   ├── equalizer.ts # Equalizer presets
│   │   │   │   └── post.ts    # Example router
│   │   │   ├── root.ts        # Root router
│   │   │   └── trpc.ts        # tRPC configuration
│   │   ├── auth/              # NextAuth configuration
│   │   ├── db/                # Database layer
│   │   │   ├── schema.ts      # Drizzle ORM schema
│   │   │   └── index.ts       # Database connection
│   │   └── services/          # Business logic
│   │
│   ├── trpc/                  # tRPC client setup
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   │   ├── audioContextManager.ts # Web Audio API management
│   │   └── getStreamUrlById.ts    # Stream URL generation
│   ├── config/                # Configuration files
│   ├── constants/             # App constants
│   ├── services/              # Client-side services
│   └── styles/                # Global styles
│       └── globals.css        # TailwindCSS + custom CSS variables
│
├── electron/                  # Electron desktop app
│   ├── main.cjs               # Electron main process
│   └── preload.cjs            # Preload script
│
├── public/                    # Static assets
├── scripts/                   # Build & deployment scripts
├── drizzle/                   # Database migrations
├── docs/                      # Documentation
├── CHANGELOG.md               # Version history
└── package.json               # Dependencies & scripts
```

---

## 🎯 Core Features

### 1. Music Discovery & Search

- **Type-Safe Search**: Integrated search for tracks, albums, and artists via tRPC API
- **Real-Time Results**: Debounced search (2-second delay) with instant results
- **Context Menus**: Right-click (or long-press) tracks for quick actions (play, queue, favorite, add to playlist)
- **Search History**: Track search queries for authenticated users
- **Deezer API Format**: Compatible with Deezer API response structure
- **Mobile Search**: Enhanced mobile search bar with countdown indicator and auto-search

### 2. Audio Playback System

**Core Playback:**
- **HTML5 Audio API**: Primary playback engine with Web Audio API for advanced processing
- **Spotify-Style Queue**: Queue structure where `queue[0]` is the current track, `queue[1+]` are upcoming tracks
- **Playback Controls**:
  - Play/pause, skip forward/backward (10 seconds)
  - Variable playback speed (0.5x - 2.0x)
  - Volume control with mute
  - Repeat modes: none, one, all
  - Shuffle mode with original order restoration

**Queue Management:**
- **Multi-Select**: Keyboard and mouse selection for bulk operations
- **Drag & Drop**: Reorder tracks in queue (desktop)
- **Queue Persistence**: Save and restore queue state (authenticated users)
- **Smart Queue**: Similarity-based recommendations (light mode available)
- **Queue History**: Track playback history
- **Save as Playlist**: Convert queue to playlist

### 3. Audio Enhancement

**9-Band Equalizer:**
- Frequency bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
- 8 built-in presets (Rock, Pop, Jazz, Classical, Electronic, Hip-Hop, Vocal, Flat)
- Custom band adjustment with real-time processing
- Preset persistence for authenticated users
- Web Audio API integration for hardware-accelerated processing

**Audio Visualizers:**
- Multiple visualization types: Spectrum Analyzer, Waveform, Circular, Frequency Bands, Radial Spectrum, Spectral Waves, Particle System, Frequency Rings
- FlowFieldRenderer with 80+ visualization patterns
- KaleidoscopeRenderer for mirrored effects
- LightweightParticleBackground for performance
- Real-time audio-reactive visuals

### 4. User Management

**Authentication:**
- **NextAuth.js**: Discord OAuth 2.0 authentication
- **Session Management**: Database-backed sessions (30-day expiry)
- **User Profiles**: Public/private profile settings with user hash URLs
- **Profile Pages**: Shareable user profiles at `/[userhash]`

**User Data:**
- **Playlists**: Create, edit, delete, and share playlists
- **Favorites**: Track favorite songs with auto-sync based on play count
- **Listening History**: Complete playback history with analytics
- **Equalizer Presets**: Save and manage custom equalizer configurations
- **User Preferences**: Smart queue settings, UI preferences, and more

### 5. Responsive Design

**Mobile (<768px):**
- MobileHeader with hamburger menu and search
- Bottom navigation bar with swipeable panes
- MiniPlayer (bottom-stuck compact player)
- MobilePlayer (full-screen modal with gesture controls)
- Swipe gestures for navigation and seeking
- Pull-to-refresh functionality
- Touch-optimized controls with haptic feedback
- Device-specific optimizations (iPhone 17 Pro Max support)

**Desktop (≥768px):**
- Traditional header navigation
- Desktop player at bottom
- Keyboard shortcuts (Space, Arrow keys, M for mute, etc.)
- Drag-and-drop interactions
- Multi-select with Shift+Arrow keys

### 6. Smart Features

- **Smart Queue**: Similarity-based track recommendations using Songbird API
- **Smart Mix**: Generate personalized mixes from seed tracks
- **Audio Analysis**: Spotify audio features integration
- **Similarity Filtering**: Adjustable similarity levels (strict, balanced, diverse)
- **Recommendation Caching**: Optimized recommendation fetching

---

## 🔌 API Architecture

### Backend APIs

The application uses two backend APIs for music operations:

#### 1. Darkfloor API (`https://api.darkfloor.art/`)

Primary API for music search and streaming.

**Endpoints:**
- `GET /music/search?q={query}` - Search for music tracks
- `GET /music/stream?trackId={id}&kbps={bitrate}` - Stream a music track

**Documentation:**
- Swagger UI available at [https://api.darkfloor.art/](https://api.darkfloor.art/)
- OpenAPI specification (JSON/YAML) available for download

#### 2. Songbird API (`https://songbird.darkfloor.art/`)

Advanced API that orchestrates Spotify, Last.fm, and Deezer for comprehensive music discovery, recommendations, playlist experimentation, and streaming.

**Features:**
- Music discovery across multiple sources
- Intelligent recommendations
- Playlist experimentation
- Streaming capabilities

**Documentation:**
- Swagger UI available at [https://songbird.darkfloor.art/](https://songbird.darkfloor.art/)
- OpenAPI specification (JSON/YAML) available for download

### tRPC Type-Safe API

The application uses **tRPC** for end-to-end type safety from server to client. All API calls are type-safe with automatic TypeScript inference. The tRPC layer acts as a proxy to the backend APIs.

**Main Routers:**

1. **music.ts** (2,200+ lines) - Music operations:
   - `search` - Search tracks, albums, artists
   - `getTrackById`, `getAlbumById`, `getArtistById` - Get details
   - `createPlaylist`, `addToPlaylist`, `removeFromPlaylist` - Playlist management
   - `getPlaylists`, `getPlaylistById` - Retrieve playlists
   - `addToFavorites`, `removeFromFavorites`, `getFavorites` - Favorites
   - `addToHistory`, `getHistory` - Listening history
   - `getRecommendations` - Track recommendations (uses Songbird API)
   - `saveQueueState`, `getQueueState` - Queue persistence
   - `getSmartQueueSettings` - Smart queue configuration

2. **equalizer.ts** - Equalizer presets:
   - `getPresets`, `savePreset`, `deletePreset`, `updatePreset`

3. **post.ts** - Example router (from T3 template)

**Usage Example:**

```typescript
import { api } from "@/trpc/react";

// In a React component
const { data: tracks } = api.music.search.useQuery({ query: "artist name" });
const addToPlaylist = api.music.addToPlaylist.useMutation();

// Call mutation
addToPlaylist.mutate({ playlistId: "123", trackId: 456 });
```

### API Integration Flow

**Search Flow:**
```
Frontend → tRPC (music.search) → Backend API (Darkfloor/Songbird) → Response
```

**Streaming Flow:**
```
Frontend → getStreamUrlById() → Backend API (/music/stream) → Audio Stream
```

**Stream URL Generation:**

Stream URLs are generated via `getStreamUrlById()` function:
```typescript
const streamUrl = getStreamUrlById(trackId.toString());
// Returns: `${NEXT_PUBLIC_API_URL}/music/stream?trackId=${trackId}&kbps=320`
// Or with key: `${NEXT_PUBLIC_API_URL}/music/stream?key=${STREAMING_KEY}&trackId=${trackId}`
```

---

## 🗄️ Database Schema

### Key Tables

**Authentication:**
- `users` - User accounts with profile data
- `sessions` - Active user sessions (NextAuth)
- `accounts` - OAuth account links
- `verificationTokens` - Email verification

**Music Library:**
- `favorites` - User favorite tracks
- `playlists` - User-created playlists
- `playlist_tracks` - Playlist → Track mapping (many-to-many)
- `listening_history` - Track play history
- `listening_analytics` - Detailed playback analytics

**User Preferences:**
- `equalizer_presets` - Saved equalizer configurations
- `user_preferences` - Smart queue settings, UI preferences
- `playback_state` - Queue state persistence

**Recommendations:**
- `recommendation_cache` - Cached recommendations
- `recommendation_logs` - Recommendation history

**Other:**
- `posts` - Example table (from T3 template)
- `search_history` - Search query tracking

**Table Prefix:** `hexmusic-stream_` (configurable via `createTable`)

### Schema Patterns

- **Relations:** Drizzle ORM relations for type-safe joins
- **Indexes:** Strategic indexes on foreign keys and search fields
- **Timestamps:** Automatic `createdAt` and `updatedAt` tracking

---

## 🎨 Design System

### Color Palette

Available in `src/styles/globals.css`:

```css
:root {
  --color-text: #f5f1e8;          /* Off-white */
  --color-subtext: #a5afbf;        /* Light gray */
  --color-accent: #f4b266;         /* Orange */
  --color-secondary-accent: #58c6b1; /* Teal */
  --color-background: #0b1118;     /* Dark */
}
```

### Typography

- **Font Stack**: Geist Sans (system fallback)
- **Responsive**: Fluid typography with clamp() functions

### Responsive Breakpoints

- **Mobile**: <768px
- **Tablet**: 768-1024px
- **Desktop**: ≥1024px

### Z-Index Hierarchy

- Content: 1-29
- MobileHeader, MiniPlayer: 50
- HamburgerMenu (backdrop + drawer): 60-61
- Full MobilePlayer modal: 98-99

### Design Patterns

- **Cards & Buttons**: Rounded corners, flat surfaces with accent borders/text
- **Background**: Dark gradient with animated flow field patterns
- **Animations**: Framer Motion with spring presets, CSS-based transitions
- **Color Palette**: Orange and teal accents on dark backgrounds

---

## 🚀 Development Workflow

### Available Scripts

**Development:**
```bash
npm run dev          # Development server (port 3222)
npm run dev:next     # Next.js dev server only
npm run electron:dev # Electron + Next.js dev
```

**Database:**
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema directly (dev)
npm run db:studio    # Open Drizzle Studio GUI
```

**Build & Production:**
```bash
npm run build        # Production build
npm run start        # Start production server
npm run preview      # Build + start (test production)
```

**Electron:**
```bash
npm run electron:build       # Build for current platform
npm run electron:build:win   # Build Windows installer
npm run electron:build:mac   # Build macOS DMG
npm run electron:build:linux # Build Linux AppImage/DEB
```

**Code Quality:**
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run lint:fix     # Fix linting errors
npm run format:check # Prettier check
npm run format:write # Prettier format
npm run check        # Lint + typecheck
```

**PM2 (Production):**
```bash
npm run pm2:start    # Start production server
npm run pm2:dev      # Start development server
npm run pm2:reload   # Graceful reload
npm run pm2:restart  # Hard restart
npm run pm2:stop     # Stop server
npm run pm2:logs     # View logs
npm run pm2:status   # Check status
npm run deploy       # Build + reload
```

---

## 🔧 Configuration

### Environment Variables

**Required:**
- `AUTH_SECRET` - NextAuth secret (min 32 chars, generate with `npx auth secret`)
- `AUTH_DISCORD_ID` - Discord OAuth app ID
- `AUTH_DISCORD_SECRET` - Discord OAuth app secret
- `NEXT_PUBLIC_API_URL` - Darkfloor API URL (e.g., `https://api.darkfloor.art/`)
- `STREAMING_KEY` - Secure stream key (optional)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string (with `?sslmode=require`)
- `DB_HOST`, `DB_PORT`, `DB_ADMIN_USER`, `DB_ADMIN_PASSWORD`, `DB_NAME` - Alternative DB config

**Optional:**
- `NEXT_PUBLIC_SONGBIRD_API_URL` - Songbird API URL
- `SONGBIRD_API_KEY` - Songbird API key
- `NEXT_PUBLIC_NEXTAUTH_VERCEL_URL` - Vercel deployment URL
- `NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER` - Custom server URL
- `ELECTRON_BUILD` - Set to `"true"` for Electron builds

### TypeScript Configuration

- **Strict Mode**: Enabled with `noUncheckedIndexedAccess`
- **Target**: ES2022
- **Module**: ESNext with Bundler resolution
- **Path Aliases**: `@/*` → `./src/*`

### Next.js Configuration

- **Output**: Standalone mode for production
- **React Strict Mode**: Enabled
- **Image Optimization**: Enabled (disabled for Electron builds)
- **Security Headers**: HSTS, X-Frame-Options, CSP, etc.
- **Package Optimization**: Tree-shaking for large dependencies

---

## 📦 Key Dependencies

### Production Dependencies

- **@auth/drizzle-adapter** - NextAuth database adapter
- **@dnd-kit/core, @dnd-kit/sortable** - Drag and drop functionality
- **@neondatabase/serverless** - Neon PostgreSQL driver
- **@tanstack/react-query** - Server state management
- **@trpc/client, @trpc/react-query, @trpc/server** - Type-safe API layer
- **drizzle-orm** - TypeScript ORM
- **framer-motion** - Animation library
- **lucide-react** - Icon library
- **next, react, react-dom** - Core framework
- **next-auth** - Authentication
- **pg, postgres** - PostgreSQL drivers
- **zod** - Schema validation

### Development Dependencies

- **@tailwindcss/postcss** - TailwindCSS v4
- **drizzle-kit** - Database migrations
- **electron, electron-builder** - Desktop app
- **eslint, typescript-eslint** - Linting
- **prettier** - Code formatting
- **typescript** - Type checking

---

## 🎵 Audio Player Architecture

### State Management

- **Global Context**: `AudioPlayerContext` provides centralized player state across all components
- **Core Hook**: `useAudioPlayer` hook contains core playback logic (1,800+ lines)
- **Queue Structure**: `queue[0]` is current track, `queue[1+]` are upcoming tracks

### Audio Chain

```
Track → getStreamUrlById() → Darkfloor API (/music/stream) → HTMLAudioElement → Web Audio API → Equalizer → Speakers
                                      ↓
                              Visualizer (canvas/WebGL)
```

### Key Features

- **Queue Persistence**: Queue state saved to localStorage and database (authenticated users)
- **Playback History**: Tracks added to history on completion
- **Smart Queue**: Similarity-based recommendations (optional)
- **Error Handling**: Automatic retry with exponential backoff
- **User Gesture Requirement**: Web Audio Context requires user interaction (browser policy)

---

## 🔐 Authentication Flow

### NextAuth.js Integration

1. User clicks "Sign in with Discord"
2. Redirects to Discord OAuth
3. Discord callback returns to `/api/auth/callback/discord`
4. NextAuth creates/updates user in database
5. Session stored in database (30-day expiry)
6. User profile accessible at `/[userhash]`

### Session Management

- Database-backed sessions (not JWT)
- Automatic session refresh (24-hour update age)
- Secure cookies in production (HTTP-only, SameSite=Lax)
- Electron-compatible (non-secure cookies for localhost)

---

## 📱 Mobile vs Desktop

### Mobile (<768px)

- **Header**: `MobileHeader` with hamburger menu and search bar
- **Navigation**: Bottom navigation bar with swipeable panes
- **Player**: `MiniPlayer` (compact) and `MobilePlayer` (full-screen modal)
- **Gestures**: Swipe to navigate, swipe up to expand player, pull-to-refresh
- **Touch**: Haptic feedback, touch-optimized controls
- **Search**: Debounced search with countdown indicator

### Desktop (≥768px)

- **Header**: Traditional `Header` with navigation links
- **Player**: `PersistentPlayer` at bottom of screen
- **Keyboard**: Shortcuts (Space, Arrow keys, M for mute, etc.)
- **Mouse**: Drag-and-drop, multi-select with Shift+Arrow keys
- **Layout**: Sidebar navigation, larger artwork, expanded controls

---

## 🚨 Common Patterns & Conventions

### File Naming

- **Components**: PascalCase (e.g., `MobilePlayer.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAudioPlayer.ts`)
- **Utils**: camelCase (e.g., `getStreamUrlById.ts`)
- **Types**: camelCase (e.g., `index.ts` in `types/`)

### Code Style

- **TypeScript**: Strict mode, explicit types, no `any`
- **React**: Functional components with hooks
- **Styling**: TailwindCSS utility classes, CSS variables for theming
- **State**: React Context for global state, TanStack Query for server state
- **API**: tRPC for all API calls (no direct fetch)

### Error Handling

- **Toast Notifications**: User-facing errors via `ToastContext`
- **Error Boundaries**: `ErrorBoundary` component for React errors
- **Retry Logic**: Exponential backoff for failed API calls
- **Logging**: Console logging in development, error tracking in production

---

## 📚 Documentation Files

- **README.md** - Main project documentation
- **CHANGELOG.md** - Version history and changes
- **REPOSITORY_ANALYSIS.md** - Detailed codebase analysis
- **CODEBASE_ANALYSIS.md** - Component and feature breakdown
- **CLAUDE.md** - Architecture documentation
- **ROADMAP.md** - Future development plans

---

## 🔄 Recent Changes (v0.8.8 - v0.9.7)

### Version 0.9.7
- Updated dependencies
- Code formatting improvements

### Version 0.8.8
- Fixed profile link navigation (replaced `javascript:void(0)` with `#`)
- Enhanced mobile search bar with smooth animations
- Fixed progress bar direction in countdown indicator
- Improved Play button design with gradient and ring border
- Fixed duplicate navigation on search clear
- Added Vercel deployment indicator in desktop header

### Version 0.8.7
- Fixed SVG animation conflicts in search countdown indicator
- Fixed `dragElastic` property for Framer Motion v12 compatibility

### Version 0.8.6
- Added iPhone 17 Pro Max support (1320×2868 resolution)
- Fixed profile link in hamburger menu
- Fixed mobile search countdown bug
- Fixed mobile player button controls

### Version 0.8.5
- Added mobile settings page
- Enhanced mobile player swipe-up gesture
- Mobile search bar enhancements with auto-search

---

## 🎯 Future Roadmap

Planned enhancements:

- **WebGL Migration** - Migrate Canvas2D visualizations to WebGL for better performance
- **Offline Mode** - Cache downloaded tracks for offline playback
- **Social Features** - Share playlists, follow users, collaborative playlists
- **Advanced Analytics** - Listening insights, genre preferences, time-based stats
- **Theme System** - Dark/light theme toggle with user preference saving
- **Mobile App** - Native mobile apps (React Native or PWA enhancements)

---

## ⚖️ Legal & Licensing

### Important Notice

This project does **not** include or distribute copyrighted music. It is a frontend interface designed to work with legitimate, licensed music APIs.

**Backend APIs in Use:**

1. **Darkfloor API** ([https://api.darkfloor.art/](https://api.darkfloor.art/))
   - Provides music search and streaming endpoints
   - Handles track search and audio streaming

2. **Songbird API** ([https://songbird.darkfloor.art/](https://songbird.darkfloor.art/))
   - Orchestrates Spotify, Last.fm, and Deezer APIs
   - Provides music discovery, recommendations, and playlist features
   - Handles intelligent recommendations and multi-source data aggregation

Both APIs are production-ready and handle licensing compliance. The frontend communicates with these APIs through the tRPC layer for type-safe integration.

**Do not use this with unauthorized music sources.**

### License

This project is licensed under the **GPL-3.0 License**. See the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please ensure:

1. **TypeScript**: All code is TypeScript with strict mode enabled
2. **Type Safety**: Components properly typed with interfaces
3. **Styling**: Follow TailwindCSS v4 conventions
4. **Environment**: Add new variables to `src/env.js` validation
5. **tRPC**: Use tRPC procedures for all API calls (no direct fetch)
6. **Testing**: Test on both mobile and desktop views
7. **Code Style**: Run `npm run format:write` before committing

### Development Workflow

1. Create feature branch from `main`
2. Implement feature with type safety
3. Test on mobile (<768px) and desktop (≥768px)
4. Run `npm run check` to verify linting and types
5. Submit pull request with clear description

---

## 📜 Acknowledgments

Built with the **T3 Stack** - a modern, type-safe full-stack framework for Next.js applications.

**Key Technologies:**
- [Next.js](https://nextjs.org/) - React framework
- [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Electron](https://www.electronjs.org/) - Desktop framework

---

## 📞 Contact & Support

- **Homepage**: https://darkfloor.art
- **Repository**: https://github.com/soulwax/songbird-player
- **Issues**: https://github.com/soulwax/starchild-music-frontend/issues
- **Author**: Christian (soulwax@github)

---

**© 2025 soulwax @ GitHub**

*All music data, streaming rights, and trademarks remain the property of their respective owners.*
