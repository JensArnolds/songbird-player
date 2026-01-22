import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const trackId = searchParams.get("trackId");
  const query = searchParams.get("q");

  if (trackId) {
    try {
      console.log("[OG Route] Fetching track by ID:", trackId);
      const trackUrl = new URL(`/api/track/${trackId}`, origin);
      const trackResponse = await fetch(trackUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (trackResponse.ok) {
        const track = (await trackResponse.json()) as {
          title?: string;
          artist?: { name?: string } | string;
          album?: { title?: string } | null;
        };

        const title = track.title || "";
        const artistName = typeof track.artist === "string"
          ? track.artist
          : track.artist?.name || "";
        const albumTitle = track.album && typeof track.album === "object"
          ? track.album.title || ""
          : "";

        if (title && artistName) {
          const params = new URLSearchParams();
          params.set("title", title);
          params.set("artist", artistName);
          if (albumTitle) {
            params.set("album", albumTitle);
          }

          const darkfloorUrl = `https://darkfloor.one/api/preview?${params.toString()}`;
          console.log("[OG Route] Redirecting to darkfloor preview:", darkfloorUrl);
          return Response.redirect(darkfloorUrl, 302);
        }
      }
    } catch (error) {
      console.error("[OG Route] Error fetching track:", error);
    }
  } else if (query) {
    try {
      console.log("[OG Route] Searching tracks by query:", query);
      const searchUrl = new URL("/api/music/search", origin);
      searchUrl.searchParams.set("q", query);
      const searchResponse = await fetch(searchUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as {
          data?: Array<{
            title?: string;
            artist?: { name?: string } | string;
            album?: { title?: string } | null;
          }>;
        };

        const firstTrack = searchData.data?.[0];
        if (firstTrack) {
          const title = firstTrack.title || "";
          const artistName = typeof firstTrack.artist === "string"
            ? firstTrack.artist
            : firstTrack.artist?.name || "";
          const albumTitle = firstTrack.album && typeof firstTrack.album === "object"
            ? firstTrack.album.title || ""
            : "";

          if (title && artistName) {
            const params = new URLSearchParams();
            params.set("title", title);
            params.set("artist", artistName);
            if (albumTitle) {
              params.set("album", albumTitle);
            }

            const darkfloorUrl = `https://darkfloor.one/api/preview?${params.toString()}`;
            console.log("[OG Route] Redirecting to darkfloor preview:", darkfloorUrl);
            return Response.redirect(darkfloorUrl, 302);
          }
        }
      }
    } catch (error) {
      console.error("[OG Route] Error searching tracks:", error);
    }
  }

  console.log("[OG Route] No track data found, using default image");
  return Response.redirect("https://darkfloor.one/api/preview/default", 302);
}
