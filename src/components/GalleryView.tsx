import React from 'react';
import { Copy, Download, Layers, Plus, Trash2 } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import type { SavedThumbnailItem } from '../types/thumbnail';
import { Button, Tooltip } from './ui/StudioPrimitives';

interface GalleryViewProps {
  items: SavedThumbnailItem[];
  onLoadItem: (item: SavedThumbnailItem) => void;
  onExportItem: (item: SavedThumbnailItem, format: 'png' | 'webp') => void;
  onDeleteItem: (id: string) => void;
  onGoToStudio: () => void;
}

function formatDatePtBr(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  items,
  onLoadItem,
  onExportItem,
  onDeleteItem,
  onGoToStudio,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-48px)] studio-grid-bg">
        <div className="max-w-sm w-full text-center space-y-4 p-8 rounded-[var(--radius-lg)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
          <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5 text-[var(--accent-text)]" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-[-0.015em]">
              Nenhuma thumbnail salva ainda
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              Salve suas artes no estúdio com Ctrl+S para duplicar, exportar ou reutilizar
              configurações em um clique.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={onGoToStudio} className="w-full">
            <Plus className="w-4 h-4" />
            <span>Criar primeira thumbnail</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-48px)] studio-grid-bg p-6 lg:p-8 overflow-y-auto studio-scroll">
      <div className="max-w-[1240px] mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
              Últimas criadas
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Abra qualquer arte salva no estúdio para editar ou exportar novamente em 2x.
            </p>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums shrink-0">
            {items.length} {items.length === 1 ? 'arte salva' : 'artes salvas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const spec = ASPECT_RATIOS[item.config.aspectRatio] ?? ASPECT_RATIOS['16:9'];
            return (
              <article
                key={item.id}
                className="flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-lg)] overflow-hidden transition-colors duration-150"
              >
                <div className="aspect-video bg-[var(--bg-app)] flex items-center justify-center overflow-hidden border-b border-[var(--border-subtle)]">
                  <img
                    src={item.previewDataUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h2 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-1 font-mono tabular-nums">
                      <span className="text-[var(--text-secondary)]">{spec.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {spec.width}×{spec.height}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{formatDatePtBr(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onLoadItem(item)}
                      className="flex-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Reutilizar</span>
                    </Button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tooltip content="Baixar PNG 2x">
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => onExportItem(item, 'png')}
                          aria-label="Baixar PNG 2x"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Excluir da galeria">
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => onDeleteItem(item.id)}
                          aria-label="Excluir da galeria"
                          className="hover:text-rose-400 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
