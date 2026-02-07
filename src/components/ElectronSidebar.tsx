// File: src/components/ElectronSidebar.tsx

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { CreatePlaylistModal } from "@/components/CreatePlaylistModal";
import { api } from "@/trpc/react";
import { localStorage } from "@/services/storage";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Library,
  ListMusic,
  LogOut,
  Plus,
  Shield,
  Settings,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function ElectronSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.admin === true;

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getOrDefault<boolean>(
      STORAGE_KEYS.DESKTOP_SIDEBAR_COLLAPSED,
      false,
    );
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const width = collapsed ? 76 : 272;

  // Set sidebar width CSS variable (used by Header positioning)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--electron-sidebar-width",
      `${width}px`,
    );
  }, [width]);

  // Clean up CSS variable only on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--electron-sidebar-width");
    };
  }, []);

  const { data: userHash } = api.music.getCurrentUserHash.useQuery(undefined, {
    enabled: !!session,
  });

  const profileHref = session
    ? userHash
      ? `/${userHash}`
      : "/settings"
    : "/api/auth/signin";

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
      {
        href: session ? "/library" : "/api/auth/signin",
        label: "Library",
        icon: <Library className="h-5 w-5" />,
      },
      {
        href: session ? "/playlists" : "/api/auth/signin",
        label: "Playlists",
        icon: <ListMusic className="h-5 w-5" />,
      },
      {
        href: profileHref,
        label: "Profile",
        icon: <User className="h-5 w-5" />,
      },
    ];

    if (isAdmin) {
      items.push({
        href: "/admin",
        label: "Admin",
        icon: <Shield className="h-5 w-5" />,
      });
    }

    items.push({
      href: session ? "/settings" : "/api/auth/signin",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    });

    return items;
  }, [session, profileHref, isAdmin]);

  const playlistsQuery = api.music.getPlaylists.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <aside
        className="electron-sidebar theme-chrome-sidebar relative sticky top-0 z-20 hidden h-screen shrink-0 border-r md:flex"
        style={{ width }}
      >
        {/* Drawer-style toggle button */}
        {/* Offset down by 10% */}
        <button
          className="electron-no-drag absolute top-[9%] -right-3 flex h-11 w-6 items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(30,30,30,0.95)] text-[var(--color-subtext)] opacity-95 shadow-sm transition-all hover:border-[rgba(244,178,102,0.35)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.set(STORAGE_KEYS.DESKTOP_SIDEBAR_COLLAPSED, next);
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex h-full min-h-0 w-full flex-col bg-[linear-gradient(180deg,rgba(22,22,22,0.98),rgba(10,10,10,0.98))]">
          <div className="px-3 pt-4 pb-3">
            <div
              className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} rounded-xl px-2 py-1.5`}
            >
              <Image
                src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
                alt="Starchild"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.35)]"
                priority
              />
              {!collapsed && (
                <div className="ml-4 min-w-0">
                  <div className="header-logo-title accent-gradient truncate text-base font-bold tracking-wide">
                    Starchild
                  </div>
                  <div className="truncate text-[10px] font-medium tracking-[0.16em] text-[var(--color-muted)] uppercase">
                    Your music hub
                  </div>
                </div>
              )}
            </div>
          </div>

          {!collapsed && (
            <div className="px-4 pb-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--color-muted)] uppercase">
              Menu
            </div>
          )}

          <nav className="px-2 pb-2">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`electron-no-drag group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? "bg-[rgba(244,178,102,0.16)] text-[var(--color-text)] shadow-[0_6px_18px_rgba(244,178,102,0.16)]"
                        : "text-[var(--color-subtext)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-text)]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {!collapsed && (
                      <span
                        className={`absolute top-2 bottom-2 left-0 w-1 rounded-r-full transition-opacity ${
                          active
                            ? "bg-[var(--color-accent)] opacity-100"
                            : "opacity-0 group-hover:bg-white/40 group-hover:opacity-100"
                        }`}
                      />
                    )}
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="truncate font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-2 min-h-0 flex-1 px-2 pb-24">
            <div className="flex items-center justify-between px-2">
              {!collapsed ? (
                <div className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-muted)] uppercase">
                  Your Library
                </div>
              ) : (
                <div className="h-3" />
              )}

              <button
                className="electron-no-drag flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[var(--color-subtext)] transition-colors hover:border-[rgba(244,178,102,0.35)] hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                onClick={() => setCreateModalOpen(true)}
                aria-label="Create playlist"
                title="Create playlist"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 min-h-0 overflow-y-auto pr-1">
              {!session ? (
                <Link
                  href="/api/auth/signin"
                  className="electron-no-drag block rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-sm text-[var(--color-subtext)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                >
                  {!collapsed ? "Sign in to view playlists" : "Sign in"}
                </Link>
              ) : playlistsQuery.isLoading ? (
                <div className="px-3 py-2 text-sm text-[var(--color-subtext)]">
                  {!collapsed ? "Loading..." : "…"}
                </div>
              ) : playlistsQuery.data && playlistsQuery.data.length > 0 ? (
                <div className="space-y-1">
                  {playlistsQuery.data.slice(0, 50).map((playlist) => {
                    const href = `/playlists/${playlist.id}`;
                    const active = pathname === href;
                    return (
                      <Link
                        key={playlist.id}
                        href={href}
                        className={`electron-no-drag flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                          active
                            ? "bg-[rgba(255,255,255,0.14)] text-[var(--color-text)]"
                            : "text-[var(--color-subtext)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--color-text)]"
                        }`}
                        title={collapsed ? playlist.name : undefined}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.1)] text-xs font-bold text-[var(--color-text)]">
                          {playlist.name?.charAt(0)?.toUpperCase() ?? "P"}
                        </div>
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{playlist.name}</div>
                            <div className="truncate text-xs text-[var(--color-muted)]">
                              {(playlist.trackCount ?? 0).toString()} tracks
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-[var(--color-subtext)]">
                  {!collapsed ? (
                    <button
                      className="electron-no-drag inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm text-[var(--color-text)] hover:border-[rgba(244,178,102,0.35)] hover:bg-[rgba(244,178,102,0.1)]"
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create your first playlist
                    </button>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="mt-3 px-2">
                <Link
                  href="/playlists"
                  className="electron-no-drag inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                >
                  <ListMusic className="h-4 w-4" />
                  See all playlists
                </Link>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="space-y-2 px-3 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
              <button
                className="electron-no-drag flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-2.5 text-sm font-semibold text-[var(--color-on-accent)] shadow-[var(--accent-btn-shadow)] transition hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New playlist
              </button>
              {session ? (
                <button
                  className="electron-no-drag flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm font-semibold text-[var(--color-subtext)] transition hover:border-[rgba(255,255,255,0.24)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : null}
            </div>
          )}
          {collapsed && session ? (
            <div className="px-2 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
              <button
                className="electron-no-drag flex h-9 w-full items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.06)] text-[var(--color-subtext)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                onClick={() => void signOut({ callbackUrl: "/" })}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
