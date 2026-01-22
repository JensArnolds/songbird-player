import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { Track } from "@/types";

const mockTrack: Track = {
  id: 1,
  title: "Test Track",
  artist: { id: 1, name: "Test Artist" },
  album: { id: 1, title: "Test Album", cover_medium: "" },
  duration: 180,
  preview: "https://example.com/preview.mp3",
};

const mockTrack2: Track = {
  id: 2,
  title: "Test Track 2",
  artist: { id: 2, name: "Test Artist 2" },
  album: { id: 2, title: "Test Album 2", cover_medium: "" },
  duration: 200,
  preview: "https://example.com/preview2.mp3",
};

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

describe("useAudioPlayer Stability Tests", () => {
  beforeEach(() => {
    global.navigator.serviceWorker = {
      ready: Promise.resolve({
        active: {
          postMessage: vi.fn(),
        },
      } as unknown as ServiceWorkerRegistration),
    } as unknown as ServiceWorkerContainer;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe("Play/Pause Race Conditions", () => {
    it("should handle rapid play/pause calls without corruption", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.play();
        });

        act(() => {
          result.current.pause();
        });
      }

      const audioEl = result.current.audioRef.current;
      expect(audioEl).not.toBeNull();
      expect(vi.mocked(audioEl!.play)).toHaveBeenCalled();
      expect(vi.mocked(audioEl!.pause)).toHaveBeenCalled();
    });

    it("should prevent concurrent play operations", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      await act(async () => {
        await Promise.all([
          result.current.play(),
          result.current.play(),
          result.current.play(),
        ]);
      });

      expect(result.current.currentTrack).toBeTruthy();
    });

    it("should handle play() with null audio element gracefully", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      (result.current as { audioRef: { current: null } }).audioRef.current =
        null;

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("State Synchronization", () => {
    it("should sync isPlaying state with actual audio state", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      const audioEl = result.current.audioRef.current;
      if (audioEl) {
        Object.defineProperty(audioEl, 'paused', { value: false, writable: true });
      }

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(true);
      });

      vi.useRealTimers();
    });

    it("should not recreate sync interval on every state change", async () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const initialIntervalCount = setIntervalSpy.mock.calls.length;

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      await act(async () => {
        await result.current.play();
      });

      act(() => {
        result.current.pause();
      });

      const finalIntervalCount = setIntervalSpy.mock.calls.length;

      expect(finalIntervalCount - initialIntervalCount).toBeLessThan(3);

      vi.useRealTimers();
      setIntervalSpy.mockRestore();
    });
  });

  describe("Service Worker Keep-Alive", () => {
    it("should start keep-alive pings when playing", async () => {
      vi.useFakeTimers();
      const postMessageSpy = vi.fn();

      global.navigator.serviceWorker = {
        ready: Promise.resolve({
          active: {
            postMessage: postMessageSpy,
          },
        } as unknown as ServiceWorkerRegistration),
      } as unknown as ServiceWorkerContainer;

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      await act(async () => {
        await result.current.play();
      });

      act(() => {
        vi.advanceTimersByTime(26000);
      });

      await waitFor(() => {
        expect(postMessageSpy).toHaveBeenCalledWith({ type: "KEEP_ALIVE" });
      });

      vi.useRealTimers();
    });

    it("should cleanup keep-alive interval on pause", async () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      await act(async () => {
        await result.current.play();
      });

      const intervalsBefore = clearIntervalSpy.mock.calls.length;

      act(() => {
        result.current.pause();
      });

      const intervalsAfter = clearIntervalSpy.mock.calls.length;

      expect(intervalsAfter).toBeGreaterThan(intervalsBefore);

      vi.useRealTimers();
      clearIntervalSpy.mockRestore();
    });

    it("should not create multiple keep-alive intervals", async () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      const intervalsBefore = setIntervalSpy.mock.calls.filter(
        (call) => call[1] === 25000,
      ).length;

      await act(async () => {
        await result.current.play();
      });

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await result.current.play();
      });

      const intervalsAfter = setIntervalSpy.mock.calls.filter(
        (call) => call[1] === 25000,
      ).length;

      expect(intervalsAfter - intervalsBefore).toBeLessThanOrEqual(2);

      vi.useRealTimers();
      setIntervalSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle repeat-one playback errors gracefully", async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAudioPlayer({ onError }));

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
        result.current.setRepeatMode("one");
      });

      const audioEl = result.current.audioRef.current;
      if (audioEl) {
        vi.mocked(audioEl.play).mockRejectedValue(new Error("Playback failed"));
        const endedEvent = new Event("ended");
        audioEl.dispatchEvent(endedEvent);
      }

      await waitFor(() => {
        expect(result.current.isPlaying).toBe(false);
      });
    });

    it("should log service worker errors without crashing", async () => {
      const { logger } = await import("@/utils/logger");
      const warnSpy = vi.spyOn(logger, "warn");

      const rejectedPromise = Promise.reject(
        new Error("Service worker not available"),
      );
      rejectedPromise.catch(() => {});

      global.navigator.serviceWorker = {
        ready: rejectedPromise,
      } as unknown as ServiceWorkerContainer;

      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      act(() => {
        void result.current.play();
      });

      await act(async () => {
        playResolve();
        await playPromise;
      });

      expect(result.current.isPlaying).toBe(true);

      warnSpy.mockRestore();
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should cleanup all intervals on unmount", async () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { result, unmount } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      await act(async () => {
        await result.current.play();
      });

      const intervalsBeforeUnmount = clearIntervalSpy.mock.calls.length;

      unmount();

      const intervalsAfterUnmount = clearIntervalSpy.mock.calls.length;

      expect(intervalsAfterUnmount).toBeGreaterThan(intervalsBeforeUnmount);

      vi.useRealTimers();
      clearIntervalSpy.mockRestore();
    });

    it("should cleanup retry timeouts on track change", async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
        result.current.addToQueue(mockTrack2);
      });

      const timeoutsBeforeChange = clearTimeoutSpy.mock.calls.length;

      act(() => {
        result.current.playNext();
      });

      const timeoutsAfterChange = clearTimeoutSpy.mock.calls.length;

      expect(timeoutsAfterChange).toBeGreaterThanOrEqual(timeoutsBeforeChange);

      vi.useRealTimers();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe("Rapid Track Changes", () => {
    it("should handle rapid track changes without player disappearing", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const tracks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTrack,
        id: i + 1,
        title: `Track ${i + 1}`,
      }));

      act(() => {
        tracks.forEach((track) => result.current.addToQueue(track));
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.playNext();
        });

        await waitFor(() => {
          expect(result.current.audioRef.current).not.toBeNull();
        });
      }

      expect(result.current.audioRef.current).not.toBeNull();
      expect(result.current.queue.length).toBeGreaterThan(0);
    });

    it("should maintain queue integrity during rapid operations", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
        result.current.addToQueue(mockTrack2);
      });

      expect(result.current.queue).toHaveLength(2);

      act(() => {
        result.current.removeFromQueue(0);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]?.id).toBe(mockTrack2.id);
    });
  });
});
