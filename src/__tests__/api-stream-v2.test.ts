// File: src/__tests__/api-stream-v2.test.ts

import { describe, expect, it, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const originalFetch = global.fetch;

describe("Stream API (V2-only)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("streams via V2 and forwards Range header", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_V2_API_URL: "https://darkfloor.one/",
        SONGBIRD_API_KEY: "test-key",
      },
    }));

    const streamBody = new Uint8Array([1, 2, 3]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(streamBody, {
        status: 206,
        headers: {
          "content-type": "audio/mpeg",
          "content-range": "bytes 0-2/3",
          "accept-ranges": "bytes",
          "content-length": "3",
        },
      }),
    );
    global.fetch = fetchMock;

    const { GET } = await import("@/app/api/stream/route");

    const req = {
      nextUrl: new URL("http://localhost:3000/api/stream?q=I+Disappear&kbps=320"),
      headers: {
        get: (name: string) => {
          const key = name.toLowerCase();
          if (key === "range") return "bytes=0-2";
          if (key === "user-agent") return "vitest";
          return null;
        },
      },
    } as NextRequest;

    const res = await GET(req);

    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("Content-Range")).toBe("bytes 0-2/3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.origin).toBe("https://darkfloor.one");
    expect(calledUrl.pathname).toBe("/music/stream");
    expect(calledUrl.searchParams.get("key")).toBe("test-key");
    expect(calledUrl.searchParams.get("kbps")).toBe("320");
    expect(calledUrl.searchParams.get("q")).toBe("I Disappear");

    const options = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = (options?.headers ?? {}) as Record<string, string>;
    expect(headers.Range).toBe("bytes=0-2");
  });

  it("returns 500 when V2 is not configured", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_V2_API_URL: undefined,
        SONGBIRD_API_KEY: undefined,
      },
    }));

    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const { GET } = await import("@/app/api/stream/route");

    const req = {
      nextUrl: new URL("http://localhost:3000/api/stream?q=test"),
      headers: new Headers(),
    } as NextRequest;

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("V2 API not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
