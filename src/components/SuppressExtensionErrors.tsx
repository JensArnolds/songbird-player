// File: src/components/SuppressExtensionErrors.tsx

"use client";

import { useEffect } from "react";

/**
 * Suppresses harmless Chrome extension errors that occur when extensions
 * try to communicate with the page but the page context is destroyed
 * before the promise resolves (e.g., during track switching).
 *
 * This is a known issue with Chrome extensions and doesn't affect functionality.
 */
export default function SuppressExtensionErrors() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalError = console.error;
    
    // Ensure originalError is actually a function
    if (typeof originalError !== "function") {
      return;
    }

    console.error = function (...args: unknown[]) {
      try {
        // Suppress Chrome extension message errors
        const firstArg = args[0];
        if (
          typeof firstArg === "string" &&
          firstArg.includes(
            "Promised response from onMessage listener went out of scope",
          )
        ) {
          return; // Suppress this specific error
        }
        // Call original error handler safely
        if (typeof originalError === "function") {
          originalError.apply(console, args);
        }
      } catch (error) {
        // Fallback: if apply fails, try direct call
        try {
          if (typeof originalError === "function") {
            originalError(...args);
          }
        } catch {
          // Silently fail if error handling itself fails
        }
      }
    };

    // Cleanup on unmount
    return () => {
      if (typeof originalError === "function") {
        console.error = originalError;
      }
    };
  }, []);

  return null;
}
