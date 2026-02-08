// File: src/server/auth/config.ts

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { customFetch } from "@auth/core";
import { and, eq, sql } from "drizzle-orm";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import SpotifyProvider from "next-auth/providers/spotify";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      userHash?: string | null;
      admin: boolean;
      firstAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    userHash?: string | null;
    admin?: boolean;
    firstAdmin?: boolean;
    banned?: boolean;
  }
}

function isJsonContentType(value: string | null): boolean {
  if (!value) return false;
  const contentType = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return contentType === "application/json" || contentType.endsWith("+json");
}

function extractUrl(input: Parameters<typeof fetch>[0]): URL | null {
  try {
    if (typeof input === "string") return new URL(input);
    if (input instanceof URL) return input;
    // Request
    return new URL(input.url);
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const spotifyCustomFetch: typeof fetch = async (input, init) => {
  const url = extractUrl(input);
  const isSpotifyEndpoint =
    url?.hostname === "accounts.spotify.com" || url?.hostname === "api.spotify.com";

  if (!isSpotifyEndpoint) {
    return fetch(input, init);
  }

  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(input, init);

    // Some edge/network failures can return HTML/text. Convert to a JSON error
    // response to avoid blowing up when Auth.js tries to parse as JSON.
    const bodyText = await response
      .clone()
      .text()
      .catch(() => "");

    // If the body is actually JSON (even if mislabeled), let the normal flow continue.
    const trimmed = bodyText.trim();
    if (trimmed) {
      try {
        JSON.parse(trimmed);
        return response;
      } catch {
        // fall through
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

  // Unreachable, but keeps TypeScript happy.
  return fetch(input, init);
};

console.log("[NextAuth Config] ELECTRON_BUILD:", env.ELECTRON_BUILD);
console.log("[NextAuth Config] NODE_ENV:", process.env.NODE_ENV);
console.log(
  "[NextAuth Config] DATABASE_URL:",
  process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
);

export const authConfig = {
  trustHost: true,
  basePath: "/api/auth",
  pages: { signIn: "/signin" },
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    }),
    ...(() => {
      const spotifyClientId = env.SPOTIFY_CLIENT_ID;
      const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;
      if (!spotifyClientId || !spotifyClientSecret) return [];

      // Work around rare non-JSON responses from Spotify OAuth endpoints which
      // would otherwise crash Auth.js JSON parsing in the callback route.
      const spotifyOptions: any = {
        clientId: spotifyClientId,
        clientSecret: spotifyClientSecret,
        profile(profile: any) {
          if (!profile || typeof profile !== "object") {
            throw new Error("Spotify returned an empty profile response");
          }

          if (typeof profile.error === "string") {
            const details =
              typeof profile.error_description === "string"
                ? `: ${profile.error_description}`
                : "";
            throw new Error(`Spotify userinfo error: ${profile.error}${details}`);
          }

          if (typeof profile.id !== "string" || !profile.id) {
            throw new Error("Spotify profile response missing id");
          }

          return {
            id: profile.id,
            name:
              typeof profile.display_name === "string"
                ? profile.display_name
                : null,
            email: typeof profile.email === "string" ? profile.email : null,
            image:
              typeof profile.images?.[0]?.url === "string"
                ? profile.images[0].url
                : null,
          };
        },
      };

      spotifyOptions[customFetch] = spotifyCustomFetch;
      return [SpotifyProvider(spotifyOptions)];
    })(),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD
          ? `__Secure-authjs.session-token`
          : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD
          ? `__Host-authjs.csrf-token`
          : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD
          ? `__Secure-authjs.callback-url`
          : `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" && !env.ELECTRON_BUILD,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("[NextAuth signIn] Callback triggered");
        console.log("[NextAuth signIn] Provider:", account?.provider);
        console.log("[NextAuth signIn] User exists:", !!user);
        console.log("[NextAuth signIn] Profile exists:", !!profile);

        if (user?.id) {
          const userId = user.id;
          try {
            const [dbUser] = await db
              .select({ banned: users.banned })
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);
            if (dbUser?.banned) {
              console.log("[NextAuth signIn] User is banned, denying sign in");
              return "/signin?error=Banned";
            }
          } catch (error) {
            console.error(
              "[NextAuth signIn] Ban status check failed, denying sign in:",
              error,
            );
            return "/signin?error=AuthFailed";
          }
        }

        if (account?.provider === "discord" && profile && user.id) {
          try {
            console.log("[NextAuth signIn] Updating Discord user profile...");

            const updates: { image?: string; name?: string } = {};

            if (profile.image_url) {
              updates.image = profile.image_url as string;
            }

            if (profile.global_name || profile.username) {
              updates.name = (profile.global_name ?? profile.username) as string;
            }

            if (Object.keys(updates).length > 0) {
              console.log("[NextAuth signIn] Updates to apply:", updates);
              await db.update(users).set(updates).where(eq(users.id, user.id));
              console.log("[NextAuth signIn] Profile updated successfully");
            }
          } catch (error) {
            console.warn(
              "[NextAuth signIn] Non-critical profile update failed:",
              error,
            );
          }
        }

        if (user.id && !user.admin) {
          const userId = user.id;
          if (!userId) {
            return true;
          }
          try {
            const promoted = await db.transaction(async (tx) => {
              await tx.execute(
                sql`lock table "hexmusic-stream_user" in share row exclusive mode`,
              );

              const updatedRows = await tx
                .update(users)
                .set({ admin: true, firstAdmin: true })
                .where(
                  and(
                    eq(users.id, userId),
                    sql`not exists (
                      select 1
                      from "hexmusic-stream_user"
                      where "hexmusic-stream_user"."firstAdmin" = true
                    )`,
                  ),
                )
                .returning({ id: users.id });

              return updatedRows.length > 0;
            });

            if (promoted) {
              user.admin = true;
              user.firstAdmin = true;
            }
          } catch (error) {
            console.error(
              "[NextAuth signIn] First-admin promotion check failed, denying sign in:",
              error,
            );
            return "/signin?error=AuthFailed";
          }
        }

        console.log("[NextAuth signIn] Callback completed - allowing sign in");
        return true;
      } catch (error) {
        console.error("[NextAuth signIn] ERROR in callback:");
        console.error(error);

        return "/signin?error=AuthFailed";
      }
    },
    session: ({ session, user }) => {
      return {
        expires: session.expires,
        user: {
          id: String(user.id),
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          userHash: user.userHash ?? null,
          admin: user.admin ?? false,
          firstAdmin: user.firstAdmin ?? false,
        },
      };
    },

    redirect: ({ url, baseUrl }) => {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
