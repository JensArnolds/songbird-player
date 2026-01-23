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
        // Next.js searchParams.get() automatically decodes the query, so we need to re-encode it
        // This is required for proper URL encoding of special characters (spaces, accents, etc.)
        const trimmedQuery = query.trim();
        const encodedQuery = encodeURIComponent(trimmedQuery);
        const previewUrl = `${normalizedUrl}/api/preview?q=${encodedQuery}`;
        
        console.log("[OG Route] Query details:", {
          original: query,
          trimmed: trimmedQuery,
          encoded: encodedQuery,
          previewUrl,
        });
        
        const response = await fetch(previewUrl, {
          signal: AbortSignal.timeout(10000),
        });

        console.log("[OG Route] Backend response:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          
          // Check if we got actual image data (not empty/default)
          if (imageBuffer.byteLength > 0) {
            console.log("[OG Route] Successfully fetched OG image:", {
              size: imageBuffer.byteLength,
              bytes: "bytes",
            });
            
            return new Response(imageBuffer, {
              headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600",
              },
            });
          } else {
            console.warn("[OG Route] Backend returned empty image buffer (0 bytes)");
          }
        } else {
          console.warn("[OG Route] Backend preview API returned error:", {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (error) {
        console.error("[OG Route] Backend preview API error:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } else {
      console.warn("[OG Route] NEXT_PUBLIC_API_URL not configured");
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
