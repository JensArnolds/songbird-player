// File: src/app/api/v2/health/route.ts

import { env } from "@/env";
import { NextResponse } from "next/server";

const getUpstreamHealthUrl = (): string | null => {
  if (env.NEXT_PUBLIC_API_V2_HEALTH_URL) return env.NEXT_PUBLIC_API_V2_HEALTH_URL;
  if (!env.API_V2_URL) return null;
  const base = env.API_V2_URL.replace(/\/+$/, "");
  return `${base}/health`;
};

export async function GET() {
  const upstreamUrl = getUpstreamHealthUrl();
  if (!upstreamUrl) {
    return NextResponse.json(
      { ok: false, error: "API health URL not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(upstreamUrl, { cache: "no-store" });
    const text = await response.text().catch(() => "");

    return new NextResponse(text || "{}", {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Upstream fetch failed",
      },
      { status: 502 },
    );
  }
}

