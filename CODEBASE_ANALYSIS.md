# Codebase Analysis: Songbird Frontend

**Last Updated:** 2025-01-09  
**Version:** 0.8.4  
**Project:** Songbird Player / darkfloor.art

---

## 📊 Executive Summary

Songbird is a **production-ready, full-stack music streaming and discovery platform** built with modern web technologies. The application features advanced audio processing, intelligent recommendations, comprehensive user management, and supports both web and desktop (Electron) deployment.

**Key Characteristics:**
- **Type-Safe End-to-End**: TypeScript + tRPC + Zod for complete type safety
- **Mobile-First Design**: Responsive UI with separate mobile/desktop components
- **Advanced Audio**: 9-band equalizer, multiple visualizers, Web Audio API integration
- **Production Infrastructure**: PM2 deployment, PostgreSQL database, Electron desktop app
- **Modern Stack**: Next.js 15, React 19, TailwindCSS v4, Drizzle ORM

---

## 🏗️ Architecture Overview

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15.5.9 | App Router, SSR, routing |
| **Language** | TypeScript | 5.9.3 | Type-safe development (strict mode) |
| **UI Library** | React | 19.2.3 | Component framework |
| **Styling** | TailwindCSS | 4.1.16 | Utility-first CSS |
| **API Layer** | tRPC | 11.0.0 | End-to-end type-safe APIs |
| **State Management** | TanStack Query | 5.90.14 | Server state & caching |
| **State (Client)** | React Context | - | Global player & UI state |
| **Database ORM** | Drizzle ORM | 0.41.0 | PostgreSQL queries |
| **Database** | PostgreSQL | - | Primary data store |
| **Authentication** | NextAuth.js | 5.0.0-beta.30 | Discord OAuth 2.0 |
| **Audio Playback** | HTML5 Audio API | - | Native playback |
| **Audio Processing** | Web Audio API | - | Equalizer & effects |
| **Animation** | Framer Motion | 12.23.26 | UI animations |
| **Desktop** | Electron | 39.2.7 | Cross-platform desktop |
| **Process Manager** | PM2 | - | Production deployment |

### Backend APIs

The application integrates with two production backend APIs:

1. **Darkfloor API** (`https://api.darkfloor.art/`)
   - Primary API for music search and streaming
   - Endpoints: `/music/search`, `/music/stream`
   - Swagger UI documentation available

2. **Songbird API** (`https://songbird.darkfloor.art/`)
   - Orchestrates Spotify, Last.fm, and Deezer
   - Features: music discovery, recommendations, playlist experimentation
   - Production environment (port 3333)

---

## 📁 Project Structure

