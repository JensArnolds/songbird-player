// File: src/components/visualizers/BarsRenderer.ts

import { MathUtils } from './utils/MathUtils';
import { PerlinNoise } from './utils/PerlinNoise';

export class BarsRenderer {
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];
  private barVelocities: number[] = [];
  private noise: PerlinNoise;
  private time = 0;
  private chromaticShift = 0;
  private plasmaTime = 0;

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
    this.peakDecay = new Array<number>(barCount).fill(0);
    this.barVelocities = new Array<number>(barCount).fill(0);
    this.noise = new PerlinNoise(Math.random() * 1000);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64, barGap = 2): void {
    this.time += 0.02;
    this.plasmaTime += 0.05;
    this.chromaticShift = Math.sin(this.time * 0.5) * 5;

    // Clear canvas with vibrant dark background
    ctx.fillStyle = 'rgba(5, 5, 15, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Kaleidoscopic mirroring - save context for symmetry
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const segments = 8; // More segments for more kaleidoscopic effect

    // Create off-screen canvas for kaleidoscopic rendering
    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d')!;

    // Plasma background with perlin noise on off-screen canvas
    const imageData = offCtx.createImageData(offCanvas.width, offCanvas.height);
    const pixels = imageData.data;

    for (let y = 0; y < offCanvas.height; y += 3) {
      for (let x = 0; x < offCanvas.width; x += 3) {
        const plasma = MathUtils.plasma(x, y, this.plasmaTime);
        const noiseVal = this.noise.octaveNoise(x * 0.005, y * 0.005, this.time * 0.1, 4, 0.5);
        const combined = (plasma + noiseVal) * 0.5;

        const hue = 220 + combined * 80 + Math.sin(this.time) * 20; // More vibrant, shifting hue
        const rgb = MathUtils.hslToRgb(hue, 95, 30 + combined * 25); // Higher saturation and lightness

        for (let dy = 0; dy < 3 && y + dy < offCanvas.height; dy++) {
          for (let dx = 0; dx < 3 && x + dx < offCanvas.width; dx++) {
            const idx = ((y + dy) * offCanvas.width + (x + dx)) * 4;
            pixels[idx] = rgb.r;
            pixels[idx + 1] = rgb.g;
            pixels[idx + 2] = rgb.b;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
    offCtx.putImageData(imageData, 0, 0);

    const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Calculate global average for reactive effects
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;

    // Render bars in kaleidoscopic segments
    for (let seg = 0; seg < segments; seg++) {
      offCtx.save();
      offCtx.translate(centerX, centerY);
      offCtx.rotate((seg * Math.PI * 2) / segments);
      offCtx.scale(seg % 2 === 0 ? 1 : -1, 1); // Mirror alternate segments
      offCtx.translate(-centerX, -centerY);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;

      // Add perlin noise to bar height for organic movement
      const noiseInfluence = this.noise.octaveNoise(i * 0.1, this.time, 0, 3, 0.5) * 0.15;
      const targetHeight = normalizedValue * canvas.height * 0.9 * (1 + noiseInfluence);

      // Smooth bar animation with velocity
      const currentVelocity = this.barVelocities[i] ?? 0;
      const currentHeight = this.peakHistory[i] ?? 0;
      const acceleration = (targetHeight - currentHeight) * 0.3;
      const newVelocity = (currentVelocity + acceleration) * 0.85;
      const barHeight = Math.max(0, currentHeight + newVelocity);

      this.barVelocities[i] = newVelocity;
      this.peakHistory[i] = barHeight;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      // HSL color based on frequency, amplitude, and XOR pattern - more vibrant
      const xorValue = MathUtils.xorPattern(i, barHeight, this.time * 10);
      const hue = (i / barCount) * 300 + 200 + xorValue * 60 + seg * 15; // Wider spectrum, segment-based shift
      const saturation = 85 + normalizedValue * 15; // Higher base saturation
      const lightness = 50 + normalizedValue * 40; // Brighter base

      // Multi-stop gradient for each bar - more opaque and vibrant
      const barGradient = offCtx.createLinearGradient(x, y, x, canvas.height);
      barGradient.addColorStop(0, `hsla(${hue}, ${saturation + 15}%, ${lightness + 30}%, 1)`);
      barGradient.addColorStop(0.3, `hsla(${hue}, ${saturation + 10}%, ${lightness + 15}%, 1)`);
      barGradient.addColorStop(0.7, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.95)`);
      barGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.85)`);

      // Glow effect with bloom - more intense
      offCtx.shadowBlur = 25 + normalizedValue * 35;
      offCtx.shadowColor = `hsla(${hue}, 100%, 70%, ${0.9 + normalizedValue * 0.1})`;

      offCtx.fillStyle = barGradient;
      offCtx.fillRect(x, y, barWidth, barHeight);

      // Add mandelbrot-inspired edge detail
      if (barHeight > 20) {
        for (let edge = 0; edge < barWidth; edge += 2) {
          const mandel = MathUtils.mandelbrot(
            MathUtils.map(edge, 0, barWidth, -2, 2),
            MathUtils.map(y, 0, canvas.height, -2, 2) + this.time * 0.1,
            10
          );
          offCtx.fillStyle = `hsla(${hue + mandel * 80}, 100%, 75%, ${mandel * normalizedValue * 0.5})`;
          offCtx.fillRect(x + edge, y, 2, 4);
        }
      }

      // Draw highlight on top with lissajous pattern
      if (barHeight > 5) {
        offCtx.shadowBlur = 0;
        const lissajous = MathUtils.lissajous(this.time + i * 0.1, 3, 2, Math.PI / 2);
        const highlightY = y + (lissajous.y + 1) * 5;

        const highlightGradient = offCtx.createLinearGradient(x, highlightY, x, y + 25);
        highlightGradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${normalizedValue * 0.9})`);
        highlightGradient.addColorStop(1, `hsla(${hue}, 100%, 75%, 0)`);
        offCtx.fillStyle = highlightGradient;
        offCtx.fillRect(x, highlightY, barWidth, Math.min(25, barHeight));
      }

      // Draw reflection below with distortion
      if (barHeight > 10) {
        offCtx.shadowBlur = 0;
        const reflectionHeight = Math.min(barHeight * 0.5, 80);
        const reflectionGradient = offCtx.createLinearGradient(x, canvas.height, x, canvas.height - reflectionHeight);
        reflectionGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
        reflectionGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.15)`);
        reflectionGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

        // Add wave distortion to reflection
        offCtx.save();
        offCtx.beginPath();
        for (let ry = 0; ry < reflectionHeight; ry += 2) {
          const wave = Math.sin(this.time * 2 + ry * 0.1) * 2;
          offCtx.rect(x + wave, canvas.height - ry, barWidth, 2);
        }
        offCtx.fillStyle = reflectionGradient;
        offCtx.fill();
        offCtx.restore();
      }

      // Peak indicator with particle trail
      if (normalizedValue > 0.1) {
        // Update peak decay
        if (normalizedValue > (this.peakDecay[i] ?? 0)) {
          this.peakDecay[i] = normalizedValue;
        } else {
          this.peakDecay[i] = Math.max(0, (this.peakDecay[i] ?? 0) - 0.01);
        }

        const peakY = canvas.height - (this.peakDecay[i] ?? 0) * canvas.height * 0.9;

        // Peak shadow/glow - more intense
        offCtx.shadowBlur = 30;
        offCtx.shadowColor = `hsla(${hue}, 100%, 80%, 1)`;

        // Peak gradient bar with geometric pattern - brighter
        const peakGradient = offCtx.createLinearGradient(x, peakY - 5, x, peakY);
        peakGradient.addColorStop(0, `hsla(${hue + 30}, 100%, 90%, 1)`);
        peakGradient.addColorStop(1, `hsla(${hue + 30}, 100%, 75%, 1)`);

        offCtx.fillStyle = peakGradient;
        offCtx.fillRect(x, peakY - 4, barWidth, 4);

        // Fibonacci spiral peak particles - more visible
        const fib = MathUtils.fibonacciSpiralPoint(i % 21, 21, 10);
        offCtx.shadowBlur = 20;
        offCtx.fillStyle = `hsla(${hue + 40}, 100%, 95%, 1)`;
        offCtx.beginPath();
        offCtx.arc(x + barWidth / 2 + fib.x * Math.sin(this.time), peakY - 8 + fib.y * Math.cos(this.time), 3, 0, Math.PI * 2);
        offCtx.fill();
      }
    }

      offCtx.restore(); // End kaleidoscopic segment
    }

    offCtx.shadowBlur = 0;

    // Apply kaleidoscopic mirroring to main canvas
    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments);
      ctx.scale(seg % 2 === 0 ? 1 : -1, 1); // Mirror alternate segments
      ctx.translate(-centerX, -centerY);
      ctx.globalCompositeOperation = 'screen'; // Use screen blend for more vibrant effect
      ctx.globalAlpha = 0.85;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();
    }

    // Apply chromatic aberration overlay
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(offCanvas, this.chromaticShift, 0);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(offCanvas, 0, 0);
    ctx.globalAlpha = 0.95;
    ctx.drawImage(offCanvas, -this.chromaticShift, 0);

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    // Draw frequency spectrum overlay line - more visible
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.4 + avgAmplitude * 0.4})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';
    ctx.beginPath();

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap) + barWidth / 2;
      const barHeight = this.peakHistory[i] ?? 0;
      const y = canvas.height - barHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw floor line with glow - more visible
    ctx.strokeStyle = `rgba(100, 80, 150, ${0.5 + avgAmplitude * 0.4})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  public updateConfig(barCount: number): void {
    if (this.peakHistory.length !== barCount) {
      this.peakHistory = new Array<number>(barCount).fill(0);
      this.peakDecay = new Array<number>(barCount).fill(0);
      this.barVelocities = new Array<number>(barCount).fill(0);
    }
  }
}
