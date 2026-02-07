// File: src/components/MobileHeader.tsx

"use client";

import MobileSearchBar from "@/components/MobileSearchBar";
import { useMenu } from "@/contexts/MenuContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import { hapticLight } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion } from "framer-motion";
import { Library, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MobileHeader() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { openMenu } = useMenu();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSeenNonEmptyQueryRef = useRef(false);
  const previousSearchQueryRef = useRef("");

  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 50 },
    { enabled: !!session },
  );

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(urlQuery);
      hasSeenNonEmptyQueryRef.current = true;
    } else {
      setSearchQuery("");
    }

    if (searchingTimeoutRef.current) {
      clearTimeout(searchingTimeoutRef.current);
      searchingTimeoutRef.current = null;
    }

    setIsSearching(false);
    setCountdown(0);
  }, [searchParams]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const previousQuery = previousSearchQueryRef.current;
    if (!searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(0);
      const currentUrlQuery = searchParams.get("q");
      if (currentUrlQuery && previousQuery.trim()) {
        router.push("/");
      }
      previousSearchQueryRef.current = searchQuery;
      return;
    }

    const currentUrlQuery = searchParams.get("q");
    const trimmedQuery = searchQuery.trim();
    if (currentUrlQuery === trimmedQuery) {
      setCountdown(0);
      hasSeenNonEmptyQueryRef.current = true;
      previousSearchQueryRef.current = searchQuery;
      return;
    }

    hasSeenNonEmptyQueryRef.current = true;
    previousSearchQueryRef.current = searchQuery;

    setCountdown(2000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = Math.max(0, prev - 100);
        if (newValue === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
        }
        return newValue;
      });
    }, 100);

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      setCountdown(0);
      const params = new URLSearchParams();
      params.set("q", trimmedQuery);
      router.push(`/?${params.toString()}`);

      searchingTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 3000);
    }, 2000);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (searchingTimeoutRef.current) {
        clearTimeout(searchingTimeoutRef.current);
      }
    };
  }, [searchQuery, router, searchParams]);

  if (!isMobile) return null;

  const urlQuery = searchParams.get("q") ?? "";
  const isSearchComplete =
    urlQuery === searchQuery.trim() && searchQuery.trim().length > 0;

  const handleSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (searchingTimeoutRef.current) {
      clearTimeout(searchingTimeoutRef.current);
    }
    setCountdown(0);

    if (query.trim()) {
      setIsSearching(true);
      const params = new URLSearchParams();
      params.set("q", query.trim());
      router.push(`/?${params.toString()}`);

      searchingTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 3000);
    } else {
      router.push("/");
    }
  };

  const handleClear = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (searchingTimeoutRef.current) {
      clearTimeout(searchingTimeoutRef.current);
    }
    setCountdown(0);
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springPresets.gentle}
      className="theme-chrome-header safe-top fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[rgba(8,8,8,0.96)] shadow-lg backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <motion.button
          onClick={() => {
            hapticLight();
            openMenu();
          }}
          whileTap={{ scale: 0.92 }}
          transition={springPresets.snappy}
          className="flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-[var(--color-text)] transition-colors active:bg-[var(--color-surface-hover)]"
          aria-label="Open menu"
          type="button"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </motion.button>
        <div className="flex-1">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={handleClear}
            placeholder="Search music..."
            isLoading={isSearching}
            recentSearches={recentSearches ?? []}
            onRecentSearchClick={(search) => {
              setSearchQuery(search);
              handleSearch(search);
            }}
            showAutoSearchIndicator={!isSearchComplete}
            autoSearchCountdown={countdown}
          />
        </div>
        <motion.button
          onClick={() => {
            hapticLight();
            router.push(session ? "/library" : "/api/auth/signin", {
              scroll: false,
            });
          }}
          whileTap={{ scale: 0.94 }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[var(--color-text)]"
          type="button"
          aria-label="Open library"
        >
          <Library className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.header>
  );
}
