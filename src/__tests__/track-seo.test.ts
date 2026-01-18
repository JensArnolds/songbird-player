import { describe, expect, it, vi } from "vitest";

const mockTrack = {
  id: 1456114562,
  title: "Just Like Me",
  duration: 213,
  artist: {
    id: 1,
    name: "Gem and the Deadheads",
  },
  album: {
    id: 2,
    title: "Rebellion",
    cover_small: "https://cdn-images.dzcdn.net/images/cover/small.jpg",
    cover_medium: "https://cdn-images.dzcdn.net/images/cover/medium.jpg",
  },
};

describe("track SEO metadata", () => {
  it("builds an OG image with track details", async () => {
    vi.resetModules();
    vi.doMock("@/env", () => ({
      env: {
        NEXT_PUBLIC_API_URL: "https://api.starchildmusic.com",
        STREAMING_KEY: "streaming-key",
        NEXT_PUBLIC_NEXTAUTH_URL: "https://starchildmusic.com",
        NEXTAUTH_URL: "https://starchildmusic.com",
      },
    }));
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("music/track/") || url.includes("api.deezer.com/track/")) {
        return {
          ok: true,
          json: async () => mockTrack,
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response;
    });

    vi.stubGlobal("fetch", fetchMock);

    const { generateMetadata } = await import("@/app/track/[id]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: String(mockTrack.id) }),
    });

    const ogImage = metadata.openGraph?.images?.[0] as { url: string } | undefined;
    expect(ogImage?.url).toBeTruthy();

    const ogUrl = new URL(ogImage?.url as string);
    expect(ogUrl.pathname).toBe("/api/og");
    expect(ogUrl.searchParams.get("title")).toBe(mockTrack.title);
    expect(ogUrl.searchParams.get("artist")).toBe(mockTrack.artist.name);
    expect(ogUrl.searchParams.get("album")).toBe(mockTrack.album.title);
    expect(ogUrl.searchParams.get("cover")).toBe(mockTrack.album.cover_medium);
    expect(ogUrl.searchParams.get("duration")).toBe(String(mockTrack.duration));
    expect(ogUrl.searchParams.get("v")).toBe(String(mockTrack.id));
  });
});
