import chalk from 'chalk';
import { AgentMessage, AgentRole } from '../types/index.js';

export class CommunicationLogger {
  private messages: AgentMessage[] = [];

  log(message: AgentMessage): void {
    this.messages.push(message);
    this.printMessage(message);
  }

  private printMessage(message: AgentMessage): void {
    const timestamp = message.timestamp.toLocaleTimeString();
    const fromColor = this.getRoleColor(message.from);
    const toColor = message.to === 'all' ? chalk.white : this.getRoleColor(message.to as AgentRole);

    const typeIcon = this.getTypeIcon(message.type);
    const arrow = chalk.gray('→');

    console.log('\n' + chalk.gray('─'.repeat(80)));
    console.log(
      `${chalk.gray(`[${timestamp}]`)} ${typeIcon} ${fromColor(this.getRoleName(message.from))} ${arrow} ${toColor(message.to === 'all' ? 'ALL' : this.getRoleName(message.to as AgentRole))}`
    );
    console.log(chalk.gray('─'.repeat(80)));
    console.log(this.formatContent(message.content));
  }

  private getRoleColor(role: AgentRole) {
    const colors: Record<AgentRole, typeof chalk.blue> = {
      product_manager: chalk.blue,
      designer: chalk.magenta,
      developer: chalk.cyan,
      reviewer: chalk.yellow,
      tester: chalk.green,
      manager: chalk.red,
    };
    return colors[role] || chalk.white;
  }

  private getRoleName(role: AgentRole): string {
    const names: Record<AgentRole, string> = {
      product_manager: 'Product Manager',
      designer: 'Designer',
      developer: 'Developer',
      reviewer: 'Code Reviewer',
      tester: 'QA Tester',
      manager: 'Project Manager',
    };
    return names[role] || role;
  }

  private getTypeIcon(type: AgentMessage['type']): string {
    const icons = {
      request: '📋',
      response: '💬',
      feedback: '🔍',
      approval: '✅',
      revision: '🔄',
    };
    return icons[type] || '📌';
  }

  private formatContent(content: string): string {
    const maxLength = 500;
    if (content.length > maxLength) {
      return chalk.white(content.substring(0, maxLength) + chalk.gray('... (truncated)'));
    }
    return chalk.white(content);
  }

  printSummary(): void {
    console.log('\n' + chalk.bold.cyan('='.repeat(80)));
    console.log(chalk.bold.cyan('📊 Статистика коммуникаций'));
    console.log(chalk.bold.cyan('='.repeat(80)));

    const stats = this.calculateStats();

    console.log(chalk.white(`Всего сообщений: ${chalk.bold(stats.total)}`));
    console.log(chalk.white(`По типам:`));
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(chalk.gray(`  - ${type}: ${count}`));
    });

    console.log(chalk.white(`\nПо агентам:`));
    Object.entries(stats.byAgent).forEach(([agent, count]) => {
      const color = this.getRoleColor(agent as AgentRole);
      console.log(color(`  - ${this.getRoleName(agent as AgentRole)}: ${count}`));
    });

    console.log(chalk.bold.cyan('='.repeat(80) + '\n'));
  }

  private calculateStats() {
    const byType: Record<string, number> = {};
    const byAgent: Record<string, number> = {};

    this.messages.forEach(msg => {
      byType[msg.type] = (byType[msg.type] || 0) + 1;
      byAgent[msg.from] = (byAgent[msg.from] || 0) + 1;
    });

    return {
      total: this.messages.length,
      byType,
      byAgent,
    };
  }

  getMessages(): AgentMessage[] {
    return [...this.messages];
  }
}
