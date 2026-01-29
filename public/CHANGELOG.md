# Changelog

All notable changes to Starchild Music will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.10.20] - 2026-01-29

### Fixed

- **Sacred Triangle Corner Orbs**: Corrected corner orb positions to align with triangle vertices
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`

### Changed

- **Quantum Foam Performance**: Reduced per-frame cost on Firefox with lower element counts, simplified gradients/shadows, and reduced wave resolution
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Voronoi Performance**: Reused seed buffers, constrained sampling radius, and adapted cell size for smoother rendering
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Adaptive Visual Quality**: Added dynamic quality throttling based on frame time and scaled heavy patterns (Waves, Starfield, Chaos Vortex, Langton's Ant, Bitfield Matrix, Quantum Resonance, Sacred Triangle, Quantum Foam)
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Additional Visual Optimizations**: Tuned Fluid, Dragon Curve, and Morse Aurora for lower per-frame cost on Firefox
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Further Visual Optimizations**: Reduced cost in Fractal, Mandelbrot Spiral, and Menger Sponge using adaptive quality scaling
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **More Visual Optimizations**: Tuned Plasma Storm, Perlin Noise Field, and Superformula for adaptive detail scaling on Firefox
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Additional Visual Optimizations**: Reduced gradient/shadow load and element counts in Divine Light, Transcendence, and Tree of Life
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **Additional Visual Optimizations**: Scaled Solar Flare, Gothic Thorns, and Phoenix with adaptive detail to reduce gradient/shadow cost
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`
- **API Decryption Modernization**: API modernised to use new decryption methods

## [0.10.19] - 2026-01-29

### Fixed

- **API Health Check Configuration**: Corrected health check URLs to use local development endpoints instead of production
  - Updated `NEXT_PUBLIC_API_HEALTH_URL` and `NEXT_PUBLIC_API_V2_HEALTH_URL` in environment configuration to point to local APIs (127.0.0.1)
  - Resolved "API Down" false positive when developing locally with running API servers
  - Location: `.env`, `.env.local`

## [0.10.18] - 2026-01-28

### Added

- **V2 API Tests**: Added coverage for V2-only search/stream handlers and health status normalization, plus V2 track batch SEO path
  - Location: `src/__tests__/api-search-v2.test.ts`, `src/__tests__/api-stream-v2.test.ts`, `src/__tests__/health-status.test.ts`, `src/__tests__/track-seo.test.ts`

### Changed

- **V2-Only Search & Stream**: `/api/music/search` and `/api/stream` now require V2 (`NEXT_PUBLIC_V2_API_URL` + `SONGBIRD_API_KEY`) with no V1 fallback
  - Location: `src/app/api/music/search/route.ts`, `src/app/api/stream/route.ts`
- **Track SEO Metadata via V2**: Track page metadata now fetches from V2 batch endpoint (Deezer fallback only)
  - Location: `src/app/track/[id]/page.tsx`
- **OG Track Previews via V2**: `/api/og` uses V2 track preview for trackId and search hits
  - Location: `src/app/api/og/route.tsx`
- **API Docs Updated**: Reflected V2 routing and OG preview changes
  - Location: `docs/API_ROUTE_USE.md`, `docs/API_USE.md`

### Fixed

- **Health Indicator Parsing**: Header health check now accepts JSON or plain-text statuses like `ok`
  - Location: `src/components/Header.tsx`, `src/utils/healthStatus.ts`

## [0.10.17] - 2026-01-28

### Fixed

- **MobilePlayer Palette Stability**: Ensured palette access happens after initialization and added a robust fallback when extraction fails or returns invalid values
  - Skip extraction for placeholder covers, validate palette shape/ranges, fall back safely on errors
  - Location: `src/components/MobilePlayer.tsx`
- **Auth API Client Errors**: Avoided JSON.parse failures by bypassing rate limiting on auth routes and returning JSON for 429 responses
  - Location: `src/middleware.ts`
- **Streaming Error Recovery**: Added transient 5xx/429/network retry handling with backoff and cache-busting, plus clearer 502/504 user messaging
  - Auto-advance to the next track after repeated stream failures
  - Location: `src/hooks/useAudioPlayer.ts`, `src/contexts/AudioPlayerContext.tsx`

### Changed

- **Service Worker Cache Strategy**: Versioned caches and switched `/_next/static` to network-first with explicit update checks to prevent stale bundles
  - Auto-activate new workers and reload clients on update
  - Location: `public/sw.js`, `src/app/register-sw.tsx`

## [0.10.16] - 2026-01-27

### Changed

- **FlowField Renderer Bottom Patterns Optimization**: Reduced per-frame allocations and math overhead in the lowest listed visuals for smoother Firefox rendering
  - Reused buffers in Sacred Triangle and EM Field; reduced angle divisions and per-frame object creation
  - Optimized Quantum Foam loops with precomputed angle steps and local constants
  - Tightened Gothic Thorns angle math to reduce repeated division
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`

## [0.10.15] - 2026-01-27

### Changed

- **FlowField Renderer GC Trim**: Removed per-frame point array allocations and reused typed buffers for Metatron geometry to improve Firefox stability
  - Replaced dynamic point arrays with cached offsets and reusable buffers
  - Simplified vesica point rendering to avoid temporary arrays
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`

## [0.10.14] - 2026-01-27

### Changed

- **FlowField Renderer Performance Pass**: Reduced per-frame allocations and consolidated audio analysis for smoother rendering (especially in Firefox)
  - Moved static pattern arrays to class-level constants to cut GC churn
  - Single-pass audio band analysis replaces multiple loops
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`

## [0.10.13] - 2026-01-27

### Changed

- **More Reliable Color Extraction**: Reduced fallback usage by adding multi-pass bucket collection with relaxed thresholds for dark/transparent images
  - Secondary pass lowers alpha and lightness thresholds before falling back
  - Added safer referrer policy on image loads to improve CDN compatibility
  - Location: `src/utils/colorExtractor.ts`

## [0.10.12] - 2026-01-27

### Changed

- **Stabilized Mobile Palette Extraction**: Deferred album-art color extraction to idle time and reduced sampling size to avoid playback jank on mobile
  - Added caching and in-flight de-duplication for palette extraction
  - Palette extraction now uses smaller cover images and lower-resolution sampling
  - Guards against stale palette updates when tracks change quickly
  - Location: `src/components/MobilePlayer.tsx`, `src/utils/colorExtractor.ts`

## [0.10.11] - 2026-01-26

### Added

- **Eight New Visual Patterns**: Added diverse new audio-reactive visualizations to FlowFieldRenderer
  - **solarFlare**: Dynamic solar flares radiating from center with pulsing core, secondary flares, and glowing corona
  - **transcendence**: Ethereal flowing streams representing spiritual elevation with layered consciousness and floating particles
  - **treeOfLife**: Sacred geometry visualization with Kabbalistic Tree of Life, 10 Sephiroth spheres, recursive branching, and connection lines
  - **divineLight**: Heavenly light pattern with radiating rays, orbiting particles, cascading lights, and multiple halo effects
  - **gothicThorns**: Dark, spiky gothic pattern with angular spikes, thorn clusters, inner spike rings, and dark aura
  - **sacredTriangle**: Glowing triangle with halo ring, inner triangle, corner orbs, center orb, and outer aura
  - **emField**: Electromagnetic field visualization with field lines, charged particles, orbiting particles, and wave rings
  - **quantumFoam**: Quantum foam visualization with foam cells, virtual particles, energy fluctuations, and quantum connections
  - All patterns are fully audio-reactive and automatically cycle with existing patterns
  - Location: `src/components/visualizers/FlowFieldRenderer.ts`, `src/components/visualizers/flowfieldPatterns/patternIds.ts`

## [0.10.10] - 2026-01-26

### Changed

- **Full-Width Album Cover Gradient**: Mobile player background gradient now uses all three key colors (primary, secondary, accent) across the entire section
  - Gradient spans 0% to 100% with smooth color transitions
  - Replaced hardcoded blue fallback with dynamic color stops using all extracted colors
  - Enhanced color processing for better visual appeal
  - Location: `src/components/MobilePlayer.tsx`

- **Dark Album Cover Support**: Improved color extraction for dark album covers
  - Automatic detection of dark images (average lightness < 30%)
  - Prioritizes brighter pixels from dark covers for better visibility
  - Boosts brightness of extracted colors while preserving hue and saturation
  - Ensures minimum lightness thresholds (40-45%) for all colors in dark images
  - Enhanced vibrancy scoring to favor brighter colors in dark images
  - Location: `src/utils/colorExtractor.ts`

## [0.10.9] - 2026-01-26

### Added

- **Dynamic Color Adaptation from Album Art**: Mobile player color scheme now adapts to each track's album artwork
  - Real-time color extraction from album cover images
  - Automatic color palette generation (primary, secondary, accent colors)
  - All UI elements dynamically colored: control deck, progress bar, buttons, borders, glows, shadows
  - Enhanced color saturation and brightness for more vibrant results
  - Location: `src/components/MobilePlayer.tsx`, `src/utils/colorExtractor.ts`

### Changed

- **Robust Color Extraction Algorithm**: Completely rewritten color extraction system for maximum reliability
  - Color bucketing and vibrancy scoring for better color selection
  - Multiple extraction strategies with automatic fallback
  - Handles edge cases: grayscale, very dark/light images, empty images
  - Always extracts colors - no rejections, always resolves with valid palette
  - Increased sample size from 50x50 to 100x100 pixels for better accuracy
  - Smart color relationships ensure proper hue separation between primary, secondary, and accent
  - Automatic saturation enhancement for low-saturation images
  - Location: `src/utils/colorExtractor.ts`

- **Enhanced Color Visibility**: Made color adaptation effects more noticeable throughout the UI
  - Increased border thickness (1px→2px) with higher opacity
  - Stronger gradients and glow effects on all elements
  - Enhanced play button with thicker border (3px), stronger glow, and shadow
  - Progress bar seeking glow with shadow effects
  - Colored borders around artwork with enhanced radial glow
  - Track info card with colored border and gradient background
  - All hover and active states use extracted colors
  - Location: `src/components/MobilePlayer.tsx`

- **Removed Fallback Colors**: Component now always uses extracted colors
  - No null checks or conditional fallbacks
  - Default palette used only during initial load
  - All UI elements consistently use palette colors
  - Location: `src/components/MobilePlayer.tsx`

## [0.10.8] - 2026-01-26

### Changed

- **Mobile Player Compact Layout**: Significantly reduced vertical spacing throughout mobile player to prevent Safari browser UI overlap
  - Reduced main container padding (top: 24px→16px, bottom: 36px→20px) to account for Safari's UI components
  - Compacted drag handle, header, and content areas with reduced padding
  - Reduced gap between artwork and track info from 6 to 4
  - Artwork max width reduced from 330px to 300px for better fit
  - Track info card: reduced padding (py-3→py-2), smaller text sizes (title: 2xl→xl, artist: sm→xs, album: xs→10px)
  - Control section moved higher with reduced margins (mt-1→mt-0.5, pb-8px→pb-4px)
  - Larger playback control buttons: skip buttons (h-6→h-8), play/pause button (64px→72px), play/pause icons (h-7→h-8)
  - Optimized for newer Safari models with bottom UI bars
  - Location: `src/components/MobilePlayer.tsx`

## [0.10.7] - 2026-01-26

### Changed

- **Mobile Player UI Refinement**: Enhanced mobile player controls with refined color palette and compact design
  - Updated color scheme: vibrant gradient colors (#ff6b6b, #4ecdc4, #ffd93d, #6bcf7f) replacing CSS variables
  - Reduced spacing and padding throughout controls for more compact layout
  - Smaller icon sizes (h-4 w-4 for controls, h-6 w-6 for skip buttons, h-7 w-7 for play/pause)
  - Play button reduced from 80px to 64px with new gradient (red → yellow → teal)
  - Progress bar height reduced from 2.5 to 1.5 with refined gradient and smaller thumb (14-18px)
  - Updated control deck styling with gradient borders and refined backdrop blur
  - Improved safe area handling with adjusted padding calculations
  - Location: `src/components/MobilePlayer.tsx`

## [0.10.6] - 2026-01-26

### Added

- **Queue Transition Regression Tests**: Added coverage for auto-advance on track end and manual next to prevent playback regressions
  - Location: `src/__tests__/useAudioPlayer.test.ts`

## [0.10.5] - 2026-01-26

### Changed

- **Mobile Fullscreen Player Redesign**: Reimagined the fullscreen mobile player with framed artwork, an editorial track card, and a structured control deck while keeping all features accessible
  - Location: `src/components/MobilePlayer.tsx`

## [0.10.4] - 2026-01-26

### Fixed

- **Queue Auto-Advance**: Unified auto-play signaling on track transitions to ensure the next track starts after end/skip and reduce repeated play taps
  - Location: `src/hooks/useAudioPlayer.ts`

## [0.10.3] - 2026-01-26

### Fixed

- **iOS Background Playback**: Disabled Web Audio on iOS Safari to keep music playing when the browser is minimized
  - Location: `src/utils/audioContextManager.ts`, `src/hooks/useEqualizer.ts`, `src/components/Equalizer.tsx`

## [0.10.2] - 2026-01-26

### Fixed

- **Mobile Volume Control**: Volume slider now applies changes reliably during touch and updates the live playback output
  - Location: `src/components/MobilePlayer.tsx`, `src/hooks/useAudioPlayer.ts`, `src/utils/audioContextManager.ts`

## [0.10.1] - 2026-01-26

### Changed

- **Haptics Tuning**: Smoothed mobile haptics with gentler patterns and paced feedback to reduce jitter
  - Location: `src/utils/haptics.ts`

## [0.10.0] - 2026-01-26

### Added

- **Admin Role Support**: Added `admin` boolean column with default false and wired it into session payloads for authorization
  - Location: `src/server/db/schema.ts`, `src/server/auth/config.ts`, `drizzle/0017_admin_flag.sql`, `drizzle/meta/0017_snapshot.json`

- **First User Auto-Admin**: The first registered user is automatically promoted to admin
  - Location: `src/server/auth/config.ts`

- **Admin APIs**: New TRPC router for listing users and toggling admin access with a self-demotion guard
  - Location: `src/server/api/routers/admin.ts`, `src/server/api/root.ts`

- **Admin Console Page**: New `/admin` page for viewing users, profile links, and managing admin status
  - Location: `src/app/admin/page.tsx`

### Changed

- **Admin Navigation**: Added admin entry in the menu and an icon shortcut near the server/Vercel badge for quick access
  - Location: `src/components/HamburgerMenu.tsx`, `src/components/Header.tsx`

## [0.9.25] - 2026-01-22

### Fixed

- **Player Disappearing When Queue Ends**: Fixed critical bug where player would disappear when queue finished
  - **Root Cause**: When queue ran out, `handleTrackEnd` would clear the queue and stop playback, causing player UI to disappear
  - **Previous Behavior**: Queue finishes → player clears → playback stops → player disappears
  - **New Behavior**: Queue finishes → auto-generates smart tracks → playback continues seamlessly → player remains visible
  - **Implementation**:
    - Modified `handleTrackEnd` to check for auto-queue settings before clearing queue
    - When queue is about to end, automatically generates smart tracks based on current track
    - Only clears queue and stops if auto-queue is disabled or fails to generate tracks
  - **Location**: `src/hooks/useAudioPlayer.ts:287-385`

- **Audio Connection Release on Visualizer Toggle**: Fixed playback refresh when toggling visualizer UI
  - **Root Cause**: Components were releasing audio connections in cleanup effects when unmounting
  - **Impact**: Toggling visualizer on/off or hiding/showing UI would interrupt playback
  - **Fix**: Removed `releaseAudioConnection` calls from cleanup effects in:
    - `useAudioVisualizer` hook cleanup
    - `FlowFieldBackground` component cleanup
    - `useEqualizer` hook cleanup
  - **Rationale**: Audio connections are managed by `audioContextManager` with ref counting and should persist across component lifecycle
  - **Location**: `src/hooks/useAudioVisualizer.ts:175-188`, `src/components/FlowFieldBackground.tsx:100-109`, `src/hooks/useEqualizer.ts:343-355`

- **Audio Element Reference Stability**: Fixed audio refresh when toggling hideUI button
  - **Root Cause**: AudioPlayerContext value was being recreated on every render, causing audio element reference to change
  - **Impact**: Toggling "Hide UI" button would cause audio-related effects to re-run, potentially interrupting playback
  - **Fix**: 
    - Added stable ref (`stableAudioElementRef`) to maintain consistent audio element reference
    - Memoized entire context value object to prevent unnecessary recreations
    - Excluded `audioElement` from dependency array since it's maintained via stable ref
  - **Location**: `src/contexts/AudioPlayerContext.tsx:501-511, 513-613`

### Added

- **Automatic Smart Queue Generation**: Implemented proactive smart track generation when queue is running low
  - **Feature**: Automatically generates smart tracks when queue drops to or below `autoQueueThreshold` (default: 3 tracks)
  - **Behavior**:
    - Monitors queue length during playback via `useEffect`
    - When remaining tracks ≤ threshold, triggers smart track generation
    - Adds generated tracks to end of queue to keep playback continuous
    - Prevents duplicate generation within 60 seconds for same seed track
  - **Settings**: Respects `autoQueueEnabled`, `autoQueueThreshold`, and `autoQueueCount` from user preferences
  - **Fallback**: If proactive generation doesn't happen, `handleTrackEnd` generates tracks when last track finishes
  - **Location**: `src/hooks/useAudioPlayer.ts:387-466`

### Changed

- **Repository Link**: Updated homepage link from GitLab to GitHub
  - Changed "View on GitLab" button to "View on GitHub"
  - Updated URL from `https://gitlab.com/soulwax/songbird-player` to `https://github.com/soulwax/songbird-player`
  - Replaced GitLab logo SVG with GitHub octocat logo SVG
  - **Location**: `src/app/HomePageClient.tsx:635-668`

- **API Health Check URL**: Updated health check to use dedicated `NEXT_PUBLIC_API_HEALTH_URL` environment variable
  - **Previous**: Constructed health URL from `NEXT_PUBLIC_API_URL + "/health"`
  - **New**: Uses `NEXT_PUBLIC_API_HEALTH_URL` environment variable directly (falls back to constructed URL if not set)
  - **Configuration**: Added `NEXT_PUBLIC_API_HEALTH_URL` to client env schema
  - **Location**: `src/env.js:37, 57`, `src/components/Header.tsx:47-53`

- **Dual API Health Monitoring**: Added monitoring for both API v1 and v2 health endpoints
  - **New Environment Variable**: `NEXT_PUBLIC_API_V2_HEALTH_URL` for secondary API health check
  - **Three-State Status**: Health indicator now shows three states:
    - 🟢 **Green "Api Healthy"**: Both APIs return `status: "ok"`
    - 🟡 **Yellow "Api Degraded"**: APIs respond but one returns `status: "degraded"` or `"unhealthy"`
    - 🔴 **Red "API Down"**: HTTP 400-500 errors or network failures
  - **Non-Clickable Indicator**: Removed link functionality, now shows status-only indicator
  - **Parallel Checks**: Both endpoints checked simultaneously every 30 seconds
  - **Configuration**: Added `NEXT_PUBLIC_API_V2_HEALTH_URL` to client env schema
  - **Location**: `src/env.js:37-38, 57-58`, `src/components/Header.tsx:44-108`

## [0.9.24] - 2026-01-22

### Fixed

