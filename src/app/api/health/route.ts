// File: src/app/api/health/route.ts

import { pool } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return {};

  let isAllowed = false;
  try {
    const url = new URL(origin);
    if (LOCALHOST_HOSTNAMES.has(url.hostname)) {
      isAllowed = true;
    }
  } catch {
    isAllowed = false;
  }

  if (!isAllowed && origin === request.nextUrl.origin) {
    isAllowed = true;
  }

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === "development";
  const corsHeaders = getCorsHeaders(request);

  if (isDev) {
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent");
    const referer = request.headers.get("referer");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    console.log("[Health Check] Request received:", {
      method: request.method,
      url: request.url,
      origin,
      userAgent,
      referer,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    checks: {
      database: "unknown" as "ok" | "error" | "unknown",
    },
  };

  try {

    await pool.query("SELECT 1");
    health.checks.database = "ok";
  } catch (error) {
    health.checks.database = "error";
    health.status = "error";
    const responseTime = Date.now() - startTime;

    if (isDev) {
      console.error("[Health Check] Database check failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: `${responseTime}ms`,
      });
    }

    const response = NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : "Unknown database error",
        responseTime,
      },
      { status: 503 }
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const responseTime = Date.now() - startTime;

  if (isDev) {
    console.log("[Health Check] Response sent:", {
      status: "ok",
      responseTime: `${responseTime}ms`,
      database: health.checks.database,
      memory: health.memory,
    });
  }

  const response = NextResponse.json({
    ...health,
    responseTime,
  });
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
