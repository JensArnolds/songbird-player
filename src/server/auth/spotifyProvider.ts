import { customFetch } from "@auth/core";
import SpotifyProvider from "next-auth/providers/spotify";

import { env } from "@/env";

type UnknownRecord = Record<string, unknown>;

type NormalizedSpotifyProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  const contentType = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return contentType === "application/json" || contentType.endsWith("+json");
}

function extractUrl(input: Parameters<typeof fetch>[0]): URL | null {
  try {
    if (typeof input === "string") return new URL(input);
    if (input instanceof URL) return input;
    return new URL(input.url);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function getSpotifyImageUrl(record: UnknownRecord): string | null {
  const images = record.images;
  if (!isUnknownArray(images) || images.length === 0) return null;

  const firstImage = images[0];
  if (!isRecord(firstImage)) return null;

  const url = firstImage.url;
  return typeof url === "string" ? url : null;
}

function parseSpotifyProfile(profile: unknown): NormalizedSpotifyProfile {
  if (!isRecord(profile)) {
    throw new Error("Spotify returned an empty profile response");
  }

  const error = getString(profile, "error");
  if (error) {
    const errorDescription = getString(profile, "error_description");
    const details = errorDescription ? `: ${errorDescription}` : "";
    throw new Error(`Spotify userinfo error: ${error}${details}`);
  }

  const id = getString(profile, "id");
  if (!id) {
    throw new Error("Spotify profile response missing id");
  }

  return {
    id,
    name: getString(profile, "display_name"),
    email: getString(profile, "email"),
    image: getSpotifyImageUrl(profile),
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const spotifyCustomFetch: typeof fetch = async (input, init) => {
  const url = extractUrl(input);
  const isSpotifyEndpoint =
    url?.hostname === "accounts.spotify.com" || url?.hostname === "api.spotify.com";

  if (!isSpotifyEndpoint) return fetch(input, init);

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(input, init);
    const bodyText = await response
      .clone()
      .text()
      .catch(() => "");

    const trimmed = bodyText.trim();
    if (trimmed) {
      try {
        JSON.parse(trimmed);
        return response;
      } catch {
        // Fall through and normalize non-JSON payloads below.
      }
    } else if (isJsonContentType(response.headers.get("content-type"))) {
      return response;
    }

    const isRetryable =
      response.status === 429 ||
      (response.status >= 500 && response.status <= 599);

    if (attempt < maxAttempts && isRetryable) {
      await sleep(150 * attempt);
      continue;
    }

    return new Response(
      JSON.stringify({
        error: "invalid_response",
        error_description:
          `Spotify returned a non-JSON response from ${url ? `${url.hostname}${url.pathname}` : "an OAuth endpoint"}. Please retry sign-in.`,
        status: response.status,
        content_type: response.headers.get("content-type"),
      }),
      {
        status: response.status || 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return fetch(input, init);
};

export function createSpotifyProvider() {
  if (!env.AUTH_SPOTIFY_ENABLED) return null;

  const spotifyClientId = env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
  if (!spotifyClientId || !spotifyClientSecret) {
    console.warn(
      "[NextAuth Config] AUTH_SPOTIFY_ENABLED=true but SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET are missing. Spotify auth disabled.",
    );
    return null;
  }

  const spotifyProviderConfig = {
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret,
    profile(profile: unknown) {
      return parseSpotifyProfile(profile);
    },
    [customFetch]: spotifyCustomFetch,
  } as Parameters<typeof SpotifyProvider>[0];

  return SpotifyProvider(spotifyProviderConfig);
}

