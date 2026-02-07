// File: src/components/DesktopShell.tsx

"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import type { ReactNode } from "react";
import { ElectronSidebar } from "./ElectronSidebar";

export function DesktopShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) return <>{children}</>;

  return (
    <div className="desktop-shell flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(30,215,96,0.14)_0%,transparent_34%),linear-gradient(180deg,#121212_0%,#080808_100%)]">
      <ElectronSidebar />
      <div className="desktop-main min-w-0 flex-1 p-2 md:p-3">
        <div className="desktop-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[1.25rem] border">
          <div className="desktop-scroll min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
