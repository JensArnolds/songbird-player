import SpotifyProvider from "next-auth/providers/spotify";

import { env } from "@/env";

export function createSpotifyProvider() {
  if (!env.AUTH_SPOTIFY_ENABLED) return null;

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn(
      "[NextAuth Config] Spotify is enabled but SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET are missing. Spotify auth disabled.",
    );
    return null;
  }

  return SpotifyProvider({
    clientId,
    clientSecret,
    authorization: {
      params: {
        scope: "user-read-email user-read-private",
      },
    },
  });
}
