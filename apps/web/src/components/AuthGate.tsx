"use client";

import { GuestModal } from "@/components/GuestModal";
import {
  SPOTIFY_AUTH_STATE_EVENT,
  getInMemoryAccessToken,
  restoreSpotifySession,
  type SpotifyAuthStateEventDetail,
} from "@/services/spotifyAuthClient";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

const BYPASS_PATH_PREFIXES = ["/auth/spotify/callback", "/auth/callback"];
const GUEST_MODE_STORAGE_KEY = "sb_guest_mode_enabled";

function getSessionStatus(
  sessionResult: unknown,
): "loading" | "authenticated" | "unauthenticated" {
  if (!sessionResult || typeof sessionResult !== "object") {
    return "unauthenticated";
  }

  const status = (sessionResult as Record<string, unknown>).status;
  if (status === "loading") return "loading";
  if (status === "authenticated") return "authenticated";
  return "unauthenticated";
}

function getSessionUser(sessionResult: unknown): unknown {
  if (!sessionResult || typeof sessionResult !== "object") return null;

  const data = (sessionResult as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;

  return (data as Record<string, unknown>).user ?? null;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sessionResult = useSession() as unknown;
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [spotifyResolved, setSpotifyResolved] = useState(false);
  const [guestModeEnabled, setGuestModeEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const syncSpotifySession = async () => {
      const restored = await restoreSpotifySession();
      if (cancelled) return;
      setSpotifyAuthenticated(restored);
      setSpotifyResolved(true);
    };

    const onSpotifyState = (event: Event) => {
      const detail = (event as CustomEvent<SpotifyAuthStateEventDetail>).detail;
      setSpotifyAuthenticated(Boolean(detail?.authenticated));
      setSpotifyResolved(true);
    };

    window.addEventListener(
      SPOTIFY_AUTH_STATE_EVENT,
      onSpotifyState as EventListener,
    );
    void syncSpotifySession();

    return () => {
      cancelled = true;
      window.removeEventListener(
        SPOTIFY_AUTH_STATE_EVENT,
        onSpotifyState as EventListener,
      );
    };
  }, []);

  const bypassGate = useMemo(
    () => BYPASS_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname],
  );
  if (bypassGate) return <>{children}</>;

  const sessionUser = getSessionUser(sessionResult);
  const status = getSessionStatus(sessionResult);
  const hasInMemorySpotifyAccessToken = Boolean(getInMemoryAccessToken());
  const isAuthenticated =
    Boolean(sessionUser) ||
    spotifyAuthenticated ||
    hasInMemorySpotifyAccessToken ||
    guestModeEnabled;
  const isLoading =
    status === "loading" ||
    (!sessionUser && !spotifyResolved && !hasInMemorySpotifyAccessToken);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          role="status"
          aria-label="Loading session"
          className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
        >
          <span className="sr-only">Loading session</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestModal
        onContinueAsGuest={() => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
          }
          setGuestModeEnabled(true);
        }}
      />
    );
  }

  return <>{children}</>;
}
