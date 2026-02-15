// File: src/app/api/music/search/route.ts

import { env } from "@/env";
import { type SearchResponse } from "@/types";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");
  const offset = searchParams.get("offset");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 },
    );
  }

  try {
    const songbirdApiUrl = env.API_V2_URL;
    const songbirdApiKey = env.SONGBIRD_API_KEY;

    const parseSearchResponse = (data: unknown): SearchResponse | null => {
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in data &&
        Array.isArray((data as Record<string, unknown>).data) &&
        "total" in data &&
        typeof (data as Record<string, unknown>).total === "number"
      ) {
        const responseData = data as {
          data: unknown[];
          total: number;
          next?: string;
        };

        return {
          data: responseData.data as SearchResponse["data"],
          total: responseData.total,
          ...(responseData.next && { next: responseData.next }),
        };
      }

      return null;
    };

    if (!songbirdApiUrl || !songbirdApiKey) {
      return NextResponse.json(
        { error: "API_V2_URL or SONGBIRD_API_KEY not configured" },
        { status: 500 },
      );
    }

    const normalizedSongbirdUrl = songbirdApiUrl.replace(/\/+$/, "");
    const url = new URL("music/search", normalizedSongbirdUrl);
    url.searchParams.set("key", songbirdApiKey);
    url.searchParams.set(
      "kbps",
      req.nextUrl.searchParams.get("kbps") ?? "320",
    );
    url.searchParams.set("q", query);
    if (offset != null) {
      url.searchParams.set("offset", offset);
    }

    console.log(
      "[Music Search API] Fetching from:",
      url.toString().replace(songbirdApiKey, "***"),
    );

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },

      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(
        "[Music Search API] Songbird returned error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Songbird API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data: unknown = await response.json();
    const parsed = parseSearchResponse(data);
    if (parsed) {
      return NextResponse.json(parsed);
    }

    console.error(
      "[Music Search API] Invalid response structure from Songbird:",
      data,
    );
    return NextResponse.json(
      {
        error: "Invalid response from Songbird API: missing required fields (data: Track[], total: number)",
      },
      { status: 502 },
    );
  } catch (error) {
    console.error("[Music Search API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Search failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
