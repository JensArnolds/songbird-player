const DEFAULT_AUTH_API_ORIGIN = "https://www.darkfloor.one";
const configuredAuthApiOrigin =
  process.env.NEXT_PUBLIC_AUTH_API_ORIGIN?.replace(/\/+$/, "") ??
  DEFAULT_AUTH_API_ORIGIN;
const AUTH_ME_ENDPOINT = `${configuredAuthApiOrigin}/api/auth/me`;
const SPOTIFY_LOGIN_ENDPOINT = "/api/auth/spotify";
const SPOTIFY_REFRESH_ENDPOINT = "/api/auth/spotify/refresh";
const FRONTEND_SPOTIFY_CALLBACK_PATH = "/auth/spotify/callback";
const CSRF_COOKIE_NAME = "sb_csrf_token";
const EXPIRY_SKEW_MS = 15_000;

type TokenState = {
  accessToken: string | null;
  tokenType: string;
  expiresAtMs: number | null;
  spotifyAccessToken: string | null;
  spotifyTokenType: string;
  spotifyExpiresAtMs: number | null;
};

type HashTokenPayload = {
  accessToken: string;
  tokenType: string;
  expiresIn: number | null;
  spotifyAccessToken: string | null;
  spotifyTokenType: string;
  spotifyExpiresIn: number | null;
};

type CallbackResult = {
  accessToken: string;
  profile: unknown;
};

export type AuthRequiredReason = "missing_csrf_token" | "unauthorized";
export type AuthRequiredEventDetail = {
  callbackUrl: string;
  reason: AuthRequiredReason;
};

export type SpotifyAuthStateEventDetail = {
  authenticated: boolean;
};

export const AUTH_REQUIRED_EVENT = "starchild:auth-required";
export const SPOTIFY_AUTH_STATE_EVENT = "starchild:spotify-auth-state";

const tokenState: TokenState = {
  accessToken: null,
  tokenType: "Bearer",
  expiresAtMs: null,
  spotifyAccessToken: null,
  spotifyTokenType: "Bearer",
  spotifyExpiresAtMs: null,
};

let refreshPromise: Promise<string> | null = null;

export class SpotifyAuthClientError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "SpotifyAuthClientError";
    this.status = status;
  }
}

function parseExpiresIn(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveExpiresAt(expiresInSeconds: number | null): number | null {
  if (!expiresInSeconds) return null;
  return Date.now() + expiresInSeconds * 1000;
}

function toSameOriginPath(pathOrUrl: string, origin: string): string {
  if (!pathOrUrl) return "/";

  if (pathOrUrl.startsWith("/")) {
    return pathOrUrl.startsWith(FRONTEND_SPOTIFY_CALLBACK_PATH) ? "/" : pathOrUrl;
  }

  try {
    const parsed = new URL(pathOrUrl);
    if (parsed.origin !== origin) return "/";
    const sameOriginPath = `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    if (sameOriginPath.startsWith(FRONTEND_SPOTIFY_CALLBACK_PATH)) return "/";
    return sameOriginPath;
  } catch {
    return "/";
  }
}

function parseHashTokens(hash: string): HashTokenPayload | null {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment) return null;

  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");
  if (!accessToken) return null;

  return {
    accessToken,
    tokenType: params.get("token_type") ?? "Bearer",
    expiresIn: parseExpiresIn(params.get("expires_in")),
    spotifyAccessToken: params.get("spotify_access_token"),
    spotifyTokenType: params.get("spotify_token_type") ?? "Bearer",
    spotifyExpiresIn: parseExpiresIn(params.get("spotify_expires_in")),
  };
}

function readCookieValue(cookieHeader: string, cookieName: string): string | null {
  const encodedName = `${encodeURIComponent(cookieName)}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  if (!match) return null;
  return decodeURIComponent(match.slice(encodedName.length));
}

function setTokenState(payload: HashTokenPayload): void {
  tokenState.accessToken = payload.accessToken;
  tokenState.tokenType = payload.tokenType || "Bearer";
  tokenState.expiresAtMs = resolveExpiresAt(payload.expiresIn);
  tokenState.spotifyAccessToken = payload.spotifyAccessToken;
  tokenState.spotifyTokenType = payload.spotifyTokenType || "Bearer";
  tokenState.spotifyExpiresAtMs = resolveExpiresAt(payload.spotifyExpiresIn);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<SpotifyAuthStateEventDetail>(SPOTIFY_AUTH_STATE_EVENT, {
        detail: { authenticated: true },
      }),
    );
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    return text.length > 0 ? { message: text } : {};
  }

  return response.json().catch(() => ({}));
}

function getMessageFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const message = record.message;
  if (typeof message === "string" && message.trim().length > 0) return message;
  const error = record.error;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return null;
}

function getAccessTokenFromBody(body: unknown): {
  accessToken: string | null;
  tokenType: string;
  expiresIn: number | null;
} {
  if (!body || typeof body !== "object") {
    return {
      accessToken: null,
      tokenType: "Bearer",
      expiresIn: null,
    };
  }

  const record = body as Record<string, unknown>;
  const accessToken =
    typeof record.accessToken === "string"
      ? record.accessToken
      : typeof record.access_token === "string"
        ? record.access_token
        : typeof record.token === "string"
          ? record.token
          : null;

  const tokenType =
    typeof record.tokenType === "string"
      ? record.tokenType
      : typeof record.token_type === "string"
        ? record.token_type
        : "Bearer";

  const expiresValue =
    typeof record.expiresIn === "number"
      ? record.expiresIn
      : typeof record.expires_in === "number"
        ? record.expires_in
        : typeof record.expiresIn === "string"
          ? parseExpiresIn(record.expiresIn)
          : typeof record.expires_in === "string"
            ? parseExpiresIn(record.expires_in)
            : null;

  return {
    accessToken,
    tokenType,
    expiresIn:
      typeof expiresValue === "number" && Number.isFinite(expiresValue)
        ? expiresValue
        : null,
  };
}

export function resolveFrontendRedirectPath(next: string | null | undefined): string {
  if (typeof window === "undefined") return "/";
  return toSameOriginPath(next ?? "/", window.location.origin);
}

export function buildSpotifyFrontendCallbackUrl(nextPath: string): string {
  if (typeof window === "undefined") {
    throw new Error("buildSpotifyFrontendCallbackUrl must run in the browser");
  }

  const safeNext = toSameOriginPath(nextPath, window.location.origin);
  const callbackUrl = new URL(FRONTEND_SPOTIFY_CALLBACK_PATH, window.location.origin);
  callbackUrl.searchParams.set("next", safeNext);
  return callbackUrl.toString();
}

export function buildSpotifyLoginUrl(nextPath: string): string {
  const frontendRedirectUri = buildSpotifyFrontendCallbackUrl(nextPath);
  const params = new URLSearchParams({
    frontend_redirect_uri: frontendRedirectUri,
  });
  return `${SPOTIFY_LOGIN_ENDPOINT}?${params.toString()}`;
}

export function startSpotifyLogin(nextPath: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(buildSpotifyLoginUrl(nextPath));
}

export function getInMemoryAccessToken(): string | null {
  return tokenState.accessToken;
}

export function clearInMemoryAccessToken(): void {
  tokenState.accessToken = null;
  tokenState.tokenType = "Bearer";
  tokenState.expiresAtMs = null;
  tokenState.spotifyAccessToken = null;
  tokenState.spotifyTokenType = "Bearer";
  tokenState.spotifyExpiresAtMs = null;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<SpotifyAuthStateEventDetail>(SPOTIFY_AUTH_STATE_EVENT, {
        detail: { authenticated: false },
      }),
    );
  }
}

function notifyAuthRequired(reason: AuthRequiredReason): void {
  if (typeof window === "undefined") return;
  const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;
  const callbackUrl = window.location.pathname.startsWith(
    FRONTEND_SPOTIFY_CALLBACK_PATH,
  )
    ? resolveFrontendRedirectPath(
        new URLSearchParams(window.location.search).get("next"),
      )
    : resolveFrontendRedirectPath(currentPathWithSearch);

  window.dispatchEvent(
    new CustomEvent<AuthRequiredEventDetail>(AUTH_REQUIRED_EVENT, {
      detail: { callbackUrl, reason },
    }),
  );
}

function handleUnauthorized(reason: AuthRequiredReason): void {
  clearInMemoryAccessToken();
  notifyAuthRequired(reason);
}

export function getCsrfTokenFromCookies(cookieHeader?: string): string | null {
  if (typeof window === "undefined" && !cookieHeader) return null;
  const source = cookieHeader ?? document.cookie;
  return readCookieValue(source, CSRF_COOKIE_NAME);
}

