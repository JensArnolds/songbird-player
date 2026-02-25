// File: apps/web/src/config/version.ts

import rootPackageJson from "../../../../package.json";

const rawPackageVersion =
  typeof rootPackageJson.version === "string"
    ? rootPackageJson.version
    : "";

const normalizedPackageVersion = rawPackageVersion.trim();

// Keep version tied to the built package metadata so SSR and hydration
// resolve the same value even when runtime env files differ.
export const APP_VERSION: string =
  normalizedPackageVersion.length > 0
    ? normalizedPackageVersion
    : "0.0.0";
