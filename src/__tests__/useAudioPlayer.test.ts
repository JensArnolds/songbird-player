// File: src/__tests__/useAudioPlayer.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

describe("useAudioPlayer", () => {
  it("creates and attaches the global audio element", async () => {
    document.body.innerHTML = "";

    const { result } = renderHook(() => useAudioPlayer());

    await waitFor(() => {
      expect(result.current.audioRef.current).not.toBeNull();
    });

    const audioEl = document.querySelector(
      'audio[data-audio-element="global-player"]',
    );

    expect(audioEl).toBeInTheDocument();
    expect(audioEl?.getAttribute("playsinline")).toBe("true");
    expect(audioEl?.getAttribute("webkit-playsinline")).toBe("true");
    expect(audioEl?.getAttribute("x5-playsinline")).toBe("true");
  });
});
