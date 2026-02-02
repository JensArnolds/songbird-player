// File: src/config/version.ts

// App version (set at build time via next.config.js env.NEXT_PUBLIC_APP_VERSION)
import { env } from "@/env";

export const APP_VERSION: string =
  env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
