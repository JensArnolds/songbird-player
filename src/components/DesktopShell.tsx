// File: src/components/DesktopShell.tsx

"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import type { ReactNode } from "react";
import { ElectronSidebar } from "./ElectronSidebar";

export function DesktopShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const isElectron =
    typeof window !== "undefined" && Boolean(window.electron?.isElectron);

  // Only render desktop shell in Electron on non-mobile devices
  if (isMobile || !isElectron) return <>{children}</>;

  return (
    <div className="desktop-shell flex h-screen w-full overflow-hidden">
      <ElectronSidebar />
      <div className="desktop-main min-w-0 flex-1 p-3">
        <div className="desktop-surface flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border">
          <div className="desktop-scroll min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
