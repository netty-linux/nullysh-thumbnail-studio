import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ASPECT_RATIOS,
  BACKGROUND_PRESETS,
  BADGE_SUGGESTIONS,
  CATEGORY_PRESETS,
  CLICKBAIT_TURBO_PATCH,
  DEFAULT_CONFIG,
  HOOK_SUGGESTIONS,
  STICKER_SUGGESTIONS,
  Y2K_STICKER_CATALOG,
} from '../src/data/presets.js';
import type { ThumbnailConfig, Y2KStickerItem } from '../src/types/thumbnail.js';
import {
  getGenerationById,
  listGenerationsMeta,
  saveGeneration,
  toGenerationMeta,
} from './generationStore.js';
import { renderThumbnailNode } from './nodeCanvasRenderer.js';

const AspectRatioSchema = z.enum(['16:9', '4:3', '1:1']);
const BackgroundSchema = z.enum(['nullysh-sky', 'sunset-soft', 'chrome-dark']);
const BadgeStyleSchema = z.enum(['basefy-dark', 'frost-light']);
const MockupPositionSchema = z.enum(['left', 'center', 'right']);
const ChromeFrameSchema = z.enum([
  'none',
  'chrome-solid',
  'chrome-bevel',
  'chrome-dither',
  'chrome-chain',
]);
const LayerSchema = z.enum(['behind-text', 'front']);
const Y2KStickerTypeSchema = z.enum([
  'star-3d',
  'heart-chrome',
  'spark-burst',
  'glyph-orbit',
  'glyph-cross',
  'lightning-chrome',
  'cd-disc',
  'butterfly-chrome',
]);

const Y2KStickerInputSchema = z.object({
  type: Y2KStickerTypeSchema.describe('Tipo de sticker Y2K metálico'),
  x: z.number().min(0).max(100).default(82).describe('Posição horizontal em % (0-100)'),
  y: z.number().min(0).max(100).default(24).describe('Posição vertical em % (0-100)'),
  scale: z.number().min(0.3).max(2.5).default(1).describe('Escala do sticker (0.3-2.5)'),
  rotation: z.number().min(-180).max(180).default(0).describe('Rotação em graus (-180 a 180)'),
  layer: LayerSchema.default('front').describe('Camada: front (na frente) ou behind-text (atrás do texto)'),
});

const MockupInputSchema = z.object({
  imageUrl: z
    .string()
    .describe('URL http(s):// ou Data URL base64 (data:image/...) do mockup do produto'),
  position: MockupPositionSchema.default('right').describe('Posição na composição'),
  scale: z.number().min(0.4).max(1.8).default(0.85).describe('Escala do mockup'),
  rotation: z.number().min(-25).max(25).default(-4).describe('Rotação em graus'),
  offsetY: z.number().min(-180).max(180).default(0).describe('Deslocamento vertical em px'),
  shadow: z.boolean().default(true).describe('Sombra projetada automática'),
});

const ExtraImageInputSchema = z.object({
  imageUrl: z
    .string()
    .describe('URL http(s):// ou Data URL base64 (data:image/...) da segunda imagem livre'),
  x: z.number().min(0).max(100).default(78).describe('Posição X livre em % (0-100)'),
  y: z.number().min(0).max(100).default(28).describe('Posição Y livre em % (0-100)'),
  scale: z.number().min(0.2).max(2.2).default(0.55).describe('Escala da segunda imagem'),
  rotation: z.number().min(-180).max(180).default(6).describe('Rotação em graus'),
  opacity: z.number().min(0.1).max(1).default(1).describe('Opacidade (0.1-1)'),
  layer: LayerSchema.default('front').describe('Camada: front ou behind-text'),
  shadow: z.boolean().default(true).describe('Sombra projetada'),
});

