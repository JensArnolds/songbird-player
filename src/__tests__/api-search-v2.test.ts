// File: src/__tests__/api-search-v2.test.ts

import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;

describe("Music Search API (V2-only)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("calls V2 search with key/kbps and returns parsed response", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        API_V2_URL: "https://darkfloor.one/",
        SONGBIRD_API_KEY: "test-key",
      },
    }));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 1 }], total: 1 }), {
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock;

    const { GET } = await import("@/app/api/music/search/route");

    const req = {
      nextUrl: new URL(
        "http://localhost:3000/api/music/search?q=I+Disappear&offset=10&kbps=128",
      ),
    } as NextRequest;

    const res = await GET(req);
    const body = await res.json();

    expect(body).toEqual({ data: [{ id: 1 }], total: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.origin).toBe("https://darkfloor.one");
    expect(calledUrl.pathname).toBe("/music/search");
    expect(calledUrl.searchParams.get("key")).toBe("test-key");
    expect(calledUrl.searchParams.get("kbps")).toBe("128");
    expect(calledUrl.searchParams.get("q")).toBe("I Disappear");
    expect(calledUrl.searchParams.get("offset")).toBe("10");
  });

  it("returns 500 when V2 is not configured", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        API_V2_URL: undefined,
        SONGBIRD_API_KEY: undefined,
      },
    }));

    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const { GET } = await import("@/app/api/music/search/route");

    const req = {
      nextUrl: new URL("http://localhost:3000/api/music/search?q=test"),
    } as NextRequest;

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/API_V2_URL|SONGBIRD_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
