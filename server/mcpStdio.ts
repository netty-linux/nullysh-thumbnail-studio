import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createNullyshMcpServer } from './mcpServer.js';

async function main() {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const server = createNullyshMcpServer(() => baseUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nullysh Thumbnail Studio MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in Nullysh MCP stdio server:', error);
  process.exit(1);
});
