import { ASPECT_RATIOS, BACKGROUND_PRESETS } from '../data/presets';
import type {
  ArrowColor,
  AuraColor,
  ChromeFrameStyle,
  FrameStyle,
  HookColor,
  SpeedlinesStyle,
  StickerColor,
  ThumbnailConfig,
} from '../types/thumbnail';
import { drawY2KSticker } from './y2kStickersRenderer';

const imageCache = new Map<string, HTMLImageElement>();
const imagePromiseCache = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImageCached(url: string): Promise<HTMLImageElement | null> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  if (imagePromiseCache.has(url)) {
    return imagePromiseCache.get(url)!;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      imagePromiseCache.delete(url);
      resolve(null);
    };
    img.src = url;
  });

  imagePromiseCache.set(url, promise);
  return promise;
}

export function preloadBackgroundAssets(): Promise<void> {
  const urls = Object.values(BACKGROUND_PRESETS).map((bg) => bg.imageUrl);
  return Promise.all(urls.map((u) => loadImageCached(u))).then(() => undefined);
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function drawSkyBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: ThumbnailConfig,
  bgImage: HTMLImageElement | null
) {
  const preset = BACKGROUND_PRESETS[config.background];
  const boost = config.vibranceBoost ?? 1;
  const contrastBoost = 1 + (boost - 1) * 0.45;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (config.background === 'nullysh-sky') {
    baseGrad.addColorStop(0, '#8CC5E8');
    baseGrad.addColorStop(0.55, '#D9EFFA');
    baseGrad.addColorStop(1, '#FFFFFF');
  } else if (config.background === 'sunset-soft') {
    baseGrad.addColorStop(0, '#8CC5E8');
    baseGrad.addColorStop(0.5, '#DCEEF8');
    baseGrad.addColorStop(1, '#F4EBD7');
  } else {
    baseGrad.addColorStop(0, '#0D0E12');
    baseGrad.addColorStop(0.55, '#15192B');
    baseGrad.addColorStop(1, '#0D0E12');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  if (bgImage) {
    ctx.save();
    if ('filter' in ctx && boost !== 1) {
      ctx.filter = `saturate(${boost.toFixed(2)}) contrast(${contrastBoost.toFixed(2)})`;
    }

    const srcW = bgImage.naturalWidth || bgImage.width;
    const srcH =
      config.background === 'chrome-dark'
        ? (bgImage.naturalHeight || bgImage.height) * 0.78
        : bgImage.naturalHeight || bgImage.height;

    const targetRatio = w / h;
    const srcRatio = srcW / srcH;

    let drawW = w;
    let drawH = h;
    let dx = 0;
    let dy = 0;

    if (srcRatio > targetRatio) {
      drawH = h;
      drawW = h * srcRatio;
      dx = (w - drawW) / 2;
    } else {
      drawW = w;
      drawH = w / srcRatio;
      dy = (h - drawH) / 2;
    }

    ctx.globalAlpha = config.background === 'chrome-dark' ? 0.85 : 0.9;
    ctx.drawImage(bgImage, 0, 0, srcW, srcH, dx, dy, drawW, drawH);
    ctx.restore();

    ctx.save();
    if (config.background === 'nullysh-sky') {
      const wash = ctx.createLinearGradient(0, 0, 0, h);
      wash.addColorStop(0, 'rgba(140, 197, 232, 0.24)');
      wash.addColorStop(0.55, 'rgba(217, 239, 250, 0.12)');
      wash.addColorStop(1, 'rgba(255, 255, 255, 0.45)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
    } else if (config.background === 'sunset-soft') {
      const wash = ctx.createLinearGradient(0, 0, 0, h);
      wash.addColorStop(0, 'rgba(140, 197, 232, 0.22)');
      wash.addColorStop(0.55, 'rgba(244, 235, 215, 0.14)');
      wash.addColorStop(1, 'rgba(244, 235, 215, 0.55)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
    } else {
      const darkWash = ctx.createLinearGradient(0, 0, 0, h);
      darkWash.addColorStop(0, 'rgba(13, 14, 18, 0.45)');
      darkWash.addColorStop(0.65, 'rgba(13, 14, 18, 0.55)');
      darkWash.addColorStop(1, 'rgba(13, 14, 18, 0.92)');
      ctx.fillStyle = darkWash;
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.65);
      glow.addColorStop(0, 'rgba(124, 58, 237, 0.20)');
      glow.addColorStop(0.5, 'rgba(77, 163, 224, 0.12)');
      glow.addColorStop(1, 'rgba(13, 14, 18, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  } else {
    ctx.save();
    const puffs = [
      { x: 0.18, y: 0.35, r: 0.28 },
      { x: 0.45, y: 0.28, r: 0.34 },
      { x: 0.78, y: 0.38, r: 0.30 },
      { x: 0.32, y: 0.65, r: 0.32 },
      { x: 0.68, y: 0.68, r: 0.30 },
    ];
    for (const p of puffs) {
      const rg = ctx.createRadialGradient(w * p.x, h * p.y, 0, w * p.x, h * p.y, w * p.r);
      if (preset.isDark) {
        rg.addColorStop(0, 'rgba(77, 163, 224, 0.16)');
        rg.addColorStop(1, 'rgba(13, 14, 18, 0)');
      } else {
        rg.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
}

function drawSpeedlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  focalX: number,
  focalY: number,
  style: SpeedlinesStyle,
  opacity: number,
  isDark: boolean
) {
  if (style === 'none' || opacity <= 0.01) return;

  const maxR = Math.hypot(w, h) * 1.05;
  const innerR = style === 'subtle' ? 90 : 120;
  const rayCount = style === 'subtle' ? 28 : style === 'vortex' ? 36 : 44;

  ctx.save();
  ctx.translate(focalX, focalY);

  const grad = ctx.createRadialGradient(0, 0, innerR * 0.5, 0, 0, maxR * 0.85);
  if (isDark) {
    grad.addColorStop(0, 'rgba(124, 58, 237, 0)');
    grad.addColorStop(0.28, `rgba(167, 139, 250, ${opacity * 0.65})`);
    grad.addColorStop(0.75, `rgba(77, 163, 224, ${opacity * 0.8})`);
    grad.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.3})`);
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.25, `rgba(255, 255, 255, ${opacity * 0.85})`);
    grad.addColorStop(0.75, `rgba(255, 255, 255, ${opacity * 0.55})`);
    grad.addColorStop(1, `rgba(77, 163, 224, ${opacity * 0.28})`);
  }

  ctx.fillStyle = grad;

  for (let i = 0; i < rayCount; i++) {
    const baseAngle = (i / rayCount) * Math.PI * 2;
    const widthFactor = style === 'subtle' ? 0.36 : i % 2 === 0 ? 0.42 : 0.22;
    const halfSpread = ((Math.PI * 2) / rayCount) * (widthFactor * 0.5);

    ctx.beginPath();
    if (style === 'vortex') {
      const swirl = 0.28;
      ctx.moveTo(Math.cos(baseAngle) * innerR, Math.sin(baseAngle) * innerR);
      ctx.quadraticCurveTo(
        Math.cos(baseAngle + swirl * 0.5) * (maxR * 0.45),
        Math.sin(baseAngle + swirl * 0.5) * (maxR * 0.45),
        Math.cos(baseAngle + swirl - halfSpread) * maxR,
        Math.sin(baseAngle + swirl - halfSpread) * maxR
      );
      ctx.lineTo(
        Math.cos(baseAngle + swirl + halfSpread) * maxR,
        Math.sin(baseAngle + swirl + halfSpread) * maxR
      );
      ctx.quadraticCurveTo(
        Math.cos(baseAngle + swirl * 0.5) * (maxR * 0.45),
        Math.sin(baseAngle + swirl * 0.5) * (maxR * 0.45),
        Math.cos(baseAngle) * innerR,
        Math.sin(baseAngle) * innerR
      );
    } else {
      ctx.moveTo(Math.cos(baseAngle) * (innerR * 0.4), Math.sin(baseAngle) * (innerR * 0.4));
      ctx.lineTo(
        Math.cos(baseAngle - halfSpread) * maxR,
        Math.sin(baseAngle - halfSpread) * maxR
      );
      ctx.lineTo(
        Math.cos(baseAngle + halfSpread) * maxR,
        Math.sin(baseAngle + halfSpread) * maxR
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawBacklightAura(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  auraColor: AuraColor,
  intensity: number
) {
  if (auraColor === 'none' || intensity <= 0.01) return;

  const palette: Record<Exclude<AuraColor, 'none'>, [string, string]> = {
    white: ['255, 255, 255', '217, 239, 250'],
    blue: ['77, 163, 224', '140, 197, 232'],
    purple: ['124, 58, 237', '192, 132, 252'],
    gold: ['250, 204, 21', '253, 224, 71'],
  };

  const [coreRgb, outerRgb] = palette[auraColor];

  ctx.save();
  const rg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  rg.addColorStop(0, `rgba(${coreRgb}, ${Math.min(0.92, 0.72 * intensity)})`);
  rg.addColorStop(0.38, `rgba(${outerRgb}, ${Math.min(0.75, 0.42 * intensity)})`);
  rg.addColorStop(0.72, `rgba(${outerRgb}, ${Math.min(0.35, 0.14 * intensity)})`);
  rg.addColorStop(1, `rgba(${outerRgb}, 0)`);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTopPixelDither(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number,
  isDark: boolean
) {
  if (intensity <= 0.01) return;

  const pixelSize = 4;
  const ditherHeight = Math.round(h * 0.3);
  const gridW = Math.ceil(w / pixelSize);
  const gridH = Math.ceil(ditherHeight / pixelSize);

  const off = document.createElement('canvas');
  off.width = gridW;
  off.height = gridH;
  const octx = off.getContext('2d');
  if (!octx) return;

  const imgData = octx.createImageData(gridW, gridH);
  const data = imgData.data;

  const r = isDark ? 124 : 56;
  const g = isDark ? 58 : 138;
  const b = isDark ? 237 : 204;

  for (let y = 0; y < gridH; y++) {
    const normY = y / gridH;
    const verticalFalloff = Math.pow(1 - normY, 1.85);
    for (let x = 0; x < gridW; x++) {
      const normX = x / gridW;
      const edgeBoost = 1 + 0.35 * Math.pow(Math.abs(normX - 0.5) * 2, 1.5);
      const density = Math.min(0.95, verticalFalloff * edgeBoost * 0.78);
      const threshold = (BAYER_4X4[y % 4][x % 4] + 0.5) / 16;

      if (density > threshold) {
        const idx = (y * gridW + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.round(255 * intensity * (0.55 + 0.45 * verticalFalloff));
      }
    }
  }

  octx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, gridW * pixelSize, gridH * pixelSize);
  ctx.restore();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFourPointGlint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  alpha: number
) {
  if (alpha <= 0.05) return;
  ctx.save();
  ctx.translate(cx, cy);

  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius * 1.15);
  halo.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
  halo.addColorStop(0.35, `rgba(140, 197, 232, ${0.48 * alpha})`);
  halo.addColorStop(1, 'rgba(140, 197, 232, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  const inner = outerRadius * 0.14;
  ctx.beginPath();
  ctx.moveTo(0, -outerRadius);
  ctx.quadraticCurveTo(inner * 0.5, -inner * 0.5, outerRadius, 0);
  ctx.quadraticCurveTo(inner * 0.5, inner * 0.5, 0, outerRadius);
  ctx.quadraticCurveTo(-inner * 0.5, inner * 0.5, -outerRadius, 0);
  ctx.quadraticCurveTo(-inner * 0.5, -inner * 0.5, 0, -outerRadius);
  ctx.closePath();

  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
  ctx.fill();
  ctx.restore();
}

function drawSparklesField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number
) {
  if (count <= 0) return;

  const anchorPoints = [
    { x: 0.12, y: 0.24, r: 22 },
    { x: 0.88, y: 0.22, r: 24 },
    { x: 0.22, y: 0.72, r: 16 },
    { x: 0.82, y: 0.74, r: 20 },
    { x: 0.48, y: 0.14, r: 18 },
    { x: 0.08, y: 0.54, r: 14 },
    { x: 0.92, y: 0.48, r: 18 },
    { x: 0.34, y: 0.88, r: 13 },
    { x: 0.68, y: 0.17, r: 16 },
    { x: 0.64, y: 0.87, r: 15 },
    { x: 0.17, y: 0.36, r: 12 },
    { x: 0.77, y: 0.36, r: 14 },
  ];

  const active = anchorPoints.slice(0, Math.min(count, anchorPoints.length));
  active.forEach((pt, idx) => {
    drawFourPointGlint(ctx, w * pt.x, h * pt.y, pt.r, idx % 2 === 0 ? 0.92 : 0.72);
  });
}

interface CharPlacement {
  char: string;
  x: number;
  y: number;
  angle: number;
}

function layoutTitleLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fontSize: number,
  centerX: number,
  centerY: number,
  curvature: number,
  maxWidth: number
): {
  placements: CharPlacement[];
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
  effectiveFontSize: number;
} {
  let effectiveFontSize = fontSize;
  ctx.font = `700 ${effectiveFontSize}px "Fredoka", sans-serif`;

  let widestLine = 0;
  for (const line of lines) {
    const m = ctx.measureText(line).width;
    if (m > widestLine) widestLine = m;
  }

  if (widestLine > maxWidth && widestLine > 0) {
    effectiveFontSize = Math.max(36, Math.floor(effectiveFontSize * (maxWidth / widestLine)));
    ctx.font = `700 ${effectiveFontSize}px "Fredoka", sans-serif`;
  }

  const lineHeight = effectiveFontSize * 1.06;
  const totalHeight = (lines.length - 1) * lineHeight;
  const placements: CharPlacement[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const letterSpacing = effectiveFontSize * 0.025;

  lines.forEach((line, lineIdx) => {
    const lineY = centerY - totalHeight / 2 + lineIdx * lineHeight;
    const chars = Array.from(line);
    const charWidths = chars.map((c) => ctx.measureText(c).width);
    const totalLineWidth =
      charWidths.reduce((acc, cw) => acc + cw, 0) + Math.max(0, chars.length - 1) * letterSpacing;

    if (Math.abs(curvature) < 0.5 || totalLineWidth < 10) {
      let cursorX = centerX - totalLineWidth / 2;
      chars.forEach((char, i) => {
        const cw = charWidths[i];
        const px = cursorX + cw / 2;
        const py = lineY;
        placements.push({ char, x: px, y: py, angle: 0 });
        minX = Math.min(minX, px - cw / 2);
        maxX = Math.max(maxX, px + cw / 2);
        minY = Math.min(minY, py - effectiveFontSize * 0.55);
        maxY = Math.max(maxY, py + effectiveFontSize * 0.55);
        cursorX += cw + letterSpacing;
      });
    } else {
      const maxArcAngle = (curvature / 30) * 0.58;
      const radius = totalLineWidth / Math.abs(maxArcAngle);
      const sign = curvature > 0 ? 1 : -1;
      const circleCenterY = lineY + sign * radius;

      let cursorArc = -totalLineWidth / 2;
      chars.forEach((char, i) => {
        const cw = charWidths[i];
        const midArc = cursorArc + cw / 2;
        const theta = (midArc / radius) * sign;

        const px = centerX + Math.sin(theta) * radius * sign;
        const py = circleCenterY - Math.cos(theta) * radius * sign;

        placements.push({ char, x: px, y: py, angle: theta });
        minX = Math.min(minX, px - cw / 2);
        maxX = Math.max(maxX, px + cw / 2);
        minY = Math.min(minY, py - effectiveFontSize * 0.55);
        maxY = Math.max(maxY, py + effectiveFontSize * 0.55);

        cursorArc += cw + letterSpacing;
      });
    }
  });

  if (placements.length === 0) {
    return {
      placements,
      minX: centerX - 100,
      maxX: centerX + 100,
      minY: centerY - 40,
      maxY: centerY + 40,
      effectiveFontSize,
    };
  }

  return { placements, minX, maxX, minY, maxY, effectiveFontSize };
}

function drawChromeTitle(
  ctx: CanvasRenderingContext2D,
  renderScale: number,
  config: ThumbnailConfig,
  centerX: number,
  centerY: number,
  maxWidth: number
): { minY: number; maxY: number; minX: number; maxX: number } {
  const rawLines = config.title
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (rawLines.length === 0) {
    return { minY: centerY - 30, maxY: centerY + 30, minX: centerX - 100, maxX: centerX + 100 };
  }

  const isDark = BACKGROUND_PRESETS[config.background].isDark;
  const intensity = config.chromeIntensity;

  const { placements, minX, maxX, minY, maxY, effectiveFontSize } = layoutTitleLines(
    ctx,
    rawLines,
    config.titleSize,
    centerX,
    centerY,
    config.titleCurvature,
    maxWidth
  );

  const pad = effectiveFontSize * 0.55;
  const boxX = Math.floor(minX - pad);
  const boxY = Math.floor(minY - pad);
  const boxW = Math.ceil(maxX - minX + pad * 2);
  const boxH = Math.ceil(maxY - minY + pad * 2);

  const chromeCanvas = document.createElement('canvas');
  chromeCanvas.width = Math.max(1, Math.round(boxW * renderScale));
  chromeCanvas.height = Math.max(1, Math.round(boxH * renderScale));
  const cCtx = chromeCanvas.getContext('2d');
  if (!cCtx) return { minY, maxY, minX, maxX };

  cCtx.scale(renderScale, renderScale);
  cCtx.translate(-boxX, -boxY);
  cCtx.font = `700 ${effectiveFontSize}px "Fredoka", sans-serif`;
  cCtx.textAlign = 'center';
  cCtx.textBaseline = 'middle';
  cCtx.lineJoin = 'round';
  cCtx.lineCap = 'round';

  const drawPlacements = (
    targetCtx: CanvasRenderingContext2D,
    mode: 'fill' | 'stroke',
    offsetX = 0,
    offsetY = 0
  ) => {
    for (const p of placements) {
      targetCtx.save();
      targetCtx.translate(p.x + offsetX, p.y + offsetY);
      if (p.angle !== 0) targetCtx.rotate(p.angle);
      if (mode === 'stroke') {
        targetCtx.strokeText(p.char, 0, 0);
      } else {
        targetCtx.fillText(p.char, 0, 0);
      }
      targetCtx.restore();
    }
  };

  const outlineWidth = Math.max(4, effectiveFontSize * 0.095);
  const rimColor = isDark ? '#0B1324' : '#1F3A52';

  const extrudeSteps = 4;
  for (let s = extrudeSteps; s >= 1; s--) {
    cCtx.strokeStyle = rimColor;
    cCtx.lineWidth = outlineWidth + s * 0.6;
    drawPlacements(cCtx, 'stroke', 0, s * 1.15);
    cCtx.fillStyle = rimColor;
    drawPlacements(cCtx, 'fill', 0, s * 1.15);
  }

  cCtx.strokeStyle = isDark ? '#1A2744' : '#1F3A52';
  cCtx.lineWidth = outlineWidth;
  drawPlacements(cCtx, 'stroke', 0, 0);

  const fillGrad = cCtx.createLinearGradient(0, minY, 0, maxY);
  if (isDark) {
    fillGrad.addColorStop(0.0, '#FFFFFF');
    fillGrad.addColorStop(0.18, '#E0ECFF');
    fillGrad.addColorStop(0.38, '#8BA9F7');
    fillGrad.addColorStop(0.49, '#192242');
    fillGrad.addColorStop(0.54, '#5B70B8');
    fillGrad.addColorStop(0.74, '#F5F8FF');
    fillGrad.addColorStop(0.89, '#8CC5E8');
    fillGrad.addColorStop(1.0, '#FFFFFF');
  } else {
    fillGrad.addColorStop(0.0, '#FFFFFF');
    fillGrad.addColorStop(0.19, '#E4F4FD');
    fillGrad.addColorStop(0.39, '#8BC6EB');
    fillGrad.addColorStop(0.49, '#1F3A52');
    fillGrad.addColorStop(0.54, '#5A94BE');
    fillGrad.addColorStop(0.74, '#F4FBFF');
    fillGrad.addColorStop(0.89, '#9DCBE6');
    fillGrad.addColorStop(1.0, '#FFFFFF');
  }

  cCtx.fillStyle = fillGrad;
  drawPlacements(cCtx, 'fill', 0, 0);

  const specCanvas = document.createElement('canvas');
  specCanvas.width = chromeCanvas.width;
  specCanvas.height = chromeCanvas.height;
  const sCtx = specCanvas.getContext('2d');
  if (sCtx) {
    sCtx.scale(renderScale, renderScale);
    sCtx.translate(-boxX, -boxY);
    sCtx.font = cCtx.font;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.lineJoin = 'round';

    sCtx.fillStyle = '#000000';
    drawPlacements(sCtx, 'fill', 0, 0);

    sCtx.globalCompositeOperation = 'source-in';

    const domeGrad = sCtx.createLinearGradient(0, minY, 0, minY + (maxY - minY) * 0.52);
    domeGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.92, 0.62 * intensity)})`);
    domeGrad.addColorStop(0.55, `rgba(255, 255, 255, ${Math.min(0.45, 0.24 * intensity)})`);
    domeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    sCtx.fillStyle = domeGrad;
    sCtx.fillRect(boxX, boxY, boxW, boxH);

    sCtx.save();
    sCtx.globalCompositeOperation = 'source-atop';
    sCtx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.95, 0.65 * intensity)})`;
    sCtx.lineWidth = Math.max(2, effectiveFontSize * 0.045);
    if ('filter' in sCtx) sCtx.filter = 'blur(1.5px)';
    drawPlacements(sCtx, 'stroke', -effectiveFontSize * 0.018, -effectiveFontSize * 0.024);
    sCtx.restore();

    sCtx.save();
    sCtx.globalCompositeOperation = 'source-atop';
    sCtx.strokeStyle = `rgba(217, 239, 250, ${Math.min(0.75, 0.45 * intensity)})`;
    sCtx.lineWidth = Math.max(1.5, effectiveFontSize * 0.03);
    if ('filter' in sCtx) sCtx.filter = 'blur(1px)';
    drawPlacements(sCtx, 'stroke', effectiveFontSize * 0.01, effectiveFontSize * 0.02);
    sCtx.restore();

    cCtx.save();
    cCtx.setTransform(1, 0, 0, 1, 0, 0);
    cCtx.drawImage(specCanvas, 0, 0);
    cCtx.restore();
  }

  const edgeBloom = config.edgeBloom ?? 0;

  if (edgeBloom > 0.02) {
    // Intense outer liquid bloom glow pass behind chrome title
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = isDark
      ? `rgba(139, 169, 247, ${Math.min(0.95, 0.78 * edgeBloom)})`
      : `rgba(140, 197, 232, ${Math.min(0.95, 0.85 * edgeBloom)})`;
    ctx.shadowBlur = 32 * edgeBloom;
    ctx.globalAlpha = Math.min(0.92, 0.55 * edgeBloom);
    ctx.drawImage(chromeCanvas, boxX, boxY, boxW, boxH);

    ctx.shadowColor = `rgba(255, 255, 255, ${Math.min(1, 0.9 * edgeBloom)})`;
    ctx.shadowBlur = 14 * edgeBloom;
    ctx.drawImage(chromeCanvas, boxX, boxY, boxW, boxH);
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(31, 58, 82, 0.34)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(chromeCanvas, boxX, boxY, boxW, boxH);
  ctx.restore();

  if (intensity >= 0.45) {
    const glintAlpha = Math.min(1, (intensity - 0.3) * 0.9);
    const glintSize = effectiveFontSize * 0.24;
    drawFourPointGlint(ctx, minX + effectiveFontSize * 0.14, minY + effectiveFontSize * 0.15, glintSize, glintAlpha);
    drawFourPointGlint(
      ctx,
      maxX - effectiveFontSize * 0.12,
      minY + effectiveFontSize * 0.28,
      glintSize * 0.72,
      glintAlpha * 0.85
    );
  }

  return { minY, maxY, minX, maxX };
}

function drawHookRibbon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  text: string,
  hookColor: HookColor,
  maxWidth: number
) {
  const clean = text.trim();
  if (!clean) return;

  let fontSize = 18;
  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  let textW = ctx.measureText(clean).width;
  const maxInner = maxWidth - 48;
  if (textW > maxInner && textW > 0) {
    fontSize = Math.max(12, Math.floor(fontSize * (maxInner / textW)));
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    textW = ctx.measureText(clean).width;
  }

  const boxW = textW + 38;
  const boxH = fontSize + 18;
  const x = -boxW / 2;
  const y = -boxH / 2;

  const themes: Record<HookColor, { bg: string; fg: string; border: string }> = {
    yellow: { bg: '#FACC15', fg: '#0D0E12', border: '#0D0E12' },
    red: { bg: '#EF4444', fg: '#FFFFFF', border: '#0D0E12' },
    purple: { bg: '#7C3AED', fg: '#FFFFFF', border: '#0D0E12' },
    white: { bg: '#FFFFFF', fg: '#0D0E12', border: '#1F3A52' },
  };
  const theme = themes[hookColor];

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((-1.9 * Math.PI) / 180);

  // Hard offset clickbait drop shadow
  drawRoundedRectPath(ctx, x + 4, y + 4, boxW, boxH, 8);
  ctx.fillStyle = '#0D0E12';
  ctx.fill();

  // Main high-contrast ribbon
  drawRoundedRectPath(ctx, x, y, boxW, boxH, 8);
  ctx.fillStyle = theme.bg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = theme.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clean, 0, 1);

  ctx.restore();
}

function buildTornPaperPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seedOffset = 0
) {
  ctx.beginPath();
  const topStep = 7;
  const sideStep = 5;

  for (let px = 0; px <= w; px += topStep) {
    const t = px / w;
    const jitter =
      Math.sin((px + seedOffset) * 0.16) * 2.1 +
      Math.cos((px + seedOffset) * 0.43) * 1.4 +
      Math.sin((px + seedOffset) * 0.91) * 0.9;
    const py = y + jitter * (0.6 + 0.4 * Math.sin(t * Math.PI));
    if (px === 0) ctx.moveTo(x + px, py);
    else ctx.lineTo(x + px, py);
  }

  for (let py = 0; py <= h; py += sideStep) {
    const jitter =
      Math.sin((py + seedOffset) * 0.32) * 5.2 +
      Math.cos((py + seedOffset) * 0.75) * 3.1;
    ctx.lineTo(x + w + jitter, y + py);
  }

  for (let px = w; px >= 0; px -= topStep) {
    const t = px / w;
    const jitter =
      Math.cos((px + seedOffset + 19) * 0.19) * 2.3 +
      Math.sin((px + seedOffset + 7) * 0.48) * 1.5 +
      Math.cos((px + seedOffset) * 0.87) * 0.9;
    ctx.lineTo(x + px, y + h + jitter * (0.6 + 0.4 * Math.sin(t * Math.PI)));
  }

  for (let py = h; py >= 0; py -= sideStep) {
    const jitter =
      Math.cos((py + seedOffset + 13) * 0.29) * 5.4 +
      Math.sin((py + seedOffset + 3) * 0.71) * 2.8;
    ctx.lineTo(x + jitter, y + py);
  }

  ctx.closePath();
}

function drawTornPaperSubtitle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  subtitle: string,
  maxStripWidth: number,
  isDarkBg: boolean
): number {
  const cleanText = subtitle.trim();
  if (!cleanText) return centerY;

  let fontSize = 24;
  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  let textW = ctx.measureText(cleanText).width;
  const maxTextW = maxStripWidth - 76;

  if (textW > maxTextW && textW > 0) {
    fontSize = Math.max(15, Math.floor(fontSize * (maxTextW / textW)));
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    textW = ctx.measureText(cleanText).width;
  }

  const stripW = Math.min(maxStripWidth, textW + 76);
  const stripH = fontSize + 30;
  const x = -stripW / 2;
  const y = -stripH / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((-1.15 * Math.PI) / 180);

  ctx.save();
  ctx.shadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.55)' : 'rgba(31, 58, 82, 0.20)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;
  buildTornPaperPath(ctx, x, y, stripW, stripH, 11);
  ctx.fillStyle = '#E5D8BD';
  ctx.fill();
  ctx.restore();

  buildTornPaperPath(ctx, x - 2, y + 2.2, stripW + 4, stripH + 1, 29);
  ctx.fillStyle = '#E4D7BA';
  ctx.fill();

  buildTornPaperPath(ctx, x, y, stripW, stripH, 11);
  ctx.fillStyle = '#F4EBD7';
  ctx.fill();

  ctx.save();
  ctx.clip();
  const paperGrad = ctx.createLinearGradient(x, y, x + stripW, y + stripH);
  paperGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  paperGrad.addColorStop(0.5, 'rgba(244, 235, 215, 0)');
  paperGrad.addColorStop(1, 'rgba(214, 198, 168, 0.22)');
  ctx.fillStyle = paperGrad;
  ctx.fillRect(x - 10, y - 10, stripW + 20, stripH + 20);

  ctx.fillStyle = 'rgba(130, 110, 82, 0.08)';
  for (let i = 0; i < 65; i++) {
    const fx = x + (((i * 73) % 100) / 100) * stripW;
    const fy = y + (((i * 41) % 100) / 100) * stripH;
    ctx.fillRect(fx, fy, 1.5, 1.5);
  }
  ctx.restore();

  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#1A1D24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanText, 0, 1);

  ctx.restore();
  return centerY + stripH / 2;
}

function drawTagsPill(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  tags: string[],
  maxPillWidth: number,
  isDarkBg: boolean
) {
  const cleanTags = tags.map((t) => t.trim()).filter(Boolean).slice(0, 4);
  if (cleanTags.length === 0) return;

  let fontSize = 18;
  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

  const dotRadius = 3.5;
  const gap = 16;

  const measureTotal = (fs: number) => {
    ctx.font = `700 ${fs}px "Plus Jakarta Sans", sans-serif`;
    const widths = cleanTags.map((t) => ctx.measureText(t).width);
    const sepWidth = (cleanTags.length - 1) * (gap * 2 + dotRadius * 2);
    return { widths, totalText: widths.reduce((a, b) => a + b, 0) + sepWidth };
  };

  let measured = measureTotal(fontSize);
  const maxInner = maxPillWidth - 52;
  if (measured.totalText > maxInner && measured.totalText > 0) {
    fontSize = Math.max(13, Math.floor(fontSize * (maxInner / measured.totalText)));
    measured = measureTotal(fontSize);
  }

  const pillW = measured.totalText + 52;
  const pillH = fontSize + 24;
  const px = centerX - pillW / 2;
  const py = centerY - pillH / 2;

  ctx.save();
  ctx.shadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.45)' : 'rgba(31, 58, 82, 0.14)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  drawRoundedRectPath(ctx, px, py, pillW, pillH, pillH / 2);
  ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, px, py, pillW, pillH, pillH / 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let cursor = centerX - measured.totalText / 2;
  cleanTags.forEach((tag, idx) => {
    ctx.fillStyle = '#1E293B';
    ctx.fillText(tag, cursor, centerY + 0.5);
    cursor += measured.widths[idx];

    if (idx < cleanTags.length - 1) {
      cursor += gap;
      ctx.beginPath();
      ctx.arc(cursor + dotRadius, centerY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#4DA3E0';
      ctx.fill();
      cursor += dotRadius * 2 + gap;
    }
  });
  ctx.restore();
}

function drawCornerBadge(
  ctx: CanvasRenderingContext2D,
  w: number,
  config: ThumbnailConfig
) {
  if (!config.showBadge || !config.badgeText.trim()) return;
  const text = config.badgeText.trim();

  const fontSize = 15;
  ctx.save();
  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  const textW = ctx.measureText(text).width;

  const padX = 18;
  const badgeH = 38;
  const dotSpace = 16;
  const badgeW = textW + padX * 2 + dotSpace;

  const margin = Math.round(w * 0.036);
  const placeRight =
    Boolean(config.mockupDataUrl) &&
    config.mockupPosition === 'left' &&
    !(config.stickerShow && config.stickerPosition === 'top-right');
  const bx = placeRight ? w - margin - badgeW : margin;
  const by = margin;

  ctx.shadowColor = 'rgba(13, 14, 18, 0.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;

  drawRoundedRectPath(ctx, bx, by, badgeW, badgeH, 10);
  ctx.fillStyle = config.badgeStyle === 'basefy-dark' ? '#0D0E12' : 'rgba(255, 255, 255, 0.88)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRectPath(ctx, bx, by, badgeW, badgeH, 10);
  ctx.strokeStyle =
    config.badgeStyle === 'basefy-dark' ? 'rgba(124, 58, 237, 0.65)' : 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const dx = bx + padX + 4;
  const dy = by + badgeH / 2;
  ctx.fillStyle = '#7C3AED';
  ctx.beginPath();
  ctx.moveTo(dx, dy - 5);
  ctx.lineTo(dx + 5, dy);
  ctx.lineTo(dx, dy + 5);
  ctx.lineTo(dx - 5, dy);
  ctx.closePath();
  ctx.fill();

  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = config.badgeStyle === 'basefy-dark' ? '#FFFFFF' : '#1E293B';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, bx + padX + dotSpace, dy + 0.5);
  ctx.restore();
}

function drawClickbaitArrow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: ThumbnailConfig,
  targetX: number,
  targetY: number
) {
  if (!config.arrowShow) return;

  const colorMap: Record<ArrowColor, { fill: string; stroke: string; ring: string }> = {
    red: { fill: '#EF4444', stroke: '#FFFFFF', ring: 'rgba(239, 68, 68, 0.92)' },
    yellow: { fill: '#FACC15', stroke: '#0D0E12', ring: 'rgba(250, 204, 21, 0.95)' },
    purple: { fill: '#7C3AED', stroke: '#FFFFFF', ring: 'rgba(124, 58, 237, 0.95)' },
    chrome: { fill: '#E2E8F0', stroke: '#1F3A52', ring: 'rgba(140, 197, 232, 0.95)' },
  };
  const palette = colorMap[config.arrowColor];

  // Optional target highlight ring
  if (config.arrowPulseRing) {
    ctx.save();
    const ringRadius = Math.min(w, h) * 0.14;
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 5;
    ctx.shadowColor = palette.ring;
    ctx.shadowBlur = 16;
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.arc(targetX, targetY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(targetX, targetY, ringRadius * 1.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Compute curved start point & tip offset so arrow points cleanly into target
  const fromLeft = targetX >= w * 0.45;
  const startX = fromLeft ? targetX - w * 0.18 : targetX + w * 0.18;
  const startY = targetY < h * 0.45 ? targetY + h * 0.2 : targetY - h * 0.22;
  const tipX = fromLeft ? targetX - 38 : targetX + 38;
  const tipY = targetY < h * 0.45 ? targetY + 26 : targetY - 22;

  const ctrlX = (startX + tipX) / 2 + (fromLeft ? -20 : 20);
  const ctrlY = startY + (tipY - startY) * 0.15;

  const angle = Math.atan2(tipY - ctrlY, tipX - ctrlX);
  const headLen = 36;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // Outer contrast outline
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
  ctx.stroke();

  // Inner bold shaft
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = palette.fill;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
  ctx.stroke();

  // Arrowhead
  const p1x = tipX - headLen * Math.cos(angle - Math.PI / 6);
  const p1y = tipY - headLen * Math.sin(angle - Math.PI / 6);
  const p2x = tipX - headLen * Math.cos(angle + Math.PI / 6);
  const p2y = tipY - headLen * Math.sin(angle + Math.PI / 6);
  const tipForwardX = tipX + 10 * Math.cos(angle);
  const tipForwardY = tipY + 10 * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(tipForwardX, tipForwardY);
  ctx.lineTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.closePath();

  ctx.lineWidth = 8;
  ctx.strokeStyle = palette.stroke;
  ctx.stroke();
  ctx.fillStyle = palette.fill;
  ctx.fill();

  ctx.restore();
}

function drawClickbaitSticker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: ThumbnailConfig
) {
  if (!config.stickerShow || !config.stickerText.trim()) return;

  const lines = config.stickerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (lines.length === 0) return;

  const colorMap: Record<StickerColor, { bg: string; fg: string; border: string }> = {
    yellow: { bg: '#FACC15', fg: '#0D0E12', border: '#0D0E12' },
    red: { bg: '#EF4444', fg: '#FFFFFF', border: '#FFFFFF' },
    purple: { bg: '#7C3AED', fg: '#FFFFFF', border: '#FFFFFF' },
    lime: { bg: '#A3E635', fg: '#0D0E12', border: '#0D0E12' },
  };
  const theme = colorMap[config.stickerColor];

  const marginX = w * 0.095;
  const marginY = h * 0.14;
  let cx = w - marginX;
  let cy = marginY;
  let rot = -8;

  if (config.stickerPosition === 'bottom-right') {
    cx = w - marginX;
    cy = h - marginY;
    rot = -6;
  } else if (config.stickerPosition === 'bottom-left') {
    cx = marginX;
    cy = h - marginY;
    rot = 7;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);

  if (config.stickerShape === 'starburst') {
    const spikes = 18;
    const outerR = 78;
    const innerR = 61;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = theme.bg;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.border;
    ctx.stroke();

    // Inner subtle dashed accent circle
    ctx.beginPath();
    ctx.arc(0, 0, innerR - 8, 0, Math.PI * 2);
    ctx.strokeStyle =
      theme.fg === '#FFFFFF' ? 'rgba(255,255,255,0.35)' : 'rgba(13,14,18,0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (config.stickerShape === 'ribbon') {
    const rw = 166;
    const rh = 72;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 7;
    drawRoundedRectPath(ctx, -rw / 2, -rh / 2, rw, rh, 12);
    ctx.fillStyle = theme.bg;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.border;
    ctx.stroke();
  } else {
    const pw = 164;
    const ph = 66;
    ctx.save();
    ctx.shadowColor = theme.bg;
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 4;
    drawRoundedRectPath(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = theme.bg;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = theme.border;
    ctx.stroke();
  }

  // Text inside sticker
  let fontSize = lines.length === 1 ? 24 : 22;
  ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  const maxTextW = config.stickerShape === 'starburst' ? 102 : 138;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (widest > maxTextW && widest > 0) {
    fontSize = Math.max(12, Math.floor(fontSize * (maxTextW / widest)));
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
  }

  ctx.fillStyle = theme.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineStep = fontSize * 1.08;
  const startY = -((lines.length - 1) * lineStep) / 2;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 0, startY + idx * lineStep);
  });

  ctx.restore();
}

function drawUrgencyFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frameStyle: FrameStyle
) {
  if (frameStyle === 'none') return;

  ctx.save();
  const thickness = 10;

  if (frameStyle === 'chrome') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.25, '#8CC5E8');
    grad.addColorStop(0.5, '#1F3A52');
    grad.addColorStop(0.75, '#D9EFFA');
    grad.addColorStop(1, '#FFFFFF');
    ctx.strokeStyle = grad;
  } else {
    const colors: Record<Exclude<FrameStyle, 'none' | 'chrome'>, string> = {
      purple: '#7C3AED',
      yellow: '#FACC15',
      red: '#EF4444',
    };
    ctx.strokeStyle = colors[frameStyle];
    ctx.shadowColor = colors[frameStyle];
    ctx.shadowBlur = 22;
  }

  ctx.lineWidth = thickness * 2;
  ctx.strokeRect(0, 0, w, h);
  ctx.restore();
}

function createLiquidChromeGrad(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  isDark: boolean
): CanvasGradient {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  if (isDark) {
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.16, '#DCEAFE');
    grad.addColorStop(0.36, '#8BA9F7');
    grad.addColorStop(0.5, '#192242');
    grad.addColorStop(0.56, '#5B70B8');
    grad.addColorStop(0.76, '#F5F8FF');
    grad.addColorStop(0.9, '#8CC5E8');
    grad.addColorStop(1.0, '#FFFFFF');
  } else {
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.18, '#E4F4FD');
    grad.addColorStop(0.38, '#8CC5E8');
    grad.addColorStop(0.5, '#1F3A52');
    grad.addColorStop(0.56, '#5A94BE');
    grad.addColorStop(0.76, '#F4FBFF');
    grad.addColorStop(0.9, '#9DCBE6');
    grad.addColorStop(1.0, '#FFFFFF');
  }
  return grad;
}

function drawChromeRivet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  isDark: boolean
) {
  ctx.save();
  ctx.shadowColor = 'rgba(13, 14, 18, 0.4)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  const rg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  rg.addColorStop(0, '#FFFFFF');
  rg.addColorStop(0.35, '#D9EFFA');
  rg.addColorStop(0.72, isDark ? '#5B70B8' : '#5A94BE');
  rg.addColorStop(1, '#1F3A52');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#1F3A52';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Tiny specular dot
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();
}

function drawChainLinkFlat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  linkLen: number,
  linkWidth: number,
  tubeThick: number,
  isDark: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const halfL = linkLen / 2;
  const halfW = linkWidth / 2;
  const r = halfW;

  const traceLink = () => {
    ctx.beginPath();
    ctx.moveTo(-halfL + r, -halfW);
    ctx.lineTo(halfL - r, -halfW);
    ctx.arc(halfL - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-halfL + r, halfW);
    ctx.arc(-halfL + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.closePath();
  };

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(13, 14, 18, 0.42)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  traceLink();
  ctx.lineWidth = tubeThick + 3.5;
  ctx.strokeStyle = isDark ? '#0B1324' : '#1F3A52';
  ctx.stroke();
  ctx.restore();

  // Metallic chrome tube fill stroke
  traceLink();
  ctx.lineWidth = tubeThick;
  ctx.strokeStyle = createLiquidChromeGrad(ctx, 0, -halfW - tubeThick / 2, 0, halfW + tubeThick / 2, isDark);
  ctx.stroke();

  // Crisp top specular sheen
  ctx.save();
  traceLink();
  ctx.lineWidth = Math.max(1.5, tubeThick * 0.3);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.translate(0, -tubeThick * 0.14);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawChainLinkEdge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  len: number,
  thick: number,
  isDark: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.shadowColor = 'rgba(13, 14, 18, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  drawRoundedRectPath(ctx, -len / 2, -thick / 2, len, thick, thick / 2);
  ctx.fillStyle = createLiquidChromeGrad(ctx, -len / 2, -thick / 2, len / 2, thick / 2, isDark);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDark ? '#0B1324' : '#1F3A52';
  ctx.stroke();

  // Specular streak
  drawRoundedRectPath(ctx, -len * 0.34, -thick * 0.28, len * 0.68, thick * 0.26, thick * 0.13);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();

  ctx.restore();
}

function drawChromeBorderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: ChromeFrameStyle,
  scaleFactor: number,
  isDark: boolean,
  edgeBloom = 0
) {
  if (frame === 'none') return;
  const s = Math.max(0.6, Math.min(2, scaleFactor));

  if (frame === 'chrome-solid') {
    const t = Math.round(16 * s);

    if (edgeBloom > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowColor = isDark
        ? `rgba(139, 169, 247, ${Math.min(0.95, 0.85 * edgeBloom)})`
        : `rgba(255, 255, 255, ${Math.min(0.98, 0.9 * edgeBloom)})`;
      ctx.shadowBlur = 28 * edgeBloom;
      ctx.lineWidth = t * 2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.8, 0.45 * edgeBloom)})`;
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    ctx.save();
    // Soft inner drop shadow cast onto artwork
    ctx.shadowColor = 'rgba(15, 23, 42, 0.34)';
    ctx.shadowBlur = 16;
    ctx.lineWidth = t * 2;
    ctx.strokeStyle = '#1F3A52';
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();

    // Metallic chrome band
    ctx.save();
    ctx.lineWidth = t * 2;
    ctx.strokeStyle = createLiquidChromeGrad(ctx, 0, 0, w, h, isDark);
    ctx.strokeRect(0, 0, w, h);

    // Outer & inner crisp metallic contour lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isDark ? '#0B1324' : '#1F3A52';
    ctx.strokeRect(t, t, w - t * 2, h - t * 2);

    // Bright inner specular bevel highlight
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeRect(t - 3, t - 3, w - (t - 3) * 2, h - (t - 3) * 2);
    ctx.restore();
    return;
  }

  if (frame === 'chrome-bevel') {
    const outerT = Math.round(12 * s);
    const gap = Math.round(8 * s);
    const innerOffset = outerT + gap;

    ctx.save();
    // Outer metallic rail
    ctx.shadowColor =
      edgeBloom > 0.05
        ? isDark
          ? `rgba(139, 169, 247, ${Math.min(0.95, 0.8 * edgeBloom)})`
          : `rgba(255, 255, 255, ${Math.min(0.95, 0.85 * edgeBloom)})`
        : 'rgba(15, 23, 42, 0.32)';
    ctx.shadowBlur = edgeBloom > 0.05 ? 24 * edgeBloom : 14;
    ctx.lineWidth = outerT * 2;
    ctx.strokeStyle = createLiquidChromeGrad(ctx, 0, 0, w, h, isDark);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    // Dark recessed channel
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1F3A52';
    ctx.strokeRect(outerT, outerT, w - outerT * 2, h - outerT * 2);

    // Inner bright chrome hairline rail
    ctx.lineWidth = Math.max(3, Math.round(4 * s));
    ctx.strokeStyle = createLiquidChromeGrad(ctx, w, 0, 0, h, isDark);
    ctx.strokeRect(innerOffset, innerOffset, w - innerOffset * 2, h - innerOffset * 2);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(31, 58, 82, 0.7)';
    ctx.strokeRect(innerOffset + 2, innerOffset + 2, w - (innerOffset + 2) * 2, h - (innerOffset + 2) * 2);
    ctx.restore();

    // 4 sculpted 3D corner rivets
    const rivetPos = innerOffset + Math.round(12 * s);
    const rivetR = Math.round(7.5 * s);
    drawChromeRivet(ctx, rivetPos, rivetPos, rivetR, isDark);
    drawChromeRivet(ctx, w - rivetPos, rivetPos, rivetR, isDark);
    drawChromeRivet(ctx, rivetPos, h - rivetPos, rivetR, isDark);
    drawChromeRivet(ctx, w - rivetPos, h - rivetPos, rivetR, isDark);
    return;
  }

  if (frame === 'chrome-dither') {
    const dotSize = Math.max(4, Math.round(6 * s));
    const step = dotSize * 2;
    const rows = 4;

    // Outer thin chrome hairline
    ctx.save();
    ctx.lineWidth = Math.round(8 * s);
    ctx.strokeStyle = createLiquidChromeGrad(ctx, 0, 0, w, h, isDark);
    ctx.strokeRect(0, 0, w, h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1F3A52';
    ctx.strokeRect(Math.round(4 * s), Math.round(4 * s), w - Math.round(8 * s), h - Math.round(8 * s));
    ctx.restore();

    // Staggered Y2K Bayer pixel dither dots hugging all 4 edges
    ctx.save();
    const metalGrad = createLiquidChromeGrad(ctx, 0, 0, w, h, isDark);

    const drawPixelDot = (px: number, py: number, size: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      if (edgeBloom > 0.05) {
        ctx.shadowColor = isDark
          ? `rgba(139, 169, 247, ${Math.min(0.95, 0.8 * edgeBloom)})`
          : `rgba(255, 255, 255, ${Math.min(0.98, 0.85 * edgeBloom)})`;
        ctx.shadowBlur = 10 * edgeBloom;
      }
      // Micro dark rim shadow
      ctx.fillStyle = '#1F3A52';
      ctx.fillRect(px + 1, py + 1, size, size);
      // Chrome pixel
      ctx.fillStyle = metalGrad;
      ctx.fillRect(px, py, size, size);
      // Specular highlight top-left corner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(px, py, Math.max(1.5, size * 0.45), Math.max(1.5, size * 0.45));
      ctx.restore();
    };

    const marginBase = Math.round(6 * s);

    for (let r = 0; r < rows; r++) {
      const inset = marginBase + r * step * 0.68;
      const offsetX = (r % 2) * (step / 2);
      const alpha = 1 - r * 0.18;
      const dotR = Math.max(2.5, dotSize * (1 - r * 0.12));

      // Top & Bottom edges
      for (let x = inset + offsetX; x < w - inset; x += step) {
        const bayerVal = BAYER_4X4[r % 4][Math.floor(x / step) % 4];
        if (r === 0 || bayerVal <= 12 - r * 3) {
          drawPixelDot(x, inset, dotR, alpha);
          drawPixelDot(x, h - inset - dotR, dotR, alpha);
        }
      }

      // Left & Right edges
      for (let y = inset + step + offsetX; y < h - inset - step; y += step) {
        const bayerVal = BAYER_4X4[Math.floor(y / step) % 4][r % 4];
        if (r === 0 || bayerVal <= 12 - r * 3) {
          drawPixelDot(inset, y, dotR, alpha);
          drawPixelDot(w - inset - dotR, y, dotR, alpha);
        }
      }
    }
    ctx.restore();
    return;
  }

  if (frame === 'chrome-chain') {
    const margin = Math.round(18 * s);
    const linkStep = Math.round(42 * s);
    const linkLen = Math.round(30 * s);
    const linkWidth = Math.round(15 * s);
    const tubeThick = Math.max(4, Math.round(5.5 * s));

    const drawSideChain = (x1: number, y1: number, x2: number, y2: number) => {
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const count = Math.max(2, Math.round(dist / linkStep));
      const actualStep = dist / count;

      // Pass 1: Interlocking edge-on links between flat links
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        drawChainLinkEdge(ctx, cx, cy, angle, actualStep * 0.62, tubeThick * 1.45, isDark);
      }

      // Pass 2: Front flat oval links
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        drawChainLinkFlat(ctx, cx, cy, angle, linkLen, linkWidth, tubeThick, isDark);
      }
    };

    // Draw 4 perimeter sides
    drawSideChain(margin, margin, w - margin, margin);
    drawSideChain(w - margin, margin, w - margin, h - margin);
    drawSideChain(w - margin, h - margin, margin, h - margin);
    drawSideChain(margin, h - margin, margin, margin);

    // Corner hero connecting rings
    const cornerSize = Math.round(9 * s);
    drawChromeRivet(ctx, margin, margin, cornerSize, isDark);
    drawChromeRivet(ctx, w - margin, margin, cornerSize, isDark);
    drawChromeRivet(ctx, w - margin, h - margin, cornerSize, isDark);
    drawChromeRivet(ctx, margin, h - margin, cornerSize, isDark);
  }
}

