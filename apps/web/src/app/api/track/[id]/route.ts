// File: src/app/api/track/[id]/route.ts

import { env } from "@/env";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing track ID parameter" },
      { status: 400 },
    );
  }

  const normalizeTrack = (track: unknown) => {
    if (!track || typeof track !== "object") return null;
    const record = track as Record<string, unknown>;
    if (!("deezer_id" in record) && typeof record.id === "number") {
      record.deezer_id = record.id;
    }
    return record;
  };

  const songbirdApiUrl = env.API_V2_URL;
  const songbirdApiKey = env.SONGBIRD_API_KEY;

  try {
    if (songbirdApiUrl && songbirdApiKey) {
      try {
        const normalizedSongbirdUrl = songbirdApiUrl.replace(/\/+$/, "");
        const songbirdUrl = new URL("music/tracks/batch", normalizedSongbirdUrl);
        songbirdUrl.searchParams.set("ids", id);

        console.log("[Track API] Trying Songbird V2:", songbirdUrl.toString());

        const songbirdResponse = await fetch(songbirdUrl.toString(), {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": songbirdApiKey,
          },
          signal: AbortSignal.timeout(8000),
        });

        if (songbirdResponse.ok) {
          const payload = (await songbirdResponse.json()) as unknown;
          const tracks = Array.isArray(payload)
            ? payload
            : typeof payload === "object" && payload !== null
              ? Array.isArray((payload as { data?: unknown }).data)
                ? (payload as { data: unknown[] }).data
                : Array.isArray((payload as { tracks?: unknown }).tracks)
                  ? (payload as { tracks: unknown[] }).tracks
                  : []
              : [];

          const track = tracks.length > 0 ? normalizeTrack(tracks[0]) : null;
          if (track) {
            return NextResponse.json(track);
          }
        } else {
          console.warn(
            "[Track API] Songbird V2 error:",
            songbirdResponse.status,
            songbirdResponse.statusText,
          );
        }
      } catch (err) {
        console.warn("[Track API] Songbird V2 request failed:", err);
      }
    }

    const deezerUrl = new URL(`https://api.deezer.com/track/${id}`);
    console.log("[Track API] Falling back to Deezer API:", deezerUrl.toString());
    const deezerResponse = await fetch(deezerUrl.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (deezerResponse.ok) {
      const deezerData = (await deezerResponse.json()) as Record<
        string,
        unknown
      >;
      if (typeof deezerData.id === "number") {
        deezerData.deezer_id = deezerData.id;
      }
      return NextResponse.json(deezerData);
    }

    const errorText = await deezerResponse
      .text()
      .catch(() => "Could not read error response");
    return NextResponse.json(
      {
        error: `Failed to fetch track: ${deezerResponse.statusText}`,
        message: errorText,
        status: deezerResponse.status,
      },
      { status: deezerResponse.status },
    );
  } catch (error) {
    console.error("[Track API] Error fetching track:", error);

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Backend request timed out",
            message: "The backend server did not respond in time.",
            type: "timeout",
          },
          { status: 504 },
        );
      }

      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        return NextResponse.json(
          {
            error: "Cannot connect to backend",
            message: "Failed to connect to backend.",
            type: "connection_error",
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch track",
        message: error instanceof Error ? error.message : "Unknown error",
        type: "unknown_error",
      },
      { status: 500 },
    );
  }
}
