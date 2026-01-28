// File: src/app/api/stream/route.ts

import { env } from "@/env";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");
  const id = searchParams.get("id");

  if (!query && !id) {
    return NextResponse.json(
      { error: "Missing query or id parameter" },
      { status: 400 },
    );
  }

  try {
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    if (!apiUrl) {
      console.error("[Stream API] NEXT_PUBLIC_API_URL not configured");
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const streamingKey = env.STREAMING_KEY;
    if (!streamingKey) {
      console.error("[Stream API] STREAMING_KEY not configured");
      return NextResponse.json(
        { error: "Streaming key not configured" },
        { status: 500 },
      );
    }

    const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
    const url = new URL("music/stream", normalizedApiUrl);
    url.searchParams.set("key", streamingKey);

    if (id) {
      url.searchParams.set("id", id);
      console.log("[Stream API] Streaming by ID:", id);
    } else if (query) {
      url.searchParams.set("q", query);
      console.log("[Stream API] Streaming by query:", query);
    }

    const requestUrl = url.toString();
    console.log(
      "[Stream API] Fetching stream from:",
      requestUrl.replace(streamingKey, "***"),
    );
    console.log(
      "[Stream API] Full URL (key hidden):",
      requestUrl.replace(streamingKey, "***"),
    );

    const rangeHeader = req.headers.get("Range");
    const fetchHeaders: HeadersInit = {};
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    console.log("[Stream API] Request headers:", {
      Range: rangeHeader ?? "none",
      "User-Agent": req.headers.get("User-Agent") ?? "unknown",
    });

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        headers: fetchHeaders,
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchError) {
      console.error("[Stream API] Fetch failed:", fetchError);
      if (fetchError instanceof Error) {
        if (
          fetchError.name === "AbortError" ||
          fetchError.message.includes("timeout")
        ) {
          console.error(
            "[Stream API] Request timed out - backend may be unresponsive",
          );
          return NextResponse.json(
            {
              error: "Backend request timed out",
              message:
                "The backend server did not respond in time. Check if the backend is running and accessible.",
              type: "timeout",
              backendUrl: normalizedApiUrl,
            },
            { status: 504 },
          );
        }

        if (
          fetchError.message.includes("ECONNREFUSED") ||
          fetchError.message.includes("ENOTFOUND") ||
          fetchError.message.includes("getaddrinfo")
        ) {
          console.error(
            "[Stream API] Connection refused - backend may not be running or URL is incorrect",
          );
          return NextResponse.json(
            {
              error: "Cannot connect to backend",
              message: `Failed to connect to backend at ${normalizedApiUrl}. Check if the backend is running and NEXT_PUBLIC_API_URL is correct.`,
              type: "connection_error",
              backendUrl: normalizedApiUrl,
            },
            { status: 502 },
          );
        }
      }
      throw fetchError;
    }

    if (!response.ok) {
      const statusCode = response.status;
      const statusText = response.statusText;

      let errorText = "";
      let errorData: { message?: string; error?: string } = {};

      try {
        errorText = await response.text();
        try {
          errorData = JSON.parse(errorText) as {
            message?: string;
            error?: string;
          };
        } catch {
          errorData = { message: errorText };
        }
      } catch (readError) {
        console.error("[Stream API] Could not read error response:", readError);
        errorText = "Could not read error response";
        errorData = { message: errorText };
      }

      console.error(
        `[Stream API] Stream failed: ${statusCode} ${statusText}`,
      );
      console.error("[Stream API] Error details:", errorData);
      console.error(
        "[Stream API] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );
      console.error("[Stream API] Request URL:", requestUrl.replace(streamingKey, "***"));

      const isUpstreamError =
        statusCode === 502 ||
        statusCode === 503 ||
        statusCode === 504 ||
        (errorData.message?.includes("upstream error") ?? false) ||
        (errorData.message?.includes("Bad Gateway") ?? false) ||
        (errorData.message?.includes("Service Unavailable") ?? false) ||
        errorData.error === "ServiceUnavailableException";

      const errorMessage =
        statusCode === 502
          ? "Backend returned 502 Bad Gateway - upstream service may be down or unreachable"
          : isUpstreamError
            ? "Upstream service unavailable"
            : `Stream failed: ${statusText}`;

      return NextResponse.json(
        {
          error: errorMessage,
          message: errorData.message ?? errorText,
          details: errorData,
          status: statusCode,
          backendUrl: requestUrl.replace(streamingKey, "***"),
          type: isUpstreamError ? "upstream_error" : "stream_error",
          diagnostics: {
            trackId: id ?? null,
            query: query ?? null,
            backendBaseUrl: normalizedApiUrl,
            hasStreamingKey: !!streamingKey,
          },
        },
        { status: statusCode },
      );
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) headers["Content-Length"] = contentLength;
    if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;
    if (contentRange) headers["Content-Range"] = contentRange;

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[Stream API] Streaming error:", error);
    console.error("[Stream API] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        console.error(
          "[Stream API] Request timed out - backend may be unresponsive",
        );
        return NextResponse.json(
          {
            error: "Backend request timed out",
            message:
              "The backend server did not respond in time. Check if the backend is running and accessible.",
            type: "timeout",
            backendUrl: env.NEXT_PUBLIC_API_URL,
          },
          { status: 504 },
        );
      }

      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo")
      ) {
        console.error(
          "[Stream API] Connection refused - backend may not be running or URL is incorrect",
        );
        return NextResponse.json(
          {
            error: "Cannot connect to backend",
            message: `Failed to connect to backend at ${env.NEXT_PUBLIC_API_URL}. Check if the backend is running and NEXT_PUBLIC_API_URL is correct.`,
            type: "connection_error",
            backendUrl: env.NEXT_PUBLIC_API_URL,
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch stream",
        message: error instanceof Error ? error.message : "Unknown error",
        type: "unknown_error",
        backendUrl: env.NEXT_PUBLIC_API_URL,
      },
      { status: 500 },
    );
  }
}
