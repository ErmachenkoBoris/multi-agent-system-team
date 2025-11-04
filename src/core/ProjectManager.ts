import { LLMService } from '../services/llm.service.js';
import { ProductManagerAgent } from '../agents/ProductManager.js';
import { DesignerAgent } from '../agents/Designer.js';
import { DeveloperAgent } from '../agents/Developer.js';
import { CodeReviewerAgent } from '../agents/CodeReviewer.js';
import { TesterAgent } from '../agents/Tester.js';
import { CommunicationLogger } from '../utils/logger.js';
import { FileSystemHelper } from '../utils/fileSystem.js';
import { ProjectRequirements, WorkflowState } from '../types/index.js';
import chalk from 'chalk';
import ora from 'ora';

export class ProjectManager {
  private llmService: LLMService;
  private logger: CommunicationLogger;

  private productManager: ProductManagerAgent;
  private designer: DesignerAgent;
  private developer: DeveloperAgent;
  private reviewer: CodeReviewerAgent;
  private tester: TesterAgent;

  private state: WorkflowState;
  private maxRevisions: number = 1; // Максимум одна доработка после первого review

  constructor() {
    this.llmService = new LLMService();
    this.logger = new CommunicationLogger();

    this.productManager = new ProductManagerAgent(this.llmService);
    this.designer = new DesignerAgent(this.llmService);
    this.developer = new DeveloperAgent(this.llmService);
    this.reviewer = new CodeReviewerAgent(this.llmService);
    this.tester = new TesterAgent(this.llmService);

    this.state = {
      currentPhase: 'requirements',
      messages: [],
      revisionCount: 0,
      maxRevisions: this.maxRevisions,
    };
  }

  async createProject(requirements: ProjectRequirements): Promise<string> {
    console.log(chalk.bold.cyan('\n🚀 Запуск мультиагентной системы разработки\n'));

    try {
      await this.gatherRequirements(requirements);
      await this.designPhase();
      await this.developmentPhase();
      await this.reviewPhase();
      await this.testingPhase();

      const projectPath = await this.finalizeProject();

      this.logger.printSummary();
      console.log(chalk.bold.green(`\n✅ Проект успешно создан: ${projectPath}\n`));

      return projectPath;
    } catch (error) {
      console.error(chalk.red(`\n❌ Ошибка: ${error}\n`));
      throw error;
    }
  }

  private async gatherRequirements(requirements: ProjectRequirements): Promise<void> {
    const spinner = ora('📋 Product Manager анализирует требования...').start();

    try {
      this.state.currentPhase = 'requirements';

      const message = this.createMessage(
        'product_manager',
        'all',
        `Начинаю анализ требований для проекта: ${requirements.idea}`,
        'request'
      );
      this.logger.log(message);

      this.state.requirements = await this.productManager.execute(requirements);

      spinner.succeed('✅ Спецификация продукта готова');

      const response = this.createMessage(
        'product_manager',
        'manager',
        `Спецификация создана: ${this.state.requirements.projectName}`,
        'response'
      );
      this.logger.log(response);
    } catch (error) {
      spinner.fail('❌ Ошибка при создании спецификации');
      throw error;
    }
  }

  private async designPhase(): Promise<void> {
    const spinner = ora('🎨 Designer разрабатывает дизайн-систему...').start();

    try {
      this.state.currentPhase = 'design';

      const message = this.createMessage(
        'designer',
        'all',
        'Создаю дизайн-систему на основе спецификации',
        'request'
      );
      this.logger.log(message);

      this.state.design = await this.designer.execute(this.state.requirements!);

      spinner.succeed('✅ Дизайн-система готова');

      const response = this.createMessage(
        'designer',
        'manager',
        'Дизайн-система завершена',
        'response'
      );
      this.logger.log(response);
    } catch (error) {
      spinner.fail('❌ Ошибка при создании дизайна');
      throw error;
    }
  }

  private async developmentPhase(): Promise<void> {
    const spinner = ora('💻 Developer пишет код проекта...').start();

    try {
      this.state.currentPhase = 'development';

      const message = this.createMessage(
        'developer',
        'all',
        'Начинаю разработку проекта',
        'request'
      );
      this.logger.log(message);

      this.state.codebase = await this.developer.execute({
        specification: this.state.requirements!,
        design: this.state.design!,
        techStack: {
          frontend: 'Next.js',
          backend: 'Next.js API Routes',
          database: 'SQLite',
          orm: 'Prisma',
        },
      });

      spinner.succeed('✅ Код проекта создан');

      const response = this.createMessage(
        'developer',
        'manager',
        `Проект создан, файлов: ${this.state.codebase.files.length}`,
        'response'
      );
      this.logger.log(response);
    } catch (error) {
      spinner.fail('❌ Ошибка при разработке');
      throw error;
    }
  }