const ClickbaitInputSchema = z.object({
  showHook: z.boolean().optional().describe('Exibir fita de gancho acima do título'),
  hookText: z.string().optional().describe('Texto da fita de gancho (ex: ATUALIZADO 2026)'),
  hookColor: z.enum(['yellow', 'red', 'purple', 'white']).optional(),
  speedlinesStyle: z.enum(['none', 'subtle', 'burst', 'vortex']).optional(),
  speedlinesOpacity: z.number().min(0).max(1).optional(),
  auraColor: z.enum(['none', 'white', 'blue', 'purple', 'gold']).optional(),
  auraIntensity: z.number().min(0).max(1.5).optional(),
  sparklesCount: z.number().int().min(0).max(12).optional(),
  stickerShow: z.boolean().optional().describe('Exibir selo promocional starburst/ribbon/pill'),
  stickerText: z.string().optional().describe('Texto do selo (use \\n para 2 linhas, ex: -70%\\nOFF)'),
  stickerShape: z.enum(['starburst', 'ribbon', 'pill-neon']).optional(),
  stickerColor: z.enum(['yellow', 'red', 'purple', 'lime']).optional(),
  stickerPosition: z.enum(['top-right', 'bottom-right', 'bottom-left']).optional(),
  arrowShow: z.boolean().optional().describe('Exibir seta clickbait curvada'),
  arrowColor: z.enum(['red', 'yellow', 'purple', 'chrome']).optional(),
  arrowTarget: z.enum(['mockup', 'title', 'center']).optional(),
  arrowPulseRing: z.boolean().optional().describe('Anel alvo tracejado na ponta da seta'),
  frameStyle: z.enum(['none', 'purple', 'yellow', 'red', 'chrome']).optional(),
});

export const GenerateThumbnailInputShape = {
  preset: z
    .enum(['pack-ia', 'prompts', 'software-proprio', 'design-template', 'estrategia'])
    .optional()
    .describe('Preset base de categoria da loja Nullysh antes de aplicar os campos customizados'),
  turboClickbait: z
    .boolean()
    .optional()
    .describe('Ativa o pacote Turbo Clickbait (fita, starburst, seta, aura, speedlines, edgeBloom alto)'),
  aspectRatio: AspectRatioSchema.optional().describe('Proporção: 16:9 (1280x720), 4:3 (1200x900), 1:1 (1080x1080)'),
  background: BackgroundSchema.optional().describe('Fundo: nullysh-sky, sunset-soft ou chrome-dark'),
  title: z.string().optional().describe('Título principal em Liquid Chrome 3D (até 2 linhas com \\n)'),
  titleSize: z.number().min(48).max(170).optional().describe('Tamanho da fonte do título (48-170)'),
  titleCurvature: z.number().min(-25).max(25).optional().describe('Curvatura em arco do título (-25 a 25)'),
  chromeIntensity: z.number().min(0.2).max(1.8).optional().describe('Intensidade do brilho metálico especular'),
  subtitle: z.string().optional().describe('Subtítulo exibido na faixa de papel rasgado creme'),
  showSubtitle: z.boolean().optional(),
  tags: z.array(z.string()).max(4).optional().describe('Até 4 tags curtas na pílula translúcida'),
  showTags: z.boolean().optional(),
  badgeText: z.string().optional().describe('Texto do selo de canto superior (ex: Nullysh Shop, PACK IA)'),
  showBadge: z.boolean().optional(),
  badgeStyle: BadgeStyleSchema.optional(),
  ditherIntensity: z.number().min(0).max(1).optional().describe('Intensidade do dither pixelado Bayer no topo'),
  vibranceBoost: z.number().min(0.8).max(1.5).optional().describe('Saturação/contraste extra da arte'),
  chromeFrame: ChromeFrameSchema.optional().describe('Moldura metálica Y2K em volta da thumbnail'),
  chromeFrameScale: z.number().min(0.6).max(2).optional().describe('Espessura/escala da moldura cromada'),
  edgeBloom: z.number().min(0).max(1.5).optional().describe('Intensidade do brilho líquido (Bloom/Glow) nas bordas'),
  mockup: MockupInputSchema.optional().describe('Imagem principal do produto (PNG transparente ou foto)'),
  extraImage: ExtraImageInputSchema.optional().describe('Segunda imagem posicionada livremente em qualquer X/Y'),
  y2kStickers: z
    .array(Y2KStickerInputSchema)
    .max(12)
    .optional()
    .describe('Lista de stickers Y2K cromados (estrela 3D, coração, CD, raio, órbita, etc.)'),
  clickbait: ClickbaitInputSchema.optional().describe('Controles de dopamina visual e clickbait'),
  format: z.enum(['png', 'webp']).default('png').describe('Formato de saída: png ou webp'),
  scale: z
    .union([z.literal(1), z.literal(2)])
    .default(2)
    .describe('Resolução de exportação: 1 (nativa) ou 2 (2x Retina / 2560x1440 em 16:9)'),
};

