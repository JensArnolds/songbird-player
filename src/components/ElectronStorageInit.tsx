// File: src/components/ElectronStorageInit.tsx

"use client";

import { initializeElectronStorage } from "@/utils/electronStorage";
import { useEffect } from "react";

/**
 * Component to initialize Electron storage on app startup
 * This should be included in the root layout
 */
export function ElectronStorageInit() {
  useEffect(() => {
    void initializeElectronStorage();
  }, []);

  return null;
}
