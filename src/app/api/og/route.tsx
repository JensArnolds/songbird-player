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
    // Strategy: First try to find the track via search API, then use track-specific preview
    // This is more reliable than relying on the backend's query-based preview endpoint
    // which may return default images when tracks aren't found
    const trimmedQuery = query.trim();
    
    // Step 1: Try frontend search API to get track details
    try {
      console.log("[OG Route] Searching tracks by query via frontend API:", trimmedQuery);
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
        if (firstTrack) {
          // If we have a track ID, use the track-specific preview endpoint (most reliable)
          if (firstTrack.id) {
            const backendApiUrl = env.NEXT_PUBLIC_API_URL;
            if (backendApiUrl) {
              const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
              const trackPreviewUrl = `${normalizedUrl}/api/track/${firstTrack.id}/preview`;
              
              console.log("[OG Route] Using track-specific preview endpoint:", trackPreviewUrl);
              try {
                const trackPreviewResponse = await fetch(trackPreviewUrl, {
                  signal: AbortSignal.timeout(10000),
                });
                
                if (trackPreviewResponse.ok) {
                  const imageBuffer = await trackPreviewResponse.arrayBuffer();
                  if (imageBuffer.byteLength > 0) {
                    return new Response(imageBuffer, {
                      headers: {
                        "Content-Type": "image/png",
                        "Cache-Control": "public, max-age=3600",
                      },
                    });
                  }
                }
              } catch (error) {
                console.warn("[OG Route] Track-specific preview failed, falling back to metadata-based preview");
              }
            }
          }
          
          // Fallback: Use track metadata to build preview URL
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
            console.log("[OG Route] Redirecting to darkfloor preview with track metadata:", darkfloorUrl);
            return Response.redirect(darkfloorUrl, 302);
          }
        }
      }
    } catch (error) {
      console.error("[OG Route] Error in search API:", error);
    }

    // Step 2: Fallback to backend query-based preview endpoint
    // This endpoint may return default images if tracks aren't found, but it's worth trying
    const backendApiUrl = env.NEXT_PUBLIC_API_URL;
    if (backendApiUrl) {
      try {
        const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
        
        // CRITICAL: Always encode the query parameter using encodeURIComponent()
        // Next.js searchParams.get() automatically decodes the query, so we need to re-encode it
        // This is required for proper URL encoding of special characters (spaces, accents, etc.)
        const encodedQuery = encodeURIComponent(trimmedQuery);
        const previewUrl = `${normalizedUrl}/api/preview?q=${encodedQuery}`;
        
        console.log("[OG Route] Fallback: Trying backend query-based preview:", {
          query: trimmedQuery,
          encoded: encodedQuery,
          previewUrl,
        });
        
        const response = await fetch(previewUrl, {
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          
          // Check if we got actual image data (not empty)
          if (imageBuffer.byteLength > 0) {
            console.log("[OG Route] Backend query preview returned image:", {
              size: imageBuffer.byteLength,
            });
            
            return new Response(imageBuffer, {
              headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=3600",
              },
            });
          }
        }
      } catch (error) {
        console.error("[OG Route] Backend query preview error:", error);
      }
    }
  }

  console.log("[OG Route] No track data found, using default image");
  return Response.redirect("https://darkfloor.one/api/preview/default", 302);
}
