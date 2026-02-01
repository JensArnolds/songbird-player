"use client";

import { api } from "@/trpc/react";
import { settingsStorage } from "@/utils/settingsStorage";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect } from "react";

interface ThemeContextValue {
  theme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark" });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

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

  useEffect(() => {
    const htmlElement = document.documentElement;

    if (theme === "light") {
      htmlElement.classList.add("theme-light");
      htmlElement.classList.remove("theme-dark");
    } else {
      htmlElement.classList.add("theme-dark");
      htmlElement.classList.remove("theme-light");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
