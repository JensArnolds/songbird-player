// File: src/components/ElectronChromeSync.tsx

"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";

type TitlebarOverlayMessage = {
  type: "titlebarOverlay:set";
  theme: "light" | "dark";
  color?: string;
  symbolColor?: string;
  height?: number;
};

const readCssVar = (name: string): string => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

const setRootVar = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value);
};

export function ElectronChromeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    if (!window.electron?.isElectron) return;
    document.documentElement.classList.add("is-electron");
    if (window.electron.platform === "win32") {
      setRootVar("--electron-titlebar-height", "44px");
    }
    return () => document.documentElement.classList.remove("is-electron");
  }, []);

  useEffect(() => {
    if (!window.electron?.isElectron) return;

    const overlay = navigator.windowControlsOverlay;
    if (!overlay?.getTitlebarAreaRect) return;

    const update = () => {
      const rect = overlay.getTitlebarAreaRect();
      setRootVar("--electron-titlebar-height", `${Math.max(0, Math.round(rect.height))}px`);

      const leftInset = Math.max(0, Math.round(rect.x));
      const rightInset = Math.max(0, Math.round(window.innerWidth - (rect.x + rect.width)));
      setRootVar("--electron-titlebar-inset-left", `${leftInset}px`);
      setRootVar("--electron-titlebar-inset-right", `${rightInset}px`);
    };

    update();

    overlay.addEventListener("geometrychange", update);
    window.addEventListener("resize", update);

    return () => {
      overlay.removeEventListener("geometrychange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!window.electron?.isElectron) return;

    const color =
      readCssVar("--color-chrome-solid") ||
      (theme === "light" ? "#ffffff" : "#0a1018");
    const symbolColor =
      readCssVar("--color-chrome-symbol") ||
      (theme === "light" ? "#0f1419" : "#f5f1e8");

    const titlebarHeightVar = readCssVar("--electron-titlebar-height");
    const parsedHeight = parseInt(titlebarHeightVar, 10);

    const message: TitlebarOverlayMessage = {
      type: "titlebarOverlay:set",
      theme,
      color,
      symbolColor,
      ...(Number.isFinite(parsedHeight) && parsedHeight > 0 ? { height: parsedHeight } : {}),
    };

    window.electron.send?.("toMain", message);
  }, [theme]);

  return null;
}