  private async reviewPhase(): Promise<void> {
    let attempts = 0;
    const maxAttempts = this.maxRevisions + 1; // +1 для первого review

    while (attempts < maxAttempts) {
      const spinner = ora(
        attempts === 0
          ? '🔍 Code Reviewer проверяет код...'
          : `🔍 Code Reviewer проверяет исправления (попытка ${attempts + 1}/${maxAttempts})...`
      ).start();

      try {
        this.state.currentPhase = 'review';

        const message = this.createMessage(
          'reviewer',
          'developer',
          attempts === 0 ? 'Провожу code review' : 'Проверяю внесенные исправления',
          'request'
        );
        this.logger.log(message);

        this.state.reviewResult = await this.reviewer.execute(this.state.codebase!);

        if (this.state.reviewResult.approved) {
          spinner.succeed('✅ Code review пройден');

          const approval = this.createMessage(
            'reviewer',
            'manager',
            'Код одобрен, замечаний нет',
            'approval'
          );
          this.logger.log(approval);
          break;
        } else {
          spinner.warn(
            `⚠️  Найдено проблем: ${this.state.reviewResult.issues.length} (попытка ${attempts + 1}/${maxAttempts})`
          );

          const feedback = this.createMessage(
            'reviewer',
            'developer',
            `Найдено проблем: ${this.state.reviewResult.issues.length}. Требуются исправления.`,
            'feedback'
          );
          this.logger.log(feedback);

          attempts++;

          if (attempts >= maxAttempts) {
            console.log(
              chalk.yellow(
                `\n⚠️  Достигнуто максимальное количество попыток (${maxAttempts}). Продолжаю с текущей версией.\n`
              )
            );
            break;
          }

          // Developer исправляет замечания
          const revisionSpinner = ora('🔄 Developer исправляет замечания...').start();

          const revisionMessage = this.createMessage(
            'developer',
            'reviewer',
            'Исправляю замечания',
            'revision'
          );
          this.logger.log(revisionMessage);

          this.state.revisionCount++;
          this.state.codebase = await this.developer.execute({
            specification: this.state.requirements!,
            design: this.state.design!,
            techStack: {
              frontend: 'Next.js',
              backend: 'Next.js API Routes',
              database: 'SQLite',
              orm: 'Prisma',
            },
            reviewFeedback: this.state.reviewResult,
          });

          revisionSpinner.succeed('✅ Исправления внесены, отправка на повторный review...');

          const revisionResponse = this.createMessage(
            'developer',
            'reviewer',
            'Замечания исправлены, готов к повторной проверке',
            'response'
          );
          this.logger.log(revisionResponse);

          // Цикл продолжится и код будет проверен снова
        }
      } catch (error) {
        spinner.fail('❌ Ошибка при code review');
        throw error;
      }
    }
  }

  private async testingPhase(): Promise<void> {
    const spinner = ora('🧪 Tester проводит тестирование...').start();

    try {
      this.state.currentPhase = 'testing';

      const message = this.createMessage(
        'tester',
        'all',
        'Начинаю тестирование проекта',
        'request'
      );
      this.logger.log(message);

      this.state.testResult = await this.tester.execute({
        project: this.state.codebase!,
        specification: this.state.requirements!,
      });

      if (this.state.testResult.passed) {
        spinner.succeed('✅ Все тесты пройдены');
      } else {
        spinner.warn('⚠️  Некоторые тесты не прошли');
      }

      const response = this.createMessage(
        'tester',
        'manager',
        `Тестирование завершено. Пройдено: ${this.state.testResult.testCases.filter(t => t.status === 'passed').length}/${this.state.testResult.testCases.length}`,
        'response'
      );
      this.logger.log(response);
    } catch (error) {
      spinner.fail('❌ Ошибка при тестировании');
      throw error;
    }
  }

  private async finalizeProject(): Promise<string> {
    const spinner = ora('📦 Сохранение проекта...').start();

    try {
      this.state.currentPhase = 'complete';

      const projectName = this.state.requirements!.projectName
        .toLowerCase()
        .replace(/\s+/g, '-');

      const projectPath = await FileSystemHelper.createProject(
        projectName,
        this.state.codebase!,
        process.env.OUTPUT_DIR || './generated-projects'
      );

      spinner.succeed(`✅ Проект сохранен: ${projectPath}`);

      return projectPath;
    } catch (error) {
      spinner.fail('❌ Ошибка при сохранении проекта');
      throw error;
    }
  }

  private createMessage(
    from: any,
    to: any,
    content: string,
    type: any
  ): any {
    return {
      from,
      to,
      content,
      timestamp: new Date(),
      type,
    };
  }
}
