import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Move, X, ZoomIn, ZoomOut } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import type { AspectRatioKey, ThumbnailConfig } from '../types/thumbnail';
import {
  preloadBackgroundAssets,
  renderThumbnailToCanvas,
} from '../utils/canvasRenderer';
import { SegmentedControl, Tooltip } from './ui/StudioPrimitives';

interface CanvasPreviewProps {
  config: ThumbnailConfig;
  onSelectSticker: (id: string | null) => void;
  onChange: (patch: Partial<ThumbnailConfig>) => void;
  onAspectRatioChange: (ratio: AspectRatioKey) => void;
}

type DragTarget =
  | { kind: 'sticker'; id: string }
  | { kind: 'extra' }
  | null;

type ZoomMode = 'fit' | '100' | '200';

const ZOOM_STEPS: ZoomMode[] = ['fit', '100', '200'];

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  config,
  onSelectSticker,
  onChange,
  onAspectRatioChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    preloadBackgroundAssets().then(() => {
      if (mounted) setAssetsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      renderThumbnailToCanvas(canvas, config, { scale: dpr });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [config, assetsReady]);

  const getPointerPercent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, Math.round(rawX * 2) / 2)),
      y: Math.max(0, Math.min(100, Math.round(rawY * 2) / 2)),
    };
  };

  const applyDrag = (target: DragTarget, clientX: number, clientY: number) => {
    if (!target) return;
    const pos = getPointerPercent(clientX, clientY);
    if (!pos) return;

    if (target.kind === 'sticker') {
      const list = config.y2kStickers ?? [];
      onChange({
        y2kStickers: list.map((item) =>
          item.id === target.id ? { ...item, x: pos.x, y: pos.y } : item
        ),
      });
    } else if (target.kind === 'extra') {
      onChange({ extraImageX: pos.x, extraImageY: pos.y });
    }
  };

  const spec = ASPECT_RATIOS[config.aspectRatio];
  const hasDraggableContent =
    Boolean(config.extraImageDataUrl) || (config.y2kStickers?.length ?? 0) > 0;

  const isPortrait = spec.height > spec.width;
  const isSquare = spec.height === spec.width;

  const zoomIndex = ZOOM_STEPS.indexOf(zoomMode);
  const stepZoom = (delta: -1 | 1) => {
    const nextIdx = Math.max(0, Math.min(ZOOM_STEPS.length - 1, zoomIndex + delta));
    setZoomMode(ZOOM_STEPS[nextIdx]);
  };

  const stageStyle: React.CSSProperties =
    zoomMode === 'fit'
      ? { aspectRatio: `${spec.width} / ${spec.height}` }
      : {
          width: `${Math.round(spec.width * (zoomMode === '200' ? 1.5 : 1))}px`,
          height: `${Math.round(spec.height * (zoomMode === '200' ? 1.5 : 1))}px`,
        };

  const fitSizeClass =
    zoomMode === 'fit'
      ? isPortrait
        ? 'w-full max-w-[430px] max-h-[72vh]'
        : isSquare
        ? 'w-full max-w-[620px] max-h-[72vh]'
        : 'w-full max-w-[980px] max-h-[72vh]'
      : 'shrink-0';

  const ratioOptions = (Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => {
    const item = ASPECT_RATIOS[key];
    return {
      value: key,
      label: item.label,
      title: `${item.label} · ${item.subtitle} (${item.width}×${item.height})`,
    };
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 studio-grid-bg h-[calc(100vh-48px)]">
      {/* Compact Ratio & Zoom Toolbar */}
      <div className="h-11 flex items-center justify-between gap-3 px-4 bg-[var(--bg-panel)]/95 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <SegmentedControl<AspectRatioKey>
            ariaLabel="Proporção da thumbnail"
            value={config.aspectRatio}
            onChange={onAspectRatioChange}
            options={ratioOptions}
            tone="accent"
            size="sm"
            scrollable
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            <span className="text-[var(--text-secondary)]">
              {spec.width}×{spec.height}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Saída 2x: {spec.width * 2}×{spec.height * 2}px
            </span>
          </div>

          <div
            role="group"
            aria-label="Controles de zoom do preview"
            className="inline-flex items-center gap-0.5 p-0.5 rounded-[var(--radius-md)] bg-[var(--bg-app)] border border-[var(--border-subtle)]"
          >
            <Tooltip content="Diminuir zoom">
              <button
                type="button"
                onClick={() => stepZoom(-1)}
                disabled={zoomIndex === 0}
                aria-label="Diminuir zoom"
                className="h-6 w-6 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] disabled:opacity-35 cursor-pointer transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {(
              [
                { id: 'fit', label: 'Ajustar', icon: <Maximize2 className="w-3 h-3" /> },
                { id: '100', label: '100%' },
                { id: '200', label: '200%' },
              ] as { id: ZoomMode; label: string; icon?: React.ReactNode }[]
            ).map((z) => {
              const active = zoomMode === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoomMode(z.id)}
                  className={`h-6 px-2 text-[11px] font-medium rounded-[var(--radius-sm)] inline-flex items-center gap-1 tabular-nums cursor-pointer transition-colors ${
                    active
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] ring-1 ring-white/10'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {z.icon}
                  <span>{z.label}</span>
                </button>
              );
            })}

            <Tooltip content="Aumentar zoom">
              <button
                type="button"
                onClick={() => stepZoom(1)}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                aria-label="Aumentar zoom"
                className="h-6 w-6 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] disabled:opacity-35 cursor-pointer transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Hero Preview Stage */}
      <div className="relative flex-1 overflow-auto studio-scroll">
        <div
          className={`min-h-full min-w-full flex flex-col items-center justify-center p-6 sm:p-10 ${
            zoomMode !== 'fit' ? 'w-max' : ''
          }`}
        >
          <div
            className={`relative ${fitSizeClass} rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-panel)] transition-[width,height] duration-200`}
            style={{
              ...stageStyle,
              boxShadow: 'var(--shadow-stage)',
            }}
          >
            {!assetsReady && (
              <div
                aria-hidden="true"
                className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-panel)]/90 animate-pulse"
              >
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Renderizando preview...
                </span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              onPointerDown={(e) => {
                const pos = getPointerPercent(e.clientX, e.clientY);
                if (!pos) return;

                const stickers = config.y2kStickers ?? [];
                for (let i = stickers.length - 1; i >= 0; i--) {
                  const st = stickers[i];
                  const hitRadius = Math.max(7, 8.5 * st.scale);
                  const dist = Math.hypot(pos.x - st.x, pos.y - st.y);
                  if (dist <= hitRadius) {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const target: DragTarget = { kind: 'sticker', id: st.id };
                    setDragTarget(target);
                    onSelectSticker(st.id);
                    applyDrag(target, e.clientX, e.clientY);
                    return;
                  }
                }

                if (config.extraImageDataUrl) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const target: DragTarget = { kind: 'extra' };
                  setDragTarget(target);
                  applyDrag(target, e.clientX, e.clientY);
                }
              }}
              onPointerMove={(e) => {
                if (!dragTarget) return;
                applyDrag(dragTarget, e.clientX, e.clientY);
              }}
              onPointerUp={(e) => {
                if (!dragTarget) return;
                e.currentTarget.releasePointerCapture(e.pointerId);
                setDragTarget(null);
              }}
              onPointerCancel={() => setDragTarget(null)}
              className={`w-full h-full block touch-none ${
                hasDraggableContent
                  ? dragTarget
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : ''
              }`}
              aria-label="Preview em tempo real da thumbnail Nullysh"
            />
          </div>
        </div>

        {/* Floating subtle drag hint */}
        {hasDraggableContent && !hintDismissed && (
          <div className="pointer-events-none sticky bottom-4 inset-x-0 flex justify-center px-4">
            <div className="pointer-events-auto inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-[var(--bg-elevated)]/95 border border-[var(--border-subtle)] shadow-[var(--shadow-soft)] text-[11px] text-[var(--text-secondary)]">
              <Move className="w-3 h-3 text-[var(--accent-text)] shrink-0" />
              <span>Arraste stickers Y2K ou a 2ª imagem direto no preview</span>
              <button
                type="button"
                onClick={() => setHintDismissed(true)}
                aria-label="Dispensar dica"
                className="p-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
