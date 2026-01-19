// File: src/app/api/health/route.ts

import { pool } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV === "development";

  // Log request details in development mode
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

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : "Unknown database error",
        responseTime,
      },
      { status: 503 }
    );
  }

  const responseTime = Date.now() - startTime;

  // Log response details in development mode
  if (isDev) {
    console.log("[Health Check] Response sent:", {
      status: "ok",
      responseTime: `${responseTime}ms`,
      database: health.checks.database,
      memory: health.memory,
    });
  }

  return NextResponse.json({
    ...health,
    responseTime,
  });
}
