import { env } from "@/env";
import { proxyAuthRequest } from "../../_lib";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!env.AUTH_DEBUG_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AUTH_DEBUG_TOKEN is not configured. Set it on frontend server env to proxy backend auth debug dumps.",
      },
      { status: 503 },
    );
  }

  return proxyAuthRequest({
    pathname: "/api/auth/spotify/debug",
    request,
    method: "GET",
    followRedirects: true,
    upstreamHeaders: {
      "x-auth-debug-token": env.AUTH_DEBUG_TOKEN,
    },
  });
}
