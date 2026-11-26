import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  Plus,
  X,
  RotateCcw,
  Zap,
  Save,
  Check,
  Sparkles,
  Copy,
} from 'lucide-react';
import {
  BACKGROUND_PRESETS,
  BADGE_SUGGESTIONS,
  CATEGORY_PRESETS,
  CLICKBAIT_TURBO_PATCH,
  HOOK_SUGGESTIONS,
  STICKER_SUGGESTIONS,
  Y2K_STICKER_CATALOG,
} from '../data/presets';
import { Y2KStickerIcon } from './Y2KStickerIcon';
import type {
  ArrowColor,
  ArrowTarget,
  AuraColor,
  BackgroundPresetKey,
  CategoryPreset,
  ChromeFrameStyle,
  CustomPreset,
  ExtraImageLayer,
  FrameStyle,
  HookColor,
  MockupPosition,
  SpeedlinesStyle,
  StickerColor,
  StickerPosition,
  StickerShape,
  ThumbnailConfig,
  Y2KStickerItem,
  Y2KStickerType,
} from '../types/thumbnail';

interface EditorSidebarProps {
  config: ThumbnailConfig;
  activePresetId: string | null;
  customPresets: CustomPreset[];
  selectedStickerId: string | null;
  onSelectSticker: (id: string | null) => void;
  onChange: (patch: Partial<ThumbnailConfig>) => void;
  onApplyPreset: (preset: CategoryPreset) => void;
  onSaveCustomPreset: (name: string) => void;
  onApplyCustomPreset: (preset: CustomPreset) => void;
  onDeleteCustomPreset: (id: string) => void;
  onReset: () => void;
}