```
songbird-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [userhash]/        # User profile pages (dynamic route)
│   │   ├── album/             # Album detail pages
│   │   ├── artist/            # Artist detail pages
│   │   ├── library/           # User library (playlists, favorites)
│   │   ├── playlists/         # Playlist management
│   │   ├── api/               # API routes (NextAuth, health checks)
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   └── register-sw.tsx    # Service worker registration
│   │
│   ├── components/            # React components (50+ files)
│   │   ├── Player.tsx         # Basic audio player
│   │   ├── EnhancedPlayer.tsx # Advanced player with equalizer
│   │   ├── MobilePlayer.tsx   # Mobile-optimized player
│   │   ├── MiniPlayer.tsx     # Compact player bar
│   │   ├── Queue.tsx          # Queue management
│   │   ├── EnhancedQueue.tsx # Advanced queue with multi-select
│   │   ├── TrackCard.tsx      # Track display component
│   │   ├── AudioVisualizer.tsx # Audio visualization
│   │   ├── Equalizer.tsx      # 9-band equalizer
│   │   ├── Header.tsx         # Desktop header
│   │   ├── MobileHeader.tsx   # Mobile header
│   │   ├── MobileNavigation.tsx # Bottom navigation
│   │   ├── FlowFieldBackground.tsx # Animated background (11k+ lines)
│   │   └── visualizers/       # Visualization components
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AudioPlayerContext.tsx  # Global player state
│   │   ├── ToastContext.tsx        # Toast notifications
│   │   ├── MenuContext.tsx         # Menu state
│   │   ├── TrackContextMenuContext.tsx # Context menu state
│   │   └── PlaylistContextMenuContext.tsx # Playlist menu state
│   │
│   ├── hooks/                 # Custom React hooks (11 files)
│   │   ├── useAudioPlayer.ts  # Core audio player logic (1,800+ lines)
│   │   ├── useEqualizer.ts    # Equalizer processing
│   │   ├── useAudioVisualizer.ts # Audio visualization
│   │   ├── useMediaQuery.ts   # Responsive breakpoints
│   │   ├── useKeyboardShortcuts.ts # Keyboard navigation
│   │   ├── useSwipeGesture.ts # Mobile swipe gestures
│   │   └── ...
│   │
│   ├── server/                # Server-side code
│   │   ├── api/               # tRPC API layer
│   │   │   ├── routers/       # API route handlers
│   │   │   │   ├── music.ts   # Music operations (2,200+ lines)
│   │   │   │   ├── equalizer.ts # Equalizer presets
│   │   │   │   ├── preferences.ts # User preferences
│   │   │   │   └── post.ts    # Example post router
│   │   │   ├── root.ts        # Root router
│   │   │   └── trpc.ts        # tRPC configuration
│   │   ├── auth/              # NextAuth configuration
│   │   ├── db/                # Database layer
│   │   │   ├── schema.ts      # Drizzle ORM schema (500+ lines)
│   │   │   └── index.ts       # Database connection
│   │   └── services/          # Business logic
│   │
│   ├── trpc/                  # tRPC client setup
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── config/                # Configuration files
│   ├── constants/             # App constants
│   ├── services/              # Client-side services
│   ├── styles/                # Global styles
│   │   └── globals.css        # TailwindCSS + custom styles
│   ├── env.js                 # Type-safe environment validation
│   └── middleware.ts          # Next.js middleware
│
├── electron/                  # Electron desktop app
│   ├── main.cjs              # Main process (CommonJS)
│   ├── preload.cjs           # Preload script
│   └── types.d.ts            # Type definitions
│
├── drizzle/                   # Database migrations
├── public/                    # Static assets
├── scripts/                   # Build and utility scripts
├── certs/                     # SSL certificates
└── logs/                      # PM2 logs
```

---

## 🎯 Core Features

### 1. Music Discovery & Search

- **Type-Safe Search**: tRPC-integrated search for tracks, albums, artists
- **Real-Time Results**: Debounced search with instant feedback
- **Context Menus**: Right-click/long-press for quick actions
- **Search History**: Track queries for authenticated users
- **Deezer API Format**: Compatible response structure

### 2. Audio Playback System

**Core Playback:**
- HTML5 Audio API for primary playback
- Web Audio API for advanced processing
- Spotify-style queue: `queue[0]` = current, `queue[1+]` = upcoming
- Playback controls: play/pause, skip (10s), speed (0.5x-2.0x), volume, repeat, shuffle

**Queue Management:**
- Multi-select with keyboard/mouse
- Drag-and-drop reordering
- Queue persistence (localStorage + database)
- Smart queue with similarity-based recommendations
- Save queue as playlist

### 3. Audio Enhancement

**9-Band Equalizer:**
- Frequency bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
- 8 built-in presets (Rock, Pop, Jazz, Classical, Electronic, Hip-Hop, Vocal, Flat)
- Custom band adjustment with real-time processing
- Preset persistence for authenticated users

**Audio Visualizers:**
- Multiple types: Spectrum Analyzer, Waveform, Circular, Frequency Bands, etc.
- FlowFieldRenderer with 80+ patterns (11,000+ lines)
- KaleidoscopeRenderer for mirrored effects
- Real-time audio-reactive visuals

### 4. User Management

**Authentication:**
- NextAuth.js with Discord OAuth 2.0
- Database-backed sessions (30-day expiry)
- User profiles with public/private settings
- Shareable profile URLs: `/[userhash]`

**User Data:**
- Playlists (create, edit, delete, share)
- Favorites with auto-sync based on play count
- Listening history with analytics
- Equalizer presets
- User preferences (smart queue, UI settings)
- Queue state persistence

### 5. Responsive Design

**Mobile (<768px):**
- MobileHeader with hamburger menu
- Bottom navigation bar
- MiniPlayer (bottom-stuck)
- MobilePlayer (full-screen modal)
- Swipe gestures
- Pull-to-refresh
- Touch-optimized controls

**Desktop (≥768px):**
- Traditional header navigation
- Desktop player at bottom
- Keyboard shortcuts
- Drag-and-drop interactions

**Z-Index Hierarchy:**
- Content: 1-29
- MobileHeader, MiniPlayer: 50
- HamburgerMenu: 60-61
- Full MobilePlayer modal: 98-99

