import React, { useEffect, useRef, useState } from 'react';
import { BookmarkPlus, Download, Check, Move } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import type { AspectRatioKey, ThumbnailConfig } from '../types/thumbnail';
import {
  preloadBackgroundAssets,
  renderThumbnailToCanvas,
} from '../utils/canvasRenderer';

interface CanvasPreviewProps {
  config: ThumbnailConfig;
  onSelectSticker: (id: string | null) => void;
  onChange: (patch: Partial<ThumbnailConfig>) => void;
  onAspectRatioChange: (ratio: AspectRatioKey) => void;
  onExport: (format: 'png' | 'webp') => Promise<void>;
  onSaveToGallery: () => Promise<void>;
  isExporting: 'png' | 'webp' | null;
  isSaving: boolean;
  justSaved: boolean;
}

type DragTarget =
  | { kind: 'sticker'; id: string }
  | { kind: 'extra' }
  | null;

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  config,
  onSelectSticker,
  onChange,
  onAspectRatioChange,
  onExport,
  onSaveToGallery,
  isExporting,
  isSaving,
  justSaved,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);

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
  const aspectContainerClass = isPortrait
    ? 'max-w-[420px] max-h-[68vh]'
    : isSquare
    ? 'max-w-[600px] max-h-[68vh]'
    : 'max-w-[960px]';

  return (
    <div className="flex-1 flex flex-col min-w-0 studio-grid-bg lg:h-[calc(100vh-57px)]">
      {/* Canvas Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#0D0E12]/90 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            role="group"
            aria-label="Proporção da thumbnail"
            className="inline-flex flex-wrap items-center gap-0.5 p-1 bg-[#15171E] rounded-lg border border-white/10"
          >
            {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => {
              const item = ASPECT_RATIOS[key];
              const active = config.aspectRatio === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={`${item.label} — ${item.subtitle} (${item.width}×${item.height})`}
                  onClick={() => onAspectRatioChange(key)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    active
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <span>
              {spec.width}×{spec.height}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Saída 2x: {spec.width * 2}×{spec.height * 2}px
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onSaveToGallery}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-white/12 bg-[#15171E] text-slate-200 hover:border-white/25 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {justSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salvo na Galeria</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar na Galeria'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onExport('webp')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-white/12 bg-[#15171E] text-slate-100 hover:border-[#7C3AED] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting === 'webp' ? 'Gerando...' : 'WebP 2x'}</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('png')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting === 'png' ? 'Gerando...' : 'PNG 2x'}</span>
          </button>
        </div>
      </div>

      {/* Centered Preview Stage */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 sm:p-10 overflow-auto">
        <div
          className={`w-full ${aspectContainerClass} rounded-xl overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.65)] ring-1 ring-white/15 bg-[#12141B]`}
          style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              const pos = getPointerPercent(e.clientX, e.clientY);
              if (!pos) return;

              // Hit-test Y2K stickers first (topmost first)
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

              // Fallback to dragging free 2nd image if present
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

        {hasDraggableContent && (
          <div className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Move className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>
              Clique e arraste stickers Y2K ou a 2ª imagem diretamente no preview para reposicionar
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