type SidebarTab = 'conteudo' | 'visual' | 'elementos' | 'clickbait';

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  config,
  activePresetId,
  customPresets,
  selectedStickerId,
  onSelectSticker,
  onChange,
  onApplyPreset,
  onSaveCustomPreset,
  onApplyCustomPreset,
  onDeleteCustomPreset,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const extraFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingExtraFile, setIsDraggingExtraFile] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('conteudo');
  const [presetName, setPresetName] = useState('');
  const [justSavedPreset, setJustSavedPreset] = useState(false);

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = presetName.trim();
    const fallbackName =
      config.title.replace(/\n/g, ' ').trim() || `Meu Preset ${customPresets.length + 1}`;
    onSaveCustomPreset(trimmed || fallbackName);
    setPresetName('');
    setJustSavedPreset(true);
    setTimeout(() => setJustSavedPreset(false), 1800);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ mockupDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtraFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ extraImageDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTagChange = (index: number, value: string) => {
    const next = [...config.tags];
    next[index] = value;
    onChange({ tags: next });
  };

  const handleRemoveTag = (index: number) => {
    const next = config.tags.filter((_, i) => i !== index);
    onChange({ tags: next });
  };

  const handleAddTag = () => {
    if (config.tags.length >= 4) return;
    onChange({ tags: [...config.tags, 'Novo item'] });
  };

  const clearClickbaitEffects = () => {
    onChange({
      showHook: false,
      speedlinesStyle: 'none',
      auraColor: 'none',
      sparklesCount: 0,
      stickerShow: false,
      arrowShow: false,
      frameStyle: 'none',
      vibranceBoost: 1,
    });
  };

  const y2kStickers = config.y2kStickers ?? [];
  const selectedSticker =
    y2kStickers.find((s) => s.id === selectedStickerId) ?? y2kStickers[0] ?? null;

  const handleAddY2KSticker = (type: Y2KStickerType) => {
    const count = y2kStickers.length;
    const defaultSpots = [
      { x: 18, y: 26, rot: -12 },
      { x: 82, y: 24, rot: 14 },
      { x: 16, y: 74, rot: 10 },
      { x: 84, y: 76, rot: -10 },
      { x: 50, y: 20, rot: 0 },
    ];
    const spot = defaultSpots[count % defaultSpots.length];
    const newItem: Y2KStickerItem = {
      id: `y2k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: spot.x,
      y: spot.y,
      scale: 1,
      rotation: spot.rot,
      layer: 'front',
    };
    onChange({ y2kStickers: [...y2kStickers, newItem] });
    onSelectSticker(newItem.id);
  };

  const handleUpdateSelectedSticker = (patch: Partial<Y2KStickerItem>) => {
    if (!selectedSticker) return;
    onChange({
      y2kStickers: y2kStickers.map((item) =>
        item.id === selectedSticker.id ? { ...item, ...patch } : item
      ),
    });
  };

  const handleDuplicateSticker = (item: Y2KStickerItem) => {
    const copy: Y2KStickerItem = {
      ...item,
      id: `y2k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(94, item.x + 6),
      y: Math.min(94, item.y + 6),
    };
    onChange({ y2kStickers: [...y2kStickers, copy] });
    onSelectSticker(copy.id);
  };

  const handleDeleteSticker = (id: string) => {
    const next = y2kStickers.filter((item) => item.id !== id);
    onChange({ y2kStickers: next });
    if (selectedStickerId === id) {
      onSelectSticker(next[0]?.id ?? null);
    }
  };

  return (
    <aside className="w-full lg:w-[388px] shrink-0 bg-[#0D0E12] border-b lg:border-b-0 lg:border-r border-white/10 lg:h-[calc(100vh-57px)] flex flex-col">
      {/* Sidebar Tabs (2x2 clean grid) */}
      <div className="px-4 pt-3 pb-3 border-b border-white/10 bg-[#0D0E12] shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#15171E] rounded-lg border border-white/8">
          <button
            type="button"
            onClick={() => setActiveTab('conteudo')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'conteudo'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Conteúdo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'visual'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fundo & Mockup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('elementos')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 ${
              activeTab === 'elementos'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Elementos Visuais</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clickbait')}
            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1 ${
              activeTab === 'clickbait'
                ? 'bg-[#7C3AED] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Clickbait</span>
          </button>
        </div>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto studio-scroll divide-y divide-white/8">
        {activeTab === 'conteudo' && (
          <>
            {/* 1. Presets de Layout (1 clique) */}
            <section className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Presets de Categoria Basefy
                </h2>
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyPreset(preset)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer truncate ${
                        isActive
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 1b. Meus Presets Salvos */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Meus Presets Salvos
                </h2>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {customPresets.length}
                </span>
              </div>

              <form onSubmit={handleSavePresetSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nome do preset..."
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {justSavedPreset ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvo</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </form>

              {customPresets.length === 0 ? (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Salve seu estilo atual (textos, cores, selos e clickbait) para reutilizar com 1 clique.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {customPresets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`flex items-center justify-between gap-1 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onApplyCustomPreset(preset)}
                          className="flex-1 min-w-0 px-2.5 py-2 text-xs font-medium text-left truncate cursor-pointer"
                          title={preset.label}
                        >
                          {preset.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomPreset(preset.id)}
                          className={`p-1.5 mr-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                            isActive
                              ? 'text-white/75 hover:text-white'
                              : 'text-slate-500 hover:text-rose-400'
                          }`}
                          aria-label={`Excluir preset ${preset.label}`}
                          title="Excluir preset"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. Título Principal (Liquid Chrome 3D) */}
            <section className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Título Bubble Chrome 3D
                </h2>
                <span className="text-[11px] text-slate-400">Até 2 linhas</span>
              </div>

              <textarea
                rows={2}
                value={config.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Ex: PACK IA PRO"
                className="w-full px-3 py-2 text-sm font-semibold bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED] resize-none"
              />

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="title-size" className="text-slate-400">
                      Tamanho
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {config.titleSize}px
                    </span>
                  </div>
                  <input
                    id="title-size"
                    type="range"
                    min={56}
                    max={144}
                    step={2}
                    value={config.titleSize}
                    onChange={(e) => onChange({ titleSize: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="title-curve" className="text-slate-400">
                      Curvatura leve
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {config.titleCurvature > 0 ? `+${config.titleCurvature}` : config.titleCurvature}
                    </span>
                  </div>
                  <input
                    id="title-curve"
                    type="range"
                    min={-18}
                    max={26}
                    step={1}
                    value={config.titleCurvature}
                    onChange={(e) => onChange({ titleCurvature: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="chrome-shine" className="text-slate-400">
                      Intensidade do brilho metálico
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(config.chromeIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    id="chrome-shine"
                    type="range"
                    min={0.35}
                    max={1.5}
                    step={0.05}
                    value={config.chromeIntensity}
                    onChange={(e) => onChange({ chromeIntensity: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>
              </div>
            </section>

            {/* 3. Subtítulo (Faixa de Papel Rasgado Creme) */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Faixa de Papel Rasgado
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.showSubtitle}
                  onClick={() => onChange({ showSubtitle: !config.showSubtitle })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.showSubtitle
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.showSubtitle ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.showSubtitle && (
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => onChange({ subtitle: e.target.value })}
                  placeholder="Subtítulo na faixa creme..."
                  className="w-full px-3 py-2 text-sm bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                />
              )}
            </section>

            {/* 4. Pílula de Tags / Benefícios */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Pílula de Tags (até 4)
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.showTags}
                  onClick={() => onChange({ showTags: !config.showTags })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.showTags
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.showTags ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.showTags && (
                <div className="space-y-2">
                  {config.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleTagChange(idx, e.target.value)}
                        placeholder={`Item ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                      />
                      {config.tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          aria-label={`Remover tag ${idx + 1}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {config.tags.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A78BFA] hover:text-white transition-colors cursor-pointer pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar item</span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* 5. Selo / Badge Superior */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Selo da Loja (Canto Superior)
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.showBadge}
                  onClick={() => onChange({ showBadge: !config.showBadge })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.showBadge
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.showBadge ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.showBadge && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={config.badgeText}
                    onChange={(e) => onChange({ badgeText: e.target.value })}
                    placeholder="Texto do selo..."
                    className="w-full px-3 py-2 text-xs bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {BADGE_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChange({ badgeText: s })}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          config.badgeText === s
                            ? 'bg-[#7C3AED]/25 border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ badgeStyle: 'basefy-dark' })}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        config.badgeStyle === 'basefy-dark'
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      Basefy Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ badgeStyle: 'frost-light' })}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        config.badgeStyle === 'frost-light'
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      Glass Claro
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'visual' && (
          <>
            {/* Fundo & Atmosfera */}
            <section className="p-5 space-y-4">
              <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                Fundo e Textura
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(BACKGROUND_PRESETS) as BackgroundPresetKey[]).map((key) => {
                  const bg = BACKGROUND_PRESETS[key];
                  const isSelected = config.background === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ background: key })}
                      className={`group flex flex-col items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#191B24] border-[#7C3AED]'
                          : 'bg-[#13151B] border-white/8 hover:border-white/20'
                      }`}
                    >
                      <span
                        className="w-full h-9 rounded-md border border-white/15 block"
                        style={{ background: bg.swatchGradient }}
                      />
                      <span className="text-[11px] font-medium text-slate-200 leading-tight line-clamp-2">
                        {bg.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="dither-slider" className="text-slate-400">
                    Dither pixelado superior
                  </label>
                  <span className="text-slate-200 font-mono tabular-nums">
                    {Math.round(config.ditherIntensity * 100)}%
                  </span>
                </div>
                <input
                  id="dither-slider"
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.05}
                  value={config.ditherIntensity}
                  onChange={(e) => onChange({ ditherIntensity: Number(e.target.value) })}
                  className="w-full studio-range"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="vibrance-slider" className="text-slate-400">
                    Contraste & Saturação (Punch)
                  </label>
                  <span className="text-slate-200 font-mono tabular-nums">
                    {Math.round(config.vibranceBoost * 100)}%
                  </span>
                </div>
                <input
                  id="vibrance-slider"
                  type="range"
                  min={0.9}
                  max={1.4}
                  step={0.02}
                  value={config.vibranceBoost}
                  onChange={(e) => onChange({ vibranceBoost: Number(e.target.value) })}
                  className="w-full studio-range"
                />
              </div>
            </section>

            {/* Molduras de Borda (Frames Cromados Metálicos) */}
            <section className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Molduras de Borda
                </h2>
                <span className="text-[11px] text-slate-400">Metal Cromado</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      key: 'none',
                      label: 'Sem Moldura',
                      previewStyle: 'border border-dashed border-white/25 bg-[#111319]',
                    },
                    {
                      key: 'chrome-solid',
                      label: 'Borda Sólida',
                      previewStyle:
                        'border-[3px] border-[#8CC5E8] bg-gradient-to-br from-white/15 via-[#8CC5E8]/10 to-transparent shadow-[inset_0_0_0_1px_#1F3A52]',
                    },
                    {
                      key: 'chrome-bevel',
                      label: 'Dupla Y2K Bevel',
                      previewStyle:
                        'border-2 border-white/80 bg-[#151822] shadow-[inset_0_0_0_3px_#1F3A52,inset_0_0_0_4px_#8CC5E8]',
                    },
                    {
                      key: 'chrome-dither',
                      label: 'Pontilhada Dither',
                      previewStyle:
                        'border-2 border-dotted border-[#8CC5E8] bg-gradient-to-br from-white/10 to-transparent',
                    },
                    {
                      key: 'chrome-chain',
                      label: 'Corrente 3D',
                      previewStyle:
                        'border-[3px] border-dashed border-slate-200 bg-gradient-to-br from-[#8CC5E8]/15 to-transparent',
                    },
                  ] as { key: ChromeFrameStyle; label: string; previewStyle: string }[]
                ).map((item) => {
                  const selected = (config.chromeFrame ?? 'none') === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onChange({ chromeFrame: item.key })}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#191B24] border-[#7C3AED] text-white'
                          : 'bg-[#13151B] border-white/8 text-slate-300 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-7 h-5 rounded-sm shrink-0 block ${item.previewStyle}`}
                      />
                      <span className="text-[11px] font-medium leading-tight truncate">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {config.chromeFrame && config.chromeFrame !== 'none' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="chrome-frame-scale" className="text-slate-400">
                      Espessura da moldura
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round((config.chromeFrameScale ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    id="chrome-frame-scale"
                    type="range"
                    min={0.6}
                    max={1.8}
                    step={0.05}
                    value={config.chromeFrameScale ?? 1}
                    onChange={(e) => onChange({ chromeFrameScale: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>
              )}
            </section>

            {/* Upload de Mockup / Produto */}
            <section className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Mockup / Imagem do Produto
                </h2>
                {config.mockupDataUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ mockupDataUrl: null })}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  isDraggingFile
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                    : 'border-white/15 bg-[#13151B] hover:border-white/30'
                }`}
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-200">
                    {config.mockupDataUrl ? 'Trocar imagem do produto' : 'Enviar PNG transparente ou foto'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Clique ou arraste o arquivo aqui
                  </p>
                </div>
              </div>

              {config.mockupDataUrl && (
                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Posição</span>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#15171E] rounded-lg border border-white/8">
                      {(
                        [
                          { key: 'left', label: 'Esquerda' },
                          { key: 'center', label: 'Centro' },
                          { key: 'right', label: 'Direita' },
                        ] as { key: MockupPosition; label: string }[]
                      ).map((pos) => (
                        <button
                          key={pos.key}
                          type="button"
                          onClick={() => onChange({ mockupPosition: pos.key })}
                          className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            config.mockupPosition === pos.key
                              ? 'bg-[#7C3AED] text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="mockup-scale" className="text-slate-400">
                        Escala
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {Math.round(config.mockupScale * 100)}%
                      </span>
                    </div>
                    <input
                      id="mockup-scale"
                      type="range"
                      min={0.35}
                      max={1.45}
                      step={0.05}
                      value={config.mockupScale}
                      onChange={(e) => onChange({ mockupScale: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="mockup-rotation" className="text-slate-400">
                        Rotação leve
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {config.mockupRotation}°
                      </span>
                    </div>
                    <input
                      id="mockup-rotation"
                      type="range"
                      min={-20}
                      max={20}
                      step={1}
                      value={config.mockupRotation}
                      onChange={(e) => onChange({ mockupRotation: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="mockup-offset-y" className="text-slate-400">
                        Ajuste vertical
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {config.mockupOffsetY}px
                      </span>
                    </div>
                    <input
                      id="mockup-offset-y"
                      type="range"
                      min={-120}
                      max={120}
                      step={4}
                      value={config.mockupOffsetY}
                      onChange={(e) => onChange({ mockupOffsetY: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">Sombra projetada automática</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.mockupShadow}
                      onClick={() => onChange({ mockupShadow: !config.mockupShadow })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                        config.mockupShadow
                          ? 'bg-[#7C3AED] border-[#7C3AED]'
                          : 'bg-[#1C1F2A] border-white/15'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                          config.mockupShadow ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Upload de 2ª Imagem Livre */}
            <section className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Imagem Livre (2ª Imagem)
                </h2>
                {config.extraImageDataUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ extraImageDataUrl: null })}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              <input
                ref={extraFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleExtraFile(e.target.files?.[0])}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingExtraFile(true);
                }}
                onDragLeave={() => setIsDraggingExtraFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExtraFile(false);
                  handleExtraFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => extraFileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  isDraggingExtraFile
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                    : 'border-white/15 bg-[#13151B] hover:border-white/30'
                }`}
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-200">
                    {config.extraImageDataUrl
                      ? 'Trocar 2ª imagem livre'
                      : 'Adicionar 2ª imagem (posicionamento livre)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ícone, reação, selo PNG ou print extra
                  </p>
                </div>
              </div>

              {config.extraImageDataUrl && (
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-[#A78BFA]">
                    Dica: clique e arraste diretamente sobre o preview para mover esta imagem.
                  </p>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Camada</span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#15171E] rounded-lg border border-white/8">
                      {(
                        [
                          { key: 'front', label: 'Na Frente' },
                          { key: 'behind-text', label: 'Atrás do Texto' },
                        ] as { key: ExtraImageLayer; label: string }[]
                      ).map((layer) => (
                        <button
                          key={layer.key}
                          type="button"
                          onClick={() => onChange({ extraImageLayer: layer.key })}
                          className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            config.extraImageLayer === layer.key
                              ? 'bg-[#7C3AED] text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {layer.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="extra-x" className="text-slate-400">
                        Posição Horizontal (X)
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {Math.round(config.extraImageX)}%
                      </span>
                    </div>
                    <input
                      id="extra-x"
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={config.extraImageX}
                      onChange={(e) => onChange({ extraImageX: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="extra-y" className="text-slate-400">
                        Posição Vertical (Y)
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {Math.round(config.extraImageY)}%
                      </span>
                    </div>
                    <input
                      id="extra-y"
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={config.extraImageY}
                      onChange={(e) => onChange({ extraImageY: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onChange({ extraImageX: 50, extraImageY: 50 })}
                    className="w-full py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-[#15171E] text-slate-300 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
                  >
                    Centralizar 2ª imagem
                  </button>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="extra-scale" className="text-slate-400">
                        Escala
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {Math.round(config.extraImageScale * 100)}%
                      </span>
                    </div>
                    <input
                      id="extra-scale"
                      type="range"
                      min={0.15}
                      max={2}
                      step={0.05}
                      value={config.extraImageScale}
                      onChange={(e) => onChange({ extraImageScale: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="extra-rotation" className="text-slate-400">
                        Rotação
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {config.extraImageRotation}°
                      </span>
                    </div>
                    <input
                      id="extra-rotation"
                      type="range"
                      min={-45}
                      max={45}
                      step={1}
                      value={config.extraImageRotation}
                      onChange={(e) => onChange({ extraImageRotation: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="extra-opacity" className="text-slate-400">
                        Opacidade
                      </label>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {Math.round(config.extraImageOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      id="extra-opacity"
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={config.extraImageOpacity}
                      onChange={(e) => onChange({ extraImageOpacity: Number(e.target.value) })}
                      className="w-full studio-range"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">Sombra projetada</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.extraImageShadow}
                      onClick={() => onChange({ extraImageShadow: !config.extraImageShadow })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                        config.extraImageShadow
                          ? 'bg-[#7C3AED] border-[#7C3AED]'
                          : 'bg-[#1C1F2A] border-white/15'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                          config.extraImageShadow ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'clickbait' && (
          <>
            {/* Atalho 1 Clique: Turbo Dopamina */}
            <section className="p-5 space-y-2.5">
              <button
                type="button"
                onClick={() => onChange(CLICKBAIT_TURBO_PATCH)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Aplicar Combo Clickbait (1 Clique)</span>
              </button>
              <button
                type="button"
                onClick={clearClickbaitEffects}
                className="w-full py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Limpar efeitos de clickbait
              </button>
            </section>

            {/* Gancho Superior (Fita de Impacto) */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Gancho de Impacto (Acima do Título)
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.showHook}
                  onClick={() => onChange({ showHook: !config.showHook })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.showHook
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.showHook ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.showHook && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={config.hookText}
                    onChange={(e) => onChange({ hookText: e.target.value })}
                    placeholder="Ex: ATUALIZADO 2026"
                    className="w-full px-3 py-2 text-xs font-bold bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {HOOK_SUGGESTIONS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => onChange({ hookText: h })}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          config.hookText === h
                            ? 'bg-[#7C3AED]/25 border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { key: 'yellow', label: 'Amarelo' },
                        { key: 'red', label: 'Vermelho' },
                        { key: 'purple', label: 'Roxo' },
                        { key: 'white', label: 'Branco' },
                      ] as { key: HookColor; label: string }[]
                    ).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => onChange({ hookColor: c.key })}
                        className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          config.hookColor === c.key
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Sticker / Selo Chamativo de Oferta */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Adesivo de Oferta / Urgência
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.stickerShow}
                  onClick={() => onChange({ stickerShow: !config.stickerShow })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.stickerShow
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.stickerShow ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.stickerShow && (
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    value={config.stickerText}
                    onChange={(e) => onChange({ stickerText: e.target.value })}
                    placeholder="Ex: -70%&#10;OFF"
                    className="w-full px-3 py-2 text-xs font-bold bg-[#15171E] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#7C3AED] resize-none"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {STICKER_SUGGESTIONS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onChange({ stickerText: st })}
                        className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          config.stickerText === st
                            ? 'bg-[#7C3AED]/25 border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st.replace('\n', ' ')}
                      </button>
                    ))}
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Formato</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'starburst', label: 'Estrela' },
                          { key: 'ribbon', label: 'Etiqueta' },
                          { key: 'pill-neon', label: 'Pílula Glow' },
                        ] as { key: StickerShape; label: string }[]
                      ).map((sh) => (
                        <button
                          key={sh.key}
                          type="button"
                          onClick={() => onChange({ stickerShape: sh.key })}
                          className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            config.stickerShape === sh.key
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Cor do Adesivo</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { key: 'yellow', label: 'Amarelo' },
                          { key: 'red', label: 'Vermelho' },
                          { key: 'purple', label: 'Roxo' },
                          { key: 'lime', label: 'Lima' },
                        ] as { key: StickerColor; label: string }[]
                      ).map((cl) => (
                        <button
                          key={cl.key}
                          type="button"
                          onClick={() => onChange({ stickerColor: cl.key })}
                          className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            config.stickerColor === cl.key
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {cl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Posição</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'top-right', label: 'Topo Dir.' },
                          { key: 'bottom-right', label: 'Base Dir.' },
                          { key: 'bottom-left', label: 'Base Esq.' },
                        ] as { key: StickerPosition; label: string }[]
                      ).map((pos) => (
                        <button
                          key={pos.key}
                          type="button"
                          onClick={() => onChange({ stickerPosition: pos.key })}
                          className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            config.stickerPosition === pos.key
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Seta Clickbait & Círculo de Foco */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Seta Apontadora & Círculo Alvo
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.arrowShow}
                  onClick={() => onChange({ arrowShow: !config.arrowShow })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    config.arrowShow
                      ? 'bg-[#7C3AED] border-[#7C3AED]'
                      : 'bg-[#1C1F2A] border-white/15'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                      config.arrowShow ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {config.arrowShow && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { key: 'red', label: 'Vermelha' },
                        { key: 'yellow', label: 'Amarela' },
                        { key: 'purple', label: 'Roxa' },
                        { key: 'chrome', label: 'Chrome' },
                      ] as { key: ArrowColor; label: string }[]
                    ).map((ac) => (
                      <button
                        key={ac.key}
                        type="button"
                        onClick={() => onChange({ arrowColor: ac.key })}
                        className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                          config.arrowColor === ac.key
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        {ac.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1.5">Alvo da Seta</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { key: 'mockup', label: 'Mockup' },
                          { key: 'title', label: 'Título' },
                          { key: 'center', label: 'Centro' },
                        ] as { key: ArrowTarget; label: string }[]
                      ).map((at) => (
                        <button
                          key={at.key}
                          type="button"
                          onClick={() => onChange({ arrowTarget: at.key })}
                          className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            config.arrowTarget === at.key
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                              : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {at.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">Círculo de foco no alvo</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.arrowPulseRing}
                      onClick={() => onChange({ arrowPulseRing: !config.arrowPulseRing })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                        config.arrowPulseRing
                          ? 'bg-[#7C3AED] border-[#7C3AED]'
                          : 'bg-[#1C1F2A] border-white/15'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-[1px] ${
                          config.arrowPulseRing ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Raios de Impacto / Speedlines */}
            <section className="p-5 space-y-3">
              <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                Raios de Impacto (Speedlines)
              </h2>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { key: 'none', label: 'Off' },
                    { key: 'subtle', label: 'Sutil' },
                    { key: 'burst', label: 'Explosão' },
                    { key: 'vortex', label: 'Vórtice' },
                  ] as { key: SpeedlinesStyle; label: string }[]
                ).map((sp) => (
                  <button
                    key={sp.key}
                    type="button"
                    onClick={() => onChange({ speedlinesStyle: sp.key })}
                    className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                      config.speedlinesStyle === sp.key
                        ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                        : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>

              {config.speedlinesStyle !== 'none' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="speedlines-op" className="text-slate-400">
                      Força dos raios
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(config.speedlinesOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    id="speedlines-op"
                    type="range"
                    min={0.1}
                    max={0.85}
                    step={0.05}
                    value={config.speedlinesOpacity}
                    onChange={(e) => onChange({ speedlinesOpacity: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>
              )}
            </section>

            {/* Aura Luminosa & Estrelas Y2K & Moldura */}
            <section className="p-5 space-y-4">
              <div>
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight mb-2.5">
                  Aura Luminosa & Brilhos Y2K
                </h2>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { key: 'none', label: 'Off' },
                      { key: 'white', label: 'Branca' },
                      { key: 'blue', label: 'Azul' },
                      { key: 'purple', label: 'Roxa' },
                      { key: 'gold', label: 'Ouro' },
                    ] as { key: AuraColor; label: string }[]
                  ).map((au) => (
                    <button
                      key={au.key}
                      type="button"
                      onClick={() => onChange({ auraColor: au.key })}
                      className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                        config.auraColor === au.key
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {au.label}
                    </button>
                  ))}
                </div>
              </div>

              {config.auraColor !== 'none' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="aura-intensity" className="text-slate-400">
                      Intensidade da aura
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(config.auraIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    id="aura-intensity"
                    type="range"
                    min={0.2}
                    max={1.2}
                    step={0.05}
                    value={config.auraIntensity}
                    onChange={(e) => onChange({ auraIntensity: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="sparkles-count" className="text-slate-400">
                    Estrelas & Flashes Y2K
                  </label>
                  <span className="text-slate-200 font-mono tabular-nums">
                    {config.sparklesCount}
                  </span>
                </div>
                <input
                  id="sparkles-count"
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={config.sparklesCount}
                  onChange={(e) => onChange({ sparklesCount: Number(e.target.value) })}
                  className="w-full studio-range"
                />
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1.5">
                  Moldura de Destaque (Feed CTR)
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { key: 'none', label: 'Sem' },
                      { key: 'purple', label: 'Roxo' },
                      { key: 'yellow', label: 'Amarelo' },
                      { key: 'red', label: 'Verm.' },
                      { key: 'chrome', label: 'Chrome' },
                    ] as { key: FrameStyle; label: string }[]
                  ).map((fr) => (
                    <button
                      key={fr.key}
                      type="button"
                      onClick={() => onChange({ frameStyle: fr.key })}
                      className={`py-1.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                        config.frameStyle === fr.key
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      {fr.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'elementos' && (
          <>
            {/* Bloom / Glow Líquido nas Bordas */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Bloom / Glow Líquido (Bordas)
                </h2>
                <span className="text-xs text-slate-200 font-mono tabular-nums">
                  {Math.round((config.edgeBloom ?? 0) * 100)}%
                </span>
              </div>

              <input
                id="edge-bloom-slider"
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={config.edgeBloom ?? 0.35}
                onChange={(e) => onChange({ edgeBloom: Number(e.target.value) })}
                aria-label="Intensidade do Bloom e Glow nas bordas"
                className="w-full studio-range"
              />

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Aplica halo luminoso e brilho líquido intenso nas bordas do título cromado, stickers Y2K, imagens e molduras.
              </p>
            </section>

            {/* Catálogo de Stickers Y2K */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Stickers Y2K Cromados
                </h2>
                <span className="text-[11px] text-slate-400">Clique para adicionar</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Y2K_STICKER_CATALOG.map((entry) => (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => handleAddY2KSticker(entry.type)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-white/8 bg-[#13151B] hover:border-[#7C3AED] hover:bg-[#191B24] text-left transition-all cursor-pointer group"
                  >
                    <Y2KStickerIcon
                      type={entry.type}
                      className="w-7 h-7 shrink-0 transition-transform group-hover:scale-110"
                    />
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {entry.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Lista de Stickers Ativos */}
            <section className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                  Elementos na Thumbnail ({y2kStickers.length})
                </h2>
                {y2kStickers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ y2kStickers: [] });
                      onSelectSticker(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Limpar todos
                  </button>
                )}
              </div>

              {y2kStickers.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nenhum sticker adicionado. Escolha um elemento Y2K acima para posicionar livremente na thumbnail.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {y2kStickers.map((item, idx) => {
                    const meta = Y2K_STICKER_CATALOG.find((c) => c.type === item.type);
                    const isSelected = selectedSticker?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                            : 'bg-[#15171E] border-white/8 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectSticker(item.id)}
                          className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
                        >
                          <Y2KStickerIcon type={item.type} className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {meta?.label ?? item.type} #{idx + 1}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateSticker(item)}
                            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Duplicar sticker"
                            aria-label="Duplicar sticker"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSticker(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remover sticker"
                            aria-label="Remover sticker"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Controles de Posição, Escala e Rotação do Sticker Selecionado */}
            {selectedSticker && (
              <section className="p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-slate-200 tracking-tight">
                    Ajustar Sticker Selecionado
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleUpdateSelectedSticker({ x: 50, y: 50, rotation: 0, scale: 1 })}
                    className="text-[11px] text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
                  >
                    Centralizar
                  </button>
                </div>

                <p className="text-[11px] text-[#A78BFA]">
                  Dica: clique e arraste o sticker diretamente sobre o preview.
                </p>

                <div>
                  <span className="text-xs text-slate-400 block mb-1.5">Camada</span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#15171E] rounded-lg border border-white/8">
                    {(
                      [
                        { key: 'front', label: 'Na Frente' },
                        { key: 'behind-text', label: 'Atrás do Texto' },
                      ] as { key: ExtraImageLayer; label: string }[]
                    ).map((layer) => (
                      <button
                        key={layer.key}
                        type="button"
                        onClick={() => handleUpdateSelectedSticker({ layer: layer.key })}
                        className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                          selectedSticker.layer === layer.key
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="y2k-x" className="text-slate-400">
                      Posição Horizontal (X)
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(selectedSticker.x)}%
                    </span>
                  </div>
                  <input
                    id="y2k-x"
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={selectedSticker.x}
                    onChange={(e) => handleUpdateSelectedSticker({ x: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="y2k-y" className="text-slate-400">
                      Posição Vertical (Y)
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(selectedSticker.y)}%
                    </span>
                  </div>
                  <input
                    id="y2k-y"
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={selectedSticker.y}
                    onChange={(e) => handleUpdateSelectedSticker({ y: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="y2k-scale" className="text-slate-400">
                      Escala
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {Math.round(selectedSticker.scale * 100)}%
                    </span>
                  </div>
                  <input
                    id="y2k-scale"
                    type="range"
                    min={0.3}
                    max={2.2}
                    step={0.05}
                    value={selectedSticker.scale}
                    onChange={(e) => handleUpdateSelectedSticker({ scale: Number(e.target.value) })}
                    className="w-full studio-range"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="y2k-rotation" className="text-slate-400">
                      Rotação
                    </label>
                    <span className="text-slate-200 font-mono tabular-nums">
                      {selectedSticker.rotation}°
                    </span>
                  </div>
                  <input
                    id="y2k-rotation"
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={selectedSticker.rotation}
                    onChange={(e) =>
                      handleUpdateSelectedSticker({ rotation: Number(e.target.value) })
                    }
                    className="w-full studio-range"
                  />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
