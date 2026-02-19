import SpotifyAuthCallbackPage from "@/app/auth/spotify/callback/page";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams("next=%2Flibrary"),
}));

const authState = vi.hoisted(() => ({
  handleSpotifyCallbackHash: vi.fn(),
  resolveFrontendRedirectPath: vi.fn((next: string | null | undefined) => {
    void next;
    return "/library";
  }),
  startSpotifyLogin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationState.replace }),
  useSearchParams: () => ({
    get: (key: string) => navigationState.searchParams.get(key),
  }),
}));

vi.mock("@/services/spotifyAuthClient", () => {
  class SpotifyAuthClientError extends Error {
    status: number | null;

    constructor(message: string, status: number | null = null) {
      super(message);
      this.status = status;
    }
  }

  return {
    SpotifyAuthClientError,
    handleSpotifyCallbackHash: authState.handleSpotifyCallbackHash,
    resolveFrontendRedirectPath: authState.resolveFrontendRedirectPath,
    startSpotifyLogin: authState.startSpotifyLogin,
  };
});

describe("SpotifyAuthCallbackPage", () => {
  beforeEach(() => {
    navigationState.replace.mockClear();
    navigationState.searchParams = new URLSearchParams("next=%2Flibrary");
    authState.handleSpotifyCallbackHash.mockReset();
    authState.handleSpotifyCallbackHash.mockResolvedValue({
      accessToken: "token",
      profile: { id: "user-1" },
    });
    authState.startSpotifyLogin.mockClear();
  });

  it("redirects to next path when callback handling succeeds", async () => {
    render(<SpotifyAuthCallbackPage />);

    await waitFor(() => {
      expect(authState.handleSpotifyCallbackHash).toHaveBeenCalledTimes(1);
      expect(navigationState.replace).toHaveBeenCalledWith("/library");
    });
  });

  it("shows denied message and retry action for access_denied errors", async () => {
    navigationState.searchParams = new URLSearchParams(
      "next=%2Flibrary&error=access_denied",
    );

    render(<SpotifyAuthCallbackPage />);

    expect(
      await screen.findByText(
        "Spotify authorization was denied. Please try again and accept consent.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Spotify Sign-In" }));
    expect(authState.startSpotifyLogin).toHaveBeenCalledWith("/library");
  });
});
