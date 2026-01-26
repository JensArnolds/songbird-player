// File: src/__tests__/playback-rate.stability.test.ts

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

describe("Playback Rate Stability Tests", () => {
  let mockAudioElement: Partial<HTMLAudioElement>;
  let eventListeners: Record<string, ((event: Event) => void)[]>;
  let playPromise: Promise<void>;
  let playResolve: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
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
      removeEventListener: vi.fn(),
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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Playback Rate Enforcement", () => {
    it("should enforce playback rate = 1 during initialization", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      expect(mockAudioElement.playbackRate).toBe(1);
      expect(mockAudioElement.defaultPlaybackRate).toBe(1);
    });

    it("should detect and fix playback rate drift every 1 second", async () => {
      const { logger } = await import("@/utils/logger");
      const warnSpy = vi.spyOn(logger, "warn");

      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 1.5;
        mockAudioElement.defaultPlaybackRate = 1.2;
      }

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Playback rate drift detected"),
          expect.objectContaining({
            playbackRate: 1.5,
            defaultPlaybackRate: 1.2,
          }),
        );
      });

      expect(mockAudioElement.playbackRate).toBe(1);
      expect(mockAudioElement.defaultPlaybackRate).toBe(1);

      warnSpy.mockRestore();
    });

    it("should enforce playback rate on ratechange event", async () => {
      const { logger } = await import("@/utils/logger");
      const warnSpy = vi.spyOn(logger, "warn");

      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 2.0;
      }

      const ratechangeHandlers = eventListeners["ratechange"] ?? [];
      act(() => {
        ratechangeHandlers.forEach((handler) => handler(new Event("ratechange")));
      });

      await waitFor(() => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Playback rate change detected"),
          expect.objectContaining({
            playbackRate: 2.0,
          }),
        );
      });

      expect(mockAudioElement.playbackRate).toBe(1);

      warnSpy.mockRestore();
    });

    it("should enforce playback rate after play() operation", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 1.25;
      }

      await act(async () => {
        await result.current.play();
        playResolve();
        await playPromise;
      });

      expect(mockAudioElement.playbackRate).toBe(1);
      expect(mockAudioElement.defaultPlaybackRate).toBe(1);
    });
  });

  describe("Mobile Background/Foreground Transitions", () => {
    it("should enforce playback rate after visibility change", async () => {
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

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 1.5;
      }

      act(() => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          value: "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });

    it("should enforce playback rate after page resume", async () => {
      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.paused = true;
        mockAudioElement.playbackRate = 1.75;
      }

      act(() => {
        document.dispatchEvent(new Event("resume"));
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });

    it("should enforce playback rate after pageshow event", async () => {
      const { result } = renderHook(() =>
        useAudioPlayer({ keepPlaybackAlive: true }),
      );

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.paused = true;
        mockAudioElement.playbackRate = 1.3;
      }

      act(() => {
        window.dispatchEvent(new Event("pageshow"));
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });
  });

  describe("Rapid Playback Rate Changes", () => {
    it("should handle multiple rapid rate changes without corruption", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      const ratechangeHandlers = eventListeners["ratechange"] ?? [];

      for (let i = 0; i < 10; i++) {
        if (mockAudioElement) {
          mockAudioElement.playbackRate = 1 + i * 0.1;
        }

        act(() => {
          ratechangeHandlers.forEach((handler) =>
            handler(new Event("ratechange")),
          );
        });
      }

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });

    it("should enforce playback rate within 1 second of drift", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 2.0;
      }

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockAudioElement.playbackRate).toBe(2.0);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });
  });

  describe("preservesPitch Enforcement", () => {
    it("should enforce preservesPitch = true", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      const preserve = mockAudioElement as {
        preservesPitch?: boolean;
        webkitPreservesPitch?: boolean;
      };

      expect(preserve.preservesPitch).toBe(true);
      expect(preserve.webkitPreservesPitch).toBe(true);
    });

    it("should re-enable preservesPitch if it becomes false", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      const preserve = mockAudioElement as {
        preservesPitch?: boolean;
        webkitPreservesPitch?: boolean;
      };

      preserve.preservesPitch = false;
      preserve.webkitPreservesPitch = false;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(preserve.preservesPitch).toBe(true);
        expect(preserve.webkitPreservesPitch).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null audio element gracefully", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      (result.current as { audioRef: { current: null } }).audioRef.current =
        null;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(() => {
        vi.advanceTimersByTime(1000);
      }).not.toThrow();
    });

    it("should handle fractional playback rates", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 1.0000001;
      }

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });

    it("should handle extreme playback rates", async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await waitFor(() => {
        expect(result.current.audioRef.current).not.toBeNull();
      });

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      if (mockAudioElement) {
        mockAudioElement.playbackRate = 10.0;
      }

      const ratechangeHandlers = eventListeners["ratechange"] ?? [];
      act(() => {
        ratechangeHandlers.forEach((handler) => handler(new Event("ratechange")));
      });

      await waitFor(() => {
        expect(mockAudioElement.playbackRate).toBe(1);
      });
    });
  });
});
