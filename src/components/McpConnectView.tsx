import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import type { ChromeFrameStyle, ThumbnailConfig } from '../types/thumbnail';
import {
  Button,
  SegmentedControl,
  SelectField,
  Switch,
  TextInput,
  Tooltip,
} from './ui/StudioPrimitives';

interface McpGenerationItem {
  id: string;
  title: string;
  createdAt: number;
  format: 'png' | 'webp';
  scale: 1 | 2;
  mimeType: 'image/png' | 'image/webp';
  width: number;
  height: number;
  byteLength: number;
  source: 'mcp' | 'api';
  imageUrl: string;
  previewDataUrl: string;
  config: ThumbnailConfig;
}

interface McpInfoPayload {
  name: string;
  version: string;
  transports: {
    streamableHttp: string;
    sse: string;
    stdioCommand: string;
  };
  tools: { name: string; description: string }[];
}

interface McpConnectViewProps {
  onLoadConfigToStudio: (config: ThumbnailConfig) => void;
}

type ConfigSnippetTab = 'http' | 'claude-remote' | 'stdio';

export function McpConnectView({ onLoadConfigToStudio }: McpConnectViewProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const [info, setInfo] = useState<McpInfoPayload | null>(null);
  const [generations, setGenerations] = useState<McpGenerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [snippetTab, setSnippetTab] = useState<ConfigSnippetTab>('http');

  const [testTitle, setTestTitle] = useState('AGENTE MCP');
  const [testSubtitle, setTestSubtitle] = useState('Thumbnail gerada pelo servidor MCP Nullysh');
  const [testPreset, setTestPreset] = useState<
    'pack-ia' | 'prompts' | 'software-proprio' | 'design-template' | 'estrategia'
  >('pack-ia');
  const [testChromeFrame, setTestChromeFrame] = useState<ChromeFrameStyle>('chrome-bevel');
  const [testTurbo, setTestTurbo] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, genRes] = await Promise.all([
        fetch('/api/mcp/info'),
        fetch('/api/mcp/generations'),
      ]);
      if (infoRes.ok) {
        const infoJson = (await infoRes.json()) as McpInfoPayload;
        setInfo(infoJson);
      }
      if (genRes.ok) {
        const genJson = (await genRes.json()) as { items: McpGenerationItem[] };
        setGenerations(genJson.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const timer = window.setInterval(() => {
      void fetchData();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [fetchData]);

  const copyText = useCallback((key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  }, []);

  const mcpUrl = info?.transports.streamableHttp ?? `${origin}/mcp`;
  const sseUrl = info?.transports.sse ?? `${origin}/sse`;
  const stdioCmd = info?.transports.stdioCommand ?? 'npx tsx server/mcpStdio.ts';

  const snippetContent =
    snippetTab === 'http'
      ? JSON.stringify(
          {
            mcpServers: {
              'nullysh-thumbnail-studio': {
                url: mcpUrl,
              },
            },
          },
          null,
          2
        )
      : snippetTab === 'claude-remote'
      ? JSON.stringify(
          {
            mcpServers: {
              'nullysh-thumbnail-studio': {
                command: 'npx',
                args: ['-y', 'mcp-remote', mcpUrl],
              },
            },
          },
          null,
          2
        )
      : JSON.stringify(
          {
            mcpServers: {
              'nullysh-thumbnail-studio': {
                command: 'npx',
                args: ['tsx', 'server/mcpStdio.ts'],
              },
            },
          },
          null,
          2
        );

  const handleTestRender = useCallback(async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      const res = await fetch('/api/mcp/test-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: testPreset,
          turboClickbait: testTurbo,
          title: testTitle,
          subtitle: testSubtitle,
          chromeFrame: testChromeFrame,
          y2kStickers: [
            { type: 'star-3d', x: 14, y: 22, scale: 0.9, rotation: -10, layer: 'front' },
            { type: 'spark-burst', x: 86, y: 74, scale: 1.0, rotation: 8, layer: 'front' },
          ],
          format: 'png',
          scale: 2,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setIsTesting(false);
    }
  }, [fetchData, isTesting, testChromeFrame, testPreset, testSubtitle, testTitle, testTurbo]);

  const handleDeleteGeneration = useCallback(async (id: string) => {
    const res = await fetch(`/api/mcp/generations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setGenerations((prev) => prev.filter((item) => item.id !== id));
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto studio-scroll bg-[var(--bg-app)] px-6 py-7 min-h-[calc(100vh-48px)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
              Servidor MCP para agentes de IA
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Conecte agentes via Streamable HTTP, SSE ou Stdio para gerar thumbnails com todos os
              recursos do estúdio.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => void fetchData()}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Endpoints & JSON Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
              <Terminal className="w-4 h-4 text-[var(--accent-text)]" />
              <span>Endpoints de transporte</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'mcp',
                  label: 'Streamable HTTP (recomendado)',
                  value: mcpUrl,
                  color: 'text-sky-300',
                },
                {
                  key: 'sse',
                  label: 'SSE legado (/sse)',
                  value: sseUrl,
                  color: 'text-[var(--text-secondary)]',
                },
                {
                  key: 'stdio',
                  label: 'Comando Stdio local',
                  value: stdioCmd,
                  color: 'text-[var(--accent-text)]',
                },
              ].map((ep) => (
                <div key={ep.key} className="space-y-1">
                  <div className="text-[11px] font-medium text-[var(--text-muted)]">{ep.label}</div>
                  <div className="flex items-center gap-2">
                    <code
                      className={`flex-1 min-w-0 truncate rounded-[var(--radius-md)] bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2.5 h-8 leading-8 text-xs font-mono ${ep.color}`}
                    >
                      {ep.value}
                    </code>
                    <Button variant="secondary" size="md" onClick={() => copyText(ep.key, ep.value)}>
                      {copiedKey === ep.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === ep.key ? 'Copiado' : 'Copiar'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-7 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
                <Layers className="w-4 h-4 text-[var(--accent-text)]" />
                <span>Configuração JSON para cliente MCP</span>
              </div>

              <SegmentedControl<ConfigSnippetTab>
                ariaLabel="Tipo de configuração MCP"
                value={snippetTab}
                onChange={setSnippetTab}
                size="sm"
                tone="surface"
                options={[
                  { value: 'http', label: 'HTTP / Cursor' },
                  { value: 'claude-remote', label: 'Claude Remote' },
                  { value: 'stdio', label: 'Stdio local' },
                ]}
              />
            </div>

            <div className="relative">
              <pre className="rounded-[var(--radius-md)] bg-[var(--bg-app)] border border-[var(--border-subtle)] p-3.5 text-xs text-[var(--text-secondary)] font-mono overflow-x-auto leading-relaxed">
                {snippetContent}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyText('snippet', snippetContent)}
                className="absolute top-2.5 right-2.5"
              >
                {copiedKey === 'snippet' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === 'snippet' ? 'Copiado' : 'Copiar JSON'}</span>
              </Button>
            </div>
          </section>
        </div>

        {/* Tools Catalog & Interactive Server Test */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Tools e resources expostos
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums">
                {info?.tools.length ?? 5} tools · 2 resources
              </span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {(info?.tools ?? []).map((tool) => (
                <div key={tool.name} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="text-xs font-semibold text-[var(--accent-text)] font-mono">
                    {tool.name}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-[var(--border-subtle)] text-[11px] flex flex-wrap gap-3 font-mono">
              <span className="text-sky-300">nullysh://studio/presets</span>
              <span className="text-sky-300">nullysh://studio/capabilities</span>
              <span className="text-amber-300">prompt: create_basefy_thumbnail</span>
            </div>
          </section>

          <section className="lg:col-span-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simular chamada de agente MCP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="mcp-test-title" className="block text-[11px] text-[var(--text-muted)]">
                  Título Chrome 3D
                </label>
                <TextInput
                  id="mcp-test-title"
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="mcp-test-preset" className="block text-[11px] text-[var(--text-muted)]">
                  Preset base
                </label>
                <SelectField
                  id="mcp-test-preset"
                  value={testPreset}
                  onChange={(e) =>
                    setTestPreset(
                      e.target.value as
                        | 'pack-ia'
                        | 'prompts'
                        | 'software-proprio'
                        | 'design-template'
                        | 'estrategia'
                    )
                  }
                >
                  <option value="pack-ia">Pack de IA</option>
                  <option value="prompts">Prompts</option>
                  <option value="software-proprio">Software Próprio</option>
                  <option value="design-template">Design / Template</option>
                  <option value="estrategia">Estratégia</option>
                </SelectField>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="mcp-test-sub" className="block text-[11px] text-[var(--text-muted)]">
                Subtítulo (papel rasgado)
              </label>
              <TextInput
                id="mcp-test-sub"
                type="text"
                value={testSubtitle}
                onChange={(e) => setTestSubtitle(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <SelectField
                  aria-label="Moldura cromada do teste"
                  value={testChromeFrame}
                  onChange={(e) => setTestChromeFrame(e.target.value as ChromeFrameStyle)}
                  className="w-auto"
                >
                  <option value="none">Sem moldura</option>
                  <option value="chrome-solid">Borda sólida</option>
                  <option value="chrome-bevel">Dupla Bevel</option>
                  <option value="chrome-dither">Dither Y2K</option>
                  <option value="chrome-chain">Corrente 3D</option>
                </SelectField>

                <div className="inline-flex items-center gap-2">
                  <Switch
                    id="mcp-test-turbo"
                    checked={testTurbo}
                    onChange={setTestTurbo}
                    ariaLabel="Ativar Turbo Clickbait no teste"
                  />
                  <label
                    htmlFor="mcp-test-turbo"
                    className="text-xs text-[var(--text-secondary)] cursor-pointer"
                  >
                    Turbo Clickbait
                  </label>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => void handleTestRender()}
                disabled={isTesting}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Renderizando...' : 'Gerar via servidor'}</span>
              </Button>
            </div>
          </section>
        </div>

        {/* Live Agent Generations Feed */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              Thumbnails geradas pelo servidor MCP ({generations.length})
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              Atualiza automaticamente quando um agente chama generate_thumbnail
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-10 text-center text-[13px] text-[var(--text-muted)]">
              Carregando histórico do servidor MCP...
            </div>
          ) : generations.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-panel)]/70 p-10 text-center space-y-1.5">
              <p className="text-[13px] text-[var(--text-primary)] font-medium">
                Nenhuma thumbnail gerada via MCP nesta sessão ainda.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Conecte um agente ao endpoint /mcp ou clique em &ldquo;Gerar via servidor&rdquo;
                acima para testar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {generations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-panel)] overflow-hidden flex flex-col transition-colors duration-150"
                >
                  <div className="aspect-video bg-[var(--bg-app)] overflow-hidden flex items-center justify-center border-b border-[var(--border-subtle)]">
                    <img
                      src={item.previewDataUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums mt-0.5">
                          {item.width}×{item.height} · {item.format.toUpperCase()} {item.scale}x ·{' '}
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shrink-0">
                        {item.source === 'mcp' ? 'MCP' : 'API'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => onLoadConfigToStudio(item.config)}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir no estúdio</span>
                      </Button>

                      <Tooltip content="Baixar arquivo">
                        <a
                          href={`${item.imageUrl}?download=1`}
                          aria-label="Baixar arquivo"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Tooltip>

                      <Tooltip content="Remover">
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => void handleDeleteGeneration(item.id)}
                          aria-label="Remover geração"
                          className="hover:text-rose-400 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
