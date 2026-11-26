import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
  Zap,
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
import { Y2KStickerIcon } from './Y2KStickerIcon';
import {
  Button,
  CollapsibleSection,
  PresetChip,
  SegmentedControl,
  SliderField,
  Switch,
  TextAreaField,
  TextInput,
  Tooltip,
} from './ui/StudioPrimitives';

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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
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
  isOpenMobile = false,
  onCloseMobile,
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
    window.setTimeout(() => setJustSavedPreset(false), 1600);
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ mockupDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtraFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
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
    onChange({ tags: config.tags.filter((_, i) => i !== index) });
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
    <aside
      aria-label="Painel de edição"
      className={`fixed xl:static inset-y-12 left-0 z-40 w-[348px] sm:w-[356px] shrink-0 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] h-[calc(100vh-48px)] flex flex-col transition-transform duration-200 xl:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-[var(--shadow-soft)]' : '-translate-x-full'
      }`}
    >
      {/* Sticky Single-Row Tab Bar */}
      <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] shrink-0 flex items-center gap-2">
        <SegmentedControl<SidebarTab>
          ariaLabel="Categorias do editor"
          value={activeTab}
          onChange={setActiveTab}
          fullWidth
          size="sm"
          tone="surface"
          options={[
            {
              value: 'conteudo',
              label: 'Texto',
              icon: <Type className="w-3 h-3 shrink-0" />,
              title: 'Conteúdo, presets e textos',
            },
            {
              value: 'visual',
              label: 'Fundo',
              icon: <ImageIcon className="w-3 h-3 shrink-0" />,
              title: 'Fundo, moldura e mockups',
            },
            {
              value: 'elementos',
              label: 'Efeitos',
              icon: <Sparkles className="w-3 h-3 shrink-0" />,
              title: 'Bloom e stickers Y2K',
            },
            {
              value: 'clickbait',
              label: 'Clickbait',
              icon: <Zap className="w-3 h-3 shrink-0" />,
              title: 'Ganchos, setas e selos de urgência',
            },
          ]}
        />

        {onCloseMobile && (
          <Button
            variant="icon"
            size="sm"
            className="xl:hidden"
            onClick={onCloseMobile}
            aria-label="Fechar painel"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Scrollable Collapsible Sections */}
      <div className="flex-1 overflow-y-auto studio-scroll">
        {activeTab === 'conteudo' && (
          <>
            <CollapsibleSection
              title="Presets de categoria"
              defaultOpen
              headerRight={
                <Tooltip content="Restaurar padrão">
                  <Button variant="ghost" size="sm" onClick={onReset} aria-label="Restaurar padrão">
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </Button>
                </Tooltip>
              }
            >
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORY_PRESETS.map((preset) => (
                  <PresetChip
                    key={preset.id}
                    label={preset.label}
                    active={activePresetId === preset.id}
                    onClick={() => onApplyPreset(preset)}
                  />
                ))}
              </div>

              {/* Saved Custom Presets */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Meus presets salvos
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                    {customPresets.length}
                  </span>
                </div>

                <form onSubmit={handleSavePresetSubmit} className="flex items-center gap-1.5">
                  <TextInput
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Nome do preset..."
                  />
                  <Button type="submit" variant="secondary" size="md">
                    {justSavedPreset ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{justSavedPreset ? 'Salvo' : 'Salvar'}</span>
                  </Button>
                </form>

                {customPresets.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {customPresets.map((preset) => (
                      <PresetChip
                        key={preset.id}
                        label={preset.label}
                        active={activePresetId === preset.id}
                        onClick={() => onApplyCustomPreset(preset)}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => onDeleteCustomPreset(preset.id)}
                            aria-label={`Excluir preset ${preset.label}`}
                            title="Excluir preset"
                            className="p-1.5 mr-0.5 rounded text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Título Liquid Chrome"
              defaultOpen
              badge={
                <span className="text-[11px] text-[var(--text-muted)] font-normal">
                  Até 2 linhas
                </span>
              }
            >
              <TextAreaField
                rows={2}
                value={config.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Ex: PACK IA PRO"
                className="font-semibold"
              />

              <div className="space-y-3">
                <SliderField
                  id="title-size"
                  label="Tamanho"
                  min={56}
                  max={144}
                  step={2}
                  value={config.titleSize}
                  displayValue={`${config.titleSize}px`}
                  onChange={(titleSize) => onChange({ titleSize })}
                />
                <SliderField
                  id="title-curve"
                  label="Curvatura leve"
                  min={-18}
                  max={26}
                  step={1}
                  value={config.titleCurvature}
                  displayValue={
                    config.titleCurvature > 0
                      ? `+${config.titleCurvature}`
                      : `${config.titleCurvature}`
                  }
                  onChange={(titleCurvature) => onChange({ titleCurvature })}
                />
                <SliderField
                  id="chrome-shine"
                  label="Brilho metálico"
                  min={0.35}
                  max={1.5}
                  step={0.05}
                  value={config.chromeIntensity}
                  displayValue={`${Math.round(config.chromeIntensity * 100)}%`}
                  onChange={(chromeIntensity) => onChange({ chromeIntensity })}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Faixa de papel rasgado"
              open={config.showSubtitle}
              onOpenChange={(open) => onChange({ showSubtitle: open })}
              headerRight={
                <Switch
                  checked={config.showSubtitle}
                  onChange={(showSubtitle) => onChange({ showSubtitle })}
                  ariaLabel="Exibir faixa de papel rasgado"
                />
              }
            >
              <TextInput
                type="text"
                value={config.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                placeholder="Subtítulo na faixa creme..."
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Pílula de tags"
              open={config.showTags}
              onOpenChange={(open) => onChange({ showTags: open })}
              badge={
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                  {config.tags.length}/4
                </span>
              }
              headerRight={
                <Switch
                  checked={config.showTags}
                  onChange={(showTags) => onChange({ showTags })}
                  ariaLabel="Exibir pílula de tags"
                />
              }
            >
              <div className="space-y-1.5">
                {config.tags.map((tag, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <TextInput
                      type="text"
                      value={tag}
                      onChange={(e) => handleTagChange(idx, e.target.value)}
                      placeholder={`Item ${idx + 1}`}
                    />
                    {config.tags.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(idx)}
                        aria-label={`Remover tag ${idx + 1}`}
                        className="px-1.5 text-[var(--text-muted)] hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {config.tags.length < 4 && (
                  <Button variant="ghost" size="sm" onClick={handleAddTag} className="w-full">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar tag</span>
                  </Button>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Selo da loja"
              open={config.showBadge}
              onOpenChange={(open) => onChange({ showBadge: open })}
              headerRight={
                <Switch
                  checked={config.showBadge}
                  onChange={(showBadge) => onChange({ showBadge })}
                  ariaLabel="Exibir selo da loja"
                />
              }
            >
              <TextInput
                type="text"
                value={config.badgeText}
                onChange={(e) => onChange({ badgeText: e.target.value })}
                placeholder="Texto do selo..."
              />

              <div className="flex flex-wrap gap-1.5">
                {BADGE_SUGGESTIONS.map((s) => {
                  const active = config.badgeText === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange({ badgeText: s })}
                      className={`h-6 px-2 text-[11px] font-medium rounded-[var(--radius-sm)] border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              <SegmentedControl<'basefy-dark' | 'frost-light'>
                ariaLabel="Estilo do selo"
                value={config.badgeStyle}
                onChange={(badgeStyle) => onChange({ badgeStyle })}
                fullWidth
                size="sm"
                options={[
                  { value: 'basefy-dark', label: 'Basefy Dark' },
                  { value: 'frost-light', label: 'Glass Claro' },
                ]}
              />
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'visual' && (
          <>
            <CollapsibleSection title="Fundo e textura" defaultOpen>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(BACKGROUND_PRESETS) as BackgroundPresetKey[]).map((key) => {
                  const bg = BACKGROUND_PRESETS[key];
                  const isSelected = config.background === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange({ background: key })}
                      className={`flex flex-col items-start gap-1.5 p-1.5 rounded-[var(--radius-md)] border text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span
                        className="w-full h-8 rounded-[5px] border border-white/15 block"
                        style={{ background: bg.swatchGradient }}
                      />
                      <span className="text-[11px] font-medium text-[var(--text-primary)] leading-tight line-clamp-2">
                        {bg.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <SliderField
                id="dither-slider"
                label="Dither pixelado superior"
                min={0}
                max={0.9}
                step={0.05}
                value={config.ditherIntensity}
                displayValue={`${Math.round(config.ditherIntensity * 100)}%`}
                onChange={(ditherIntensity) => onChange({ ditherIntensity })}
              />

              <SliderField
                id="vibrance-slider"
                label="Contraste e saturação"
                min={0.9}
                max={1.4}
                step={0.02}
                value={config.vibranceBoost}
                displayValue={`${Math.round(config.vibranceBoost * 100)}%`}
                onChange={(vibranceBoost) => onChange({ vibranceBoost })}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Molduras cromadas" defaultOpen>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    {
                      key: 'none',
                      label: 'Sem moldura',
                      previewStyle: 'border border-dashed border-white/25 bg-[var(--bg-app)]',
                    },
                    {
                      key: 'chrome-solid',
                      label: 'Borda sólida',
                      previewStyle:
                        'border-[3px] border-[#8CC5E8] bg-gradient-to-br from-white/15 via-[#8CC5E8]/10 to-transparent shadow-[inset_0_0_0_1px_#1F3A52]',
                    },
                    {
                      key: 'chrome-bevel',
                      label: 'Dupla Bevel',
                      previewStyle:
                        'border-2 border-white/80 bg-[var(--bg-elevated)] shadow-[inset_0_0_0_3px_#1F3A52,inset_0_0_0_4px_#8CC5E8]',
                    },
                    {
                      key: 'chrome-dither',
                      label: 'Dither Y2K',
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
                      className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] border text-left cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className={`w-6 h-4 rounded-[3px] shrink-0 block ${item.previewStyle}`} />
                      <span className="text-[11px] font-medium truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {config.chromeFrame && config.chromeFrame !== 'none' && (
                <SliderField
                  id="chrome-frame-scale"
                  label="Espessura da moldura"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={config.chromeFrameScale ?? 1}
                  displayValue={`${Math.round((config.chromeFrameScale ?? 1) * 100)}%`}
                  onChange={(chromeFrameScale) => onChange({ chromeFrameScale })}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Mockup do produto"
              defaultOpen={Boolean(config.mockupDataUrl)}
              headerRight={
                config.mockupDataUrl ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onChange({ mockupDataUrl: null })}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover</span>
                  </Button>
                ) : undefined
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />

              <button
                type="button"
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
                className={`w-full flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-[var(--radius-md)] border border-dashed cursor-pointer transition-colors ${
                  isDraggingFile
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Upload className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {config.mockupDataUrl ? 'Trocar imagem do produto' : 'Enviar PNG ou foto'}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Clique ou arraste o arquivo aqui
                </span>
              </button>

              {config.mockupDataUrl && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-xs text-[var(--text-secondary)] block">Posição</span>
                    <SegmentedControl<MockupPosition>
                      ariaLabel="Posição do mockup"
                      value={config.mockupPosition}
                      onChange={(mockupPosition) => onChange({ mockupPosition })}
                      fullWidth
                      size="sm"
                      options={[
                        { value: 'left', label: 'Esquerda' },
                        { value: 'center', label: 'Centro' },
                        { value: 'right', label: 'Direita' },
                      ]}
                    />
                  </div>

                  <SliderField
                    id="mockup-scale"
                    label="Escala"
                    min={0.35}
                    max={1.45}
                    step={0.05}
                    value={config.mockupScale}
                    displayValue={`${Math.round(config.mockupScale * 100)}%`}
                    onChange={(mockupScale) => onChange({ mockupScale })}
                  />
                  <SliderField
                    id="mockup-rotation"
                    label="Rotação"
                    min={-20}
                    max={20}
                    step={1}
                    value={config.mockupRotation}
                    displayValue={`${config.mockupRotation}°`}
                    onChange={(mockupRotation) => onChange({ mockupRotation })}
                  />
                  <SliderField
                    id="mockup-offset-y"
                    label="Ajuste vertical"
                    min={-120}
                    max={120}
                    step={4}
                    value={config.mockupOffsetY}
                    displayValue={`${config.mockupOffsetY}px`}
                    onChange={(mockupOffsetY) => onChange({ mockupOffsetY })}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--text-secondary)]">Sombra projetada</span>
                    <Switch
                      checked={config.mockupShadow}
                      onChange={(mockupShadow) => onChange({ mockupShadow })}
                      ariaLabel="Ativar sombra projetada no mockup"
                    />
                  </div>
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Segunda imagem livre"
              defaultOpen={Boolean(config.extraImageDataUrl)}
              headerRight={
                config.extraImageDataUrl ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onChange({ extraImageDataUrl: null })}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover</span>
                  </Button>
                ) : undefined
              }
            >
              <input
                ref={extraFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleExtraFile(e.target.files?.[0])}
                className="hidden"
              />

              <button
                type="button"
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
                className={`w-full flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-[var(--radius-md)] border border-dashed cursor-pointer transition-colors ${
                  isDraggingExtraFile
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Upload className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {config.extraImageDataUrl ? 'Trocar 2ª imagem' : 'Adicionar 2ª imagem'}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Ícone, selo PNG ou recorte livre
                </span>
              </button>

              {config.extraImageDataUrl && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <span className="text-xs text-[var(--text-secondary)] block">Camada</span>
                    <SegmentedControl<ExtraImageLayer>
                      ariaLabel="Camada da segunda imagem"
                      value={config.extraImageLayer}
                      onChange={(extraImageLayer) => onChange({ extraImageLayer })}
                      fullWidth
                      size="sm"
                      options={[
                        { value: 'front', label: 'Na frente' },
                        { value: 'behind-text', label: 'Atrás do texto' },
                      ]}
                    />
                  </div>

                  <SliderField
                    id="extra-x"
                    label="Posição X"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config.extraImageX}
                    displayValue={`${Math.round(config.extraImageX)}%`}
                    onChange={(extraImageX) => onChange({ extraImageX })}
                  />
                  <SliderField
                    id="extra-y"
                    label="Posição Y"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config.extraImageY}
                    displayValue={`${Math.round(config.extraImageY)}%`}
                    onChange={(extraImageY) => onChange({ extraImageY })}
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => onChange({ extraImageX: 50, extraImageY: 50 })}
                  >
                    Centralizar 2ª imagem
                  </Button>

                  <SliderField
                    id="extra-scale"
                    label="Escala"
                    min={0.15}
                    max={2}
                    step={0.05}
                    value={config.extraImageScale}
                    displayValue={`${Math.round(config.extraImageScale * 100)}%`}
                    onChange={(extraImageScale) => onChange({ extraImageScale })}
                  />
                  <SliderField
                    id="extra-rotation"
                    label="Rotação"
                    min={-45}
                    max={45}
                    step={1}
                    value={config.extraImageRotation}
                    displayValue={`${config.extraImageRotation}°`}
                    onChange={(extraImageRotation) => onChange({ extraImageRotation })}
                  />
                  <SliderField
                    id="extra-opacity"
                    label="Opacidade"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={config.extraImageOpacity}
                    displayValue={`${Math.round(config.extraImageOpacity * 100)}%`}
                    onChange={(extraImageOpacity) => onChange({ extraImageOpacity })}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--text-secondary)]">Sombra projetada</span>
                    <Switch
                      checked={config.extraImageShadow}
                      onChange={(extraImageShadow) => onChange({ extraImageShadow })}
                      ariaLabel="Ativar sombra na segunda imagem"
                    />
                  </div>
                </div>
              )}
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'elementos' && (
          <>
            <CollapsibleSection
              title="Bloom líquido nas bordas"
              description="Aplica halo luminoso nas bordas do título cromado, stickers Y2K, imagens e molduras."
              defaultOpen
            >
              <SliderField
                id="edge-bloom-slider"
                label="Intensidade"
                min={0}
                max={1.5}
                step={0.05}
                value={config.edgeBloom ?? 0.35}
                displayValue={`${Math.round((config.edgeBloom ?? 0) * 100)}%`}
                onChange={(edgeBloom) => onChange({ edgeBloom })}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Stickers Y2K cromados"
              defaultOpen
              badge={
                <span className="text-[11px] text-[var(--text-muted)]">Clique para adicionar</span>
              }
            >
              <div className="grid grid-cols-2 gap-1.5">
                {Y2K_STICKER_CATALOG.map((entry) => (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => handleAddY2KSticker(entry.type)}
                    className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-hover)] text-left transition-colors cursor-pointer group"
                  >
                    <Y2KStickerIcon
                      type={entry.type}
                      className="w-6 h-6 shrink-0 transition-transform duration-150 group-hover:scale-110"
                    />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {entry.label}
                    </span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Elementos na thumbnail"
              defaultOpen
              badge={
                <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                  {y2kStickers.length}
                </span>
              }
              headerRight={
                y2kStickers.length > 0 ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      onChange({ y2kStickers: [] });
                      onSelectSticker(null);
                    }}
                  >
                    Limpar
                  </Button>
                ) : undefined
              }
            >
              {y2kStickers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Nenhum sticker adicionado. Escolha um item acima para posicionar na arte.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {y2kStickers.map((item, idx) => {
                    const meta = Y2K_STICKER_CATALOG.find((c) => c.type === item.type);
                    const isSelected = selectedSticker?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-[var(--radius-md)] border transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
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

                        <div className="flex items-center gap-0.5 shrink-0">
                          <Tooltip content="Duplicar sticker">
                            <button
                              type="button"
                              onClick={() => handleDuplicateSticker(item)}
                              aria-label="Duplicar sticker"
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Remover sticker">
                            <button
                              type="button"
                              onClick={() => handleDeleteSticker(item.id)}
                              aria-label="Remover sticker"
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {selectedSticker && (
              <CollapsibleSection
                title="Ajustar sticker selecionado"
                defaultOpen
                headerRight={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleUpdateSelectedSticker({ x: 50, y: 50, rotation: 0, scale: 1 })
                    }
                  >
                    Centralizar
                  </Button>
                }
              >
                <div className="space-y-1.5">
                  <span className="text-xs text-[var(--text-secondary)] block">Camada</span>
                  <SegmentedControl<ExtraImageLayer>
                    ariaLabel="Camada do sticker"
                    value={selectedSticker.layer}
                    onChange={(layer) => handleUpdateSelectedSticker({ layer })}
                    fullWidth
                    size="sm"
                    options={[
                      { value: 'front', label: 'Na frente' },
                      { value: 'behind-text', label: 'Atrás do texto' },
                    ]}
                  />
                </div>

                <SliderField
                  id="y2k-x"
                  label="Posição X"
                  min={0}
                  max={100}
                  step={0.5}
                  value={selectedSticker.x}
                  displayValue={`${Math.round(selectedSticker.x)}%`}
                  onChange={(x) => handleUpdateSelectedSticker({ x })}
                />
                <SliderField
                  id="y2k-y"
                  label="Posição Y"
                  min={0}
                  max={100}
                  step={0.5}
                  value={selectedSticker.y}
                  displayValue={`${Math.round(selectedSticker.y)}%`}
                  onChange={(y) => handleUpdateSelectedSticker({ y })}
                />
                <SliderField
                  id="y2k-scale"
                  label="Escala"
                  min={0.3}
                  max={2.2}
                  step={0.05}
                  value={selectedSticker.scale}
                  displayValue={`${Math.round(selectedSticker.scale * 100)}%`}
                  onChange={(scale) => handleUpdateSelectedSticker({ scale })}
                />
                <SliderField
                  id="y2k-rotation"
                  label="Rotação"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedSticker.rotation}
                  displayValue={`${selectedSticker.rotation}°`}
                  onChange={(rotation) => handleUpdateSelectedSticker({ rotation })}
                />
              </CollapsibleSection>
            )}
          </>
        )}

        {activeTab === 'clickbait' && (
          <>
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onChange(CLICKBAIT_TURBO_PATCH)}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Aplicar combo clickbait</span>
              </Button>
              <Button variant="secondary" size="md" onClick={clearClickbaitEffects}>
                Limpar
              </Button>
            </div>

            <CollapsibleSection
              title="Gancho superior"
              open={config.showHook}
              onOpenChange={(open) => onChange({ showHook: open })}
              headerRight={
                <Switch
                  checked={config.showHook}
                  onChange={(showHook) => onChange({ showHook })}
                  ariaLabel="Exibir gancho superior"
                />
              }
            >
              <TextInput
                type="text"
                value={config.hookText}
                onChange={(e) => onChange({ hookText: e.target.value })}
                placeholder="Ex: ATUALIZADO 2026"
                className="font-semibold"
              />
              <div className="flex flex-wrap gap-1.5">
                {HOOK_SUGGESTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange({ hookText: h })}
                    className={`h-6 px-2 text-[11px] font-medium rounded-[var(--radius-sm)] border transition-colors cursor-pointer ${
                      config.hookText === h
                        ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <SegmentedControl<HookColor>
                ariaLabel="Cor do gancho"
                value={config.hookColor}
                onChange={(hookColor) => onChange({ hookColor })}
                fullWidth
                size="sm"
                options={[
                  { value: 'yellow', label: 'Amarelo' },
                  { value: 'red', label: 'Vermelho' },
                  { value: 'purple', label: 'Roxo' },
                  { value: 'white', label: 'Branco' },
                ]}
              />
            </CollapsibleSection>

            <CollapsibleSection
              title="Adesivo de oferta"
              open={config.stickerShow}
              onOpenChange={(open) => onChange({ stickerShow: open })}
              headerRight={
                <Switch
                  checked={config.stickerShow}
                  onChange={(stickerShow) => onChange({ stickerShow })}
                  ariaLabel="Exibir adesivo de oferta"
                />
              }
            >
              <TextAreaField
                rows={2}
                value={config.stickerText}
                onChange={(e) => onChange({ stickerText: e.target.value })}
                placeholder={'Ex: -70%\nOFF'}
                className="text-xs font-semibold"
              />
              <div className="flex flex-wrap gap-1.5">
                {STICKER_SUGGESTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onChange({ stickerText: st })}
                    className={`h-6 px-2 text-[11px] font-medium rounded-[var(--radius-sm)] border transition-colors cursor-pointer ${
                      config.stickerText === st
                        ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st.replace('\n', ' ')}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">Formato</span>
                <SegmentedControl<StickerShape>
                  ariaLabel="Formato do adesivo"
                  value={config.stickerShape}
                  onChange={(stickerShape) => onChange({ stickerShape })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'starburst', label: 'Estrela' },
                    { value: 'ribbon', label: 'Etiqueta' },
                    { value: 'pill-neon', label: 'Pílula Glow' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">Cor</span>
                <SegmentedControl<StickerColor>
                  ariaLabel="Cor do adesivo"
                  value={config.stickerColor}
                  onChange={(stickerColor) => onChange({ stickerColor })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'yellow', label: 'Amarelo' },
                    { value: 'red', label: 'Vermelho' },
                    { value: 'purple', label: 'Roxo' },
                    { value: 'lime', label: 'Lima' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">Posição</span>
                <SegmentedControl<StickerPosition>
                  ariaLabel="Posição do adesivo"
                  value={config.stickerPosition}
                  onChange={(stickerPosition) => onChange({ stickerPosition })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'top-right', label: 'Topo Dir.' },
                    { value: 'bottom-right', label: 'Base Dir.' },
                    { value: 'bottom-left', label: 'Base Esq.' },
                  ]}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Seta apontadora"
              open={config.arrowShow}
              onOpenChange={(open) => onChange({ arrowShow: open })}
              headerRight={
                <Switch
                  checked={config.arrowShow}
                  onChange={(arrowShow) => onChange({ arrowShow })}
                  ariaLabel="Exibir seta apontadora"
                />
              }
            >
              <SegmentedControl<ArrowColor>
                ariaLabel="Cor da seta"
                value={config.arrowColor}
                onChange={(arrowColor) => onChange({ arrowColor })}
                fullWidth
                size="sm"
                options={[
                  { value: 'red', label: 'Vermelha' },
                  { value: 'yellow', label: 'Amarela' },
                  { value: 'purple', label: 'Roxa' },
                  { value: 'chrome', label: 'Chrome' },
                ]}
              />

              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">Alvo da seta</span>
                <SegmentedControl<ArrowTarget>
                  ariaLabel="Alvo da seta"
                  value={config.arrowTarget}
                  onChange={(arrowTarget) => onChange({ arrowTarget })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'mockup', label: 'Mockup' },
                    { value: 'title', label: 'Título' },
                    { value: 'center', label: 'Centro' },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[var(--text-secondary)]">Círculo de foco</span>
                <Switch
                  checked={config.arrowPulseRing}
                  onChange={(arrowPulseRing) => onChange({ arrowPulseRing })}
                  ariaLabel="Exibir círculo de foco no alvo"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Raios de impacto"
              defaultOpen={config.speedlinesStyle !== 'none'}
            >
              <SegmentedControl<SpeedlinesStyle>
                ariaLabel="Estilo dos raios de impacto"
                value={config.speedlinesStyle}
                onChange={(speedlinesStyle) => onChange({ speedlinesStyle })}
                fullWidth
                size="sm"
                options={[
                  { value: 'none', label: 'Off' },
                  { value: 'subtle', label: 'Sutil' },
                  { value: 'burst', label: 'Explosão' },
                  { value: 'vortex', label: 'Vórtice' },
                ]}
              />

              {config.speedlinesStyle !== 'none' && (
                <SliderField
                  id="speedlines-op"
                  label="Força dos raios"
                  min={0.1}
                  max={0.85}
                  step={0.05}
                  value={config.speedlinesOpacity}
                  displayValue={`${Math.round(config.speedlinesOpacity * 100)}%`}
                  onChange={(speedlinesOpacity) => onChange({ speedlinesOpacity })}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Aura, brilhos e moldura" defaultOpen={false}>
              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">Aura luminosa</span>
                <SegmentedControl<AuraColor>
                  ariaLabel="Cor da aura"
                  value={config.auraColor}
                  onChange={(auraColor) => onChange({ auraColor })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'none', label: 'Off' },
                    { value: 'white', label: 'Branca' },
                    { value: 'blue', label: 'Azul' },
                    { value: 'purple', label: 'Roxa' },
                    { value: 'gold', label: 'Ouro' },
                  ]}
                />
              </div>

              {config.auraColor !== 'none' && (
                <SliderField
                  id="aura-intensity"
                  label="Intensidade da aura"
                  min={0.2}
                  max={1.2}
                  step={0.05}
                  value={config.auraIntensity}
                  displayValue={`${Math.round(config.auraIntensity * 100)}%`}
                  onChange={(auraIntensity) => onChange({ auraIntensity })}
                />
              )}

              <SliderField
                id="sparkles-count"
                label="Estrelas e flashes Y2K"
                min={0}
                max={12}
                step={1}
                value={config.sparklesCount}
                displayValue={`${config.sparklesCount}`}
                onChange={(sparklesCount) => onChange({ sparklesCount })}
              />

              <div className="space-y-1.5">
                <span className="text-xs text-[var(--text-secondary)] block">
                  Moldura de destaque
                </span>
                <SegmentedControl<FrameStyle>
                  ariaLabel="Moldura de destaque"
                  value={config.frameStyle}
                  onChange={(frameStyle) => onChange({ frameStyle })}
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'none', label: 'Sem' },
                    { value: 'purple', label: 'Roxo' },
                    { value: 'yellow', label: 'Amarelo' },
                    { value: 'red', label: 'Verm.' },
                    { value: 'chrome', label: 'Chrome' },
                  ]}
                />
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </aside>
  );
};
