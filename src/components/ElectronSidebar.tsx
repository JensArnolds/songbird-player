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
  Plus,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const useIsElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    setIsElectron(Boolean(window.electron?.isElectron));
  }, []);
  return isElectron;
};

export function ElectronSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isElectron = useIsElectron();

  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    const value = localStorage.getOrDefault<boolean>(
      STORAGE_KEYS.DESKTOP_SIDEBAR_COLLAPSED,
      false,
    );
    setCollapsed(value === true);
  }, [isElectron]);

  const width = collapsed ? 72 : 260;

  const navItems: NavItem[] = useMemo(
    () => [
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
    ],
    [session],
  );

  const playlistsQuery = api.music.getPlaylists.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  });

  if (!isElectron) return null;

  return (
    <>
      <aside
        className="electron-sidebar theme-chrome-sidebar sticky top-0 z-20 hidden h-screen shrink-0 border-r md:flex"
        style={{ width }}
      >
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="px-3 pb-3 pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] text-[var(--color-on-accent)] shadow-[var(--accent-btn-shadow)]">
                  S
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[var(--color-text)]">
                      Starchild
                    </div>
                    <div className="truncate text-xs text-[var(--color-subtext)]">
                      Desktop
                    </div>
                  </div>
                )}
              </div>

              <button
                className="electron-no-drag flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-subtext)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                onClick={() => {
                  const next = !collapsed;
                  setCollapsed(next);
                  localStorage.set(STORAGE_KEYS.DESKTOP_SIDEBAR_COLLAPSED, next);
                }}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
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
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-4 min-h-0 flex-1 px-2 pb-24">
            <div className="flex items-center justify-between px-2">
              {!collapsed ? (
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
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
            <div className="px-3 pb-3">
              <button
                className="electron-no-drag flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-strong))] px-3 py-2 text-sm font-semibold text-[var(--color-on-accent)] shadow-[var(--accent-btn-shadow)] transition hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New playlist
              </button>
            </div>
          )}
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}

