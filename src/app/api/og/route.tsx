import type { NextRequest } from "next/server";
import { env } from "@/env";

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

          const songbirdApiUrl = env.SONGBIRD_PUBLIC_API_URL || env.NEXT_PUBLIC_SONGBIRD_API_URL;
          if (songbirdApiUrl) {
            const normalizedSongbirdUrl = songbirdApiUrl.endsWith("/") ? songbirdApiUrl.slice(0, -1) : songbirdApiUrl;
            const darkfloorUrl = `${normalizedSongbirdUrl}/api/preview?${params.toString()}`;
            console.log("[OG Route] Redirecting to darkfloor preview:", darkfloorUrl);
            return Response.redirect(darkfloorUrl, 302);
          }
        }
      }
    } catch (error) {
      console.error("[OG Route] Error fetching track:", error);
    }
  } else if (query) {
    const trimmedQuery = query.trim();
    
    // Strategy: First try to find the track via frontend search API
    // This is more reliable than relying on backend's query search
    // If we find a track, use trackId-based preview (most reliable)
    try {
      console.log("[OG Route] Searching for track via frontend API:", trimmedQuery);
      const searchUrl = new URL("/api/music/search", origin);
      searchUrl.searchParams.set("q", trimmedQuery);
      
      const searchResponse = await fetch(searchUrl.toString(), {
        signal: AbortSignal.timeout(10000),
      });

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as {
          data?: Array<{
            id?: number;
            title?: string;
            artist?: { name?: string } | string;
            album?: { title?: string } | null;
          }>;
        };

        const firstTrack = searchData.data?.[0];
        if (firstTrack && firstTrack.id) {
          // Found a track! Use trackId-based preview (most reliable)
          console.log("[OG Route] Found track via search, using trackId:", firstTrack.id);
          
          // Fetch track details to get full metadata
          const trackUrl = new URL(`/api/track/${firstTrack.id}`, origin);
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

              const songbirdApiUrl = env.SONGBIRD_PUBLIC_API_URL || env.NEXT_PUBLIC_SONGBIRD_API_URL;
              if (songbirdApiUrl) {
                const normalizedSongbirdUrl = songbirdApiUrl.endsWith("/") ? songbirdApiUrl.slice(0, -1) : songbirdApiUrl;
                const darkfloorUrl = `${normalizedSongbirdUrl}/api/preview?${params.toString()}`;
                console.log("[OG Route] Redirecting to track-specific preview:", darkfloorUrl);
                return Response.redirect(darkfloorUrl, 302);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[OG Route] Frontend search failed:", error);
    }

    // Fallback: Use backend's query-based preview endpoint
    // This is less reliable but works when frontend search doesn't find a match
    const backendApiUrl = env.NEXT_PUBLIC_API_URL;
    if (backendApiUrl) {
      const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
      const encodedQuery = encodeURIComponent(trimmedQuery);
      const previewUrl = `${normalizedUrl}/api/preview?q=${encodedQuery}`;
      
      try {
        // CRITICAL: Always encode the query parameter using encodeURIComponent()
        // This converts spaces to %20, special characters like ö to %C3%B6, etc.
        // Example: "isobel björk" -> "isobel%20bj%C3%B6rk"
        // Using + signs or unencoded special characters will result in 0-byte responses
        
        console.log("[OG Route] Fallback: Using backend query-based preview:", {
          query: trimmedQuery,
          encoded: encodedQuery,
          previewUrl,
        });
        
        const response = await fetch(previewUrl, {
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          
          // Return the image (backend handles default vs track-specific internally)
          // Note: We can't distinguish between default and track-specific images
          // as both are valid PNG files. The backend returns default when track isn't found.
          return new Response(imageBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } else {
          console.warn("[OG Route] Backend returned error:", {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (error) {
        console.error("[OG Route] Backend preview API error:", {
          error: error instanceof Error ? error.message : String(error),
          previewUrl,
        });
      }
    } else {
      console.warn("[OG Route] NEXT_PUBLIC_API_URL not configured");
    }
  }

  console.log("[OG Route] No track data found, using default image");
  const songbirdApiUrl = env.SONGBIRD_PUBLIC_API_URL || env.NEXT_PUBLIC_SONGBIRD_API_URL;
  if (songbirdApiUrl) {
    const normalizedSongbirdUrl = songbirdApiUrl.endsWith("/") ? songbirdApiUrl.slice(0, -1) : songbirdApiUrl;
    return Response.redirect(`${normalizedSongbirdUrl}/api/preview/default`, 302);
  }
  // Fallback to hardcoded URL if env not configured
  return Response.redirect("https://darkfloor.one/api/preview/default", 302);
}