const GenerateThumbnailSchema = z.object(GenerateThumbnailInputShape);
export type GenerateThumbnailInput = z.infer<typeof GenerateThumbnailSchema>;

export function buildThumbnailConfigFromInput(input: GenerateThumbnailInput): ThumbnailConfig {
  const basePreset = input.preset
    ? CATEGORY_PRESETS.find((p) => p.id === input.preset)?.config ?? {}
    : {};

  const turboPatch = input.turboClickbait ? CLICKBAIT_TURBO_PATCH : {};

  const y2kStickers: Y2KStickerItem[] = (input.y2kStickers ?? []).map((s, idx) => ({
    id: `mcp-sticker-${idx}-${randomUUID().slice(0, 6)}`,
    type: s.type,
    x: s.x,
    y: s.y,
    scale: s.scale,
    rotation: s.rotation,
    layer: s.layer,
  }));

  const merged: ThumbnailConfig = {
    ...DEFAULT_CONFIG,
    ...basePreset,
    ...turboPatch,
    aspectRatio: input.aspectRatio ?? DEFAULT_CONFIG.aspectRatio,
    background: input.background ?? basePreset.background ?? DEFAULT_CONFIG.background,
    title: input.title ?? basePreset.title ?? DEFAULT_CONFIG.title,
    titleSize: input.titleSize ?? basePreset.titleSize ?? DEFAULT_CONFIG.titleSize,
    titleCurvature:
      input.titleCurvature ?? basePreset.titleCurvature ?? DEFAULT_CONFIG.titleCurvature,
    chromeIntensity:
      input.chromeIntensity ??
      (input.turboClickbait ? CLICKBAIT_TURBO_PATCH.chromeIntensity : undefined) ??
      basePreset.chromeIntensity ??
      DEFAULT_CONFIG.chromeIntensity,
    subtitle: input.subtitle ?? basePreset.subtitle ?? DEFAULT_CONFIG.subtitle,
    showSubtitle: input.showSubtitle ?? basePreset.showSubtitle ?? DEFAULT_CONFIG.showSubtitle,
    tags: input.tags ?? basePreset.tags ?? DEFAULT_CONFIG.tags,
    showTags: input.showTags ?? basePreset.showTags ?? DEFAULT_CONFIG.showTags,
    badgeText: input.badgeText ?? basePreset.badgeText ?? DEFAULT_CONFIG.badgeText,
    showBadge: input.showBadge ?? basePreset.showBadge ?? DEFAULT_CONFIG.showBadge,
    badgeStyle: input.badgeStyle ?? basePreset.badgeStyle ?? DEFAULT_CONFIG.badgeStyle,
    ditherIntensity: input.ditherIntensity ?? DEFAULT_CONFIG.ditherIntensity,
    vibranceBoost:
      input.vibranceBoost ??
      (input.turboClickbait ? CLICKBAIT_TURBO_PATCH.vibranceBoost : undefined) ??
      DEFAULT_CONFIG.vibranceBoost,
    chromeFrame: input.chromeFrame ?? DEFAULT_CONFIG.chromeFrame,
    chromeFrameScale: input.chromeFrameScale ?? DEFAULT_CONFIG.chromeFrameScale,
    edgeBloom:
      input.edgeBloom ??
      (input.turboClickbait ? CLICKBAIT_TURBO_PATCH.edgeBloom : undefined) ??
      DEFAULT_CONFIG.edgeBloom,
    mockupDataUrl: input.mockup?.imageUrl ?? null,
    mockupPosition: input.mockup?.position ?? DEFAULT_CONFIG.mockupPosition,
    mockupScale: input.mockup?.scale ?? DEFAULT_CONFIG.mockupScale,
    mockupRotation: input.mockup?.rotation ?? DEFAULT_CONFIG.mockupRotation,
    mockupOffsetY: input.mockup?.offsetY ?? DEFAULT_CONFIG.mockupOffsetY,
    mockupShadow: input.mockup?.shadow ?? DEFAULT_CONFIG.mockupShadow,
    extraImageDataUrl: input.extraImage?.imageUrl ?? null,
    extraImageX: input.extraImage?.x ?? DEFAULT_CONFIG.extraImageX,
    extraImageY: input.extraImage?.y ?? DEFAULT_CONFIG.extraImageY,
    extraImageScale: input.extraImage?.scale ?? DEFAULT_CONFIG.extraImageScale,
    extraImageRotation: input.extraImage?.rotation ?? DEFAULT_CONFIG.extraImageRotation,
    extraImageOpacity: input.extraImage?.opacity ?? DEFAULT_CONFIG.extraImageOpacity,
    extraImageLayer: input.extraImage?.layer ?? DEFAULT_CONFIG.extraImageLayer,
    extraImageShadow: input.extraImage?.shadow ?? DEFAULT_CONFIG.extraImageShadow,
    y2kStickers,
    showHook:
      input.clickbait?.showHook ??
      turboPatch.showHook ??
      basePreset.showHook ??
      DEFAULT_CONFIG.showHook,
    hookText:
      input.clickbait?.hookText ??
      turboPatch.hookText ??
      basePreset.hookText ??
      DEFAULT_CONFIG.hookText,
    hookColor:
      input.clickbait?.hookColor ??
      turboPatch.hookColor ??
      basePreset.hookColor ??
      DEFAULT_CONFIG.hookColor,
    speedlinesStyle:
      input.clickbait?.speedlinesStyle ??
      turboPatch.speedlinesStyle ??
      basePreset.speedlinesStyle ??
      DEFAULT_CONFIG.speedlinesStyle,
    speedlinesOpacity:
      input.clickbait?.speedlinesOpacity ??
      turboPatch.speedlinesOpacity ??
      basePreset.speedlinesOpacity ??
      DEFAULT_CONFIG.speedlinesOpacity,
    auraColor:
      input.clickbait?.auraColor ??
      turboPatch.auraColor ??
      basePreset.auraColor ??
      DEFAULT_CONFIG.auraColor,
    auraIntensity:
      input.clickbait?.auraIntensity ??
      turboPatch.auraIntensity ??
      basePreset.auraIntensity ??
      DEFAULT_CONFIG.auraIntensity,
    sparklesCount:
      input.clickbait?.sparklesCount ??
      turboPatch.sparklesCount ??
      basePreset.sparklesCount ??
      DEFAULT_CONFIG.sparklesCount,
    stickerShow:
      input.clickbait?.stickerShow ??
      turboPatch.stickerShow ??
      basePreset.stickerShow ??
      DEFAULT_CONFIG.stickerShow,
    stickerText:
      input.clickbait?.stickerText ??
      turboPatch.stickerText ??
      basePreset.stickerText ??
      DEFAULT_CONFIG.stickerText,
    stickerShape:
      input.clickbait?.stickerShape ??
      turboPatch.stickerShape ??
      basePreset.stickerShape ??
      DEFAULT_CONFIG.stickerShape,
    stickerColor:
      input.clickbait?.stickerColor ??
      turboPatch.stickerColor ??
      basePreset.stickerColor ??
      DEFAULT_CONFIG.stickerColor,
    stickerPosition:
      input.clickbait?.stickerPosition ??
      turboPatch.stickerPosition ??
      basePreset.stickerPosition ??
      DEFAULT_CONFIG.stickerPosition,
    arrowShow:
      input.clickbait?.arrowShow ?? turboPatch.arrowShow ?? DEFAULT_CONFIG.arrowShow,
    arrowColor:
      input.clickbait?.arrowColor ?? turboPatch.arrowColor ?? DEFAULT_CONFIG.arrowColor,
    arrowTarget: input.clickbait?.arrowTarget ?? DEFAULT_CONFIG.arrowTarget,
    arrowPulseRing:
      input.clickbait?.arrowPulseRing ??
      turboPatch.arrowPulseRing ??
      DEFAULT_CONFIG.arrowPulseRing,
    frameStyle:
      input.clickbait?.frameStyle ?? turboPatch.frameStyle ?? DEFAULT_CONFIG.frameStyle,
  };

  return merged;
}

