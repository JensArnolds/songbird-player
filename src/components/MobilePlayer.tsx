// File: src/components/MobilePlayer.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/contexts/ToastContext";
import { useAudioReactiveBackground } from "@/hooks/useAudioReactiveBackground";
import type { QueuedTrack, SimilarityPreference, Track } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { QueueSettingsModal } from "@/components/QueueSettingsModal";
import {
  extractColorsFromImage,
  type ColorPalette,
} from "@/utils/colorExtractor";
import {
  getAudioConnection,
  getOrCreateAudioConnection,
  releaseAudioConnection,
} from "@/utils/audioContextManager";
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
  hapticSliderContinuous,
  hapticSliderEnd,
  haptic,
} from "@/utils/haptics";
import { getCoverImage } from "@/utils/images";
import { STORAGE_KEYS } from "@/config/storage";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { springPresets } from "@/utils/spring-animations";
import { formatTime } from "@/utils/time";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  ChevronDown,
  GripVertical,
  Heart,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Save,
  Search,
  Settings,
  Sparkles,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration } from "@/utils/time";

interface QueueItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  isSmartTrack?: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onToggleSelect: (e: React.MouseEvent | React.TouchEvent) => void;
  onTouchEnd: () => void;
  canRemove: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onReorder: (newIndex: number) => void;
}

