// File: src/app/HomePageClient.tsx

"use client";

import { PullToRefreshWrapper } from "@/components/PullToRefreshWrapper";
import SwipeableTrackCard from "@/components/SwipeableTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import {
  getAlbumTracks,
  getTrackById,
  searchTracks,
  searchTracksByArtist,
} from "@/utils/api";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import {
  springPresets,
  staggerContainer,
  staggerItem,
} from "@/utils/spring-animations";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Music2, Search, Shuffle, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ChangelogModal = dynamic(() => import("@/components/ChangelogModal"), {
  ssr: false,
});

type HomePageClientProps = {
  apiHostname?: string;
};

export default function HomePageClient({ apiHostname }: HomePageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isArtistSearch, setIsArtistSearch] = useState(false);
  const [apiOffset, setApiOffset] = useState(0);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const lastUrlQueryRef = useRef<string | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const shouldAutoPlayRef = useRef(false);

  const player = useGlobalPlayer();
  const visibleResults = results.filter(
    (track) => !player.failedTrackIds.has(track.id),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isMobile || !session) return;

    const urlQuery = searchParams.get("q");
    const albumId = searchParams.get("album");
    const trackId = searchParams.get("track");

    if (!urlQuery && !albumId && !trackId && session.user?.userHash) {
      router.replace(`/${session.user.userHash}`);
    }
  }, [mounted, isMobile, session, searchParams, router]);

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 50 },
    { enabled: !!session },
  );

  const performSearch = useCallback(
    async (searchQuery: string, force = false) => {
      if (!searchQuery.trim()) return;

      if (!force && currentQuery === searchQuery) {
        return;
      }

      setLoading(true);
      setCurrentQuery(searchQuery);
      setIsArtistSearch(false);
      setApiOffset(0);

      try {
        const response = await searchTracks(searchQuery, 0);
        setResults(response.data);
        setTotal(response.total);

        if (session) {
          addSearchQuery.mutate({ query: searchQuery });
        }

        if (shouldAutoPlayRef.current && response.data.length > 0) {
          const firstTrack = response.data[0];
          if (firstTrack) {
            console.log(
              "[HomePageClient] Auto-playing first search result:",
              firstTrack.title,
            );
            hapticSuccess();
            player.playTrack(firstTrack);
            shouldAutoPlayRef.current = false;
          }
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setTotal(0);
        setApiOffset(0);
        shouldAutoPlayRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery, currentQuery, player],
  );

  const handleAlbumClick = useCallback(
    async (albumId: number) => {
      setLoading(true);
      setIsArtistSearch(false);
      setApiOffset(0);

      setResults([]);
      setTotal(0);

      try {
        const response = await getAlbumTracks(albumId);
        setResults(response.data);
        setTotal(response.total);

        const params = new URLSearchParams();
        params.set("album", albumId.toString());
        router.push(`?${params.toString()}`, { scroll: false });

        let albumName: string | undefined;
        if (response.data.length > 0) {
          const firstTrack = response.data[0];
          if (firstTrack && "album" in firstTrack && firstTrack.album) {
            albumName = firstTrack.album.title;
          }
        }

        if (!albumName) {
          try {
            const albumResponse = await fetch(`/api/album/${albumId}`);
            if (albumResponse.ok) {
              const albumData = (await albumResponse.json()) as {
                title?: string;
              };
              albumName = albumData.title;
            }
          } catch (err) {
            console.warn("Failed to fetch album info:", err);
          }
        }

        if (albumName) {
          setQuery(albumName);
          setCurrentQuery(albumName);
          if (session) {
            addSearchQuery.mutate({ query: albumName });
          }
        }
      } catch (error) {
        console.error("Album search failed:", error);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery, router],
  );

  const handleSharedTrack = useCallback(
    async (trackId: number) => {
      try {
        console.log("[Shared Track] Loading track:", trackId);
        const track = await getTrackById(trackId);

        console.log("[Shared Track] Track loaded:", track.title);
        hapticSuccess();

        player.clearQueue();
        player.playTrack(track);

        setResults([track]);
        setTotal(1);
        setCurrentQuery(`Shared: ${track.title}`);
        setQuery(`${track.artist.name} - ${track.title}`);
      } catch (error) {
        console.error("[Shared Track] Failed to load shared track:", error);
        hapticLight();
      }
    },
    [player],
  );

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const albumId = searchParams.get("album");
    const trackId = searchParams.get("track");

    if (trackId) {
      const trackIdNum = parseInt(trackId, 10);
      if (!isNaN(trackIdNum) && trackId !== lastTrackIdRef.current) {
        lastTrackIdRef.current = trackId;
        setIsInitialized(true);
        lastUrlQueryRef.current = null;
        void handleSharedTrack(trackIdNum);
      }
    } else if (albumId) {
      const albumIdNum = parseInt(albumId, 10);
      if (!isNaN(albumIdNum)) {
        setIsInitialized(true);
        lastUrlQueryRef.current = null;
        lastTrackIdRef.current = null;
        void handleAlbumClick(albumIdNum);
      }
    } else if (urlQuery) {
      if (urlQuery !== lastUrlQueryRef.current) {
        lastUrlQueryRef.current = urlQuery;
        lastTrackIdRef.current = null;
        setQuery(urlQuery);
        setIsInitialized(true);
        shouldAutoPlayRef.current = true;
        void performSearch(urlQuery, true);
      }
    } else {
      if (!isInitialized) {
        setIsInitialized(true);
      }
      if (lastUrlQueryRef.current !== null || lastTrackIdRef.current !== null) {
        lastUrlQueryRef.current = null;
        lastTrackIdRef.current = null;
        setResults([]);
        setTotal(0);
        setCurrentQuery("");
        if (!loading) {
          setQuery("");
        }
      }
    }
  }, [searchParams]);

  const updateURL = (searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    updateURL(q);
  };

  const handleLoadMore = async () => {
    if (!currentQuery.trim() || loadingMore) return;

    setLoadingMore(true);

    try {
      if (isArtistSearch) {
        const currentApiOffset = apiOffset;
        const response = await searchTracksByArtist(
          currentQuery,
          currentApiOffset,
        );

        const API_PAGE_SIZE = 25;
        const newApiOffset = currentApiOffset + API_PAGE_SIZE;

        setResults((prev) => {
          const newResults = [...prev, ...response.data];

          if (!response.next) {
            setTotal(newResults.length);
          } else {
            setTotal(response.total);
          }

          return newResults;
        });

        setApiOffset(newApiOffset);
      } else {
        const nextOffset = results.length;
        if (nextOffset >= total) {
          setLoadingMore(false);
          return;
        }

        const response = await searchTracks(currentQuery, nextOffset);
        setResults((prev) => [...prev, ...response.data]);

        if (response.total !== total) {
          setTotal(response.total);
        }
      }
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (currentQuery) {
      await performSearch(currentQuery);
    }
  };

  const handleArtistClick = useCallback(
    async (artistName: string) => {
      setLoading(true);
      setQuery(artistName);
      setCurrentQuery(artistName);
      setIsArtistSearch(true);
      setApiOffset(0);

      setResults([]);
      setTotal(0);

      try {
        const response = await searchTracksByArtist(artistName, 0);
        setResults(response.data);
        setTotal(response.total);

        const API_PAGE_SIZE = 25;
        setApiOffset(API_PAGE_SIZE);

        const params = new URLSearchParams();
        params.set("q", artistName);
        router.push(`?${params.toString()}`, { scroll: false });

        if (session) {
          addSearchQuery.mutate({ query: artistName });
        }
      } catch (error) {
        console.error("Artist search failed:", error);
        setResults([]);
        setTotal(0);
        setApiOffset(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery, router],
  );

  const hasMore = results.length < total;

  const handleShufflePlay = useCallback(async () => {
    hapticSuccess();
    setLoading(true);

    setResults([]);
    setTotal(0);

    try {
      const popularQueries = ["pop", "rock", "electronic", "jazz", "indie"];
      const randomQuery =
        popularQueries[Math.floor(Math.random() * popularQueries.length)];

      const response = await searchTracks(randomQuery!, 0);

      if (response.data.length > 0) {
        const shuffled = [...response.data].sort(() => Math.random() - 0.5);

        player.playTrack(shuffled[0]!);

        if (shuffled.length > 1) {
          player.addToQueue(shuffled.slice(1, 11), false);
        }

        setResults(response.data);
        setTotal(response.total);
        setCurrentQuery(randomQuery ?? "");
      }
    } catch (error) {
      console.error("Shuffle play failed:", error);
    } finally {
      setLoading(false);
    }
  }, [player]);

  if (!mounted) {
    return null;
  }

  const searchContent = (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto w-full flex-1 py-6 md:py-5">
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.1 }}
            className="card mb-4 w-full p-4 shadow-xl md:mb-5 md:p-5"
          >
            <div className="flex flex-col gap-3 md:gap-2.5">
              <div className="flex items-center gap-3 md:flex-row md:gap-2.5">
                <div className="theme-panel flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 transition-all focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_var(--color-accent)]/20 md:px-3 md:py-2.5 md:gap-2">
                  <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-muted)] md:h-4 md:w-4" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none md:text-sm"
                    placeholder="Search for songs, artists, or albums..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  />
                </div>
                <button
                  className="btn-primary touch-target-lg flex items-center justify-center gap-2 px-8 md:px-5 md:text-sm text-[var(--color-on-accent)]"
                  onClick={() => void handleSearch()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner spinner-sm" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {session && recentSearches && recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 md:gap-1">
                  <span className="text-xs font-medium text-[var(--color-subtext)]">
                    Recent:
                  </span>
                  {recentSearches.map((search: string) => (
                    <button
                      key={search}
                      onClick={() => {
                        hapticLight();
                        void handleSearch(search);
                      }}
                      className="touch-active rounded-full bg-[var(--color-surface-2)] px-2 py-1 text-xs text-[var(--color-text)] ring-1 ring-white/5 transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent-light)] hover:ring-[var(--color-accent)]/30"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="w-full">
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 flex items-center justify-between md:mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)] md:text-xl">
                      Search Results
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--color-subtext)] md:mt-0.5 md:text-xs">
                      {visibleResults.length.toLocaleString()}
                      {total > visibleResults.length
                        ? ` of ${total.toLocaleString()}`
                        : ""}{" "}
                      tracks found
                    </p>
                  </div>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid gap-2 md:gap-1.5"
                >
                  {visibleResults.map((track, index) => (
                    <motion.div key={track.id} variants={staggerItem}>
                      <SwipeableTrackCard
                        track={track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        showActions={!!session}
                        index={index}
                        onArtistClick={handleArtistClick}
                        onAlbumClick={handleAlbumClick}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex justify-center md:mt-5"
                  >
                    <button
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-8 md:text-sm"
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner spinner-sm" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        `Load More (${(total - visibleResults.length).toLocaleString()} remaining)`
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springPresets.gentle}
                className="card flex flex-col items-center justify-center py-16 text-center md:py-12"
              >
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)] md:mb-3">
                  Fully migrated to Vercel
                </p>
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.15)] to-[rgba(88,198,177,0.15)] ring-2 ring-[var(--color-accent)]/20 md:mb-3 md:h-16 md:w-16"
                >
                  <Music2 className="h-10 w-10 text-[var(--color-accent)] md:h-8 md:w-8" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-text)] md:mb-1.5 md:text-base">
                  {isMobile
                    ? "Tap to start playing music instantly, or search for something specific."
                    : "Search for songs, artists, albums - anything you want to listen to."}
                </h3>

                {!session && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springPresets.gentle, delay: 0.2 }}
                    className="mt-4 max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 md:mt-3 md:px-4 md:py-3"
                  >
                    <p className="mb-2 text-sm font-semibold text-[var(--color-text)] md:mb-1.5 md:text-xs">
                      Sign in is optional, but it unlocks a few features you may
                      like:
                    </p>
                    <ul className="space-y-1.5 text-xs text-[var(--color-subtext)] md:space-y-1">
                      <li className="flex items-start">
                        <span>
                          Your privacy stays fully protected; optional sign-in
                          unlocks custom playlists, a public profile, and your
                          personal music identity—with more features on the way
                        </span>
                      </li>
                    </ul>
                  </motion.div>
                )}

                {isMobile && (
                  <motion.button
                    onClick={handleShufflePlay}
                    disabled={loading}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-8 py-4 text-lg font-bold text-[var(--color-on-accent)] shadow-[var(--color-accent)]/25 shadow-lg transition-all hover:shadow-[var(--color-accent)]/40 hover:shadow-xl disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="spinner spinner-sm border-white" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-6 w-6" />
                        <span>Shuffle & Play</span>
                      </>
                    )}
                  </motion.button>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-2 md:mt-4 md:gap-1.5">
                  {[
                    "Lamb",
                    "Depeche Mode",
                    "The Knife",
                    "Goldfrapp",
                    "GusGus",
                    "Soulwax",
                    "Massive Attack",
                  ].map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      onClick={() => {
                        hapticLight();
                        setQuery(suggestion);
                        void handleSearch(suggestion);
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-[rgba(244,178,102,0.1)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.2)] md:px-3 md:py-1.5 md:text-xs"
                    >
                      <Sparkles className="h-3 w-3 md:h-2.5 md:w-2.5" />
                      {suggestion}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-5 md:gap-2">
                  <motion.a
                    href="https://github.com/soulwax/songbird-player"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.95 }}
                    className="btn-github flex items-center gap-2 rounded-xl bg-[rgba(255,255,255,0.05)] px-5 py-3 text-sm font-medium text-[var(--color-text)] ring-1 ring-white/10 transition-all hover:bg-[rgba(255,255,255,0.1)] hover:ring-[var(--color-accent)]/30 md:px-3 md:py-2 md:text-xs"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 flex-shrink-0 md:h-4 md:w-4"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>View on GitHub</span>
                  </motion.a>

                  <motion.button
                    onClick={() => {
                      hapticLight();
                      setIsChangelogOpen(true);
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(244,178,102,0.1)] px-5 py-3 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20 transition-all hover:bg-[rgba(244,178,102,0.2)] hover:ring-[var(--color-accent)]/40 md:px-3 md:py-2 md:text-xs"
                  >
                    <BookOpen className="h-4 w-4 md:h-3.5 md:w-3.5" />
                    <span>Changelog</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      hapticLight();
                      router.push("/playlists/12");
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="ml-6 flex items-center gap-2 rounded-xl bg-[rgba(88,198,177,0.15)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] ring-1 ring-[var(--color-secondary-accent)]/20 transition-all hover:bg-[rgba(88,198,177,0.25)] hover:ring-[var(--color-secondary-accent)]/40 md:ml-4 md:px-3 md:py-2 md:text-xs"
                  >
                    <Music2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                    <span>Example Playlist</span>
                  </motion.button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {isChangelogOpen && (
        <ChangelogModal
          isOpen={isChangelogOpen}
          onClose={() => setIsChangelogOpen(false)}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefreshWrapper onRefresh={handleRefresh} enabled={!!currentQuery}>
        {searchContent}
      </PullToRefreshWrapper>
    );
  }

  return searchContent;
}
