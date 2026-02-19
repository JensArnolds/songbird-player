import {
  buildSpotifyLoginUrl,
  clearInMemoryAccessToken,
  getCsrfTokenFromCookies,
  getInMemoryAccessToken,
  handleSpotifyCallbackHash,
  refreshAccessToken,
  resolveFrontendRedirectPath,
} from "@/services/spotifyAuthClient";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("spotifyAuthClient", () => {
  beforeEach(() => {
    clearInMemoryAccessToken();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("builds login URL with frontend callback URI", () => {
    window.history.replaceState({}, "", "/signin");
    const loginUrl = buildSpotifyLoginUrl("/playlists?tab=mine");
    const parsed = new URL(loginUrl, window.location.origin);
    const frontendRedirect = parsed.searchParams.get("frontend_redirect_uri");

    expect(parsed.pathname).toBe("/api/auth/spotify");
    expect(frontendRedirect).toContain("/auth/spotify/callback");
    expect(frontendRedirect).toContain("next=%2Fplaylists%3Ftab%3Dmine");
  });

  it("sanitizes redirect destinations to same-origin paths", () => {
    expect(resolveFrontendRedirectPath("/library")).toBe("/library");
    expect(resolveFrontendRedirectPath("https://evil.example/phish")).toBe("/");
  });

  it("extracts csrf token from cookies", () => {
    const token = getCsrfTokenFromCookies(
      "a=1; sb_csrf_token=csrf-123; b=2",
    );
    expect(token).toBe("csrf-123");
  });

  it("handles callback hash and validates /api/auth/me", async () => {
    window.history.replaceState(
      {},
      "",
      "/auth/spotify/callback?next=%2Flibrary#access_token=app-token-1&token_type=Bearer&expires_in=3600&spotify_access_token=spotify-token-1&spotify_token_type=Bearer&spotify_expires_in=3600",
    );

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "user-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await handleSpotifyCallbackHash();

    expect(result.accessToken).toBe("app-token-1");
    expect(getInMemoryAccessToken()).toBe("app-token-1");
    expect(window.location.hash).toBe("");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer app-token-1",
        }),
      }),
    );
  });

  it("refreshes access token using csrf header", async () => {
    document.cookie = "sb_csrf_token=csrf-refresh-token; path=/";

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "new-access-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const refreshed = await refreshAccessToken();

    expect(refreshed).toBe("new-access-token");
    expect(getInMemoryAccessToken()).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/spotify/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          Accept: "application/json",
          "X-CSRF-Token": "csrf-refresh-token",
        }),
      }),
    );
  });
});
