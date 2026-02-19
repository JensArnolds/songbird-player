import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_PROXY_TIMEOUT_MS = 10_000;
const REQUEST_HEADER_ALLOWLIST = new Set([
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "x-correlation-id",
  "x-csrf-token",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-request-id",
]);
const RESPONSE_HEADER_ALLOWLIST = new Set([
  "cache-control",
  "content-type",
  "location",
  "retry-after",
  "x-correlation-id",
  "x-request-id",
]);

type ProxyAuthOptions = {
  pathname: string;
  request: NextRequest | Request;
  method?: string;
};

function getApiBaseUrl(): string | null {
  if (!env.API_V2_URL) return null;
  return env.API_V2_URL.replace(/\/+$/, "");
}

function getRequestUrl(request: NextRequest | Request): URL {
  if ("nextUrl" in request && request.nextUrl instanceof URL) {
    return request.nextUrl;
  }
  return new URL(request.url);
}

function getUpstreamUrl(pathname: string, request: NextRequest | Request): string | null {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  const upstreamUrl = new URL(pathname, `${baseUrl}/`);
  const requestUrl = getRequestUrl(request);
  requestUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  return upstreamUrl.toString();
}

function getForwardHeaders(request: NextRequest | Request): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (!REQUEST_HEADER_ALLOWLIST.has(normalized)) return;
    headers.set(normalized, value);
  });

  return headers;
}

function splitSetCookieHeader(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,=\s]+=)/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie().filter(Boolean);
  }

  const raw = headers.get("set-cookie");
  if (!raw) return [];
  return splitSetCookieHeader(raw);
}

function mapResponseHeaders(response: Response): Headers {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (!RESPONSE_HEADER_ALLOWLIST.has(normalized)) return;
    headers.set(normalized, value);
  });

  for (const cookie of getSetCookieHeaders(response.headers)) {
    headers.append("set-cookie", cookie);
  }

  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store");
  }

  return headers;
}

export async function proxyAuthRequest(options: ProxyAuthOptions): Promise<NextResponse> {
  const upstreamUrl = getUpstreamUrl(options.pathname, options.request);
  if (!upstreamUrl) {
    return NextResponse.json(
      { ok: false, error: "API_V2_URL is not configured" },
      { status: 500 },
    );
  }

  const method = options.method ?? options.request.method ?? "GET";
  const headers = getForwardHeaders(options.request);
  let body: string | undefined;

  if (method !== "GET" && method !== "HEAD") {
    body = await options.request.text();
    if (!body) {
      body = undefined;
      headers.delete("content-type");
    }
  } else {
    headers.delete("content-type");
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      ...(body ? { body } : {}),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_PROXY_TIMEOUT_MS),
    });

    const payload = await upstreamResponse.arrayBuffer();

    return new NextResponse(payload, {
      status: upstreamResponse.status,
      headers: mapResponseHeaders(upstreamResponse),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Auth proxy failed",
      },
      { status: 502 },
    );
  }
}
