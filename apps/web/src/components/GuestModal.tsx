"use client";

import { STORAGE_KEYS } from "@starchild/config/storage";
import { getGenres, type GenreListItem } from "@starchild/api-client/rest";
import { localStorage as appStorage } from "@/services/storage";
import { startSpotifyLogin } from "@/services/spotifyAuthClient";
import { buildAuthCallbackUrl } from "@/utils/authRedirect";
import { parsePreferredGenreId } from "@/utils/genre";
import { settingsStorage } from "@/utils/settingsStorage";
import { Music2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

interface GuestModalProps {
  onContinueAsGuest?: () => void;
  callbackUrl?: string;
}

type SimilarityPreference = "strict" | "balanced" | "diverse";

function readBooleanFromLocalStorageKey(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;

  if (raw === "true") return true;
  if (raw === "false") return false;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === true) return true;
    if (parsed === false) return false;
  } catch {

  }

  return fallback;
}

function applyThemeClass(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.add("theme-dark");
  html.classList.remove("theme-light");
}

function PreferenceToggle({
  label,
  description,
  checked,
  onClick,
}: {
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        checked
          ? "border-[#1DB954]/50 bg-[#1DB954]/12"
          : "border-white/12 bg-white/[0.04] hover:border-white/28 hover:bg-white/[0.08]"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-0.5 text-xs text-white/65">{description}</p>
      </div>
      <div
        className={`h-5 w-9 shrink-0 rounded-full border p-0.5 transition ${
          checked
            ? "border-[#1DB954] bg-[#1DB954]/20"
            : "border-white/25 bg-white/10"
        }`}
      >
        <div
          className={`h-3.5 w-3.5 rounded-full transition ${
            checked ? "translate-x-3.5 bg-[#1DB954]" : "translate-x-0 bg-white/80"
          }`}
        />
      </div>
    </button>
  );
}

