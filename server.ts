import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  buildThumbnailConfigFromInput,
  createNullyshMcpServer,
  getStudioCapabilitiesPayload,
  MCP_TOOLS_CATALOG,
} from './server/mcpServer.js';
import {
  deleteGenerationById,
  getGenerationById,
  listGenerationsMeta,
  saveGeneration,
  toGenerationMeta,
} from './server/generationStore.js';
import { renderThumbnailNode } from './server/nodeCanvasRenderer.js';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

function resolveBaseUrl(req?: Request): string {
  if (req) {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(protoHeader)
      ? protoHeader[0]
      : protoHeader?.split(',')[0]?.trim() || req.protocol || 'http';
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    if (host) {
      return `${proto}://${host}`;
    }
  }
  return (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  // CORS for remote MCP clients & inspectors
  app.use((req, res, next) => {
    if (
      req.path === '/mcp' ||
      req.path === '/sse' ||
      req.path === '/messages' ||
      req.path.startsWith('/api/')
    ) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID'
      );
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  // Track active stateful MCP sessions
  const streamableSessions = new Map<
    string,
    { server: McpServer; transport: StreamableHTTPServerTransport; baseUrl: string }
  >();
  const sseSessions = new Map<
    string,
    { server: McpServer; transport: SSEServerTransport }
  >();

  // Streamable HTTP MCP Endpoint (recommended by MCP spec)
  app.all('/mcp', async (req: Request, res: Response) => {
    const reqBaseUrl = resolveBaseUrl(req);
    const sessionHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;

    try {
      if (sessionId) {
        const existing = streamableSessions.get(sessionId);
        if (!existing) {
          res.status(404).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Session not found or expired. Re-initialize MCP connection.',
            },
            id: null,
          });
          return;
        }
        existing.baseUrl = reqBaseUrl;
        await existing.transport.handleRequest(req, res, req.body);
        return;
      }

      if (req.method === 'POST' && isInitializeRequest(req.body)) {
        let currentBaseUrl = reqBaseUrl;
        const server = createNullyshMcpServer(() => currentBaseUrl);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSid) => {
            streamableSessions.set(newSid, {
              server,
              transport,
              baseUrl: currentBaseUrl,
            });
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            streamableSessions.delete(transport.sessionId);
          }
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // Stateless fallback for POST JSON-RPC calls without mcp-session-id
      if (req.method === 'POST') {
        const server = createNullyshMcpServer(() => reqBaseUrl);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        res.on('close', () => {
          void transport.close();
          void server.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Missing Mcp-Session-Id header or initialization payload.',
        },
        id: null,
      });
    } catch (error) {
      console.error('Error handling /mcp request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal MCP server error',
          },
          id: null,
        });
      }
    }
  });

  // Legacy SSE MCP Transport (/sse + /messages)
  app.get('/sse', async (req: Request, res: Response) => {
    const reqBaseUrl = resolveBaseUrl(req);
    const server = createNullyshMcpServer(() => reqBaseUrl);
    const transport = new SSEServerTransport('/messages', res);
    sseSessions.set(transport.sessionId, { server, transport });

    res.on('close', () => {
      sseSessions.delete(transport.sessionId);
      void server.close();
    });

    await server.connect(transport);
  });

  app.post('/messages', async (req: Request, res: Response) => {
    const sid = typeof req.query.sessionId === 'string' ? req.query.sessionId : '';
    const session = sseSessions.get(sid);
    if (!session) {
      res.status(404).json({ error: 'SSE session not found' });
      return;
    }
    await session.transport.handlePostMessage(req, res, req.body);
  });

  // Studio MCP Info & Gallery REST API
  app.get('/api/mcp/info', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    res.json({
      name: 'nullysh-thumbnail-studio',
      version: '1.0.0',
      transports: {
        streamableHttp: `${baseUrl}/mcp`,
        sse: `${baseUrl}/sse`,
        stdioCommand: 'npx tsx server/mcpStdio.ts',
      },
      tools: MCP_TOOLS_CATALOG,
      capabilities: getStudioCapabilitiesPayload(),
    });
  });

  app.get('/api/mcp/generations', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    res.json({ items: listGenerationsMeta(baseUrl) });
  });

  app.get('/api/mcp/generations/:id/image', (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const item = getGenerationById(id);
    if (!item) {
      res.status(404).json({ error: 'Thumbnail não encontrada' });
      return;
    }
    const ext = item.format === 'webp' ? 'webp' : 'png';
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    const slug =
      item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'nullysh-thumbnail';

    res.setHeader('Content-Type', item.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${slug}.${ext}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(item.buffer);
  });

  app.delete('/api/mcp/generations/:id', (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = deleteGenerationById(id);
    if (!deleted) {
      res.status(404).json({ error: 'Thumbnail não encontrada' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/mcp/test-render', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const body = req.body ?? {};
      const config = buildThumbnailConfigFromInput(body);
      const format = body.format === 'webp' ? 'webp' : 'png';
      const scale: 1 | 2 = body.scale === 1 ? 1 : 2;

      const rendered = await renderThumbnailNode(config, { format, scale });
      const saved = saveGeneration({
        title: config.title.replace(/\n/g, ' ').trim() || 'Thumbnail Nullysh',
        format,
        scale,
        mimeType: rendered.mimeType,
        width: rendered.width,
        height: rendered.height,
        source: 'api',
        buffer: rendered.buffer,
        previewDataUrl: rendered.previewDataUrl,
        config,
      });

      res.json({ item: toGenerationMeta(saved, baseUrl) });
    } catch (error) {
      console.error('Error in /api/mcp/test-render:', error);
      res.status(500).json({ error: 'Falha ao renderizar thumbnail no servidor' });
    }
  });

  // Frontend middleware (Vite in dev, dist/ in prod)
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nullysh Thumbnail Studio + MCP Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Nullysh server:', err);
  process.exit(1);
});
