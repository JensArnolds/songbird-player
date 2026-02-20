// File: apps/web/src/app/library/page.tsx

"use client";

import { EmptyState } from "@/components/EmptyState";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { useToast } from "@/contexts/ToastContext";
import { hapticLight } from "@/utils/haptics";
import { api } from "@starchild/api-client/trpc/react";
import { useGlobalPlayer } from "@starchild/player-react/AudioPlayerContext";
import type { Track } from "@starchild/types";
import { LoadingState } from "@starchild/ui/LoadingSpinner";
import {
  ArrowUpDown,
  CheckSquare,
  Clock,
  Heart,
  ListPlus,
  Play,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type TabType = "favorites" | "history";
type SortOption = "newest" | "oldest" | "artist" | "album" | "duration";

type LibraryEntry = {
  id: number;
  track: Track;
  createdAt?: Date | string;
  playedAt?: Date | string;
  duration?: number | null;
};

type RemovalUndoState = {
  tab: TabType;
  entries: LibraryEntry[];
  timerId: number;
};

const UNDO_TIMEOUT_MS = 8000;
const SMART_SEED_LIMIT = 5;
const SMART_QUEUE_LIMIT = 40;
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "duration", label: "Duration" },
];

function shuffleTracks(tracks: Track[]): Track[] {
  const copy = [...tracks];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = current!;
  }
  return copy;
}

function createTrackSearchText(track: Track): string {
  return `${track.title} ${track.artist.name} ${track.album.title}`.toLowerCase();
}

function dedupeTracksById(tracks: Track[]): Track[] {
  const seenTrackIds = new Set<number>();
  const uniqueTracks: Track[] = [];

  for (const track of tracks) {
    if (seenTrackIds.has(track.id)) {
      continue;
    }

    seenTrackIds.add(track.id);
    uniqueTracks.push(track);
  }

  return uniqueTracks;
}

function buildLibraryPlaylistName(tab: TabType): string {
  const date = new Date().toISOString().slice(0, 10);
  const section = tab === "favorites" ? "Favorites" : "History";
  return `Library ${section} ${date}`;
}

