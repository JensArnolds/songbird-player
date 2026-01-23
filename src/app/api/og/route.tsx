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

          const darkfloorUrl = `https://darkfloor.one/api/preview?${params.toString()}`;
          console.log("[OG Route] Redirecting to darkfloor preview:", darkfloorUrl);
          return Response.redirect(darkfloorUrl, 302);
        }
      }
    } catch (error) {
      console.error("[OG Route] Error fetching track:", error);
    }
  } else if (query) {
    // Use GET /api/preview?q={encodedQuery} as per backend documentation
    // This is the recommended endpoint for OG image generation with search queries
    const backendApiUrl = env.NEXT_PUBLIC_API_URL;
    if (backendApiUrl) {
      try {
        const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
        
        // CRITICAL: Always encode the query parameter using encodeURIComponent()
        // This is required for proper URL encoding of special characters (spaces, accents, etc.)
        const encodedQuery = encodeURIComponent(query.trim());
        const previewUrl = `${normalizedUrl}/api/preview?q=${encodedQuery}`;
        
        console.log("[OG Route] Fetching OG image from backend preview API:", previewUrl);
        const response = await fetch(previewUrl, {
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          // Return the image directly from backend
          const imageBuffer = await response.arrayBuffer();
          return new Response(imageBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } else {
          console.warn("[OG Route] Backend preview API returned error:", response.status);
        }
      } catch (error) {
        console.error("[OG Route] Backend preview API error:", error);
      }
    }

    // Fallback: Try frontend search API and redirect to darkfloor.one
    try {
      console.log("[OG Route] Fallback: Searching tracks by query via frontend API:", query);
      const searchUrl = new URL("/api/music/search", origin);
      searchUrl.searchParams.set("q", query);
      
      const searchResponse = await fetch(searchUrl.toString(), {
        signal: AbortSignal.timeout(10000),
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
      console.error("[OG Route] Error in fallback search:", error);
    }
  }

  console.log("[OG Route] No track data found, using default image");
  return Response.redirect("https://darkfloor.one/api/preview/default", 302);
}
