// File: src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/server/auth";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function shouldLogAuthDebug(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ELECTRON_BUILD === "true"
  );
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return LOOPBACK_HOSTS.has(normalized);
}

function resolveRequestOrigin(request: Request): string | null {
  try {
    const fallback = new URL(request.url);
    const hostHeader =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const protoHeader =
      request.headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", "");

    if (!hostHeader) return fallback.origin;

    const origin = `${protoHeader}://${hostHeader}`;
    const parsed = new URL(origin);
    return parsed.origin;
  } catch {
    return null;
  }
}

function applyLoopbackAuthOrigin(request: Request): void {
  const requestOrigin = resolveRequestOrigin(request);
  if (!requestOrigin) return;

  try {
    const parsed = new URL(requestOrigin);
    if (!isLoopbackHost(parsed.hostname)) return;

    // Force Auth.js URL inference to the same loopback host used by this request.
    // This keeps OAuth redirect_uri and PKCE cookie host aligned.
    process.env.AUTH_URL = parsed.origin;
    process.env.NEXTAUTH_URL = parsed.origin;
    process.env.NEXTAUTH_URL_INTERNAL = parsed.origin;
  } catch {
    // Best effort only.
  }
}

function redactCookieHeader(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      return separatorIndex > 0 ? part.slice(0, separatorIndex) : part;
    });
}

function logAuthRequest(request: Request): void {
  if (!shouldLogAuthDebug()) return;

  try {
    const url = new URL(request.url);
    const requestOrigin = resolveRequestOrigin(request);
    const cookieHeader = request.headers.get("cookie");
    const cookieKeys = redactCookieHeader(cookieHeader);
    const host = request.headers.get("host");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");

    console.log("[Auth Debug] Incoming request", {
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      requestOrigin,
      host,
      forwardedHost,
      forwardedProto,
      authUrl: process.env.AUTH_URL ?? null,
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      cookieCount: cookieKeys.length,
      cookieKeys,
    });
  } catch (error) {
    console.error("[Auth Debug] Failed to log request details", error);
  }
}

function logAuthResponse(response: Response): void {
  if (!shouldLogAuthDebug()) return;

  try {
    const setCookie = response.headers.get("set-cookie");
    const hasPkceCookie =
      typeof setCookie === "string" &&
      (setCookie.includes("pkce.code_verifier") ||
        setCookie.includes("pkceCodeVerifier"));

    console.log("[Auth Debug] Outgoing response", {
      status: response.status,
      hasSetCookie: Boolean(setCookie),
      hasPkceCookie,
      setCookiePreview: setCookie ? setCookie.slice(0, 400) : null,
    });
  } catch (error) {
    console.error("[Auth Debug] Failed to log response details", error);
  }
}

export async function GET(
  request: Request,
  _context: { params: Promise<{ nextauth: string[] }> },
) {
  applyLoopbackAuthOrigin(request);
  logAuthRequest(request);
  try {
    const response = await handlers.GET(request);
    logAuthResponse(response);
    return response;
  } catch (error) {
    console.error("[Auth Debug] GET handler threw", {
      url: request.url,
      error,
    });
    throw error;
  }
}

export async function POST(
  request: Request,
  _context: { params: Promise<{ nextauth: string[] }> },
) {
  applyLoopbackAuthOrigin(request);
  logAuthRequest(request);
  try {
    const response = await handlers.POST(request);
    logAuthResponse(response);
    return response;
  } catch (error) {
    console.error("[Auth Debug] POST handler threw", {
      url: request.url,
      error,
    });
    throw error;
  }
}
