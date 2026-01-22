// File: src/app/api/og/route.tsx

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const startTime = Date.now();

  // Check for trackId or query string first
  const trackId = searchParams.get("trackId");
  const query = searchParams.get("q");

  // If we have a trackId, redirect directly to the backend preview API (fastest path)
  // Skip if backend is localhost (won't work in production)
  if (trackId) {
    const backendApiUrl = process.env.SONGBIRD_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SONGBIRD_API_URL;
    const isLocalhost = backendApiUrl?.includes("localhost") || backendApiUrl?.includes("127.0.0.1");

    if (backendApiUrl && !isLocalhost) {
      const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
      const previewUrl = `${normalizedUrl}/api/track/${trackId}/preview`;
      console.log("[OG Route] Redirecting to backend preview API:", previewUrl);
      return Response.redirect(previewUrl, 302);
    } else if (isLocalhost) {
      console.log("[OG Route] Skipping localhost backend API, generating image locally");
    }
  }

  // If we have a query, use the backend POST endpoint via proxy
  // Skip if backend is localhost (won't work in production)
  if (query) {
    const backendApiUrl = process.env.SONGBIRD_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SONGBIRD_API_URL;
    const isLocalhost = backendApiUrl?.includes("localhost") || backendApiUrl?.includes("127.0.0.1");

    if (backendApiUrl && !isLocalhost) {
      try {
        const normalizedUrl = backendApiUrl.endsWith("/") ? backendApiUrl.slice(0, -1) : backendApiUrl;
        const previewEndpoint = `${normalizedUrl}/api/track/preview`;

        console.log("[OG Route] Fetching preview from backend POST:", previewEndpoint, "query:", query);
        const response = await fetch(previewEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          // Return the image directly
          const imageBuffer = await response.arrayBuffer();
          return new Response(imageBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } else {
          console.error("[OG Route] Backend preview API returned error:", response.status);
        }
      } catch (error) {
        console.error("[OG Route] Error fetching from backend preview API:", error);
      }
    } else if (isLocalhost) {
      console.log("[OG Route] Skipping localhost backend API for query search");
    }
  }

  let trackData: {
    title: string;
    artist: string;
    album: string | null;
    cover: string | null;
    duration: string | null;
  } | null = null;

  // Fetch track data if trackId or query is provided
  if (trackId) {
    try {
      console.log("[OG Route] Fetching track by ID:", trackId);
      const trackUrl = new URL(`/api/track/${trackId}`, origin);
      const trackResponse = await fetchWithTimeout(trackUrl.toString(), 5000);
      
      if (trackResponse.ok) {
        const track = (await trackResponse.json()) as {
          title?: string;
          name?: string;
          artist?: { name?: string } | string;
          album?: { 
            title?: string; 
            name?: string; 
            cover_medium?: string; 
            cover_big?: string;
            cover_xl?: string;
          } | null;
          duration?: number;
          cover_medium?: string;
          cover_big?: string;
        };

        const title = track.title || track.name || "";
        const artistName = typeof track.artist === "string" 
          ? track.artist 
          : track.artist?.name || "";
        const album = track.album;
        const albumTitle = album && typeof album === "object"
          ? (album.title || album.name || null)
          : null;
        const coverUrl = album && typeof album === "object"
          ? (album.cover_big || album.cover_xl || album.cover_medium || null)
          : (track.cover_big || track.cover_medium || null);
        const duration = track.duration ? Math.floor(track.duration).toString() : null;

        if (title && artistName) {
          trackData = { title, artist: artistName, album: albumTitle, cover: coverUrl, duration };
        }
      }
    } catch (error) {
      console.error("[OG Route] Error fetching track by ID:", error);
    }
  } else if (query) {
    try {
      console.log("[OG Route] Searching tracks by query:", query);
      const searchUrl = new URL("/api/music/search", origin);
      searchUrl.searchParams.set("q", query);
      const searchResponse = await fetchWithTimeout(searchUrl.toString(), 5000);
      
      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as {
          data?: Array<{
            title?: string;
            name?: string;
            artist?: { name?: string } | string;
            album?: { 
              title?: string; 
              name?: string; 
              cover_medium?: string; 
              cover_big?: string;
              cover_xl?: string;
            } | null;
            duration?: number;
            cover_medium?: string;
            cover_big?: string;
          }>;
        };

        const firstTrack = searchData.data?.[0];
        if (firstTrack) {
          const title = firstTrack.title || firstTrack.name || "";
          const artistName = typeof firstTrack.artist === "string"
            ? firstTrack.artist
            : firstTrack.artist?.name || "";
          const album = firstTrack.album;
          const albumTitle = album && typeof album === "object"
            ? (album.title || album.name || null)
            : null;
          const albumWithCovers = album && typeof album === "object" 
            ? album as { cover_big?: string; cover_xl?: string; cover_medium?: string }
            : null;
          const coverUrl = albumWithCovers
            ? (albumWithCovers.cover_big || albumWithCovers.cover_xl || albumWithCovers.cover_medium || null)
            : (firstTrack.cover_big || firstTrack.cover_medium || null);
          const duration = firstTrack.duration ? Math.floor(firstTrack.duration).toString() : null;

          if (title && artistName) {
            trackData = { title, artist: artistName, album: albumTitle, cover: coverUrl, duration };
          }
        }
      }
    } catch (error) {
      console.error("[OG Route] Error searching tracks:", error);
    }
  }

  // Fall back to direct parameters if no trackId/query or fetch failed
  if (!trackData) {
    const title = searchParams.get("title");
    const artist = searchParams.get("artist");
    const album = searchParams.get("album");
    const cover = searchParams.get("cover");
    const duration = searchParams.get("duration");

    if (title && artist) {
      trackData = { title, artist, album, cover, duration };
    }
  }

  const fetchTime = Date.now() - startTime;
  console.log("[OG Route] Track data fetch completed:", {
    hasTrackData: !!trackData,
    fetchTime: `${fetchTime}ms`,
    trackId,
    query,
    title: trackData?.title,
    artist: trackData?.artist,
  });

  if (!trackData || !trackData.title || !trackData.artist) {
    console.log("[OG Route] Missing required track data, redirecting to default image", {
      hasTrackData: !!trackData,
      hasTitle: !!trackData?.title,
      hasArtist: !!trackData?.artist,
    });
    return Response.redirect("https://darkfloor.one/api/preview/default", 302);
  }

  // Note: Edge runtime timeout varies by platform (typically 25-30s on Vercel)
  // We set individual fetch timeouts above, so if we got here, the fetches succeeded
  // No need for additional total time check - let the edge runtime handle overall timeout

  try {
    return await generateTrackImage({
      title: trackData.title,
      artist: trackData.artist,
      album: trackData.album,
      cover: trackData.cover,
      duration: trackData.duration,
      origin,
    });
  } catch (error) {
    console.error("[OG Route] Error generating image, falling back to default:", error);
    return Response.redirect("https://darkfloor.one/api/preview/default", 302);
  }
}

