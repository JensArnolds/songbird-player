// File: src/components/visualizers/FrequencyBandLayeredRenderer.ts

import type { AudioAnalysis } from "@/utils/audioAnalysis";

export class FrequencyBandLayeredRenderer {
  private wavePhases: number[] = [];
  private layerHistory: number[] = [];
  private time = 0;

  // Color mapping for each frequency band
  private readonly bandColors = [
    { name: "bass", hue: 0, saturation: 80, lightness: 50 },      // Red/Orange
    { name: "lowMid", hue: 45, saturation: 90, lightness: 55 },  // Yellow
    { name: "mid", hue: 120, saturation: 70, lightness: 50 },     // Green
    { name: "highMid", hue: 180, saturation: 80, lightness: 55 },  // Cyan
    { name: "treble", hue: 240, saturation: 85, lightness: 50 }, // Blue/Purple
  ];

  constructor() {
    this.wavePhases = new Array<number>(5).fill(0);
    this.layerHistory = new Array<number>(5).fill(0);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement,
    audioAnalysis?: AudioAnalysis | null
  ): void {
    if (audioAnalysis) {
      this.time += 0.02;

      // Vibrant gradient background
      // Frequency bands are already normalized to 0-1 range
      const avgIntensity = (audioAnalysis.frequencyBands.bass + audioAnalysis.frequencyBands.mid + audioAnalysis.frequencyBands.treble) / 3;
      const hueShift = Math.min(60, avgIntensity * 40); // Clamp to max 60 degrees
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, `hsla(${265 + hueShift}, 90%, 25%, 1)`);
      bgGradient.addColorStop(1, `hsla(${245 + hueShift}, 85%, 18%, 1)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bands = [
        audioAnalysis.frequencyBands.bass,
        audioAnalysis.frequencyBands.lowMid,
        audioAnalysis.frequencyBands.mid,
        audioAnalysis.frequencyBands.highMid,
        audioAnalysis.frequencyBands.treble,
      ];

      const centerY = canvas.height / 2;
      const maxAmplitude = canvas.height * 0.35;
      const points = 200;

      // Draw layers from bottom to top for proper stacking
      for (let layerIndex = bands.length - 1; layerIndex >= 0; layerIndex--) {
        const bandValue = bands[layerIndex]!;
        const color = this.bandColors[layerIndex]!;

        // Smooth layer amplitude
        const targetAmplitude = bandValue;
        const currentAmplitude = this.layerHistory[layerIndex] ?? 0;
        const newAmplitude = currentAmplitude + (targetAmplitude - currentAmplitude) * 0.15;
        this.layerHistory[layerIndex] = newAmplitude;

        // Update wave phase
        this.wavePhases[layerIndex] = (this.wavePhases[layerIndex] ?? 0) + 0.02 * (1 + layerIndex * 0.1);

        // Vertical offset for parallax effect
        const layerOffset = (layerIndex - 2) * (canvas.height / 8);
        const amplitude = newAmplitude * maxAmplitude;

        const hueShift = Math.sin(this.time * 0.4 + layerIndex) * 15;
        const saturation = Math.min(100, color.saturation + newAmplitude * 25); // Higher saturation
        const lightness = Math.min(90, color.lightness + newAmplitude * 30); // Brighter

        // Create gradient for wave - more opaque
        const waveGradient = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
        waveGradient.addColorStop(0, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness + 20}%, 1)`);
        waveGradient.addColorStop(0.5, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, 1)`);
        waveGradient.addColorStop(1, `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness - 10}%, 0.9)`);

        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = 3 + newAmplitude * 4;
        ctx.shadowBlur = 25 + newAmplitude * 40;
        ctx.shadowColor = `hsla(${color.hue + hueShift}, 100%, 70%, ${0.9 + newAmplitude * 0.1})`;

        ctx.beginPath();

        for (let i = 0; i <= points; i++) {
          const x = (i / points) * canvas.width;
          const progress = i / points;

          // Complex wave with multiple frequencies
          const mainWave = Math.sin(progress * Math.PI * (2 + layerIndex) + this.wavePhases[layerIndex]!);
          const secondaryWave = Math.sin(progress * Math.PI * (4 + layerIndex * 2) + this.wavePhases[layerIndex]! * 1.5) * 0.3;
          const tertiaryWave = Math.sin(progress * Math.PI * (8 + layerIndex * 4) + this.wavePhases[layerIndex]! * 2) * 0.15;

          const combinedWave = mainWave + secondaryWave + tertiaryWave;
          const y = centerY + layerOffset + combinedWave * amplitude;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Fill area under wave for depth
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = `hsla(${color.hue + hueShift}, ${saturation}%, ${lightness}%, ${newAmplitude * 0.3})`;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    } else {
      // Fallback: clear canvas if no analysis
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