export async function getCurrentUser(accessToken: string): Promise<unknown> {
  const response = await fetch(AUTH_ME_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    const message =
      getMessageFromBody(body) ??
      `GET ${AUTH_ME_ENDPOINT} failed with status ${response.status}`;
    throw new SpotifyAuthClientError(message, response.status);
  }

  return parseResponseBody(response);
}

type RefreshAccessTokenOptions = {
  notifyOnUnauthorized?: boolean;
};

export async function refreshAccessToken(
  options: RefreshAccessTokenOptions = {},
): Promise<string> {
  const notifyOnUnauthorized = options.notifyOnUnauthorized ?? true;
  const csrfToken = getCsrfTokenFromCookies();
  if (!csrfToken) {
    if (notifyOnUnauthorized) {
      handleUnauthorized("missing_csrf_token");
    } else {
      clearInMemoryAccessToken();
    }
    throw new SpotifyAuthClientError(
      `${CSRF_COOKIE_NAME} cookie is missing`,
      401,
    );
  }

  const response = await fetch(SPOTIFY_REFRESH_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseResponseBody(response);
  if (!response.ok) {
    if (response.status === 401) {
      if (notifyOnUnauthorized) {
        handleUnauthorized("unauthorized");
      } else {
        clearInMemoryAccessToken();
      }
    }
    const message =
      getMessageFromBody(body) ??
      `POST ${SPOTIFY_REFRESH_ENDPOINT} failed with status ${response.status}`;
    throw new SpotifyAuthClientError(message, response.status);
  }

  const tokenPayload = getAccessTokenFromBody(body);
  if (!tokenPayload.accessToken) {
    throw new SpotifyAuthClientError(
      "Refresh response did not include access token",
      500,
    );
  }

  setTokenState({
    accessToken: tokenPayload.accessToken,
    tokenType: tokenPayload.tokenType,
    expiresIn: tokenPayload.expiresIn,
    spotifyAccessToken: tokenState.spotifyAccessToken,
    spotifyTokenType: tokenState.spotifyTokenType,
    spotifyExpiresIn: null,
  });

  return tokenPayload.accessToken;
}

export async function ensureAccessToken(): Promise<string | null> {
  if (
    tokenState.accessToken &&
    (tokenState.expiresAtMs === null || tokenState.expiresAtMs - EXPIRY_SKEW_MS > Date.now())
  ) {
    return tokenState.accessToken;
  }

  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });

  try {
    return await refreshPromise;
  } catch {
    return null;
  }
}

export async function handleSpotifyCallbackHash(): Promise<CallbackResult> {
  if (typeof window === "undefined") {
    throw new SpotifyAuthClientError("Callback handling requires browser context");
  }

  const parsed = parseHashTokens(window.location.hash);
  if (!parsed) {
    throw new SpotifyAuthClientError(
      "Callback hash did not include access_token",
      401,
    );
  }

  setTokenState(parsed);

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, document.title, cleanUrl);

  let profile: unknown;
  try {
    profile = await getCurrentUser(parsed.accessToken);
  } catch (error) {
    clearInMemoryAccessToken();
    throw error;
  }
  return {
    accessToken: parsed.accessToken,
    profile,
  };
}

export async function restoreSpotifySession(): Promise<boolean> {
  if (tokenState.accessToken) {
    return true;
  }

  const csrfToken = getCsrfTokenFromCookies();
  if (!csrfToken) {
    clearInMemoryAccessToken();
    return false;
  }

  try {
    await refreshAccessToken({ notifyOnUnauthorized: false });
    return Boolean(tokenState.accessToken);
  } catch {
    clearInMemoryAccessToken();
    return false;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const sendRequest = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  };

  let token = await ensureAccessToken();
  const response = await sendRequest(token);

  if (response.status !== 401) {
    return response;
  }

  token = await refreshAccessToken().catch(() => null);
  if (!token) {
    return response;
  }

  const retriedResponse = await sendRequest(token);
  if (retriedResponse.status === 401) {
    handleUnauthorized("unauthorized");
  }

  return retriedResponse;
}

export const login = startSpotifyLogin;
export const handleCallback = handleSpotifyCallbackHash;
export const refresh = refreshAccessToken;
