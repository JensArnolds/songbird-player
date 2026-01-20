// File: src/__tests__/og-image-generation.test.ts

import { describe, expect, it, vi, beforeAll } from "vitest";
import { GET } from "@/app/api/og/route";
import type { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const TEST_TRACKS = [
  {
    id: 16620382,
    searchQuery: "film burn yppah",
    name: "Film Burn - Yppah",
  },
  {
    id: 1913577097,
    searchQuery: "apocalyptica path",
    name: "Path - Apocalyptica",
  },
];

async function fetchTrackData(trackId: number) {
  const apiUrl = "https://api.starchildmusic.com";
  const streamingKey = "avnadminavnadminavnadmin";

  try {
    const url = new URL(`music/track/${trackId}`, apiUrl);
    url.searchParams.set("key", streamingKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return await response.json();
    }

    const deezerUrl = new URL(`https://api.deezer.com/track/${trackId}`);
    const deezerResponse = await fetch(deezerUrl.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (deezerResponse.ok) {
      return await deezerResponse.json();
    }

    throw new Error(`Failed to fetch track ${trackId}`);
  } catch (error) {
    console.error(`Error fetching track ${trackId}:`, error);
    throw error;
  }
}

describe("OG Image Generation", () => {
  beforeAll(async () => {
    await mkdir(join(process.cwd(), "test-output"), { recursive: true });
  });

  for (const testTrack of TEST_TRACKS) {
    it(`generates OG image for ${testTrack.name} (ID: ${testTrack.id})`, async () => {
      console.log(`\n[Test] Fetching track data for ${testTrack.name}...`);
      const track = await fetchTrackData(testTrack.id);

      expect(track).toBeTruthy();
      expect(track.title).toBeTruthy();
      expect(track.artist?.name).toBeTruthy();

      console.log(`[Test] Track found: ${track.title} by ${track.artist.name}`);

      const ogUrl = new URL("https://starchildmusic.com/api/og");
      ogUrl.searchParams.set("title", track.title);
      ogUrl.searchParams.set("artist", track.artist.name);
      if (track.album?.title) {
        ogUrl.searchParams.set("album", track.album.title);
      }
      if (track.album?.cover_medium) {
        ogUrl.searchParams.set("cover", track.album.cover_medium);
      }
      if (track.duration) {
        ogUrl.searchParams.set("duration", track.duration.toString());
      }
      ogUrl.searchParams.set("v", testTrack.id.toString());

      console.log(`[Test] OG Image URL: ${ogUrl.toString()}`);

      const mockRequest = {
        nextUrl: ogUrl,
      } as NextRequest;

      console.log(`[Test] Generating OG image...`);
      const response = await GET(mockRequest);

      expect(response).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");

      const arrayBuffer = await response.arrayBuffer();
      expect(arrayBuffer.byteLength).toBeGreaterThan(0);

      console.log(`[Test] Image generated successfully, size: ${arrayBuffer.byteLength} bytes`);

      const outputPath = join(
        process.cwd(),
        "test-output",
        `og-${testTrack.id}-${track.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`
      );

      await writeFile(outputPath, Buffer.from(arrayBuffer));
      console.log(`[Test] Image saved to: ${outputPath}`);
    }, 30000);
  }

  it("generates default OG image when no params provided", async () => {
    console.log("\n[Test] Testing default OG image (no params)...");

    const ogUrl = new URL("https://starchildmusic.com/api/og");

    const mockRequest = {
      nextUrl: ogUrl,
    } as NextRequest;

    const response = await GET(mockRequest);

    expect(response).toBeTruthy();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");

    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);

    console.log(`[Test] Default image generated, size: ${arrayBuffer.byteLength} bytes`);

    const outputPath = join(process.cwd(), "test-output", "og-default.png");
    await writeFile(outputPath, Buffer.from(arrayBuffer));
    console.log(`[Test] Default image saved to: ${outputPath}`);
  }, 30000);

  it("generates OG image with missing cover art", async () => {
    console.log("\n[Test] Testing OG image without cover art...");

    const ogUrl = new URL("https://starchildmusic.com/api/og");
    ogUrl.searchParams.set("title", "Test Track");
    ogUrl.searchParams.set("artist", "Test Artist");
    ogUrl.searchParams.set("album", "Test Album");
    ogUrl.searchParams.set("duration", "240");

    const mockRequest = {
      nextUrl: ogUrl,
    } as NextRequest;

    const response = await GET(mockRequest);

    expect(response).toBeTruthy();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");

    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);

    console.log(`[Test] No-cover image generated, size: ${arrayBuffer.byteLength} bytes`);

    const outputPath = join(process.cwd(), "test-output", "og-no-cover.png");
    await writeFile(outputPath, Buffer.from(arrayBuffer));
    console.log(`[Test] No-cover image saved to: ${outputPath}`);
  }, 30000);
});
