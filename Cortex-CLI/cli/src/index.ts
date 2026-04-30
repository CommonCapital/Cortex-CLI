#!/usr/bin/env node
import './config.js';
import { Command } from 'commander';
import chalk from 'chalk';
import { LLMProvider } from './llm/provider.js';
import { getTools } from './tools/index.js';
import { db } from './db/index.js';
import { conversations, messages as dbMessages } from './db/schema.js';
import readline from 'readline';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const program = new Command();

program
  .name('cortex')
  .description('Cortex-CLI: Your terminal-based AI coding agent')
  .version('1.0.0');

async function runAgent(messages: any[], llm: LLMProvider, conversationId: number) {
  let responding = true;
  const tools = getTools(llm);
  
  while (responding) {
    const response = await llm.chat(messages, tools);
    messages.push(response);

    // Save assistant message
    await db.insert(dbMessages).values({
      conversationId,
      role: 'assistant',
      content: response.content || '',
      toolCalls: response.tool_calls,
    });

    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls as any[]) {
        const tool = tools.find((t: any) => t.name === toolCall.function.name);
        if (tool) {
          console.log(chalk.yellow(`\n[Tool Call] ${tool.name}(${toolCall.function.arguments})`));
          const args = JSON.parse(toolCall.function.arguments);
          const result = await tool.execute(args);
          console.log(chalk.cyan(`[Tool Result] ${result.slice(0, 100)}${result.length > 100 ? '...' : ''}`));
          
          const toolMessage = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          };
          messages.push(toolMessage);

          // Save tool result
          await db.insert(dbMessages).values({
            conversationId,
            role: 'tool',
            content: result,
            toolResult: result,
          });
        }
      }
    } else {
      console.log(chalk.magenta('\nCortex > ') + response.content);
      responding = false;
    }
  }
}

program
  .command('configure')
  .description('Configure LLM and Database settings')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'LLM Base URL:',
        default: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      },
      {
        type: 'input',
        name: 'model',
        message: 'LLM Model:',
        default: process.env.LLM_MODEL || 'gpt-4o',
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'LLM API Key:',
        default: process.env.LLM_API_KEY,
      },
      {
        type: 'input',
        name: 'dbUrl',
        message: 'Database URL:',
        default: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cortex',
      },
      {
        type: 'input',
        name: 'memoryDbUrl',
        message: 'GraphMemory Database URL:',
        default: process.env.MEMORY_DB_URL || 'postgresql://postgres:password@localhost:5432/memoryos',
      },
      {
        type: 'input',
        name: 'projectPath',
        message: 'Cortex-CLI Root Path:',
        default: process.env.PROJECT_PATH || path.join(os.homedir(), 'Documents/Cortex-CLI/Cortex-CLI'),
      },
      {
        type: 'input',
        name: 'memoryPath',
        message: 'GraphMemory Root Path:',
        default: process.env.MEMORY_PATH || path.join(os.homedir(), 'Documents/Cortex-CLI/GraphMemory'),
      },
    ]);

    const envContent = `LLM_BASE_URL=${answers.baseUrl}
LLM_MODEL=${answers.model}
LLM_API_KEY=${answers.apiKey}
DATABASE_URL=${answers.dbUrl}
MEMORY_DB_URL=${answers.memoryDbUrl}
PROJECT_PATH=${answers.projectPath}
MEMORY_PATH=${answers.memoryPath}
`;

    await fs.writeFile('.env', envContent);
    
    // Also save to home directory for global access
    const homeDir = path.join(os.homedir(), '.cortex-cli');
    if (!existsSync(homeDir)) {
      await fs.mkdir(homeDir, { recursive: true });
    }
    await fs.writeFile(path.join(homeDir, '.env'), envContent);

    console.log(chalk.green(`\nConfiguration saved to .env and ${homeDir}/.env`));
  });

