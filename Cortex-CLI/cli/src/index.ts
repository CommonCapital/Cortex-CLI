import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { LLMProvider } from './llm/provider.js';
import { tools } from './tools/index.js';
import { db } from './db/index.js';
import { conversations, messages as dbMessages } from './db/schema.js';
import readline from 'readline';
import fs from 'fs/promises';
import inquirer from 'inquirer';

dotenv.config();

const program = new Command();

program
  .name('cortex')
  .description('Cortex-CLI: Your terminal-based AI coding agent')
  .version('1.0.0');

async function runAgent(messages: any[], llm: LLMProvider, conversationId: number) {
  let responding = true;
  
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
        const tool = tools.find(t => t.name === toolCall.function.name);
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
    ]);

    const envContent = `LLM_BASE_URL=${answers.baseUrl}
LLM_MODEL=${answers.model}
LLM_API_KEY=${answers.apiKey}
DATABASE_URL=${answers.dbUrl}
MEMORY_DB_URL=${answers.memoryDbUrl}
`;

    await fs.writeFile('.env', envContent);
    console.log(chalk.green('\nConfiguration saved to .env'));
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
