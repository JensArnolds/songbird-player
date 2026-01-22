// File: src/app/page.tsx

import type { SearchResponse, Track } from "@/types";
import { getBaseUrl } from "@/utils/getBaseUrl";
import { type Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import HomePageClient from "./HomePageClient";

const baseUrl = getBaseUrl();

async function getFirstTrackFromSearch(
  query: string,
  baseUrl: string,
): Promise<Track | null> {
  try {
    const url = new URL("/api/music/search", baseUrl);
    url.searchParams.set("q", query);
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
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
    return "";
  }

  const coverImage =
    track.album.cover_xl ||
    track.album.cover_big ||
    track.album.cover_medium ||
    track.album.cover_small ||
    track.album.cover;

  if (coverImage && coverImage.trim().length > 0) {
    return coverImage;
  }

  return "";
}

function buildOgImageUrl(track: Track | null, baseUrl: string, query?: string | null): string {
  if (!track) {
    // If we have a query but no track, pass the query to OG route to fetch it there
    if (query) {
      const params = new URLSearchParams();
      params.set("q", query);
      return `${baseUrl}/api/og?${params.toString()}`;
    }
    return `${baseUrl}/api/og`;
  }

  const params = new URLSearchParams();
  params.set("title", track.title);
  params.set("artist", track.artist.name);
  if (track.album?.title) {
    params.set("album", track.album.title);
  }
  const coverImage = getAlbumCoverImage(track);
  if (coverImage) {
    params.set("cover", coverImage);
  }
  if (typeof track.duration === "number") {
    params.set("duration", track.duration.toString());
  }
  params.set("v", track.id.toString());

  return `${baseUrl}/api/og?${params.toString()}`;
}

async function getRequestBaseUrl(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return getBaseUrl();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q;
  const requestBaseUrl = await getRequestBaseUrl();

  const defaultOgImage = buildOgImageUrl(null, requestBaseUrl);
  const defaultMetadata: Metadata = {
    title: "Starchild Music",
    description:
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
    openGraph: {
      title: "Starchild Music",
      description:
        "Modern music streaming and discovery platform with advanced audio features and visual patterns",
      type: "website",
      url: requestBaseUrl,
      siteName: "Starchild Music",
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: "Starchild Music - Modern music streaming platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Starchild Music",
      description:
        "Modern music streaming and discovery platform with advanced audio features and visual patterns",
      images: [defaultOgImage],
    },
  };

  if (!query || query.trim().length === 0) {
    return defaultMetadata;
  }

  const firstTrack = await getFirstTrackFromSearch(query, requestBaseUrl);
  const ogImage = buildOgImageUrl(firstTrack, requestBaseUrl, query);

  const trackTitle = firstTrack
    ? `${firstTrack.title} by ${firstTrack.artist.name}`
    : `Search: ${query}`;
  const description = firstTrack
    ? `🎵 ${firstTrack.title} by ${firstTrack.artist.name}${firstTrack.album?.title ? ` • ${firstTrack.album.title}` : ""} • Stream on Starchild Music`
    : `Search results for "${query}" on Starchild Music`;

  return {
    title: trackTitle,
    description,
    openGraph: {
      title: trackTitle,
      description,
      type: "music.song",
      url: `${requestBaseUrl}/?q=${encodeURIComponent(query)}`,
      siteName: "Starchild Music",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: firstTrack
            ? `${firstTrack.title} by ${firstTrack.artist.name}`
            : "Starchild Music",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: trackTitle,
      description,
      images: [ogImage],
    },
  };
}

export default function HomePage({
  _searchParams,
}: {
  _searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}
