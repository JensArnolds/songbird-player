import { type NextRequest, NextResponse } from "next/server";

const CANONICAL_SPOTIFY_AUTH_PATH = "/api/auth/spotify";
const FRONTEND_SPOTIFY_CALLBACK_PATH = "/auth/spotify/callback";
const LEGACY_AUTH_CALLBACK_PATH = "/auth/callback";
const DEFAULT_POST_AUTH_PATH = "/library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveNextPath(
  callbackUrl: string | null | undefined,
  requestOrigin: string,
): string {
  if (!callbackUrl) return DEFAULT_POST_AUTH_PATH;

  if (callbackUrl.startsWith("/")) {
    if (
      callbackUrl.startsWith(FRONTEND_SPOTIFY_CALLBACK_PATH) ||
      callbackUrl.startsWith(LEGACY_AUTH_CALLBACK_PATH)
    ) {
      return DEFAULT_POST_AUTH_PATH;
    }
    return callbackUrl === "/" ? DEFAULT_POST_AUTH_PATH : callbackUrl;
  }

  try {
    const parsed = new URL(callbackUrl);
    if (parsed.origin !== requestOrigin) return DEFAULT_POST_AUTH_PATH;

    const sameOriginPath = `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    if (
      sameOriginPath.startsWith(FRONTEND_SPOTIFY_CALLBACK_PATH) ||
      sameOriginPath.startsWith(LEGACY_AUTH_CALLBACK_PATH)
    ) {
      return DEFAULT_POST_AUTH_PATH;
    }

    return sameOriginPath === "/" ? DEFAULT_POST_AUTH_PATH : sameOriginPath;
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }
}

function buildSpotifyStartUrl(
  requestUrl: URL,
  callbackUrl: string | null | undefined,
): URL {
  const nextPath = resolveNextPath(callbackUrl, requestUrl.origin);
  const frontendRedirectUri = new URL(
    FRONTEND_SPOTIFY_CALLBACK_PATH,
    requestUrl.origin,
  );
  frontendRedirectUri.searchParams.set("next", nextPath);

  const spotifyStartUrl = new URL(CANONICAL_SPOTIFY_AUTH_PATH, requestUrl.origin);
  spotifyStartUrl.searchParams.set(
    "frontend_redirect_uri",
    frontendRedirectUri.toString(),
  );

  return spotifyStartUrl;
}

async function readCallbackUrlFromRequest(
  request: NextRequest,
): Promise<string | null> {
  const queryCallbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  if (queryCallbackUrl) return queryCallbackUrl;

  const contentType = request.headers.get("content-type") ?? "";
  if (
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return null;
  }

  try {
    const body = await request.formData();
    const formCallbackUrl = body.get("callbackUrl");
    return typeof formCallbackUrl === "string" ? formCallbackUrl : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  const location = buildSpotifyStartUrl(request.nextUrl, callbackUrl);
  return NextResponse.redirect(location, 302);
}

export async function POST(request: NextRequest) {
  const callbackUrl = await readCallbackUrlFromRequest(request);
  const location = buildSpotifyStartUrl(request.nextUrl, callbackUrl);
  return NextResponse.redirect(location, 303);
}
