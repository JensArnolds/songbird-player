export const OAUTH_PROVIDER_BUTTON_STYLES: Record<string, string> = {
  discord:
    "bg-[#5865F2] text-white hover:brightness-110 active:brightness-95",
  spotify:
    "bg-[#1DB954] text-white hover:brightness-110 active:brightness-95",
};

const PROVIDER_NAMES = {
  discord: "Discord",
  spotify: "Spotify",
} as const;

export type SupportedOAuthProviderId = keyof typeof PROVIDER_NAMES;

const spotifyEnabled = process.env.NEXT_PUBLIC_AUTH_SPOTIFY_ENABLED === "true";

export const ENABLED_OAUTH_PROVIDER_IDS: SupportedOAuthProviderId[] = spotifyEnabled
  ? ["discord", "spotify"]
  : ["discord"];

const enabledProviderIds = new Set<string>(ENABLED_OAUTH_PROVIDER_IDS);

export function isEnabledOAuthProviderId(
  providerId: string,
): providerId is SupportedOAuthProviderId {
  return enabledProviderIds.has(providerId);
}

export function getOAuthProviderDisplayName(
  providerId: SupportedOAuthProviderId,
): string {
  return PROVIDER_NAMES[providerId];
}

