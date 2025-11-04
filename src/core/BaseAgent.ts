import { LLMService } from '../services/llm.service.js';
import { AgentConfig, AgentRole, Message, AgentMessage } from '../types/index.js';
import chalk from 'chalk';

export abstract class BaseAgent {
  protected llmService: LLMService;
  protected config: AgentConfig;
  protected conversationHistory: Message[] = [];

  constructor(config: AgentConfig, llmService: LLMService) {
    this.config = config;
    this.llmService = llmService;
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    this.conversationHistory.push({
      role: 'system',
      content: this.config.systemPrompt,
    });
  }

  protected async ask(prompt: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: prompt,
    });

    const response = await this.llmService.chat(
      this.conversationHistory,
      this.config.model
    );

    this.conversationHistory.push({
      role: 'assistant',
      content: response.content,
    });

    return response.content;
  }

  protected async askStreaming(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: prompt,
    });

    let fullResponse = '';

    await this.llmService.streamChat(
      this.conversationHistory,
      (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      },
      this.config.model
    );

    this.conversationHistory.push({
      role: 'assistant',
      content: fullResponse,
    });

    return fullResponse;
  }

  protected log(message: string, type: 'info' | 'success' | 'error' | 'thinking' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const roleColor = this.getRoleColor();
    const prefix = `[${timestamp}] ${roleColor(this.config.name)}:`;

    switch (type) {
      case 'success':
        console.log(prefix, chalk.green(message));
        break;
      case 'error':
        console.log(prefix, chalk.red(message));
        break;
      case 'thinking':
        console.log(prefix, chalk.gray(message));
        break;
      default:
        console.log(prefix, chalk.white(message));
    }
  }

  private getRoleColor() {
    const colors: Record<AgentRole, typeof chalk.blue> = {
      product_manager: chalk.blue,
      designer: chalk.magenta,
      developer: chalk.cyan,
      reviewer: chalk.yellow,
      tester: chalk.green,
      manager: chalk.red,
    };
    return colors[this.config.role] || chalk.white;
  }

  protected createMessage(
    to: AgentRole | 'all',
    content: string,
    type: AgentMessage['type'] = 'request'
  ): AgentMessage {
    return {
      from: this.config.role,
      to,
      content,
      timestamp: new Date(),
      type,
    };
  }

  public getRole(): AgentRole {
    return this.config.role;
  }

  public getName(): string {
    return this.config.name;
  }

  abstract execute(input: any): Promise<any>;
}