export function getStudioCapabilitiesPayload() {
  return {
    studio: 'Nullysh Thumbnail Studio',
    platform: 'Basefy',
    aspectRatios: Object.values(ASPECT_RATIOS),
    backgrounds: Object.values(BACKGROUND_PRESETS).map(({ imageUrl: _img, ...rest }) => rest),
    categoryPresets: CATEGORY_PRESETS.map((p) => ({ id: p.id, label: p.label })),
    chromeFrames: [
      { id: 'none', label: 'Sem moldura cromada' },
      { id: 'chrome-solid', label: 'Borda Sólida Cromada' },
      { id: 'chrome-bevel', label: 'Borda Bevel + Rebites 3D' },
      { id: 'chrome-dither', label: 'Borda Dither Pixel Y2K' },
      { id: 'chrome-chain', label: 'Borda Corrente 3D Metálica' },
    ],
    y2kStickers: Y2K_STICKER_CATALOG,
    suggestions: {
      badges: BADGE_SUGGESTIONS,
      hooks: HOOK_SUGGESTIONS,
      stickers: STICKER_SUGGESTIONS,
    },
    clickbaitControls: {
      hookColors: ['yellow', 'red', 'purple', 'white'],
      speedlinesStyles: ['none', 'subtle', 'burst', 'vortex'],
      auraColors: ['none', 'white', 'blue', 'purple', 'gold'],
      stickerShapes: ['starburst', 'ribbon', 'pill-neon'],
      stickerColors: ['yellow', 'red', 'purple', 'lime'],
      stickerPositions: ['top-right', 'bottom-right', 'bottom-left'],
      arrowColors: ['red', 'yellow', 'purple', 'chrome'],
      arrowTargets: ['mockup', 'title', 'center'],
      urgencyFrames: ['none', 'purple', 'yellow', 'red', 'chrome'],
    },
  };
}

