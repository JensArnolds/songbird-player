// File: apps/web/src/utils/getBaseUrl.ts

import { env } from "@/env";
import { headers } from "next/headers";

export function getBaseUrl(): string {

  if (env.NEXT_PUBLIC_NEXTAUTH_URL) {
    return env.NEXT_PUBLIC_NEXTAUTH_URL;
  }

  if (typeof window === "undefined") {
    try {

      if (env.NEXTAUTH_URL) {
        return env.NEXTAUTH_URL;
      }
    } catch {

    }
  }

  return "https://starchildmusic.com";
}

export async function getRequestBaseUrl(): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  if (host) return `${protocol}://${host}`;
  return getBaseUrl();
}
