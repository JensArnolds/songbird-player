// File: src/utils/getOAuthRedirectUri.ts

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function normalizeLoopbackOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (LOOPBACK_HOSTS.has(url.hostname)) {
      url.hostname = "127.0.0.1";
    }
    return url.origin;
  } catch {
    return origin;
  }
}

export function getOAuthRedirectUri(providerId: string): string | undefined {
  if (typeof window === "undefined" || !providerId) {
    return undefined;
  }

  const origin = normalizeLoopbackOrigin(window.location.origin);
  return `${origin}/api/auth/callback/${encodeURIComponent(providerId)}`;
}
