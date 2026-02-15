// File: src/services/songbird.ts

import { env } from "@/env";

const rawSongbirdUrl = env.API_V2_URL;
const SONGBIRD_API_URL = rawSongbirdUrl
  ? rawSongbirdUrl.replace(/\/+$/, "")
  : undefined;
const SONGBIRD_API_KEY = env.SONGBIRD_API_KEY;

async function songbirdRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!SONGBIRD_API_URL) {
    throw new Error("Songbird API URL is not configured. Set API_V2_URL.");
  }

  if (!SONGBIRD_API_KEY) {
    throw new Error(
      "Songbird API key is not configured. Set SONGBIRD_API_KEY environment variable.",
    );
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${SONGBIRD_API_URL}${normalizedEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SONGBIRD_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Songbird API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export const songbird = {

  request: songbirdRequest,

};
