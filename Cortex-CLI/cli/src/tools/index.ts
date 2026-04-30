import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { hybridSearch, memorize } from '../services/memory.js';
import { LLMProvider } from '../llm/provider.js';

const execAsync = promisify(exec);

export const getTools = (llm: LLMProvider) => [
  {
    name: 'memorize',
    description: 'Analyze a file or text and save it into the long-term Knowledge Graph memory.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'A short descriptive title for this memory' },
        content: { type: 'string', description: 'The actual text or code to memorize' },
      },
      required: ['title', 'content'],
    },
    execute: async (args: { title: string, content: string }) => {
      try {
        const dbUrl = process.env.MEMORY_DB_URL;
        if (!dbUrl) return 'Error: MEMORY_DB_URL is not set';

        // 1. Use LLM to extract Graph entities
        const extractionPrompt = `
          Extract entities and relationships from the following text for a Knowledge Graph.
          Return ONLY valid JSON:
          {
            "nodes": [{ "label": "string", "type": "string", "properties": {} }],
            "edges": [{ "source": "string", "target": "string", "relation": "string", "direction": "out", "confidence": 1.0 }]
          }
          Text: ${args.content}
        `;
        
        const extractionResponse = await llm.chat([{ role: 'user', content: extractionPrompt }]);
        const cleanJson = extractionResponse.content?.replace(/```json|```/g, '').trim() || '{}';
        const graphData = JSON.parse(cleanJson);

        // 2. Memorize into DB
        const noteId = await memorize(args.title, args.content, graphData, dbUrl);
        return `Successfully memorized "${args.title}" (Note ID: ${noteId}) and extracted ${graphData.nodes?.length || 0} entities.`;
      } catch (error: any) {
        return `Error memorizing: ${error.message}`;
      }
    },
  },
  {
    name: 'query_memory',
    description: 'Query the GraphMemory knowledge base for long-term memory, concepts, and relationships.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query or question' },
      },
      required: ['query'],
    },
    execute: async (args: { query: string }) => {
      try {
        const dbUrl = process.env.MEMORY_DB_URL;
        if (!dbUrl) return 'Error: MEMORY_DB_URL is not set in .env';
        
        const results = await hybridSearch(args.query, dbUrl);
        if (results.length === 0) return 'No relevant memories found.';
        
        return results.map(r => `[Source: ${r.source}] ${r.title}: ${r.content}`).join('\n---\n');
      } catch (error: any) {
        return `Error querying memory: ${error.message}`;
      }
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path to the file' },
      },
      required: ['path'],
    },
    execute: async (args: { path: string }) => {
      try {
        const content = await fs.readFile(args.path, 'utf-8');
        return content;
      } catch (error: any) {
        return `Error reading file: ${error.message}`;
      }
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path to the file' },
        content: { type: 'string', description: 'The content to write' },
      },
      required: ['path', 'content'],
    },
    execute: async (args: { path: string; content: string }) => {
      try {
        await fs.mkdir(path.dirname(args.path), { recursive: true });
        await fs.writeFile(args.path, args.content, 'utf-8');
        return `Successfully wrote to ${args.path}`;
      } catch (error: any) {
        return `Error writing file: ${error.message}`;
      }
    },
  },
  {
    name: 'list_dir',
    description: 'List the contents of a directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path to the directory' },
      },
      required: ['path'],
    },
    execute: async (args: { path: string }) => {
      try {
        const files = await fs.readdir(args.path);
        return files.join('\n');
      } catch (error: any) {
        return `Error listing directory: ${error.message}`;
      }
    },
  },
  {
    name: 'execute_command',
    description: 'Execute a terminal command',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to execute' },
      },
      required: ['command'],
    },
    execute: async (args: { command: string }) => {
      try {
        const { stdout, stderr } = await execAsync(args.command);
        return stdout || stderr;
      } catch (error: any) {
        return `Error executing command: ${error.message}`;
      }
    },
  },
];
