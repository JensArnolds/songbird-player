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

  try {
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    if (!apiUrl) {
      console.error("[Track API] NEXT_PUBLIC_API_URL not configured");
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const streamingKey = env.STREAMING_KEY;
    if (!streamingKey) {
      console.error("[Track API] STREAMING_KEY not configured");
      return NextResponse.json(
        { error: "Streaming key not configured" },
        { status: 500 },
      );
    }

    const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
    const url = new URL(`music/track/${id}`, normalizedApiUrl);
    url.searchParams.set("key", streamingKey);

    console.log("[Track API] Fetching track:", id);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Could not read error response");
      console.error(
        `[Track API] Failed to fetch track: ${response.status} ${response.statusText}`,
      );
      console.error("[Track API] Error details:", errorText);

      if (response.status === 404 || response.status === 400) {
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
      }

      return NextResponse.json(
        {
          error: `Failed to fetch track: ${response.statusText}`,
          message: errorText,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    if (data && typeof data === "object" && !("deezer_id" in data)) {
      if (typeof (data as Record<string, unknown>).id === "number") {
        (data as Record<string, unknown>).deezer_id = (data as Record<
          string,
          unknown
        >).id;
      }
    }
    return NextResponse.json(data);
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
            message: `Failed to connect to backend at ${env.NEXT_PUBLIC_API_URL}.`,
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
