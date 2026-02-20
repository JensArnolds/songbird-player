// File: apps/web/vitest.config.ts

import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@starchild/auth": fileURLToPath(
        new URL("../../packages/auth/src/index.ts", import.meta.url),
      ),
      "@starchild/auth/logging": fileURLToPath(
        new URL("../../packages/auth/src/logging.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
});
