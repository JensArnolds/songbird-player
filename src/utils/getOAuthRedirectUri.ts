// File: src/utils/getOAuthRedirectUri.ts

export function getOAuthRedirectUri(providerId: string): string | undefined {
  if (typeof window === "undefined" || !providerId) {
    return undefined;
  }

  // Keep OAuth callback host exactly aligned with the current renderer origin
  // so PKCE/state cookies are written and read on the same host.
  const origin = window.location.origin;
  return `${origin}/api/auth/callback/${encodeURIComponent(providerId)}`;
}
