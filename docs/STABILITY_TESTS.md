# Stability Tests

Tests for player stability issues (disappearing player, unexpected page reloads, audio speed-up).

## Test Files

- **ErrorBoundary.stability.test.tsx** - Error recovery without page reload (7/7 passing)
- **useAudioPlayer.stability.test.ts** - Audio player state management, race conditions, memory leaks
- **player.integration.stability.test.ts** - Complete user flows, multi-track playback, repeat modes
- **playback-rate.stability.test.ts** - Playback rate enforcement, mobile speed-up prevention

## Run Tests

```bash
npm test -- stability
npm test -- ErrorBoundary.stability
npm test:watch -- stability
```

## What's Tested

- Error boundary graceful recovery (no `window.location.reload()`)
- Play/pause race conditions
- State synchronization (UI ↔ audio element)
- Service worker keep-alive cleanup
- Memory leak prevention (interval/timeout cleanup)
- Rapid track changes
- Repeat mode stability
- Background playback
- Playback rate enforcement (prevents audio speed-up)
- Mobile background/foreground transitions
- preservesPitch enforcement

## Issues Fixed

### Player Stability
1. Error boundary called `window.location.reload()` → Now calls `resetError()`
2. Empty catch blocks masked failures → Now logs errors properly
3. Sync interval recreated every 500ms → Now stable with empty deps
4. Keep-alive intervals orphaned → Now uses ref for cleanup
5. Play/pause 100ms timeout → Now immediate flag reset
6. Null audio element no state update → Now sets `isPlaying(false)`

### Playback Rate (Audio Speed-Up)
7. 10s enforcement interval too slow → Now enforces every 1s
8. No enforcement during resume → Now enforces after visibility/pageshow/resume
9. Reactive only fixes → Now enforces proactively after play()
10. No logging on rate changes → Now logs with details for debugging