### 6. Smart Features

- **Smart Queue**: Similarity-based recommendations (Songbird API)
- **Smart Mix**: Generate personalized mixes from seed tracks
- **Audio Analysis**: Spotify audio features integration
- **Recommendation Caching**: Optimized fetching

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

---

## 🔌 API Architecture

### tRPC Routers

**music.ts** (2,200+ lines):
- `search` - Search tracks, albums, artists
- `getTrackById`, `getAlbumById`, `getArtistById` - Get details
- `createPlaylist`, `addToPlaylist`, `removeFromPlaylist` - Playlist management
- `getPlaylists`, `getPlaylistById` - Retrieve playlists
- `addToFavorites`, `removeFromFavorites`, `getFavorites` - Favorites
- `addToHistory`, `getHistory` - Listening history
- `getRecommendations` - Track recommendations (Songbird API)
- `saveQueueState`, `getQueueState` - Queue persistence
- `getSmartQueueSettings` - Smart queue configuration

**equalizer.ts:**
- `getPresets`, `savePreset`, `deletePreset`, `updatePreset`

**preferences.ts:**
- User preference management

### API Integration Flow

```
Frontend → tRPC (music.search) → Backend API (Darkfloor/Songbird) → Response
```

Stream URLs generated via `getStreamUrlById()`:
```typescript
`${NEXT_PUBLIC_API_URL}/music/stream?trackId=${trackId}&kbps=320`
```

---

## 🎨 Design System

### Color Palette

```css
--color-text: #f5f1e8          /* Off-white */
--color-subtext: #a5afbf        /* Light gray */
--color-accent: #f4b266         /* Orange */
--color-secondary-accent: #58c6b1; /* Teal */
--color-background: #0b1118     /* Dark */
```

### Typography

- **Font**: Geist Sans (Google Fonts)
- System sans-serif fallback

### Responsive Breakpoints

- **Mobile**: <768px
- **Tablet**: 768-1024px
- **Desktop**: ≥1024px

### Animations

- Framer Motion with spring presets
- CSS-based transitions
- Micro-interactions for better UX

---

## 🔑 Key Patterns & Conventions

### Audio Player Architecture

**State Management:**
- Global `AudioPlayerContext` provides centralized player state
- `useAudioPlayer` hook contains core playback logic (1,800+ lines)
- Queue structure: `queue[0]` is current track, `queue[1+]` are upcoming

**Audio Chain:**
```
Track → getStreamUrlById() → Darkfloor API → HTMLAudioElement → Web Audio API → Equalizer → Speakers
                                      ↓
                              Visualizer (canvas/WebGL)
```

**User Gesture Requirement:**
- Web Audio Context requires user interaction (browser policy)
- Equalizer initializes on first user interaction

### Component Patterns

- **Client Components**: Marked with `"use client"` directive
- **Server Components**: Default in App Router
- **Conditional Rendering**: `useIsMobile()` hook for responsive components
- **Forms**: Controlled components with React state
- **Modals/Drawers**: `AnimatePresence` for enter/exit animations

### Type Safety

- **Strict TypeScript**: Full type checking enabled
- **Runtime Validation**: Zod schemas for API inputs/outputs
- **tRPC**: End-to-end type safety from server to client
- **Environment Variables**: Type-safe validation via `@t3-oss/env-nextjs`

### Error Handling

- **Error Boundaries**: React error boundaries for component errors
- **Toast Notifications**: User-friendly error messages
- **Graceful Degradation**: Fallbacks for missing features
- **Extension Error Suppression**: Chrome extension errors suppressed

---

## 🚀 Deployment & Infrastructure

### Development

```bash
npm run dev          # Development server (port 3222)
npm run dev:next     # Next.js dev server only
npm run electron:dev # Electron + Next.js dev
```

### Production

**PM2 Process Manager:**
- Production and development process configurations
- Automatic restarts on crash
- Health check monitoring
- Log management
- Memory limit: 2GB

**Build Process:**
- Pre-build: SSL cert generation, DB migrations
- Standalone output for Electron and Vercel
- Automatic build recovery if missing

### Electron Desktop App

**Architecture:**
- Main process: `electron/main.cjs` (CommonJS)
- Preload script: `electron/preload.cjs` (context isolation)
- Next.js runs in standalone mode

**Build Targets:**
- Windows: NSIS installer + portable
- macOS: DMG (x64 + arm64)
- Linux: AppImage + DEB

