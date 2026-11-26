export type AspectRatioKey = '16:9' | '4:3' | '1:1';

export type BackgroundPresetKey = 'nullysh-sky' | 'sunset-soft' | 'chrome-dark';

export type MockupPosition = 'left' | 'center' | 'right';

export type BadgeStyle = 'basefy-dark' | 'frost-light';

export type SpeedlinesStyle = 'none' | 'subtle' | 'burst' | 'vortex';

export type AuraColor = 'none' | 'white' | 'blue' | 'purple' | 'gold';

export type HookColor = 'yellow' | 'red' | 'purple' | 'white';

export type StickerShape = 'starburst' | 'ribbon' | 'pill-neon';

export type StickerColor = 'yellow' | 'red' | 'purple' | 'lime';

export type StickerPosition = 'top-right' | 'bottom-right' | 'bottom-left';

export type ArrowColor = 'red' | 'yellow' | 'purple' | 'chrome';

export type ArrowTarget = 'mockup' | 'title' | 'center';

export type FrameStyle = 'none' | 'purple' | 'yellow' | 'red' | 'chrome';

export type ChromeFrameStyle =
  | 'none'
  | 'chrome-solid'
  | 'chrome-bevel'
  | 'chrome-dither'
  | 'chrome-chain';

export type ExtraImageLayer = 'behind-text' | 'front';

export type Y2KStickerType =
  | 'star-3d'
  | 'heart-chrome'
  | 'spark-burst'
  | 'glyph-orbit'
  | 'glyph-cross'
  | 'lightning-chrome'
  | 'cd-disc'
  | 'butterfly-chrome';

export interface Y2KStickerItem {
  id: string;
  type: Y2KStickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  layer: ExtraImageLayer;
}

export interface AspectRatioSpec {
  key: AspectRatioKey;
  label: string;
  subtitle: string;
  width: number;
  height: number;
}

export interface BackgroundPresetSpec {
  key: BackgroundPresetKey;
  name: string;
  description: string;
  imageUrl: string;
  swatchGradient: string;
  isDark: boolean;
}

export interface ThumbnailConfig {
  aspectRatio: AspectRatioKey;
  background: BackgroundPresetKey;
  title: string;
  titleSize: number;
  titleCurvature: number;
  chromeIntensity: number;
  subtitle: string;
  showSubtitle: boolean;
  tags: string[];
  showTags: boolean;
  badgeText: string;
  showBadge: boolean;
  badgeStyle: BadgeStyle;
  mockupDataUrl: string | null;
  mockupPosition: MockupPosition;
  mockupScale: number;
  mockupRotation: number;
  mockupOffsetY: number;
  mockupShadow: boolean;
  ditherIntensity: number;

  // Metallic chrome border frames
  chromeFrame: ChromeFrameStyle;
  chromeFrameScale: number;

  // Free-positioned second image
  extraImageDataUrl: string | null;
  extraImageX: number;
  extraImageY: number;
  extraImageScale: number;
  extraImageRotation: number;
  extraImageOpacity: number;
  extraImageLayer: ExtraImageLayer;
  extraImageShadow: boolean;

  // Y2K Visual Element Stickers
  y2kStickers: Y2KStickerItem[];
  edgeBloom: number;

  // Dopamine & Clickbait controls
  showHook: boolean;
  hookText: string;
  hookColor: HookColor;
  speedlinesStyle: SpeedlinesStyle;
  speedlinesOpacity: number;
  auraColor: AuraColor;
  auraIntensity: number;
  sparklesCount: number;
  stickerShow: boolean;
  stickerText: string;
  stickerShape: StickerShape;
  stickerColor: StickerColor;
  stickerPosition: StickerPosition;
  arrowShow: boolean;
  arrowColor: ArrowColor;
  arrowTarget: ArrowTarget;
  arrowPulseRing: boolean;
  frameStyle: FrameStyle;
  vibranceBoost: number;
}

export interface CategoryPreset {
  id: string;
  label: string;
  config: Partial<ThumbnailConfig>;
}

export interface CustomPreset {
  id: string;
  label: string;
  createdAt: number;
  config: Omit<ThumbnailConfig, 'mockupDataUrl' | 'extraImageDataUrl'>;
}

export interface SavedThumbnailItem {
  id: string;
  name: string;
  createdAt: number;
  previewDataUrl: string;
  config: ThumbnailConfig;
}
