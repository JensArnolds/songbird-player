import type { FlowFieldPatternContext } from "./types";

/**
 * Kaleidoscope - A mesmerizing mirrored symmetry pattern
 *
 * Inspired by GLSL kaleidoscope shaders, this pattern creates symmetrical
 * mirrored segments with audio-reactive particles and radial color shifts.
 *
 * Features:
 * - Configurable number of mirror segments (default: 24)
 * - Radial symmetry with rotation over time
 * - Audio-reactive particle system within each segment
 * - Color shifting based on radius and audio intensity
 * - Vignette effect for visual depth
 */
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

  // Calculate rotation angle
  const rotationAngle = p.time * 0.0005 * rotationSpeed;

  // Segment angle
  const segmentAngle = p.TWO_PI / segments;
  const halfSegmentAngle = segmentAngle / 2;

  ctx.save();

  // Apply vignette effect (darker edges)
  const maxDim = Math.max(p.width, p.height);
  const vignetteGradient = ctx.createRadialGradient(
    p.centerX,
    p.centerY,
    maxDim * 0.2,
    p.centerX,
    p.centerY,
    maxDim * 0.7,
  );
  vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, p.width, p.height);

  // Move to center for rotation
  ctx.translate(p.centerX, p.centerY);
  ctx.rotate(rotationAngle);

  // Draw each segment with mirrored content
  for (let seg = 0; seg < segments; seg++) {
    ctx.save();
    ctx.rotate(seg * segmentAngle);

    // Create clipping path for the segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxDim, -halfSegmentAngle, halfSegmentAngle);
    ctx.closePath();
    ctx.clip();

    // Draw the mirrored pattern within the segment
    drawSegmentPattern(
      ctx,
      p,
      audioIntensity,
      bassIntensity,
      trebleIntensity,
      maxDim,
      particleDensity,
      colorShift,
      seg,
    );

    // Mirror the pattern by flipping horizontally
    ctx.save();
    ctx.scale(1, -1); // Flip vertically to create mirror effect
    drawSegmentPattern(
      ctx,
      p,
      audioIntensity,
      bassIntensity,
      trebleIntensity,
      maxDim,
      particleDensity,
      colorShift,
      seg + segments, // Different seed for variation
    );
    ctx.restore();

    ctx.restore();
  }

  ctx.restore();

  // Draw central glow
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

/**
 * Draw the pattern content within a single kaleidoscope segment
 */
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
  const particleCount = Math.floor(30 * particleDensity * (0.7 + audioIntensity * 0.3));

  ctx.globalCompositeOperation = "lighter";

  // Draw radial particles with audio-reactive properties
  for (let i = 0; i < particleCount; i++) {
    // Use seed and index for deterministic but varied positions
    const angle = ((seed * 7919 + i * 2654435761) % 10000) / 10000; // Pseudo-random angle
    const radiusNorm = ((seed * 9973 + i * 1664525) % 10000) / 10000; // Pseudo-random radius

    // Convert normalized values to actual positions
    const particleAngle = angle * Math.PI * 0.08; // Small angle within segment
    const baseRadius = radiusNorm * maxRadius * 0.5;

    // Audio-reactive radius modulation
    const radiusMod =
      1 +
      p.fastSin(p.time * 0.002 + i * 0.5 + seed * 0.1) * 0.2 * audioIntensity +
      p.fastSin(p.time * 0.003 + i * 0.3) * 0.15 * bassIntensity;
    const radius = baseRadius * radiusMod;

    // Position in polar coordinates
    const x = p.fastCos(particleAngle) * radius;
    const y = p.fastSin(particleAngle) * radius;

    // Color shifts based on radius and audio
    const radiusHueShift = (radius / maxRadius) * 60 * colorShift;
    const timeHueShift = p.fastSin(p.time * 0.002 - radius * 0.01) * 20 * colorShift;
    const hue = p.fastMod360(p.hueBase + radiusHueShift + timeHueShift + i * 5);

    // Size based on audio and distance from center
    const distanceFactor = 1 - radius / (maxRadius * 0.5);
    const baseSize = 1 + distanceFactor * 3;
    const size = baseSize * (0.8 + audioIntensity * 0.4 + trebleIntensity * 0.6);

    // Opacity based on distance and audio
    const opacity = (0.3 + distanceFactor * 0.5) * (0.6 + audioIntensity * 0.4);

    // Draw particle with glow
    const saturation = 85 + audioIntensity * 15;
    const lightness = 55 + trebleIntensity * 20;

    // Outer glow
    ctx.shadowBlur = 8 + audioIntensity * 12;
    ctx.shadowColor = p.hsla(hue, saturation, lightness, opacity * 0.8);
    ctx.fillStyle = p.hsla(hue, saturation, lightness, opacity * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, p.TWO_PI);
    ctx.fill();

    // Inner bright core
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.hsla(hue, 100, 75, opacity);
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, p.TWO_PI);
    ctx.fill();
  }

  // Draw radial lines for additional structure
  const lineCount = Math.floor(8 * (0.7 + audioIntensity * 0.3));
  ctx.shadowBlur = 0;

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

  // Draw concentric rings
  const ringCount = Math.floor(5 * (0.7 + bassIntensity * 0.3));
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
