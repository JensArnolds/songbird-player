// File: src/components/MobileHeader.tsx

"use client";

import MobileSearchBar from "@/components/MobileSearchBar";
import { useMenu } from "@/contexts/MenuContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import { hapticLight } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
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
      router.push(`/?q=${encodeURIComponent(trimmedQuery)}`);

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
  const isSearchComplete = urlQuery === searchQuery.trim() && searchQuery.trim().length > 0;

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
      router.push(`/?q=${encodeURIComponent(query.trim())}`);

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
      className="safe-top fixed top-0 right-0 left-0 z-50 border-b border-[rgba(244,178,102,0.12)] bg-[rgba(10,16,24,0.95)] shadow-lg backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <motion.button
          onClick={() => {
            hapticLight();
            openMenu();
          }}
          whileTap={{ scale: 0.92 }}
          transition={springPresets.snappy}
          className="flex items-center justify-center rounded-lg p-2 text-[var(--color-text)] transition-colors active:bg-[rgba(244,178,102,0.08)]"
          aria-label="Open menu"
          type="button"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
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
      </div>
    </motion.header>
  );
}
