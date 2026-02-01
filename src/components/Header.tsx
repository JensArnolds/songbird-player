// File: src/components/Header.tsx

"use client";

import { env } from "@/env";
import { api } from "@/trpc/react";
import { normalizeHealthStatus } from "@/utils/healthStatus";
import { LogOut, Shield, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.admin === true;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isVercelDeployment, setIsVercelDeployment] = useState(false);
  const [isDarkfloorHost, setIsDarkfloorHost] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<"healthy" | "degraded" | "down" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: userProfile } = api.music.getCurrentUserProfile.useQuery(
    undefined,
    {
      enabled: !!session,
    },
  );

  useEffect(() => {
    setIsElectron(!!window.electron?.isElectron);

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      const isDarkfloor = hostname.includes("darkfloor");
      setIsDarkfloorHost(isDarkfloor);
      setIsVercelDeployment(isDarkfloor);
    }
  }, []);

  useEffect(() => {
    // Check both API health endpoints
    const apiHealthUrl = env.NEXT_PUBLIC_API_HEALTH_URL;
    const apiV2HealthUrl = env.NEXT_PUBLIC_API_V2_HEALTH_URL;

    if (!apiHealthUrl || !apiV2HealthUrl) {
      console.warn("[Header] API health URLs not configured, skipping health check");
      return;
    }

    let isMounted = true;

    const checkHealth = async () => {
      try {
        // Check both APIs in parallel
        const [apiResponse, apiV2Response] = await Promise.all([
          fetch(apiHealthUrl, { cache: "no-store", mode: "cors" }),
          fetch(apiV2HealthUrl, { cache: "no-store", mode: "cors" })
        ]);

        if (!isMounted) return;

        // Check HTTP status codes first
        const apiHttpError = apiResponse.status >= 400 && apiResponse.status < 600;
        const apiV2HttpError = apiV2Response.status >= 400 && apiV2Response.status < 600;

        // If either API has HTTP errors, show red (API down)
        if (apiHttpError || apiV2HttpError) {
          console.warn("[Header] API HTTP error:", {
            api: { url: apiHealthUrl, status: apiResponse.status },
            apiV2: { url: apiV2HealthUrl, status: apiV2Response.status }
          });
          setApiHealthy("down"); // Red
          return;
        }

        const readStatus = async (response: Response) => {
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
          return {
            rawText,
            status: normalizeHealthStatus(payload, rawText),
          };
        };

        // Parse responses (supports JSON or plain text "ok")
        const [apiResult, apiV2Result] = await Promise.all([
          readStatus(apiResponse),
          readStatus(apiV2Response),
        ]);

        const apiStatus = apiResult.status;
        const apiV2Status = apiV2Result.status;

        // Determine overall health status
        let overallStatus: "healthy" | "degraded" | "down";

        if (apiStatus === "ok" && apiV2Status === "ok") {
          overallStatus = "healthy"; // Green
        } else if (
          apiStatus === "degraded" ||
          apiV2Status === "degraded" ||
          apiStatus === "unhealthy" ||
          apiV2Status === "unhealthy"
        ) {
          overallStatus = "degraded"; // Yellow
        } else {
          // Unexpected status or missing status field
          overallStatus = "down"; // Red
        }

        if (overallStatus !== "healthy") {
          console.warn("[Header] API health degraded:", {
            api: {
              url: apiHealthUrl,
              status: apiResponse.status,
              apiStatus,
              raw: apiResult.rawText,
            },
            apiV2: {
              url: apiV2HealthUrl,
              status: apiV2Response.status,
              apiV2Status,
              raw: apiV2Result.rawText,
            },
            overallStatus
          });
        }

        setApiHealthy(overallStatus);
      } catch (error) {
        if (isMounted) {
          console.error("[Header] API health check network error:", error);
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
    if (session?.user?.image) {
      setImageError(false);
    }
  }, [session?.user?.image]);

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

  return (
    <>
      <header
        className="theme-chrome-header sticky top-0 z-30 border-b backdrop-blur-xl"
        suppressHydrationWarning
      >
        <div className="container flex items-center justify-between py-3.5">
          {}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="group flex items-center gap-3"
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
                  {isElectron ? "Starchild" : "Starchild Music"}
                </span>
              </div>
            </Link>
            {apiHealthy !== null && (
              <div
                className="api-health-pill hidden items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-xs text-[var(--color-subtext)] md:flex"
                aria-label="API health status"
                title="Combined API health status"
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

          {}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
            >
              Home
            </Link>
            <Link
              href={session ? "/library" : "/api/auth/signin"}
              className="text-sm font-medium text-[var(--color-subtext)] transition-all hover:scale-105 hover:text-[var(--color-text)]"
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

          {}
          <div className="flex items-center gap-3">
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
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all group-hover:scale-110" suppressHydrationWarning>
                    <Shield className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
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
                suppressHydrationWarning
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all group-hover:scale-110" suppressHydrationWarning>
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
            {session ? (
              <div className="relative hidden md:block" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-secondary flex items-center gap-2 transition-all hover:scale-105"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {session.user?.image && !imageError ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name ?? "User"}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full ring-2 ring-white/10"
                      onError={() => setImageError(true)}
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
      </header>
    </>
  );
}
