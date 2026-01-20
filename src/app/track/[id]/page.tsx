// File: src/app/track/[id]/page.tsx

import { env } from "@/env";
import { getBaseUrl } from "@/utils/getBaseUrl";
import type { Metadata } from "next";
import { TrackRedirect } from "./TrackRedirect";

interface Track {
  id: number;
  title: string;
  duration: number;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_small?: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
  };
}

async function getTrack(id: string): Promise<Track | null> {
  try {
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    const streamingKey = env.STREAMING_KEY;

    if (apiUrl && streamingKey) {
      const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const url = new URL(`music/track/${id}`, normalizedApiUrl);
      url.searchParams.set("key", streamingKey);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });

      if (response.ok) {
        return (await response.json()) as Track;
      }
    } else {
      if (!apiUrl) {
        console.error("[Track Page] NEXT_PUBLIC_API_URL not configured");
      }
      if (!streamingKey) {
        console.error("[Track Page] STREAMING_KEY not configured");
      }
    }

    const deezerUrl = new URL(`https://api.deezer.com/track/${id}`);
    const deezerResponse = await fetch(deezerUrl.toString(), {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (deezerResponse.ok) {
      return (await deezerResponse.json()) as Track;
    }

    return null;
  } catch (error) {
    console.error("[Track Page] Error fetching track:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);
  const baseUrl = getBaseUrl();

  if (!track) {
    return {
      title: "Track Not Found - Starchild Music",
      description: "The requested track could not be found.",
    };
  }

  const coverImage =
    track.album.cover_medium ||
    track.album.cover_small ||
    track.album.cover_big ||
    track.album.cover_xl;

  const description = `Listen to "${track.title}" by ${track.artist.name}${track.album.title ? ` from ${track.album.title}` : ""} on Starchild Music`;

  const ogImageUrl = new URL(`${baseUrl}/api/og`);
  ogImageUrl.searchParams.set("title", track.title);
  ogImageUrl.searchParams.set("artist", track.artist.name);
  if (track.album.title) {
    ogImageUrl.searchParams.set("album", track.album.title);
  }
  if (coverImage) {
    ogImageUrl.searchParams.set("cover", coverImage);
  }
  ogImageUrl.searchParams.set("duration", track.duration.toString());
  ogImageUrl.searchParams.set("v", id);

  return {
    title: `${track.title} - ${track.artist.name} | Starchild Music`,
    description,
    openGraph: {
      title: track.title,
      description: `${track.artist.name}${track.album.title ? ` • ${track.album.title}` : ""}`,
      type: "music.song",
      url: `${baseUrl}/track/${id}`,
      siteName: "Starchild Music",
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${track.title} - ${track.artist.name}`,
        },
      ],
      ...(track.artist.name && {
        musicians: [track.artist.name],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.title} - ${track.artist.name}`,
      description: track.album.title || "Listen on Starchild Music",
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrackRedirect id={id} />;
}
