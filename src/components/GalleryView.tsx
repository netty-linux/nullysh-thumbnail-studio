import React from 'react';
import { Copy, Download, Trash2, Layers } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import type { SavedThumbnailItem } from '../types/thumbnail';

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
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-57px)] studio-grid-bg">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-xl bg-[#13151B] border border-white/10">
          <div className="w-11 h-11 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5 text-[#A78BFA]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-white">
              Nenhuma thumbnail salva ainda
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Suas últimas artes criadas ficam salvas localmente no navegador para duplicar e reutilizar configurações rapidamente.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToStudio}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer"
          >
            Criar primeira thumbnail
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-57px)] studio-grid-bg p-6 lg:p-10 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Últimas criadas
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Clique em reutilizar para carregar qualquer configuração no estúdio.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {items.length} {items.length === 1 ? 'arte salva' : 'artes salvas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const spec = ASPECT_RATIOS[item.config.aspectRatio];
            return (
              <article
                key={item.id}
                className="flex flex-col bg-[#13151B] border border-white/10 rounded-xl overflow-hidden"
              >
                <div className="aspect-video bg-[#090A0D] flex items-center justify-center overflow-hidden border-b border-white/8">
                  <img
                    src={item.previewDataUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono tabular-nums">
                      <span>{spec.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {spec.width}×{spec.height}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{formatDatePtBr(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/8">
                    <button
                      type="button"
                      onClick={() => onLoadItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Reutilizar</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onExportItem(item, 'png')}
                        className="p-2 text-slate-300 hover:text-white bg-[#1B1E28] hover:bg-[#232734] rounded-lg border border-white/8 transition-colors cursor-pointer"
                        title="Baixar PNG 2x"
                        aria-label="Baixar PNG 2x"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-[#1B1E28] hover:bg-rose-500/10 rounded-lg border border-white/8 transition-colors cursor-pointer"
                        title="Excluir da galeria"
                        aria-label="Excluir da galeria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
