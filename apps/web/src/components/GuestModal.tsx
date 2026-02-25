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
import { ChevronDown, Music2, X } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface GuestModalProps {
  onContinueAsGuest?: () => void;
  callbackUrl?: string;
}

type SimilarityPreference = "strict" | "balanced" | "diverse";
type MoodPresetId = "chill" | "focus" | "hype" | "discover";
type GenreOption = {
  key: string;
  label: string;
  genre: GenreListItem | null;
};

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
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const [activeGenreIndex, setActiveGenreIndex] = useState<number>(0);
  const genreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const genreMenuRef = useRef<HTMLDivElement | null>(null);
  const genreOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedMood = useMemo(
    () => MOOD_PRESETS.find((preset) => preset.id === selectedMoodId) ?? null,
    [selectedMoodId],
  );
  const selectedGenre = useMemo(
    () => genres.find((genre) => genre.id === preferredGenreId) ?? null,
    [genres, preferredGenreId],
  );
  const selectedGenreLabel = useMemo(() => {
    if (genresLoading) return "Loading genres...";
    if (preferredGenreName.trim().length > 0) return preferredGenreName;
    if (selectedGenre?.name) return selectedGenre.name;
    if (genres.length > 0) return "No preference";
    return "Genres unavailable";
  }, [genres, genresLoading, preferredGenreName, selectedGenre]);
  const genreSelectDisabled = genresLoading || genres.length === 0;
  const genreSummaryLabel = selectedGenre?.name ?? preferredGenreName;
  const genreOptions = useMemo<GenreOption[]>(
    () => [
      { key: "none", label: "No preference", genre: null },
      ...genres.map((genre) => ({
        key: `genre-${genre.id}`,
        label: genre.name,
        genre,
      })),
    ],
    [genres],
  );
  const selectedGenreIndex = useMemo(() => {
    const index = genreOptions.findIndex((option) =>
      option.genre ? option.genre.id === preferredGenreId : preferredGenreId === null,
    );
    return index >= 0 ? index : 0;
  }, [genreOptions, preferredGenreId]);

  function setGenrePreference(genre: GenreListItem | null): void {
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
  }

  const closeGenreMenu = (): void => {
    setIsGenreMenuOpen(false);
  };

  const openGenreMenu = (index: number = selectedGenreIndex): void => {
    const lastIndex = Math.max(genreOptions.length - 1, 0);
    const nextIndex = Math.min(Math.max(index, 0), lastIndex);
    setActiveGenreIndex(nextIndex);
    setIsGenreMenuOpen(true);
  };

  const selectGenreFromIndex = (index: number): void => {
    const option = genreOptions[index];
    if (!option) return;
    setGenrePreference(option.genre);
    setIsGenreMenuOpen(false);
    genreTriggerRef.current?.focus();
  };

  const moveActiveGenreIndex = (delta: 1 | -1): void => {
    setActiveGenreIndex((current) => {
      const count = genreOptions.length;
      if (count === 0) return 0;
      const nextIndex = current + delta;
      if (nextIndex < 0) return count - 1;
      if (nextIndex >= count) return 0;
      return nextIndex;
    });
  };

  const handleGenreMenuKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ): void => {
    if (!isGenreMenuOpen || genreOptions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActiveGenreIndex(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActiveGenreIndex(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveGenreIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveGenreIndex(genreOptions.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectGenreFromIndex(activeGenreIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeGenreMenu();
        genreTriggerRef.current?.focus();
        break;
      case "Tab":
        closeGenreMenu();
        break;
      default:
        break;
    }
  };

  const handleGenreTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ): void => {
    if (genreSelectDisabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (isGenreMenuOpen) {
          moveActiveGenreIndex(1);
        } else {
          openGenreMenu(selectedGenreIndex);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isGenreMenuOpen) {
          moveActiveGenreIndex(-1);
        } else {
          openGenreMenu(selectedGenreIndex);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isGenreMenuOpen) {
          closeGenreMenu();
        } else {
          openGenreMenu(selectedGenreIndex);
        }
        break;
      case "Escape":
        if (!isGenreMenuOpen) return;
        event.preventDefault();
        closeGenreMenu();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    settingsStorage.set("theme", "dark");
    applyThemeClass();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !isOpen) return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

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

  useEffect(() => {
    if (!isGenreMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (genreMenuRef.current?.contains(target)) return;
      if (genreTriggerRef.current?.contains(target)) return;
      setIsGenreMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isGenreMenuOpen]);

  useEffect(() => {
    if (!isGenreMenuOpen) return;

    const activeOption = genreOptionRefs.current[activeGenreIndex];
    if (!activeOption) return;
    activeOption.focus({ preventScroll: true });
    activeOption.scrollIntoView({ block: "nearest" });
  }, [activeGenreIndex, isGenreMenuOpen]);

  const applyMoodPreset = (preset: MoodPreset): void => {
    setSelectedMoodId(preset.id);
    settingsStorage.set("similarityPreference", preset.similarity);
    settingsStorage.set("autoQueueEnabled", preset.autoQueue);
    settingsStorage.set("smartMixEnabled", preset.smartMix);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        setIsOpen(open);
        if (!open) {
          setIsGenreMenuOpen(false);
          onContinueAsGuest?.();
        }
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-hidden border-white/12 bg-[#0F1528]/95 p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] focus:outline-none",
          isMobile
            ? "!top-auto !right-0 !bottom-0 !left-0 !m-0 !h-[90vh] !w-full !max-w-full !translate-x-0 !translate-y-0 rounded-t-3xl rounded-b-none border-b-0 data-[state=closed]:!translate-y-full data-[state=open]:!translate-y-0"
            : "w-[min(40rem,calc(100%-2rem))] rounded-3xl data-[state=closed]:translate-y-3 data-[state=closed]:scale-[0.98] data-[state=open]:translate-y-0 data-[state=open]:scale-100",
        )}
        style={isMobile ? { height: "90dvh", maxHeight: "90dvh" } : undefined}
      >
        <div className="flex max-h-full min-h-0 flex-col overscroll-none">
          {isMobile ? (
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/30" />
            </div>
          ) : null}

          <DialogHeader className="border-b border-white/12 px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1DB954]/35 bg-[#1DB954]/12 sm:h-11 sm:w-11">
                  <Music2 className="h-5 w-5 text-[#1DB954]" />
                </div>
                <div>
                  <DialogTitle className="text-[15px] leading-5 text-white sm:text-lg sm:leading-6">
                    Tune the start page and optionally sign in
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs leading-relaxed text-white/72 sm:text-sm">
                    Save local tuning defaults now. You can still skip and start
                    listening immediately.
                  </DialogDescription>
                </div>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white sm:h-10 sm:w-10"
                  aria-label="Close and skip sign-in"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div
            className={cn(
              "min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain",
              "space-y-3 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]",
              "text-sm sm:px-5",
            )}
          >
            <section className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.03] p-2.5 sm:p-3">
              <p className="text-xs font-semibold tracking-[0.14em] text-white/72 uppercase">
                Tune Start Page
              </p>

              <div className="space-y-1">
                <p
                  id="guest-preferred-genre-label"
                  className="text-xs font-medium text-white/80"
                >
                  Genre
                </p>
                <div className="relative">
                  <button
                    ref={genreTriggerRef}
                    type="button"
                    id="guest-preferred-genre"
                    aria-labelledby="guest-preferred-genre-label"
                    aria-haspopup="listbox"
                    aria-controls="guest-preferred-genre-listbox"
                    aria-expanded={isGenreMenuOpen}
                    disabled={genreSelectDisabled}
                    onClick={() => {
                      if (isGenreMenuOpen) {
                        closeGenreMenu();
                      } else {
                        openGenreMenu(selectedGenreIndex);
                      }
                    }}
                    onKeyDown={handleGenreTriggerKeyDown}
                    className={cn(
                      "h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 pr-10 text-left text-sm text-white transition-colors outline-none focus:border-[#1DB954]/70",
                      genreSelectDisabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className="block truncate">{selectedGenreLabel}</span>
                  </button>
                  <ChevronDown
                    className={cn(
                      "pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-white/70 transition-transform",
                      isGenreMenuOpen && "rotate-180",
                    )}
                  />

                  {isGenreMenuOpen ? (
                    <div
                      id="guest-preferred-genre-listbox"
                      ref={genreMenuRef}
                      role="listbox"
                      aria-labelledby="guest-preferred-genre-label"
                      aria-activedescendant={
                        genreOptions[activeGenreIndex]
                          ? `guest-preferred-genre-option-${activeGenreIndex}`
                          : undefined
                      }
                      tabIndex={-1}
                      onKeyDown={handleGenreMenuKeyDown}
                      className="theme-panel absolute right-0 left-0 z-[25] mt-2 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl"
                    >
                      <div className="max-h-72 overflow-y-auto py-1">
                        {genreOptions.map((option, index) => {
                          const isSelected = option.genre
                            ? preferredGenreId === option.genre.id
                            : preferredGenreId === null;
                          const isActive = activeGenreIndex === index;

                          return (
                            <button
                              key={option.key}
                              id={`guest-preferred-genre-option-${index}`}
                              ref={(element) => {
                                genreOptionRefs.current[index] = element;
                              }}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                selectGenreFromIndex(index);
                              }}
                              onMouseEnter={() => setActiveGenreIndex(index)}
                              onFocus={() => setActiveGenreIndex(index)}
                              className={cn(
                                "w-full px-3 py-2.5 text-left text-sm transition-colors outline-none",
                                isSelected
                                  ? "bg-[#1DB954]/20 text-white"
                                  : "text-white/85 hover:bg-white/[0.08] hover:text-white",
                                isActive &&
                                  !isSelected &&
                                  "bg-white/[0.08] text-white",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
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
                        <p className="text-[13px] leading-tight font-medium sm:text-sm">
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
                {genreSummaryLabel
                  ? `Genre: ${genreSummaryLabel}`
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
                className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#5865F2,#7480ff)] px-4 text-[13px] font-semibold text-white transition duration-200 ease-out hover:brightness-110 active:brightness-95 sm:text-sm"
              >
                Sign in to sync preferences
              </button>

              <button
                type="button"
                onClick={() => startSpotifyLogin(callbackUrl)}
                className="h-12 w-full rounded-xl border border-[#1DB954]/40 bg-[#1DB954]/15 px-4 text-[13px] font-semibold text-white transition duration-200 ease-out hover:bg-[#1DB954]/20 sm:text-sm"
              >
                Use Spotify instead
              </button>

              <DialogClose asChild>
                <button
                  type="button"
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-[13px] font-semibold text-white/92 transition duration-200 ease-out hover:border-white/30 hover:bg-white/[0.1] sm:text-sm"
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
