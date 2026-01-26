// File: src/utils/colorExtractor.ts

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  hue: number;
  saturation: number;
  lightness: number;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function enhanceSaturation(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const hsl = rgbToHsl(r, g, b);
  const enhancedS = Math.min(100, hsl.s * 1.5);
  const enhancedL = Math.max(20, Math.min(80, hsl.l));
  return hslToRgb(hsl.h, enhancedS, enhancedL);
}

function generateFallbackFromImage(imageData: ImageData): ColorPalette {
  const data = imageData.data;
  let r = 0, g = 0, b = 0, count = 0;
  
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3] ?? 0;
    if (alpha > 128) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      count++;
    }
  }
  
  if (count === 0) {
    r = 100; g = 150; b = 200;
  } else {
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);
  }
  
  const hsl = rgbToHsl(r, g, b);
  const enhanced = enhanceSaturation(r, g, b);
  
  const secondaryRgb = hslToRgb((hsl.h + 40) % 360, Math.min(100, hsl.s + 30), Math.min(90, hsl.l + 10));
  const accentRgb = hslToRgb((hsl.h + 80) % 360, Math.min(100, hsl.s + 25), Math.min(85, hsl.l + 15));
  
  return {
    primary: `rgba(${enhanced.r}, ${enhanced.g}, ${enhanced.b}, 0.8)`,
    secondary: `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.8)`,
    accent: `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.8)`,
    hue: hsl.h,
    saturation: Math.min(100, hsl.s + 20),
    lightness: hsl.l,
  };
}

export async function extractColorsFromImage(
  imageUrl: string,
): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    const extractRobustColors = (imageData: ImageData): ColorPalette => {
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      
      const colors: Array<{ r: number; g: number; b: number; count: number; vibrancy: number }> = [];
      const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>();
      
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] ?? 0;
        if (alpha < 128) continue;
        
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        
        const bucketSize = 16;
        const bucketKey = `${Math.floor(r / bucketSize)},${Math.floor(g / bucketSize)},${Math.floor(b / bucketSize)}`;
        
        const existing = colorBuckets.get(bucketKey);
        if (existing) {
          existing.r += r;
          existing.g += g;
          existing.b += b;
          existing.count++;
        } else {
          colorBuckets.set(bucketKey, { r, g, b, count: 1 });
        }
      }
      
      for (const bucket of colorBuckets.values()) {
        const avgR = Math.floor(bucket.r / bucket.count);
        const avgG = Math.floor(bucket.g / bucket.count);
        const avgB = Math.floor(bucket.b / bucket.count);
        
        const hsl = rgbToHsl(avgR, avgG, avgB);
        const vibrancy = hsl.s * (hsl.l > 20 && hsl.l < 80 ? 1 : 0.5);
        
        colors.push({
          r: avgR,
          g: avgG,
          b: avgB,
          count: bucket.count,
          vibrancy,
        });
      }
      
      if (colors.length === 0) {
        return generateFallbackFromImage(imageData);
      }
      
      colors.sort((a, b) => (b.count * b.vibrancy) - (a.count * a.vibrancy));
      
      const primary = colors[0];
      let secondary = colors.find(c => {
        const hsl1 = rgbToHsl(primary.r, primary.g, primary.b);
        const hsl2 = rgbToHsl(c.r, c.g, c.b);
        const hueDiff = Math.abs(hsl1.h - hsl2.h);
        return hueDiff > 30 && hueDiff < 150 && c.vibrancy > 30;
      }) ?? colors[Math.min(1, colors.length - 1)] ?? primary;
      
      let accent = colors.find(c => {
        const hsl1 = rgbToHsl(primary.r, primary.g, primary.b);
        const hsl2 = rgbToHsl(c.r, c.g, c.b);
        const hueDiff = Math.abs(hsl1.h - hsl2.h);
        return hueDiff > 60 && c.vibrancy > 25;
      }) ?? colors[Math.min(2, colors.length - 1)] ?? secondary;
      
      const primaryHsl = rgbToHsl(primary.r, primary.g, primary.b);
      
      if (primaryHsl.s < 20) {
        const enhanced = enhanceSaturation(primary.r, primary.g, primary.b);
        primary.r = enhanced.r;
        primary.g = enhanced.g;
        primary.b = enhanced.b;
      }
      
      if (secondary === primary) {
        const hsl = rgbToHsl(primary.r, primary.g, primary.b);
        const secondaryRgb = hslToRgb((hsl.h + 40) % 360, Math.min(100, hsl.s + 20), Math.min(90, hsl.l + 15));
        secondary = { r: secondaryRgb.r, g: secondaryRgb.g, b: secondaryRgb.b, count: 0, vibrancy: hsl.s };
      }
      
      if (accent === primary || accent === secondary) {
        const hsl = rgbToHsl(primary.r, primary.g, primary.b);
        const accentRgb = hslToRgb((hsl.h + 80) % 360, Math.min(100, hsl.s + 15), Math.min(85, hsl.l + 20));
        accent = { r: accentRgb.r, g: accentRgb.g, b: accentRgb.b, count: 0, vibrancy: hsl.s };
      }
      
      const finalHsl = rgbToHsl(primary.r, primary.g, primary.b);
      
      return {
        primary: `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.8)`,
        secondary: `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0.8)`,
        accent: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.8)`,
        hue: finalHsl.h,
        saturation: finalHsl.s,
        lightness: finalHsl.l,
      };
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(generateFallbackFromImage(new ImageData(new Uint8ClampedArray(4), 1, 1)));
          return;
        }

        const size = 100;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        
        const palette = extractRobustColors(imageData);
        resolve(palette);
      } catch (error) {
        console.error("Error extracting colors:", error);
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#6495ed";
          ctx.fillRect(0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1);
          resolve(generateFallbackFromImage(imageData));
        } else {
          resolve({
            primary: "rgba(100, 149, 237, 0.8)",
            secondary: "rgba(135, 206, 250, 0.8)",
            accent: "rgba(70, 130, 180, 0.8)",
            hue: 210,
            saturation: 60,
            lightness: 65,
          });
        }
      }
    };

    img.onerror = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#6495ed";
        ctx.fillRect(0, 0, 1, 1);
        const imageData = ctx.getImageData(0, 0, 1, 1);
        resolve(generateFallbackFromImage(imageData));
      } else {
        resolve({
          primary: "rgba(100, 149, 237, 0.8)",
          secondary: "rgba(135, 206, 250, 0.8)",
          accent: "rgba(70, 130, 180, 0.8)",
          hue: 210,
          saturation: 60,
          lightness: 65,
        });
      }
    };

    img.src = imageUrl;
  });
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function createGradientFromPalette(
  ctx: CanvasRenderingContext2D,
  palette: ColorPalette,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(0.5, palette.secondary);
  gradient.addColorStop(1, palette.accent);
  return gradient;
}
