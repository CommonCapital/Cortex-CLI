import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export class LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
    });
    this.model = config.model;
  }

  async chat(messages: any[], tools?: any[]) {
    const body: any = {
      model: this.model,
      messages,
    };
    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }
    const response = await this.client.chat.completions.create(body);
    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('No message returned from LLM');
    }
    return message;
  }

  async streamChat(messages: any[], tools?: any[]) {
    const body: any = {
      model: this.model,
      messages,
      stream: true,
    };
    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }
    return this.client.chat.completions.create(body);
  }
}
