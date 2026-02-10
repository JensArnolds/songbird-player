// File: src/app/signin/page.tsx

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { localStorage as appStorage } from "@/services/storage";
import { getGenres, type GenreListItem } from "@/utils/api";
import { parsePreferredGenreId } from "@/utils/genre";
import { getOAuthRedirectUri } from "@/utils/getOAuthRedirectUri";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const isBanned = error === "Banned";
  const [providers, setProviders] =
    useState<Awaited<ReturnType<typeof getProviders>>>(null);
  const [genres, setGenres] = useState<GenreListItem[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [preferredGenreId, setPreferredGenreId] = useState<number | null>(() =>
    parsePreferredGenreId(
      appStorage.getOrDefault<number | string | null>(
        STORAGE_KEYS.PREFERRED_GENRE_ID,
        null,
      ),
    ),
  );
  const [preferredGenreName, setPreferredGenreName] = useState(() => {
    const storedName = appStorage.getOrDefault<string>(
      STORAGE_KEYS.PREFERRED_GENRE_NAME,
      "",
    );
    return typeof storedName === "string" ? storedName.trim() : "";
  });

  useEffect(() => {
    let isMounted = true;

    void getProviders()
      .then((nextProviders) => {
        if (!isMounted) return;
        setProviders(nextProviders);
      })
      .catch(() => {
        if (!isMounted) return;
        setProviders({});
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getGenres(120)
      .then((items) => {
        if (!isMounted) return;
        setGenres(
          items
            .filter((item) => item.id > 0 && item.name.trim().length > 0)
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setGenres([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setGenresLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const oauthProviders = useMemo(() => {
    if (!providers) return [];
    return Object.values(providers).filter(
      (provider) => provider.id === "discord" || provider.id === "spotify",
    );
  }, [providers]);

  const featuredGenres = useMemo(() => genres.slice(0, 12), [genres]);

  const setGenrePreference = (genre: GenreListItem | null) => {
    if (!genre) {
      setPreferredGenreId(null);
      setPreferredGenreName("");
      appStorage.remove(STORAGE_KEYS.PREFERRED_GENRE_ID);
      appStorage.remove(STORAGE_KEYS.PREFERRED_GENRE_NAME);
      return;
    }

    setPreferredGenreId(genre.id);
    setPreferredGenreName(genre.name);
    appStorage.set(STORAGE_KEYS.PREFERRED_GENRE_ID, genre.id);
    appStorage.set(STORAGE_KEYS.PREFERRED_GENRE_NAME, genre.name);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4">
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 shadow-[var(--shadow-lg)]">
        <h1 className="text-center text-xl font-bold text-[var(--color-text)]">
          Sign in to Starchild Music
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-subtext)]">
          Pick a style once and your start page opens with a better first mix.
        </p>

        {isBanned && (
          <div
            className="mt-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--color-danger)]"
            role="alert"
          >
            Your account has been banned. If you believe this is an error,
            please contact support.
          </div>
        )}

        <section className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--color-subtext)] uppercase">
            Tune Start Page
          </p>
          {genresLoading ? (
            <div className="mt-3 flex items-center justify-center py-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : genres.length > 0 ? (
            <>
              <label
                htmlFor="preferred-genre"
                className="mt-2 block text-xs font-medium text-[var(--color-subtext)]"
              >
                Preferred genre
              </label>
              <select
                id="preferred-genre"
                value={preferredGenreId?.toString() ?? ""}
                onChange={(event) => {
                  const value = event.target.value.trim();
                  if (!value) {
                    setGenrePreference(null);
                    return;
                  }

                  const genreId = Number.parseInt(value, 10);
                  if (!Number.isFinite(genreId)) {
                    setGenrePreference(null);
                    return;
                  }

                  const selectedGenre =
                    genres.find((genre) => genre.id === genreId) ?? null;
                  setGenrePreference(selectedGenre);
                }}
                className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">No preference</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id.toString()}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                {featuredGenres.map((genre) => {
                  const isSelected = preferredGenreId === genre.id;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Select ${genre.name} genre`}
                      onClick={() => setGenrePreference(genre)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {preferredGenreName
                  ? `Selected: ${preferredGenreName}`
                  : "You can leave this empty and change it later."}
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-[var(--color-subtext)]">
              Genre presets are not available right now.
            </p>
          )}
        </section>

        <div className="mt-6">
          {providers === null ? (
            <div className="flex items-center justify-center py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : oauthProviders.length > 0 ? (
            <div className="space-y-3">
              {oauthProviders.map((provider) => {
                const isDiscord = provider.id === "discord";
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() =>
                      signIn(
                        provider.id,
                        { callbackUrl },
                        { redirect_uri: getOAuthRedirectUri(provider.id) },
                      )
                    }
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${
                      isDiscord ? "bg-[#5865f2]" : "bg-[#1db954]"
                    }`}
                  >
                    Sign in with {isDiscord ? "Discord" : "Spotify"}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-subtext)]">
              No sign-in providers are currently configured.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
