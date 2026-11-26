import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { CanvasPreview } from './components/CanvasPreview';
import { EditorSidebar } from './components/EditorSidebar';
import { GalleryView } from './components/GalleryView';
import { McpConnectView } from './components/McpConnectView';
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

  useEffect(() => {
    setGalleryItems(loadGalleryItems());
    setCustomPresets(loadCustomPresets());
  }, []);

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
    },
    [config]
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
    },
    [activePresetId]
  );

  const handleReset = useCallback(() => {
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      aspectRatio: prev.aspectRatio,
    }));
    setActivePresetId('pack-ia');
  }, []);

  const handleAspectRatioChange = useCallback((aspectRatio: AspectRatioKey) => {
    setConfig((prev) => ({ ...prev, aspectRatio }));
  }, []);

  const handleExport = useCallback(
    async (format: 'png' | 'webp') => {
      if (isExporting) return;
      setIsExporting(format);
      try {
        await exportThumbnail2x(config, format);
      } finally {
        setIsExporting(null);
      }
    },
    [config, isExporting]
  );

  const handleSaveToGallery = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const previewDataUrl = await generatePreviewSnapshot(config);
      const cleanName =
        config.title
          .replace(/\n/g, ' ')
          .trim() || 'Thumbnail Nullysh';

      const newItem: SavedThumbnailItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        createdAt: Date.now(),
        previewDataUrl,
        config: { ...config, tags: [...config.tags] },
      };

      setGalleryItems((prev) => saveGalleryItems([newItem, ...prev]));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [config, isSaving]);

  const handleLoadFromGallery = useCallback((item: SavedThumbnailItem) => {
    setConfig({
      ...DEFAULT_CONFIG,
      ...item.config,
      tags: [...(item.config.tags || DEFAULT_CONFIG.tags)],
    });
    setActivePresetId(null);
    setActiveTab('editor');
  }, []);

  const handleLoadConfigFromMcp = useCallback((loadedConfig: ThumbnailConfig) => {
    setConfig({
      ...DEFAULT_CONFIG,
      ...loadedConfig,
      tags: [...(loadedConfig.tags || DEFAULT_CONFIG.tags)],
      y2kStickers: [...(loadedConfig.y2kStickers || [])],
    });
    setActivePresetId(null);
    setActiveTab('editor');
  }, []);

  const handleExportFromGallery = useCallback(
    async (item: SavedThumbnailItem, format: 'png' | 'webp') => {
      await exportThumbnail2x(item.config, format);
    },
    []
  );

  const handleDeleteFromGallery = useCallback((id: string) => {
    setGalleryItems((prev) => saveGalleryItems(prev.filter((i) => i.id !== id)));
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0E12] text-slate-100 flex flex-col">
      {/* Top Bar: 3-zone contract */}
      <header className="h-[57px] flex items-center justify-between gap-8 px-6 border-b border-white/10 bg-[#0D0E12] shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          Nullysh Thumbnail Studio
        </button>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'editor'
                ? 'text-white border-[#7C3AED]'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Estúdio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 tabular-nums ${
              activeTab === 'gallery'
                ? 'text-white border-[#7C3AED]'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Últimas Criadas ({galleryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mcp')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'mcp'
                ? 'text-white border-[#7C3AED]'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            MCP Server
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleExport('png')}
            disabled={isExporting !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting === 'png' ? 'Exportando...' : 'Exportar PNG 2x'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'editor' ? (
        <main className="flex-1 flex flex-col lg:flex-row min-h-0">
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
          />
          <CanvasPreview
            config={config}
            onSelectSticker={setSelectedStickerId}
            onChange={handlePatchConfig}
            onAspectRatioChange={handleAspectRatioChange}
            onExport={handleExport}
            onSaveToGallery={handleSaveToGallery}
            isExporting={isExporting}
            isSaving={isSaving}
            justSaved={justSaved}
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
    </div>
  );
}
