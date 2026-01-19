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
        backgroundColor: "#0b1118",
        backgroundImage:
          "radial-gradient(circle at 25% 25%, rgba(244, 178, 102, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(88, 198, 177, 0.1) 0%, transparent 50%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1040,
          backgroundColor: "rgba(19, 26, 36, 0.95)",
          borderRadius: 24,
          padding: "60px",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(244, 178, 102, 0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 16,
              overflow: "hidden",
              marginRight: 48,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              display: "flex",
            }}
          >
            {coverDataUrl ? (
              <img
                src={coverDataUrl}
                width={280}
                height={280}
                style={{
                  objectFit: "cover",
                }}
                alt="Album cover"
              />
            ) : (
              <div
                style={{
                  width: 280,
                  height: 280,
                  background: "linear-gradient(135deg, #1a2332 0%, #0b1118 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 120,
                  color: "#2a3645",
                }}
              >
                ♪
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 46,
                fontWeight: 700,
                color: "#f5f1e8",
                marginBottom: 16,
                lineHeight: 1.1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {`${title} - ${artist}`}
            </div>

            <div
              style={{
                fontSize: 28,
                color: "#a5afbf",
                lineHeight: 1.2,
              }}
            >
              Album: {album || "Single"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#f4b266",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(244, 178, 102, 0.4)",
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: "#0b1118",
                marginLeft: 4,
              }}
            >
              ▶
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 8,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg, #f4b266 0%, #ffd6a0 100%)",
                  borderRadius: 4,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: "#a5afbf",
                }}
              >
                {formatDuration(Math.floor(durationSeconds * (progressPercent / 100)))}
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#6b7688",
                }}
              >
                {formattedDuration}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 32,
            fontSize: 18,
            color: "#6b7688",
            gap: 8,
          }}
        >
          <span>🎵</span>
          <span>Starchild Music</span>
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
