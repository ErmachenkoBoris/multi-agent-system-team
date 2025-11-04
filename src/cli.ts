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
      console.error(chalk.white('  - OPENROUTER_API_KEY установлен в .env'));
      console.error(chalk.white('  - Соединение с интернетом\n'));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Проверить конфигурацию')
  .action(() => {
    console.log(chalk.bold.cyan('\n🔧 Конфигурация:\n'));

    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const model = process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo';
    const outputDir = process.env.OUTPUT_DIR || './generated-projects';

    console.log(chalk.white('API Key:'), apiKey ? chalk.green('✓ Установлен') : chalk.red('✗ Не установлен'));
    console.log(chalk.white('API URL:'), chalk.cyan(apiUrl));
    console.log(chalk.white('Model:'), chalk.cyan(model));
    console.log(chalk.white('Output Dir:'), chalk.cyan(outputDir));

    if (!apiKey) {
      console.log(chalk.yellow('\n⚠️  OPENROUTER_API_KEY не установлен!'));
      console.log(chalk.white('Создайте файл .env и добавьте:'));
      console.log(chalk.gray('  OPENROUTER_API_KEY=your_api_key_here\n'));
    } else {
      console.log(chalk.green('\n✅ Конфигурация в порядке!\n'));
    }
  });

if (process.argv.length === 2) {
  program.outputHelp();
}

program.parse();
