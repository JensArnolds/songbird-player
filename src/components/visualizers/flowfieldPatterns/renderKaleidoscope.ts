import type { FlowFieldPatternContext } from "./types";

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;
let cachedMaxDim = 0;
let cachedVignetteGradient: CanvasGradient | null = null;

export function renderKaleidoscope(
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
): void {
  const ctx = p.ctx;
  const segments = p.kaleidoscopeSegments ?? 24;
  const rotationSpeed = p.kaleidoscopeRotationSpeed ?? 1.0;
  const particleDensity = p.kaleidoscopeParticleDensity ?? 1.0;
  const colorShift = p.kaleidoscopeColorShift ?? 1.0;

  const rotationAngle = p.time * 0.0005 * rotationSpeed;

  const segmentAngle = p.TWO_PI / segments;
  const halfSegmentAngle = segmentAngle / 2;

  ctx.save();

  const maxDim = Math.max(p.width, p.height);
  if (!cachedVignetteGradient || cachedMaxDim !== maxDim) {
    cachedMaxDim = maxDim;
    cachedVignetteGradient = ctx.createRadialGradient(
      p.centerX,
      p.centerY,
      maxDim * 0.2,
      p.centerX,
      p.centerY,
      maxDim * 0.7,
    );
    cachedVignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    cachedVignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  }
  ctx.fillStyle = cachedVignetteGradient;
  ctx.fillRect(0, 0, p.width, p.height);

  if (offscreenCanvas?.width !== maxDim || offscreenCanvas?.height !== maxDim) {
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = maxDim;
    offscreenCanvas.height = maxDim;
    offscreenCtx = offscreenCanvas.getContext("2d", { alpha: true }) ?? null;
  }

  if (!offscreenCtx) return;

  offscreenCtx.clearRect(0, 0, maxDim, maxDim);

  offscreenCtx.save();
  offscreenCtx.translate(maxDim / 2, maxDim / 2);

  offscreenCtx.beginPath();
  offscreenCtx.moveTo(0, 0);
  offscreenCtx.arc(0, 0, maxDim, -halfSegmentAngle, halfSegmentAngle);
  offscreenCtx.closePath();
  offscreenCtx.clip();

  drawSegmentPattern(
    offscreenCtx,
    p,
    audioIntensity,
    bassIntensity,
    trebleIntensity,
    maxDim,
    particleDensity,
    colorShift,
    0,
  );

  offscreenCtx.restore();

  ctx.save();
  ctx.translate(p.centerX, p.centerY);
  ctx.rotate(rotationAngle);

  for (let seg = 0; seg < segments; seg++) {
    ctx.save();
    ctx.rotate(seg * segmentAngle);

    ctx.drawImage(offscreenCanvas, -maxDim / 2, -maxDim / 2, maxDim, maxDim);

    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(offscreenCanvas, -maxDim / 2, -maxDim / 2, maxDim, maxDim);
    ctx.restore();

    ctx.restore();
  }

  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glowRadius = 40 + bassIntensity * 80 + audioIntensity * 40;
  const centralGlow = ctx.createRadialGradient(
    p.centerX,
    p.centerY,
    0,
    p.centerX,
    p.centerY,
    glowRadius,
  );
  const centralHue = p.fastMod360(p.hueBase + p.time * 0.05);
  centralGlow.addColorStop(0, p.hsla(centralHue, 100, 70, 0.8));
  centralGlow.addColorStop(0.5, p.hsla(centralHue, 90, 60, 0.4));
  centralGlow.addColorStop(1, p.hsla(centralHue, 80, 50, 0));
  ctx.fillStyle = centralGlow;
  ctx.beginPath();
  ctx.arc(p.centerX, p.centerY, glowRadius, 0, p.TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawSegmentPattern(
  ctx: CanvasRenderingContext2D,
  p: FlowFieldPatternContext,
  audioIntensity: number,
  bassIntensity: number,
  trebleIntensity: number,
  maxRadius: number,
  particleDensity: number,
  colorShift: number,
  seed: number,
): void {
  const particleCount = Math.floor(
    12 * particleDensity * (0.7 + audioIntensity * 0.3),
  );

  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < particleCount; i++) {
    const angle = ((seed * 7919 + i * 2654435761) % 10000) / 10000;
    const radiusNorm = ((seed * 9973 + i * 1664525) % 10000) / 10000;

    const particleAngle = angle * Math.PI * 0.08;
    const baseRadius = radiusNorm * maxRadius * 0.5;

    const radiusMod =
      1 +
      p.fastSin(p.time * 0.002 + i * 0.5 + seed * 0.1) * 0.2 * audioIntensity +
      p.fastSin(p.time * 0.003 + i * 0.3) * 0.15 * bassIntensity;
    const radius = baseRadius * radiusMod;

    const x = p.fastCos(particleAngle) * radius;
    const y = p.fastSin(particleAngle) * radius;

    const radiusHueShift = (radius / maxRadius) * 60 * colorShift;
    const timeHueShift =
      p.fastSin(p.time * 0.002 - radius * 0.01) * 20 * colorShift;
    const hue = p.fastMod360(p.hueBase + radiusHueShift + timeHueShift + i * 5);

    const distanceFactor = 1 - radius / (maxRadius * 0.5);
    const baseSize = 1 + distanceFactor * 3;
    const size =
      baseSize * (0.8 + audioIntensity * 0.4 + trebleIntensity * 0.6);

    const opacity = (0.3 + distanceFactor * 0.5) * (0.6 + audioIntensity * 0.4);

    const saturation = 85 + audioIntensity * 15;
    const lightness = 55 + trebleIntensity * 20;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, p.hsla(hue, 100, 75, opacity));
    gradient.addColorStop(
      0.3,
      p.hsla(hue, saturation, lightness, opacity * 0.7),
    );
    gradient.addColorStop(1, p.hsla(hue, saturation, lightness, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, p.TWO_PI);
    ctx.fill();
  }

  const lineCount = Math.floor(4 * (0.7 + audioIntensity * 0.3));

  for (let i = 0; i < lineCount; i++) {
    const lineAngle = (i / lineCount) * Math.PI * 0.08;
    const startRadius = maxRadius * 0.1;
    const endRadius = maxRadius * 0.5 * (0.8 + bassIntensity * 0.2);

    const startX = p.fastCos(lineAngle) * startRadius;
    const startY = p.fastSin(lineAngle) * startRadius;
    const endX = p.fastCos(lineAngle) * endRadius;
    const endY = p.fastSin(lineAngle) * endRadius;

    const hue = p.fastMod360(p.hueBase + i * 15 + p.time * 0.05);
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, p.hsla(hue, 80, 60, 0.1 + audioIntensity * 0.2));
    gradient.addColorStop(1, p.hsla(hue, 70, 50, 0));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 0.5 + trebleIntensity * 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  const ringCount = Math.floor(3 * (0.7 + bassIntensity * 0.3));
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = (maxRadius * 0.15 * (i + 1)) / ringCount;
    const hue = p.fastMod360(p.hueBase + i * 30 - p.time * 0.03);
    const opacity = (0.15 + audioIntensity * 0.15) * (1 - i / ringCount);

    ctx.strokeStyle = p.hsla(hue, 75, 55, opacity);
    ctx.lineWidth = 0.5 + audioIntensity * 1;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, -Math.PI * 0.08, Math.PI * 0.08);
    ctx.stroke();
  }
}
