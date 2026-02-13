import SpotifyProvider from "next-auth/providers/spotify";

import { env } from "@/env";
import { logAuthInfo, logAuthWarn } from "./logging";

export function createSpotifyProvider() {
  if (!env.AUTH_SPOTIFY_ENABLED) {
    logAuthInfo("Spotify provider disabled (AUTH_SPOTIFY_ENABLED is not true)");
    return null;
  }

  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logAuthWarn(
      "Spotify provider disabled because credentials are missing",
      {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      },
    );
    return null;
  }

  logAuthInfo("Spotify provider enabled", {
    clientIdPrefix: clientId.slice(0, 6),
    scope: "user-read-email user-read-private",
  });

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
