// File: src/contexts/ThemeContext.tsx

"use client";

import { api } from "@/trpc/react";
import { settingsStorage } from "@/utils/settingsStorage";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextValue {
  theme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark" });
const MOBILE_MAX_WIDTH = 768;

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    setIsMobile(m.matches);
    const handler = () => setIsMobile(window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  const { data: preferences } = api.music.getUserPreferences.useQuery(
    undefined,
    {
      enabled: !!session,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  const localTheme = settingsStorage.getSetting("theme", "dark");
  const theme = session
    ? preferences?.theme === "light"
      ? "light"
      : "dark"
    : localTheme;

  const effectiveTheme = isMobile ? "dark" : theme;

  useEffect(() => {
    const htmlElement = document.documentElement;
    const useLight = effectiveTheme === "light";

    if (useLight) {
      htmlElement.classList.add("theme-light");
      htmlElement.classList.remove("theme-dark");
    } else {
      htmlElement.classList.add("theme-dark");
      htmlElement.classList.remove("theme-light");
    }
  }, [effectiveTheme]);

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
