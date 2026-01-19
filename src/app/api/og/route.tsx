// File: src/app/api/og/route.tsx

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");
  const cover = searchParams.get("cover");
  const duration = searchParams.get("duration");

  console.log("[OG Route] Generating preview:", {
    title,
    artist,
    album,
    hasCover: !!cover,
    coverUrl: cover?.substring(0, 50),
    duration,
  });

  if (!title || !artist) {
    console.log("[OG Route] Missing required params, using default image");
    const emilyImageUrl = `https://starchildmusic.com/emily-the-strange.png`;

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1118",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(244, 178, 102, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(88, 198, 177, 0.1) 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {}
          <img
            src={emilyImageUrl}
            width={400}
            height={400}
            style={{
              borderRadius: 20,
              marginBottom: 40,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            alt="Emily the Strange"
          />
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: "#f5f1e8",
              marginBottom: 20,
              textAlign: "center",
              letterSpacing: "-0.05em",
            }}
          >
            Starchild Music
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#a5afbf",
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Modern music streaming and discovery platform with advanced audio
            features and visual patterns
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  }

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
    const response = await fetchWithTimeout(coverUrl, 3000);

    if (!response.ok) {
      console.error("[OG Route] Cover fetch failed:", response.status, response.statusText);
      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > 2_000_000) {
      console.warn("[OG Route] Cover image too large:", contentLength);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const base64 = arrayBufferToBase64(buffer);
    console.log("[OG Route] Cover image fetched successfully, size:", buffer.byteLength);
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
