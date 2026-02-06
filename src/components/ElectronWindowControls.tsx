// File: src/components/ElectronWindowControls.tsx

"use client";

import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

type WindowStateMessage = {
  type: "windowState";
  isMaximized: boolean;
};

const isWindowStateMessage = (value: unknown): value is WindowStateMessage => {
  if (!value || typeof value !== "object") return false;
  const payload = value as { type?: unknown; isMaximized?: unknown };
  return payload.type === "windowState" && typeof payload.isMaximized === "boolean";
};

export function ElectronWindowControls() {
  const [isWindowsElectron] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.electron?.isElectron) &&
      window.electron?.platform === "win32",
  );
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isWindowsElectron) return;

    window.electron.receive?.("fromMain", (...args) => {
      const message = args[0];
      if (!isWindowStateMessage(message)) return;
      setIsMaximized(message.isMaximized);
    });

    window.electron.send?.("toMain", { type: "window:getState" });
  }, [isWindowsElectron]);

  if (!isWindowsElectron) return null;

  return (
    <div className="electron-window-controls" role="group" aria-label="Window controls">
      <div className="electron-window-controls-shell">
        <button
          type="button"
          aria-label="Minimize window"
          title="Minimize"
          className="electron-window-control electron-window-control-minimize"
          onClick={() => window.electron?.send?.("toMain", { type: "window:minimize" })}
        >
          <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          title={isMaximized ? "Restore" : "Maximize"}
          className="electron-window-control electron-window-control-maximize"
          onClick={() => window.electron?.send?.("toMain", { type: "window:toggleMaximize" })}
        >
          <Square className={`h-3.5 w-3.5 stroke-[2.5] ${isMaximized ? "scale-90" : ""}`} />
        </button>

        <button
          type="button"
          aria-label="Close window"
          title="Close"
          className="electron-window-control electron-window-control-close"
          onClick={() => window.electron?.send?.("toMain", { type: "window:close" })}
        >
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
