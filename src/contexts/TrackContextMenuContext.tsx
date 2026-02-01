// File: src/contexts/TrackContextMenuContext.tsx

"use client";

import type { Track } from "@/types";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface MenuPosition {
  x: number;
  y: number;
}

export interface RemoveFromListOption {
  label: string;
  onRemove: () => void;
}

export type OpenMenuOptions =
  | number
  | { excludePlaylistId?: number; removeFromList?: RemoveFromListOption }
  | undefined;

interface TrackContextMenuContextType {
  track: Track | null;
  position: MenuPosition | null;
  excludePlaylistId?: number;
  removeFromList?: RemoveFromListOption;
  openMenu: (track: Track, x: number, y: number, options?: OpenMenuOptions) => void;
  closeMenu: () => void;
}

const TrackContextMenuContext = createContext<TrackContextMenuContextType | undefined>(
  undefined,
);

export function TrackContextMenuProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<Track | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [excludePlaylistId, setExcludePlaylistId] = useState<number | undefined>(undefined);
  const [removeFromList, setRemoveFromList] = useState<RemoveFromListOption | undefined>(undefined);

  const openMenu = useCallback(
    (track: Track, x: number, y: number, options?: OpenMenuOptions) => {
      setTrack(track);
      setPosition({ x, y });
      if (options === undefined) {
        setExcludePlaylistId(undefined);
        setRemoveFromList(undefined);
      } else if (typeof options === "number") {
        setExcludePlaylistId(options);
        setRemoveFromList(undefined);
      } else {
        setExcludePlaylistId(options.excludePlaylistId);
        setRemoveFromList(options.removeFromList);
      }
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setTrack(null);
    setPosition(null);
    setExcludePlaylistId(undefined);
    setRemoveFromList(undefined);
  }, []);

  return (
    <TrackContextMenuContext.Provider
      value={{ track, position, excludePlaylistId, removeFromList, openMenu, closeMenu }}
    >
      {children}
    </TrackContextMenuContext.Provider>
  );
}

export function useTrackContextMenu() {
  const context = useContext(TrackContextMenuContext);
  if (!context) {
    throw new Error("useTrackContextMenu must be used within TrackContextMenuProvider");
  }
  return context;
}
