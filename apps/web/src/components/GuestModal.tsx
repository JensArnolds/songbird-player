// File: apps/web/src/components/GuestModal.tsx

"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { localStorage as appStorage } from "@/services/storage";
import { startSpotifyLogin } from "@/services/spotifyAuthClient";
import { buildAuthCallbackUrl } from "@/utils/authRedirect";
import { parsePreferredGenreId } from "@/utils/genre";
import { settingsStorage } from "@/utils/settingsStorage";
import { getGenres, type GenreListItem } from "@starchild/api-client/rest";
import { STORAGE_KEYS } from "@starchild/config/storage";
import { Music2, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

interface GuestModalProps {
  onContinueAsGuest?: () => void;
  callbackUrl?: string;
}

type SimilarityPreference = "strict" | "balanced" | "diverse";
type MoodPresetId = "chill" | "focus" | "hype" | "discover";

type MoodPreset = {
  id: MoodPresetId;
  label: string;
  hint: string;
  similarity: SimilarityPreference;
  autoQueue: boolean;
  smartMix: boolean;
};

const MOOD_PRESETS: MoodPreset[] = [
  {
    id: "chill",
    label: "Chill",
    hint: "Smooth + relaxed",
    similarity: "diverse",
    autoQueue: false,
    smartMix: true,
  },
  {
    id: "focus",
    label: "Focus",
    hint: "Tighter matches",
    similarity: "strict",
    autoQueue: false,
    smartMix: true,
  },
  {
    id: "hype",
    label: "Hype",
    hint: "Faster queue flow",
    similarity: "balanced",
    autoQueue: true,
    smartMix: true,
  },
  {
    id: "discover",
    label: "Discover",
    hint: "Broader variety",
    similarity: "diverse",
    autoQueue: true,
    smartMix: false,
  },
];

function applyThemeClass(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.add("theme-dark");
  html.classList.remove("theme-light");
}

function resolveInitialMood(
  similarityPreference: SimilarityPreference,
  autoQueueEnabled: boolean,
  smartMixEnabled: boolean,
): MoodPresetId {
  const match = MOOD_PRESETS.find(
    (preset) =>
      preset.similarity === similarityPreference &&
      preset.autoQueue === autoQueueEnabled &&
      preset.smartMix === smartMixEnabled,
  );
  return match?.id ?? "chill";
}

export function GuestModal({
  onContinueAsGuest,
  callbackUrl = "/library",
}: GuestModalProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isOpen, setIsOpen] = useState(true);
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
  const [selectedMoodId, setSelectedMoodId] = useState<MoodPresetId>(() =>
    resolveInitialMood(
      settingsStorage.getSetting("similarityPreference", "balanced"),
      settingsStorage.getSetting("autoQueueEnabled", false),
      settingsStorage.getSetting("smartMixEnabled", true),
    ),
  );

  const selectedMood = useMemo(
    () => MOOD_PRESETS.find((preset) => preset.id === selectedMoodId) ?? null,
    [selectedMoodId],
  );

  useEffect(() => {
    settingsStorage.set("theme", "dark");
    applyThemeClass();
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getGenres(80)
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

  const setGenrePreference = (genre: GenreListItem | null): void => {
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

  const applyMoodPreset = (preset: MoodPreset): void => {
    setSelectedMoodId(preset.id);
    settingsStorage.set("similarityPreference", preset.similarity);
    settingsStorage.set("autoQueueEnabled", preset.autoQueue);
    settingsStorage.set("smartMixEnabled", preset.smartMix);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          onContinueAsGuest?.();
        }
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-hidden border-white/12 bg-[#0F1528]/95 p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] focus:outline-none",
          isMobile
            ? "top-auto right-0 bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none border-b-0 data-[state=closed]:translate-y-full data-[state=open]:translate-y-0"
            : "w-[min(40rem,calc(100%-2rem))] rounded-3xl data-[state=closed]:translate-y-3 data-[state=closed]:scale-[0.98] data-[state=open]:translate-y-0 data-[state=open]:scale-100",
        )}
      >
        <div className="flex max-h-[90vh] flex-col overscroll-none">
          <DialogHeader className="border-b border-white/12 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1DB954]/35 bg-[#1DB954]/12">
                  <Music2 className="h-5 w-5 text-[#1DB954]" />
                </div>
                <div>
                  <DialogTitle className="text-base text-white sm:text-lg">
                    Tune the start page and optionally sign in
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-white/72">
                    Save local tuning defaults now. You can still skip and start
                    listening immediately.
                  </DialogDescription>
                </div>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close and skip sign-in"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-sm sm:px-5">
            <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-white/72 uppercase">
                Tune Start Page
              </p>

              <div className="space-y-1">
                <label
                  htmlFor="guest-preferred-genre"
                  className="text-xs font-medium text-white/80"
                >
                  Genre
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
                  disabled={genresLoading || genres.length === 0}
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 text-sm text-white transition-colors outline-none focus:border-[#1DB954]/70 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {genresLoading
                      ? "Loading genres..."
                      : genres.length > 0
                        ? "No preference"
                        : "Genres unavailable"}
                  </option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-white/80">Mood</p>
                <div className="grid grid-cols-2 gap-2">
                  {MOOD_PRESETS.map((preset) => {
                    const selected = selectedMoodId === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => applyMoodPreset(preset)}
                        className={cn(
                          "h-12 rounded-xl border px-2 text-left transition-all duration-200 ease-out",
                          selected
                            ? "border-[#1DB954]/70 bg-[#1DB954]/18 text-white"
                            : "border-white/15 bg-white/[0.03] text-white/82 hover:border-white/30 hover:bg-white/[0.08]",
                        )}
                      >
                        <p className="text-sm leading-tight font-medium">
                          {preset.label}
                        </p>
                        <p className="text-[11px] text-white/65">
                          {preset.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-white/65">
                {preferredGenreName
                  ? `Genre: ${preferredGenreName}`
                  : "Genre: none selected"}{" "}
                · Mood: {selectedMood?.label ?? "Chill"}
              </p>
            </section>

            <div className="space-y-2 pb-1">
              <button
                type="button"
                onClick={() =>
                  void signIn("discord", {
                    callbackUrl: buildAuthCallbackUrl(callbackUrl, "discord"),
                  })
                }
                className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#5865F2,#7480ff)] px-4 text-sm font-semibold text-white transition duration-200 ease-out hover:brightness-110 active:brightness-95"
              >
                Sign in to sync preferences
              </button>

              <button
                type="button"
                onClick={() => startSpotifyLogin(callbackUrl)}
                className="h-12 w-full rounded-xl border border-[#1DB954]/40 bg-[#1DB954]/15 px-4 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-[#1DB954]/20"
              >
                Use Spotify instead
              </button>

              <DialogClose asChild>
                <button
                  type="button"
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/92 transition duration-200 ease-out hover:border-white/30 hover:bg-white/[0.1]"
                >
                  Skip for now
                </button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