function getEntryTimestamp(entry: LibraryEntry): number {
  const value = entry.createdAt ?? entry.playedAt;
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortLibraryEntries(
  entries: LibraryEntry[],
  sortOption: SortOption,
): LibraryEntry[] {
  const copy = [...entries];

  copy.sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return getEntryTimestamp(b) - getEntryTimestamp(a);
      case "oldest":
        return getEntryTimestamp(a) - getEntryTimestamp(b);
      case "artist":
        return a.track.artist.name.localeCompare(
          b.track.artist.name,
          undefined,
          {
            sensitivity: "base",
          },
        );
      case "album":
        return a.track.album.title.localeCompare(
          b.track.album.title,
          undefined,
          {
            sensitivity: "base",
          },
        );
      case "duration":
        return (b.track.duration ?? 0) - (a.track.duration ?? 0);
      default:
        return 0;
    }
  });

  return copy;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(
    new Set(),
  );
  const [removalUndo, setRemovalUndo] = useState<RemovalUndoState | null>(null);
  const [isListActionPending, setIsListActionPending] = useState(false);

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const { showToast } = useToast();
  const player = useGlobalPlayer();
  const utils = api.useUtils();

  const { data: favorites, isLoading: favoritesLoading } =
    api.music.getFavorites.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "favorites" && isAuthenticated },
    );

  const { data: history, isLoading: historyLoading } =
    api.music.getHistory.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "history" && isAuthenticated },
    );

  const addFavorite = api.music.addFavorite.useMutation();
  const removeFavorite = api.music.removeFavorite.useMutation();
  const addToHistory = api.music.addToHistory.useMutation();
  const removeFromHistory = api.music.removeFromHistory.useMutation();
  const clearHistory = api.music.clearHistory.useMutation();
  const clearNonFavoritesFromHistory =
    api.music.clearNonFavoritesFromHistory.useMutation();
  const createPlaylist = api.music.createPlaylist.useMutation();
  const addToPlaylist = api.music.addToPlaylist.useMutation();
  const generateSmartMix = api.music.generateSmartMix.useMutation();

  const favoriteEntries = (favorites ?? []) as LibraryEntry[];
  const historyEntries = (history ?? []) as LibraryEntry[];
  const activeEntries =
    activeTab === "favorites" ? favoriteEntries : historyEntries;
  const activeTracks = activeEntries.map((entry) => entry.track);
  const activeTabLoading =
    activeTab === "favorites" ? favoritesLoading : historyLoading;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasSearchFilter = normalizedSearchQuery.length > 0;

  const sortedEntries = useMemo(
    () => sortLibraryEntries(activeEntries, sortOption),
    [activeEntries, sortOption],
  );

  const visibleEntries = useMemo(() => {
    if (!hasSearchFilter) return sortedEntries;
    return sortedEntries.filter((entry) =>
      createTrackSearchText(entry.track).includes(normalizedSearchQuery),
    );
  }, [hasSearchFilter, normalizedSearchQuery, sortedEntries]);

  const visibleTracks = useMemo(
    () => visibleEntries.map((entry) => entry.track),
    [visibleEntries],
  );

  const selectedEntries = useMemo(
    () => activeEntries.filter((entry) => selectedEntryIds.has(entry.id)),
    [activeEntries, selectedEntryIds],
  );

  const selectedTracks = useMemo(
    () => selectedEntries.map((entry) => entry.track),
    [selectedEntries],
  );

  const selectedVisibleCount = useMemo(
    () =>
      visibleEntries.filter((entry) => selectedEntryIds.has(entry.id)).length,
    [selectedEntryIds, visibleEntries],
  );

  useEffect(() => {
    return () => {
      if (removalUndo) {
        window.clearTimeout(removalUndo.timerId);
      }
    };
  }, [removalUndo]);

  useEffect(() => {
    setSelectedEntryIds((previous) => {
      if (previous.size === 0) return previous;

      const availableIds = new Set(activeEntries.map((entry) => entry.id));
      let changed = false;
      const next = new Set<number>();

      for (const id of previous) {
        if (availableIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [activeEntries]);

  const playTrackList = (tracks: Track[]): void => {
    if (tracks.length === 0) return;

    const [first, ...rest] = tracks;
    if (!first) return;

    hapticLight();
    player.clearQueue();
    player.playTrack(first);
    if (rest.length > 0) {
      player.addToQueue(rest, false);
    }
  };

  const clearSelection = (): void => {
    setSelectedEntryIds(new Set());
  };

  const switchTab = (tab: TabType): void => {
    setSearchQuery("");
    setIsSelectionMode(false);
    clearSelection();
    setActiveTab(tab);
  };

  const handlePlayAll = (): void => {
    playTrackList(visibleTracks);
  };

  const handleShuffleAll = (): void => {
    playTrackList(shuffleTracks(visibleTracks));
  };

  const handleQueueAllNext = (): void => {
    if (visibleTracks.length === 0) return;
    hapticLight();
    player.addToPlayNext(visibleTracks);
  };

  const handlePlayFromHere = (index: number): void => {
    if (index < 0 || index >= visibleTracks.length) return;
    playTrackList(visibleTracks.slice(index));
  };

  const handleToggleSelectionMode = (): void => {
    setIsSelectionMode((previous) => {
      if (previous) {
        clearSelection();
      }
      return !previous;
    });
  };

  const handleToggleEntrySelection = (entryId: number): void => {
    setSelectedEntryIds((previous) => {
      const next = new Set(previous);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSelectAllInTab = (): void => {
    setSelectedEntryIds(new Set(activeEntries.map((entry) => entry.id)));
  };

  const handlePlaySelected = (): void => {
    playTrackList(selectedTracks);
  };

  const handleQueueSelected = (): void => {
    if (selectedTracks.length === 0) return;
    hapticLight();
    player.addToPlayNext(selectedTracks);
  };

  const handleSaveTabAsPlaylist = async (): Promise<void> => {
    if (isListActionPending) {
      return;
    }

    const sourceTracks = dedupeTracksById(
      selectedTracks.length > 0 ? selectedTracks : visibleTracks,
    );

    if (sourceTracks.length === 0) {
      showToast("No tracks available to save as a playlist", "info");
      return;
    }

    setIsListActionPending(true);

    try {
      const sourceLabel =
        selectedTracks.length > 0
          ? "selected tracks"
          : hasSearchFilter
            ? "filtered tab"
            : "library tab";

      const playlist = await createPlaylist.mutateAsync({
        name: buildLibraryPlaylistName(activeTab),
        description: `Generated from your ${sourceLabel}`,
        isPublic: false,
      });

      if (!playlist) {
        throw new Error("Playlist creation failed");
      }

      const results = await Promise.all(
        sourceTracks.map((track) =>
          addToPlaylist.mutateAsync({
            playlistId: playlist.id,
            track,
          }),
        ),
      );

      const addedCount = results.reduce(
        (count, result) => (result.alreadyExists ? count : count + 1),
        0,
      );
      await utils.music.getPlaylists.invalidate();

      showToast(
        `Saved ${addedCount} track${addedCount === 1 ? "" : "s"} to "${playlist.name}"`,
        "success",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to save playlist: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const handleSmartQueueFromLibrary = async (): Promise<void> => {
    if (isListActionPending) {
      return;
    }

    const sourceTracks = dedupeTracksById(
      selectedTracks.length > 0 ? selectedTracks : visibleTracks,
    );

    if (sourceTracks.length === 0) {
      showToast("No tracks available to build smart queue", "info");
      return;
    }

    const seedTracks = sourceTracks.slice(0, SMART_SEED_LIMIT);
    const seedTrackIds = seedTracks.map((track) => track.id);

    setIsListActionPending(true);

    try {
      const mix = await generateSmartMix.mutateAsync({
        seedTrackIds,
        limit: SMART_QUEUE_LIMIT,
        diversity: "balanced",
        recommendationSource: "unified",
      });

      const seedTrackIdSet = new Set(seedTrackIds);
      const recommendedTracks = dedupeTracksById(mix.tracks).filter(
        (track) => !seedTrackIdSet.has(track.id),
      );

      const queueTracks = [...seedTracks, ...recommendedTracks];
      playTrackList(queueTracks);

      showToast(
        `Smart queue ready: ${seedTracks.length} seeds + ${recommendedTracks.length} recommendations`,
        "success",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to build smart queue: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const handleClearHistory = async (): Promise<void> => {
    if (isListActionPending || activeTab !== "history") {
      return;
    }

    if (
      !window.confirm(
        "Clear your full listening history? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsListActionPending(true);

    try {
      const result = await clearHistory.mutateAsync();
      await utils.music.getHistory.invalidate();
      clearSelection();

      if (removalUndo) {
        window.clearTimeout(removalUndo.timerId);
        setRemovalUndo(null);
      }

      showToast(
        `Cleared ${result.removedCount} history entr${
          result.removedCount === 1 ? "y" : "ies"
        }`,
        "success",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to clear history: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const handleClearNonFavoritesHistory = async (): Promise<void> => {
    if (isListActionPending || activeTab !== "history") {
      return;
    }

    if (
      !window.confirm(
        "Remove all non-favorite tracks from history? Favorite history entries will be kept.",
      )
    ) {
      return;
    }

    setIsListActionPending(true);

    try {
      const result = await clearNonFavoritesFromHistory.mutateAsync();
      await utils.music.getHistory.invalidate();
      clearSelection();

      showToast(
        `Removed ${result.removedCount} non-favorite history ${
          result.removedCount === 1 ? "entry" : "entries"
        }`,
        "success",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to clear non-favorites: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const handleRemoveEntries = async (
    entries: LibraryEntry[],
  ): Promise<void> => {
    if (entries.length === 0 || isListActionPending) {
      return;
    }

    const tabForRemoval = activeTab;
    setIsListActionPending(true);

    try {
      if (tabForRemoval === "favorites") {
        for (const entry of entries) {
          await removeFavorite.mutateAsync({ trackId: entry.track.id });
        }
        await utils.music.getFavorites.invalidate();
      } else {
        for (const entry of entries) {
          await removeFromHistory.mutateAsync({ historyId: entry.id });
        }
        await utils.music.getHistory.invalidate();
      }

      setSelectedEntryIds((previous) => {
        if (previous.size === 0) return previous;

        const next = new Set(previous);
        entries.forEach((entry) => {
          next.delete(entry.id);
        });
        return next;
      });

      if (removalUndo) {
        window.clearTimeout(removalUndo.timerId);
      }

      const timerId = window.setTimeout(() => {
        setRemovalUndo(null);
      }, UNDO_TIMEOUT_MS);

      setRemovalUndo({
        tab: tabForRemoval,
        entries: [...entries],
        timerId,
      });

      const targetLabel =
        tabForRemoval === "favorites" ? "favorites" : "history";
      showToast(
        `Removed ${entries.length} track${entries.length === 1 ? "" : "s"} from ${targetLabel}`,
        "info",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to remove tracks: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const handleRemoveSelected = (): void => {
    void handleRemoveEntries(selectedEntries);
  };

  const handleUndoRemoval = async (): Promise<void> => {
    if (!removalUndo || isListActionPending) {
      return;
    }

    setIsListActionPending(true);

    try {
      window.clearTimeout(removalUndo.timerId);

      if (removalUndo.tab === "favorites") {
        for (const entry of removalUndo.entries) {
          await addFavorite.mutateAsync({ track: entry.track });
        }
        await utils.music.getFavorites.invalidate();
      } else {
        for (const entry of removalUndo.entries) {
          await addToHistory.mutateAsync({
            track: entry.track,
            duration: entry.duration ?? undefined,
          });
        }
        await utils.music.getHistory.invalidate();
      }

      showToast(
        `Restored ${removalUndo.entries.length} track${
          removalUndo.entries.length === 1 ? "" : "s"
        }`,
        "success",
      );

      setRemovalUndo(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to restore tracks: ${message}`, "error");
    } finally {
      setIsListActionPending(false);
    }
  };

  const isActionDisabled = isListActionPending || activeTabLoading;

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-3 py-4 md:px-6 md:py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)] md:mb-8 md:text-3xl">
        Your Library
      </h1>

      <div className="mb-6 flex gap-2 border-b border-[var(--color-border)] md:mb-8 md:gap-4">
        <button
          onClick={() => switchTab("favorites")}
          className={`touch-target relative flex flex-1 items-center justify-center gap-2 px-3 pb-3 font-medium transition md:flex-initial md:px-4 md:pb-4 ${
            activeTab === "favorites"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
          }`}
        >
          <Heart className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">Favorites</span>
          {activeTab === "favorites" && (
            <div className="accent-gradient absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
        <button
          onClick={() => switchTab("history")}
          className={`touch-target relative flex flex-1 items-center justify-center gap-2 px-3 pb-3 font-medium transition md:flex-initial md:px-4 md:pb-4 ${
            activeTab === "history"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
          }`}
        >
          <Clock className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">History</span>
          {activeTab === "history" && (
            <div className="accent-gradient absolute right-0 bottom-0 left-0 h-0.5" />
          )}
        </button>
      </div>

      {isAuthenticated && !activeTabLoading && activeTracks.length > 0 ? (
        <div className="mb-6 space-y-3 md:mb-8">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${
                activeTab === "favorites" ? "favorites" : "history"
              }...`}
              className="touch-target-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition outline-none focus:border-[var(--color-accent)]"
            />

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-subtext)]" />
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                className="touch-target-lg w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-9 text-sm text-[var(--color-text)] transition outline-none focus:border-[var(--color-accent)]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleToggleSelectionMode}
              className="btn-secondary touch-target-lg inline-flex items-center justify-center gap-2"
            >
              {isSelectionMode ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Done Selecting</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span>Select Tracks</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={handlePlayAll}
              className="btn-primary touch-target-lg inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4 md:h-5 md:w-5" />
              <span>Play All</span>
            </button>
            <button
              onClick={handleShuffleAll}
              className="btn-secondary touch-target-lg inline-flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Shuffle All</span>
            </button>
            <button
              onClick={handleQueueAllNext}
              className="btn-secondary touch-target-lg inline-flex items-center gap-2"
            >
              <ListPlus className="h-4 w-4 md:h-5 md:w-5" />
              <span>Queue All Next</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => {
                void handleSaveTabAsPlaylist();
              }}
              className="btn-secondary touch-target inline-flex items-center gap-1.5 px-2 py-1.5 text-xs"
              disabled={isActionDisabled}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save As Playlist</span>
            </button>
            <button
              onClick={() => {
                void handleSmartQueueFromLibrary();
              }}
              className="btn-secondary touch-target inline-flex items-center gap-1.5 px-2 py-1.5 text-xs"
              disabled={isActionDisabled}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart Queue</span>
            </button>
            {activeTab === "history" ? (
              <>
                <button
                  onClick={() => {
                    void handleClearNonFavoritesHistory();
                  }}
                  className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium text-[var(--color-subtext)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isActionDisabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Non-Favorites</span>
                </button>
                <button
                  onClick={() => {
                    void handleClearHistory();
                  }}
                  className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2 py-1.5 text-xs font-medium text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isActionDisabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
              </>
            ) : null}
          </div>

          {isSelectionMode ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 md:p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--color-subtext)]">
                  {selectedEntries.length} selected
                  {hasSearchFilter
                    ? ` (${selectedVisibleCount} visible with current filter)`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllInTab}
                    className="btn-secondary touch-target inline-flex items-center gap-1.5 px-2 py-1 text-xs"
                    disabled={activeEntries.length === 0 || isActionDisabled}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Select All</span>
                  </button>
                  <button
                    onClick={clearSelection}
                    className="btn-secondary touch-target inline-flex items-center gap-1.5 px-2 py-1 text-xs"
                    disabled={selectedEntries.length === 0 || isActionDisabled}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={handlePlaySelected}
                    className="btn-primary touch-target inline-flex items-center gap-1.5 px-2 py-1 text-xs"
                    disabled={selectedTracks.length === 0 || isActionDisabled}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Play Selected</span>
                  </button>
                  <button
                    onClick={handleQueueSelected}
                    className="btn-secondary touch-target inline-flex items-center gap-1.5 px-2 py-1 text-xs"
                    disabled={selectedTracks.length === 0 || isActionDisabled}
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                    <span>Queue Selected</span>
                  </button>
                  <button
                    onClick={handleRemoveSelected}
                    className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2 py-1 text-xs font-medium text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedEntries.length === 0 || isActionDisabled}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Selected</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {removalUndo ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(244,178,102,0.22)] bg-[rgba(244,178,102,0.08)] px-3 py-2 text-sm text-[var(--color-text)]">
              <span>
                Removed {removalUndo.entries.length} track
                {removalUndo.entries.length === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => {
                  void handleUndoRemoval();
                }}
                className="inline-flex items-center gap-1 rounded-md bg-[rgba(88,198,177,0.18)] px-2 py-1 text-xs font-semibold text-[var(--color-text)] transition hover:bg-[rgba(88,198,177,0.28)]"
                disabled={isActionDisabled}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
            </div>
          ) : null}

          <p className="text-xs text-[var(--color-subtext)]">
            {visibleTracks.length} of {activeTracks.length} tracks shown
          </p>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="fade-in">
          <EmptyState
            icon={<Heart className="h-12 w-12 md:h-16 md:w-16" />}
            title="Sign in to view your library"
            description="Favorites and listening history are available after login."
            action={
              <Link href="/signin" className="btn-primary touch-target-lg">
                Sign in
              </Link>
            }
          />
        </div>
      ) : null}

      {isAuthenticated && activeTab === "favorites" && (
        <div className="fade-in">
          {favoritesLoading ? (
            <LoadingState message="Loading your favorites..." />
          ) : favorites && favorites.length > 0 ? (
            visibleEntries.length > 0 ? (
              <div className="grid gap-2 md:gap-3">
                {visibleEntries.map((fav, index) => {
                  const isSelected = selectedEntryIds.has(fav.id);

                  return (
                    <div key={fav.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {isSelectionMode ? (
                          <button
                            onClick={() => handleToggleEntrySelection(fav.id)}
                            className="touch-target inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-subtext)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-3.5 w-3.5" />
                            ) : (
                              <Square className="h-3.5 w-3.5" />
                            )}
                            <span>{isSelected ? "Selected" : "Select"}</span>
                          </button>
                        ) : (
                          <span />
                        )}

                        <button
                          onClick={() => handlePlayFromHere(index)}
                          className="touch-target rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-subtext)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          Play From Here
                        </button>
                      </div>

                      <EnhancedTrackCard
                        track={fav.track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        isFavorite={true}
                        removeFromListLabel="Remove from Favorites"
                        onRemoveFromList={() => {
                          void handleRemoveEntries([fav]);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Heart className="h-12 w-12 md:h-16 md:w-16" />}
                title="No favorites match your search"
                description="Try another search or clear the current filter."
                action={
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn-primary touch-target-lg"
                  >
                    Clear search
                  </button>
                }
              />
            )
          ) : (
            <EmptyState
              icon={<Heart className="h-12 w-12 md:h-16 md:w-16" />}
              title="No favorites yet"
              description="Tracks you favorite will appear here"
              action={
                <Link href="/" className="btn-primary touch-target-lg">
                  Search for music
                </Link>
              }
            />
          )}
        </div>
      )}

      {isAuthenticated && activeTab === "history" && (
        <div className="fade-in">
          {historyLoading ? (
            <LoadingState message="Loading your history..." />
          ) : history && history.length > 0 ? (
            visibleEntries.length > 0 ? (
              <div className="grid gap-2 md:gap-3">
                {visibleEntries.map((item, index) => {
                  const isSelected = selectedEntryIds.has(item.id);

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {isSelectionMode ? (
                          <button
                            onClick={() => handleToggleEntrySelection(item.id)}
                            className="touch-target inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-subtext)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-3.5 w-3.5" />
                            ) : (
                              <Square className="h-3.5 w-3.5" />
                            )}
                            <span>{isSelected ? "Selected" : "Select"}</span>
                          </button>
                        ) : (
                          <span />
                        )}

                        <button
                          onClick={() => handlePlayFromHere(index)}
                          className="touch-target rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-subtext)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        >
                          Play From Here
                        </button>
                      </div>

                      <EnhancedTrackCard
                        track={item.track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        removeFromListLabel="Remove from Recently Played"
                        onRemoveFromList={() => {
                          void handleRemoveEntries([item]);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="h-12 w-12 md:h-16 md:w-16" />}
                title="No history entries match your search"
                description="Try another search or clear the current filter."
                action={
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn-primary touch-target-lg"
                  >
                    Clear search
                  </button>
                }
              />
            )
          ) : (
            <EmptyState
              icon={<Clock className="h-12 w-12 md:h-16 md:w-16" />}
              title="No listening history yet"
              description="Your recently played tracks will appear here"
              action={
                <Link href="/" className="btn-primary touch-target-lg">
                  Start listening to music
                </Link>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
