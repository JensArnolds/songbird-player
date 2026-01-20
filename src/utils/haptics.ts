// File: src/utils/haptics.ts

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning"
  | "selection"
  | "impact"
  | "notification"
  | "swipe"
  | "toggle"
  | "slider"
  | "sliderTick"
  | "sliderEnd"
  | "scrub"
  | "boundary";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 4,
  medium: 10,
  heavy: 20,

  success: [6, 60, 6],
  error: [12, 40, 12, 40, 20],
  warning: [8, 35, 8],

  selection: 2,
  impact: 15,
  notification: [4, 80, 4, 80, 12],

  swipe: [4, 25, 4],
  toggle: 6,
  slider: 1,
  sliderTick: 2,
  sliderEnd: 5,
  scrub: 1,
  boundary: [8, 30, 8],
};

export function haptic(pattern: HapticPattern = "light"): void {
  if (!("vibrate" in navigator)) {
    return;
  }

  try {
    const vibrationPattern = patterns[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {
  }
}

const throttleTimers = new Map<string, number>();

export function hapticThrottled(
  pattern: HapticPattern,
  key: string,
  intervalMs: number = 50,
): void {
  const now = Date.now();
  const lastTime = throttleTimers.get(key) ?? 0;

  if (now - lastTime >= intervalMs) {
    haptic(pattern);
    throttleTimers.set(key, now);
  }
}

let lastSliderValue = 0;
let lastSliderTime = 0;

export function hapticSliderContinuous(
  value: number,
  min: number = 0,
  max: number = 100,
  options: {
    intervalMs?: number;
    tickThreshold?: number;
    boundaryFeedback?: boolean;
  } = {},
): void {
  const {
    intervalMs = 40,
    tickThreshold = 2,
    boundaryFeedback = true,
  } = options;

  const now = Date.now();
  if (now - lastSliderTime < intervalMs) {
    return;
  }

  const normalizedValue = ((value - min) / (max - min)) * 100;
  const lastNormalized = ((lastSliderValue - min) / (max - min)) * 100;
  const delta = Math.abs(normalizedValue - lastNormalized);

  if (boundaryFeedback) {
    const atBoundary =
      (value <= min && lastSliderValue > min) ||
      (value >= max && lastSliderValue < max);
    if (atBoundary) {
      haptic("boundary");
      lastSliderTime = now;
      lastSliderValue = value;
      return;
    }
  }

  if (delta >= tickThreshold) {
    haptic("sliderTick");
    lastSliderTime = now;
    lastSliderValue = value;
  }
}

export function hapticSliderEnd(): void {
  haptic("sliderEnd");
  lastSliderValue = 0;
  lastSliderTime = 0;
}

let lastScrubTime = 0;
const SCRUB_INTERVAL = 30;

export function hapticScrub(): void {
  const now = Date.now();
  if (now - lastScrubTime >= SCRUB_INTERVAL) {
    haptic("scrub");
    lastScrubTime = now;
  }
}

export function hapticLight(): void {
  haptic("light");
}

export function hapticMedium(): void {
  haptic("medium");
}

export function hapticHeavy(): void {
  haptic("heavy");
}

export function hapticSuccess(): void {
  haptic("success");
}

export function hapticError(): void {
  haptic("error");
}

export function hapticWarning(): void {
  haptic("warning");
}

export function hapticSelection(): void {
  haptic("selection");
}

export function hapticImpact(): void {
  haptic("impact");
}

export function hapticNotification(): void {
  haptic("notification");
}

export function hapticSwipe(): void {
  haptic("swipe");
}

export function hapticToggle(): void {
  haptic("toggle");
}

export function hapticSlider(): void {
  haptic("slider");
}

export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}

export function hapticCustom(pattern: number[]): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {

  }
}

export function hapticStop(): void {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(0);
  } catch {

  }
}
