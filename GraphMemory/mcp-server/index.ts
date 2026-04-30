import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class MemoryOSServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'memoryos', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_notes',
          description: 'Search the knowledge base using both semantic vector search and graph-based memory. Returns relevant notes and concepts.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              top_k: { type: 'number' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_note',
          description: 'Get full note content by ID',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id']
          }
        },
        {
          name: 'create_note',
          description: 'Create a new note in the knowledge base',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            },
            required: ['title', 'content']
          }
        },
        {
          name: 'graph_query',
          description: 'Get entity subgraph',
          inputSchema: {
            type: 'object',
            properties: { entity: { type: 'string' }, hops: { type: 'number' } },
            required: ['entity']
          }
        },
        {
          name: 'ask_memory',
          description: 'Ask a question answered using the full hybrid memory system.',
          inputSchema: {
            type: 'object',
            properties: { question: { type: 'string' } },
            required: ['question']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search_notes': {
          const { query, top_k } = request.params.arguments as any;
          return { content: [{ type: 'text', text: `Search executed for ${query} (top ${top_k || 10})` }] };
        }
        case 'get_note': {
          const { id } = request.params.arguments as any;
          return { content: [{ type: 'text', text: `Note details for ${id}` }] };
        }
        case 'create_note': {
          const { title, content } = request.params.arguments as any;
          return { content: [{ type: 'text', text: `Note created: ${title}` }] };
        }
        case 'graph_query': {
          const { entity, hops } = request.params.arguments as any;
          return { content: [{ type: 'text', text: `Graph subgraph for ${entity} (hops ${hops || 2})` }] };
        }
        case 'ask_memory': {
          const { question } = request.params.arguments as any;
          return { content: [{ type: 'text', text: `Asked memory: ${question}` }] };
        }
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool not found`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MemoryOS MCP server running on stdio');
  }
}

const server = new MemoryOSServer();
server.run().catch(console.error);
