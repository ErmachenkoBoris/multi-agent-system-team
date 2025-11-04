import { Message, LLMResponse } from '../types/index.js';

interface OpenRouterResponse {
  choices: Array<{
    message?: {
      content: string;
    };
    delta?: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private apiUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    this.defaultModel = process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo';

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY не установлен в .env файле');
    }
  }

  async chat(messages: Message[], model?: string): Promise<LLMResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/multi-agent-system',
          'X-Title': 'Multi-Agent System',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenRouterResponse;

      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`Ошибка при обращении к LLM: ${error}`);
    }
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void,
    model?: string
  ): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/multi-agent-system',
          'X-Title': 'Multi-Agent System',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Не удалось получить stream reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Игнорируем ошибки парсинга
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Ошибка при stream обращении к LLM: ${error}`);
    }
  }
}
