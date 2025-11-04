import fs from 'fs/promises';
import path from 'path';
import { ProjectOutput } from '../types/index.js';

export class FileSystemHelper {
  static async createProject(
    projectName: string,
    output: ProjectOutput,
    baseDir: string = './generated-projects'
  ): Promise<string> {
    const projectPath = path.join(baseDir, projectName);

    // Валидация: проверяем наличие обязательных файлов
    this.validateProjectStructure(output);

    await fs.mkdir(projectPath, { recursive: true });

    for (const file of output.files) {
      const filePath = path.join(projectPath, file.path);
      const fileDir = path.dirname(filePath);

      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    await fs.writeFile(
      path.join(projectPath, 'README.md'),
      output.documentation,
      'utf-8'
    );

    await fs.writeFile(
      path.join(projectPath, 'SETUP.md'),
      output.setupInstructions,
      'utf-8'
    );

    return projectPath;
  }

  private static validateProjectStructure(output: ProjectOutput): void {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'prisma/schema.prisma',
      '.env.example',
    ];

    const requiredPatterns = [
      /^app\/layout\.tsx$/,
      /^app\/page\.tsx$/,
      /^app\/globals\.css$/,
      /^app\/api\/.+\/route\.ts$/,
      /^components\/.+\.tsx$/,
      /^lib\/.+\.ts$/,
    ];

    const filePaths = output.files.map((f) => f.path);

    // Проверяем обязательные файлы
    const missingFiles = requiredFiles.filter(
      (file) => !filePaths.includes(file)
    );

    if (missingFiles.length > 0) {
      throw new Error(
        `⚠️ Отсутствуют обязательные файлы: ${missingFiles.join(', ')}\n` +
          `LLM сгенерировал только ${output.files.length} файлов. Требуется минимум 15 файлов.`
      );
    }

    // Проверяем паттерны (должны быть компоненты, API routes, etc.)
    const missingPatterns = requiredPatterns.filter(
      (pattern) => !filePaths.some((path) => pattern.test(path))
    );

    if (missingPatterns.length > 0) {
      console.warn(
        `⚠️ Внимание: Не найдены файлы по некоторым паттернам. Проект может быть неполным.`
      );
    }

    // Проверяем минимальное количество файлов
    if (output.files.length < 15) {
      throw new Error(
        `⚠️ Недостаточно файлов в проекте: ${output.files.length}/15+\n` +
          `LLM должен создать полноценный проект с app/, components/, lib/, api/ и конфигурацией.`
      );
    }

    // Проверяем package.json на "latest"
    const packageJson = output.files.find((f) => f.path === 'package.json');
    if (packageJson && packageJson.content.includes('"latest"')) {
      throw new Error(
        `⚠️ Ошибка в package.json: используется "latest" вместо конкретных версий!\n` +
          `Все зависимости должны иметь конкретные версии (например, "14.2.5" вместо "latest").`
      );
    }
  }

  static async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async listFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(path.relative(dirPath, fullPath));
        }
      }
    }

    await scan(dirPath);
    return files;
  }
}