program
  .command('up')
  .description('Start all ecosystem services (Database, AI Service, Frontend)')
  .action(async () => {
    const memoryPath = process.env.MEMORY_PATH;
    if (!memoryPath) {
      console.log(chalk.red('Error: MEMORY_PATH is not configured. Run "cortex configure" first.'));
      return;
    }

    console.log(chalk.blue('🚀 Starting Cortex Ecosystem...'));

    // 1. Start Docker (Only if DB is local)
    const isLocalDb = process.env.DATABASE_URL?.includes('localhost') || 
                      process.env.MEMORY_DB_URL?.includes('localhost') ||
                      process.env.DATABASE_URL?.includes('127.0.0.1') ||
                      process.env.MEMORY_DB_URL?.includes('127.0.0.1');

    if (isLocalDb) {
      console.log(chalk.yellow('📦 Local DB detected. Starting Database (Docker)...'));
      
      try {
        await execAsync('docker-compose up -d', { cwd: memoryPath });
        console.log(chalk.green('✅ Local Database is running.'));
      } catch (err: any) {
        console.error(chalk.red(`❌ Docker failed: ${err.message}`));
      }
    } else {
      console.log(chalk.cyan('☁️  Cloud DB detected (Neon/Remote). Skipping Docker...'));
    }

    // 2. Start AI Service
    console.log(chalk.yellow('🤖 Starting AI Service (Python)...'));
    const aiServicePath = path.join(memoryPath, 'ai-service');
    const pythonPath = path.join(aiServicePath, 'venv', 'bin', 'python3');
    
    const aiProcess = exec(`${pythonPath} -m uvicorn main:app --port 8000`, { cwd: aiServicePath });
    aiProcess.stdout?.on('data', (data: any) => console.log(chalk.gray(`[AI Service] ${data}`)));
    
    // 3. Start Frontend
    console.log(chalk.yellow('🖥️ Starting MemoryOS Dashboard...'));
    const frontendPath = path.join(memoryPath, 'frontend');
    const feProcess = exec(`npm run dev`, { cwd: frontendPath });
    feProcess.stdout?.on('data', (data: any) => console.log(chalk.gray(`[Frontend] ${data}`)));

    console.log(chalk.green('\n✨ All services are starting in the background!'));
    console.log(chalk.cyan('   - AI Service: http://localhost:8000'));
    console.log(chalk.cyan('   - Dashboard:  http://localhost:3000\n'));
  });

program
  .command('chat')
  .description('Start an interactive chat session with Cortex')
  .option('-c, --conversation <id>', 'Resume a conversation by ID')
  .action(async (options) => {
    const config = {
      baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.LLM_MODEL || 'gpt-4o',
      apiKey: process.env.LLM_API_KEY || '',
    };

    const llm = new LLMProvider(config);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('You > '),
    });

    let conversationId: number;
    let messageHistory: any[] = [];

    if (options.conversation) {
      conversationId = parseInt(options.conversation);
      const pastMessages = await db.query.messages.findMany({
        where: (m, { eq }) => eq(m.conversationId, conversationId),
        orderBy: (m, { asc }) => [asc(m.createdAt)],
      });
      messageHistory = pastMessages.map(m => ({
        role: m.role,
        content: m.content,
        tool_calls: m.toolCalls,
      }));
      console.log(chalk.green(`Resumed conversation #${conversationId}`));
    } else {
      const newConv = await db.insert(conversations).values({ title: 'New Chat' }).returning();
      const firstConv = newConv[0];
      if (!firstConv) throw new Error('Failed to create a new conversation in the database.');
      conversationId = firstConv.id;
      messageHistory = [
        { role: 'system', content: 'You are Cortex, a powerful terminal-based AI coding agent. You help users with coding tasks, debugging, and project management. You have access to tools to read/write files and execute commands.' }
      ];
      console.log(chalk.green(`Started new conversation #${conversationId}`));
    }

    console.log(chalk.gray('Type "exit" or "quit" to end the session.\n'));

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        rl.close();
        return;
      }

      if (!input) {
        rl.prompt();
        return;
      }

      const userMessage = { role: 'user', content: input };
      messageHistory.push(userMessage);

      // Save user message
      await db.insert(dbMessages).values({
        conversationId,
        role: 'user',
        content: input,
      });

      try {
        await runAgent(messageHistory, llm, conversationId);
      } catch (error: any) {
        console.error(chalk.red(`\nError: ${error.message}`));
      }

      rl.prompt();
    }).on('close', () => {
      console.log(chalk.yellow('\nGoodbye!'));
      process.exit(0);
    });
  });

program.parse(process.argv);
