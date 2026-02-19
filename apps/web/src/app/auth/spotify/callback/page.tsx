"use client";

import {
  SpotifyAuthClientError,
  handleSpotifyCallbackHash,
  resolveFrontendRedirectPath,
  startSpotifyLogin,
} from "@/services/spotifyAuthClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CallbackState = "pending" | "error";

function getErrorMessage(error: unknown): string {
  if (error instanceof SpotifyAuthClientError) {
    if (error.status === 403) {
      return "Spotify authorization was denied. Please try again and accept consent.";
    }
    if (error.status === 429) {
      return "Too many authentication attempts. Please wait and retry.";
    }
    if (error.status === 503) {
      return "Authentication backend is temporarily unavailable (missing PKCE storage).";
    }
    if (error.status === 401) {
      return "Authentication session is invalid or expired. Please sign in again.";
    }
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return "Authentication failed. Please try again.";
}

export default function SpotifyAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nextPath = useMemo(
    () => resolveFrontendRedirectPath(searchParams.get("next")),
    [searchParams],
  );
  const queryError = searchParams.get("error");
  const queryErrorDescription = searchParams.get("error_description");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (queryError) {
        const status = queryError === "access_denied" ? 403 : 401;
        setState("error");
        setErrorMessage(
          getErrorMessage(
            new SpotifyAuthClientError(
              queryErrorDescription ?? queryError,
              status,
            ),
          ),
        );
        return;
      }

      try {
        await handleSpotifyCallbackHash();
        if (cancelled) return;
        router.replace(nextPath);
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setErrorMessage(getErrorMessage(error));
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [nextPath, queryError, queryErrorDescription, router]);

  if (state === "pending") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
        <div className="surface-panel w-full p-8 text-center">
          <div
            role="status"
            aria-label="Authenticating with Spotify"
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent"
          >
            <span className="sr-only">Authenticating with Spotify</span>
          </div>
          <p className="mt-4 text-sm text-[var(--color-subtext)]">
            Authenticating with Spotify...
          </p>
        </div>
      </div>
    );
  }

  const signInUrl = `/signin?callbackUrl=${encodeURIComponent(nextPath)}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
      <div className="surface-panel w-full p-8 text-center">
        <p className="text-sm text-[var(--color-subtext)]">
          {errorMessage ?? "Authentication failed."}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => startSpotifyLogin(nextPath)}
            className="w-full rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Retry Spotify Sign-In
          </button>
          <button
            type="button"
            onClick={() => router.replace(signInUrl)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
