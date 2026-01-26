// File: src/__tests__/player.integration.stability.test.ts

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { Track } from "@/types";

vi.mock("@/utils/api", () => ({
  getStreamUrlById: vi.fn().mockResolvedValue("https://example.com/stream.mp3"),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const createMockTrack = (id: number): Track => ({
  id,
  title: `Track ${id}`,
  artist: { id, name: `Artist ${id}` },
  album: { id, title: `Album ${id}`, cover_medium: "" },
  duration: 180 + id * 10,
  preview: `https://example.com/preview${id}.mp3`,
});

describe("Player Integration Stability Tests", () => {
  let mockAudioElement: Partial<HTMLAudioElement>;
  let eventListeners: Record<string, ((event: Event) => void)[]>;
  let playPromise: Promise<void>;
  let playResolve: () => void;

  beforeEach(() => {
    eventListeners = {};

    playPromise = new Promise((resolve) => {
      playResolve = resolve;
    });

    mockAudioElement = {
      play: vi.fn().mockReturnValue(playPromise),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event]?.push(handler);
      }),
      removeEventListener: vi.fn(
        (event: string, handler: (e: Event) => void) => {
          if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event]?.filter(
              (h) => h !== handler,
            ) ?? [];
          }
        },
      ),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      paused: true,
      currentTime: 0,
      duration: 180,
      volume: 0.7,
      muted: false,
      readyState: 4,
      src: "",
      playbackRate: 1,
      defaultPlaybackRate: 1,
      style: {} as CSSStyleDeclaration,
      isConnected: false,
      preservesPitch: true,
    };

    global.Audio = vi.fn().mockImplementation(() => mockAudioElement);

    global.navigator.serviceWorker = {
      ready: Promise.resolve({
        active: {
          postMessage: vi.fn(),
        },
      } as unknown as ServiceWorkerRegistration),
    } as unknown as ServiceWorkerContainer;

    Object.defineProperty(document, "visibilityState", {
      writable: true,
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  const simulateTrackEnd = () => {
    const endedHandlers = eventListeners["ended"] ?? [];
    const event = new Event("ended");
    endedHandlers.forEach((handler) => handler(event));
  };

  const simulateTimeUpdate = (time: number) => {
    if (mockAudioElement) {
      mockAudioElement.currentTime = time;
    }
    const timeUpdateHandlers = eventListeners["timeupdate"] ?? [];
    const event = new Event("timeupdate");
    timeUpdateHandlers.forEach((handler) => handler(event));
  };

  describe("Complete User Flow: Listen to Multiple Tracks", () => {
    it("should play 3 tracks in sequence without player disappearing", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = [
        createMockTrack(1),
        createMockTrack(2),
        createMockTrack(3),
      ];

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      expect(result.current.queue).toHaveLength(3);

      for (let i = 0; i < 3; i++) {
        expect(result.current.currentTrack?.id).toBe(tracks[i]?.id);

        act(() => {
          void result.current.play();
        });

        await act(async () => {
          playResolve();
          await playPromise;
        });

        expect(result.current.isPlaying).toBe(true);

        act(() => {
          simulateTimeUpdate(mockAudioElement.duration ?? 180);
        });

        act(() => {
          simulateTrackEnd();
        });

        await waitFor(() => {
          if (i < 2) {
            expect(result.current.currentTrack?.id).toBe(tracks[i + 1]?.id);
          }
        });

        expect(result.current.audioRef.current).not.toBeNull();
      }
    });

    it("should handle user switching tracks rapidly", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = Array.from({ length: 10 }, (_, i) =>
        createMockTrack(i + 1),
      );

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.playNext();
        });

        await waitFor(() => {
          expect(result.current.currentTrack).toBeDefined();
        });

        expect(result.current.audioRef.current).not.toBeNull();
      }

      expect(result.current.queue.length).toBeGreaterThan(0);
      expect(result.current.audioRef.current).not.toBeNull();
    });
  });

  describe("Repeat Mode Stability", () => {
    it("should handle repeat-one mode without errors", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const track = createMockTrack(1);

      act(() => {
        result.current.addToQueue(track);
        result.current.setRepeatMode("one");
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      expect(result.current.isPlaying).toBe(true);

      for (let i = 0; i < 3; i++) {
        act(() => {
          simulateTrackEnd();
        });

        await waitFor(() => {
          expect(mockAudioElement.play).toHaveBeenCalled();
        });

        expect(result.current.currentTrack?.id).toBe(track.id);
        expect(result.current.audioRef.current).not.toBeNull();
      }
    });

    it("should handle repeat-all mode with queue rotation", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = [createMockTrack(1), createMockTrack(2)];

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
        result.current.setRepeatMode("all");
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          simulateTrackEnd();
        });

        await waitFor(() => {
          expect(result.current.currentTrack).toBeDefined();
        });

        expect(result.current.audioRef.current).not.toBeNull();
        expect(result.current.queue.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Background Playback Simulation", () => {
    it("should maintain playback when page goes to background", async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(1));
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "hidden",
        });
        const event = new Event("visibilitychange");
        document.dispatchEvent(event);
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.audioRef.current).not.toBeNull();
      expect(result.current.currentTrack).toBeDefined();

      vi.useRealTimers();
    });

    it("should resume playback when returning to foreground", async () => {
      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(1));
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "hidden",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.audioRef.current).not.toBeNull();
    });
  });

  describe("Error Recovery", () => {
    it("should recover from stream URL fetch failure", async () => {
      const { getStreamUrlById } = await import("@/utils/api");
      const onError = vi.fn();

      (getStreamUrlById as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("https://example.com/stream.mp3");

      const { result } = renderHook(() => useAudioPlayer({ onError }));

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(1));
      });

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(2));
        result.current.playNext();
      });

      expect(result.current.audioRef.current).not.toBeNull();
    });

    it("should handle playback errors without crashing", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAudioPlayer({ onError }));

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(1));
      });

      if (mockAudioElement.play) {
        (mockAudioElement.play as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error("Playback not allowed"),
        );
      }

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.audioRef.current).not.toBeNull();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("Queue Management Stability", () => {
    it("should handle adding/removing tracks while playing", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(createMockTrack(1));
        result.current.addToQueue(createMockTrack(2));
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      act(() => {
        result.current.addToQueue(createMockTrack(3));
      });

      expect(result.current.queue).toHaveLength(3);

      act(() => {
        result.current.removeFromQueue(2);
      });

      expect(result.current.queue).toHaveLength(2);
      expect(result.current.audioRef.current).not.toBeNull();
      expect(result.current.isPlaying).toBe(true);
    });

    it("should handle clearing queue gracefully", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = Array.from({ length: 5 }, (_, i) =>
        createMockTrack(i + 1),
      );

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
      expect(result.current.audioRef.current).not.toBeNull();
    });
  });

  describe("Shuffle Mode Stability", () => {
    it("should maintain queue integrity when toggling shuffle", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = Array.from({ length: 5 }, (_, i) =>
        createMockTrack(i + 1),
      );

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      const originalQueueLength = result.current.queue.length;

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.queue).toHaveLength(originalQueueLength);
      expect(result.current.audioRef.current).not.toBeNull();

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.queue).toHaveLength(originalQueueLength);
    });
  });

  describe("Long Session Stability", () => {
    it("should handle extended playback session without memory leaks", async () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = Array.from({ length: 20 }, (_, i) =>
        createMockTrack(i + 1),
      );

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      const initialIntervalCount = setIntervalSpy.mock.calls.length;

      for (let i = 0; i < 10; i++) {
        act(() => {
          void result.current.play();
        });

        await act(async () => {
          playResolve();
          await playPromise;
        });

        act(() => {
          vi.advanceTimersByTime(10000);
        });

        act(() => {
          simulateTrackEnd();
        });

        await waitFor(() => {
          expect(result.current.audioRef.current).not.toBeNull();
        });
      }

      const finalIntervalCount = setIntervalSpy.mock.calls.length;
      const intervalGrowth = finalIntervalCount - initialIntervalCount;

      expect(intervalGrowth).toBeLessThan(20);

      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.useRealTimers();
      clearIntervalSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });
  });
});
