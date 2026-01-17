// File: src/app/api/og/route.tsx

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");
  const cover = searchParams.get("cover");
  const duration = searchParams.get("duration");

  if (!title || !artist) {
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
            {cover ? (
              <img
                src={cover}
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
                fontSize: 48,
                fontWeight: 700,
                color: "#f5f1e8",
                marginBottom: 12,
                lineHeight: 1.1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 36,
                color: "#a5afbf",
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              {artist}
            </div>

            {album && (
              <div
                style={{
                  fontSize: 28,
                  color: "#6b7688",
                  lineHeight: 1.2,
                }}
              >
                {album}
              </div>
            )}
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
