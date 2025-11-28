#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { ProjectManager } from './core/ProjectManager.js';
import { ProjectRequirements } from './types/index.js';

dotenv.config();

const program = new Command();

program
  .name('multi-agent')
  .description('Мультиагентная система для автоматического создания проектов')
  .version('1.0.0');

program
  .command('create')
  .description('Создать новый проект')
  .option('-i, --idea <idea>', 'Идея проекта')
  .option('-r, --requirements <requirements>', 'Дополнительные требования')
  .action(async (options) => {
    try {
      console.clear();
      console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║     Multi-Agent System - Автоматизация разработки         ║'));
      console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

      let idea = options.idea;
      let additionalRequirements = options.requirements;

      if (!idea) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'idea',
            message: 'Опишите идею вашего проекта:',
            validate: (input) => {
              if (!input || input.trim().length === 0) {
                return 'Пожалуйста, введите идею проекта';
              }
              return true;
            },
          },
          {
            type: 'input',
            name: 'additionalRequirements',
            message: 'Дополнительные требования (опционально):',
          },
        ]);

        idea = answers.idea;
        additionalRequirements = answers.additionalRequirements;
      }

      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.white('💡 Идея:'), chalk.cyan(idea));
      if (additionalRequirements) {
        console.log(chalk.white('📋 Требования:'), chalk.cyan(additionalRequirements));
      }
      console.log(chalk.gray('─'.repeat(60) + '\n'));

      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Начать создание проекта?',
          default: true,
        },
      ]);

      if (!confirmAnswer.proceed) {
        console.log(chalk.yellow('\n❌ Отменено\n'));
        return;
      }

      const requirements: ProjectRequirements = {
        idea,
        additionalRequirements,
        techStack: {
          frontend: 'Next.js',
          backend: 'Next.js API Routes',
          database: 'PostgreSQL',
          orm: 'Prisma',
        },
      };

      const manager = new ProjectManager();
      const projectPath = await manager.createProject(requirements);

      console.log(chalk.bold.green('\n✨ Готово! Ваш проект создан!\n'));
      console.log(chalk.white('📁 Путь к проекту:'), chalk.cyan(projectPath));
      console.log(chalk.gray('\nДля начала работы:'));
      console.log(chalk.white(`  cd ${projectPath}`));
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm run dev\n'));
    } catch (error: any) {
      console.error(chalk.red('\n❌ Ошибка:'), error.message);
      console.error(chalk.gray('\nПроверьте:'));
      console.error(chalk.white('  - OPENROUTER_API_KEY установлен в .env (или индивидуальные ключи для агентов)'));
      console.error(chalk.white('  - Соединение с интернетом'));
      console.error(chalk.white('  - Запустите "npm run cli config" для проверки конфигурации\n'));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Проверить конфигурацию')
  .action(() => {
    console.log(chalk.bold.cyan('\n🔧 Конфигурация:\n'));

    const defaultApiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const defaultModel = process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo';
    const outputDir = process.env.OUTPUT_DIR || './generated-projects';

    console.log(chalk.bold.white('\n📋 Общие настройки:'));
    console.log(chalk.white('  API Key:'), defaultApiKey ? chalk.green('✓ Установлен') : chalk.red('✗ Не установлен'));
    console.log(chalk.white('  API URL:'), chalk.cyan(apiUrl));
    console.log(chalk.white('  Default Model:'), chalk.cyan(defaultModel));
    console.log(chalk.white('  Output Dir:'), chalk.cyan(outputDir));

    console.log(chalk.bold.white('\n🤖 Модели для агентов:'));
    
    const agents = [
      { name: 'Product Manager', model: 'MODEL_PRODUCT_MANAGER' },
      { name: 'Designer', model: 'MODEL_DESIGNER' },
      { name: 'Developer', model: 'MODEL_DEVELOPER' },
      { name: 'Code Reviewer', model: 'MODEL_REVIEWER' },
    ];

    agents.forEach((agent) => {
      const agentModel = process.env[agent.model];
      const usedModel = agentModel || defaultModel;
      const modelSource = agentModel ? chalk.gray('(своя модель)') : chalk.gray('(общая модель)');

      console.log(chalk.white(`\n  ${agent.name}:`));
      console.log(chalk.white(`    Model: ${chalk.cyan(usedModel)} ${modelSource}`));
    });

    if (!defaultApiKey) {
      console.log(chalk.yellow('\n⚠️  OPENROUTER_API_KEY не установлен!'));
      console.log(chalk.white('\nДля настройки добавьте в .env:'));
      console.log(chalk.gray('  OPENROUTER_API_KEY=sk-or-v1-ваш-ключ-здесь'));
      console.log(chalk.gray('\n  # Индивидуальные модели для каждого агента (опционально)'));
      console.log(chalk.gray('  MODEL_PRODUCT_MANAGER=openai/gpt-4-turbo'));
      console.log(chalk.gray('  MODEL_DESIGNER=openai/gpt-4-turbo'));
      console.log(chalk.gray('  MODEL_DEVELOPER=openai/gpt-4-turbo'));
      console.log(chalk.gray('  MODEL_REVIEWER=openai/gpt-4-turbo\n'));
    } else {
      console.log(chalk.green('\n✅ Конфигурация в порядке!\n'));
    }
  });

if (process.argv.length === 2) {
  program.outputHelp();
}

program.parse();
