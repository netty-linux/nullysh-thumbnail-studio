import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  Download,
  FolderClock,
  LayoutGrid,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';
import { CanvasPreview } from './components/CanvasPreview';
import { EditorSidebar } from './components/EditorSidebar';
import { GalleryView } from './components/GalleryView';
import { McpConnectView } from './components/McpConnectView';
import {
  Button,
  SegmentedControl,
  ToastViewport,
  Tooltip,
  type ToastMessage,
} from './components/ui/StudioPrimitives';
import { DEFAULT_CONFIG } from './data/presets';
import type {
  AspectRatioKey,
  CategoryPreset,
  CustomPreset,
  SavedThumbnailItem,
  ThumbnailConfig,
} from './types/thumbnail';
import {
  exportThumbnail2x,
  generatePreviewSnapshot,
} from './utils/canvasRenderer';
import { loadGalleryItems, saveGalleryItems } from './utils/galleryStorage';
import { loadCustomPresets, saveCustomPresets } from './utils/presetStorage';

type StudioTab = 'editor' | 'gallery' | 'mcp';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('editor');
  const [config, setConfig] = useState<ThumbnailConfig>(DEFAULT_CONFIG);
  const [activePresetId, setActivePresetId] = useState<string | null>('pack-ia');
  const [galleryItems, setGalleryItems] = useState<SavedThumbnailItem[]>([]);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'png' | 'webp' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const pushToast = useCallback((message: string, tone: 'success' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    setGalleryItems(loadGalleryItems());
    setCustomPresets(loadCustomPresets());
  }, []);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handlePatchConfig = useCallback((patch: Partial<ThumbnailConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setActivePresetId(null);
  }, []);

  const handleApplyPreset = useCallback((preset: CategoryPreset) => {
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      aspectRatio: prev.aspectRatio,
      mockupDataUrl: prev.mockupDataUrl,
      mockupPosition: prev.mockupPosition,
      mockupScale: prev.mockupScale,
      mockupRotation: prev.mockupRotation,
      mockupOffsetY: prev.mockupOffsetY,
      mockupShadow: prev.mockupShadow,
      extraImageDataUrl: prev.extraImageDataUrl,
      extraImageX: prev.extraImageX,
      extraImageY: prev.extraImageY,
      extraImageScale: prev.extraImageScale,
      extraImageRotation: prev.extraImageRotation,
      extraImageOpacity: prev.extraImageOpacity,
      extraImageLayer: prev.extraImageLayer,
      extraImageShadow: prev.extraImageShadow,
      y2kStickers: prev.y2kStickers,
      ...preset.config,
    }));
    setActivePresetId(preset.id);
  }, []);

  const handleSaveCustomPreset = useCallback(
    (name: string) => {
      const { mockupDataUrl: _m, extraImageDataUrl: _e, ...restConfig } = config;
      const newPreset: CustomPreset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: name,
        createdAt: Date.now(),
        config: {
          ...restConfig,
          tags: [...restConfig.tags],
        },
      };

      setCustomPresets((prev) => saveCustomPresets([newPreset, ...prev]));
      setActivePresetId(newPreset.id);
      pushToast(`Preset "${name}" salvo`);
    },
    [config, pushToast]
  );

  const handleApplyCustomPreset = useCallback((preset: CustomPreset) => {
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      ...preset.config,
      tags: [...(preset.config.tags || DEFAULT_CONFIG.tags)],
      mockupDataUrl: prev.mockupDataUrl,
      extraImageDataUrl: prev.extraImageDataUrl,
    }));
    setActivePresetId(preset.id);
  }, []);

  const handleDeleteCustomPreset = useCallback(
    (id: string) => {
      setCustomPresets((prev) => saveCustomPresets(prev.filter((p) => p.id !== id)));
      if (activePresetId === id) {
        setActivePresetId(null);
      }
      pushToast('Preset removido', 'info');
    },
    [activePresetId, pushToast]
  );

  const handleReset = useCallback(() => {
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      aspectRatio: prev.aspectRatio,
    }));
    setActivePresetId('pack-ia');
    pushToast('Configuração restaurada', 'info');
  }, [pushToast]);

  const handleAspectRatioChange = useCallback((aspectRatio: AspectRatioKey) => {
    setConfig((prev) => ({ ...prev, aspectRatio }));
  }, []);

  const handleExport = useCallback(
    async (format: 'png' | 'webp') => {
      if (isExporting) return;
      setExportMenuOpen(false);
      setIsExporting(format);
      try {
        await exportThumbnail2x(config, format);
        pushToast(`${format.toUpperCase()} 2x exportado`);
      } finally {
        setIsExporting(null);
      }
    },
    [config, isExporting, pushToast]
  );

  const handleSaveToGallery = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const previewDataUrl = await generatePreviewSnapshot(config);
      const cleanName = config.title.replace(/\n/g, ' ').trim() || 'Thumbnail Nullysh';

      const newItem: SavedThumbnailItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        createdAt: Date.now(),
        previewDataUrl,
        config: { ...config, tags: [...config.tags] },
      };

      setGalleryItems((prev) => saveGalleryItems([newItem, ...prev]));
      setJustSaved(true);
      pushToast('Arte salva em Últimas Criadas');
      window.setTimeout(() => setJustSaved(false), 1800);
    } finally {
      setIsSaving(false);
    }
  }, [config, isSaving, pushToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
        setMobileSidebarOpen(false);
        setSelectedStickerId(null);
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (activeTab === 'editor') {
          void handleExport(e.shiftKey ? 'webp' : 'png');
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !isTyping) {
        e.preventDefault();
        if (activeTab === 'editor') {
          void handleSaveToGallery();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTab, handleExport, handleSaveToGallery]);

  const handleLoadFromGallery = useCallback(
    (item: SavedThumbnailItem) => {
      setConfig({
        ...DEFAULT_CONFIG,
        ...item.config,
        tags: [...(item.config.tags || DEFAULT_CONFIG.tags)],
      });
      setActivePresetId(null);
      setActiveTab('editor');
      pushToast('Configuração carregada no estúdio', 'info');
    },
    [pushToast]
  );

  const handleLoadConfigFromMcp = useCallback(
    (loadedConfig: ThumbnailConfig) => {
      setConfig({
        ...DEFAULT_CONFIG,
        ...loadedConfig,
        tags: [...(loadedConfig.tags || DEFAULT_CONFIG.tags)],
        y2kStickers: [...(loadedConfig.y2kStickers || [])],
      });
      setActivePresetId(null);
      setActiveTab('editor');
      pushToast('Thumbnail MCP aberta no estúdio', 'info');
    },
    [pushToast]
  );

  const handleExportFromGallery = useCallback(
    async (item: SavedThumbnailItem, format: 'png' | 'webp') => {
      await exportThumbnail2x(item.config, format);
      pushToast(`${format.toUpperCase()} 2x exportado`);
    },
    [pushToast]
  );

  const handleDeleteFromGallery = useCallback(
    (id: string) => {
      setGalleryItems((prev) => saveGalleryItems(prev.filter((i) => i.id !== id)));
      pushToast('Item removido da galeria', 'info');
    },
    [pushToast]
  );

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col">
      {/* Top Bar: 3 balanced zones */}
      <header className="h-12 flex items-center justify-between gap-3 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0 z-30">
        {/* Left: Mobile drawer trigger + Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          {activeTab === 'editor' && (
            <Button
              variant="icon"
              size="sm"
              className="xl:hidden"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              aria-label="Alternar painel de controles"
              aria-expanded={mobileSidebarOpen}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className="inline-flex items-center gap-2 text-left cursor-pointer group"
          >
            <span
              aria-hidden="true"
              className="w-6 h-6 rounded-[6px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-semibold text-[var(--accent-text)] tracking-tight"
            >
              N
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.015em] text-[var(--text-primary)] whitespace-nowrap">
              Nullysh Studio
            </span>
          </button>
        </div>

        {/* Center: Primary navigation */}
        <nav aria-label="Navegação principal" className="flex items-center">
          <SegmentedControl<StudioTab>
            ariaLabel="Seções do estúdio"
            value={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setMobileSidebarOpen(false);
            }}
            tone="surface"
            options={[
              {
                value: 'editor',
                label: 'Estúdio',
                icon: <LayoutGrid className="w-3.5 h-3.5" />,
              },
              {
                value: 'gallery',
                label: `Últimas Criadas (${galleryItems.length})`,
                icon: <FolderClock className="w-3.5 h-3.5" />,
              },
              {
                value: 'mcp',
                label: 'MCP Server',
                icon: <Terminal className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </nav>

        {/* Right: Single primary export split-button (Editor only) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'editor' ? (
            <>
              <Tooltip content="Salvar na galeria" shortcut="Ctrl+S">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => void handleSaveToGallery()}
                  disabled={isSaving}
                >
                  {justSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Salvo</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </span>
                    </>
                  )}
                </Button>
              </Tooltip>

              <div ref={exportMenuRef} className="relative inline-flex">
                <Tooltip content="Exportar em alta resolução" shortcut="Ctrl+E">
                  <button
                    type="button"
                    onClick={() => void handleExport('png')}
                    disabled={isExporting !== null}
                    className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 text-xs font-medium rounded-l-[var(--radius-md)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors duration-150 cursor-pointer whitespace-nowrap disabled:opacity-45"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isExporting === 'png'
                        ? 'Exportando...'
                        : isExporting === 'webp'
                        ? 'Gerando WebP...'
                        : 'Exportar PNG 2x'}
                    </span>
                  </button>
                </Tooltip>

                <button
                  type="button"
                  onClick={() => setExportMenuOpen((v) => !v)}
                  disabled={isExporting !== null}
                  aria-label="Mais formatos de exportação"
                  aria-expanded={exportMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center justify-center h-8 w-7 rounded-r-[var(--radius-md)] bg-[var(--accent)] text-white border-l border-white/20 hover:bg-[var(--accent-hover)] transition-colors duration-150 cursor-pointer disabled:opacity-45"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {exportMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-52 p-1 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-[var(--shadow-soft)] z-50"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleExport('png')}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      <span>Exportar PNG 2x</span>
                      <kbd className="font-mono text-[10px] text-[var(--text-muted)]">Ctrl+E</kbd>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleExport('webp')}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      <span>Exportar WebP 2x</span>
                      <kbd className="font-mono text-[10px] text-[var(--text-muted)]">
                        Ctrl+Shift+E
                      </kbd>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button variant="secondary" size="md" onClick={() => setActiveTab('editor')}>
              Voltar ao estúdio
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'editor' ? (
        <main className="relative flex-1 flex min-h-0 overflow-hidden">
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
              className="fixed inset-x-0 top-12 bottom-0 bg-black/60 backdrop-blur-[1px] z-30 xl:hidden"
            />
          )}

          <EditorSidebar
            config={config}
            activePresetId={activePresetId}
            customPresets={customPresets}
            selectedStickerId={selectedStickerId}
            onSelectSticker={setSelectedStickerId}
            onChange={handlePatchConfig}
            onApplyPreset={handleApplyPreset}
            onSaveCustomPreset={handleSaveCustomPreset}
            onApplyCustomPreset={handleApplyCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
            onReset={handleReset}
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          <CanvasPreview
            config={config}
            onSelectSticker={setSelectedStickerId}
            onChange={handlePatchConfig}
            onAspectRatioChange={handleAspectRatioChange}
          />
        </main>
      ) : activeTab === 'gallery' ? (
        <GalleryView
          items={galleryItems}
          onLoadItem={handleLoadFromGallery}
          onExportItem={handleExportFromGallery}
          onDeleteItem={handleDeleteFromGallery}
          onGoToStudio={() => setActiveTab('editor')}
        />
      ) : (
        <McpConnectView onLoadConfigToStudio={handleLoadConfigFromMcp} />
      )}

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
