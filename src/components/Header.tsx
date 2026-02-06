// File: src/components/Header.tsx

"use client";

import { env } from "@/env";
import { api } from "@/trpc/react";
import { normalizeHealthStatus } from "@/utils/healthStatus";
import { LogOut, Search, Shield, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = session?.user?.admin === true;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isDarkfloorHost, setIsDarkfloorHost] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<
    "healthy" | "degraded" | "down" | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastHealthErrorLogRef = useRef(0);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const electronHeaderRef = useRef<HTMLElement>(null);

  const { data: userProfile } = api.music.getCurrentUserProfile.useQuery(
    undefined,
    {
      enabled: !!session && !isElectron,
    },
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setHasHydrated(true);
      setIsElectron(!!window.electron?.isElectron);
      const hostname = window.location.hostname.toLowerCase();
      const isDarkfloor = hostname.includes("darkfloor");
      setIsDarkfloorHost(isDarkfloor);
    });

    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const apiV2HealthUrl = env.NEXT_PUBLIC_API_V2_HEALTH_URL;

    const healthUrl = (() => {
      if (!apiV2HealthUrl) return "/api/v2/health";

      try {
        const absolute = new URL(apiV2HealthUrl, window.location.origin);
        if (absolute.origin !== window.location.origin || isElectron) {
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
  }, [isElectron]);

  useEffect(() => {
    if (!isElectron) return;

    const updateHeaderHeight = () => {
      const headerHeight = Math.max(
        0,
        Math.round(
          electronHeaderRef.current?.getBoundingClientRect().height ?? 0,
        ),
      );
      document.documentElement.style.setProperty(
        "--electron-header-height",
        `${headerHeight}px`,
      );
    };

    const headerElement = electronHeaderRef.current;
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
  }, [isElectron]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut({ callbackUrl: "/" });
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If already on home page, clear search and scroll to top
    if (pathname === "/") {
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Navigate to home page
      router.push("/");
    }
  };

  const headerSearchQuery = searchParams.get("q") ?? "";

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

  const useElectronHeader = hasHydrated && isElectron;

  if (useElectronHeader) {
    return (
      <header
        ref={electronHeaderRef}
        className="electron-header-drag theme-chrome-header fixed top-0 right-0 left-0 z-30 border-b backdrop-blur-xl"
        suppressHydrationWarning
      >
        <div className="electron-header-drag electron-header-main relative z-10 flex flex-col gap-2 px-4 py-2">
          <form
            className="electron-no-drag electron-header-search flex w-full items-center gap-3 rounded-xl border px-4 py-2"
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
              className="rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-1.5 text-xs font-semibold text-[var(--color-on-accent)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Search
            </button>
          </form>

          <div className="electron-no-drag flex w-full min-w-0 items-center gap-2">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="group flex items-center gap-3"
            >
              <Image
                src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
                alt="Starchild Music"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[rgba(244,178,102,0.35)]"
                priority
              />
              <span className="header-logo-title accent-gradient truncate text-base font-bold">
                Starchild
              </span>
            </Link>
            {apiHealthy !== null && (
              <div
                className="api-health-pill hidden items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-xs text-[var(--color-subtext)] lg:flex"
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

  return (
    <>
      <header
        className="theme-chrome-header relative sticky top-0 z-30 border-b backdrop-blur-xl"
        suppressHydrationWarning
      >
        <div
          className="relative z-10 container py-3.5"
          suppressHydrationWarning
        >
          <form
            className="electron-no-drag hidden w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm md:flex"
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
              aria-label="Global search"
            />
            <button
              type="submit"
              className="rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-1.5 text-xs font-semibold text-[var(--color-on-accent)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Search
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                onClick={handleLogoClick}
                className="electron-no-drag group flex items-center gap-3"
              >
                <Image
                  src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
                  alt="Starchild Music"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[rgba(244,178,102,0.35)]"
                  priority
                />
                <div className="hidden items-center gap-2 md:flex">
                  <span
                    className="header-logo-title accent-gradient text-lg font-bold"
                    suppressHydrationWarning
                  >
                    Starchild Music
                  </span>
                </div>
              </Link>
              {apiHealthy !== null && (
                <div
                  className="api-health-pill hidden items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-xs text-[var(--color-subtext)] md:flex"
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
                      ? "Api Healthy"
                      : apiHealthy === "degraded"
                        ? "Api Degraded"
                        : "API Down"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              {}
              {isAdmin &&
                (isDarkfloorHost ? (
                  <Link
                    href="/admin"
                    className="hidden items-center transition-opacity hover:opacity-80 md:flex"
                    aria-label="Administrate"
                    title="Administrate"
                  >
                    <Shield className="h-5 w-5 text-[var(--color-text)]" />
                  </Link>
                ) : (
                  <Link
                    href="/admin"
                    className="header-icon-btn group hidden items-center text-[var(--color-subtext)] transition-all hover:text-[var(--color-text)] md:flex"
                    aria-label="Administrate"
                    title="Administrate"
                    suppressHydrationWarning
                  >
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all group-hover:scale-110"
                      suppressHydrationWarning
                    >
                      <Shield className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                ))}
              {/* Deployment switcher (server / Vercel) commented out – moving completely to Vercel
            {isDarkfloorHost ? (
              <Link
                href={
                  env.NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER ??
                  "https://starchildmusic.com"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center transition-opacity hover:opacity-80 md:flex"
                aria-label="View on custom server"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[var(--color-text)]"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : !isDarkfloorHost && env.NEXT_PUBLIC_NEXTAUTH_VERCEL_URL ? (
              <Link
                href={env.NEXT_PUBLIC_NEXTAUTH_VERCEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="header-icon-btn group hidden items-center text-[var(--color-subtext)] transition-all hover:text-[var(--color-text)] md:flex"
                aria-label="View on Vercel"
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all group-hover:scale-110">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 76 65"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-70 transition-opacity group-hover:opacity-100"
                  >
                    <path
                      d="M37.5274 0L75.0548 65H0L37.5274 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </Link>
            ) : null}
            */}
              {session ? (
                <div className="relative hidden md:block" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    {session.user?.image &&
                    failedImageUrl !== session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user?.name ?? "User"}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full ring-2 ring-white/10"
                        onError={() =>
                          setFailedImageUrl(session.user?.image ?? null)
                        }
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(244,178,102,0.4),rgba(88,198,177,0.4))] text-xs font-bold text-[var(--color-text)] shadow-lg shadow-[rgba(244,178,102,0.3)]">
                        {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="text-sm">{session.user?.name}</span>
                    <svg
                      className={`h-4 w-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {}
                  {showUserMenu && (
                    <div className="theme-panel animate-in fade-in slide-in-from-top-2 absolute right-0 mt-2 w-52 rounded-xl border p-1 shadow-xl backdrop-blur-lg duration-200">
                      <div className="space-y-1">
                        {userProfile?.userHash && (
                          <Link
                            href={`/${userProfile.userHash}`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-subtext)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-subtext)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-text)]"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/api/auth/signin" className="hidden md:block">
                  <button className="btn-primary transition-all hover:scale-105">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>

          <nav className="mt-3 hidden items-center gap-6 border-t border-[var(--color-border)]/70 pt-2.5 md:flex">
            <Link
              href="/"
              className="electron-no-drag text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Home
            </Link>
            <Link
              href={session ? "/library" : "/api/auth/signin"}
              className="electron-no-drag text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Library
            </Link>
            <Link
              href={session ? "/playlists" : "/api/auth/signin"}
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Playlists
            </Link>
            {session && (
              <Link
                href="/settings"
                className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
              >
                Settings
              </Link>
            )}
            <Link
              href={
                session && userProfile?.userHash
                  ? `/${userProfile.userHash}`
                  : "/api/auth/signin"
              }
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Profile
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
