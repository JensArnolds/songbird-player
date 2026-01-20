
"use client";

import ChangelogModal from "@/components/ChangelogModal";
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
import {
    BookOpen,
    Music2,
    Search,
    Shuffle,
    Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function HomePageClient() {
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
            console.log("[HomePageClient] Auto-playing first search result:", firstTrack.title);
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
      <main className="container mx-auto w-full flex-1 py-6 md:py-8">
        {}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.1 }}
            className="card mb-6 w-full p-4 shadow-xl md:mb-8 md:p-7"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 md:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl border border-[rgba(244,178,102,0.15)] bg-[rgba(18,26,38,0.9)] px-4 py-3 transition-all focus-within:border-[rgba(244,178,102,0.4)] focus-within:shadow-[0_0_0_4px_rgba(244,178,102,0.1)]">
                  <Search className="h-5 w-5 flex-shrink-0 text-[var(--color-muted)]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-base text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
                    placeholder="Search for songs, artists, or albums..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  />
                </div>
                <button
                  className="btn-primary touch-target-lg flex items-center justify-center gap-2 px-8"
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
                <div className="flex flex-wrap items-center gap-1.5">
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

        {}
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
                <div className="mb-4 flex items-center justify-between md:mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)] md:text-2xl">
                      Search Results
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--color-subtext)] md:mt-1 md:text-sm">
                      {results.length.toLocaleString()}
                      {total > results.length
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
                  className="grid gap-2 md:gap-3"
                >
                  {results.map((track, index) => (
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
                    className="mt-6 flex justify-center md:mt-8"
                  >
                    <button
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-12"
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner spinner-sm" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        `Load More (${(total - results.length).toLocaleString()} remaining)`
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
                className="card flex flex-col items-center justify-center py-16 text-center md:py-20"
              >
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
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(244,178,102,0.15)] to-[rgba(88,198,177,0.15)] ring-2 ring-[var(--color-accent)]/20 md:h-24 md:w-24"
                >
                  <Music2 className="h-10 w-10 text-[var(--color-accent)] md:h-12 md:w-12" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-text)] md:text-xl">
                  {isMobile
                    ? "Start Your Musical Journey"
                    : "Explore our library. Best enjoyed on a desktop device or horizontally on mobile."}
                </h3>
                <p className="max-w-md px-4 text-sm text-[var(--color-subtext)] md:text-base">
                  {isMobile
                    ? "Tap to start playing music instantly, or search for something specific."
                    : "Search for songs, artists, albums - anything you want to listen to."}
                </p>
                <p className="mt-3 max-w-md px-4 text-xs text-[var(--color-muted)] md:text-sm">
                  We run two synced frontends (darkfloor + Starchild). Both connect to the
                  same Neon database, so your library, playlists, and history stay in sync
                  no matter which site you use.
                </p>

                {}
                {isMobile && (
                  <motion.button
                    onClick={handleShufflePlay}
                    disabled={loading}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-8 py-4 text-lg font-bold text-white shadow-[var(--color-accent)]/25 shadow-lg transition-all hover:shadow-[var(--color-accent)]/40 hover:shadow-xl disabled:opacity-50"
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

                {}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
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
                      className="flex items-center gap-2 rounded-full bg-[rgba(244,178,102,0.1)] px-4 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.2)]"
                    >
                      <Sparkles className="h-3 w-3" />
                      {suggestion}
                    </motion.button>
                  ))}
                </div>

                {}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <motion.a
                    href="https://gitlab.com/soulwax/songbird-player"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(255,255,255,0.05)] px-5 py-3 text-sm font-medium text-[var(--color-text)] ring-1 ring-white/10 transition-all hover:bg-[rgba(255,255,255,0.1)] hover:ring-[var(--color-accent)]/30"
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 380 380" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path 
                        d="M265.26416,174.37243l-.2134-.55822-21.19899-55.30908c-.4236-1.08359-1.18542-1.99642-2.17699-2.62689-.98837-.63373-2.14749-.93253-3.32305-.87014-1.1689.06239-2.29195.48925-3.20809,1.21821-.90957.73554-1.56629,1.73047-1.87493,2.85346l-14.31327,43.80662h-57.90965l-14.31327-43.80662c-.30864-1.12299-.96536-2.11791-1.87493-2.85346-.91614-.72895-2.03911-1.15582-3.20809-1.21821-1.17548-.06239-2.33468.23641-3.32297.87014-.99166.63047-1.75348,1.5433-2.17707,2.62689l-21.19891,55.31237-.21348.55493c-6.28158,16.38521-.92929,34.90803,13.05891,45.48782.02621.01641.04922.03611.07552.05582l.18719.14119,32.29094,24.17392,15.97151,12.09024,9.71951,7.34871c2.34117,1.77316,5.57877,1.77316,7.92002,0l9.71943-7.34871,15.96822-12.09024,32.48142-24.31511c.02958-.02299.05588-.04269.08538-.06568,13.97834-10.57977,19.32735-29.09604,13.04905-45.47796Z" 
                        fill="#e24329"
                      />
                      <path 
                        d="M265.26416,174.37243l-.2134-.55822c-10.5174,2.16062-20.20405,6.6099-28.49844,12.81593-.1346.0985-25.20497,19.05805-46.55171,35.19699,15.84998,11.98517,29.6477,22.40405,29.6477,22.40405l32.48142-24.31511c.02958-.02299.05588-.04269.08538-.06568,13.97834-10.57977,19.32735-29.09604,13.04905-45.47796Z" 
                        fill="#fc6d26"
                      />
                      <path 
                        d="M160.34962,244.23117l15.97151,12.09024,9.71951,7.34871c2.34117,1.77316,5.57877,1.77316,7.92002,0l9.71943-7.34871,15.96822-12.09024s-13.79772-10.41888-29.6477-22.40405c-15.85327,11.98517-29.65099,22.40405-29.65099,22.40405Z" 
                        fill="#fca326"
                      />
                      <path 
                        d="M143.44561,186.63014c-8.29111-6.20274-17.97446-10.65531-28.49507-12.81264l-.21348.55493c-6.28158,16.38521-.92929,34.90803,13.05891,45.48782.02621.01641.04922.03611.07552.05582l.18719.14119,32.29094,24.17392s13.79772-10.41888,29.65099-22.40405c-21.34673-16.13894-46.42031-35.09848-46.55499-35.19699Z" 
                        fill="#fc6d26"
                      />
                    </svg>
                    <span>View on GitLab</span>
                  </motion.a>

                  <motion.button
                    onClick={() => {
                      hapticLight();
                      setIsChangelogOpen(true);
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-[rgba(244,178,102,0.1)] px-5 py-3 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20 transition-all hover:bg-[rgba(244,178,102,0.2)] hover:ring-[var(--color-accent)]/40"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Changelog</span>
                  </motion.button>
                </div>

                {}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springPresets.gentle, delay: 0.3 }}
                  className="mt-12 w-full max-w-2xl border-t border-white/5 pt-8"
                >
                  <h4 className="mb-4 text-center text-sm font-semibold text-[var(--color-text)]">
                    Infrastructure & Architecture
                  </h4>
                  <div className="space-y-3 text-xs text-[var(--color-subtext)] md:text-sm">
                    <p className="leading-relaxed">
                      Starchild Music runs on a <span className="text-[var(--color-accent)]">dual-deployment architecture</span>:
                      a custom VM server (<span className="font-mono text-[var(--color-text)]">starchildmusic.com</span>)
                      for backend services and database access, alongside a Vercel edge deployment
                      (<span className="font-mono text-[var(--color-text)]">darkfloor.art</span>) for global CDN distribution
                      and optimized performance.
                    </p>
                    <p className="leading-relaxed">
                      Use the <span className="text-[var(--color-accent)]">deployment icon</span> in the header
                      (desktop only) to switch between environments. The VM provides full backend control and direct
                      database access, while Vercel offers edge-optimized static delivery and serverless functions
                      with automatic scaling.
                    </p>
                    <p className="leading-relaxed">
                      Music data is sourced from our <span className="text-[var(--color-accent)]">custom API</span> at
                      <span className="font-mono text-[var(--color-text)]"> api.starchildmusic.com</span>. 
                      User data, preferences, and playlists are stored in a
                      <span className="text-[var(--color-accent)]"> Neon serverless PostgreSQL</span> database,
                      shared across both deployments for seamless sync.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
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
