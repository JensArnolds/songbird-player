import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

type GetRouteHandler = (request: NextRequest) => Promise<Response>;
type PostRouteHandler = (request: NextRequest) => Promise<Response>;
type GetRouteModule = { GET: GetRouteHandler };
type PostRouteModule = { POST: PostRouteHandler };
type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];

function makeRequest(path: string, init?: NextRequestInit): NextRequest {
  return new NextRequest(`http://localhost:3222${path}`, init);
}

async function loadGetRoute(modulePath: string): Promise<GetRouteModule> {
  return (await import(modulePath)) as unknown as GetRouteModule;
}

async function loadPostRoute(modulePath: string): Promise<PostRouteModule> {
  return (await import(modulePath)) as unknown as PostRouteModule;
}

describe("Spotify auth proxy routes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("proxies canonical auth routes through API_V2_URL", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        API_V2_URL: "https://api.example.com/",
      },
    }));

    const capturedUrls: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      capturedUrls.push(url);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const spotifyRoute = await loadGetRoute("@/app/api/auth/spotify/route");
    const callbackRoute = await loadGetRoute(
      "@/app/api/auth/spotify/callback/route",
    );
    const refreshRoute = await loadPostRoute(
      "@/app/api/auth/spotify/refresh/route",
    );
    const meRoute = await loadGetRoute("@/app/api/auth/me/route");

    await spotifyRoute.GET(
      makeRequest("/api/auth/spotify?frontend_redirect_uri=http%3A%2F%2Flocalhost%3A3222%2Fauth%2Fspotify%2Fcallback"),
    );
    await callbackRoute.GET(
      makeRequest("/api/auth/spotify/callback?code=abc&state=123"),
    );
    await refreshRoute.POST(
      makeRequest("/api/auth/spotify/refresh", {
        method: "POST",
        headers: { "x-csrf-token": "csrf-token" },
      }),
    );
    await meRoute.GET(makeRequest("/api/auth/me"));

    const paths = capturedUrls.map((url) => new URL(url).pathname);
    expect(paths).toEqual([
      "/api/auth/spotify",
      "/api/auth/spotify/callback",
      "/api/auth/spotify/refresh",
      "/api/auth/me",
    ]);
  });

  it("forwards redirect location and set-cookie headers", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        API_V2_URL: "https://api.example.com/",
      },
    }));

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          location: "http://localhost:3222/auth/spotify/callback#access_token=abc",
          "set-cookie":
            "sb_app_refresh_token=token; Path=/; HttpOnly, sb_csrf_token=csrf; Path=/",
        },
      }),
    );

    const callbackRoute = await loadGetRoute(
      "@/app/api/auth/spotify/callback/route",
    );
    const response = await callbackRoute.GET(
      makeRequest("/api/auth/spotify/callback?code=abc&state=123"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("/auth/spotify/callback");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("sb_app_refresh_token");
    expect(setCookie).toContain("sb_csrf_token");
  });

  it("returns 500 when API_V2_URL is missing", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        API_V2_URL: undefined,
      },
    }));

    const fetchMock = vi.spyOn(global, "fetch");
    const meRoute = await loadGetRoute("@/app/api/auth/me/route");
    const response = await meRoute.GET(makeRequest("/api/auth/me"));
    const body = (await response.json()) as { error?: string };

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/API_V2_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