async function generateTrackImage({
  title,
  artist,
  album,
  cover,
  duration,
  origin,
}: {
  title: string;
  artist: string;
  album: string | null;
  cover: string | null;
  duration: string | null;
  origin: string;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const durationSeconds = duration ? parseInt(duration, 10) : 0;
  const formattedDuration = durationSeconds > 0 ? formatDuration(durationSeconds) : "0:00";
  const progressPercent = 42;

  const coverDataUrl = await getCoverDataUrl(cover);

  console.log("[OG Route] Rendering track card:", {
    hasCoverDataUrl: !!coverDataUrl,
    duration: formattedDuration,
  });

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a1018",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(244, 178, 102, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(88, 198, 177, 0.1) 0%, transparent 50%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: 1140,
          height: 570,
          backgroundColor: "rgba(15, 22, 32, 0.95)",
          borderRadius: 24,
          padding: 0,
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Album Art Section - Square, prominent */}
        <div
          style={{
            width: 570,
            height: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a2332 0%, #0f1620 100%)",
            flexShrink: 0,
          }}
        >
          {coverDataUrl ? (
            <img
              src={coverDataUrl}
              width={570}
              height={570}
              style={{
                objectFit: "cover",
                display: "flex",
                width: "100%",
                height: "100%",
              }}
              alt="Album cover"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1a2332 0%, #0f1620 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 200,
                color: "#2a3645",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Content Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "60px 50px",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          {/* Track Info - Top Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Song Title */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#f5f1e8",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>

            {/* Artist Name */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: "#a5afbf",
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
              }}
            >
              {artist}
            </div>

            {/* Album Name */}
            {album && (
              <div
                style={{
                  fontSize: 28,
                  color: "#6b7688",
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontWeight: 500,
                }}
              >
                {album}
              </div>
            )}
          </div>

          {/* Bottom Section - Player & Branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Player Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              {/* Play Button */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: "linear-gradient(135deg, #f4b266 0%, #ffd6a0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(244, 178, 102, 0.4), 0 0 0 3px rgba(244, 178, 102, 0.15)",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    color: "#0a1018",
                    marginLeft: 4,
                    fontWeight: 700,
                  }}
                >
                  ▶
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: "linear-gradient(90deg, #f4b266 0%, #ffd6a0 50%, #f4b266 100%)",
                      backgroundSize: "200% 100%",
                      borderRadius: 6,
                      boxShadow: "0 0 16px rgba(244, 178, 102, 0.7)",
                    }}
                  />
                </div>

                {/* Time Display */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      color: "#f4b266",
                      fontWeight: 600,
                    }}
                  >
                    {formatDuration(Math.floor(durationSeconds * (progressPercent / 100)))}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      color: "#6b7688",
                      fontWeight: 500,
                    }}
                  >
                    {formattedDuration}
                  </div>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingTop: 20,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  lineHeight: 1,
                }}
              >
                🎵
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#6b7688",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                }}
              >
                Play now on Starchild Music
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  timeoutMs: number,
): Promise<Response> {
  const isVitest =
    typeof process !== "undefined" && !!process.env.VITEST;
  const canAbort =
    typeof AbortController !== "undefined" && !isVitest;

  if (canAbort) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fetch(input),
      new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Request timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function getCoverDataUrl(coverUrl: string | null) {
  if (!coverUrl) {
    console.log("[OG Route] No cover URL provided");
    return null;
  }

  try {
    console.log("[OG Route] Fetching cover image:", coverUrl.substring(0, 80));
    const startTime = Date.now();

    // Increased timeout from 1s to 2s for cover image fetch
    const response = await fetchWithTimeout(coverUrl, 2000);

    if (!response.ok) {
      console.error("[OG Route] Cover fetch failed:", response.status, response.statusText);
      return null;
    }

    const contentLength = response.headers.get("content-length");
    // Increased max size to 1MB for better quality images
    if (contentLength && Number(contentLength) > 1_000_000) {
      console.warn("[OG Route] Cover image too large, skipping:", contentLength);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const fetchTime = Date.now() - startTime;

    // Skip if buffer too large or fetch took too long
    if (buffer.byteLength > 1_000_000) {
      console.warn("[OG Route] Cover image buffer too large, skipping:", buffer.byteLength);
      return null;
    }

    if (fetchTime > 2000) {
      console.warn("[OG Route] Cover fetch took too long, skipping:", fetchTime);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const base64Start = Date.now();
    const base64 = arrayBufferToBase64(buffer);
    const base64Time = Date.now() - base64Start;
    
    console.log("[OG Route] Cover image processed:", {
      size: buffer.byteLength,
      fetchTime: `${fetchTime}ms`,
      base64Time: `${base64Time}ms`,
    });
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("[OG Route] Error fetching cover image:", error);
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}
