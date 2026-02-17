// File: apps/web/src/contexts/PlaylistContextMenuContext.tsx

"use client";

import type { Track } from "@starchild/types";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface PlaylistContextMenuItem {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  trackCount: number;
  tracks: Array<{
    id: number;
    track: Track;
    position: number;
    addedAt: Date;
  }>;
}

interface MenuPosition {
  x: number;
  y: number;
}

interface PlaylistContextMenuContextType {
  playlist: PlaylistContextMenuItem | null;
  position: MenuPosition | null;
  openMenu: (playlist: PlaylistContextMenuItem, x: number, y: number) => void;
  closeMenu: () => void;
}

const PlaylistContextMenuContext = createContext<PlaylistContextMenuContextType | undefined>(
  undefined,
);

export function PlaylistContextMenuProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<PlaylistContextMenuItem | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const openMenu = useCallback((playlist: PlaylistContextMenuItem, x: number, y: number) => {
    setPlaylist(playlist);
    setPosition({ x, y });
  }, []);

  const closeMenu = useCallback(() => {
    setPlaylist(null);
    setPosition(null);
  }, []);

  return (
    <PlaylistContextMenuContext.Provider
      value={{ playlist, position, openMenu, closeMenu }}
    >
      {children}
    </PlaylistContextMenuContext.Provider>
  );
}

export function usePlaylistContextMenu() {
  const context = useContext(PlaylistContextMenuContext);
  if (!context) {
    throw new Error("usePlaylistContextMenu must be used within PlaylistContextMenuProvider");
  }
  return context;
}
