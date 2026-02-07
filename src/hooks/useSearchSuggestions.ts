"use client";

import type { SearchSuggestionItem } from "@/types/searchSuggestions";
import { searchTracks } from "@/utils/api";
import { useEffect, useMemo, useState } from "react";

interface UseSearchSuggestionsOptions {
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
}

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 10;
const DEFAULT_DEBOUNCE_MS = 220;

const dedupeSuggestions = (
  suggestions: SearchSuggestionItem[],
  limit: number,
): SearchSuggestionItem[] => {
  const seen = new Set<string>();
  const output: SearchSuggestionItem[] = [];

  for (const suggestion of suggestions) {
    const key = `${suggestion.type}:${suggestion.query.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(suggestion);
    if (output.length >= limit) break;
  }

  return output;
};

export function useSearchSuggestions(
  query: string,
  recentSearches: string[],
  options: UseSearchSuggestionsOptions = {},
) {
  const enabled = options.enabled ?? true;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedQuery = query.trim();

  const querySuggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    const lowered = normalizedQuery.toLowerCase();

    return recentSearches
      .filter((entry) => entry.toLowerCase().includes(lowered))
      .slice(0, 4)
      .map((entry, index) => ({
        id: `query-${index}-${entry}`,
        type: "query" as const,
        label: entry,
        query: entry,
      }));
  }, [normalizedQuery, recentSearches]);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions(querySuggestions.slice(0, limit));
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        try {
          const response = await searchTracks(normalizedQuery, 0);
          if (cancelled) return;

          const tracks = response.data.slice(0, 10);

          const trackSuggestions: SearchSuggestionItem[] = tracks
            .slice(0, 4)
            .map((track) => ({
              id: `track-${track.id}`,
              type: "track",
              label: track.title,
              sublabel: track.artist.name,
              query: `${track.artist.name} ${track.title}`,
              artwork: track.album?.cover_small ?? track.album?.cover_medium,
            }));

          const artistMap = new Map<string, SearchSuggestionItem>();
          for (const track of tracks) {
            const artist = track.artist?.name?.trim();
            if (!artist) continue;
            if (artistMap.has(artist.toLowerCase())) continue;
            artistMap.set(artist.toLowerCase(), {
              id: `artist-${track.artist.id}-${artist}`,
              type: "artist",
              label: artist,
              sublabel: "Artist",
              query: artist,
              artwork:
                track.artist.picture_small ??
                track.artist.picture_medium ??
                track.album?.cover_small,
            });
            if (artistMap.size >= 3) break;
          }

          const albumMap = new Map<string, SearchSuggestionItem>();
          for (const track of tracks) {
            const albumTitle = track.album?.title?.trim();
            if (!albumTitle) continue;
            const key = `${track.album.id}-${albumTitle}`.toLowerCase();
            if (albumMap.has(key)) continue;
            albumMap.set(key, {
              id: `album-${track.album.id}-${albumTitle}`,
              type: "album",
              label: albumTitle,
              sublabel: track.artist.name,
              query: `${track.artist.name} ${albumTitle}`,
              artwork: track.album.cover_small ?? track.album.cover_medium,
            });
            if (albumMap.size >= 3) break;
          }

          const combined = dedupeSuggestions(
            [
              ...querySuggestions,
              ...Array.from(artistMap.values()),
              ...Array.from(albumMap.values()),
              ...trackSuggestions,
            ],
            limit,
          );

          setSuggestions(combined);
        } catch (error) {
          console.error(
            "[useSearchSuggestions] Failed to load suggestions:",
            error,
          );
          if (!cancelled) {
            setSuggestions(querySuggestions.slice(0, limit));
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    debounceMs,
    enabled,
    limit,
    normalizedQuery,
    querySuggestions,
    recentSearches,
  ]);

  return {
    suggestions,
    isLoading,
  };
}
