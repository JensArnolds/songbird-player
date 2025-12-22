// File: src/app/page.tsx

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";
import { getBaseUrl } from "@/utils/getBaseUrl";
import { type Metadata } from "next";
import { Suspense } from "react";
import HomePageClient from "./HomePageClient";

const baseUrl = getBaseUrl();

async function getFirstTrackFromSearch(query: string): Promise<Track | null> {
  try {
    // Use the API route - construct URL using baseUrl for server-side
    const baseUrl = getBaseUrl();
    const url = new URL("/api/music/search", baseUrl);
    url.searchParams.set("q", query);
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (!res.ok) return null;
    const response = (await res.json()) as SearchResponse;
    return response.data?.[0] ?? null;
  } catch (error) {
    console.error("Failed to fetch track for metadata:", error);
    return null;
  }
}

function getAlbumCoverImage(track: Track | null): string {
  if (!track?.album) {
    return `${baseUrl}/emily-the-strange.png`;
  }

  // Prefer larger images for Open Graph (cover_big or cover_xl)
  const coverImage =
    track.album.cover_big ||
    track.album.cover_xl ||
    track.album.cover_medium ||
    track.album.cover_small ||
    track.album.cover;

  if (coverImage && coverImage.trim().length > 0) {
    return coverImage;
  }

  return `${baseUrl}/emily-the-strange.png`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q;

  // Default metadata
  const defaultMetadata: Metadata = {
    title: "darkfloor.art",
    description:
      "Modern music streaming and discovery platform with smart recommendations",
    openGraph: {
      title: "darkfloor.art",
      description:
        "Modern music streaming and discovery platform with smart recommendations",
      type: "website",
      url: baseUrl,
      siteName: "darkfloor.art",
      images: [
        {
          url: `${baseUrl}/emily-the-strange.png`,
          width: 1200,
          height: 630,
          alt: "darkfloor.art - Modern music streaming platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "darkfloor.art",
      description:
        "Modern music streaming and discovery platform with smart recommendations",
    },
  };

  // If no query, return default metadata
  if (!query || query.trim().length === 0) {
    return defaultMetadata;
  }

  // Fetch first track from search
  const firstTrack = await getFirstTrackFromSearch(query);
  const coverImage = getAlbumCoverImage(firstTrack);

  // Build dynamic metadata
  const trackTitle = firstTrack
    ? `${firstTrack.title} by ${firstTrack.artist.name}`
    : `Search: ${query}`;
  const description = firstTrack
    ? `Listen to ${firstTrack.title} by ${firstTrack.artist.name} on darkfloor.art`
    : `Search results for "${query}" on darkfloor.art`;

  return {
    title: trackTitle,
    description,
    openGraph: {
      title: trackTitle,
      description,
      type: "website",
      url: `${baseUrl}/?q=${encodeURIComponent(query)}`,
      siteName: "darkfloor.art",
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: firstTrack
            ? `${firstTrack.title} by ${firstTrack.artist.name}`
            : "darkfloor.art",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: trackTitle,
      description,
    },
  };
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}