function QueueItem({
  track,
  index,
  isActive,
  isSelected,
  isSmartTrack,
  onPlay,
  onRemove,
  onToggleSelect,
  onTouchEnd,
  canRemove,
  onDragStart,
  onDragEnd,
  isDragging,
  onReorder,
}: QueueItemProps) {
  const [dragY, setDragY] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(index);

  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  const coverImage = getCoverImage(track, "small");
  const altText = track.album?.title?.trim()?.length
    ? `${track.album.title} cover art`
    : `${track.title} cover art`;

  const artistName = track.artist?.name?.trim()?.length
    ? track.artist.name
    : "Unknown Artist";
  const albumTitle = track.album?.title?.trim()?.length
    ? track.album.title
    : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startYRef.current = e.touches[0].clientY;
      onDragStart();
    }
    onToggleSelect(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && startYRef.current !== 0) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      
      if (Math.abs(deltaY) > 10) {
        setDragY(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(dragY) > 30) {
      const itemsMoved = dragY > 0 ? 1 : -1;
      const newIndex = index + itemsMoved;
      if (newIndex >= 0) {
        onReorder(newIndex);
      }
    }
    setDragY(0);
    startYRef.current = 0;
    onDragEnd();
    onTouchEnd();
  };

  return (
    <motion.div
      ref={itemRef}
      initial={false}
      animate={{
        y: isDragging ? dragY : 0,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={`group relative flex items-center gap-3 p-3 transition-colors touch-none ${
        isSelected
          ? "bg-[rgba(88,198,177,0.18)] ring-2 ring-[rgba(88,198,177,0.4)]"
          : isActive
            ? "bg-[rgba(244,178,102,0.16)] ring-1 ring-[rgba(244,178,102,0.3)]"
            : isSmartTrack
              ? "bg-[rgba(88,198,177,0.04)] active:bg-[rgba(88,198,177,0.08)]"
              : "active:bg-[rgba(244,178,102,0.08)]"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onPlay();
      }}
    >
      {/* Smart track indicator */}
      {isSmartTrack && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-accent-strong)] rounded-r" />
      )}

      {/* Drag handle */}
      <button
        className="flex-shrink-0 text-[var(--color-muted)] transition-colors active:text-[var(--color-text)]"
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Index */}
      <div className="w-6 flex-shrink-0 text-center text-sm text-[var(--color-muted)]">
        {index + 1}
      </div>

      {/* Cover image with play button */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-[rgba(255,255,255,0.05)]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={altText}
            fill
            sizes="48px"
            className="object-cover"
            quality={75}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
            🎵
          </div>
        )}
        {/* Play button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
        >
          <Play className="h-5 w-5 fill-white text-white" />
        </button>
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-[var(--color-text)]">
          {track.title}
        </h4>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-subtext)]">
          <span className="truncate">{artistName}</span>
          {albumTitle && (
            <>
              <span className="text-[var(--color-muted)]">•</span>
              <span className="truncate">{albumTitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Duration */}
      <span className="flex-shrink-0 text-xs text-[var(--color-muted)] tabular-nums">
        {formatDuration(track.duration)}
      </span>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100 active:bg-[rgba(244,178,102,0.12)]"
          aria-label="Remove from queue"
        >
          <X className="h-4 w-4 text-[var(--color-subtext)] transition-colors active:text-[var(--color-text)]" />
        </button>
      )}
    </motion.div>
  );
}

interface MobilePlayerProps {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  isLoading: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onToggleQueue?: () => void;
  onToggleEqualizer?: () => void;
  onClose?: () => void;
  forceExpanded?: boolean;
}

export default function MobilePlayer(props: MobilePlayerProps) {
  const {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isLoading,
    onPlayPause,
    onNext,
    onPrevious,
    onSeek,
    onVolumeChange,
    onToggleMute,
    onToggleShuffle,
    onCycleRepeat,
    onSkipForward,
    onSkipBackward,
    onToggleQueue,
    onToggleEqualizer,
    onClose,
    forceExpanded = false,
  } = props;

  const {
    audioElement: contextAudioElement,
    addSmartTracks,
    refreshSmartTracks,
    smartQueueState,
    queuedTracks,
    playFromQueue,
    removeFromQueue,
    reorderQueue,
    saveQueueAsPlaylist,
    clearQueue,
    clearSmartTracks,
  } = useGlobalPlayer();
  const { showToast } = useToast();

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const utils = api.useUtils();

  const { data: preferences } = api.music.getUserPreferences.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );

  // Load smart queue settings
  const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: currentTrack?.id ?? 0 },
    { enabled: !!currentTrack && isAuthenticated },
  );

  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [albumColorPalette, setAlbumColorPalette] =
    useState<ColorPalette | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [seekDirection, setSeekDirection] = useState<
    "forward" | "backward" | null
  >(null);
  const [isAdjustingVolume, setIsAdjustingVolume] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [showEqualizerPanel, setShowEqualizerPanel] = useState(false);
  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [selectedQueueIndices, setSelectedQueueIndices] = useState<Set<number>>(new Set());
  const [lastSelectedQueueIndex, setLastSelectedQueueIndex] = useState<number | null>(null);
  const [showQueueSettingsModal, setShowQueueSettingsModal] = useState(false);
  const [smartTracksCount, setSmartTracksCount] = useState(5);
  const [similarityLevel, setSimilarityLevel] = useState<SimilarityPreference>("balanced");
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumeDragValueRef = useRef(volume);
  const isAdjustingVolumeRef = useRef(false);
  const volumeConnectionElementRef = useRef<HTMLAudioElement | null>(null);

  const { data: playlists, refetch: refetchPlaylists } =
    api.music.getPlaylists.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: () => {
      hapticMedium();
      setShowPlaylistSelector(false);
      void refetchPlaylists();
    },
    onError: (error) => {
      console.error("Failed to add to playlist:", error);
      hapticMedium();
    },
  });

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      if (currentTrack) {
        await utils.music.isFavorite.invalidate({ trackId: currentTrack.id });
        await utils.music.getFavorites.invalidate();
      }
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      if (currentTrack) {
        await utils.music.isFavorite.invalidate({ trackId: currentTrack.id });
        await utils.music.getFavorites.invalidate();
      }
    },
  });

  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 100], [1, 0.7]);
  const artworkScale = useTransform(dragY, [0, 100], [1, 0.9]);

  const seekX = useMotionValue(0);

  const shouldIgnoreTouch = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("[data-drag-exempt='true']")) return true;
    return Boolean(
      target.closest("button") ??
        target.closest("input") ??
        target.closest("select"),
    );
  };

  const handlePlayPause = useCallback(() => {
    hapticMedium();
    onPlayPause();
  }, [onPlayPause]);

  const handleNext = useCallback(() => {
    hapticLight();
    onNext();
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    hapticLight();
    onPrevious();
  }, [onPrevious]);

  const handleToggleShuffle = () => {
    hapticLight();
    onToggleShuffle();
  };

  const handleCycleRepeat = () => {
    hapticLight();
    onCycleRepeat();
  };

  // Load smart queue settings
  useEffect(() => {
    if (smartQueueSettings) {
      setSmartTracksCount(smartQueueSettings.autoQueueCount);
      setSimilarityLevel(smartQueueSettings.similarityPreference);
    }
  }, [smartQueueSettings]);

  const handleSmartQueueAction = useCallback(
    async (action: "add" | "refresh") => {
      try {
        if (action === "refresh") {
          await refreshSmartTracks();
          showToast("Smart tracks refreshed", "success");
          return;
        }

        const added = await addSmartTracks();
        if (added.length === 0) {
          showToast("No smart tracks found for this song", "info");
        } else {
          showToast(
            `Added ${added.length} smart track${added.length === 1 ? "" : "s"}`,
            "success",
          );
        }
      } catch (error) {
        console.error("[MobilePlayer] Smart tracks action failed:", error);
        showToast("Failed to update smart tracks", "error");
      }
    },
    [addSmartTracks, refreshSmartTracks, showToast],
  );

  const handleApplyQueueSettings = useCallback(
    async (settings: { count: number; similarityLevel: SimilarityPreference }) => {
      try {
        setSmartTracksCount(settings.count);
        setSimilarityLevel(settings.similarityLevel);
        const added = await addSmartTracks({
          count: settings.count,
          similarityLevel: settings.similarityLevel,
        });
        if (added.length === 0) {
          showToast("No smart tracks found for this song", "info");
        } else {
          showToast(`Added ${added.length} smart track${added.length === 1 ? "" : "s"}`, "success");
        }
      } catch (error) {
        console.error("[MobilePlayer] Failed to add smart tracks with custom settings:", error);
        showToast("Failed to add smart tracks", "error");
      }
    },
    [addSmartTracks, showToast],
  );

  // Queue data processing
  const queueEntries = useMemo(
    () =>
      queuedTracks.map((qt, index) => ({
        track: qt.track,
        index,
        queueId: qt.queueId,
        isSmartTrack: qt.queueSource === 'smart',
      })),
    [queuedTracks],
  );

  const filteredQueue = useMemo(() => {
    if (!queueSearchQuery.trim()) {
      return queueEntries;
    }

    const normalizedQuery = queueSearchQuery.toLowerCase();
    return queueEntries.filter(
      ({ track }) =>
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.name.toLowerCase().includes(normalizedQuery),
    );
  }, [queueEntries, queueSearchQuery]);

  const filteredNowPlaying = filteredQueue.length > 0 ? filteredQueue[0] : null;
  const filteredUserTracks = useMemo(() => {
    return filteredQueue.slice(1).filter(entry => !entry.isSmartTrack);
  }, [filteredQueue]);

  const filteredSmartTracks = useMemo(() => {
    return filteredQueue.slice(1).filter(entry => entry.isSmartTrack);
  }, [filteredQueue]);

  const totalDuration = useMemo(() => {
    return queue.reduce((acc, track) => acc + track.duration, 0);
  }, [queue]);

  const handleToggleQueueSelect = useCallback((index: number, shiftKey: boolean = false) => {
    setSelectedQueueIndices((prev) => {
      const newSet = new Set(prev);

      if (shiftKey && lastSelectedQueueIndex !== null) {
        const start = Math.min(lastSelectedQueueIndex, index);
        const end = Math.max(lastSelectedQueueIndex, index);
        for (let i = start; i <= end; i++) {
          if (i !== 0) {
            newSet.add(i);
          }
        }
      } else {
        if (index !== 0) {
          if (newSet.has(index)) {
            newSet.delete(index);
          } else {
            newSet.add(index);
          }
        }
      }

      return newSet;
    });

    if (!shiftKey || lastSelectedQueueIndex === null) {
      setLastSelectedQueueIndex(index);
    }
  }, [lastSelectedQueueIndex]);

  const handleRemoveSelectedQueueItems = useCallback(() => {
    if (selectedQueueIndices.size === 0) return;

    const sortedIndices = Array.from(selectedQueueIndices).sort((a, b) => b - a);

    sortedIndices.forEach(index => {
      removeFromQueue(index);
    });

    setSelectedQueueIndices(new Set());
    setLastSelectedQueueIndex(null);
    hapticSuccess();
    showToast(`Removed ${sortedIndices.length} track${sortedIndices.length === 1 ? '' : 's'} from queue`, 'success');
  }, [selectedQueueIndices, removeFromQueue, showToast]);

  const handleClearQueueSelection = useCallback(() => {
    setSelectedQueueIndices(new Set());
    setLastSelectedQueueIndex(null);
  }, []);

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const toggleFavorite = () => {
    if (!currentTrack || !isAuthenticated) return;

    if (favoriteData?.isFavorite) {
      hapticLight();
      removeFavorite.mutate({ trackId: currentTrack.id });
    } else {
      hapticSuccess();
      addFavorite.mutate({ track: currentTrack });
    }
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 600);
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  useEffect(() => {
    if (currentTrack) {
      const coverUrl = getCoverImage(currentTrack, "big");
      extractColorsFromImage(coverUrl)
        .then(setAlbumColorPalette)
        .catch((error) => {
          console.error("Failed to extract colors:", error);
          setAlbumColorPalette(null);
        });
    } else {
      setAlbumColorPalette(null);
    }
  }, [currentTrack]);

  useEffect(() => {

    if (contextAudioElement) {
      setAudioElement(contextAudioElement);
    } else if (typeof window !== "undefined") {
      const audio = document.querySelector("audio");
      if (audio) {
        setAudioElement(audio);
      }
    }
  }, [contextAudioElement]);

  const getVolumeTargetAudio = useCallback(() => {
    return (
      contextAudioElement ||
      audioElement ||
      (typeof document !== "undefined"
        ? (document.querySelector(
            'audio[data-audio-element="global-player"]',
          ) as HTMLAudioElement | null)
        : null)
    );
  }, [contextAudioElement, audioElement]);

  const ensureVolumeConnection = useCallback(() => {
    if (volumeConnectionElementRef.current) {
      return volumeConnectionElementRef.current;
    }

    const targetAudio = getVolumeTargetAudio();
    if (!targetAudio) return null;

    const connection = getOrCreateAudioConnection(targetAudio);
    if (!connection) return null;

    volumeConnectionElementRef.current = targetAudio;
    return targetAudio;
  }, [getVolumeTargetAudio]);

  const applyVolumeToAudio = useCallback(
    (nextVolume: number) => {
      const targetAudio = ensureVolumeConnection() ?? getVolumeTargetAudio();
      if (!targetAudio) return;

      const effectiveVolume = isMuted ? 0 : nextVolume;
      const connection = getAudioConnection(targetAudio);

      if (connection?.gainNode) {
        connection.gainNode.gain.value = effectiveVolume;
        if (targetAudio.volume !== 1) {
          targetAudio.volume = 1;
        }
      } else {
        targetAudio.volume = effectiveVolume;
      }
    },
    [ensureVolumeConnection, getVolumeTargetAudio, isMuted],
  );

  useEffect(() => {
    return () => {
      if (volumeConnectionElementRef.current) {
        releaseAudioConnection(volumeConnectionElementRef.current);
        volumeConnectionElementRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (preferences) {
      setVisualizerEnabled(preferences.visualizerEnabled ?? true);
    }
  }, [preferences]);

  useEffect(() => {
    if (isAuthenticated) return;
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEYS.VISUALIZER_ENABLED);
    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);
        setVisualizerEnabled(parsed === true);
      } catch {

        setVisualizerEnabled(stored === "true");
      }
    }
  }, [isAuthenticated]);

  useAudioReactiveBackground(audioElement, isPlaying, visualizerEnabled);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = isSeeking ? seekTime : currentTime;
  const displayVolume = isAdjustingVolume ? localVolume : volume;

  // Sync local volume when prop changes (but not during adjustment)
  useEffect(() => {
    if (!isAdjustingVolume) {
      setLocalVolume(volume);
      volumeDragValueRef.current = volume;
      isAdjustingVolumeRef.current = false;
    }
  }, [volume, isAdjustingVolume]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    hapticLight();
    onSeek(percentage * duration);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setIsSeeking(true);
    setSeekTime(percentage * duration);
  };

  const handleProgressTouchEnd = () => {
    if (isSeeking) {
      hapticLight();
      onSeek(seekTime);
      setIsSeeking(false);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    volumeDragValueRef.current = percentage;
    setLocalVolume(percentage);
    applyVolumeToAudio(percentage);
    onVolumeChange(percentage);
    haptic("selection");
  };

  const handleVolumeTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    isAdjustingVolumeRef.current = true;
    setIsAdjustingVolume(true);
    volumeDragValueRef.current = percentage;
    setLocalVolume(percentage);
    applyVolumeToAudio(percentage);
  };

  const handleVolumeTouchEnd = () => {
    if (!isAdjustingVolumeRef.current) return;
    const nextVolume = volumeDragValueRef.current;
    onVolumeChange(nextVolume);
    setIsAdjustingVolume(false);
    isAdjustingVolumeRef.current = false;
    hapticSliderEnd();
  };

  const handleArtworkDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > 30) {
        const seekAmount = (offset / artworkRef.current!.offsetWidth) * 30;
        const newTime = Math.max(
          0,
          Math.min(duration, currentTime + seekAmount),
        );
        setSeekTime(newTime);
        setIsSeeking(true);
        setSeekDirection(offset > 0 ? "forward" : "backward");
      }
    },
    [currentTime, duration],
  );

  const handleArtworkDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;

      if (Math.abs(offset) > 50 || Math.abs(velocity) > 300) {
        if (isSeeking) {
          hapticMedium();
          onSeek(seekTime);
        }
      }
      setIsSeeking(false);
      setSeekDirection(null);
      seekX.set(0);
    },
    [isSeeking, seekTime, onSeek, seekX],
  );

  const handleExpandedDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset > 100 || velocity > 500) {
      hapticLight();
      if (onClose) {
        onClose();
      } else {
        setIsExpanded(false);
      }
    }
  };


  if (!currentTrack) return null;

  const coverArt =
    currentTrack.album.cover_xl ??
    currentTrack.album.cover_big ??
    currentTrack.album.cover_medium ??
    currentTrack.album.cover;

  const dynamicGradient = albumColorPalette
    ? `linear-gradient(165deg, ${albumColorPalette.primary.replace("0.8)", "0.22)")}, rgba(8,13,20,0.95) 50%)`
    : "linear-gradient(165deg, rgba(13,20,29,0.98), rgba(8,13,20,0.92))";

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <>
            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[98] bg-black/90"
              onClick={() => {
                hapticLight();
                if (onClose) {
                  onClose();
                } else {
                  setIsExpanded(false);
                }
              }}
            />

            {}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={handleExpandedDragEnd}
              style={{ y: dragY, opacity }}
              transition={springPresets.gentle}
              className="safe-bottom fixed inset-0 z-[99] flex flex-col overflow-hidden"
            >
              {}
              <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: dynamicGradient }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,13,20,0.8)_70%)]" />

              {}
              <div className="relative z-10 flex flex-1 flex-col">
                {}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="h-1 w-12 rounded-full bg-[rgba(255,255,255,0.3)]" />
                </div>

                {}
                <div className="flex items-center justify-between px-6 pt-2">
                  <motion.button
                    onClick={() => {
                      hapticLight();
                      if (onClose) {
                        onClose();
                      } else {
                        setIsExpanded(false);
                      }
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target rounded-full p-2 text-[var(--color-subtext)]"
                    aria-label="Collapse player"
                  >
                    <ChevronDown className="h-6 w-6" />
                  </motion.button>
                  <span className="text-xs font-semibold tracking-widest text-[var(--color-muted)] uppercase">
                    Now Playing
                  </span>
                  <div className="w-10" />
                </div>

                {}
                <div className="flex flex-1 items-center justify-center px-8 py-6">
                  <motion.div
                    ref={artworkRef}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ scale: artworkScale }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDrag={handleArtworkDrag}
                    onDragEnd={handleArtworkDragEnd}
                    transition={springPresets.smooth}
                    className="relative w-full max-w-[360px] cursor-grab active:cursor-grabbing"
                  >
                    {}
                    {coverArt ? (
                      <div className="relative">
                        <Image
                          src={coverArt}
                          alt={currentTrack.title}
                          width={450}
                          height={450}
                          className="aspect-square w-full rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10"
                          priority
                          quality={90}
                        />
                        {}
                        <div
                          className="absolute inset-0 -z-10 blur-3xl opacity-30 rounded-3xl"
                          style={{
                            background: "radial-gradient(circle, rgba(244,178,102,0.6) 0%, transparent 70%)",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-[rgba(244,178,102,0.12)] text-6xl text-[var(--color-muted)]">
                        🎵
                      </div>
                    )}

                    {}
                    {

}

                    {}
                    <AnimatePresence>
                      {isSeeking && seekDirection && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/75"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl font-bold text-[var(--color-text)] tabular-nums">
                              {formatTime(seekTime)}
                            </span>
                            <span
                              className={`text-sm ${seekDirection === "forward" ? "text-[var(--color-accent-strong)]" : "text-[var(--color-accent)]"}`}
                            >
                              {seekDirection === "forward" ? "+" : "-"}
                              {Math.abs(Math.round(seekTime - currentTime))}s
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/60">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-12 w-12 rounded-full border-4 border-[var(--color-accent)] border-t-transparent"
                        />
                      </div>
                    )}
                  </motion.div>
                </div>

                {}
                <div className="px-8 pb-4 text-center">
                  <motion.h2
                    key={currentTrack.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-1 text-2xl font-bold text-[var(--color-text)]"
                  >
                    {currentTrack.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-[var(--color-accent)]"
                  >
                    {currentTrack.artist.name}
                  </motion.p>
                </div>

                {}
                <div className="px-8 pb-4">
                  <div
                    ref={progressRef}
                    className="group relative h-2.5 cursor-pointer rounded-full bg-[rgba(255,255,255,0.12)]"
                    onClick={handleProgressClick}
                    onTouchStart={(e) => {
                      setIsSeeking(true);
                      haptic("selection");
                      handleProgressTouch(e);
                    }}
                    onTouchMove={(e) => {
                      handleProgressTouch(e);
                      hapticSliderContinuous(seekTime, 0, duration, {
                        intervalMs: 35,
                        tickThreshold: 1.5,
                      });
                    }}
                    onTouchEnd={() => {
                      handleProgressTouchEnd();
                      hapticSliderEnd();
                    }}
                    role="slider"
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={displayTime}
                  >
                    {}
                    {isSeeking && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-accent-strong)]/20 blur-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1.05 }}
                        exit={{ opacity: 0 }}
                        transition={springPresets.slider}
                      />
                    )}
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
                      style={{
                        width: `${isSeeking ? (seekTime / duration) * 100 : progress}%`,
                      }}
                      transition={isSeeking ? { duration: 0 } : springPresets.slider}
                    />
                    <motion.div
                      className="absolute top-1/2 rounded-full bg-white shadow-xl"
                      style={{
                        left: `${isSeeking ? (seekTime / duration) * 100 : progress}%`,
                      }}
                      initial={{ scale: 1, x: "-50%", y: "-50%" }}
                      animate={{
                        scale: isSeeking ? 1.4 : 1,
                        width: isSeeking ? 24 : 18,
                        height: isSeeking ? 24 : 18,
                      }}
                      whileHover={{ scale: 1.2 }}
                      transition={springPresets.sliderThumb}
                    >
                      {isSeeking && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  </div>
                  <div className="mt-2.5 flex justify-between text-sm text-[var(--color-subtext)] tabular-nums">
                    <motion.span
                      animate={{ scale: isSeeking ? 1.05 : 1 }}
                      transition={springPresets.snappy}
                    >
                      {formatTime(displayTime)}
                    </motion.span>
                    <motion.span
                      animate={{ scale: isSeeking ? 1.05 : 1 }}
                      transition={springPresets.snappy}
                    >
                      -{formatTime(Math.max(0, duration - displayTime))}
                    </motion.span>
                  </div>
                </div>

                {}
                <div className="flex items-center justify-center gap-6 px-8 pb-6">
                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleShuffle();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      isShuffled
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                    aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                  >
                    <Shuffle className="h-5 w-5" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)]"
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-8 w-8 fill-current" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      hapticLight();
                      onSkipBackward();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
                    title="Skip backward 10s"
                    aria-label="Skip backward 10 seconds"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                      />
                    </svg>
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-text)] to-[var(--color-accent)] text-[#0f141d] shadow-[0_8px_32px_rgba(244,178,102,0.5)] ring-2 ring-[var(--color-accent)]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ width: 72, height: 72 }}
                    aria-label={isPlaying ? "Pause track" : "Play track"}
                    disabled={isLoading}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                    {isPlaying ? (
                      <Pause className="relative h-8 w-8 fill-current" />
                    ) : (
                      <Play className="relative ml-0.5 h-8 w-8 fill-current" />
                    )}
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      hapticLight();
                      onSkipForward();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target text-[var(--color-subtext)] transition-colors hover:text-[var(--color-text)]"
                    title="Skip forward 10s"
                    aria-label="Skip forward 10 seconds"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                      />
                    </svg>
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (queue.length > 0) {
                        handleNext();
                      }
                    }}
                    disabled={queue.length === 0}
                    whileTap={{ scale: 0.9 }}
                    className="touch-target-lg text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next track"
                  >
                    <SkipForward className="h-8 w-8 fill-current" />
                  </motion.button>

                  {}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCycleRepeat();
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target rounded-full p-3 transition-colors ${
                      repeatMode !== "none"
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-subtext)]"
                    }`}
                    aria-label={
                      repeatMode === "none"
                        ? "Enable repeat"
                        : repeatMode === "one"
                          ? "Repeat one (click to repeat all)"
                          : "Repeat all (click to disable)"
                    }
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-5 w-5" />
                    ) : (
                      <Repeat className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>

                {}
                <div className="flex items-center justify-around border-t border-[rgba(255,255,255,0.08)] px-8 py-4">
                  {}
                  <div className="flex flex-1 max-w-[180px] items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        hapticMedium();
                        onToggleMute();
                      }}
                      whileTap={{ scale: 0.85 }}
                      transition={springPresets.snappy}
                      className="touch-target text-[var(--color-subtext)]"
                      aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                    >
                      <motion.div
                        animate={{ scale: isMuted ? 0.9 : 1 }}
                        transition={springPresets.snappy}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </motion.div>
                    </motion.button>
                    <div
                      ref={volumeRef}
                      className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-[rgba(255,255,255,0.12)]"
                      onClick={handleVolumeClick}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        haptic("selection");
                        handleVolumeTouch(e);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        handleVolumeTouch(e);
                        hapticSliderContinuous(volumeDragValueRef.current * 100, 0, 100, {
                          intervalMs: 50,
                          tickThreshold: 5,
                          boundaryFeedback: true,
                        });
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleVolumeTouchEnd();
                      }}
                      onTouchCancel={(e) => {
                        e.preventDefault();
                        handleVolumeTouchEnd();
                      }}
                      role="slider"
                      aria-label="Volume"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round((isMuted ? 0 : displayVolume) * 100)}
                    >
                      {isAdjustingVolume && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-accent-strong)]/20 blur-md"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1.05 }}
                          exit={{ opacity: 0 }}
                          transition={springPresets.slider}
                        />
                      )}
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
                        style={{
                          width: `${isMuted ? 0 : displayVolume * 100}%`,
                        }}
                        transition={isAdjustingVolume ? { duration: 0 } : springPresets.slider}
                      />
                      <motion.div
                        className="absolute top-1/2 rounded-full bg-white shadow-lg"
                        style={{
                          left: `${isMuted ? 0 : displayVolume * 100}%`,
                        }}
                        initial={{ scale: 1, x: "-50%", y: "-50%" }}
                        animate={{
                          scale: isAdjustingVolume ? 1.3 : 1,
                          width: isAdjustingVolume ? 18 : 14,
                          height: isAdjustingVolume ? 18 : 14,
                        }}
                        whileHover={{ scale: 1.2 }}
                        transition={springPresets.sliderThumb}
                      >
                        {isAdjustingVolume && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {}
                  <motion.button
                    onClick={() => {
                      hapticMedium();
                      setShowQueuePanel(!showQueuePanel);
                      setShowEqualizerPanel(false);
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target relative ${showQueuePanel ? "text-[var(--color-accent)]" : "text-[var(--color-subtext)]"}`}
                  >
                    <ListMusic className="h-5 w-5" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[#0f141d]">
                        {queue.length > 9 ? "9+" : queue.length}
                      </span>
                    )}
                  </motion.button>

                  {}
                  <motion.button
                    onClick={() => {
                      hapticMedium();
                      setShowEqualizerPanel(!showEqualizerPanel);
                      setShowQueuePanel(false);
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target ${showEqualizerPanel ? "text-[var(--color-accent)]" : "text-[var(--color-subtext)]"}`}
                  >
                    <Sliders className="h-5 w-5" />
                  </motion.button>

                  {}
                  <div className="relative">
                    <motion.button
                      onClick={() => {
                        if (!isAuthenticated) {
                          hapticMedium();
                          return;
                        }
                        hapticLight();
                        setShowPlaylistSelector(!showPlaylistSelector);
                      }}
                      whileTap={{ scale: 0.9 }}
                      className={`touch-target ${!isAuthenticated ? "opacity-50" : ""} ${showPlaylistSelector ? "text-[var(--color-accent)]" : "text-[var(--color-subtext)]"}`}
                      title={
                        isAuthenticated
                          ? "Add to playlist"
                          : "Sign in to add to playlists"
                      }
                    >
                      <ListPlus className="h-5 w-5" />
                    </motion.button>

                    {}
                    <AnimatePresence>
                      {showPlaylistSelector && isAuthenticated && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPlaylistSelector(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springPresets.snappy}
                            className="absolute bottom-full right-0 z-20 mb-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.98)] shadow-xl backdrop-blur-xl"
                          >
                            <div className="p-3 border-b border-[rgba(255,255,255,0.08)]">
                              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                                Add to Playlist
                              </h3>
                            </div>
                            <div className="py-2">
                              {playlists && playlists.length > 0 ? (
                                playlists.map((playlist) => (
                                  <button
                                    key={playlist.id}
                                    onClick={() => {
                                      if (currentTrack) {
                                        addToPlaylist.mutate({
                                          playlistId: playlist.id,
                                          track: currentTrack,
                                        });
                                      }
                                    }}
                                    disabled={addToPlaylist.isPending}
                                    className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[rgba(244,178,102,0.1)] disabled:opacity-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-[var(--color-text)]">
                                          {playlist.name}
                                        </p>
                                        <p className="text-xs text-[var(--color-subtext)]">
                                          {playlist.trackCount ?? 0}{" "}
                                          {playlist.trackCount === 1
                                            ? "track"
                                            : "tracks"}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center">
                                  <p className="text-sm text-[var(--color-subtext)]">
                                    No playlists yet
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                                    Create one from the Playlists page
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {}
                  <motion.button
                    onClick={toggleFavorite}
                    disabled={!isAuthenticated || addFavorite.isPending || removeFavorite.isPending}
                    whileTap={{ scale: 0.9 }}
                    className={`touch-target transition-all ${
                      favoriteData?.isFavorite
                        ? "text-red-500"
                        : "text-[var(--color-subtext)]"
                    } ${!isAuthenticated || addFavorite.isPending || removeFavorite.isPending ? "opacity-50" : ""}`}
                    title={
                      !isAuthenticated
                        ? "Sign in to favorite tracks"
                        : favoriteData?.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                    }
                    aria-label={
                      !isAuthenticated
                        ? "Sign in to favorite tracks"
                        : favoriteData?.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                    }
                  >
                    <Heart
                      className={`h-5 w-5 transition-transform ${
                        favoriteData?.isFavorite ? "fill-current" : ""
                      } ${isHeartAnimating ? "scale-125" : ""}`}
                    />
                  </motion.button>
                </div>

                {}
                {}
                {

}
              </div>
            </motion.div>

            {}
            <AnimatePresence>
              {showQueuePanel && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    onClick={() => {
                      hapticLight();
                      setShowQueuePanel(false);
                    }}
                  />
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0, right: 0.2 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 100 || info.velocity.x > 300) {
                        hapticLight();
                        setShowQueuePanel(false);
                      }
                    }}
                    transition={springPresets.gentle}
                    className="safe-bottom fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-[rgba(244,178,102,0.16)] bg-[rgba(10,16,24,0.95)] shadow-[-8px_0_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] p-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[var(--color-text)]">
                          Queue ({queue.length})
                        </h2>
                        <div className="flex items-center gap-2">
                          {queue.length > 0 && (
                            <>
                              <motion.button
                                onClick={() => {
                                  hapticLight();
                                  handleSmartQueueAction(
                                    smartQueueState.isActive ? "refresh" : "add",
                                  );
                                }}
                                disabled={smartQueueState.isLoading}
                                whileTap={{ scale: 0.9 }}
                                className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(88,198,177,0.16)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={
                                  smartQueueState.isActive
                                    ? "Refresh smart tracks"
                                    : "Add smart tracks"
                                }
                              >
                                {smartQueueState.isLoading ? (
                                  <LoadingSpinner size="sm" label="Loading smart tracks" />
                                ) : (
                                  <Sparkles className="h-5 w-5" />
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  hapticLight();
                                  setShowQueueSettingsModal(true);
                                }}
                                whileTap={{ scale: 0.9 }}
                                className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                                aria-label="Smart tracks settings"
                              >
                                <Settings className="h-5 w-5" />
                              </motion.button>
                            </>
                          )}
                          {isAuthenticated && (queue.length > 0 || currentTrack) && (
                            <motion.button
                              onClick={async () => {
                                hapticLight();
                                try {
                                  await saveQueueAsPlaylist();
                                  showToast("Queue saved as playlist", "success");
                                } catch (error) {
                                  showToast("Failed to save playlist", "error");
                                }
                              }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                              aria-label="Save as playlist"
                            >
                              <Save className="h-5 w-5" />
                            </motion.button>
                          )}
                          {queue.length > 0 && (
                            <motion.button
                              onClick={() => {
                                hapticMedium();
                                clearQueue();
                                handleClearQueueSelection();
                                showToast("Queue cleared", "success");
                              }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(242,139,130,0.12)] hover:text-[var(--color-text)]"
                              aria-label="Clear queue"
                            >
                              <Trash2 className="h-5 w-5" />
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => {
                              hapticLight();
                              setShowQueuePanel(false);
                              handleClearQueueSelection();
                              setQueueSearchQuery("");
                            }}
                            whileTap={{ scale: 0.9 }}
                            className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)]"
                            aria-label="Close queue"
                          >
                            <X className="h-6 w-6" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Selection bar */}
                      {selectedQueueIndices.size > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 rounded-lg border border-[rgba(88,198,177,0.25)] bg-[rgba(88,198,177,0.12)] p-3"
                        >
                          <span className="text-sm font-medium text-[var(--color-text)]">
                            {selectedQueueIndices.size} selected
                          </span>
                          <div className="flex-1" />
                          <motion.button
                            onClick={handleRemoveSelectedQueueItems}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 rounded-lg bg-[rgba(248,139,130,0.2)] px-3 py-1.5 text-sm font-medium transition-colors active:bg-[rgba(248,139,130,0.3)]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              hapticLight();
                              handleClearQueueSelection();
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-lg bg-[rgba(255,255,255,0.1)] px-3 py-1.5 text-sm font-medium transition-colors active:bg-[rgba(255,255,255,0.15)]"
                          >
                            Clear
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Search */}
                      {queue.length > 0 && (
                        <div className="relative">
                          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                          <input
                            type="text"
                            placeholder="Search queue..."
                            value={queueSearchQuery}
                            onChange={(e) => setQueueSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(18,26,38,0.92)] py-2 pr-4 pl-10 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[rgba(244,178,102,0.35)] focus:ring-2 focus:ring-[rgba(244,178,102,0.28)] focus:outline-none"
                          />
                          {queueSearchQuery && (
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              onClick={() => setQueueSearchQuery("")}
                              className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-subtext)] transition-colors active:text-[var(--color-text)]"
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
                      {queue.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                          <div className="mb-4 text-6xl">🎵</div>
                          <p className="mb-2 text-lg font-medium text-[var(--color-text)]">
                            Queue is empty
                          </p>
                          <p className="text-sm text-[var(--color-subtext)]">
                            Add tracks to start building your queue
                          </p>
                        </div>
                      ) : filteredQueue.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                          <Search className="mb-4 h-12 w-12 text-[var(--color-muted)]" />
                          <p className="mb-2 text-lg font-medium text-[var(--color-text)]">
                            No results found
                          </p>
                          <p className="text-sm text-[var(--color-subtext)]">
                            Try a different search term
                          </p>
                        </div>
                      ) : (
                        <div>
                          {/* Now Playing */}
                          {filteredNowPlaying && (
                            <div className="border-b border-[rgba(255,255,255,0.05)]">
                              <div className="px-3 py-2 text-xs font-semibold text-[var(--color-subtext)] uppercase tracking-wider bg-[rgba(245,241,232,0.02)]">
                                Now Playing
                              </div>
                              <QueueItem
                                track={filteredNowPlaying.track}
                                index={filteredNowPlaying.index}
                                isActive={currentTrack?.id === filteredNowPlaying.track.id}
                                isSelected={selectedQueueIndices.has(filteredNowPlaying.index)}
                                isSmartTrack={filteredNowPlaying.isSmartTrack}
                                onPlay={() => {
                                  hapticLight();
                                  playFromQueue(filteredNowPlaying.index);
                                }}
                                onRemove={() => {
                                  hapticMedium();
                                  removeFromQueue(filteredNowPlaying.index);
                                }}
                                onToggleSelect={(e) => {
                                  if (e.type === 'touchstart' && e.touches.length === 1) {
                                    const timer = setTimeout(() => {
                                      hapticMedium();
                                      handleToggleQueueSelect(filteredNowPlaying.index);
                                    }, 500);
                                    setLongPressTimer(timer);
                                  } else {
                                    if (longPressTimer) {
                                      clearTimeout(longPressTimer);
                                      setLongPressTimer(null);
                                    }
                                    handleToggleQueueSelect(filteredNowPlaying.index, e.shiftKey);
                                  }
                                }}
                                onTouchEnd={() => {
                                  if (longPressTimer) {
                                    clearTimeout(longPressTimer);
                                    setLongPressTimer(null);
                                  }
                                }}
                                canRemove={filteredNowPlaying.index !== 0}
                                onDragStart={() => setDraggedIndex(filteredNowPlaying.index)}
                                onDragEnd={() => setDraggedIndex(null)}
                                isDragging={draggedIndex === filteredNowPlaying.index}
                                onReorder={(newIndex) => {
                                  if (newIndex !== filteredNowPlaying.index) {
                                    reorderQueue(filteredNowPlaying.index, newIndex);
                                    hapticSuccess();
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* User Tracks */}
                          {filteredUserTracks.length > 0 && (
                            <div className="border-b border-[rgba(255,255,255,0.05)]">
                              <div className="px-3 py-2 text-xs font-semibold text-[var(--color-subtext)] uppercase tracking-wider border-b border-[rgba(245,241,232,0.05)]">
                                Next in queue
                              </div>
                              <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                {filteredUserTracks.map((entry) => (
                                  <QueueItem
                                    key={entry.queueId}
                                    track={entry.track}
                                    index={entry.index}
                                    isActive={currentTrack?.id === entry.track.id}
                                    isSelected={selectedQueueIndices.has(entry.index)}
                                    isSmartTrack={entry.isSmartTrack}
                                    onPlay={() => {
                                      hapticLight();
                                      playFromQueue(entry.index);
                                    }}
                                    onRemove={() => {
                                      hapticMedium();
                                      removeFromQueue(entry.index);
                                    }}
                                    onToggleSelect={(e) => {
                                      if (e.type === 'touchstart' && e.touches.length === 1) {
                                        const timer = setTimeout(() => {
                                          hapticMedium();
                                          handleToggleQueueSelect(entry.index);
                                        }, 500);
                                        setLongPressTimer(timer);
                                      } else {
                                        if (longPressTimer) {
                                          clearTimeout(longPressTimer);
                                          setLongPressTimer(null);
                                        }
                                        handleToggleQueueSelect(entry.index, e.shiftKey);
                                      }
                                    }}
                                    onTouchEnd={() => {
                                      if (longPressTimer) {
                                        clearTimeout(longPressTimer);
                                        setLongPressTimer(null);
                                      }
                                    }}
                                    canRemove={entry.index !== 0}
                                    onDragStart={() => setDraggedIndex(entry.index)}
                                    onDragEnd={() => setDraggedIndex(null)}
                                    isDragging={draggedIndex === entry.index}
                                    onReorder={(newIndex) => {
                                      if (newIndex !== entry.index) {
                                        reorderQueue(entry.index, newIndex);
                                        hapticSuccess();
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Smart Tracks */}
                          {(filteredSmartTracks.length > 0 || smartQueueState.isLoading) && (
                            <div className="border-b border-[rgba(255,255,255,0.05)]">
                              <div className="px-3 py-2 text-xs font-semibold text-[var(--color-subtext)] uppercase tracking-wider border-b border-[rgba(245,241,232,0.05)] flex items-center gap-2">
                                <span>Smart tracks</span>
                                {smartQueueState.isLoading && (
                                  <LoadingSpinner size="sm" label="Loading smart tracks" />
                                )}
                              </div>
                              {smartQueueState.isLoading && filteredSmartTracks.length === 0 ? (
                                <div className="px-3 py-4 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <LoadingSpinner size="md" label="Loading smart tracks" />
                                    <p className="text-xs text-[var(--color-subtext)]">
                                      Finding similar tracks...
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                                  {filteredSmartTracks.map((entry) => (
                                    <QueueItem
                                      key={entry.queueId}
                                      track={entry.track}
                                      index={entry.index}
                                      isActive={currentTrack?.id === entry.track.id}
                                      isSelected={selectedQueueIndices.has(entry.index)}
                                      isSmartTrack={entry.isSmartTrack}
                                      onPlay={() => {
                                        hapticLight();
                                        playFromQueue(entry.index);
                                      }}
                                      onRemove={() => {
                                        hapticMedium();
                                        removeFromQueue(entry.index);
                                      }}
                                      onToggleSelect={(e) => {
                                        if (e.type === 'touchstart' && e.touches.length === 1) {
                                          const timer = setTimeout(() => {
                                            hapticMedium();
                                            handleToggleQueueSelect(entry.index);
                                          }, 500);
                                          setLongPressTimer(timer);
                                        } else {
                                          if (longPressTimer) {
                                            clearTimeout(longPressTimer);
                                            setLongPressTimer(null);
                                          }
                                          handleToggleQueueSelect(entry.index, e.shiftKey);
                                        }
                                      }}
                                      onTouchEnd={() => {
                                        if (longPressTimer) {
                                          clearTimeout(longPressTimer);
                                          setLongPressTimer(null);
                                        }
                                      }}
                                      canRemove={entry.index !== 0}
                                      onDragStart={() => setDraggedIndex(entry.index)}
                                      onDragEnd={() => setDraggedIndex(null)}
                                      isDragging={draggedIndex === entry.index}
                                      onReorder={(newIndex) => {
                                        if (newIndex !== entry.index) {
                                          reorderQueue(entry.index, newIndex);
                                          hapticSuccess();
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {queue.length > 0 && (
                      <div className="border-t border-[rgba(244,178,102,0.12)] p-4 text-sm text-[var(--color-subtext)]">
                        <div className="flex items-center justify-between">
                          <span>Total duration:</span>
                          <span className="font-medium">{formatDuration(totalDuration)}</span>
                        </div>
                        {queueSearchQuery && filteredQueue.length !== queue.length && (
                          <div className="mt-2 text-xs text-[var(--color-muted)]">
                            Showing {filteredQueue.length} of {queue.length} tracks
                          </div>
                        )}
                        {!queueSearchQuery && selectedQueueIndices.size === 0 && (
                          <div className="mt-2 text-xs text-[var(--color-muted)]">
                            Tip: Tap to play • Long-press to select • Swipe to reorder
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {}
            <AnimatePresence>
              {showEqualizerPanel && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    onClick={() => {
                      hapticLight();
                      setShowEqualizerPanel(false);
                    }}
                  />
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0.2, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -100 || info.velocity.x < -300) {
                        hapticLight();
                        setShowEqualizerPanel(false);
                      }
                    }}
                    transition={springPresets.gentle}
                    className="safe-bottom fixed left-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-r border-[rgba(244,178,102,0.16)] bg-[rgba(10,16,24,0.95)] shadow-[8px_0_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] p-4">
                      <h2 className="text-xl font-bold text-[var(--color-text)]">
                        Equalizer
                      </h2>
                      <motion.button
                        onClick={() => {
                          hapticLight();
                          setShowEqualizerPanel(false);
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="rounded-full p-2 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(244,178,102,0.12)]"
                      >
                        <X className="h-6 w-6" />
                      </motion.button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <p className="text-center text-[var(--color-subtext)]">
                        Equalizer controls will appear here
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Queue Settings Modal */}
            <QueueSettingsModal
              isOpen={showQueueSettingsModal}
              onClose={() => setShowQueueSettingsModal(false)}
              onApply={handleApplyQueueSettings}
              initialCount={smartTracksCount}
              initialSimilarityLevel={similarityLevel}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