export function GuestModal({
  onContinueAsGuest,
  callbackUrl = "/library",
}: GuestModalProps) {
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
  const [preferredGenreName, setPreferredGenreName] = useState<string>(() =>
    appStorage.getOrDefault<string>(STORAGE_KEYS.PREFERRED_GENRE_NAME, ""),
  );
  const [visualizerEnabled, setVisualizerEnabled] = useState<boolean>(() =>
    readBooleanFromLocalStorageKey(STORAGE_KEYS.VISUALIZER_ENABLED, true),
  );
  const [equalizerEnabled, setEqualizerEnabled] = useState<boolean>(() =>
    readBooleanFromLocalStorageKey(STORAGE_KEYS.EQUALIZER_ENABLED, false),
  );
  const [autoQueueEnabled, setAutoQueueEnabled] = useState<boolean>(() =>
    settingsStorage.getSetting("autoQueueEnabled", false),
  );
  const [smartMixEnabled, setSmartMixEnabled] = useState<boolean>(() =>
    settingsStorage.getSetting("smartMixEnabled", true),
  );
  const [similarityPreference, setSimilarityPreference] =
    useState<SimilarityPreference>(() =>
      settingsStorage.getSetting("similarityPreference", "balanced"),
    );

  const featuredGenres = useMemo(() => genres.slice(0, 12), [genres]);

  useEffect(() => {
    settingsStorage.set("theme", "dark");
    applyThemeClass();
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getGenres(120)
      .then((items) => {
        if (!isMounted) return;
        const normalized = items
          .filter((item) => item.id > 0 && item.name.trim().length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));
        setGenres(normalized);
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

  const setGenrePreference = (genre: GenreListItem | null) => {
    if (!genre) {
      setPreferredGenreId(null);
      setPreferredGenreName("");
      void appStorage.remove(STORAGE_KEYS.PREFERRED_GENRE_ID);
      void appStorage.remove(STORAGE_KEYS.PREFERRED_GENRE_NAME);
      return;
    }

    setPreferredGenreId(genre.id);
    setPreferredGenreName(genre.name);
    void appStorage.set(STORAGE_KEYS.PREFERRED_GENRE_ID, genre.id);
    void appStorage.set(STORAGE_KEYS.PREFERRED_GENRE_NAME, genre.name);
  };

  const enforceDarkTheme = () => {
    settingsStorage.set("theme", "dark");
    applyThemeClass();
  };

  const updateVisualizerEnabled = (next: boolean) => {
    setVisualizerEnabled(next);
    void appStorage.set(STORAGE_KEYS.VISUALIZER_ENABLED, next);
  };

  const updateEqualizerEnabled = (next: boolean) => {
    setEqualizerEnabled(next);
    void appStorage.set(STORAGE_KEYS.EQUALIZER_ENABLED, next);
    settingsStorage.set("equalizerEnabled", next);
  };

  const updateAutoQueueEnabled = (next: boolean) => {
    setAutoQueueEnabled(next);
    settingsStorage.set("autoQueueEnabled", next);
  };

  const updateSmartMixEnabled = (next: boolean) => {
    setSmartMixEnabled(next);
    settingsStorage.set("smartMixEnabled", next);
  };

  const updateSimilarityPreference = (next: SimilarityPreference) => {
    setSimilarityPreference(next);
    settingsStorage.set("similarityPreference", next);
  };

  const resetTuningDefaults = () => {
    setGenrePreference(null);
    enforceDarkTheme();
    updateVisualizerEnabled(true);
    updateEqualizerEnabled(false);
    updateAutoQueueEnabled(false);
    updateSmartMixEnabled(true);
    updateSimilarityPreference("balanced");
  };

  return (
    <section className="fixed inset-0 z-[230] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,48,160,0.22),_transparent_48%),linear-gradient(180deg,rgba(18,22,45,0.7)_0%,rgba(6,7,15,0.76)_65%,rgba(3,3,8,0.78)_100%)] backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#1DB954]/12 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0F1528]/88 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/12">
          <Music2 className="h-7 w-7 text-[#1DB954]" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-white">
          Tune the start page and optionally sign in
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/72">
          Save local tuning defaults now. Your genre and playback preferences stay
          on this browser.
        </p>

        <section className="mt-5 rounded-2xl border border-white/12 bg-white/[0.03] p-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
            Tune Start Page
          </p>

          {genresLoading ? (
            <div className="mt-3 flex items-center justify-center py-2">
              <div
                role="status"
                aria-label="Loading genres"
                className="h-5 w-5 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent"
              >
                <span className="sr-only">Loading genres</span>
              </div>
            </div>
          ) : genres.length > 0 ? (
            <>
              <label
                htmlFor="guest-preferred-genre"
                className="mt-3 block text-xs font-medium text-white/80"
              >
                Preferred genre
              </label>
              <select
                id="guest-preferred-genre"
                value={preferredGenreId?.toString() ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value.trim();
                  if (!nextValue) {
                    setGenrePreference(null);
                    return;
                  }
                  const genreId = Number.parseInt(nextValue, 10);
                  if (!Number.isFinite(genreId)) {
                    setGenrePreference(null);
                    return;
                  }
                  const selectedGenre =
                    genres.find((genre) => genre.id === genreId) ?? null;
                  setGenrePreference(selectedGenre);
                }}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[#1DB954]/60 focus:outline-none"
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
                      onClick={() => setGenrePreference(genre)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "border-[#f4b266] bg-[#f4b266]/15 text-[#f4b266]"
                          : "border-white/20 bg-white/[0.04] text-white/75 hover:border-white/35 hover:text-white"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-white/70">
              Genre presets are not available right now.
            </p>
          )}

          <p className="mt-2 text-xs text-white/60">
            {preferredGenreName
              ? `Selected: ${preferredGenreName}`
              : "No genre selected."}
          </p>

          <div className="mt-4 grid gap-2">
            <PreferenceToggle
              label="Visualizer background"
              description="Animated background while music plays."
              checked={visualizerEnabled}
              onClick={() => updateVisualizerEnabled(!visualizerEnabled)}
            />
            <PreferenceToggle
              label="Equalizer by default"
              description="Enable your EQ profile for local playback."
              checked={equalizerEnabled}
              onClick={() => updateEqualizerEnabled(!equalizerEnabled)}
            />
            <PreferenceToggle
              label="Auto queue"
              description="Keep queue filled with related tracks."
              checked={autoQueueEnabled}
              onClick={() => updateAutoQueueEnabled(!autoQueueEnabled)}
            />
            <PreferenceToggle
              label="Smart mix"
              description="Improve recommendations from your play patterns."
              checked={smartMixEnabled}
              onClick={() => updateSmartMixEnabled(!smartMixEnabled)}
            />
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-white/80">Mix similarity</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(["strict", "balanced", "diverse"] as const).map((option) => {
                const selected = similarityPreference === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateSimilarityPreference(option)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition ${
                      selected
                        ? "border-[#1DB954]/50 bg-[#1DB954]/14 text-[#84e3a2]"
                        : "border-white/18 bg-white/[0.03] text-white/75 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-white/80">Theme</p>
            <div className="mt-1.5 rounded-lg border border-[#f4b266]/55 bg-[#f4b266]/14 px-2 py-1.5 text-xs font-medium text-[#f4b266]">
              Dark (forced)
            </div>
          </div>

          <button
            type="button"
            onClick={resetTuningDefaults}
            className="mt-3 text-xs font-medium text-white/60 underline decoration-white/25 underline-offset-2 transition hover:text-white"
          >
            Reset local tuning defaults
          </button>
        </section>

        <button
          type="button"
          onClick={() =>
            void signIn("discord", {
              callbackUrl: buildAuthCallbackUrl(callbackUrl, "discord"),
            })
          }
          className="mt-7 w-full rounded-2xl bg-[linear-gradient(135deg,#5865F2,#7480ff)] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:brightness-95"
        >
          Sign in with Discord
        </button>
        <button
          type="button"
          onClick={() => startSpotifyLogin(callbackUrl)}
          className="mt-3 w-full rounded-2xl bg-[#1DB954] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:brightness-95"
        >
          Sign in with Spotify
        </button>
        <button
          type="button"
          onClick={() => onContinueAsGuest?.()}
          className="mt-3 w-full rounded-2xl border border-white/18 bg-white/6 px-5 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10"
        >
          No Sign in, just tune
        </button>
      </div>
    </section>
  );
}
