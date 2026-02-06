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
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const useIsElectron = () => {
  const [isElectron] = useState(
    () => typeof window !== "undefined" && Boolean(window.electron?.isElectron),
  );
  return isElectron;
};

export function ElectronSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isElectron = useIsElectron();
  const isAdmin = session?.user?.admin === true;

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getOrDefault<boolean>(
      STORAGE_KEYS.DESKTOP_SIDEBAR_COLLAPSED,
      false,
    );
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const width = collapsed ? 72 : 260;

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
        href: session ? "/settings" : "/api/auth/signin",
        label: "Settings",
        icon: <Settings className="h-5 w-5" />,
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
      href: profileHref,
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    });

    return items;
  }, [session, profileHref, isAdmin]);

  const playlistsQuery = api.music.getPlaylists.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  if (!isElectron) return null;

  return (
    <>
      <aside
        className="electron-sidebar theme-chrome-sidebar relative sticky top-0 z-20 hidden h-screen shrink-0 border-r md:flex"
        style={{ width }}
      >
        {/* Drawer-style toggle button */}
        {/* Offset down by 10% */}
        <button
          className="electron-no-drag absolute top-[10%] -right-3 flex h-12 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] opacity-90 shadow-sm transition-opacity hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
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

        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="px-3 pt-3 pb-3">
            <div className="flex items-center justify-center">
              <Image
                src="/AppIcons/Assets.xcassets/AppIcon.appiconset/48.png"
                alt="Starchild"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-lg ring-2 ring-[rgba(244,178,102,0.3)]"
                priority
              />
              {!collapsed && (
                <div className="ml-4 min-w-0">
                  <div className="header-logo-title accent-gradient truncate text-base font-bold">
                    Starchild
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="px-2">
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
                    className={`electron-no-drag flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                        : "text-[var(--color-subtext)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-4 min-h-0 flex-1 px-2 pb-24">
            <div className="flex items-center justify-between px-2">
              {!collapsed ? (
                <div className="text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
                  Playlists
                </div>
              ) : (
                <div className="h-3" />
              )}

              <button
                className="electron-no-drag flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
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
                  className="electron-no-drag block rounded-lg px-3 py-2 text-sm text-[var(--color-subtext)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
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
                        className={`electron-no-drag flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                            : "text-[var(--color-subtext)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                        }`}
                        title={collapsed ? playlist.name : undefined}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-hover)] text-xs font-bold text-[var(--color-text)]">
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
                      className="electron-no-drag inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
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
                  className="electron-no-drag inline-flex items-center gap-2 text-xs font-medium text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                >
                  <ListMusic className="h-4 w-4" />
                  All playlists
                </Link>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="space-y-2 px-3 pb-3">
              <button
                className="electron-no-drag flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-2 text-sm font-semibold text-[var(--color-on-accent)] shadow-[var(--accent-btn-shadow)] transition hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New playlist
              </button>
              {session ? (
                <button
                  className="electron-no-drag flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-subtext)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : null}
            </div>
          )}
          {collapsed && session ? (
            <div className="px-2 pb-3">
              <button
                className="electron-no-drag flex h-9 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
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