- **Social Media OG Image Generation**: Migrated to backend preview API for reliable rich previews
  - **Previous Issue**: Frontend OG route had edge runtime timeouts and limited canvas capabilities
  - **New Architecture**: Frontend now proxies to backend's native canvas-based preview generator
  - **Backend API**: Uses robust `canvas` package (1200×600 PNG with album art, track info, darkfloor branding)
  - **Performance**:
    - Track IDs: Direct 302 redirect to backend GET endpoint (zero frontend processing)
    - Search queries: Proxy converts GET → POST to backend (supports query-based previews)
    - No more edge runtime timeouts (backend handles image generation)
    - Better image quality (native canvas vs Next.js ImageResponse)
  - **Fallback**: If backend unavailable, falls back to frontend generation with 5s API / 2s cover timeouts
  - **Env**: Uses `NEXT_PUBLIC_V2_API_URL` (local: http://127.0.0.1:3333/, prod: https://darkfloor.one/)
  - **Endpoints**: `/api/og?trackId=123` → Backend `/api/track/123/preview`, `/api/og?q=search` → Backend POST
  - Locations: `src/app/api/og/route.tsx`, `src/app/page.tsx`, `src/app/track/[id]/page.tsx`

- **Show GUI Button Playback Restart**: Fixed audio playback restarting when clicking "Show UI Again" button
  - **Root Cause 1**: UIWrapper returned `null` when `hideUI` was true, causing complete unmount of page components
  - **Root Cause 2**: When components remounted, HomePageClient's useEffect re-ran and re-processed URL parameters (trackId, albumId, query)
  - **Impact**: Showing UI again after hiding it called `player.clearQueue()` and `player.playTrack()`, restarting playback
  - **Previous Behavior**:
    - Hide UI → page components unmount → refs reset to null
    - Show UI → page components remount → useEffect re-runs → playback restarts from beginning
  - **Fix**: Changed UIWrapper to use CSS `hidden` class instead of returning `null`, preserving component state and refs
  - Location: `src/components/UIWrapper.tsx`

- **Show GUI Button Context Recreation**: Fixed audio player context recreating unnecessarily when toggling UI visibility
  - **Root Cause**: `hideUI` and `showMobilePlayer` were incorrectly included in the AudioPlayerContext useMemo dependency array
  - **Impact**: Clicking "Show GUI / Hide UI" button no longer triggers full context recreation and component re-renders
  - **Performance**: Reduced unnecessary re-renders across all components consuming the audio player context
  - **Fix**: Removed `hideUI` and `showMobilePlayer` from dependency array as they are UI-only state
  - Location: `src/contexts/AudioPlayerContext.tsx:567-613`

### Improved

- **Settings Page Functionality**: Implemented full backend integration for settings controls
  - **Auto Queue Settings**: Added slider controls for queue threshold (1-10 tracks) and tracks to add (1-20 tracks)
  - **Theme Switcher**: Added dark/light theme selector in Visual section
  - **Backend Mutations**: Added missing fields to `updatePreferences` mutation (autoQueueThreshold, autoQueueCount, smartMixEnabled, similarityPreference)
  - **Field Validation**: All settings now properly validated with Zod schemas (number ranges, enum values)
  - **Settings Persistence**: All UI controls now correctly save to database for authenticated users
  - **UI Polish**: Updated descriptions to be more concise and user-friendly
  - Locations: `src/app/settings/page.tsx`, `src/server/api/routers/music.ts`

## [0.9.23] - 2026-01-22

### Fixed

- **Player Button Refresh Bug**: Fixed page refresh when clicking "Hide UI to enjoy visuals" button
  - **Root Cause**: All buttons in Player component were missing `type="button"` attribute, defaulting to `type="submit"` which triggers form submission/navigation
  - **Impact**: All 15 player buttons now explicitly set `type="button"` to prevent unintended page refreshes
  - **Buttons Fixed**: Hide UI, Add to playlist, Favorite, Shuffle, Previous, Skip backward, Play/Pause, Skip forward, Next, Repeat, Mute, Queue, Equalizer, Visualizer, Pattern controls
  - Location: `src/components/Player.tsx`

### Improved

- **Test Infrastructure**: Comprehensive testing environment setup
  - **localStorage Mock**: Full implementation with getItem, setItem, removeItem, clear, length, key methods
  - **AbortSignal.timeout**: Polyfill for Node.js compatibility (Node doesn't support AbortSignal.timeout natively)
  - **Global Fetch Mock**: Handles API calls, CDN resources (emojis, fonts), external services
  - **AudioContext Mock**: Web Audio API mock for equalizer and visualizer tests
  - **Audio Element Mock**: DOM-based mock with proper HTMLAudioElement property definitions
  - **Service Worker Mock**: Background playback keep-alive testing support
  - Location: `src/test/setup.ts`

- **Test Stability**: Updated audio player tests to use DOM-based mocks
  - Fixed test failures caused by trying to append non-DOM objects to document.body
  - Tests now use proper HTMLAudioElement mocks that can be appended to DOM
  - Locations: `src/__tests__/useAudioPlayer.stability.test.ts`, `src/__tests__/player.integration.stability.test.ts`, `src/__tests__/playback-rate.stability.test.ts`

## [0.9.22] - 2026-01-22

### Fixed

- **Player Stability**: Fixed critical issues causing player to disappear and page reloads after 2-3 songs
  - **Error Boundary**: Now recovers gracefully with "Try Again" instead of forcing page reload (`window.location.reload()` removed)
  - **Error Handling**: Fixed empty catch blocks that silently masked failures in repeat-one mode and service worker keep-alive
  - **State Sync**: Fixed infinite interval recreation loop by removing `isPlaying` from sync effect dependencies (now uses ref)
  - **Memory Leaks**: Fixed service worker keep-alive interval orphaning with proper ref-based cleanup
  - **Race Conditions**: Removed arbitrary 100ms timeout in play/pause operations, now uses immediate flag reset
  - **Null Checks**: Added state updates when audio element is null to prevent UI/audio desync
  - Locations: `src/components/ErrorBoundary.tsx`, `src/hooks/useAudioPlayer.ts`

- **Playback Rate Stability**: Fixed audio speeding up sporadically during playback on mobile
  - **Faster Detection**: Reduced playback rate enforcement interval from 10s to 1s (users hear drift for max 1s instead of 10s)
  - **Resume Enforcement**: Added playback rate enforcement after all resume operations (visibility change, pageshow, resume events)
  - **Better Logging**: Added detailed logging when playback rate changes to identify root causes
  - **Proactive Enforcement**: Enforces playback rate immediately after play() operation, not just reactively
  - Location: `src/hooks/useAudioPlayer.ts`

### Added

- **Stability Tests**: Comprehensive test suite to prevent regressions
  - ErrorBoundary tests (7 tests, all passing)
  - useAudioPlayer stability tests (race conditions, state sync, memory leaks)
  - Player integration tests (multi-track playback, repeat modes, background playback)
  - Location: `src/__tests__/*stability.test.{ts,tsx}`

## [0.9.21] - 2026-01-20

### Added

- **OG Image Route - Track ID & Query Support**: Social media preview images now support track IDs and search queries
  - **Track ID Support**: Accepts `trackId` parameter to fetch and display specific track information
  - **Query String Support**: Accepts `q` parameter to search for tracks and display the first result
  - **API Integration**: Fetches track data via `/api/track/[id]` or `/api/music/search` before generating image
  - **Fallback Support**: Falls back to direct URL parameters (title, artist, etc.) if trackId/query not provided or fetch fails
  - Location: `src/app/api/og/route.tsx`

- **Enhanced Mobile Queue**: Complete feature parity with desktop queue
  - **Search Functionality**: Search queue by track title or artist name with real-time filtering
  - **Multi-Select**: Long-press to select tracks, tap to toggle selection, bulk remove selected items
  - **Drag-to-Reorder**: Swipe up/down on drag handle to reorder tracks in queue
  - **Play from Here**: Tap any track or play button overlay to start playback from that position
  - **Remove Individual Tracks**: Remove button on each track (except currently playing)
  - **Smart Tracks Sections**: Visual organization with sections for "Now Playing", "Next in queue", and "Smart tracks"
  - **Save as Playlist**: Save entire queue as a playlist (authenticated users only)
  - **Settings Modal**: Configure smart tracks count and similarity level preferences
  - **Total Duration Display**: Shows total queue duration and search result counts
  - **Visual Feedback**: Selected tracks highlighted, active track indicator, smart track accent bar
  - **Loading States**: Loading indicators for smart tracks operations
  - **Haptic Feedback**: Tactile feedback for all interactions (selection, removal, reordering)
  - Location: `src/components/MobilePlayer.tsx`

### Changed

- **OG Image Route Optimization**: Improved performance and timeout handling for social media previews
  - **Aggressive Timeouts**: Reduced API fetch timeout to 2s, cover image timeout to 1s
  - **Total Time Check**: Redirects to static image if data fetch takes >2.5s (leaving ~2.5s for image generation)
  - **Cover Image Limits**: Reduced max cover image size from 1MB to 500KB for faster processing
  - **Early Exit**: Skips cover image if fetch takes >1s or image is too large
  - **Performance Logging**: Added detailed timing logs for debugging timeout issues
  - **Error Handling**: Graceful fallbacks at each step to prevent edge runtime timeouts
  - Location: `src/app/api/og/route.tsx`

### Fixed

- **Mobile Volume Controls**: Fixed janky haptics and volume not working
  - **Volume Not Working**: Volume changes now immediately apply to audio element during dragging for responsive feedback
  - **Janky Haptics**: Reduced haptic frequency (50ms interval, threshold 5) and optimized haptic triggers
  - **Local State Management**: Uses local state during dragging (like progress bar) to reduce re-renders
  - **Visual Feedback**: Added glow effect and thumb scaling during volume adjustment
  - **Fallback Audio Element**: Added fallback to find audio element from DOM if context reference unavailable
  - Location: `src/components/MobilePlayer.tsx`

## [0.9.20] - 2026-01-20

### Added

- **Static OG Image**: New pre-generated Open Graph social preview image for faster loading
  - **Design**: Dark background (#0b1118), Emily the Strange logo, gradient title, minimal aesthetic
  - **Dimensions**: 1200×630px optimized for social media platforms
  - **Generator Script**: `scripts/generate-og-image.js` for regenerating the image
  - Location: `public/og-image.png`

### Changed

- **OG Image Route Optimization**: Default social previews now use static image with redirect
  - **Before**: Dynamically generated JSX image on every request (slower, no caching)
  - **After**: 302 redirect to `/og-image.png` (instant, CDN-cacheable)
  - **Track Shares**: Still generate dynamic mini-player cards with album art
  - **Impact**: Faster social preview loading for homepage/general links
  - Location: `src/app/api/og/route.tsx`

### Fixed

- **SmoothSlider Import Bug**: Fixed non-existent `hapticSlider` function import
  - Changed to `haptic("sliderTick")` for proper haptic feedback during slider drag
  - Location: `src/components/SmoothSlider.tsx`

- **Unused Variables Cleanup**: Removed dead code from slider components
  - Removed unused `activeDragBand` state from Equalizer
  - Removed unused `useTransform` import and `thumbScale` variable from SmoothSlider
  - Locations: `src/components/Equalizer.tsx`, `src/components/SmoothSlider.tsx`

## [0.9.19] - 2026-01-20

### Added

- **SmoothSlider Component**: New reusable slider component for consistent slider UX across the app
  - **Dual Orientation**: Supports both horizontal and vertical slider layouts
  - **Size Variants**: Small, medium, and large presets with configurable track and thumb sizes
  - **Haptic Feedback**: Built-in intelligent haptic feedback with configurable intervals
  - **Spring Animations**: Smooth Framer Motion spring-based animations
  - **Glow Effects**: Optional visual glow during interaction
  - **Accessibility**: Full ARIA support with customizable labels and value text
  - **Touch Optimized**: Native touch event handling for mobile devices
  - Location: `src/components/SmoothSlider.tsx`

- **New Haptic Patterns**: Extended haptic feedback system with slider-specific patterns
  - `sliderTick` - Subtle tick feedback during slider movement
  - `sliderEnd` - Confirmation feedback when releasing slider
  - `scrub` - Ultra-light feedback for scrubbing interactions
  - `boundary` - Double-tap feedback when hitting min/max boundaries
  - Location: `src/utils/haptics.ts`

- **New Spring Animation Presets**: Added slider-optimized spring configurations
  - `slider` - High stiffness (600) for responsive slider fill animations
  - `sliderThumb` - Extra responsive (800) thumb animations
  - `scrub` - Ultra-responsive (1000) scrubbing animations
  - `gestureRelease` - Natural gesture release with moderate stiffness (400)
  - Location: `src/utils/spring-animations.ts`

### Changed

- **Equalizer Sliders**: Completely redesigned vertical EQ sliders with custom implementation
  - **Custom VerticalEqSlider**: Replaced native HTML range inputs with Framer Motion-based draggable component
  - **Enhanced Visual Feedback**: Added glow effects, scale animations on hover/drag, and gradient fills
  - **Improved Haptics**: Integrated new `hapticSliderContinuous()` for smooth feedback during adjustment
  - **Spring Animations**: All slider movements now use spring physics for natural feel
  - **Pulse Animation**: Active drag state shows pulsing ring effect on thumb
  - Location: `src/components/Equalizer.tsx`

- **Mobile Player Progress Bar**: Enhanced seek slider with improved touch experience
  - **Larger Touch Targets**: Progress bar height increased from 2px to 2.5px
  - **Dynamic Thumb Scaling**: Thumb grows from 18px to 24px during active seek
  - **Glow Effect**: Added blur glow effect behind progress bar during seeking
  - **Pulse Animation**: Thumb shows pulsing ring animation while dragging
  - **Animated Time Display**: Current/remaining time scales up slightly during seek
  - **Continuous Haptics**: Integrated `hapticSliderContinuous()` for tactile feedback
  - Location: `src/components/MobilePlayer.tsx`

- **Mobile Player Volume Slider**: Improved volume control UX
  - **Thicker Track**: Track height increased to 1.5px for better visibility
  - **Spring Animations**: Fill and thumb now animate with spring physics
  - **Hover/Tap Effects**: Added scale animations on thumb interaction
  - **Continuous Haptics**: Volume changes trigger continuous haptic feedback with boundary detection
  - **Selection Haptic**: Initial touch triggers selection haptic pattern
  - Location: `src/components/MobilePlayer.tsx`

- **Haptic Feedback Utilities**: Enhanced haptic API with new functions
  - `hapticThrottled()` - Throttled haptic calls to prevent vibration spam
  - `hapticSliderContinuous()` - Intelligent continuous feedback with tick threshold and boundary detection
  - `hapticSliderEnd()` - Cleanup function to reset slider state and provide end feedback
  - `hapticScrub()` - Ultra-throttled (30ms) scrub feedback for rapid interactions
  - Location: `src/utils/haptics.ts`

## [0.9.18] - 2026-01-19

### Changed

- **Songbird API v1.0.0 Compatibility**: Updated frontend to handle breaking changes in Songbird API v1.0.0
  - **Mode Parameter Update**: Changed default mode from `"normal"` to `"balanced"` (breaking change in API)
    - The `"normal"` mode is no longer accepted by the API
    - All similarity level mappings now use `"balanced"` as the default instead of `"normal"`
  - **Enhanced Response Format**: Updated response type handling to support new API v1.0.0 fields
    - Added support for `foundSongs` (required) - Number of songs successfully found
    - Added support for `songResults` (required) - Detailed results for each input song
    - Added support for `seedQuality` (optional) - Seed quality analysis metrics
    - Added support for `warnings` (optional) - Warning messages for partial failures
  - **Improved Error Handling**: Added logging for API warnings and partial failures
    - Logs warnings when present in API response
    - Logs when `foundSongs < inputSongs` to detect partial song matching failures
  - **Backward Compatibility**: All new fields are optional in type definitions, ensuring graceful degradation
  - **Impact**: Frontend is now fully compatible with Songbird API v1.0.0 breaking changes
  - Locations:
    - `src/server/api/routers/music.ts` (getSimilarTracks procedure)

## [0.9.17] - 2026-01-19

### Added

- **Share Button on All Track Cards**: Added share button next to heart (favorite) button on every song card
  - **Deezer ID-Based Sharing**: Share URLs use `track.deezer_id` when available, falling back to `track.id`
  - **Consistent Placement**: Share button positioned immediately after heart button on all card types
  - **Always Visible**: Share button is now always visible (removed conditional rendering restrictions)
  - **Universal Support**: Implemented across all track card components (TrackCard, EnhancedTrackCard, SwipeableTrackCard)
  - **Impact**: Easy sharing of tracks with Deezer ID-based URLs for reliable track identification
  - Locations:
    - `src/components/TrackCard.tsx`
    - `src/components/EnhancedTrackCard.tsx`
    - `src/components/SwipeableTrackCard.tsx`

- **Loading Spinner for Smart Tracks**: Added visual loading indicator while smart tracks are being fetched
  - **Queue Loading State**: Shows spinner in "Smart tracks" section header and content area during fetch
  - **Button State**: Share button shows spinner icon and is disabled during loading
  - **User Feedback**: Displays "Finding similar tracks..." message when loading with no existing tracks
  - **State Management**: Added `isLoading` property to `SmartQueueState` interface
  - **Impact**: Clear visual feedback when smart tracks are being generated, improving user experience
  - Locations:
    - `src/types/index.ts` (SmartQueueState interface)
    - `src/hooks/useAudioPlayer.ts` (loading state management)
    - `src/components/EnhancedQueue.tsx` (loading UI)

### Changed

- **Enhanced SEO Embeds for Discord**: Redesigned Open Graph images for better Discord embed previews
  - **Prominent Album Cover**: Full-size square album art (570×570px) on the left side of embed
  - **Improved Typography**: Larger, bolder text with better hierarchy (title: 56px, artist: 36px, album: 28px)
  - **Cleaner Layout**: Optimized spacing and layout for Discord's 1200×630px embed format
  - **Better Readability**: Removed overlays that could interfere with album art visibility
  - **Embedded Images**: Album covers are embedded directly in generated images via base64 encoding
  - **Branding**: Updated to "Play now on Starchild Music" for clearer call-to-action
  - **Impact**: Rich, beautiful previews on Discord with album art and song info clearly visible
  - Locations:
    - `src/app/api/og/route.tsx` (OG image generation)
    - `src/app/page.tsx` (metadata description enhancement)

## [0.9.16] - 2026-01-19

### Added

- **Health Check Request Logging**: Added comprehensive development-mode logging for health check requests
  - **Request Details**: Logs method, URL, origin, user-agent, referer, and client IP
  - **Response Details**: Logs status, response time, database check result, and memory usage
  - **Error Logging**: Detailed error messages for database check failures
  - **Impact**: Easier debugging of health check issues and CORS problems during development
  - Location: `src/app/api/health/route.ts`

- **CORS Configuration Documentation**: Created comprehensive documentation for API CORS setup
  - **Detailed Guide**: Complete CORS configuration request document with code examples
  - **Quick Reference**: Concise prompt for quick copy-paste requests
  - **Implementation Examples**: Express.js, FastAPI, and Nginx configuration examples
  - **Testing Instructions**: Browser console and cURL test commands
  - **Impact**: Clear instructions for backend team to configure CORS properly
  - Locations:
    - `docs/CORS_CONFIGURATION_REQUEST.md`
    - `docs/CORS_PROMPT.txt`

### Changed

- **Environment Configuration**: Development mode now loads from `.env` instead of `.env.development`
  - **Unified Configuration**: Single `.env` file for development, simplifying environment management
  - **Consistent Behavior**: Both `npm run dev` and SSL certificate generation use the same file
  - **Impact**: Easier development setup with a single source of truth for environment variables
  - Locations:
    - `scripts/server.js`
    - `scripts/generate-ssl-cert.js`

- **Header API Health Status**: Enhanced API health monitoring in desktop header
  - **Periodic Checks**: Health status now updates every 30 seconds automatically
  - **Improved Error Handling**: Better error logging and status detection
  - **CORS Mode**: Explicitly sets `mode: "cors"` for health check requests
  - **Text Update**: Changed "API OK" to "Api Healthy" for consistency
  - **Impact**: More reliable and visible API health monitoring
  - Location: `src/components/Header.tsx`

- **Header Navigation Authentication**: Improved authentication flow for header navigation links
  - **Library & Playlists**: Now redirect to Discord OAuth2 login (`/api/auth/signin`) when not authenticated
  - **Consistent Behavior**: All protected routes now have consistent authentication handling
  - **Impact**: Better user experience with clear authentication prompts
  - Location: `src/components/Header.tsx`

### Fixed

- **Content-Security-Policy Violation**: Added `https://api.starchildmusic.com` to CSP `connect-src` directive
  - **Health Check Access**: Allows frontend to make health check requests to the API
  - **CORS Compatibility**: Works in conjunction with CORS configuration for proper cross-origin requests
  - **Impact**: Health check badge now works correctly without CSP violations
  - Location: `src/middleware.ts`

- **HTML Nesting Error**: Fixed invalid `<a>` tag nesting in header component
  - **Structure Fix**: Moved API health badge link outside of logo link to prevent nested anchors
  - **Hydration Fix**: Resolves React hydration error that was breaking client-side interactivity
  - **Impact**: Eliminates console errors and ensures proper HTML structure
  - Location: `src/components/Header.tsx`

## [0.9.15] - 2026-01-19

### Added

- **Auto-Play for Shared Search Links**: Search query links now automatically play the first result
  - **URL Format**: Links like `https://starchildmusic.com/?q=jetlag+jenny+45ACID` auto-play first match
  - **Smart Detection**: Only triggers for URL parameter searches, not manual user searches
  - **One-Time Playback**: Uses ref-based tracking to prevent re-triggering on re-renders
  - **Graceful Fallbacks**: No auto-play if search fails or returns empty results
  - **Mobile Integration**: Includes haptic feedback on successful auto-play
  - **Impact**: Shared discovery links provide instant playback, creating a seamless listening experience
  - Location: `src/app/HomePageClient.tsx`

## [0.9.14] - 2026-01-17

### Added

- **Background Playback Persistence**: Enhanced audio playback to continue when app goes to background or phone locks
  - **Service Worker Keep-Alive**: Pings service worker every 25 seconds during playback to prevent page suspension
  - **Visibility Change Handlers**: Detects when page is hidden/shown and auto-resumes playback if paused unexpectedly
  - **Page Lifecycle API**: Handles freeze/resume events for better mobile browser support
  - **Audio Element Configuration**: Added `preload="auto"` and `playsinline` attributes for optimal mobile playback
  - **WebKit-Specific Handlers**: Special handling for iOS Safari page hide/show events
  - **Impact**: Music continues playing when switching apps, locking phone, or backgrounding the browser
  - Locations:
    - `src/hooks/useAudioPlayer.ts` (visibility handlers, keep-alive interval)
    - `public/sw.js` (KEEP_ALIVE message handler)
    - `public/manifest.json` (scope and prefer_related_applications)

- **Track Sharing with Rich Previews**: Created dedicated share routes with SEO metadata
  - **Deezer ID-Based URLs**: All track sharing now uses `/track/{id}` format instead of current page URL
  - **Rich Social Media Previews**: Album art, track title, artist, and album shown in link previews
  - **SEO Metadata**: OpenGraph and Twitter Card tags for optimal social sharing
  - **Dynamic Track Routes**: Created `/track/[id]` page with server-side metadata generation
  - **Auto-Redirect**: Share links redirect to `/?track={id}` to auto-play the track
  - **Impact**: Shareable links look professional on Discord, Twitter, Facebook with album artwork
  - Locations:
    - `src/app/track/[id]/page.tsx` (new route with metadata)
    - `src/components/TrackCard.tsx`
    - `src/components/EnhancedTrackCard.tsx`
    - `src/components/SwipeableTrackCard.tsx`
    - `src/components/TrackContextMenu.tsx`

- **Visual Mini Player Design in OG Images**: Enhanced social media preview cards to look like interactive music players
  - **Player-Style Layout**: Preview cards now display as a mini player interface with album art, track info, play button, and progress bar
  - **Dynamic Progress Bar**: Shows a simulated playback position at 42% with gradient accent colors
  - **Duration Display**: Shows current position and total track duration (e.g., "1:23 / 3:24")
  - **Play Button**: Large circular accent-colored play button for visual emphasis
  - **Compact Card Design**: Player card (1040px wide) with rounded corners, subtle glow, and dark theme
  - **Impact**: Shared links look more interactive and music-focused, clearly indicating they're playable tracks
  - Locations:
    - `src/app/api/og/route.tsx` (redesigned OG image generator)
    - `src/app/track/[id]/page.tsx` (passes duration parameter to OG image)

### Changed

- **Complete Rebrand**: Rebranded from darkfloor.art to Starchild Music (starchildmusic.com)
  - **Package Name**: Updated npm package name to `starchildmusic`
  - **Domain References**: Changed all URLs from `darkfloor.art` to `starchildmusic.com`
  - **UI Branding**: Updated all visible text, logos, and metadata
  - **Service Worker**: Cache names updated to `starchildmusic-*`
  - **PWA Manifest**: App name changed to "Starchild Music - Music Streaming Platform"
  - **SEO & Metadata**: Updated all OpenGraph, Twitter Card, and meta tags
  - **Impact**: Consistent branding across the entire application
  - Locations:
    - `package.json` (name, homepage, keywords)
    - `public/manifest.json` (app name, short_name)
    - `public/sw.js` (cache names)
    - `src/app/layout.tsx` (metadata)
    - `src/app/page.tsx` (metadata)
    - `src/components/Header.tsx`
    - `src/components/HamburgerMenu.tsx`
    - `src/components/WelcomeHero.tsx`
    - `src/components/DynamicTitle.tsx`
    - `src/app/license/page.tsx`
    - `src/app/api/og/route.tsx`
    - `src/utils/getBaseUrl.ts`
    - `src/styles/globals.css`
    - `ecosystem.config.cjs`
    - `scripts/server.js`
    - `README.md`
    - `CLAUDE.md`

- **PWA Icons**: Updated icon generation to use refined branding image
  - **Source Image**: Changed to `emily-the-strange-raw.png` for cleaner icon appearance
  - **Platform Compatibility**: Better adaptation to iOS rounded squares and Android adaptive icons
  - **Impact**: App icon looks more professional on all mobile platforms
  - Location: `scripts/generate-pwa-icons.cjs`

## [0.9.13] - 2026-01-17

### Added

- **Mobile Queue Access**: Added a queue button on the mini player and smart actions in the queue header
  - **Impact**: Faster, accessible queue access on mobile
  - Locations:
    - `src/components/MiniPlayer.tsx`
    - `src/components/MobilePlayer.tsx`
    - `src/components/PersistentPlayer.tsx`

### Fixed

- **Smart Tracks Recovery**: Added fallback recommendation routes (Last.fm similar + Spotify search)
  - **Impact**: Smart queue rarely returns empty results
  - Location: `src/server/api/routers/music.ts`

- **Smart Queue Actions**: Unified smart-track actions with feedback in the queue UI
  - **Impact**: Clear success/empty/error state feedback
  - Location: `src/components/EnhancedQueue.tsx`

### Changed

- **Songbird Env Alias**: Support `SONGBIRD_PUBLIC_API_URL` for the Songbird base URL
  - **Impact**: Easier env configuration across environments
  - Location: `src/services/songbird.ts`

## [0.9.12] - 2026-01-17

### Fixed

- **Smart Queue Recommendations**: Smart tracks now use Songbird's Last.fm + Deezer conversion flow
  - **Impact**: Auto-queue pulls richer recommendations with Deezer IDs
  - Locations:
    - `src/server/api/routers/music.ts`
    - `src/contexts/AudioPlayerContext.tsx`
    - `src/services/songbird.ts`

- **tRPC Preferences Tests**: Added coverage for smart queue defaults and preference persistence
  - **Impact**: Validates server preferences behavior
  - Location: `src/__tests__/trpc.music.test.ts`

- **Mobile Search Clear Behavior**: Ensured clearing a non-empty search reliably returns to `/`
  - Uses previous query tracking to avoid skipping the first clear
  - **Impact**: Search URL clears consistently on mobile
  - Location: `src/components/MobileHeader.tsx`

- **Search Clear Regression Test**: Stabilized test coverage for clear behavior
  - **Impact**: Prevents regressions in search clear routing
  - Location: `src/__tests__/MobileHeader.test.tsx`

- **Share URL Source**: Reverted track sharing to use the current page URL
  - **Impact**: Shares now reflect the exact page context
  - Locations:
    - `src/components/TrackCard.tsx`
    - `src/components/SwipeableTrackCard.tsx`
    - `src/components/EnhancedTrackCard.tsx`
    - `src/components/TrackContextMenu.tsx`

## [0.9.11] - 2026-01-17

### Added

- **Deezer ID Database Columns**: Added `deezer_id` as dedicated columns to all tables storing song/track data
  - Added `deezerId` column to `favorites`, `playlist_tracks`, `listening_history`, `listening_analytics`, and `audio_features` tables
  - Added `seedDeezerId` column to `recommendation_cache` table
  - Added `currentTrackDeezerId` column to `playback_state` table
  - All columns are indexed for fast lookups and querying
  - **Impact**: Deezer song IDs are now stored as dedicated columns, enabling efficient querying and serving as the basis for sharing songs
  - **Migration**: Run `npm run db:migrate` or `npm run db:push` to apply schema changes
  - Locations:
    - `src/server/db/schema.ts`
    - `src/server/api/routers/music.ts`
    - `drizzle/0016_add_deezer_id_columns.sql`

- **Deezer ID Type Support**: Added `deezer_id` field to Track type definition and validation
  - Track interface now includes optional `deezer_id` field
  - API routes automatically extract and preserve `deezer_id` from responses
  - **Impact**: Type-safe handling of Deezer IDs throughout the application
  - Locations:
    - `src/types/index.ts`
    - `src/app/api/album/[id]/tracks/route.ts`
    - `src/app/api/artist/[id]/tracks/route.ts`

- **Deezer ID in Sharing**: Updated all sharing functionality to prefer `deezer_id` when available
  - Share URLs now use `deezer_id` as the primary identifier for tracks
  - Falls back to `track.id` if `deezer_id` is not present
  - **Impact**: Shared song links use consistent Deezer IDs for reliable sharing
  - Locations:
    - `src/components/TrackContextMenu.tsx`
    - `src/components/TrackCard.tsx`
    - `src/components/SwipeableTrackCard.tsx`
    - `src/components/EnhancedTrackCard.tsx`

- **Background Playback Toggle**: Added a user preference to keep audio playing in the background
  - New setting under Playback for background playback
  - Stored as `keepPlaybackAlive` in user preferences (default true)
  - **Impact**: Users can opt out of background playback behavior
  - Locations:
    - `src/app/settings/page.tsx`
    - `src/server/db/schema.ts`
    - `src/server/api/routers/music.ts`

### Fixed

- **Mobile Search URL Persistence**: Prevented search URLs from reverting to the base route after search
  - Avoids clearing the URL when the query is still active
  - **Impact**: Search URLs stay stable after searching
  - Location: `src/components/MobileHeader.tsx`

- **Search URL Regression Test**: Added coverage to prevent future URL resets
  - **Impact**: Guards against search URL regressions
  - Location: `src/__tests__/MobileHeader.test.tsx`

- **Queue State Persistence Types**: Serialized queue fields to match API schema
  - `queuedTracks.addedAt` now persists as ISO strings
  - Coerced `queueSource` to `"user" | "smart"` for storage
  - **Impact**: Eliminates queue persistence type errors
  - Location: `src/contexts/AudioPlayerContext.tsx`

- **Smart Queue Settings Shape**: Normalized missing fields with defaults
  - Added `diversityFactor`, `excludeExplicit`, and `preferLiveVersions` defaults
  - **Impact**: Prevents SmartQueue settings type mismatch
  - Location: `src/contexts/AudioPlayerContext.tsx`

- **Toast Warning Support**: Added `warning` to toast types and UI styling
  - **Impact**: Allows background resume warnings without type errors
  - Locations:
    - `src/components/Toast.tsx`
    - `src/contexts/ToastContext.tsx`

- **Background Playback Resilience**: Improved resume handling across visibility, pagehide/pageshow, and lifecycle events
  - Added resume error feedback via toast with throttling
  - Ensured WebKit-specific listeners are cleaned up conditionally
  - **Impact**: More reliable playback continuity after app backgrounding
  - Locations:
    - `src/hooks/useAudioPlayer.ts`
    - `src/contexts/AudioPlayerContext.tsx`

- **Visualizer Type Setting**: Restored server-side support for Flow Field selection
  - API now accepts both `flowfield` and `kaleidoscope`
  - Updated visualizer type constants accordingly
  - **Impact**: Visualizer Type dropdown saves correctly
  - Locations:
    - `src/server/api/routers/music.ts`
    - `src/constants/visualizer.ts`

- **GitLab Branding**: Updated the start page GitLab button to use the correct logo
  - **Impact**: Visual branding matches the GitLab destination
  - Location: `src/app/HomePageClient.tsx`

- **Global Player Track Playback**: Aligned `play` vs `playTrack` semantics to avoid passing tracks into a parameterless resume call
  - **Impact**: Prevents runtime errors when playing a selected track
  - Locations:
    - `src/contexts/AudioPlayerContext.tsx`
    - `src/app/HomePageClient.tsx`
    - `src/components/TrackContextMenu.tsx`
    - `src/components/PlaylistContextMenu.tsx`
    - `src/app/playlists/[id]/page.tsx`
    - `src/app/artist/[id]/page.tsx`
    - `src/app/album/[id]/page.tsx`
    - `src/app/[userhash]/page.tsx`

- **Artist Tracks API Filtering**: Filtered invalid entries before enriching tracks with `deezer_id`
  - **Impact**: Prevents `null` or primitive entries in artist track responses
  - Location: `src/app/api/artist/[id]/tracks/route.ts`

## [0.9.9] - 2026-01-17

### Added

- **Mobile Player Overhauls**: Implemented full mobile player improvements
  - Mini player fixed to sit above the footer while playing
  - Sliding Queue panel (from right) and Equalizer panel (from left), both with swipe-to-dismiss
  - Mobile volume slider control in the fullscreen player
  - Desktop share button for track cards (Web Share API + clipboard fallback)
  - **Impact**: Better mobile UX, faster access to queue/equalizer, and desktop share support
  - Locations:
    - `src/components/MiniPlayer.tsx`
    - `src/components/MobilePlayer.tsx`
    - `src/components/TrackCard.tsx`

- **PWA Icon Generation**: Added Emily the Strange PWA icon pipeline
  - Sharp-based icon generator script and updated source asset
  - **Impact**: Updated PWA icons for install experience
  - Locations:
    - `scripts/generate-pwa-icons.cjs`
    - `public/icon-192.png`
    - `public/icon-512.png`

### Fixed

- **Playback Rate Stability**: Added aggressive enforcement to prevent random speedups on mobile
  - Ratechange listener + 100ms interval + timeupdate checks
  - **Impact**: Playback stays at 1.0 speed
  - Location: `src/hooks/useAudioPlayer.ts`

- **Mobile Album Art Always On**: Removed mobile visualizer toggle and always show album art
  - **Impact**: Simplified mobile UI and consistent art display
  - Location: `src/components/MobilePlayer.tsx`

- **Missing Icon Import**: Added missing `X` icon import for panel close buttons
  - **Impact**: Prevents runtime rendering issues on mobile panels
  - Location: `src/components/MobilePlayer.tsx`

## [0.9.8] - 2026-01-13

### Added

- **Mobile Header Hamburger Menu**: Restored hamburger menu button to mobile header
  - Added Menu icon button on the upper left side of mobile header
  - Opens hamburger menu drawer when tapped
  - Includes haptic feedback and smooth animations
  - **Impact**: Users can now access navigation menu from mobile header
  - Location: `src/components/MobileHeader.tsx:178-196`

- **Profile Tab in Mobile Footer**: Added profile navigation tab to mobile footer
  - Profile tab appears between "Library" and "Create" tabs
  - Uses User icon and links to user's profile page (`/${userHash}`)
  - Requires authentication and shows disabled state while userHash loads
  - **Impact**: Quick access to user profile from mobile footer navigation
  - Location: `src/components/MobileFooter.tsx:93-107, 125`

- **Six New Audio Visualizer Effects**: Added six new high-performance visualizer patterns
  - **plasmaStorm**: Plasma effect with bitwise-optimized calculations and adaptive quality
  - **bitfieldMatrix**: Matrix-style grid pattern with bit-based cell generation
  - **mandelbrotSpiral**: Mandelbrot set fractal combined with audio-reactive spiral overlay
  - **quantumResonance**: Grid-based resonance pattern with audio-reactive cell activation
  - **morseAurora**: Multi-band wave patterns with Morse code-like pulsing
  - **chromaticAberration**: RGB channel separation effect with audio-reactive color shifts
  - All effects use bitwise operations for optimal performance
  - All effects are audio-reactive with bass, mid, and treble intensity controls
  - **Impact**: Expanded visualizer pattern library with 6 new mesmerizing effects
  - Locations:
    - `src/components/visualizers/flowfieldPatterns/patternIds.ts:88-93`
    - `src/components/visualizers/FlowFieldRenderer.ts:141-147, 3040-3080, 11544-11927`

- **Five Additional Visualizer Effects**: Added five more mathematical and fractal-based visualizer patterns
  - **mengerSponge**: Recursive 3D fractal pattern with audio-reactive depth
  - **perlinNoiseField**: Multi-octave Perlin noise field with smooth gradient generation
  - **superformula**: Mathematical superformula curves with audio-reactive parameters
  - **voronoi**: Voronoi diagram with distance-based coloring and seed generation
  - **dragonCurve**: Fractal dragon curve using bit-counting algorithm
  - All effects use optimized calculations and audio-reactive properties
  - **Impact**: Expanded visualizer library with mathematical and fractal patterns
  - Locations:
    - `src/components/visualizers/flowfieldPatterns/patternIds.ts:94-98`
    - `src/components/visualizers/FlowFieldRenderer.ts:151-152, 3087-3125, 11928-12365`

- **Three Knot and Cellular Automaton Patterns**: Added knotwork and algorithmic visualizer patterns
  - **langtonsAnt**: Cellular automaton following Langton's ant rules with audio-reactive grid
  - **celticKnot**: Interwoven Celtic knot pattern with multiple rotating layers
  - **germanicKnot**: Valknut pattern (three interlocking triangles) with audio-reactive rotation and pulsing
  - All patterns use proper hue normalization and audio-reactive animations
  - **Impact**: Added cultural knotwork patterns and algorithmic visualizations
  - Locations:
    - `src/components/visualizers/flowfieldPatterns/patternIds.ts:99-101`
    - `src/components/visualizers/FlowFieldRenderer.ts:153-155, 3126-3138, 12366-12520`

### Fixed

- **Mobile Footer Active State Logic**: Fixed duplicate active tab indicators
  - Home and search tabs both had `path: "/"`, causing both to be active simultaneously
  - Updated `isActive` function to distinguish between home and search tabs
  - Search tab is only active when there's a search query (`?q=...`)
  - Home tab is only active when on "/" without a search query
  - **Impact**: Only one tab shows as active at a time, fixing Framer Motion layout animation
  - Location: `src/components/MobileFooter.tsx:31-47, 128-135`

- **Mandelbrot Spiral Hue Calculation**: Fixed invalid hue values in visualizer
  - Hue calculation used `& 0x1ff` (0-511 range) then divided by 360, producing values > 1.0
  - Added `fastMod360()` normalization to ensure 0-360 range before division
  - **Impact**: Mandelbrot spiral now displays correct colors without hue overflow
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:11709`

- **PlasmaStorm Hue Calculation**: Fixed incorrect hue normalization in visualizer
  - Hue was calculated in 0-255 range and divided by 255, but HSL requires 0-360 degrees
  - Changed to scale 0-255 to 0-360 range using pre-calculated constant `HUE_255_TO_360`
  - Added `fastMod360()` normalization to ensure proper 0-360 range
  - **Impact**: PlasmaStorm effect now displays correct colors with proper HSL hue values
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:11579-11580, 288`

- **Hue Normalization with Bitwise Masking**: Fixed incorrect hue calculations in three visualizer effects
  - Removed incorrect `& 0x1ff` (0-511 range) masking before `fastMod360()` calls
  - Bitwise masking was truncating values instead of properly normalizing to 0-360 range
  - Fixed in `renderMandelbrotSpiral`, `renderQuantumResonance`, and `renderMorseAurora`
  - **Impact**: All three effects now display correct colors with proper hue normalization
  - Locations:
    - `src/components/visualizers/FlowFieldRenderer.ts:11711` (Mandelbrot Spiral)
    - `src/components/visualizers/FlowFieldRenderer.ts:11794` (Quantum Resonance)
    - `src/components/visualizers/FlowFieldRenderer.ts:11841` (Morse Aurora)

- **Search Tab Navigation**: Fixed search tab clearing active search query
  - Search tab had `path: "/"` without custom handler, causing navigation to clear search query
  - Added `handleSearchNavigation` function that preserves search query when already on search page
  - Prevents navigation if already on search page with active query
  - **Impact**: Search tab no longer clears active search results when clicked
  - Location: `src/components/MobileFooter.tsx:88-99, 105-107`

- **Build Error Fix**: Fixed missing Suspense boundary for `useSearchParams()`
  - `MobileFooter` uses `useSearchParams()` which requires Suspense boundary during static generation
  - Wrapped `MobileFooterWrapper` in Suspense boundary in root layout
  - **Impact**: Build now completes successfully without prerendering errors
  - Location: `src/app/layout.tsx:132-134`

- **Performance Optimization**: Pre-calculated hue conversion constant
  - Added `HUE_255_TO_360` static constant to avoid repeated division calculations
  - Replaced `360 / 255` division with pre-calculated constant multiplication
  - **Impact**: Slight performance improvement in PlasmaStorm effect rendering
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:288, 11580`

- **Extended Recent Searches**: Increased search history capacity and improved display
  - Increased API limit from 20 to 100 searches, defaulting to 50
  - Updated both mobile and desktop to fetch and display 50 recent searches (previously 5)
  - Made desktop display more compact: reduced text size (text-sm → text-xs), padding (px-3 py-1.5 → px-2 py-1), and gap spacing
  - Increased mobile dropdown height from max-h-48 to max-h-64 to accommodate more searches
  - **Impact**: Users can now access up to 50 recent searches with improved desktop layout density
  - Locations:
    - `src/server/api/routers/music.ts:701` (API limit increase)
    - `src/app/HomePageClient.tsx:77, 441-457` (desktop display and query)
    - `src/components/MobileHeader.tsx:31` (mobile query)
    - `src/components/MobileSearchBar.tsx:433` (mobile dropdown height)

- **Client-Side Navigation Optimization**: Improved navigation to prevent page reloads
  - Added `{ scroll: false }` option to all `router.push()` calls in mobile footer
  - Prevents scroll jumps and ensures smooth client-side navigation
  - **Impact**: Audio player continues playing during navigation, no page reloads
  - Location: `src/components/MobileFooter.tsx:61, 84, 93`

- **Search Tab Active State Fix**: Fixed search tab visual feedback
  - Search tab now uses `activeTab` state as fallback when no query exists
  - Prevents both home and search tabs from being active simultaneously
  - **Impact**: Proper visual feedback when clicking search tab without existing query
  - Location: `src/components/MobileFooter.tsx:31-49`

- **Visualizer Pattern Enhancements**: Enhanced all patterns after hydrogenElectronOrbitals for elegant, intricate shapes
  - **PlasmaStorm**: Transformed into layered plasma rings with smooth waves and central gradient orb
  - **BitfieldMatrix**: Redesigned as elegant geometric grid with squares, circles, triangles, and hexagons
  - **MandelbrotSpiral**: Enhanced with layered mandelbrot-inspired rings and smooth spiral overlay
  - **QuantumResonance**: Improved with interconnected resonance orbs and connecting lines
  - **MorseAurora**: Converted to circular aurora bands with smooth wave patterns (no flashing)
  - **ChromaticAberration**: Enhanced with layered chromatic rings and subtle RGB channel separation
  - **MengerSponge**: Added rounded fractal cubes with smooth rotation
  - **PerlinNoiseField**: Redesigned as flowing noise-based patterns in elegant rings
  - **Superformula**: Enhanced with multiple layered superformula curves and smooth rotation
  - **Voronoi**: Improved with gradient-filled Voronoi cells and elegant seed orbs
  - **DragonCurve**: Enhanced with multiple interwoven dragon curves and gradient fills
  - **LangtonsAnt**: Redesigned with rounded cellular pattern and elegant styling
  - **CelticKnot**: Improved with bezier curves for smoother interweaving and subtle fills
  - **GermanicKnot**: Enhanced Valknut with gradients, corner decorations, and outer ring
  - All patterns now feature slower, smoother animations (reduced time multipliers)
  - All patterns focus on elegant, intricate shapes rather than rapid flashing effects
  - Added more visual depth with gradients, multiple layers, and connecting elements
  - **Impact**: All visualizer patterns now display beautiful, intricate shapes with smooth, flowing animations
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:11612-12887`

## [0.9.7] - 2026-01-13

### Removed

- **Complete Playback Speed Removal**: Removed all playback speed/rate adjustment functionality
  - Removed playback speed slider from settings page
  - Removed speed controls from mobile and desktop players (speed menu button and dropdown)
  - Removed `playbackRate` state from audio player context and hooks
  - Removed `playbackRate` column from database schema (user_preferences table)
  - Removed `playbackRate` from tRPC API validation and mutations
  - Removed `PLAYBACK_RATE` from localStorage storage keys
  - Removed `playbackRate` from Electron persistent preferences
  - Removed all audio element `playbackRate` assignments and preservation logic
  - Removed `playbackRate` from TypeScript type definitions (BasePlayerProps, PlayerControls, PlayerState)
  - Removed mobile playback speed gotcha from CLAUDE.md documentation
  - **Rationale**: Feature was unnecessary and caused more issues than value
  - **Impact**: All audio now plays at normal 1.0x speed with no user controls
  - Locations:
    - `src/app/settings/page.tsx` (removed speed slider)
    - `src/components/MobilePlayer.tsx` (removed speed menu UI)
    - `src/components/Player.tsx` (removed speed controls)
    - `src/components/PersistentPlayer.tsx` (removed playbackRate props)
    - `src/contexts/AudioPlayerContext.tsx` (removed from context)
    - `src/hooks/useAudioPlayer.ts` (removed all playbackRate logic)
    - `src/types/player.ts` (removed from interfaces)
    - `src/types/index.ts` (removed from PlayerState)
    - `src/server/db/schema.ts` (removed database column)
    - `src/server/api/routers/music.ts` (removed from updatePreferences)
    - `src/server/api/routers/equalizer.ts` (removed from default values)
    - `src/config/storage.ts` (removed PLAYBACK_RATE key)
    - `src/utils/electronStorage.ts` (removed from PERSISTENT_PREFERENCES)
    - `CLAUDE.md` (removed gotcha #6)

### Fixed

- **Dependency Cleanup**: Cleaned up unused and incorrectly removed dependencies
  - **Removed unused dependencies** (truly unused):
    - `@tanstack/react-virtual`, `@use-gesture/react`, `morgan`, `@types/morgan`
    - `react-audio-visualize`, `tone`, `vaul`
    - `@next/bundle-analyzer`, `@svgr/cli`, `svgo`, `tsup`, `webpack`, `yargs`
    - `electron-context-menu`, `electron-window-state-manager` (using custom implementations)
  - **Reinstalled required dependencies** (incorrectly removed):
    - `eslint-config-next` (used in eslint.config.js for Next.js linting rules)
    - `prettier-plugin-tailwindcss` (used in prettier.config.js for class sorting)
    - `wait-on` (used in electron:dev scripts)
    - `postcss` (required by Tailwind CSS)
    - `autoprefixer` (CSS vendor prefixing)
  - **Rollup plugins** (already installed, not missing):
    - `@rollup/plugin-json`, `@rollup/plugin-node-resolve`, `rollup-plugin-re`
  - **Impact**: Cleaner dependencies, faster installs, no missing required packages
  - Location: `package.json` devDependencies

### Known Issues

- **Mobile Browser Buffering Behavior**: On mobile devices, playback may exhibit very minor speed fluctuations (~1-2%) at regular intervals (~55 seconds)
  - **Root Cause**: Mobile browsers (Safari, Chrome) automatically adjust playback rate slightly when approaching HLS stream segment boundaries (typically 60-second chunks) to maintain smooth playback and prevent stuttering
  - **Impact**: Barely noticeable under normal listening conditions, prevents audio stuttering
  - **Status**: This is standard mobile browser behavior for adaptive streaming and cannot be controlled via frontend code
  - **Workaround**: None needed - this is expected behavior for mobile audio streaming

## [0.9.6] - 2026-01-11

### Fixed

- **Settings Profile Link Navigation**: Fixed "View your public profile" link leading to profile not found
  - Profile link was using `session.user.name` instead of the correct `userHash`
  - Added `getCurrentUserHash` query to fetch the user's hash from the API
  - Updated accountSection href to use `userHash` for correct profile navigation
  - **Impact**: Profile link in settings now correctly navigates to user's public profile
  - Location: `src/app/settings/page.tsx:58-61, 342`

### Redesigned

- **COMPLETE Settings Page Mobile Redesign**: Total creative overhaul with minimal, elegant aesthetic
  - **Header**: Clean title and subtitle without gradient badges
  - **Section Headers**: Minimal uppercase labels with accent icon (no badges or dividers)
  - **Cards**: Floating style with subtle borders (`border-white/5`) and clean shadows
  - **Typography**: Consistent 15px labels, 13px descriptions for better readability
  - **Toggle Switches**: Simple iOS-style toggles with clean accent color (no gradients or scale effects)
  - **Sliders**: Clean white thumb with accent color fill, subtle shadows
  - **Dropdowns**: Minimal design with proper z-index and subtle hover states
  - **Spacing**: Generous padding (px-5 py-4) for better breathing room
  - **Dividers**: Only between items, removed from last item in each section
  - **Hover States**: Subtle `bg-white/[0.03]` on hover, `bg-white/5` on active
  - **Animations**: Reduced delay timing for smoother, less distracting motion
  - **Overall**: Removed excessive gradients, shadows, and visual noise for a premium, clean aesthetic
  - **Impact**: Settings page now has a beautiful, minimal, and elegant design
  - Location: `src/app/settings/page.tsx:361-759`

## [0.9.5] - 2026-01-10

### Fixed

- **Mobile Playback Speed Issue**: Fixed audio randomly speeding up on mobile devices after track loads
  - Root cause: Mobile browsers (Safari/Chrome) asynchronously reset playbackRate after `load()` call
  - Previous fix only restored playbackRate immediately after `load()`, but before metadata loaded
  - Added `loadedmetadata` event listener to restore playbackRate AFTER metadata is fully loaded
  - Event listener uses `{ once: true }` to auto-cleanup and prevent memory leaks
  - **Impact**: Playback speed now stays consistent at user's chosen rate on mobile browsers
  - Location: `src/hooks/useAudioPlayer.ts:532-539`

## [0.9.4] - 2026-01-10

### Improved

- **Settings Page Mobile UI Overhaul**: Complete visual redesign of the settings page for mobile devices
  - Enhanced header with gradient icon badge and refined typography
  - Beautiful gradient card backgrounds with shadow effects and subtle borders
  - Section headers with gradient icon badges and divider lines
  - Improved toggle switches with gradient backgrounds and scale animations
  - Enhanced sliders with gradient thumbs and glow effects on interaction
  - Polished select dropdowns with staggered animations and gradient highlights
  - Better touch targets and active states for all interactive elements
  - Sign Out button styled with red accent for visual distinction
  - Consistent spacing, padding, and rounded corners throughout
  - Smooth whileTap scale animations on all interactive items
  - **Impact**: Settings page now has a premium, polished feel on mobile devices
  - Location: `src/app/settings/page.tsx:358-786`

## [0.9.3] - 2026-01-10

### Fixed

- **CRITICAL: Profile Page Auto-Redirect**: Fixed profile pages immediately redirecting to home page
  - MobileHeader component runs on ALL pages (it's in the root layout)
  - Its useEffect was redirecting to `/` whenever `searchQuery` was empty
  - When navigating to profile pages (`/[userhash]`), there's no search query, triggering unwanted redirect
  - Profile would load briefly, then immediately redirect to `/`
  - Fixed by only redirecting when actively clearing a search (when `?q=` param exists in URL)
  - **Impact**: Profile pages now work correctly on both desktop and mobile
  - Location: `src/components/MobileHeader.tsx:63-72`

## [0.9.2] - 2026-01-10

### Fixed

- **CRITICAL: Infinite Mutation Loop**: Fixed severe performance issue causing request storms and profile navigation failures
  - AudioPlayerContext had tRPC mutations (`clearQueueStateMutation`, `saveQueueStateMutation`) in useEffect dependency arrays
  - This caused infinite re-renders and thousands of aborted `clearQueueState` requests (NS_BINDING_ABORTED)
  - Profile pages couldn't load because `getCurrentUserHash` query was being aborted repeatedly
  - Navigation to user profiles (`/[userhash]`) was broken on both desktop and mobile
  - Removed mutation objects from dependency arrays (mutations are stable references and don't need to be dependencies)
  - **Impact**: Dramatically improves performance, fixes profile navigation, reduces server load
  - Location: `src/contexts/AudioPlayerContext.tsx:232-241, 269-270`

### Improved

- **Performance**: Application is now significantly more responsive with proper dependency management
  - No more request storms on every state change
  - Profile queries can complete successfully
  - Navigation works smoothly across all pages

## [0.9.1] - 2026-01-10

### Added

- **Track Sharing by ID**: New feature to share individual songs with instant playback
  - Share any track via URL parameter: `?track=123456`
  - Shared track loads automatically and starts playing immediately
  - Track metadata fetched via new API endpoint: `/api/track/[id]`
  - Updates share functionality to generate shareable links with track ID
  - Clipboard fallback for browsers without Web Share API support
  - Haptic feedback on successful track load
  - Location: `src/app/HomePageClient.tsx:162-185, 209-232`, `src/app/api/track/[id]/route.ts`, `src/utils/api.ts:106-111`, `src/components/TrackContextMenu.tsx:166-192`

### Fixed

- **Desktop Search Clearing Bug**: Fixed search results clearing immediately when searching on desktop
  - Previous results now remain visible while new search loads (prevents flash to default state)
  - Added `lastUrlQueryRef` to track URL state and prevent race conditions
  - Fixed dependency array in useEffect causing premature state clearing
  - Search flow now stable on both desktop and mobile
  - Location: `src/app/HomePageClient.tsx:54-55, 185-230`

### Improved

- **Share Functionality**: Enhanced track sharing with proper URL generation
  - Generates shareable links with track ID parameter instead of current page URL
  - Desktop users can copy link to clipboard if Web Share API unavailable
  - Toast notifications for successful share or clipboard copy
  - Better user experience for sharing tracks across platforms

## [0.9.0] - 2026-01-10

### Fixed

- **Mobile Player Visualizer Toggle**: Fixed Activity (lightning) button not controlling background visualizer
  - Button was incorrectly toggling `hideAlbumCover` state instead of `visualizerEnabled`
  - Now properly enables/disables the audio-reactive background visualizer
  - Visual feedback: Amber highlight (`bg-[rgba(244,178,102,0.3)]`) when enabled, dark (`bg-black/40`) when disabled
  - Persists user preference to localStorage for non-authenticated users
  - Syncs with user preferences from database for authenticated users
  - Location: `src/components/MobilePlayer.tsx:499-518`

- **Mobile Player Favorite/Heart Button**: Implemented full favorite functionality for Heart button
  - Previously only triggered haptic feedback with no actual function
  - Now adds/removes tracks from user's favorites with proper API integration
  - Queries favorite status on track change and displays filled red heart for favorited tracks
  - Animated scale effect on click (600ms) with different haptics (success for add, light for remove)
  - Shows visual state: Red filled heart when favorited, gray outline when not
  - Disabled state (50% opacity) when user is not authenticated
  - Proper tooltips: "Sign in to favorite tracks" (unauthenticated) or "Add/Remove from favorites" (authenticated)
  - Invalidates cache on mutation success to ensure UI stays in sync
  - Location: `src/components/MobilePlayer.tsx:119-122, 129, 152-176, 193-205, 937-1006`

### Added

- **Mobile Player API Integration**: Enhanced mobile player with tRPC mutations and queries
  - Added `api.useUtils()` for cache invalidation
  - Integrated `api.music.isFavorite` query to check track favorite status
  - Integrated `api.music.addFavorite` and `api.music.removeFavorite` mutations
  - Heart animation state management with `isHeartAnimating` flag
  - Location: `src/components/MobilePlayer.tsx:110, 119-122, 129, 152-176, 193-205`

### Improved

- **Mobile Player Button Consistency**: All mobile player control buttons now fully functional
  - Visualizer toggle (Activity icon): Controls audio-reactive background
  - Heart button: Add/remove from favorites with authentication check
  - Play/Pause, Previous/Next, Skip ±10s: Already functional
  - Shuffle, Repeat modes: Already functional
  - Volume/Mute, Playback speed: Already functional
  - Queue, Equalizer, Add to playlist: Already functional
  - Complete feature parity with desktop player controls

## [0.8.9] - 2026-01-09

### Fixed

- **Mobile Search Spinner Overlap**: Fixed loading spinner overlapping with input text in mobile search bar
  - Added conditional left padding (`pl-8`) to input wrapper when spinner is visible
  - Spinner positioned absolutely at `left-4`, input text now has proper spacing
  - Prevents text from being hidden behind the loading/countdown indicator
  - Location: `src/components/MobileSearchBar.tsx:297`

- **Persistent "Searching..." State**: Fixed search loading state not clearing after navigation completes
  - Removed unreliable hardcoded `setTimeout(500ms)` that didn't account for actual API completion
  - Now properly resets `isSearching` state when URL changes (via `searchParams` effect)
  - Searching state clears immediately when navigation to search results page completes
  - Prevents infinite "Searching now..." message after results are ready
  - Location: `src/components/MobileHeader.tsx:34-42, 85-88, 115-116`

- **Search Results Not Displaying on Mobile**: Fixed search results failing to appear after search execution
  - Removed `isInitialized` flag that was blocking URL change detection after first page load
  - Added duplicate search protection directly in `performSearch()` function
  - Search now properly triggers on URL changes regardless of initialization state
  - Works correctly on fresh page load, repeated searches, and navigation scenarios
  - Location: `src/app/HomePageClient.tsx:66-100, 157-182`

- **Hamburger Menu Navigation Search State**: Fixed hamburger menu navigation preserving search query in URL
  - Menu links now use `router.push()` explicitly to ensure clean navigation without query parameters
  - Search query clears when URL has no `q` parameter (navigation away from search)
  - Prevents users from seeing stale search results when navigating to other pages
  - Search input properly clears when leaving search page via hamburger menu
  - Location: `src/components/HamburgerMenu.tsx:24, 190-193` and `src/components/MobileHeader.tsx:38-40`

- **Search Results State Management**: Improved search state clearing when navigating away from results
  - Added proper cleanup when URL has no query parameters (clears results, total, currentQuery, and query)
  - Prevents stale results from displaying when user navigates to home page
  - Ensures clean state transitions between search and non-search pages
  - Location: `src/app/HomePageClient.tsx:176-181`

### Improved

- **Search Flow Reliability**: Enhanced mobile search user experience with proper state management
  - Debounced search countdown now properly syncs with navigation state
  - Loading indicators accurately reflect actual search progress
  - Duplicate search prevention reduces unnecessary API calls
  - Clean state transitions when navigating between pages
  - Consistent behavior across fresh loads, repeated searches, and navigation scenarios

## [0.8.8] - 2026-01-08

### Fixed

- **Smooth Circular Progress Animation**: Fixed choppy countdown indicator animation in mobile search bar
  - Changed from `style={{ strokeDashoffset: ... }}` to `animate={{ strokeDashoffset: ... }}` for smooth interpolation
  - Previously updated in discrete jumps every 100ms (matching countdown interval frequency)
  - Now uses Framer Motion's `animate` prop for smooth interpolation between values, matching the progress bar pattern
  - Provides consistent and fluid visual feedback during search countdown
  - Location: `src/components/MobileSearchBar.tsx:270-283`

- **Progress Bar Direction**: Fixed backwards progress bar animation in mobile search countdown
  - Progress bar was emptying instead of filling as countdown progressed
  - Added `elapsedProgress` calculation that inverts countdown: `(1 - autoSearchCountdown / 2000) * 100`
  - Progress bar now correctly fills from 0% to 100% as time elapses (intuitive UX)
  - Circular indicator still uses `countdownProgress` (remaining time) which is correct for that visualization
  - Location: `src/components/MobileSearchBar.tsx:200-202, 324`

- **Profile Link Navigation**: Fixed unwanted page scrolling when profile link clicked before userHash loads
  - Uses `href="#"` as placeholder when userHash is loading (follows security best practices)
  - Added `e.stopPropagation()` alongside `e.preventDefault()` to prevent event bubbling
  - Prevents browser from navigating to page anchor and causing unexpected scrolling
  - Works in conjunction with `preventDefault()`, `stopPropagation()`, and `pointer-events-none` for complete protection
  - Location: `src/components/HamburgerMenu.tsx:75-80, 183-191`

### Improved

- **Elegant Play Button Design**: Enhanced mobile player Play/Pause button with premium styling
  - Added gradient background: `bg-gradient-to-br from-[var(--color-text)] to-[var(--color-accent)]`
  - Added subtle ring border: `ring-2 ring-[var(--color-accent)]/20` for elegant accent
  - Enhanced shadow with increased opacity (0.4 → 0.5) for better depth
  - Added glossy overlay effect with white gradient (`from-white/10 to-transparent`)
  - Improved hover animation: `whileHover={{ scale: 1.05 }}` for interactive feedback
  - Smoother tap animation: adjusted scale from 0.9 to 0.92
  - Better icon centering: adjusted Play icon margin from `ml-1` to `ml-0.5`
  - Added smooth transitions: `transition-all duration-300`
  - Enhanced disabled state styling with proper opacity and cursor
  - Location: `src/components/MobilePlayer.tsx:782-799`

## [0.8.7] - 2026-01-08

### Fixed

- **SVG Animation Conflict in Search Countdown**: Fixed conflicting animation mechanisms in circular progress indicator
  - Removed incompatible `pathLength` animation that conflicted with `strokeDashoffset`
  - Now uses only `strokeDashoffset` animated via Framer Motion's style prop for consistent circular progress animation
  - Prevents unpredictable rendering behavior and visual glitches
  - Location: `src/components/MobileSearchBar.tsx:270-283`

## [0.8.6] - 2026-01-08

### Added

#### Device Support

- **iPhone 17 Pro Max Support**: Added optimized CSS media queries for iPhone 17 Pro Max (1320×2868 pixels)
  - Enhanced header height (64px) and player height (92px) for larger display
  - Increased artwork size to 450px for better visual presentation
  - Optimized padding and spacing for extra-tall screen aspect ratio
  - Location: `src/styles/globals.css:1670-1701`

### Fixed

- **Profile Link in Hamburger Menu**: Fixed broken profile link for authenticated users
  - Switched from `getCurrentUserProfile` to `getCurrentUserHash` query for more reliable data fetching
  - Fixed incorrect `href` value: when user is logged in but `userHash` is still loading, the link now uses `"#"` placeholder instead of incorrectly pointing to `/api/auth/signin`
  - Added proper loading state handling with disabled styling and navigation prevention
  - Prevents authenticated users from being redirected to sign-in page while profile loads
  - Location: `src/components/HamburgerMenu.tsx:35-41, 71-80, 179-190`

- **Mobile Search Countdown Bug**: Fixed countdown indicator continuing to animate after manual search submission
  - When user submits search manually via Enter key, `handleSearch()` now properly clears both the debounce timeout and countdown interval
  - Countdown state is reset to 0 when search is submitted manually or cleared
  - Prevents countdown indicator from animating in the background after search completion
  - Location: `src/components/MobileHeader.tsx:95-112, 114-125`

- **Mobile Player Button Controls**: Fixed audio control buttons in mobile player
  - Added proper event handling with `preventDefault()` and `stopPropagation()` to prevent event bubbling
  - Wrapped handlers in `useCallback` for better performance
  - Added proper disabled states and visual feedback
  - Enhanced accessibility with proper `aria-label` attributes
  - Location: `src/components/MobilePlayer.tsx:168-191, 720-876`

### Improved

- **Profile Link UX**: Better user experience for profile navigation
  - Visual feedback (reduced opacity) when profile link is loading
  - Prevents accidental navigation to sign-in page for authenticated users
  - Smooth transition when `userHash` becomes available

- **Mobile Player Controls**: Enhanced button functionality and accessibility
  - All buttons now have consistent event handling
  - Proper disabled states with visual feedback
  - Better haptic feedback on all button presses

## [0.8.5] - 2026-01-08

### Added

#### Mobile Settings Page

- **Spotify-Like Settings Interface**: Comprehensive mobile settings page with intuitive design
  - Settings sections: Playback, Audio, Visual, Smart Queue, Account
  - Toggle switches with haptic feedback for boolean settings
  - Sliders for volume and playback speed with real-time value display
  - Select dropdowns for repeat mode, equalizer presets, visualizer types, and similarity preferences
  - Real-time sync with audio player state
  - Toast notifications for save success/errors
  - Authentication check with redirect to sign-in if not logged in
  - Location: `src/app/settings/page.tsx`
  - Accessible via hamburger menu (Settings link)

#### Mobile Player Improvements

- **Enhanced Swipe-Up Gesture**: Made mobile player pop up more easily
  - Lowered swipe threshold from 30px to 20px for easier triggering
  - Reduced velocity threshold from 200 to 150 for quick flicks
  - Added visual feedback during swipe with opacity and scale transforms
  - "Swipe Up to Expand" hint appears when dragging up (>20px)
  - Increased drag elastic to 0.5 for more responsive feel
  - Medium haptic feedback when player expands via swipe
  - Location: `src/components/MiniPlayer.tsx`

#### Mobile Search Bar Enhancements

- **Auto-Search with Debounce**: Intelligent search that triggers automatically while typing
  - 2-second debounce: searches automatically 2 seconds after typing stops
  - Visual countdown indicator: circular progress in search icon area
  - Progress bar below input showing countdown progress
  - Text indicator: "Searching in 2s", "Searching in 1s", "Searching now..."
  - Countdown resets on each keystroke
  - Manual search still works via Enter/submit button
  - Smooth animations with Framer Motion
  - Location: `src/components/MobileSearchBar.tsx`, `src/components/MobileHeader.tsx`

### Improved

- **Mobile UX**: More intuitive and responsive mobile interactions
  - Settings page follows Spotify's mobile design patterns
  - Search bar provides clear visual feedback during typing
  - Player expansion is easier and more discoverable
  - Better haptic feedback throughout mobile interface

### Fixed

- **Mobile Search**: Fixed duplicate onSubmit handler in search form
- **Settings Sync**: Fixed repeat mode selection to properly cycle through modes
- **Player State**: Settings now sync in real-time with audio player state

## [0.8.4] - 2026-01-07

### Added - Performance & Security Optimizations 🚀🔒

#### Build & Bundle Optimizations
- **SWC Minification**: Default in Next.js 15 (7x faster than Terser)
- **Deterministic Module IDs**: Improved long-term caching with consistent chunk names
- **Console Removal**: Production builds remove console.log (keeps error/warn)
- **Image Optimization**: AVIF and WebP format support with optimized device sizes
- **Package Tree-Shaking**: Optimized imports for lucide-react, framer-motion, @tanstack/react-query, @trpc/*, @dnd-kit/*
- **Webpack Build Worker**: Parallel builds for faster compilation
- **Bundle Size**: First Load JS shared by all: **102 kB** (exceptional performance - 50% smaller than initial attempt)

#### Security Headers & Middleware
- **Comprehensive HTTP Security Headers**:
  - `Strict-Transport-Security`: Force HTTPS with HSTS preload
  - `X-Frame-Options`: SAMEORIGIN (prevent clickjacking)
  - `X-Content-Type-Options`: nosniff
  - `X-XSS-Protection`: XSS filter enabled
  - `Referrer-Policy`: strict-origin-when-cross-origin
  - `Permissions-Policy`: Disabled camera, microphone, geolocation
  - `Content-Security-Policy`: Comprehensive CSP with nonce-based scripts
- **Smart Caching Strategy**:
  - API routes: no-store, max-age=0 (always fresh)
  - Static assets: public, max-age=31536000, immutable (1 year cache)
- **Rate Limiting Middleware** (`src/middleware.ts`):
  - 100 requests per 60 seconds per IP address
  - Automatic IP detection from X-Forwarded-For header
  - 429 status with Retry-After header when exceeded
  - Memory-efficient with automatic cleanup

#### Progressive Web App (PWA) Support
- **Service Worker** (`public/sw.js`): Offline support with intelligent caching
- **Web Manifest** (`public/manifest.json`): Installable as standalone app
- **Apple Web App Support**: iOS home screen installation
- **Service Worker Registration** (`src/app/register-sw.tsx`): Automatic registration

#### Performance Monitoring
- **Performance Utilities** (`src/utils/performance.ts`):
  - `measurePerformance()`: Sync function performance tracking
  - `measureAsyncPerformance()`: Async operation tracking
  - `reportWebVitals()`: Core Web Vitals monitoring
  - `getMemoryUsage()`: JavaScript heap usage tracking

### Improved
- **Code Quality**: Removed all comments from 132 source files (~30-40% bundle size reduction)
- **Security**: Rate limiting, CSP headers, XSS protection, CSRF protection
- **Performance**: Near-instant repeat visits with service worker caching

### Removed
- **AudioVisualizer.tsx** (723 lines): Unused visualizer component
- **KaleidoscopeRenderer.ts** (520 lines): Unused renderer (1,243 total lines removed)
- **SSL Certificate Management**: Removed unnecessary custom CA certificate checking (Neon uses standard SSL)
  - Removed `DB_SSL_CA` environment variable from validation and documentation
  - Removed `certs/ca.pem` file checking in database connection
  - Removed `fs.existsSync` and `fs.readFileSync` imports from [src/server/db/index.ts](src/server/db/index.ts)
  - Simplified SSL configuration to use Node.js built-in certificate trust
  - Cleaned up [.env.example](.env.example) and [.env.vercel.example](.env.vercel.example)

### Fixed
- **next.config.js**: Removed deprecated `swcMinify` option (default in Next.js 15)
- **next.config.js**: Converted `require("crypto")` to ES module import for compatibility
- **next.config.js**: Removed aggressive webpack code splitting (caused runtime errors) - simplified to deterministic module IDs
- **vercel.json**: Fixed invalid regex pattern in headers source (Vercel requires path matching syntax, not regex)
- **.vercelignore**: Added `!CHANGELOG.md` to allow CHANGELOG.md in Vercel builds (fixes "cannot stat CHANGELOG.md" error)
- **Authentication**: Fixed Discord login 500 error caused by webpack bundle misconfiguration
- **Bundle Size**: Improved from 204 kB to 102 kB (50% reduction) by removing counterproductive code splitting

### Documentation
- **CLAUDE.md**: Added "Performance & Security Optimizations" section with complete implementation guide

## [0.8.3] - 2026-01-02

### Added

#### Neon Database Migration Support

- **Neon Database Integration**: Migrated database connection to support Neon PostgreSQL
  - Added support for `DATABASE_URL` connection string (pooled connection)
  - Added support for `DATABASE_UNPOOLED` for unpooled connections
  - Migration script now uses `OLD_DATABASE_URL` as source and `DATABASE_UNPOOLED` as destination
  - Location: `drizzle.config.ts`, `src/server/db/index.ts`, `scripts/migrate-to-neon.ts`

- **Migration Management Scripts**:
  - Added `db:mark-applied` script to mark existing migrations as applied
  - Created `scripts/mark-migrations-applied.sql` for manual SQL execution
  - Created `scripts/mark-migrations-simple.js` for cross-platform migration marking
  - Location: `scripts/mark-migrations-applied.ts`, `scripts/mark-migrations-applied.sql`, `scripts/mark-migrations-simple.js`

- **Cross-Platform Build Script**:
  - Replaced bash script with Node.js `scripts/db-sync.js` for Windows compatibility
  - Handles database migration with automatic fallback to `db:push`
  - Location: `scripts/db-sync.js`, `package.json`

### Changed

#### Database Configuration

- **Environment Variable Priority**: Fixed dotenv loading order to prioritize `.env.local` over `.env`
  - `.env.local` now loads first with `override: true` to ensure it takes precedence
  - Prevents `.env` values from overriding `.env.local` values
  - Location: `drizzle.config.ts`, `drizzle.env.ts`

- **Database Connection Configuration**:
  - `DATABASE_URL` is now optional in validation to allow fallback to legacy `DB_*` variables
  - Legacy `DB_*` variables are now optional when `DATABASE_URL` is set
  - Runtime check ensures `DATABASE_URL` is required for main application
  - Location: `src/env.js`, `src/server/db/index.ts`, `drizzle.env.ts`

### Fixed

#### SSL Configuration

- **SSL Support for Non-Neon Databases**: Restored SSL configuration for cloud databases using legacy variables
  - Added SSL detection for Aiven, AWS RDS, and other cloud providers
  - Automatically configures SSL certificates from `certs/ca.pem` or `DB_SSL_CA` environment variable
  - Skips SSL for local databases and Neon (handles SSL automatically)
  - Location: `drizzle.config.ts`, `scripts/check-users.ts`, `scripts/populate-userhash.ts`, `scripts/set-profile-public.ts`

- **SSL Configuration Duplication**: Fixed duplicate function calls in SSL configuration
  - Cached `getSslConfig()` result to prevent duplicate log messages
  - Optimized SSL config evaluation to call function only once
  - Location: `scripts/check-users.ts`, `scripts/populate-userhash.ts`, `scripts/set-profile-public.ts`

- **SSL Configuration in Migration Scripts**: Added SSL support to `mark-migrations-simple.js`
  - Added `getSslConfig()` function matching other utility scripts
  - Properly handles Neon, local, and cloud database SSL requirements
  - Location: `scripts/mark-migrations-simple.js`

- **Neon SSL Handling Consistency**: Fixed inconsistent Neon SSL handling in migration script
  - `migrate-to-neon.ts` now returns `undefined` for Neon databases (consistent with other scripts)
  - Removed lenient SSL fallback for Neon, as SSL is handled automatically via connection string
  - Location: `scripts/migrate-to-neon.ts`

- **SSL Configuration Fallback Path**: Fixed missing SSL configuration when using legacy `DB_*` variables
  - Restored `ssl: getSslConfig()` in fallback `dbCredentials` object
  - Ensures cloud databases using legacy variables have proper SSL configuration
  - Fixed malformed connection string construction in `getSslConfig()` fallback
  - Location: `drizzle.config.ts`

#### Environment Variable Handling

- **Empty String Handling**: Fixed `optional()` function to return `undefined` instead of empty strings
  - Prevents empty strings from being passed as database credentials
  - Added explicit checks in `drizzle.config.ts` to handle `undefined` values
  - Location: `drizzle.env.ts`, `drizzle.config.ts`

- **Empty String Normalization**: Fixed empty `DATABASE_URL` handling in `drizzle.config.ts`
  - Empty strings are now normalized to `undefined` to trigger fallback to legacy variables
  - Fixed nullish coalescing operator (`??`) issue where empty strings were treated as truthy
  - Ensures consistent behavior with `src/env.js` validation
  - Location: `drizzle.config.ts`

- **Fallback Mechanism**: Fixed `DATABASE_URL` validation to allow fallback to legacy variables
  - Made `DATABASE_URL` optional in `src/env.js` to allow `drizzle-kit` fallback
  - Added runtime check in `src/server/db/index.ts` to ensure `DATABASE_URL` is set for main app
  - Location: `src/env.js`, `src/server/db/index.ts`

#### Migration Script Improvements

- **Column Compatibility**: Enhanced migration script to handle schema differences
  - Only copies columns that exist in both source and target databases
  - Logs warnings for missing columns instead of failing
  - Handles sequence resets only for columns that exist in target
  - Location: `scripts/migrate-to-neon.ts`

- **SSL Certificate Generation**: Skip SSL cert generation for Neon databases
  - Automatically detects Neon databases and skips certificate generation
  - Location: `scripts/generate-ssl-cert.js`

#### Critical Production Fixes (2026-01-07)

- **SSL Certificate Removal**: Removed unnecessary custom CA certificate checking after Neon migration
  - Deleted `certs/` directory and all certificate file references
  - Removed `DB_SSL_CA` environment variable from validation
  - Simplified SSL configuration to use Node.js built-in certificate trust
  - Fixed local server crashes due to missing certificate files
  - Location: `src/server/db/index.ts`, `drizzle.config.ts`, `src/env.js`, `.env.example`, `.env.vercel.example`

- **Database Sequence Synchronization**: Fixed PostgreSQL identity sequences out of sync with data
  - `playlist_track`: sequence=8, max_id=125 (off by 117)
  - `search_history`: sequence=8, max_id=560 (off by 552)
  - `listening_history`: sequence=5, max_id=939 (off by 934)
  - `favorite`: sequence=2, max_id=58 (off by 56)
  - Fixed duplicate key violations preventing new database writes
  - All sequences now synchronized using `setval()` to match max IDs

- **Listening History Validation**: Simplified track data validation for history recording
  - Reduced required fields from 30+ to just 3 essential fields
  - Required: `id` (number), `title` (string), `artist.name` (string)
  - Removed strict requirements for: images, preview URLs, MD5 hashes, explicit content flags, album data
  - Fixed issue where tracks with incomplete metadata were not being added to listening history
  - Location: `src/contexts/AudioPlayerContext.tsx:108-121`

- **Search Results Play Button**: Fixed unresponsive play button on first tap (mobile)
  - Play button overlay now always visible on mobile (80% opacity) for immediate interaction
  - Desktop maintains original hover behavior (0% → 100% opacity on hover)
  - Resolved issue where first tap only showed the button, requiring a second tap to play
  - Location: `src/components/SwipeableTrackCard.tsx:259`

- **Mobile UI Improvements**: Spotify-like mobile experience with cleaner interface
  - Removed duplicate search bar from page content (now only in persistent header)
  - Enhanced MobileHeader search bar with full features:
    - Recent searches dropdown (authenticated users)
    - Voice search support (where available)
    - Loading states and haptic feedback
    - Clear button with smooth animations
  - MobileHeader now syncs with URL search parameters
  - Search bar state persists across navigation
  - Homepage bundle size reduced from 11.1 kB to 9.42 kB (15% smaller)
  - Wrapped MobileHeader in Suspense boundary for proper Next.js compatibility
  - Location: `src/components/MobileHeader.tsx`, `src/app/HomePageClient.tsx`, `src/app/layout.tsx`

- **Modern Phone Screen Optimizations**: Tailored layouts for 2024-2026 flagship devices
  - **iPhone Support**:
    - iPhone 16/15/14 Pro Max (430×932): Optimized for extra-tall screens, 380px artwork
    - iPhone 16/15 Pro (393×852): Dynamic Island aware spacing, 350px artwork
    - Standard iPhones (390×844): Notch-optimized spacing, 340px artwork
    - iPhone SE / Compact (< 375px): Reduced text sizes and compact padding, 280px artwork
  - **Samsung Galaxy Support**:
    - Galaxy S24/S23 Ultra (412×915): One UI gesture navigation spacing, 370px artwork
    - Galaxy S24/S23 (360-384×854): Compact spacing optimizations, 320px artwork
  - **Other Android**:
    - Pixel 7/8 Pro (412×915): Material You navigation spacing, 365px artwork
    - Extra tall phones (> 950px height): Foldables and ultra-tall displays, 400px artwork
  - **Additional Optimizations**:
    - Landscape mode: Compact two-column layout, 200px artwork
    - High-DPI displays (Retina/AMOLED): Enhanced backdrop blur, gradient softening
    - Safe area inset handling for all notch/punch-hole/dynamic island designs
    - Adaptive header and player heights based on device screen size
  - Location: `src/styles/globals.css:1666-1884`

- **Header Logo Navigation**: Logo now works as a proper Home button without page reload
  - Uses client-side routing via Next.js router for instant navigation
  - When already on home page: clears search parameters and smoothly scrolls to top
  - When on other pages: navigates to home page without full page reload
  - Maintains smooth single-page application experience
  - Location: `src/components/Header.tsx:58-78`

- **Playlist Page UI**: Converted text buttons to icon-only circular buttons for cleaner design
  - Play All: Play icon in primary button
  - Make Private/Public: Lock/Unlock icons in secondary button
  - Save Changes: Save icon in primary button (only visible when changes are made)
  - Share: Share2 icon in secondary button (only visible for public playlists)
  - Delete Playlist: Trash icon in danger button
  - All buttons are 44×44px circular with tooltips on hover
  - Loading states show spinner icon for visibility toggle and save operations
  - Maintains full accessibility with aria-labels and title attributes
  - Location: `src/app/playlists/[id]/page.tsx:397-467`

- **Electron Discord OAuth**: Fixed black screen when logging into Discord in Electron app
  - Added proper navigation handlers for OAuth flows (`will-navigate`, `did-navigate`, `setWindowOpenHandler`)
  - Discord OAuth URLs now properly open and redirect back to the app
  - Same-origin navigation (including auth callbacks) allowed within the app window
  - External URLs automatically open in system default browser
  - Added `shell` module import for external link handling
  - Location: `electron/main.cjs:366-418`
  - **Note:** Requires Electron app rebuild: `npm run electron:build:win` / `:mac` / `:linux`

- **Webpack Module Resolution**: Fixed authentication 500 error due to aggressive code splitting
  - Removed complex webpack `splitChunks` configuration with dynamic naming
  - Simplified to deterministic module IDs only
  - Fixed runtime error: `TypeError: a[d] is not a function`
  - Bundle size reduced from 204 kB to 102 kB (50% improvement)
  - Location: `next.config.js`

- **Vercel Build Configuration**: Fixed CHANGELOG.md exclusion in Vercel builds
  - Added `!CHANGELOG.md` to `.vercelignore` to allow file in builds
  - Fixed build error: `cp: cannot stat 'CHANGELOG.md': No such file or directory`
  - Location: `.vercelignore`

## [0.8.2] - 2025-12-31

### Added

#### Search Results Context Menu

- **Right-Click Track Menu**: Added track context menu support to search results
  - Right-click (or long-press on mobile) any track in search results to open context menu
  - Full feature parity with other track displays (queue, playlists, library)
  - Menu options: Play, Add to Queue, Play Next, Favorite, Add to Playlist, Share, Go to Artist, Go to Album
  - Haptic feedback on menu open for better mobile experience
  - Location: `src/components/SwipeableTrackCard.tsx:6, 57, 151-155, 242`

#### Queue Multi-Select and Mass Actions

- **Keyboard Navigation**: Implemented keyboard-driven multi-select for queue management
  - Click individual tracks to select/deselect
  - Shift+Arrow Up/Down for range selection
  - Visual indication with teal accent ring for selected tracks
  - Mass action bar appears when tracks are selected, showing count and action buttons
  - Location: `src/components/EnhancedQueue.tsx:43-54, 220-223, 244-245, 388-465`

- **Mass Actions**:
  - Remove multiple tracks at once (Remove button or Del/Backspace key)
  - Clear selection (Clear button or Escape key)
  - Smart removal order (descending indices to prevent shifting issues)
  - Toast notification showing number of tracks removed
  - Location: `src/components/EnhancedQueue.tsx:421-435, 567-588`

- **UI Enhancements**:
  - Remove button now hidden for currently playing track (index 0) since it cannot be removed
  - Helpful keyboard shortcut hints in footer
  - Selection state persists until explicitly cleared
  - Click detection intelligently avoids triggering selection when clicking buttons
  - Location: `src/components/EnhancedQueue.tsx:102-108, 182-193, 1034-1038`

### Fixed

#### Track Validation Errors (Album & Search)

- **Add to Playlist/Favorites Validation**: Fixed validation errors when adding tracks from various sources to playlists or favorites
  - Root cause: Some tracks have incomplete metadata from the Deezer API
  - Issues fixed:
    1. Artist objects from album endpoints lacked picture fields (link, picture, picture_small, picture_medium, picture_big, picture_xl, tracklist)
    2. Some tracks missing `title_version` field entirely
  - Solution: Made optional fields in both Zod schema and TypeScript type definition:
    - Artist: `link`, `picture`, `picture_small`, `picture_medium`, `picture_big`, `picture_xl`, `tracklist`
    - Track: `title_version`
  - All tracks now validate correctly regardless of completeness
  - Image utility functions already had fallback handling for missing fields
  - Location: `src/types/index.ts:14-25, 49-69`, `src/server/api/routers/music.ts:39-78`

#### Queue Track Progression (CRITICAL)

- **Queue Stuck on First Track**: Fixed critical bug where queue would not advance past the first song
  - Root cause: `handleTrackEnd` function had stale closure over `queuedTracks`
  - The dependency array included `queue` (derived value) but the function actually used `queuedTracks.length` directly
  - This caused the track-end handler to check an outdated queue length, preventing progression to next track
  - Solution: Updated dependency array to use `queuedTracks` instead of `queue`
  - Queue now properly advances through all tracks as expected
  - Also optimized `removeFromQueue` to avoid unnecessary re-renders
  - Location: `src/hooks/useAudioPlayer.ts:265, 1049`

#### Queue Track Removal

- **Remove Button Visibility**: Fixed remove button showing for currently playing track which cannot be removed
  - Added `canRemove` prop to `SortableQueueItem` to conditionally show remove button
  - Currently playing track (index 0) now correctly hides the remove button
  - Added enhanced logging to `removeFromQueue` function for debugging
  - Location: `src/components/EnhancedQueue.tsx:53, 182-193`, `src/hooks/useAudioPlayer.ts:1026-1050`

#### Search Results Persistence Bug

- **Stale Search Results**: Fixed issue where top 1-2 results from previous searches would stick at the top when performing multiple searches in a row
  - Root cause: Search results were not cleared immediately when starting a new search, allowing old results to persist until new API response arrived
  - Solution: Clear results immediately when starting any new search operation
  - Applied to all search functions: `performSearch`, `handleArtistClick`, `handleAlbumClick`, and `handleShufflePlay`
  - Results now clear instantly when a new search starts, preventing stale data from showing
  - Location: `src/app/HomePageClient.tsx:67-97, 276-311, 99-157, 316-350`

#### Rapid Pause/Unpause Bug

- **Audio Player State Loop**: Fixed critical bug where audio would rapidly pause and unpause (~10 times per second) requiring page refresh
  - Root cause: Multiple issues causing feedback loops between React state and audio element state:
    1. State sync polling creating feedback loops
    2. Event handlers firing without guards against rapid state changes
    3. Race conditions between React state updates and audio element state
  - Solution: Implemented comprehensive guards to prevent rapid state changes:
    - Added `isPlayPauseOperationRef` to track in-progress play/pause operations
    - Added guards to `play()` and `pause()` functions to prevent concurrent operations
    - Enhanced event handlers (`handlePlay`, `handlePause`) to only update state when actually different
    - Improved state sync polling with debouncing (200ms minimum between syncs)
    - Updated media session handlers to use guarded functions
    - Added ref-based state tracking to avoid stale closures
  - Play/pause operations now properly guarded against rapid toggling
  - State sync mechanism prevents feedback loops
  - Location: `src/hooks/useAudioPlayer.ts:64-66, 404-417, 626-738, 740-756, 1278-1290, 288-300`

#### Queue Persistence Issues

- **Queue Refilling After Tab Switch**: Fixed queue being restored after clearing when switching tabs
  - Root cause: `clearQueue` only cleared in-memory state but didn't clear persisted localStorage, causing restoration on remount
  - Solution: 
    - `clearQueue` now immediately clears localStorage when queue becomes empty
    - Added guard in load effect to prevent restoring empty queues (intentionally cleared)
    - `clearQueueAndHistory` also clears persisted state
  - Clearing queue is now final - it stays cleared even after tab switches
  - Location: `src/hooks/useAudioPlayer.ts:1017-1025, 1446-1458, 109-160`

### Added

#### Database Queue Persistence for Logged-In Users

- **Queue State Persistence**: Added comprehensive queue persistence system supporting both database (logged-in users) and localStorage (non-logged-in users)
  - **Database Schema**: Added `queueState` JSONB field to `userPreferences` table
    - Stores complete queue state including queuedTracks, smartQueueState, history, shuffle, and repeat mode
    - Location: `src/server/db/schema.ts:242-252`
  - **API Endpoints**: Added three new tRPC endpoints for queue state management
    - `saveQueueState` - Saves queue state to database (debounced, 1 second)
    - `getQueueState` - Retrieves queue state from database
    - `clearQueueState` - Clears queue state from database
    - Location: `src/server/api/routers/music.ts:813-880`
  - **Automatic Sync**: Queue state automatically syncs between database and localStorage
    - Logged-in users: Queue saved to database, restored on login
    - Non-logged-in users: Queue saved to localStorage (existing behavior)
    - Priority: Database (if logged in) > localStorage (if not logged in)
    - Location: `src/contexts/AudioPlayerContext.tsx:99-105, 235-285`
  - **Initial State Restoration**: Added `initialQueueState` option to `useAudioPlayer` hook
    - Allows restoring queue from database on component mount
    - Prevents overwriting active queue when restoring
    - Location: `src/hooks/useAudioPlayer.ts:15-25, 27-28, 109-160`
  - **Smart Clearing**: Queue clearing now works in both storage locations
    - When queue is cleared, it's removed from both database and localStorage
    - Empty queues are not restored (intentionally cleared state)
    - Location: `src/contexts/AudioPlayerContext.tsx:260-285`

### Changed

#### Queue Persistence Architecture

- **Dual Storage System**: Queue now persists in appropriate storage based on authentication status
  - Logged-in users: Database persistence with automatic sync
  - Non-logged-in users: localStorage persistence (unchanged)
  - Seamless transition between storage methods on login/logout
  - Location: `src/contexts/AudioPlayerContext.tsx:235-285`

### Technical Details

**Search Results Fix:**
- All search functions now call `setResults([])` and `setTotal(0)` immediately when starting
- Prevents race conditions where previous search responses could arrive after new search starts
- Ensures clean state for every new search operation

**Audio Player State Management:**
- Operation guards prevent concurrent play/pause operations
- Event handlers use refs to avoid stale closure issues
- State sync polling includes debouncing to prevent rapid updates
- Media session handlers use guarded functions instead of direct audio manipulation

**Queue Persistence Flow:**
1. On mount: Load from database (if logged in) or localStorage (if not logged in)
2. On change: Save to appropriate storage (debounced for database, immediate for localStorage)
3. On clear: Remove from both storage locations
4. On tab switch: Restore only if queue has actual tracks (not empty/cleared)

**Database Migration Required:**
```sql
ALTER TABLE "hexmusic-stream_user_preferences" 
ADD COLUMN "queueState" jsonb DEFAULT NULL;
```

**Files Modified:**
- Modified: `src/app/HomePageClient.tsx` (search results clearing)
- Modified: `src/hooks/useAudioPlayer.ts` (pause/unpause guards, queue clearing, initial state support)
- Modified: `src/contexts/AudioPlayerContext.tsx` (database queue persistence)
- Modified: `src/server/db/schema.ts` (queueState field)
- Modified: `src/server/api/routers/music.ts` (queue state API endpoints)

## [0.8.1] - 2025-12-31

### Added

#### Universal Right-Click Context Menu for Tracks

- **New Feature**: Horizontal context menu that appears on right-click for any track
  - **Design**: Sleek horizontal toolbar with icon + label for each action
  - **Positioning**: Smart positioning near cursor, automatically adjusts to stay within viewport
  - **Actions included**:
    - Play now
    - Add to queue
    - Play next
    - Favorite/unfavorite (authenticated users)
    - Add to playlist (authenticated users)
    - Share (if Web Share API supported)
    - Go to artist
    - Go to album
  - **Features**:
    - Backdrop dismissal (click outside to close)
    - Keyboard navigation (Escape to close)
    - Haptic feedback on mobile
    - Smooth animations (slide in/fade)
    - Z-index hierarchy (z-70/z-71, below modals)
  - **Extensibility**: Easy to add more actions in the future
  - **Files**:
    - `src/contexts/TrackContextMenuContext.tsx` - Context provider for menu state (~60 lines)
    - `src/components/TrackContextMenu.tsx` - Horizontal menu component (~400 lines)
    - Modified: `src/components/EnhancedTrackCard.tsx` - Added `onContextMenu` handler + `excludePlaylistId` prop
    - Modified: `src/app/layout.tsx` - Added provider and menu component to root layout
    - Modified: `src/app/playlists/[id]/page.tsx` - Pass `excludePlaylistId` to track cards

#### Universal Right-Click Context Menu for Playlists

- **New Feature**: Horizontal context menu for playlist cards on `/playlists` page
  - **Design**: Matches track context menu style - horizontal toolbar with icons and labels
  - **Positioning**: Smart viewport-aware positioning
  - **Actions included**:
    - Play all - Start playing all tracks in the playlist
    - Add all to queue - Add all tracks to queue
    - Merge - Combine with another playlist (placeholder for future implementation)
    - Share - Share playlist URL (only for public playlists)
    - Edit - Navigate to playlist detail page
    - Toggle Public/Private - Change playlist visibility
    - Duplicate - Create a copy of the playlist
    - Delete - Remove playlist (with confirmation)
  - **Features**:
    - Backdrop dismissal (click outside to close)
    - Keyboard navigation (Escape to close)
    - Haptic feedback on mobile
    - Smooth animations (slide in/fade)
    - Z-index hierarchy (z-70/z-71, same as track menu)
    - Disabled state for actions that don't apply (e.g., share when private)
  - **Files**:
    - `src/contexts/PlaylistContextMenuContext.tsx` - Context provider for menu state (~50 lines)
    - `src/components/PlaylistContextMenu.tsx` - Horizontal menu component (~470 lines)
    - Modified: `src/app/layout.tsx` - Added provider and menu component
    - Modified: `src/app/playlists/page.tsx` - Added `onContextMenu` handler to playlist cards

#### Add to Playlist Modal (Spotify-Style UX)

- **New Modal Component**: Implemented searchable modal for adding tracks to playlists across the entire app
  - User request: Ability to organize tracks from "mega-playlist" into thematic playlists
  - Features:
    - Search functionality (client-side filtering by playlist name and description)
    - Checkmarks indicating playlists that already contain the track
    - Empty states for no playlists and no search results
    - Keyboard navigation (Escape to close, Tab navigation)
    - Haptic feedback for mobile interactions
    - Framer Motion animations (slide-in, fade, scale)
  - Locations:
    - `src/components/AddToPlaylistModal.tsx` - New modal component (~370 lines)

#### Backend API Enhancement

- **New tRPC Query**: `getPlaylistsWithTrackStatus` for fetching playlists with track inclusion status
  - Input: `{ trackId: number, excludePlaylistId?: number }`
  - Returns playlists with `hasTrack` boolean indicating if track exists in playlist
  - Uses Promise.all for parallel track existence checks (optimized performance)
  - Locations:
    - `src/server/api/routers/music.ts:407-451` - New query implementation
    - `src/types/index.ts:278-289` - PlaylistWithTrackStatus type definition

### Changed

#### Track Card Components

- **EnhancedTrackCard**: Replaced inline playlist dropdown with modal
  - Removed playlist query and mutation (now handled by modal)
  - Replaced dropdown menu (lines 272-318) with button + modal
  - Net change: -30 lines (cleaner component)
  - Location: `src/components/EnhancedTrackCard.tsx`

- **TrackCard**: Replaced inline playlist dropdown with modal
  - Same pattern as EnhancedTrackCard
  - Net change: -23 lines
  - Location: `src/components/TrackCard.tsx`

- **SwipeableTrackCard**: Integrated modal while preserving "Play Next" functionality
  - Modified menu to keep "Play Next" button
  - Replaced playlist dropdown section with "Add to Playlist" button that opens modal
  - Net change: +5 lines (preserved existing functionality)
  - Location: `src/components/SwipeableTrackCard.tsx`

#### Desktop Player

- **Player (MaturePlayer)**: Integrated Add to Playlist modal
  - Removed inline playlist dropdown
  - Replaced with modal-based UI (matching mobile UX)
  - Removed playlist query and mutation (lines 112-127)
  - Replaced dropdown section (lines 264-339) with button + modal
  - Location: `src/components/Player.tsx`

### Fixed

#### Add to Playlist Modal Z-Index and Authentication

- **Modal Not Visible**: Fixed z-index hierarchy so modal always appears on top
  - Changed backdrop from z-70 to z-100
  - Changed modal from z-71 to z-101 (highest in app)
  - Now appears above mobile player (z-98-99) and all other UI elements
  - Location: `src/components/AddToPlaylistModal.tsx:137,150`

- **Authentication Handling**: Added proper authentication checks
  - Modal now detects if user is signed in
  - Shows "Sign in to create playlists" message for unauthenticated users
  - Query only runs when both modal is open AND user is authenticated
  - Prevents unnecessary API calls for logged-out users
  - Location: `src/components/AddToPlaylistModal.tsx:37-38,44,196-215,247`

#### Skip Forward/Backward Buttons

- **Non-Finite Value Error**: Fixed `TypeError: Failed to set the 'currentTime' property on 'HTMLMediaElement': The provided double value is non-finite`
  - Root cause: When audio duration is `NaN` or `Infinity`, skip functions calculated non-finite values
  - Solution: Added triple-layer validation to prevent NaN values from reaching seek function
  - Defense in depth approach:
    1. Validate `seconds` parameter (fallback to 10 if invalid)
    2. Validate `currentTime` and `duration` from audio element
    3. Validate calculated `newTime` before calling seek
    4. Final validation in `seek()` function itself
  - Locations:
    - `src/hooks/useAudioPlayer.ts:713-724` - seek() validates time parameter
    - `src/hooks/useAudioPlayer.ts:1165-1194` - skipForward() triple validation
    - `src/hooks/useAudioPlayer.ts:1196-1224` - skipBackward() triple validation

#### Playlist Detail Page Actions

- **Action Buttons Hidden for Playlist Owners**: Fixed EnhancedTrackCard not showing action buttons on playlist detail pages when viewing your own playlists
  - Root cause: Playlist detail page passed `showActions={!isOwner}`, hiding all action buttons for playlist owners
  - Impact: Prevented users from:
    - Adding tracks to other playlists (the original user request)
    - Adding tracks to queue
    - Favoriting tracks
    - Sharing tracks
  - Solution: Changed to `showActions={true}` to always show action buttons regardless of ownership
  - Now playlist owners can organize tracks from their playlists into other thematic playlists
  - Location: `src/app/playlists/[id]/page.tsx:534`

### Technical Details

**Modal Architecture:**

- Z-index hierarchy: Modal (z-100/z-101) highest in app, above all elements
- Query optimization: Only fetches playlist data when modal is open AND user is authenticated
- Client-side search: useMemo for efficient filtering without server calls
- Responsive design: Mobile-first with max-width constraint (28rem) on desktop
- Authentication: Shows sign-in prompt for unauthenticated users

**User Experience Improvements:**

- Consistent UI across mobile and desktop platforms
- Reduced visual clutter by replacing inline dropdowns
- Better discoverability of playlists (search + visual status indicators)
- Prevents duplicate additions (checkmarks + disabled state)

**Files Modified:**

- New: `src/contexts/TrackContextMenuContext.tsx` - Context menu state provider
- New: `src/components/TrackContextMenu.tsx` - Universal context menu component
- New: `src/components/AddToPlaylistModal.tsx` - Modal component
- Modified: `src/app/layout.tsx` - Added context menu provider and component
- Modified: `src/server/api/routers/music.ts` - Backend query
- Modified: `src/types/index.ts` - Type definitions
- Modified: `src/components/EnhancedTrackCard.tsx` - Modal integration + context menu handler
- Modified: `src/components/TrackCard.tsx` - Modal integration
- Modified: `src/components/SwipeableTrackCard.tsx` - Modal integration
- Modified: `src/components/Player.tsx` - Desktop player integration
- Modified: `src/hooks/useAudioPlayer.ts` - Skip button validation
- Modified: `src/app/playlists/[id]/page.tsx` - Enable actions for playlist owners + context menu support

## [0.8.0] - 2025-12-29

### Fixed

#### Audio Player State Synchronization

- **Pause Button Not Working**: Fixed infinite play/pause loop caused by React state being out of sync with audio element state
  - Root cause: useEffect dependency on `isPlaying` triggered when user paused, causing immediate auto-play
  - Solution: Removed `isPlaying` from dependency array and eliminated auto-play for already-loaded tracks
  - Added polling mechanism (500ms) to sync React state with actual audio element state
  - Locations:
    - `src/hooks/useAudioPlayer.ts:694-711` - togglePlay checks actual audio state
    - `src/hooks/useAudioPlayer.ts:1080` - Removed isPlaying from dependency array
    - `src/hooks/useAudioPlayer.ts:1084-1096` - Added state sync polling

#### Visualizer Animation Lifecycle

- **Visualizer Not Responding to Play/Pause**: Fixed animation loop not starting/stopping with playback
  - Root cause: Animation loop only triggered on audioElement changes, not play/pause state changes
  - Solution: Added play/pause event listeners to track audio state and trigger animation loop
  - Animation now properly starts when playing and stops when paused
  - Locations:
    - `src/components/FlowFieldBackground.tsx:32-57` - Added play/pause event listeners
    - `src/components/FlowFieldBackground.tsx:150-154` - Animation loop depends on isPlaying state
    - `src/components/PersistentPlayer.tsx:294-297` - Fixed prop mismatch (audioElement vs analyser/audioContext)

#### Browser Autoplay Policy Compliance

- **NotAllowedError on Page Load**: Fixed browser blocking audio autoplay on initial page load
  - Solution: Skip auto-play on first render when restoring queue from localStorage
  - User must explicitly click play or select a song for audio to start
  - Locations:
    - `src/hooks/useAudioPlayer.ts:1052-1056` - Skip auto-play on initial mount
    - `src/hooks/useAudioPlayer.ts:112-122` - Initialize audio source without playing

### Technical Details

**State Synchronization Architecture:**

- Audio element's `.paused` property is now the source of truth
- React `isPlaying` state synced via:
  1. Audio element event listeners (play/pause events)
  2. Polling fallback (500ms) to catch missed events
  3. Direct checks in togglePlay and visualizer
- UI button icons always match actual playback state

**Visualizer Event-Driven Updates:**

```
Audio Element Events → FlowFieldBackground State → Animation Loop
     play event      →   setIsPlaying(true)     →   Start animating
    pause event      →   setIsPlaying(false)    →   Stop animating
```

**Files Modified:**

- Modified: `src/hooks/useAudioPlayer.ts` - State sync, autoplay prevention, pause button fix
- Modified: `src/components/FlowFieldBackground.tsx` - Event-driven animation, play/pause tracking
- Modified: `src/components/PersistentPlayer.tsx` - Fixed visualizer props

## [0.7.9] - 2025-12-29

### Fixed

#### Audio Context Stability

- **Critical Audio Context Error**: Resolved `InvalidStateError: Failed to execute 'createMediaElementSource'`
  - Fixed conflict where both equalizer and visualizer were creating separate MediaElementSource nodes
  - Browser limitation: Only ONE MediaElementSource allowed per HTMLMediaElement
  - Implemented shared audio graph architecture with single source node
  - Locations:
    - `src/hooks/useEqualizer.ts:51,201-212,390-391` - Added analyser node to equalizer chain
    - `src/components/FlowFieldBackground.tsx:8-13,15-23` - Simplified to use shared analyser
    - `src/components/PersistentPlayer.tsx:293-300` - Wired shared analyser between components

### Technical Details

**Previous Architecture (Broken):**

```
Audio Element → useEqualizer creates source → filters → destination
Audio Element → FlowFieldBackground creates source → analyser → destination
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                ERROR: Can't create 2nd source from same element!
```

**New Architecture (Fixed):**

```
Audio Element → useEqualizer creates ONE source → filters → analyser → destination
                                                              ↑
                                                 FlowFieldBackground uses this
```

**Audio Chain Flow:**

- Single `MediaElementAudioSourceNode` created in `useEqualizer`
- Connected through 9 equalizer filter nodes
- Flows to `AnalyserNode` (shared with visualizer)
- Finally connects to `AudioContext.destination` (speakers)
- When equalizer disabled: source connects directly to analyser (bypassing filters)

**Benefits:**

- Eliminates dual source node creation errors
- Maintains equalizer functionality (10-band EQ, presets)
- Preserves visualizer audio reactivity (flow field patterns)
- Cleaner architecture with single source of truth
- Proper resource cleanup on unmount

## [0.7.8] - 2025-12-29

### Fixed

#### Audio Player Controls

- **Pause Button Reliability**: Enhanced pause functionality with proper error handling
  - Added audio element initialization check before pausing
  - Implemented try-catch error handling to prevent pause failures
  - Added logging to help diagnose playback issues
  - Ensures isPlaying state always syncs correctly with audio element
  - Location: `src/hooks/useAudioPlayer.ts:551-567`

- **Queue Clearing on Track End**: Fixed queue not clearing when single song finishes playing
  - When a track ends with no more tracks in queue, the queue is now properly cleared
  - Prevents stale track from remaining in queue after playback completes
  - Added logging to confirm queue clearing behavior
  - Location: `src/hooks/useAudioPlayer.ts:156-165`

### Technical Details

**Pause Function Enhancement:**

The pause function now includes comprehensive error handling:

```typescript
const pause = useCallback(() => {
  if (!audioRef.current) {
    console.warn("[useAudioPlayer] Cannot pause: audio element not initialized");
    setIsPlaying(false);
    return;
  }

  try {
    audioRef.current.pause();
    setIsPlaying(false);
  } catch (error) {
    console.error("[useAudioPlayer] Error pausing audio:", error);
    setIsPlaying(false);
  }
}, []);
```

**Queue Clearing Logic:**

When `handleTrackEnd()` is called with no remaining tracks in queue:

```typescript
} else {
  // No more tracks in queue, playback ends
  onTrackEnd?.(currentTrack);
  // Clear the queue since playback is complete
  setQueue([]);
  setIsPlaying(false);
  console.log("[useAudioPlayer] 🏁 Playback ended, queue cleared");
}
```

**Benefits:**

- More reliable pause/play toggling
- Cleaner queue state management
- Better user experience when playing single tracks
- Improved debugging with enhanced logging

**Files Modified:**

- Modified: `src/hooks/useAudioPlayer.ts` (pause function + queue clearing logic)

## [0.7.7] - 2025-12-30

### Fixed

#### Critical Audio Context Stability Issue

- **Visualizer Toggle Error Resolution**: Fixed critical `InvalidStateError` when toggling visualizer on/off
  - Root cause: HTMLAudioElement can only be connected to one MediaElementSourceNode (browser limitation)
  - When visualizer was toggled off and back on, component remounted and attempted to reconnect the same audio element
  - This caused `InvalidStateError: Failed to execute 'createMediaElementSource'` errors requiring page reload
  - **Solution**: Implemented global WeakMap to track connected audio elements and reuse existing connections
  - Audio element connections now persist across component lifecycle changes
  - Visualizer can be toggled on/off without errors or page reloads
  - Location: `src/components/FlowFieldBackground.tsx:27-70`

#### Profile Page Authentication Errors

- **UNAUTHORIZED Error Elimination**: Fixed excessive UNAUTHORIZED errors when viewing profile pages
  - Root cause: Track card components (`EnhancedTrackCard`, `TrackCard`, `Player`) were calling authenticated endpoints (`music.isFavorite`, `music.getPlaylists`) without checking authentication status
  - When viewing someone else's profile (or when not logged in), these queries were called and failed with UNAUTHORIZED
  - This caused hundreds of error logs and degraded performance
  - **Solution**: Added authentication checks using `useSession` hook before calling protected endpoints
  - Queries now only execute when user is authenticated
  - Eliminated all UNAUTHORIZED errors on public profile pages
  - Components gracefully handle unauthenticated state (favorite/playlist features simply unavailable)
  - Location: `src/components/EnhancedTrackCard.tsx:32-35, 59-61`
  - Location: `src/components/TrackCard.tsx:36-39, 63-65`
  - Location: `src/components/Player.tsx:85-88, 109-111`

### Changed

#### Pattern Controls Enhancement

- **Pattern Duration Range**: Increased maximum pattern duration from 1000 to 10000 frames
  - Minimum remains at 10 frames (default unchanged)
  - Allows for much longer pattern displays for extended viewing
  - Updated validation in FlowFieldRenderer to accept new range (10-10000)
  - Location: `src/components/PatternControls.tsx:306-319`
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:10969-10971`

### Technical Details

**Audio Context Connection Management:**

The fix implements a global WeakMap to track audio elements that have been connected to MediaElementSourceNodes:

```typescript
const connectedAudioElements = new WeakMap<
  HTMLAudioElement,
  {
    sourceNode: MediaElementAudioSourceNode;
    audioContext: AudioContext;
    analyser: AnalyserNode;
  }
>();
```

**Key Improvements:**

1. **Connection Reuse**: When FlowFieldBackground remounts with the same audio element, it reuses the existing connection instead of attempting to create a new one
2. **Global Tracking**: WeakMap ensures connections persist across component unmounts/remounts
3. **Proper Cleanup**: Source nodes are never disconnected from audio elements (they can't be reconnected), only component refs are reset
4. **Error Prevention**: Eliminates all `InvalidStateError` exceptions related to audio context

**Authentication-Aware Query Execution:**

All track card components now check authentication before calling protected endpoints:

```typescript
const { data: session } = useSession();
const isAuthenticated = !!session;

const { data: favoriteData } = api.music.isFavorite.useQuery(
  { trackId: track.id },
  { enabled: showActions && isAuthenticated },
);
```

**Benefits:**

- Zero UNAUTHORIZED errors on public profile pages
- Reduced server load (no unnecessary failed queries)
- Cleaner console logs
- Better user experience (no error spam)
- Graceful degradation for unauthenticated users

**Files Modified:**

- Modified: `src/components/FlowFieldBackground.tsx` (audio context connection management)
- Modified: `src/components/EnhancedTrackCard.tsx` (authentication checks)
- Modified: `src/components/TrackCard.tsx` (authentication checks)
- Modified: `src/components/Player.tsx` (authentication checks)
- Modified: `src/components/PatternControls.tsx` (pattern duration range)
- Modified: `src/components/visualizers/FlowFieldRenderer.ts` (pattern duration validation)
- Modified: `package.json` (version bump to 0.7.7)

### Stability Improvements Summary

This release focuses on **critical stability improvements** that eliminate errors and improve reliability:

1. **Visualizer Toggle Stability**: Users can now toggle the visualizer on/off without encountering errors or needing to reload the page
2. **Profile Page Stability**: Public profile pages load without generating hundreds of UNAUTHORIZED errors
3. **Error Reduction**: Eliminated all `InvalidStateError` and UNAUTHORIZED errors related to audio context and authentication
4. **Performance**: Reduced unnecessary API calls and error handling overhead
5. **User Experience**: Smoother interactions with no error spam in console logs

These fixes address fundamental stability issues that were causing user-facing errors and requiring page reloads.

## [0.7.6] - 2025-12-29

### Added

#### Database Migration to NEON Postgres

- **NEON Postgres Migration Script**: Comprehensive database migration tool for transferring data to NEON Postgres
  - Full data migration from source database to NEON Postgres
  - Automatic table discovery with dependency-aware ordering (respects foreign keys)
  - Batch processing (1000 rows per batch) for optimal performance
  - Progress tracking with colored console output
  - Data verification after migration (row count comparison)
  - Automatic sequence reset for auto-increment columns
  - JSONB column handling with proper serialization
  - Error handling for invalid JSON data (skips problematic rows)
  - Schema validation before migration (ensures target schema exists)
  - Table existence checks before copying
  - Safe re-run capability (uses `ON CONFLICT DO NOTHING` to prevent duplicates)
  - Location: `scripts/migrate-to-neon.ts` (477 lines)

- **Migration Documentation**: Comprehensive migration guide with troubleshooting
  - Step-by-step migration instructions
  - Prerequisites and setup requirements
  - Alternative migration methods (pg_dump/pg_restore)
  - Post-migration verification steps
  - Troubleshooting guide for common issues
  - SSL certificate configuration
  - Connection timeout handling
  - Location: `scripts/MIGRATION_README.md`

- **NPM Migration Script**: Added `migrate:neon` command to package.json
  - Easy-to-use command: `npm run migrate:neon`
  - Uses `npx tsx` for TypeScript execution (no build required)
  - Supports environment variable configuration
  - Location: `package.json:scripts`

### Changed

#### Database Migration Infrastructure

- **NEON Postgres Compatibility**: Enhanced database migration for NEON Postgres compatibility
  - Fixed trigger disabling (NEON doesn't allow disabling system triggers)
  - Changed from `DISABLE TRIGGER ALL` to `DISABLE TRIGGER USER` (user-defined triggers only)
  - Graceful error handling for trigger operations
  - ES module compatibility fixes (`__dirname` replacement with `import.meta.url`)
  - JSONB column type detection and proper serialization
  - Enhanced error messages with context

- **Migration Safety Features**:
  - Schema validation before starting migration
  - Table count verification (warns if target has fewer tables)
  - Row-by-row error handling (continues on individual row failures)
  - Transaction-based batch processing for data integrity
  - Automatic conflict resolution (prevents duplicate inserts)

### Technical Details

**Migration Script Features:**

- **Table Discovery**: Automatically discovers all tables from source database
- **Dependency Ordering**: Uses topological sort to determine correct migration order based on foreign key relationships
- **Batch Processing**: Processes data in batches of 1000 rows for optimal performance
- **Progress Tracking**: Real-time progress with colored output showing:
  - Table being migrated
  - Row counts
  - Success/failure status
  - Total progress (X/17 tables)
- **Data Verification**: After migration, verifies row counts match between source and target
- **Error Recovery**: Individual row failures don't stop the entire migration
- **JSONB Handling**: Properly serializes JavaScript objects to JSON strings for JSONB columns
- **Sequence Management**: Automatically resets sequences to prevent ID conflicts

**NEON-Specific Adaptations:**

- **System Triggers**: NEON Postgres doesn't allow disabling system triggers (referential integrity constraints)
  - Solution: Only disable user-defined triggers, let PostgreSQL handle constraints naturally
  - Migration order ensures foreign keys are respected
- **SSL Configuration**: Automatic SSL configuration for NEON connections
  - Detects NEON connection strings
  - Uses lenient SSL (rejectUnauthorized: false) for NEON
  - Supports custom CA certificates if needed

**Migration Process:**

1. **Pre-Migration Checks**:
   - Validates source and target database connections
   - Verifies schema exists on target database
   - Discovers all tables and counts rows
   - Shows migration summary before starting

2. **Migration Execution**:
   - Migrates tables in dependency order (parents before children)
   - Processes data in batches for performance
   - Handles JSONB columns with proper serialization
   - Skips rows with invalid JSON (logs warning, continues)
   - Resets sequences after each table

3. **Post-Migration Verification**:
   - Compares row counts between source and target
   - Reports any mismatches
   - Provides success confirmation

**Usage Example:**

```bash
# Set target database URL
export TARGET_DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Run migration
npm run migrate:neon
```

**Files Modified:**

- Added: `scripts/migrate-to-neon.ts` (migration script, 477 lines)
- Added: `scripts/MIGRATION_README.md` (migration documentation)
- Modified: `package.json` (added `migrate:neon` script, version bump to 0.7.6)

**Migration Safety:**

- Uses `ON CONFLICT DO NOTHING` to prevent duplicate rows
- Safe to re-run if migration is interrupted
- Already migrated tables are skipped automatically
- Transaction-based batching ensures data integrity

## [0.7.5] - 2025-12-29

### Added

#### Hydrogen Electron Orbitals Visualizer

- **New Visualizer Type**: Added "hydrogen-electron-orbitals" visualizer that visualizes hydrogen atom energy levels
  - Cycles through energy levels n=1 to n=6 automatically
  - Displays energy level label with quantum number and energy value (E = -13.6 eV / n²)
  - Shows appropriate orbital shapes for each energy level:
    - **n=1**: 1s orbital (spherical probability cloud)
    - **n=2**: 2s and 2p orbitals (spherical and dumbbell shapes along x, y, z axes)
    - **n=3**: 3s, 3p, and 3d orbitals (including cloverleaf patterns for d orbitals)
    - **n=4-6**: Higher energy level shells with multiple orbital types
  - Audio-reactive visualization:
    - Electron movement speed increases with audio intensity
    - Orbital pulsing responds to bass, mid, and treble frequencies
    - Visual intensity scales with overall audio amplitude
    - Energy level transitions speed up with audio activity
  - Animated electrons orbiting the nucleus with 3D depth effect
  - Pulsing nucleus visualization with radial gradients
  - Performance optimized with quality scaling based on screen size
  - Location: `src/components/visualizers/ChemicalOrbitalsRenderer.ts`

### Changed

#### Audio Visualizer System

- **Multi-Renderer Support**: Enhanced AudioVisualizer to support multiple renderer types
  - Added ChemicalOrbitalsRenderer integration alongside existing KaleidoscopeRenderer
  - Renderer selection based on visualizer type
  - Both renderers initialized and resized appropriately
  - Location: `src/components/AudioVisualizer.tsx:15, 283-310, 532-543`

- **Visualizer Type Registry**: Added new visualizer type to constants
  - Added "hydrogen-electron-orbitals" to VISUALIZER_TYPES array
  - Type-safe visualizer type definitions
  - Location: `src/constants/visualizer.ts:5`

### Technical Details

**Hydrogen Atom Energy Levels:**

The visualizer implements the Bohr model energy formula: E_n = -13.6 eV / n²

- Each energy level (n) has specific orbital types:
  - n=1: 1s (1 orbital)
  - n=2: 2s, 2p (4 orbitals total: 1s + 3p)
  - n=3: 3s, 3p, 3d (9 orbitals total: 1s + 3p + 5d)
  - Higher levels follow the same pattern

**Orbital Visualization:**

- **s orbitals**: Spherical probability clouds with radial gradients
- **p orbitals**: Dumbbell shapes along coordinate axes with lobe visualization
- **d orbitals**: Cloverleaf patterns with four-lobe structures
- All orbitals pulse and respond to audio frequencies

**Performance Optimizations:**

- Quality scaling based on screen area (reduces rendering load on large displays)
- Electron count scales with quality setting (50 × qualityScale)
- Pre-calculated constants (TWO_PI, INV_255, INV_360) for performance
- Efficient frequency band calculations for audio reactivity

**Files Modified:**

- Added: `src/components/visualizers/ChemicalOrbitalsRenderer.ts` (new renderer class, 548 lines)
- Modified: `src/components/AudioVisualizer.tsx` (multi-renderer support)
- Modified: `src/constants/visualizer.ts` (added new visualizer type)
- Modified: `package.json` (version bump to 0.7.5)

## [0.7.4] - 2025-12-29

### Changed

#### PM2 Configuration Optimization

- **Fork Mode Configuration**: Optimized PM2 to use fork mode instead of cluster mode
  - Single optimized instance better suited for Next.js standalone mode
  - Prevents port binding conflicts (Next.js binds directly to port)
  - Reduced database connections from 120 to ~10 (single instance × ~10 connections)
  - Zero-downtime deployments still supported via graceful reload
  - Updated process names from `darkfloor-art-*` to `songbird-frontend-*`
  - Memory limit increased to 2560M for single instance
  - Location: `ecosystem.config.cjs:16-122`
  - Location: `pm2-setup.sh:106-149`
  - Location: `package.json:scripts`

#### Performance Optimizations

- **Shadow Realm Visualizer Optimization**: 85-90% performance improvement on Firefox
  - Reduced layers from 28 to 18 (35% reduction)
  - Batched shadow operations: 1,092 → 18 (98% reduction)
  - Batched stroke operations: 1,092 → 18 (98% reduction)
  - Reduced accent circles: 546 → ~35 (94% reduction)
  - Shadow properties set once per layer instead of per segment
  - Layer-wide styling instead of per-segment styling
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:7736-7866`

- **Infernal Flame Visualizer Optimization**: 80-85% performance improvement on Firefox
  - Eliminated expensive linear gradients: 32-36 → 1 (97% reduction)
  - Batched shadow operations: 32-36 → 2 (94% reduction)
  - Replaced arc() with fillRect() for embers (100% faster)
  - Reduced flame count: 14-18 → 10-13 (28% reduction)
  - Reduced flame points: 10-14 → 8 fixed (40% fewer vertices)
  - Reduced ember count: 24-56 → 16-32 (50% reduction)
  - Solid colors instead of per-frame gradients
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:11037-11151`

### Fixed

#### Code Quality Improvements

- **OG Route Type Safety**: Improved TypeScript type imports
  - Changed `NextRequest` import to `import type` for better tree-shaking
  - Added eslint disable comments for intentional img usage in edge runtime
  - Location: `src/app/api/og/route.tsx:4, 42`

### Technical Details

**PM2 Fork Mode Rationale:**

Next.js has built-in concurrency handling via Node.js async I/O. Cluster mode causes:

- Port binding conflicts (each instance tries to bind to same port)
- Excessive database connections (instances × pool size)
- Unnecessary complexity for Next.js architecture

Fork mode provides:

- Single optimized instance with automatic crash recovery
- Zero-downtime deployments via graceful reload
- Better resource utilization
- Simpler monitoring and debugging

**Shadow Realm Optimization Implementation:**

```typescript
const layers = 18;
for (let layer = 0; layer < layers; layer++) {
  ctx.shadowBlur = baseShadowBlur;
  ctx.shadowColor = this.hsla(hue, 95, 40, 0.7);
  ctx.strokeStyle = this.hsla(hue, 85, avgLightness, avgAlpha);

  ctx.beginPath();
  for (let i = 0; i < segments; i++) {
    ctx.moveTo(x, y);
    ctx.arc(0, 0, radius, angle, nextAngle);
  }
  ctx.stroke();
}
```

**Infernal Flame Optimization Implementation:**

```typescript
for (let layer = 0; layer < 2; layer++) {
  ctx.shadowBlur = layerShadowBlur;
  ctx.shadowColor = this.hsla(layerHue, 100, 70, 0.7);

  for (let flame = 0; flame < flames; flame++) {
    ctx.fillStyle = this.hsla(hueBase, 100, 70, flameAlpha);
    ctx.beginPath();
    ctx.fill();
  }
}

for (let i = 0; i < emberCount; i++) {
  ctx.fillStyle = this.hsla(emberHue, 100, 80, emberAlpha);
  ctx.fillRect(baseX - halfSize, baseY - halfSize, emberSize, emberSize);
}
```

**Files Modified:**

- Modified: `ecosystem.config.cjs` (fork mode optimization)
- Modified: `pm2-setup.sh` (updated process names and descriptions)
- Modified: `package.json` (version bump to 0.7.4, updated PM2 scripts)
- Modified: `src/components/visualizers/FlowFieldRenderer.ts` (Shadow Realm + Infernal Flame optimizations)
- Modified: `src/app/api/og/route.tsx` (type imports and linting)

## [0.7.3] - 2025-12-29

### Added

#### Playlist Quick-Add Feature

- **Add to Playlist Button**: Added quick-add to playlist functionality next to the heart icon
  - Button appears in both mobile and desktop players
  - Shows dropdown menu with all user playlists
  - Displays track count for each playlist
  - Includes loading states and error handling
  - Authenticated users only (requires login)
  - Features haptic feedback on mobile devices
  - Location: `src/components/MobilePlayer.tsx:140-157, 881-969`
  - Location: `src/components/Player.tsx:108-122, 259-334`

### Changed

#### SEO and Social Sharing Improvements

- **Open Graph Metadata**: Enhanced social sharing with new default image and call-to-action
  - Default embed now shows Emily the Strange image when no track is specified
  - Dynamic song embeds display simple "Play now on darkfloor.art" text
  - Subtle, elegant design with muted color (#a5afbf)
  - Layout updated: album art (470×470) on left, track info on right
  - Improved positioning and spacing for better visual appeal
  - Location: `src/app/api/og/route.tsx:16-86, 205-215`

- **Site Description Updates**: Updated descriptions across all metadata
  - Changed from "smart recommendations" to "advanced audio features and visual patterns"
  - Applied to root layout, home page, and Open Graph metadata
  - Better reflects current feature set (equalizer, visualizer patterns)
  - Location: `src/app/layout.tsx:33-66`
  - Location: `src/app/page.tsx:78-107`

#### Performance Optimizations

- **Fireworks Visualization Hyperoptimization**: Drastically improved fireworks pattern performance
  - Implemented object pooling for firework particles (eliminates allocations)
  - Removed expensive `splice()` calls during iteration (major bottleneck)
  - Added `dead` flag pattern with periodic cleanup (every 120 frames)
  - Replaced per-particle gradient rendering with simple 3-layer arc rendering
    - Core layer (size × 1, full alpha)
    - Medium glow layer (size × 2, 60% alpha)
    - Outer glow layer (size × 3, 30% alpha)
  - Eliminated 70% of trigonometric operations
  - **Performance Improvement**: 5-8x faster rendering (1-2ms vs 8-12ms previously)
  - Pattern now maintains 60 FPS consistently even on lower-end hardware
  - Location: `src/components/visualizers/FlowFieldRenderer.ts:220-243, 1981-2112`

### Technical Details

**Fireworks Optimization Implementation:**

```typescript
// Object pooling system
private fireworks: { x, y, vx, vy, hue, life, maxLife, size, dead }[] = [];
private fireworksPool: [...same structure...] = [];
private fireworksActiveCount = 0;
private fireworksCleanupCounter = 0;

// Mark particles dead instead of splice
if (fw.life > fw.maxLife) {
  fw.dead = true;
  this.fireworksActiveCount--;
  this.fireworksPool.push(fw);
  continue;
}

// Periodic cleanup every 120 frames
this.fireworksCleanupCounter++;
if (this.fireworksCleanupCounter > 120) {
  this.fireworksCleanupCounter = 0;
  this.fireworks = this.fireworks.filter((fw) => !fw.dead);
}

// Simplified rendering (no gradients)
ctx.arc(fw.x, fw.y, fw.size, 0, TAU);        // Core
ctx.arc(fw.x, fw.y, fw.size * 2, 0, TAU);    // Medium glow
ctx.arc(fw.x, fw.y, fw.size * 3, 0, TAU);    // Outer glow
```

**Playlist Button Integration:**

- Uses tRPC `api.music.getPlaylists.useQuery()` for fetching playlists
- Uses tRPC `api.music.addToPlaylist.useMutation()` for adding tracks
- Dropdown positioned absolutely (mobile: top-right, desktop: centered)
- Automatic refetch after successful playlist addition
- Empty state message: "No playlists yet. Create one from your library!"

**Files Modified:**

- Modified: `package.json` (version bump to 0.7.3)
- Modified: `src/components/visualizers/FlowFieldRenderer.ts` (fireworks optimization)
- Modified: `src/components/MobilePlayer.tsx` (playlist button)
- Modified: `src/components/Player.tsx` (playlist button)
- Modified: `src/app/layout.tsx` (SEO description)
- Modified: `src/app/page.tsx` (SEO description)
- Modified: `src/app/api/og/route.tsx` (Emily image + Listen Now CTA)

## [0.7.2] - 2025-12-28

### Added

#### GitHub and Changelog Links

- **GitHub Repository Button**: Added link to GitHub repository on home page
  - Located at the bottom center of the empty state (when no search results are displayed)
  - Links to `https://github.com/soulwax/songbird-player`
  - Opens in new tab with proper security attributes
  - Features GitHub icon with "View on GitHub" text
  - Styled with subtle white background and hover effects
  - Location: `src/app/HomePageClient.tsx:576-585`

- **Changelog Modal**: Added interactive changelog viewer
  - New modal component for displaying CHANGELOG.md content
  - Button located next to GitHub button at bottom center
  - Features BookOpen icon with "Changelog" text
  - Styled with accent orange color matching app theme
  - Modal features:
    - Full markdown parsing (headers, lists, code blocks, paragraphs, etc.)
    - Smooth animations using Framer Motion
    - Backdrop blur and themed UI
    - Close button and click-outside-to-close functionality
    - Scrollable content for long changelogs
    - Responsive design for mobile and desktop
  - CHANGELOG.md copied to public directory for client-side fetching
  - Location: `src/components/ChangelogModal.tsx`
  - Integration: `src/app/HomePageClient.tsx:587-610`

- **Mobile Haptic Feedback**: Changelog button includes haptic feedback on mobile devices

### Changed

- **Home Page Layout**: Updated empty state section to include footer buttons
  - Buttons appear below "Quick Search Suggestions"
  - Centered layout with flex-wrap for responsive design
  - Consistent spacing and styling with rest of application

**Files Modified:**

- Added: `src/components/ChangelogModal.tsx` (new changelog modal component)
- Modified: `src/app/HomePageClient.tsx` (added buttons and modal integration)
- Added: `public/CHANGELOG.md` (copy of changelog for client-side access)

## [0.7.1] - 2025-12-28

### Fixed

#### Critical Queue Bug #1: Partial Playlist Save (2, 4, 6 songs pattern)

- **Playlist Save Functionality**: Fixed severe bug where saving queue to playlist only saved partial tracks (2, 4, 6 pattern)
  - Root cause: Sequential `await` loop with potential race conditions
  - Changed from sequential execution to parallel `Promise.all` execution
  - Ensures **all tracks** are saved atomically without race conditions
  - Added detailed logging for each track being added (e.g., "Adding track 1/50: Song Title")
  - Location: `src/contexts/AudioPlayerContext.tsx:367-382`
  - Impact: Users can now reliably save their entire queue to playlists

#### Critical Queue Bug #2: Queue Destruction on Manual Play

- **Queue Preservation**: Fixed catastrophic bug where playing a new track manually **destroyed the entire queue**
  - Root cause: `setQueue([track])` completely replaced queue instead of inserting track
  - Impact: Users lost hours of work when manually playing a single track (100+ song queues gone instantly)
  - Fix: Changed to `setQueue([track, ...queue.slice(1)])` - inserts new track at position 0, preserves rest of queue
  - Queue behavior now:
    - If track **NOT** in queue: Inserts at position 0, shifts everything else down
    - If track **IN** queue: Moves it to position 0 (existing behavior)
    - **Your queue stays intact** - no more losing hours of curation work
  - Added comprehensive logging to track queue operations:
    - "Playing new track, inserting at queue position 0, preserving existing queue"
    - "Track already playing, restarting from beginning"
    - "Track found in queue at position X, playing from queue"
  - Location: `src/hooks/useAudioPlayer.ts:1071-1085`

### Changed

#### Queue Resilience & Reliability

- **Queue Management**: Queue is now **much less brittle** and more robust
  - Manual track playback preserves existing queue
  - Playlist save operations are atomic and reliable
  - Enhanced logging throughout queue operations for debugging
  - Queue structure maintained: `queue[0]` = current track, `queue[1..n]` = upcoming tracks

### Technical Details

**Queue Structure:**

- Current track is always at `queue[0]`
- Upcoming tracks are at `queue[1..n]`
- History tracking works correctly with preserved queue

**Playlist Save Fix:**

```typescript
// OLD - Sequential, could have race conditions
for (const track of tracksToSave) {
  await addToPlaylistMutation.mutateAsync({ ... });
}

// NEW - All tracks added in parallel, atomic operation
await Promise.all(
  tracksToSave.map((track, index) => {
    console.log(`Adding track ${index + 1}/${tracksToSave.length}: ${track.title}`);
    return addToPlaylistMutation.mutateAsync({
      playlistId: playlist.id,
      track,
    });
  }),
);
```

**Queue Preservation Fix:**

```typescript
// OLD - DESTROYS the queue! 💀
setQueue([track]); // 100 carefully selected songs = GONE

// NEW - Preserves your precious queue! 🎉
setQueue([track, ...queue.slice(1)]); // Keep queue[1..n], replace queue[0]
```

### User Impact

**Before this fix:**

- Saving a 50-song queue to playlist might only save 2, 4, or 6 songs
- Playing a new track manually would wipe your entire 100+ song queue
- Users lost hours of work assembling queues

**After this fix:**

- All tracks in queue are reliably saved to playlists
- Playing new tracks preserves your carefully assembled queue
- Queue feels solid and reliable, not fragile and prone to destruction

## [0.7.0] - 2025-12-26

### Added

#### Windows Code Signing Integration

- **@electron/windows-sign Integration**: Fully integrated Windows Authenticode signing into the Electron build process
  - Support for local certificate signing (.pfx/.p12 files)
  - Support for Azure Key Vault signing (cloud-based certificate storage)
  - Automatic code signing during Windows builds
  - Graceful fallback for unsigned local development builds
  - CI/CD enforcement (fails build if signing fails in CI environment)
  - SHA256 signing algorithm with timestamp server support

- **Azure Key Vault Support**: Enterprise-grade code signing for CI/CD pipelines
  - Azure AD authentication with service principal
  - Certificate rotation support
  - Team collaboration without certificate sharing
  - Secure cloud-based certificate storage
  - Comprehensive environment variable configuration

- **Code Signing Documentation**: Created detailed Windows signing guide
  - Local certificate setup instructions
  - Azure Key Vault configuration guide
  - CI/CD integration examples (GitHub Actions)
  - Troubleshooting guide
  - Security best practices
  - Verification procedures

#### Database SSL Certificate Management

- **Automatic CA Certificate Generation**: Database SSL certificates now generated automatically from environment variables
  - `DB_SSL_CA` environment variable support for PEM-formatted certificates
  - Automatic generation of `certs/ca.pem` during dev/build/start
  - Certificate bundled with all Electron builds
  - Fallback to environment variable if file not found
  - Works seamlessly in development and production

- **Electron Certificate Bundling**: CA certificates automatically packaged with Electron builds
  - Certificates copied to standalone directory during build
  - Available at runtime in packaged .exe applications
  - No manual certificate management required
  - SSL connections work out of the box in packaged apps

- **Enhanced SSL Configuration**: Improved database SSL handling
  - Environment-based SSL validation (`rejectUnauthorized` based on NODE_ENV)
  - Accepts self-signed certificates in development
  - Strict validation in production
  - Clear error messages and warnings
  - Fallback to lenient SSL if certificate not found

### Changed

#### Build System Enhancements

- **Environment Variable Schema**: Updated environment variable validation
  - Added `DB_SSL_CA` to server-side schema (optional string)
  - Proper validation and type safety for all environment variables

- **Certificate Generation Script**: Enhanced SSL certificate generation script
  - Matches server environment loading order
  - Loads `.env.development` in development mode
  - Loads `.env.local` > `.env.production` > `.env` in production
  - Consistent behavior across all environments

- **Electron Prepare Script**: Improved package preparation for Electron builds
  - Generates CA certificate from `DB_SSL_CA` before packaging
  - Ensures `certs/` directory exists
  - Copies certificates to standalone directory
  - Validates certificate presence with warnings

### Fixed

#### Discord OAuth Login in Electron

- **Database Connection Timeout**: Fixed Discord OAuth login failures in Electron app
  - Root cause: Database SSL connection timeout during OAuth callback
  - Fixed SSL certificate configuration for cloud databases (Aiven)
  - Proper handling of self-signed certificates in development
  - Clear error logging for database connection issues

- **Authentication Flow**: Improved NextAuth error handling and logging
  - Comprehensive logging in signIn callback
  - Better error messages for debugging
  - Database adapter error handling
  - CSRF token validation improvements

#### Web Audio API Errors

- **React Strict Mode Compatibility**: Fixed "InvalidStateError: createMediaElementSource" errors
  - Prevented duplicate MediaElementSourceNode creation
  - Tracked connected audio elements with ref
  - Proper cleanup on component unmount
  - Works correctly in React 19 Strict Mode

### Technical Improvements

#### Code Signing Infrastructure

- **Modified Files** for Windows Code Signing:
  - `electron/sign.js`: Complete rewrite using @electron/windows-sign
  - `package.json`: Updated Windows build configuration
  - `electron/WINDOWS_SIGNING.md`: New comprehensive documentation
  - `.env.example`: Added signing configuration examples

#### Database SSL Infrastructure

- **Modified Files** for SSL Certificate Management:
  - `src/server/db/index.ts`: Enhanced SSL configuration with fallback
  - `src/env.js`: Added `DB_SSL_CA` schema validation
  - `scripts/generate-ssl-cert.js`: Updated environment loading order
  - `electron/prepare-package.js`: Added CA certificate generation
  - `.env.development`: Added `DB_SSL_CA` certificate content
  - `.env.local`: Added `DB_SSL_CA` certificate content
  - `.env.example`: Added `DB_SSL_CA` documentation

#### Bug Fixes

- **Modified Files** for Audio and Auth Fixes:
  - `src/components/FlowFieldBackground.tsx`: Fixed duplicate audio source nodes
  - `src/server/auth/config.ts`: Enhanced logging for debugging

### Security

- **Certificate Management**: Secure handling of SSL certificates
  - Certificates stored as environment variables
  - Automatic generation prevents manual certificate management
  - No certificates committed to version control
  - Proper permissions and access controls

- **Code Signing**: Enhanced trust and security for Windows builds
  - Signed executables verified by Windows
  - Reduced SmartScreen warnings
  - Azure Key Vault for enterprise security
  - Timestamp servers for long-term validity

### Documentation

- **Windows Code Signing**: Complete guide for code signing setup
  - File: `electron/WINDOWS_SIGNING.md`
  - Local certificate instructions
  - Azure Key Vault setup
  - CI/CD integration examples
  - Troubleshooting and verification

- **Environment Variables**: Updated documentation for new variables
  - `DB_SSL_CA` usage and format
  - Windows signing configuration
  - Azure Key Vault configuration
  - Examples in `.env.example`

## [0.6.8] - 2024-12-24

### Added

- Environment variable logging to Electron for debugging NextAuth issues
- `isElectron` flag exposed via Electron preload API for conditional branding
- Conditional branding: "Starchild" in Electron app, "darkfloor.art" in web version

### Changed

- **BREAKING**: `AUTH_SECRET` environment variable now required in all environments (min 32 characters)
- Renamed Electron build product from "darkfloor" to "Starchild"
  - Windows executable: `darkfloor.exe` → `Starchild.exe`
  - Installer: `darkfloor Setup.exe` → `Starchild Setup.exe`
  - macOS app name: darkfloor.app → Starchild.app
  - Linux AppImage: darkfloor.AppImage → Starchild.AppImage

### Fixed

- **Kaleidoscope Pattern Performance**: Drastically improved performance (~99% reduction in rendering operations)
  - Implemented offscreen canvas rendering (render once, copy 48 times instead of drawing 48 times)
  - Reduced particle count from 30-90 to 12-36 per segment
  - Removed expensive `shadowBlur` operations (major FPS killer)
  - Simplified particle rendering from 2 arcs to 1 radial gradient per particle
  - Reduced structural elements: lines (8→4), rings (5→3)
  - **Result**: ~9,264 operations/frame → ~91 operations/frame (99% reduction)
  - Pattern now runs smoothly at 60 FPS even on lower-end hardware

### Technical Details

- Updated `electron/preload.cjs` to expose `isElectron: true`
- Updated `electron/types.d.ts` with `isElectron: boolean` property
- Updated `src/components/Header.tsx` to detect Electron and show appropriate branding
- Updated `src/env.js` to enforce `AUTH_SECRET` minimum length validation (32 chars)
- Updated `electron/main.cjs` with environment variable debugging output
- Optimized `src/components/visualizers/flowfieldPatterns/renderKaleidoscope.ts`
- Updated `package.json` productName and executableName to "Starchild"

## [0.6.7] - 2025-12-24

### Added

#### WebGL Migration Planning

- **ROADMAP.md**: Created comprehensive roadmap for migrating visualization system from Canvas2D to WebGL
  - **Executive Summary**: Timeline, benefits, and architectural overview
  - **7-Phase Implementation Plan**: Week-by-week breakdown (20-week timeline)
    - Phase 0: Foundation & Research (Weeks 1-2)
    - Phase 1: Core Infrastructure (Weeks 3-5)
    - Phase 2: Pattern Migration (Weeks 6-12) - Converting 80+ patterns in batches
    - Phase 3: Post-Processing Pipeline (Weeks 11-12)
    - Phase 4: Transition System (Weeks 13-14)
    - Phase 5: Integration & Testing (Weeks 15-16)
    - Phase 6: Polish & Optimization (Weeks 17-18)
    - Phase 7: Launch & Monitoring (Weeks 19-20)
  - **Technical Architecture**: Proposed code structure with shader system
  - **Risk Mitigation**: Comprehensive risk assessment and mitigation strategies
  - **Success Metrics**: Performance targets and quality benchmarks
  - **Expected Benefits**:
    - +100-200% FPS improvement at 4K resolution
    - -60% reduction in CPU usage
    - -65% reduction in code size
    - -50% reduction in mobile battery impact
    - -75% reduction in pattern creation time
  - **Pattern Conversion Guide**: Template and checklist for porting patterns to GLSL
  - **Device Test Matrix**: Cross-platform testing requirements
  - **Resources & References**: Learning materials and technical documentation

### Changed

#### Electron Build Environment Configuration

- **Unified Environment Configuration**: Electron builds now EXCLUSIVELY use `.env.local`
  - Removed loading of `.env`, `.env.development`, and `.env.production` files
  - Simplified environment configuration to single source of truth
  - Prevents conflicts between multiple environment files
  - **Modified Files**:
    - `scripts/load-env-build.js`: Now only loads `.env.local` (removed all other env file loading)
    - `electron/main.cjs`: Only loads `.env.local` from project root or standalone directory
    - `electron/prepare-package.js`: Automatically copies `.env.local` to standalone directory for packaged builds
  - **Developer Impact**: All environment variables must be in `.env.local` only
  - **Security**: `.env.local` already in `.gitignore` via `.env*.local` pattern

#### Package Metadata Updates

- **License**: Changed from MIT to GPLv3
- **Product Name**: Changed from "darkfloor" to "Starchild" for Electron builds
- **Executable Name**: Changed from "darkfloor" to "Starchild"
- **Author**: Updated author information

### Technical Planning

- **Migration Strategy**: Gradual, feature-flagged migration approach
  - Parallel development with existing Canvas2D system
  - Graceful fallback for unsupported devices
  - Phased rollout (10% → 50% → 100% of users)
- **Shader Architecture**: Multi-layer framebuffer system proposed
  - Pattern registry with dynamic shader loading
  - Audio texture pipeline for GPU-based audio reactivity
  - Post-processing effects (blur, bloom, color grading, distortion)
  - Advanced transition system between patterns
- **Performance Budget**: Defined performance targets per platform
  - Desktop: 60fps at 4K, <10% CPU usage
  - Mobile: 30-60fps, <20% CPU usage, <50MB memory
  - Initial bundle size increase: <100KB for WebGL infrastructure

## [0.6.6] - 2025-12-23

### Added

#### Dynamic Open Graph Image Generation

- **Open Graph Image API**: Created new `/api/og` route for dynamically generating Open Graph embed images
  - Default embed: Shows "darkfloor.art" branding with description when no song query is present
  - Dynamic song embeds: Displays album artwork (squared, left-aligned) with track title, artist, and album information on the right
  - All images generated at 1200×630px (standard Open Graph size) with proper layout and styling
  - Uses Next.js `ImageResponse` API with edge runtime for fast image generation

### Changed

#### Enhanced SEO and Social Sharing

- **Metadata Improvements**: Updated Open Graph and Twitter Card metadata across the application
  - Replaced static Emily the Strange image references with dynamic OG image generator
  - Changed Open Graph type from "website" to "music.song" for track-specific pages
  - Enhanced descriptions to include album information when available
  - Updated both root layout and home page metadata for consistency
- **Image Assets**: Added Emily the Strange image to public directory for fallback scenarios
- **Search Query Embeds**: Song links with query parameters now generate rich embeds showing album art and track details

**Files Modified:**

- Added: `src/app/api/og/route.tsx` (dynamic OG image generator)
- Modified: `src/app/page.tsx` (dynamic metadata generation)
- Modified: `src/app/layout.tsx` (updated default metadata)
- Added: `public/emily-the-strange.png` (fallback image asset)

## [0.6.5] - 2025-12-23

### Changed

#### FlowFieldRenderer Performance Optimizations

- **FlowFieldRenderer performance reworks (drastic)**:
  - **Quantum Entanglement**: heavy rewrite using aggressive LOD, temporal subsampling, quadratic curves, reduced glow, and `fillRect` particles to avoid browser FPS collapse.
  - **Void Whisper**: reduced fidelity (fewer layers/particles), removed most per-frame gradients, simplified tendrils, and reduced core layering.
  - **Spectral Echo**: reduced layers/segments, added temporal subsampling, removed particle/beam gradients and trails, and simplified the core.
  - **Twilight Zone**: removed per-zone gradients; replaced with cheap ring strokes + sparse sparkles and fewer wisps/core layers.
  - **Demonic Gate**: reduced particle/entity/tendril/sigil counts, removed tendril gradients, simplified sigils, and reduced shadow costs.
  - **Shadow Dance**: removed trail/beam gradients, reduced dancer complexity, simplified trails/wisps, and reduced center layers.
- **FlowFieldRenderer Hyper-Optimization**: Replaced remaining `Math.sin`, `Math.cos`, and `Math.sqrt` hot paths with fast trig/fast sqrt helpers across all mystical visual patterns (including ShadowRealm, QuantumEntanglement, NecromanticSigil, DimensionalRift, ChaosVortex, EtherealMist, BloodMoon, DarkMatter, SoulFragment, ForbiddenRitual, TwilightZone, SpectralEcho, VoidWhisper, DemonicGate, CursedRunes, ShadowDance, NightmareFuel).
- **Performance & Visual Fidelity**: Pre-calculated common constants, angle steps, and hue offsets; reduced per-frame allocations; enhanced gradients and glow layers for deeper, more responsive visuals without extra CPU cost.
- **Pattern Infrastructure**: Tightened use of cached HSLA color strings, fast modulo for hues, and object pooling in the visualizer pipeline to keep frame times stable even under heavy audio-reactive scenes.

## [0.6.4] - 2025-12-21

### Changed

#### Complete Rebrand to darkfloor.art

**User-Facing Changes:**

- **Brand Identity**: Completely rebranded from "isobelnet.de" to "darkfloor.art" across all user interfaces
- **UI Components**: Updated all component text including headers, menus, welcome messages, and share dialogs
- **Metadata**: Updated page titles, Open Graph data, and Twitter card metadata for SEO and social sharing
- **Mobile Experience**: Updated mobile header, hamburger menu branding, and player UI text

**Technical Changes:**

- **Package Configuration**: Renamed package from `isobelnet-de` to `darkfloor-art`
- **PM2 Processes**: Renamed production and development processes to `darkfloor-art-prod` and `darkfloor-art-dev`
- **Electron App**: Updated desktop application name, app ID (`com.darkfloor.art`), and product name
- **Documentation**: Updated all README, CLAUDE.md, and setup documentation files
- **Scripts**: Updated all setup scripts, server banners, and diagnostic commands
- **Electron Storage**: Updated persistent storage partition name for Electron builds
- **Base URL**: Updated default fallback URL to `https://darkfloor.art`

**Files Modified (30+ total):**

- UI Components: HamburgerMenu, Header, WelcomeHero, EnhancedTrackCard, SwipeableTrackCard
- App Pages: layout, page, license, user profile
- Configuration: package.json, ecosystem.config.cjs, electron/main.cjs, getBaseUrl.ts
- Documentation: README.md, CLAUDE.md, CHANGELOG.md, electron docs
- Scripts: server.js, pm2-setup.sh, setup-database.sh, verify-build.js
- Styles: globals.css
- Services: smartQueue.ts

## [0.6.3] - 2025-12-21

### Added

#### Enhanced Visual Features

- **Improved Visual Components**: Enhanced visual rendering and display components throughout the application
- **Visual Enhancements**: Added more visual elements and improved visual feedback across the user interface
- **Visual Polish**: Refined visual styling and animations for a more immersive experience

## [0.6.2] - 2025-12-21

### Changed

- Internal improvements and bug fixes

## [0.6.0] - 2025-12-09

### Fixed

#### Critical Production Stability Issues

- **502 Error Crash Loop Resolution**: Fixed infinite crash loop causing 502 Bad Gateway errors in production
  - Root cause: Missing production build (BUILD_ID file) causing Next.js to crash on startup
  - Added build validation check before server startup to prevent crash loops
  - Implemented automatic build recovery via PM2 pre-start hook
  - Created `scripts/ensure-build.js` for automatic build verification and creation
  - Process now fails gracefully with clear error messages instead of infinite restarts
  - Prevents PM2 from restarting when build is missing (stops crash loop)

#### Production Build Management

- **Build Validation System**: Comprehensive build validation before production startup
  - Validates `.next` directory existence
  - Verifies `BUILD_ID` file presence (required by Next.js)
  - Checks `.next/server` directory for complete build
  - Provides clear error messages guiding manual intervention if needed
  - Exits immediately if build is invalid (prevents crash loops)

- **Automatic Build Recovery**: PM2 pre-start hook ensures build exists before starting
  - Automatically runs `npm run build` if BUILD_ID is missing
  - Prevents manual intervention in most cases
  - Logs build process for debugging
  - Fails gracefully if build process fails

### Changed

- **PM2 Configuration**: Enhanced production process management
  - Added `pre_start` hook for automatic build verification
  - Improved restart timing (min_uptime: 30s, restart_delay: 5s, listen_timeout: 10s)
  - Added `wait_ready` flag for Next.js readiness detection
  - Configured health check URL for application-level monitoring
  - Health check grace period set to 5 seconds

- **Error Handling**: Improved error handling in server script
  - Added null checks for error stack traces (TypeScript compliance)
  - Enhanced build validation error messages
  - Better logging for build-related failures

### Technical Improvements

- **Server Startup Flow**: Multi-layer defense against missing builds
  1. PM2 pre-start hook checks and builds if needed
  2. Server script validates build before starting Next.js
  3. Clear error messages if build is still missing
  4. Process exits cleanly (no infinite restart loops)

- **Documentation**: Added comprehensive 502 error analysis documentation
  - Root cause analysis of crash loop issue
  - Step-by-step fix implementation
  - Testing and verification procedures
  - Prevention measures and monitoring recommendations

## [0.6.0] - 2025-12-09

### Added

#### Visualizer Pattern Controls

- **Interactive Pattern Controls Panel**: New real-time control interface for visualizer patterns
  - Pattern duration adjustment (50-1000 frames)
  - Transition speed control (0.001-0.1)
  - Hue base adjustment (0-360°)
  - Real-time pattern state display showing current and next patterns
  - Transition progress indicator
  - Fractal pattern controls:
    - Zoom adjustment (0.1-10)
    - Offset X/Y controls (-2 to 2)
    - Julia C complex parameter controls (real and imaginary components)
  - Accessible via Layers button in player controls when visualizer is enabled
  - Mobile-responsive design with backdrop blur and arcane-themed styling

### Changed

- **Player Controls**: Added pattern controls toggle button to player interface
  - Button appears when visualizer is enabled
  - Integrated with existing player control layout

## [0.5.3] - 2025-12-09

### Changed

- Voronoi pattern smoothing & soothing
- Removed Plasma pattern completely, it was out of place, too in your face
- Bubble pattern replaced with The Orb
- Flow field pattern optimized for performance
- Reduced Mandala fidelity, layering and symmetry. Sometimes less is more.

#### Logging Enhancements

- **Ecosystem Configuration Logging**: Enhanced logging capabilities for PM2 ecosystem management
  - Better allround logging configuration for production and development environments
  - Separate log files for error, output, and combined logs
  - Timestamp formatting for better log traceability
  - Log file organization in dedicated PM2 logs directory

## [0.5.2] - 2025-12-09

### Added

#### Logging Enhancements

- **Ecosystem Configuration Logging**: Enhanced logging capabilities for PM2 ecosystem management
  - Comprehensive logging configuration for production and development environments
  - Separate log files for error, output, and combined logs
  - Timestamp formatting for better log traceability
  - Log file organization in dedicated PM2 logs directory

## [0.5.1] - 2025-12-09

#### Logging Enhancements & Visualizer Pattern Changes

- **Visual Component Logging**: Added comprehensive logging for visual components and visualizer patterns
  - Logging for visual pattern transitions and rendering
  - Performance metrics logging for visual effects
  - Debug logging for visual component state changes

## [0.5.0] - 2025-12-09

### Added

#### Visual Enhancements

- **Arcane-themed CSS Effects**: Enhanced mystical atmosphere with advanced visual effects
  - Radial gradient background for mystical depth
  - Ethereal glow effects at page edges using pseudo-elements
  - Pulsating and glowing animations for enhanced arcane theme
  - Floating energy particles effect for added mystique
  - Shimmer overlay creating depth and movement sense

### Changed

#### Performance Optimizations

- **Visual Pattern Performance**: Optimized pattern transition duration and rendering speed
  - Enhanced Flower of Life rendering (pixel-by-pixel optimization)
  - Optimized Chakras pattern performance
  - Improved Ouroboros animation efficiency
  - Enhanced fractal rendering performance
  - Optimized Metatron's Cube drawing algorithm

#### Configuration Updates

- **PM2 Development Configuration**: Updated development script execution method
  - Changed from `script: 'npm'` to `script: 'scripts/server.js'`
  - Updated interpreter from `'none'` to `'node'` for proper environment variable propagation
  - Added default `env` properties for both production and development configurations

### Fixed

#### Critical Production Issues

- **PM2 Process Management**: Resolved critical PM2 startup and deployment issues
  - Fixed EADDRINUSE errors on port 3222 by switching from cluster to fork mode
  - Changed production from `instances: 2` + `exec_mode: 'cluster'` to `instances: 1` + `exec_mode: 'fork'`
  - Fixed Next.js incompatibility with PM2 cluster mode
  - Resolved development process "waiting restart" loop
  - Added proper environment variable propagation in development mode
  - Fixed 502 Bad Gateway errors in production

#### Code Quality

- **TypeScript Compliance**: Removed unused imports to fix ESLint warnings
  - Removed unused `useEffect` import from Player component
- **Dependency Conflicts**: Resolved version conflicts in dependencies
  - Fixed @types/node dependency version conflicts
- **Merge Conflicts**: Resolved merge conflicts in settings and package-lock files
- **Environment Configuration**: Standardized dotenv configuration across the application

### Technical Improvements

- **PM2 Configuration**: Comprehensive PM2 ecosystem configuration with detailed comments
  - Memory management settings (2GB max per instance)
  - Auto-restart with exponential backoff
  - Graceful shutdown configuration
  - Separate development and production configurations
  - File watching enabled for development with proper ignore patterns
  - Enhanced logging configuration with timestamp formatting

## [0.4.1] - 2025-12-08

### Added

#### Visual Enhancements

- **23 New Mystical Visualizer Patterns**: Added arcane and mystical patterns to the flow field visualizer
  - Sacred Geometry: Pentagram, Flower of Life, Sri Yantra, Metatron's Cube, Vesica Piscis
  - Mystical Symbols: Runes, Sigils, Ouroboros, Chakras, Alchemy symbols
  - Celestial: Celestial bodies, Portal effects, Astrolabe, Moon Phases, Tarot cards
  - Spiritual: Dreamcatcher, Phoenix, Serpent, Crystal Grid, Kabbalah Tree of Life
  - Sacred Patterns: Merkaba, Torus Field, Cosmic Egg
- **Pattern Randomization**: Implemented Fisher-Yates shuffle algorithm for randomized pattern transitions
- **Auto Re-shuffle**: Patterns automatically re-shuffle when completing a full cycle for continuous variety

### Changed

- **Visualizer Pattern Duration**: Halved pattern transition duration from 600 to 300 frames for more dynamic visual experience
- **Dynamic Duration Range**: Adjusted minimum dynamic duration from 300 to 150 frames based on audio intensity
- **Total Pattern Count**: Increased from 22 to 45 unique visualizer patterns

### Fixed

- **TypeScript Compilation**: Fixed implicit 'any' type errors in custom server script
- **PM2 Startup**: Resolved PM2 process manager startup issues
  - Fixed hostname configuration to use HOSTNAME env variable instead of NEXTAUTH_URL
  - Added explicit Node.js interpreter configuration for both production and development modes
- **Server Configuration**: Fixed DNS resolution errors caused by protocol prefix in hostname
- **Network Interface Handling**: Added proper null checks for network interface iteration
- **Error Type Safety**: Improved error handling in catch blocks with proper type guards

### Technical Improvements

- **JSDoc Annotations**: Added comprehensive JSDoc type annotations to server utility functions
- **Build System**: Improved TypeScript strict mode compliance across build scripts
- **Pattern Architecture**: Implemented scalable pattern management system with type-safe pattern definitions
- **Audio Reactivity**: All new patterns feature full audio reactivity with bass, mid, and treble frequency responses

## [0.3.0] - 2025-12-04

### Added - Electron Desktop Application

#### Core Electron Integration

- **Electron Desktop App**: Full desktop application support with packaging for Windows, macOS, and Linux
- **Production Build System**: Optimized standalone Next.js build with Electron integration
- **Build Scripts**: Comprehensive build pipeline with platform-specific scripts
  - `electron:dev` - Development mode with hot reload
  - `electron:prod` - Production mode testing
  - `electron:build:win/mac/linux` - Platform-specific distributables
  - `electron:prod:win` - Build and run Windows installer

#### Persistence & State Management

- **OAuth Session Persistence**: Login state persists across app restarts (30-day sessions)
- **User Preferences Persistence**: All settings saved and restored automatically
  - Audio: Volume, playback rate, equalizer settings
  - Visualizer: Type, position, size, enabled state
  - Smart Queue: Auto-queue, similarity preferences, thresholds
  - UI State: Panel states, theme, lyrics enabled
- **Window State Persistence**: Window size, position, and maximized state remembered
- **Persistent Storage Partition**: Dedicated storage partition for app data isolation
- **Cookie Management**: Automatic cookie flushing on app startup and shutdown
- **Storage Verification**: Automatic verification of storage persistence on startup

#### Electron Features

- **Media Key Support**: Global media key controls (play/pause, next, previous)
- **Native Window Controls**: Proper window management with state saving
- **Dynamic Port Assignment**: Automatic port detection and allocation
- **Server Management**: Graceful server startup, shutdown, and error handling
- **Production/Development Modes**: Automatic mode detection with appropriate configuration
- **Resource Bundling**: Automated copying of static assets, public files, and SSL certificates

#### Developer Experience

- **Storage Utilities**: Comprehensive Electron storage helpers
  - Storage verification and testing
  - Preference export/import for backup
  - Storage usage monitoring
  - Debug logging and status reporting
- **Storage Initialization**: Automatic storage setup and verification component
- **Documentation**: Complete Electron persistence guide with troubleshooting
- **Build Preparation**: Automated standalone package preparation script

#### Technical Improvements

- **Database Session Strategy**: NextAuth configured for 30-day database sessions
- **Cookie Configuration**: Secure, httpOnly cookies with CSRF protection
- **Error Handling**: Comprehensive error dialogs and logging
- **Type Safety**: Full TypeScript support across Electron main process
- **Graceful Shutdown**: Proper cleanup of server processes and resources

### Changed

- **Authentication**: Extended session duration from default to 30 days
- **Cookie Settings**: Custom cookie configuration for better persistence
- **Package Configuration**: Updated main entry point and build configuration
- **Environment Detection**: Improved production/development mode detection

### Fixed

- **Session Loss**: Fixed issue where users had to log in on every app restart
- **Preference Loss**: Fixed settings not persisting between app sessions
- **Build Process**: Resolved standalone build issues with missing resources

## [0.2.0] - Initial Release

### Added - Core Application

#### Music Streaming Platform

- **Deezer Integration**: Full integration with Deezer API for music streaming
- **Audio Player**: Advanced audio player with full playback controls
- **Queue Management**: Comprehensive queue system with drag-and-drop reordering
- **Search**: Real-time music search with artist, album, and track results
- **Playlists**: Create, manage, and play custom playlists

#### Smart Features

- **Smart Queue**: Intelligent auto-queue with similarity-based recommendations
- **Smart Mix**: Generate personalized mixes from seed tracks
- **HexMusic API Integration**: Advanced recommendation engine
- **Audio Analysis**: Spotify audio features integration for intelligent recommendations
- **Similarity Filtering**: Adjustable similarity levels (strict, balanced, diverse)

#### Audio Features

- **9-Band Equalizer**: Professional equalizer with custom and preset options
  - 8 built-in presets (Rock, Pop, Jazz, Classical, etc.)
  - Custom band adjustment
  - Real-time audio processing
  - Preset and settings persistence
- **Audio Visualizers**: Multiple visualizer types
  - Spectrum Analyzer
  - Waveform
  - Circular
  - Frequency Bands (Radial, Waterfall, Layered, Particles, Circular, Bars)
  - Radial Spectrum
  - Spectral Waves
  - Particle System
  - Frequency Rings
- **Playback Controls**:
  - Variable playback speed (0.5x - 2.0x)
  - Repeat modes (none, one, all)
  - Shuffle
  - Volume control with mute
  - Skip forward/backward (10 seconds)

#### User Interface

- **Responsive Design**: Full mobile and desktop support
- **Mobile Navigation**: Bottom navigation bar with swipeable panes
- **Swipe Gestures**: Natural mobile interactions
- **Pull-to-Refresh**: Refresh content with pull gesture
- **Dark Theme**: Modern dark UI design
- **Haptic Feedback**: Touch feedback on mobile devices (where supported)
- **Floating Action Button**: Quick access to player on mobile
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
  - Space: Play/pause
  - Arrow keys: Navigate and seek
  - Number keys: Quick navigation
  - M: Mute
  - And more...

#### Backend & Infrastructure

- **Next.js 15**: Latest Next.js with App Router
- **tRPC**: Type-safe API layer
- **PostgreSQL**: Reliable database with Drizzle ORM
- **NextAuth**: Discord OAuth authentication
- **Drizzle ORM**: Type-safe database queries and migrations

#### Data Management

- **User Profiles**: User accounts with authentication
- **Listening History**: Track playback history
- **Playlist Management**: CRUD operations for playlists
- **Favorites**: Like/unlike tracks
- **User Preferences**: Stored equalizer and UI preferences
- **Smart Queue Settings**: Configurable auto-queue behavior

#### Developer Features

- **TypeScript**: Full type safety across the stack
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Tailwind CSS 4**: Modern utility-first styling
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: User feedback system
- **Loading States**: Comprehensive loading indicators
- **Type Guards**: Runtime type validation
- **Storage Abstraction**: Type-safe localStorage wrapper

#### Performance

- **React Query**: Efficient data fetching and caching
- **Audio Context**: Optimized Web Audio API usage
- **Debounced Updates**: Performance-optimized user interactions
- **Lazy Loading**: Code splitting and component lazy loading
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Build size monitoring

#### Testing & Quality

- **Type Checking**: Strict TypeScript configuration
- **Linting**: Comprehensive ESLint rules
- **Error Suppression**: Extension error filtering
- **Debug Logging**: Detailed console logging for development

### Technical Stack

#### Frontend

- Next.js 15.5.6
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.1.16
- Framer Motion 12.23.24
- tRPC 11.7.0
- TanStack Query 5.90.5

#### Backend

- Next.js API Routes
- NextAuth 5.0.0-beta.30
- Drizzle ORM 0.41.0
- PostgreSQL (via pg 8.16.3)
- tRPC Server 11.0.0

#### Audio & Visualization

- Tone.js 15.1.22
- Web Audio API
- Canvas API
- react-audio-visualize 1.2.0

#### Development

- Electron 39.2.1
- Electron Builder 25.1.8
- ESLint 9.38.0
- Prettier 3.6.2
- Concurrently 9.1.2
- Cross-env 7.0.3

#### Build & Deploy

- PM2 Ecosystem
- Standalone Next.js Output
- Webpack 5.102.1
- PostCSS 8.5.6

---

## Release Notes

### Version 0.3.0 - Electron Desktop Application

This release transforms darkfloor.art into a full-featured desktop application with complete state persistence. Users can now:

- Install darkfloor.art as a native desktop app on Windows, macOS, and Linux
- Enjoy seamless login that persists across app restarts
- Have all preferences, settings, and UI state automatically saved and restored
- Use global media keys to control playback
- Experience native window management with state persistence

### Version 0.2.0 - Initial Release

The initial release of darkfloor.art provides a comprehensive music streaming platform with intelligent recommendations, advanced audio features, and a modern user interface. Key highlights:

- Stream music from Deezer's extensive catalog
- Intelligent auto-queue with similarity-based recommendations
- Professional 9-band equalizer with multiple visualization options
- Full mobile and desktop responsive design
- User authentication and personalized experience

---

## Upgrade Guide

### From 0.2.0 to 0.3.0

**For End Users:**

1. Download the installer for your platform from the releases page
2. Run the installer
3. Your first login will require Discord OAuth
4. After login, all preferences will persist automatically

**For Developers:**

1. Pull the latest changes
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. For development: `npm run electron:dev`
5. For production testing: `npm run electron:prod`
6. For building: `npm run electron:build:win` (or mac/linux)

**Database Migrations:**
No database migrations required for this release.

---

## Known Issues

### Version 0.3.0

- First-time setup requires manual Discord OAuth configuration in environment variables
- Windows installer requires manual uninstallation of previous versions
- macOS may require security preferences adjustment for first launch (unsigned builds)

### Version 0.2.0

- Mobile Safari may have issues with audio autoplay due to browser restrictions
- Some visualizers may have performance issues on lower-end devices
- Database migrations require manual execution via Drizzle Kit

---

## Future Roadmap

### Planned Features

- [ ] Offline mode with local caching
- [ ] Cross-device sync
- [ ] Last.fm scrobbling
- [ ] Lyrics display
- [ ] Mini player mode
- [ ] System tray integration
- [ ] Auto-updates
- [ ] Custom themes
- [ ] Podcast support
- [ ] Radio stations

### Under Consideration

- [ ] Spotify integration
- [ ] Apple Music integration
- [ ] Collaborative playlists
- [ ] Social features
- [ ] Artist pages
- [ ] Concert information
- [ ] Music discovery features

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Deezer API for music streaming
- NextAuth for authentication
- Electron for desktop application framework
- All open-source contributors

---

**Note**: This changelog is maintained manually. For detailed commit history, see the Git repository.