function drawMockupImage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: ThumbnailConfig,
  mockupImg: HTMLImageElement
): { x: number; y: number } {
  const natW = mockupImg.naturalWidth || mockupImg.width;
  const natH = mockupImg.naturalHeight || mockupImg.height;
  if (!natW || !natH) return { x: w * 0.75, y: h * 0.52 };

  const baseMaxW = config.mockupPosition === 'center' ? w * 0.44 : w * 0.36;
  const baseMaxH = h * 0.62;
  const fitRatio = Math.min(baseMaxW / natW, baseMaxH / natH);

  const drawW = natW * fitRatio * config.mockupScale;
  const drawH = natH * fitRatio * config.mockupScale;

  let anchorX = w * 0.76;
  if (config.mockupPosition === 'left') anchorX = w * 0.24;
  if (config.mockupPosition === 'center') anchorX = w * 0.5;

  const anchorY =
    (config.mockupPosition === 'center' ? h * 0.54 : h * 0.52) + config.mockupOffsetY;

  const edgeBloom = config.edgeBloom ?? 0;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.rotate((config.mockupRotation * Math.PI) / 180);

  if (edgeBloom > 0.05) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 24 * edgeBloom;
    ctx.globalAlpha = Math.min(0.85, 0.55 * edgeBloom);
    ctx.drawImage(mockupImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  if (config.mockupShadow) {
    ctx.shadowColor = 'rgba(13, 14, 18, 0.38)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 18;
  }

  const boost = config.vibranceBoost ?? 1;
  if ('filter' in ctx && boost !== 1) {
    ctx.filter = `saturate(${boost.toFixed(2)}) contrast(${(1 + (boost - 1) * 0.3).toFixed(2)})`;
  }

  ctx.drawImage(mockupImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  return { x: anchorX, y: anchorY };
}

function drawExtraImage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: ThumbnailConfig,
  extraImg: HTMLImageElement
) {
  const natW = extraImg.naturalWidth || extraImg.width;
  const natH = extraImg.naturalHeight || extraImg.height;
  if (!natW || !natH) return;

  const baseMaxW = w * 0.4;
  const baseMaxH = h * 0.55;
  const fitRatio = Math.min(baseMaxW / natW, baseMaxH / natH);

  const drawW = natW * fitRatio * config.extraImageScale;
  const drawH = natH * fitRatio * config.extraImageScale;

  const anchorX = (config.extraImageX / 100) * w;
  const anchorY = (config.extraImageY / 100) * h;

  const edgeBloom = config.edgeBloom ?? 0;

  ctx.save();
  ctx.globalAlpha = config.extraImageOpacity ?? 1;
  ctx.translate(anchorX, anchorY);
  ctx.rotate(((config.extraImageRotation ?? 0) * Math.PI) / 180);

  if (edgeBloom > 0.05) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 22 * edgeBloom;
    ctx.globalAlpha = Math.min(0.85, 0.52 * edgeBloom) * (config.extraImageOpacity ?? 1);
    ctx.drawImage(extraImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  if (config.extraImageShadow) {
    ctx.shadowColor = 'rgba(13, 14, 18, 0.36)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 14;
  }

  const boost = config.vibranceBoost ?? 1;
  if ('filter' in ctx && boost !== 1) {
    ctx.filter = `saturate(${boost.toFixed(2)}) contrast(${(1 + (boost - 1) * 0.3).toFixed(2)})`;
  }

  ctx.drawImage(extraImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

export interface RenderOptions {
  scale?: number;
}

export async function renderThumbnailToCanvas(
  canvas: HTMLCanvasElement,
  config: ThumbnailConfig,
  options: RenderOptions = {}
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }

  const ratioSpec = ASPECT_RATIOS[config.aspectRatio];
  const logicalW = ratioSpec.width;
  const logicalH = ratioSpec.height;
  const renderScale = options.scale ?? 1;

  const targetW = Math.round(logicalW * renderScale);
  const targetH = Math.round(logicalH * renderScale);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const preset = BACKGROUND_PRESETS[config.background];
  const [bgImg, mockupImg, extraImg] = await Promise.all([
    loadImageCached(preset.imageUrl),
    config.mockupDataUrl ? loadImageCached(config.mockupDataUrl) : Promise.resolve(null),
    config.extraImageDataUrl ? loadImageCached(config.extraImageDataUrl) : Promise.resolve(null),
  ]);

  ctx.save();
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);

  // 1. Sky & Clouds
  drawSkyBackground(ctx, logicalW, logicalH, config, bgImg);

  const hasMockup = Boolean(mockupImg);
  const isCenterMockup = hasMockup && config.mockupPosition === 'center';

  let textCenterX = logicalW * 0.5;
  let textMaxWidth = logicalW * 0.84;
  let mockupAnchor = { x: logicalW * 0.76, y: logicalH * 0.52 + config.mockupOffsetY };

  if (hasMockup && config.mockupPosition === 'right') {
    textCenterX = logicalW * 0.34;
    textMaxWidth = logicalW * 0.54;
    mockupAnchor = { x: logicalW * 0.76, y: logicalH * 0.52 + config.mockupOffsetY };
  } else if (hasMockup && config.mockupPosition === 'left') {
    textCenterX = logicalW * 0.66;
    textMaxWidth = logicalW * 0.54;
    mockupAnchor = { x: logicalW * 0.24, y: logicalH * 0.52 + config.mockupOffsetY };
  } else if (isCenterMockup) {
    mockupAnchor = { x: logicalW * 0.5, y: logicalH * 0.54 + config.mockupOffsetY };
  }

  const titleCenterY = isCenterMockup
    ? logicalH * 0.24
    : config.showSubtitle || config.showTags
    ? logicalH * 0.38
    : logicalH * 0.5;

  const subtitleCenterY = isCenterMockup ? logicalH * 0.72 : logicalH * 0.64;
  const tagsCenterY = isCenterMockup ? logicalH * 0.87 : logicalH * 0.825;

  // 2. Speedlines / Impact Burst
  const burstFocalX = hasMockup && !isCenterMockup ? mockupAnchor.x : textCenterX;
  const burstFocalY = hasMockup && !isCenterMockup ? mockupAnchor.y : titleCenterY;
  drawSpeedlines(
    ctx,
    logicalW,
    logicalH,
    burstFocalX,
    burstFocalY,
    config.speedlinesStyle,
    config.speedlinesOpacity,
    preset.isDark
  );

  // 3. Top Pixelated Halftone/Dither
  drawTopPixelDither(ctx, logicalW, logicalH, config.ditherIntensity, preset.isDark);

  // 4. Backlight Aura (behind mockup if present, otherwise behind title)
  drawBacklightAura(
    ctx,
    hasMockup ? mockupAnchor.x : textCenterX,
    hasMockup ? mockupAnchor.y : titleCenterY,
    hasMockup ? logicalW * 0.34 : logicalW * 0.42,
    config.auraColor,
    config.auraIntensity
  );

  // 5. Extra Y2K Sparkles Field
  drawSparklesField(ctx, logicalW, logicalH, config.sparklesCount);

  // 6. Product Mockup
  if (hasMockup && mockupImg) {
    mockupAnchor = drawMockupImage(ctx, logicalW, logicalH, config, mockupImg);
  }

  // 6b. Free-positioned 2nd image (behind text layer)
  if (extraImg && config.extraImageLayer === 'behind-text') {
    drawExtraImage(ctx, logicalW, logicalH, config, extraImg);
  }

  // 6c. Y2K Stickers (behind text layer)
  for (const sticker of config.y2kStickers ?? []) {
    if (sticker.layer === 'behind-text') {
      drawY2KSticker(ctx, logicalW, logicalH, sticker, preset.isDark, config.edgeBloom ?? 0);
    }
  }

  // 7. Inflated Liquid Chrome 3D Title
  const titleBounds = drawChromeTitle(
    ctx,
    renderScale,
    config,
    textCenterX,
    titleCenterY,
    textMaxWidth
  );

  // 8. Upper Impact Hook Tape
  if (config.showHook && config.hookText.trim()) {
    const hookY = Math.max(46, titleBounds.minY - 26);
    drawHookRibbon(ctx, textCenterX, hookY, config.hookText, config.hookColor, textMaxWidth);
  }

  // 9. Cream Torn Paper Strip Subtitle
  if (config.showSubtitle && config.subtitle.trim()) {
    drawTornPaperSubtitle(
      ctx,
      textCenterX,
      subtitleCenterY,
      config.subtitle,
      Math.min(logicalW * 0.82, textMaxWidth + 32),
      preset.isDark
    );
  }

  // 10. Translucent Glass Pill with Blue Dots
  if (config.showTags && config.tags.some((t) => t.trim().length > 0)) {
    drawTagsPill(
      ctx,
      textCenterX,
      tagsCenterY,
      config.tags,
      Math.min(logicalW * 0.86, textMaxWidth + 40),
      preset.isDark
    );
  }

  // 10b. Free-positioned 2nd image (front layer)
  if (extraImg && config.extraImageLayer !== 'behind-text') {
    drawExtraImage(ctx, logicalW, logicalH, config, extraImg);
  }

  // 10c. Y2K Stickers (front layer)
  for (const sticker of config.y2kStickers ?? []) {
    if (sticker.layer !== 'behind-text') {
      drawY2KSticker(ctx, logicalW, logicalH, sticker, preset.isDark, config.edgeBloom ?? 0);
    }
  }

  // 11. Clickbait Arrow & Target Ring
  let arrowTargetX = mockupAnchor.x;
  let arrowTargetY = mockupAnchor.y;
  if (config.arrowTarget === 'title' || (!hasMockup && config.arrowTarget === 'mockup')) {
    arrowTargetX = textCenterX + (titleBounds.maxX - titleBounds.minX) * 0.32;
    arrowTargetY = (titleBounds.minY + titleBounds.maxY) / 2;
  } else if (config.arrowTarget === 'center') {
    arrowTargetX = logicalW * 0.5;
    arrowTargetY = logicalH * 0.5;
  }
  drawClickbaitArrow(ctx, logicalW, logicalH, config, arrowTargetX, arrowTargetY);

  // 12. Corner Badge
  drawCornerBadge(ctx, logicalW, config);

  // 13. Promo Starburst / Sticker
  drawClickbaitSticker(ctx, logicalW, logicalH, config);

  // 14. Urgency Frame Border
  drawUrgencyFrame(ctx, logicalW, logicalH, config.frameStyle);

  // 15. Metallic Chrome Border Frame
  drawChromeBorderFrame(
    ctx,
    logicalW,
    logicalH,
    config.chromeFrame ?? 'none',
    config.chromeFrameScale ?? 1,
    preset.isDark,
    config.edgeBloom ?? 0
  );

  ctx.restore();
}

export async function exportThumbnail2x(
  config: ThumbnailConfig,
  format: 'png' | 'webp'
): Promise<void> {
  const offscreen = document.createElement('canvas');
  await renderThumbnailToCanvas(offscreen, config, { scale: 2 });

  const mime = format === 'webp' ? 'image/webp' : 'image/png';
  const quality = format === 'webp' ? 0.96 : 1.0;

  return new Promise((resolve) => {
    offscreen.toBlob(
      (blob) => {
        if (!blob) {
          resolve();
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeSlug = (config.title || 'nullysh-thumbnail')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        link.download = `${safeSlug || 'nullysh'}-${config.aspectRatio.replace(':', 'x')}-2x.${format}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      mime,
      quality
    );
  });
}

export async function generatePreviewSnapshot(config: ThumbnailConfig): Promise<string> {
  const offscreen = document.createElement('canvas');
  await renderThumbnailToCanvas(offscreen, config, { scale: 0.35 });
  return offscreen.toDataURL('image/webp', 0.82);
}
