import {
  AUTH_REQUIRED_EVENT,
  buildSpotifyLoginUrl,
  clearInMemoryAccessToken,
  getCsrfTokenFromCookies,
  getInMemoryAccessToken,
  handleSpotifyCallbackHash,
  refreshAccessToken,
  restoreSpotifySession,
  resolveFrontendRedirectPath,
} from "@/services/spotifyAuthClient";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("spotifyAuthClient", () => {
  beforeEach(() => {
    clearInMemoryAccessToken();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
    window.sessionStorage.clear();
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

    const callbackFetchCall = fetchMock.mock.calls[0] as
      | [RequestInfo | URL, RequestInit | undefined]
      | undefined;
    expect(callbackFetchCall).toBeDefined();
    if (!callbackFetchCall) {
      throw new Error("Expected callback /api/auth/me request");
    }

    expect(callbackFetchCall[0]).toBe("https://www.darkfloor.one/api/auth/me");
    const callbackInit = callbackFetchCall[1] ?? {};
    expect(callbackInit.method).toBe("GET");
    expect(callbackInit.credentials).toBe("include");

    const callbackHeaders = new Headers(callbackInit.headers);
    expect(callbackHeaders.get("accept")).toBe("application/json");
    expect(callbackHeaders.get("authorization")).toBe("Bearer app-token-1");
  });

  it("emits auth-required event and clears token on refresh 401", async () => {
    document.cookie = "sb_csrf_token=csrf-refresh-token; path=/";
    window.history.replaceState(
      {},
      "",
      "/auth/spotify/callback?next=%2Flibrary#access_token=app-token-1&token_type=Bearer&expires_in=3600",
    );

    const authRequiredListener = vi.fn();
    window.addEventListener(AUTH_REQUIRED_EVENT, authRequiredListener as EventListener);

    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "user-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

    await handleSpotifyCallbackHash();
    expect(getInMemoryAccessToken()).toBe("app-token-1");

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(Error);
    expect(getInMemoryAccessToken()).toBeNull();
    expect(authRequiredListener).toHaveBeenCalledTimes(1);

    const authRequiredEvent = authRequiredListener.mock.calls[0]?.[0] as CustomEvent<{
      callbackUrl: string;
      reason: string;
    }>;
    expect(authRequiredEvent.detail.callbackUrl).toBe("/library");
    expect(authRequiredEvent.detail.reason).toBe("unauthorized");

    window.removeEventListener(
      AUTH_REQUIRED_EVENT,
      authRequiredListener as EventListener,
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

    const refreshFetchCall = fetchMock.mock.calls[0] as
      | [RequestInfo | URL, RequestInit | undefined]
      | undefined;
    expect(refreshFetchCall).toBeDefined();
    if (!refreshFetchCall) {
      throw new Error("Expected refresh request");
    }

    expect(refreshFetchCall[0]).toBe("/api/auth/spotify/refresh");
    const refreshInit = refreshFetchCall[1] ?? {};
    expect(refreshInit.method).toBe("POST");
    expect(refreshInit.credentials).toBe("include");

    const refreshHeaders = new Headers(refreshInit.headers);
    expect(refreshHeaders.get("accept")).toBe("application/json");
    expect(refreshHeaders.get("x-csrf-token")).toBe("csrf-refresh-token");
  });

  it("restores spotify session from sessionStorage without csrf cookie", async () => {
    window.history.replaceState(
      {},
      "",
      "/auth/spotify/callback?next=%2Flibrary#access_token=app-token-2&token_type=Bearer&expires_in=3600",
    );

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "user-2" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await handleSpotifyCallbackHash();
    expect(getInMemoryAccessToken()).toBe("app-token-2");

    clearInMemoryAccessToken();
    expect(getInMemoryAccessToken()).toBeNull();

    window.sessionStorage.setItem(
      "sb_spotify_auth_state_v1",
      JSON.stringify({
        accessToken: "app-token-2",
        tokenType: "Bearer",
        expiresAtMs: Date.now() + 3_600_000,
        spotifyAccessToken: null,
        spotifyTokenType: "Bearer",
        spotifyExpiresAtMs: null,
      }),
    );

    const restored = await restoreSpotifySession();
    expect(restored).toBe(true);
    expect(getInMemoryAccessToken()).toBe("app-token-2");
  });
});