export const MCP_TOOLS_CATALOG = [
  {
    name: 'generate_thumbnail',
    description:
      'Gera uma thumbnail profissional da Nullysh (PNG ou WebP 1x/2x) com todas as funcionalidades do estúdio: título Liquid Chrome 3D, faixa de papel rasgado, pílula de tags, mockup + 2ª imagem livre, molduras cromadas, stickers Y2K, Bloom/Glow e elementos clickbait.',
  },
  {
    name: 'apply_clickbait_preset',
    description:
      'Atalho rápido de alta conversão para gerar thumbnails com o modo Turbo Clickbait ativado a partir de título, subtítulo e selo promocional.',
  },
  {
    name: 'list_studio_options',
    description:
      'Lista todos os presets de categoria, proporções, fundos, molduras cromadas, stickers Y2K e opções de clickbait disponíveis.',
  },
  {
    name: 'list_generated_thumbnails',
    description:
      'Lista as últimas thumbnails geradas no servidor com IDs, URLs diretas de download e configurações completas.',
  },
  {
    name: 'get_generated_thumbnail',
    description:
      'Recupera a imagem e a configuração completa de uma thumbnail gerada anteriormente pelo ID.',
  },
];

export function createNullyshMcpServer(getBaseUrl: () => string): McpServer {
  const server = new McpServer(
    {
      name: 'nullysh-thumbnail-studio',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // 1. list_studio_options
  server.registerTool(
    'list_studio_options',
    {
      title: 'Listar Opções do Nullysh Studio',
      description:
        'Retorna todos os presets, proporções, fundos, molduras metálicas cromadas, stickers Y2K e opções de clickbait disponíveis no estúdio.',
    },
    async () => {
      const payload = getStudioCapabilitiesPayload();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    }
  );

  // 2. generate_thumbnail (full studio capabilities)
  server.registerTool(
    'generate_thumbnail',
    {
      title: 'Gerar Thumbnail Completa',
      description:
        'Renderiza uma thumbnail no Nullysh Thumbnail Studio usando todas as funcionalidades: Liquid Chrome 3D, papel rasgado creme, tags, selo de canto, mockup do produto, segunda imagem livre, moldura cromada, stickers Y2K, bloom líquido e clickbait.',
      inputSchema: GenerateThumbnailInputShape,
    },
    async (args) => {
      const parsed = GenerateThumbnailSchema.parse(args);
      const config = buildThumbnailConfigFromInput(parsed);
      const format = parsed.format ?? 'png';
      const scale: 1 | 2 = parsed.scale ?? 2;

      const rendered = await renderThumbnailNode(config, { format, scale });
      const cleanTitle = config.title.replace(/\n/g, ' ').trim() || 'Thumbnail Nullysh';

      const saved = saveGeneration({
        title: cleanTitle,
        format,
        scale,
        mimeType: rendered.mimeType,
        width: rendered.width,
        height: rendered.height,
        source: 'mcp',
        buffer: rendered.buffer,
        previewDataUrl: rendered.previewDataUrl,
        config,
      });

      const meta = toGenerationMeta(saved, getBaseUrl());

      return {
        content: [
          {
            type: 'image',
            data: rendered.base64,
            mimeType: rendered.mimeType,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: meta.id,
                title: meta.title,
                dimensions: `${meta.width}x${meta.height}`,
                format: meta.format,
                scale: meta.scale,
                imageUrl: meta.imageUrl,
                config: meta.config,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 3. apply_clickbait_preset
  server.registerTool(
    'apply_clickbait_preset',
    {
      title: 'Gerar Thumbnail Turbo Clickbait',
      description:
        'Gera rapidamente uma thumbnail de alto impacto (Turbo Clickbait: fita superior, starburst, seta curvada, aura e brilho líquido intenso) informando apenas título, subtítulo e parâmetros opcionais.',
      inputSchema: {
        title: z.string().describe('Título principal impactante (até 2 linhas com \\n)'),
        subtitle: z.string().optional().describe('Subtítulo no papel rasgado creme'),
        categoryPreset: z
          .enum(['pack-ia', 'prompts', 'software-proprio', 'design-template', 'estrategia'])
          .default('pack-ia'),
        hookText: z.string().optional().describe('Texto da fita de gancho (ex: MÉTODO VALIDADO)'),
        offerStickerText: z.string().optional().describe('Texto do starburst (ex: -70%\\nOFF)'),
        tags: z.array(z.string()).max(4).optional(),
        aspectRatio: AspectRatioSchema.default('16:9'),
        background: BackgroundSchema.optional(),
        chromeFrame: ChromeFrameSchema.optional(),
        y2kStickers: z.array(Y2KStickerInputSchema).max(8).optional(),
        mockupImageUrl: z.string().optional().describe('URL http(s) ou Data URL do mockup'),
        format: z.enum(['png', 'webp']).default('png'),
        scale: z.union([z.literal(1), z.literal(2)]).default(2),
      },
    },
    async (args) => {
      const config = buildThumbnailConfigFromInput({
        preset: args.categoryPreset,
        turboClickbait: true,
        title: args.title,
        subtitle: args.subtitle,
        tags: args.tags,
        aspectRatio: args.aspectRatio,
        background: args.background,
        chromeFrame: args.chromeFrame ?? 'chrome-bevel',
        y2kStickers: args.y2kStickers ?? [
          { type: 'star-3d', x: 14, y: 22, scale: 0.9, rotation: -12, layer: 'front' },
          { type: 'spark-burst', x: 86, y: 74, scale: 1, rotation: 8, layer: 'front' },
        ],
        mockup: args.mockupImageUrl
          ? {
              imageUrl: args.mockupImageUrl,
              position: 'right',
              scale: 0.85,
              rotation: -4,
              offsetY: 0,
              shadow: true,
            }
          : undefined,
        clickbait: {
          hookText: args.hookText,
          stickerText: args.offerStickerText,
        },
        format: args.format,
        scale: args.scale,
      });

      const format = args.format ?? 'png';
      const scale: 1 | 2 = args.scale ?? 2;
      const rendered = await renderThumbnailNode(config, { format, scale });

      const saved = saveGeneration({
        title: config.title.replace(/\n/g, ' ').trim() || 'Clickbait Nullysh',
        format,
        scale,
        mimeType: rendered.mimeType,
        width: rendered.width,
        height: rendered.height,
        source: 'mcp',
        buffer: rendered.buffer,
        previewDataUrl: rendered.previewDataUrl,
        config,
      });

      const meta = toGenerationMeta(saved, getBaseUrl());

      return {
        content: [
          {
            type: 'image',
            data: rendered.base64,
            mimeType: rendered.mimeType,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: meta.id,
                title: meta.title,
                dimensions: `${meta.width}x${meta.height}`,
                imageUrl: meta.imageUrl,
                config: meta.config,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // 4. list_generated_thumbnails
  server.registerTool(
    'list_generated_thumbnails',
    {
      title: 'Listar Thumbnails Geradas',
      description:
        'Retorna as últimas thumbnails geradas via MCP no servidor com IDs, dimensões, timestamps e URLs de imagem.',
    },
    async () => {
      const list = listGenerationsMeta(getBaseUrl()).map(
        ({ previewDataUrl: _p, ...rest }) => rest
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ count: list.length, items: list }, null, 2),
          },
        ],
      };
    }
  );

  // 5. get_generated_thumbnail
  server.registerTool(
    'get_generated_thumbnail',
    {
      title: 'Obter Thumbnail por ID',
      description: 'Retorna a imagem renderizada e a configuração JSON de uma thumbnail gerada.',
      inputSchema: {
        id: z.string().describe('ID da thumbnail retornada por generate_thumbnail'),
      },
    },
    async ({ id }) => {
      const item = getGenerationById(id);
      if (!item) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Thumbnail com ID "${id}" não encontrada.`,
            },
          ],
        };
      }
      const meta = toGenerationMeta(item, getBaseUrl());
      return {
        content: [
          {
            type: 'image',
            data: item.buffer.toString('base64'),
            mimeType: item.mimeType,
          },
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: meta.id,
                title: meta.title,
                dimensions: `${meta.width}x${meta.height}`,
                imageUrl: meta.imageUrl,
                config: meta.config,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Resources
  server.registerResource(
    'studio-presets',
    'nullysh://studio/presets',
    {
      title: 'Presets de Categoria Nullysh',
      description: 'Presets prontos para produtos digitais na loja Nullysh / Basefy',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              defaultConfig: DEFAULT_CONFIG,
              clickbaitTurboPatch: CLICKBAIT_TURBO_PATCH,
              categoryPresets: CATEGORY_PRESETS,
            },
            null,
            2
          ),
        },
      ],
    })
  );

  server.registerResource(
    'studio-capabilities',
    'nullysh://studio/capabilities',
    {
      title: 'Catálogo de Recursos do Estúdio',
      description: 'Fundos, molduras cromadas, stickers Y2K, proporções e opções de clickbait',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(getStudioCapabilitiesPayload(), null, 2),
        },
      ],
    })
  );

  // Prompt template
  server.registerPrompt(
    'create_basefy_thumbnail',
    {
      title: 'Criar Thumbnail Basefy Alta Conversão',
      description:
        'Guia um agente de IA para montar a melhor composição Y2K Chrome no Nullysh Thumbnail Studio para um produto digital.',
      argsSchema: {
        productName: z.string().describe('Nome curto do produto digital'),
        productBenefit: z.string().describe('Promessa principal em 1 frase curta'),
        highUrgency: z.string().optional().describe('sim ou nao para ativar modo clickbait intenso'),
      },
    },
    async ({ productName, productBenefit, highUrgency }) => {
      const turbo = highUrgency?.toLowerCase().startsWith('s') ?? false;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                `Crie uma thumbnail para o produto "${productName}" na loja Nullysh (Basefy) usando a tool \`generate_thumbnail\`.`,
                `Regras visuais da marca Nullysh:`,
                `- Título curto e impactante (2 a 4 palavras, máximo 2 linhas separadas por \\n) para o estilo Liquid Chrome 3D.`,
                `- Subtítulo direto na faixa de papel rasgado creme baseado em: "${productBenefit}".`,
                `- 3 a 4 tags curtas (1-2 palavras cada) na pílula translúcida.`,
                `- Escolha um fundo adequado ("nullysh-sky", "sunset-soft" ou "chrome-dark"), moldura cromada ("chrome-bevel", "chrome-dither", "chrome-chain" ou "chrome-solid"), stickers Y2K posicionados fora do centro do texto (ex: cantos x=12..20 ou x=80..90), e ajuste edgeBloom (0.5 a 1.1).`,
                turbo
                  ? `- Ative turboClickbait: true com gancho superior e selo starburst.`
                  : `- Mantenha equilíbrio limpo de estúdio com brilhos Y2K sutis.`,
              ].join('\n'),
            },
          },
        ],
      };
    }
  );

  return server;
}
