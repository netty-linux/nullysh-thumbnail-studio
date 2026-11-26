import type { Y2KStickerItem } from '../types/thumbnail';

function createStickerChromeGrad(
  ctx: CanvasRenderingContext2D,
  size: number,
  isDark: boolean
): CanvasGradient {
  const grad = ctx.createLinearGradient(-size * 0.4, -size, size * 0.4, size);
  if (isDark) {
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.2, '#DCEAFE');
    grad.addColorStop(0.42, '#8BA9F7');
    grad.addColorStop(0.51, '#1A2344');
    grad.addColorStop(0.57, '#5B70B8');
    grad.addColorStop(0.78, '#F5F8FF');
    grad.addColorStop(0.92, '#8CC5E8');
    grad.addColorStop(1.0, '#FFFFFF');
  } else {
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.2, '#E5F4FD');
    grad.addColorStop(0.42, '#8CC5E8');
    grad.addColorStop(0.51, '#1F3A52');
    grad.addColorStop(0.57, '#5A94BE');
    grad.addColorStop(0.78, '#F4FBFF');
    grad.addColorStop(0.92, '#9DCBE6');
    grad.addColorStop(1.0, '#FFFFFF');
  }
  return grad;
}

function drawEdgeBloomHalo(
  ctx: CanvasRenderingContext2D,
  tracePath: () => void,
  radius: number,
  edgeBloom: number,
  isDark: boolean
) {
  if (edgeBloom <= 0.02) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Wide atmospheric bloom
  tracePath();
  ctx.shadowColor = isDark
    ? `rgba(139, 169, 247, ${Math.min(0.95, 0.72 * edgeBloom)})`
    : `rgba(140, 197, 232, ${Math.min(0.95, 0.75 * edgeBloom)})`;
  ctx.shadowBlur = 26 * edgeBloom;
  ctx.lineWidth = Math.max(4, radius * 0.16);
  ctx.strokeStyle = isDark
    ? `rgba(167, 139, 250, ${Math.min(0.85, 0.52 * edgeBloom)})`
    : `rgba(255, 255, 255, ${Math.min(0.95, 0.65 * edgeBloom)})`;
  ctx.stroke();

  // Tight crisp liquid highlight rim
  tracePath();
  ctx.shadowColor = `rgba(255, 255, 255, ${Math.min(0.98, 0.8 * edgeBloom)})`;
  ctx.shadowBlur = 10 * edgeBloom;
  ctx.lineWidth = Math.max(2, radius * 0.08);
  ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.9, 0.55 * edgeBloom)})`;
  ctx.stroke();

  ctx.restore();
}

function finishChromeShape(
  ctx: CanvasRenderingContext2D,
  tracePath: () => void,
  radius: number,
  isDark: boolean,
  edgeBloom: number
) {
  const outlineColor = isDark ? '#0B1324' : '#1F3A52';

  // Edge Bloom halo behind metallic outline
  drawEdgeBloomHalo(ctx, tracePath, radius, edgeBloom, isDark);

  // Soft 3D drop shadow + dark metallic contour
  ctx.save();
  ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(31, 58, 82, 0.36)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 9;
  tracePath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(4, radius * 0.14);
  ctx.strokeStyle = outlineColor;
  ctx.stroke();
  ctx.restore();

  // Liquid chrome gradient fill
  tracePath();
  ctx.fillStyle = createStickerChromeGrad(ctx, radius, isDark);
  ctx.fill();

  // Glossy upper specular pillow highlight
  ctx.save();
  tracePath();
  ctx.clip();

  const glossBoost = 1 + edgeBloom * 0.28;
  const gloss = ctx.createLinearGradient(0, -radius, 0, radius * 0.25);
  gloss.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.96, 0.76 * glossBoost)})`);
  gloss.addColorStop(0.55, `rgba(255, 255, 255, ${Math.min(0.42, 0.16 * glossBoost)})`);
  gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(-radius * 1.4, -radius * 1.4, radius * 2.8, radius * 1.8);

  // Inner top-left rim bevel
  ctx.translate(-radius * 0.06, -radius * 0.08);
  tracePath();
  ctx.lineWidth = Math.max(2.5, radius * 0.09);
  ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, 0.82 + edgeBloom * 0.15)})`;
  ctx.stroke();
  ctx.restore();
}

export function drawY2KSticker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  item: Y2KStickerItem,
  isDark: boolean,
  edgeBloom = 0
) {
  const cx = (item.x / 100) * w;
  const cy = (item.y / 100) * h;
  const baseRadius = 56 * item.scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((item.rotation * Math.PI) / 180);

  if (item.type === 'star-3d') {
    const outer = baseRadius;
    const inner = baseRadius * 0.46;
    const trace = () => {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);
  } else if (item.type === 'heart-chrome') {
    const r = baseRadius * 0.96;
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.88);
      ctx.bezierCurveTo(-r * 1.25, r * 0.12, -r * 1.05, -r * 0.92, 0, -r * 0.32);
      ctx.bezierCurveTo(r * 1.05, -r * 0.92, r * 1.25, r * 0.12, 0, r * 0.88);
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);
  } else if (item.type === 'spark-burst') {
    const outer = baseRadius * 1.1;
    const inner = baseRadius * 0.22;

    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, outer * (1.15 + edgeBloom * 0.3));
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    halo.addColorStop(0.4, `rgba(140, 197, 232, ${Math.min(0.85, 0.42 + edgeBloom * 0.25)})`);
    halo.addColorStop(1, 'rgba(140, 197, 232, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, outer * (1.15 + edgeBloom * 0.3), 0, Math.PI * 2);
    ctx.fill();

    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(0, -outer);
      ctx.quadraticCurveTo(inner * 0.55, -inner * 0.55, outer, 0);
      ctx.quadraticCurveTo(inner * 0.55, inner * 0.55, 0, outer);
      ctx.quadraticCurveTo(-inner * 0.55, inner * 0.55, -outer, 0);
      ctx.quadraticCurveTo(-inner * 0.55, -inner * 0.55, 0, -outer);
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);
  } else if (item.type === 'glyph-orbit') {
    const r = baseRadius;
    const outlineColor = isDark ? '#0B1324' : '#1F3A52';

    ctx.save();
    ctx.rotate(-0.42);
    ctx.shadowColor =
      edgeBloom > 0.05
        ? isDark
          ? `rgba(139, 169, 247, ${Math.min(0.95, 0.7 * edgeBloom)})`
          : `rgba(255, 255, 255, ${Math.min(0.95, 0.85 * edgeBloom)})`
        : 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = edgeBloom > 0.05 ? 20 * edgeBloom : 14;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.18, r * 0.36, 0, Math.PI, Math.PI * 2);
    ctx.lineWidth = Math.max(5, r * 0.18);
    ctx.strokeStyle = outlineColor;
    ctx.stroke();

    ctx.lineWidth = Math.max(3, r * 0.11);
    ctx.strokeStyle = createStickerChromeGrad(ctx, r, isDark);
    ctx.stroke();
    ctx.restore();

    const traceSphere = () => {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    };
    finishChromeShape(ctx, traceSphere, r * 0.48, isDark, edgeBloom);

    ctx.save();
    ctx.rotate(-0.42);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.18, r * 0.36, 0, 0, Math.PI);
    ctx.lineWidth = Math.max(5, r * 0.18);
    ctx.strokeStyle = outlineColor;
    ctx.stroke();

    ctx.lineWidth = Math.max(3, r * 0.11);
    ctx.strokeStyle = createStickerChromeGrad(ctx, r, isDark);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -r * 0.02, r * 1.18, r * 0.34, 0, 0.15, Math.PI - 0.15);
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();
    ctx.restore();
  } else if (item.type === 'glyph-cross') {
    const outer = baseRadius * 1.05;
    const mid = baseRadius * 0.62;
    const inner = baseRadius * 0.24;
    const trace = () => {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 4 === 0 ? outer : i % 4 === 2 ? mid : inner;
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);
  } else if (item.type === 'lightning-chrome') {
    const r = baseRadius * 1.05;
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(r * 0.16, -r);
      ctx.lineTo(-r * 0.56, r * 0.06);
      ctx.lineTo(-r * 0.06, r * 0.06);
      ctx.lineTo(-r * 0.24, r);
      ctx.lineTo(r * 0.56, -r * 0.08);
      ctx.lineTo(r * 0.06, -r * 0.08);
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);
  } else if (item.type === 'cd-disc') {
    const r = baseRadius;
    const hole = r * 0.24;
    const outlineColor = isDark ? '#0B1324' : '#1F3A52';

    if (edgeBloom > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowColor = isDark
        ? `rgba(139, 169, 247, ${Math.min(0.95, 0.78 * edgeBloom)})`
        : `rgba(255, 255, 255, ${Math.min(0.98, 0.85 * edgeBloom)})`;
      ctx.shadowBlur = 24 * edgeBloom;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.85, 0.5 * edgeBloom)})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.36)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 9;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.arc(0, 0, hole, 0, Math.PI * 2, true);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.arc(0, 0, hole, 0, Math.PI * 2, true);
    ctx.clip();

    const baseGrad = ctx.createLinearGradient(-r, -r, r, r);
    baseGrad.addColorStop(0, '#FFFFFF');
    baseGrad.addColorStop(0.28, '#CBE7F8');
    baseGrad.addColorStop(0.5, '#8CC5E8');
    baseGrad.addColorStop(0.72, '#F3FAFF');
    baseGrad.addColorStop(1, '#9AC7E3');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    const wedges = [
      { a0: -0.6, a1: 0.15, color: 'rgba(124, 58, 237, 0.38)' },
      { a0: 0.15, a1: 0.65, color: 'rgba(56, 189, 248, 0.45)' },
      { a0: 2.5, a1: 3.25, color: 'rgba(167, 139, 250, 0.4)' },
      { a0: 3.25, a1: 3.85, color: 'rgba(255, 255, 255, 0.72)' },
    ];
    for (const wd of wedges) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 1.1, wd.a0, wd.a1);
      ctx.closePath();
      ctx.fillStyle = wd.color;
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(31, 58, 82, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, hole, 0, Math.PI * 2);
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  } else if (item.type === 'butterfly-chrome') {
    const r = baseRadius;
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.22);
      ctx.bezierCurveTo(-r * 0.45, -r * 1.05, -r * 1.25, -r * 0.75, -r * 0.92, -r * 0.05);
      ctx.bezierCurveTo(-r * 1.1, r * 0.45, -r * 0.45, r * 0.95, 0, r * 0.38);
      ctx.bezierCurveTo(r * 0.45, r * 0.95, r * 1.1, r * 0.45, r * 0.92, -r * 0.05);
      ctx.bezierCurveTo(r * 1.25, -r * 0.75, r * 0.45, -r * 1.05, 0, -r * 0.22);
      ctx.closePath();
    };
    finishChromeShape(ctx, trace, baseRadius, isDark, edgeBloom);

    ctx.beginPath();
    ctx.ellipse(0, r * 0.06, r * 0.08, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#0B1324' : '#1F3A52';
    ctx.fill();
  }

  ctx.restore();
}