---

## 📊 Codebase Statistics

### File Counts

- **Components**: 50+ React components
- **Hooks**: 11 custom hooks
- **tRPC Routers**: 4 main routers
- **Database Tables**: 15+ tables
- **Visualization Patterns**: 80+ patterns

### Lines of Code (Estimated)

- `useAudioPlayer.ts`: ~1,800 lines
- `music.ts` router: ~2,200 lines
- `FlowFieldBackground.tsx`: ~11,000 lines
- `schema.ts`: ~500 lines
- **Total**: ~50,000+ lines (excluding node_modules)

---

## 🔍 Notable Dependencies

### Audio & Visualization
- `tone` (15.1.22) - Audio synthesis and effects
- `react-audio-visualize` (1.2.0) - Audio visualization components
- Web Audio API - Real-time audio processing

### UI & Animation
- `framer-motion` (12.23.26) - Animation library
- `lucide-react` (0.548.0) - Icon library
- `@dnd-kit/*` - Drag and drop functionality
- `vaul` (1.1.2) - Drawer/modal components

### Utilities
- `zod` (3.25.76) - Runtime type validation
- `superjson` (2.2.6) - Enhanced JSON serialization
- `@t3-oss/env-nextjs` (0.12.0) - Type-safe environment variables
- `@tanstack/react-virtual` (3.13.13) - Virtual scrolling

---

## 🎯 Development Workflow

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js ESLint config
- **Prettier**: Code formatting
- **Type Checking**: `npm run typecheck`
- **Linting**: `npm run lint`

### Database Operations

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema directly (dev)
npm run db:studio    # Open Drizzle Studio GUI
```

### Testing & Validation

- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Format check: `npm run format:check`
- Full check: `npm run check` (lint + typecheck)

---

## 🐛 Known Patterns & Workarounds

### Chrome Extension Errors

- Suppressed via `SuppressExtensionErrors` component
- Harmless errors from extension communication

### Web Audio Context

- Requires user gesture for initialization
- Equalizer wraps initialization in event handlers

### Build Recovery

- PM2 pre-start hook ensures build exists
- Automatic build if `BUILD_ID` missing

### Next.js App Router

- Suppresses expected errors for Pages Router files
- Custom error handling in `next.config.js`

---

## 📈 Future Roadmap

### Planned Enhancements

1. **WebGL Migration**
   - Migrate Canvas2D visualizations to WebGL
   - Unified rendering pipeline
   - GPU-accelerated effects
   - Estimated: 3-4 months

2. **Feature Enhancements**
   - Offline mode with caching
   - Social features (sharing, following)
   - Advanced analytics
   - Theme system (dark/light toggle)

3. **Performance**
   - Further optimization of visualization rendering
   - Improved mobile battery efficiency
   - Faster search and navigation

---

## 📝 Key Files Reference

### Core Files

- `src/hooks/useAudioPlayer.ts` - Core audio player logic
- `src/contexts/AudioPlayerContext.tsx` - Global player state
- `src/server/api/routers/music.ts` - Music API operations
- `src/server/db/schema.ts` - Database schema
- `src/components/FlowFieldBackground.tsx` - Visualization patterns
- `src/app/layout.tsx` - Root layout with providers

### Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - TailwindCSS configuration
- `drizzle.config.ts` - Database configuration
- `ecosystem.config.cjs` - PM2 configuration

---

## 🤝 Contributing Guidelines

### Code Standards

1. **TypeScript**: Strict mode enabled, no implicit `any`
2. **Components**: Properly typed with interfaces
3. **Styling**: TailwindCSS v4 conventions
4. **Environment**: Add variables to `src/env.js` validation
5. **tRPC**: Use tRPC procedures for all API calls
6. **Testing**: Test on both mobile and desktop views

### Development Workflow

1. Create feature branch from `main`
2. Implement with type safety
3. Test on mobile (<768px) and desktop (≥768px)
4. Run `npm run check` to verify
5. Submit pull request with clear description

---

## 📚 Additional Resources

- **README.md** - Getting started guide
- **REPOSITORY_ANALYSIS.md** - Detailed repository analysis
- **CHANGELOG.md** - Version history
- **ROADMAP.md** - WebGL migration plan
- **CLAUDE.md** - Architecture documentation

---

*This analysis was generated on 2025-01-09. For the most up-to-date information, refer to the source code and documentation.*
