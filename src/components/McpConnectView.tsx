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

  // Quick test render state
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

  const handleDeleteGeneration = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/mcp/generations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGenerations((prev) => prev.filter((item) => item.id !== id));
      }
    },
    []
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0E12] px-6 py-7">
      <div className="max-w-[1320px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Servidor MCP para Agentes de IA
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Conecte agentes MCP via Streamable HTTP, SSE ou Stdio para gerar thumbnails com todos os recursos do estúdio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Endpoints & JSON Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-5 rounded-xl border border-white/10 bg-[#14161D] p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Terminal className="w-4 h-4 text-[#A78BFA]" />
              <span>Endpoints de Transporte</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">
                  Streamable HTTP (Recomendado)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-sky-300 font-mono">
                    {mcpUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText('mcp', mcpUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/[0.06] border border-white/10 text-slate-200 hover:bg-white/[0.12] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'mcp' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'mcp' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">
                  SSE Legado (/sse)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-slate-300 font-mono">
                    {sseUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText('sse', sseUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/[0.06] border border-white/10 text-slate-200 hover:bg-white/[0.12] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'sse' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'sse' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-400 mb-1">
                  Comando Stdio Local
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-violet-300 font-mono">
                    {stdioCmd}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText('stdio', stdioCmd)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white/[0.06] border border-white/10 text-slate-200 hover:bg-white/[0.12] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'stdio' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'stdio' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 rounded-xl border border-white/10 bg-[#14161D] p-5 flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Layers className="w-4 h-4 text-[#A78BFA]" />
                <span>Configuração JSON para Cliente MCP</span>
              </div>
              <div className="flex items-center gap-1 bg-[#0D0E12] p-1 rounded-lg border border-white/10">
                {(
                  [
                    { id: 'http', label: 'HTTP / Cursor' },
                    { id: 'claude-remote', label: 'Claude (mcp-remote)' },
                    { id: 'stdio', label: 'Stdio Local' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSnippetTab(tab.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      snippetTab === tab.id
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="rounded-lg bg-[#0D0E12] border border-white/10 p-3.5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed">
                {snippetContent}
              </pre>
              <button
                type="button"
                onClick={() => copyText('snippet', snippetContent)}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md bg-white/[0.08] border border-white/10 text-slate-200 hover:bg-white/[0.14] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedKey === 'snippet' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedKey === 'snippet' ? 'Copiado' : 'Copiar JSON'}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Tools Catalog & Interactive Server Test */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-6 rounded-xl border border-white/10 bg-[#14161D] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tools & Resources Expostos
              </h2>
              <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                {info?.tools.length ?? 5} tools • 2 resources
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {(info?.tools ?? []).map((tool) => (
                <div key={tool.name} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="text-xs font-bold text-[#C4B5FD] font-mono">{tool.name}</div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tool.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex flex-wrap gap-3">
              <span className="font-mono text-sky-300">nullysh://studio/presets</span>
              <span className="font-mono text-sky-300">nullysh://studio/capabilities</span>
              <span className="font-mono text-amber-300">prompt: create_basefy_thumbnail</span>
            </div>
          </section>

          <section className="lg:col-span-6 rounded-xl border border-white/10 bg-[#14161D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Simular Chamada de Agente MCP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Título Chrome 3D
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Preset Base
                </label>
                <select
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
                  className="w-full rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="pack-ia">Pack de IA</option>
                  <option value="prompts">Prompts</option>
                  <option value="software-proprio">Software Próprio</option>
                  <option value="design-template">Design / Template</option>
                  <option value="estrategia">Estratégia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Subtítulo (Papel Rasgado)
              </label>
              <input
                type="text"
                value={testSubtitle}
                onChange={(e) => setTestSubtitle(e.target.value)}
                className="w-full rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <select
                  value={testChromeFrame}
                  onChange={(e) => setTestChromeFrame(e.target.value as ChromeFrameStyle)}
                  className="rounded-lg bg-[#0D0E12] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="none">Sem Moldura</option>
                  <option value="chrome-solid">Borda Sólida Cromada</option>
                  <option value="chrome-bevel">Borda Bevel + Rebites</option>
                  <option value="chrome-dither">Borda Dither Y2K</option>
                  <option value="chrome-chain">Borda Corrente 3D</option>
                </select>

                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testTurbo}
                    onChange={(e) => setTestTurbo(e.target.checked)}
                    className="accent-[#7C3AED] w-3.5 h-3.5"
                  />
                  <span>Turbo Clickbait</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleTestRender()}
                disabled={isTesting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Renderizando...' : 'Gerar via Servidor'}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Live Agent Generations Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Thumbnails Geradas pelo Servidor MCP ({generations.length})
            </h2>
            <span className="text-xs text-slate-400">
              Atualiza automaticamente quando um agente chama generate_thumbnail
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-[#14161D] p-10 text-center text-sm text-slate-400">
              Carregando histórico do servidor MCP...
            </div>
          ) : generations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-[#14161D]/60 p-10 text-center">
              <p className="text-sm text-slate-300 font-medium">
                Nenhuma thumbnail gerada via MCP nesta sessão ainda.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Conecte um agente de IA ao endpoint /mcp ou clique em &ldquo;Gerar via Servidor&rdquo; acima para testar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {generations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-[#14161D] overflow-hidden flex flex-col"
                >
                  <div className="aspect-video bg-[#0D0E12] overflow-hidden flex items-center justify-center border-b border-white/10">
                    <img
                      src={item.previewDataUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                        <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          {item.width}x{item.height} • {item.format.toUpperCase()} {item.scale}x •{' '}
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-white/[0.06] text-slate-300 shrink-0">
                        {item.source === 'mcp' ? 'MCP Agente' : 'Teste API'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onLoadConfigToStudio(item.config)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Carregar no Estúdio</span>
                      </button>

                      <a
                        href={`${item.imageUrl}?download=1`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] transition-colors shrink-0"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => void handleDeleteGeneration(item.id)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors shrink-0 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
