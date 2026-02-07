// File: src/components/Header.tsx

"use client";

import { env } from "@/env";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { normalizeHealthStatus } from "@/utils/healthStatus";
import { Home, Library, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [apiHealthy, setApiHealthy] = useState<
    "healthy" | "degraded" | "down" | null
  >(null);
  const lastHealthErrorLogRef = useRef(0);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopHeaderRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const apiV2HealthUrl = env.NEXT_PUBLIC_API_V2_HEALTH_URL;
    const isElectronRuntime = Boolean(window.electron?.isElectron);

    const healthUrl = (() => {
      if (!apiV2HealthUrl) return "/api/v2/health";

      try {
        const absolute = new URL(apiV2HealthUrl, window.location.origin);
        if (absolute.origin !== window.location.origin || isElectronRuntime) {
          return "/api/v2/health";
        }
        return absolute.toString();
      } catch {
        return "/api/v2/health";
      }
    })();

    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(healthUrl, {
          cache: "no-store",
        });

        if (!isMounted) return;

        if (response.status >= 400 && response.status < 600) {
          console.warn("[Header] API V2 HTTP error:", {
            url: apiV2HealthUrl,
            status: response.status,
          });
          setApiHealthy("down");
          return;
        }

        let rawText = "";
        try {
          rawText = await response.text();
        } catch (error) {
          console.warn("[Header] Health response read failed:", error);
        }
        let payload: unknown = null;
        if (rawText) {
          try {
            payload = JSON.parse(rawText) as unknown;
          } catch {
            payload = null;
          }
        }
        const status = normalizeHealthStatus(payload, rawText);

        let overallStatus: "healthy" | "degraded" | "down";
        if (status === "ok") {
          overallStatus = "healthy";
        } else if (status === "degraded" || status === "unhealthy") {
          overallStatus = "degraded";
        } else {
          overallStatus = "down";
        }

        if (overallStatus !== "healthy") {
          console.warn("[Header] API V2 health degraded:", {
            url: apiV2HealthUrl,
            status: response.status,
            parsedStatus: status,
            raw: rawText,
            overallStatus,
          });
        }

        setApiHealthy(overallStatus);
      } catch (error) {
        if (isMounted) {
          const now = Date.now();
          if (now - lastHealthErrorLogRef.current > 60_000) {
            lastHealthErrorLogRef.current = now;
            console.warn("[Header] API health check failed:", {
              url: healthUrl,
              message: error instanceof Error ? error.message : String(error),
            });
          }
          setApiHealthy("down");
        }
      }
    };

    void checkHealth();

    const interval = setInterval(() => {
      if (isMounted) {
        void checkHealth();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.removeProperty("--electron-header-height");
      return;
    }

    const updateHeaderHeight = () => {
      const headerHeight = Math.max(
        0,
        Math.round(
          desktopHeaderRef.current?.getBoundingClientRect().height ?? 0,
        ),
      );
      document.documentElement.style.setProperty(
        "--electron-header-height",
        `${headerHeight}px`,
      );
    };

    const headerElement = desktopHeaderRef.current;
    const resizeObserver =
      headerElement && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeaderHeight())
        : null;

    updateHeaderHeight();
    if (headerElement) {
      resizeObserver?.observe(headerElement);
    }
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      resizeObserver?.disconnect();
      document.documentElement.style.removeProperty("--electron-header-height");
    };
  }, [isMobile]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (pathname === "/") {
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const headerSearchQuery = searchParams.get("q") ?? "";
  const isHomeActive = pathname === "/";
  const isLibraryActive = pathname.startsWith("/library");

  const submitHeaderSearch = (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      router.push("/", { scroll: false });
      return;
    }

    const params = new URLSearchParams();
    params.set("q", query);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const isElectronRuntime =
    typeof window !== "undefined" &&
    typeof (
      window as Window & {
        process?: { versions?: { electron?: string } };
      }
    ).process === "object" &&
    !!(
      window as Window & {
        process?: { versions?: { electron?: string } };
      }
    ).process?.versions?.electron;

  if (isMobile && isElectronRuntime) {
    return null;
  }

  return (
    <header
      ref={desktopHeaderRef}
      className="electron-app-header electron-header-drag theme-chrome-header fixed top-0 right-0 z-30 hidden border-b backdrop-blur-xl md:block"
      style={{ left: "var(--electron-sidebar-width, 0px)" }}
      suppressHydrationWarning
    >
      <div className="electron-header-drag electron-header-main relative z-10 grid grid-cols-[minmax(210px,auto)_minmax(0,1fr)_minmax(210px,auto)] gap-3 py-2">
        <div className="electron-no-drag electron-header-brand flex min-w-0 items-center gap-3">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex min-w-0 items-center gap-2 rounded-full px-1 py-1 transition-colors hover:bg-white/5"
          >
            <Image
              src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
              alt="Starchild Music"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg shadow-lg ring-1 ring-white/20 transition-all group-hover:scale-105"
              priority
            />
            <span className="header-logo-title accent-gradient truncate text-sm font-extrabold tracking-wide">
              Starchild
            </span>
            <span className="hidden text-[10px] font-medium tracking-[0.12em] text-[var(--color-muted)] uppercase xl:inline">
              Player
            </span>
          </Link>
        </div>

        <form
          className="electron-no-drag electron-header-search flex h-11 w-full items-center gap-2 rounded-full border px-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitHeaderSearch(headerSearchInputRef.current?.value ?? "");
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
          <input
            ref={headerSearchInputRef}
            key={headerSearchQuery || "__empty"}
            defaultValue={headerSearchQuery}
            className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
            placeholder="Search for songs, artists, or albums..."
            aria-label="Search music"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-1.5 text-xs font-bold text-[var(--color-on-accent)] transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Search</span>
          </button>
        </form>

        <div className="electron-no-drag flex min-w-0 items-center justify-end gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              isHomeActive
                ? "border-[rgba(244,178,102,0.4)] bg-[rgba(244,178,102,0.18)] text-[var(--color-text)]"
                : "border-[rgba(255,255,255,0.12)] text-[var(--color-subtext)] hover:border-[rgba(255,255,255,0.2)] hover:text-[var(--color-text)]"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Home</span>
          </Link>
          <Link
            href="/library"
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              isLibraryActive
                ? "border-[rgba(244,178,102,0.4)] bg-[rgba(244,178,102,0.18)] text-[var(--color-text)]"
                : "border-[rgba(255,255,255,0.12)] text-[var(--color-subtext)] hover:border-[rgba(255,255,255,0.2)] hover:text-[var(--color-text)]"
            }`}
          >
            <Library className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Library</span>
          </Link>
          {apiHealthy !== null && (
            <div
              className="api-health-pill hidden items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] px-2 py-0.5 text-xs text-[var(--color-subtext)] 2xl:flex"
              aria-label="API health status"
              title="API V2 health status"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  apiHealthy === "healthy"
                    ? "bg-emerald-400"
                    : apiHealthy === "degraded"
                      ? "bg-yellow-400"
                      : "bg-rose-400"
                }`}
              />
              <span>
                {apiHealthy === "healthy"
                  ? "API Healthy"
                  : apiHealthy === "degraded"
                    ? "API Degraded"
                    : "API Down"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
