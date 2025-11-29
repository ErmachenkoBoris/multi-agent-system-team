import { BaseAgent } from '../core/BaseAgent.js';
import { LLMService } from '../services/llm.service.js';
import {
  ProductSpecification,
  DesignSpecification,
  ProjectOutput,
  TechStack,
  CodeReviewResult,
} from '../types/index.js';

interface DevelopmentInput {
  specification: ProductSpecification;
  design: DesignSpecification;
  techStack: TechStack;
  reviewFeedback?: CodeReviewResult;
}

export class DeveloperAgent extends BaseAgent {
  constructor(llmService: LLMService, model?: string) {
    super(
      {
        name: 'Fullstack Developer',
        role: 'developer',
        systemPrompt: `Ты опытный Fullstack разработчик с экспертизой в современных технологиях.

Твои обязанности:
- Создавать полноценные fullstack приложения по спецификации
- Писать чистый, поддерживаемый код следуя best practices
- Использовать современные паттерны и архитектуру
- Создавать структуру проекта, конфигурацию и все необходимые файлы
- Интегрировать дизайн-систему в код
- Обрабатывать feedback от code reviewer и вносить исправления

Стек технологий:
- Next.js (App Router) для frontend и API routes
- TypeScript для типизации
- Prisma ORM для работы с SQLite
- Tailwind CSS для стилей
- React Server Components где возможно

Принципы:
- Следуй принципам SOLID и чистой архитектуры
- Используй модульную структуру
- Добавляй обработку ошибок и валидацию
- Пиши понятные комментарии для сложной логики
- Создавай responsive UI

КРИТИЧЕСКИ ВАЖНО - ФОРМАТ ОТВЕТА:
Твой ответ ДОЛЖЕН быть ТОЛЬКО валидным JSON объектом, без дополнительного текста до или после.
НЕ добавляй объяснения, комментарии или markdown форматирование.
Начинай ответ сразу с "{" и заканчивай "}".

Структура JSON:
{
  "files": [
    {
      "path": "относительный путь к файлу",
      "content": "полное содержимое файла"
    }
  ],
  "documentation": "README.md содержимое с описанием проекта",
  "setupInstructions": "детальные инструкции по установке и запуску"
}`,
        model,
      },
      llmService
    );
  }

  async execute(input: DevelopmentInput): Promise<ProjectOutput> {
    if (input.reviewFeedback) {
      return this.fixIssues(input);
    }

    this.log('Начинаю разработку проекта...', 'thinking');

    const prompt = this.buildDevelopmentPrompt(input);

    try {
      this.log('Генерирую структуру проекта и код...', 'thinking');
      const response = await this.ask(prompt);

      const output = this.parseOutput(response);

      this.log('✓ Проект успешно создан', 'success');
      this.log(`Файлов: ${output.files.length}`);

      return output;
    } catch (error) {
      this.log(`Ошибка при разработке: ${error}`, 'error');
      throw error;
    }
  }

  private async fixIssues(input: DevelopmentInput): Promise<ProjectOutput> {
    this.log('Исправляю замечания от code reviewer...', 'thinking');

    const issues = input.reviewFeedback!.issues
      .map(
        (issue, i) =>
          `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? `:${issue.line}` : ''}
   Проблема: ${issue.description}
   Рекомендация: ${issue.suggestion}`
      )
      .join('\n\n');

    const prompt = `Необходимо исправить следующие замечания от code review:

${issues}

ОБЩИЙ ФИДБЕК:
${input.reviewFeedback!.generalFeedback}

Исправь все замечания и верни обновленную версию проекта в том же JSON формате.
Убедись, что все критические и важные проблемы решены.`;

    try {
      const response = await this.ask(prompt);
      const output = this.parseOutput(response);

      this.log('✓ Замечания исправлены', 'success');
      this.log(`Обновлено файлов: ${output.files.length}`);

      return output;
    } catch (error) {
      this.log(`Ошибка при исправлении: ${error}`, 'error');
      throw error;
    }
  }

  private buildDevelopmentPrompt(input: DevelopmentInput): string {
    return `Создай ПОЛНОЦЕННЫЙ работающий fullstack проект со следующими параметрами:

=== СПЕЦИФИКАЦИЯ ПРОДУКТА ===
Проект: ${input.specification.projectName}
Описание: ${input.specification.description}

Основные функции:
${input.specification.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

User Stories:
${input.specification.userStories.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Технические требования:
${input.specification.technicalRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

=== ДИЗАЙН-СИСТЕМА ===
Цветовая схема:
- Primary: ${input.design.colorScheme.primary}
- Secondary: ${input.design.colorScheme.secondary}
- Accent: ${input.design.colorScheme.accent}

Типографика:
- Заголовки: ${input.design.typography.headings}
- Основной текст: ${input.design.typography.body}

Компоненты: ${input.design.components.join(', ')}

Layouts:
${input.design.layouts.map((l, i) => `${i + 1}. ${l.name}: ${l.description}`).join('\n')}

Wireframes:
${input.design.wireframes}

=== ТЕХНОЛОГИЧЕСКИЙ СТЕК ===
- Frontend: ${input.techStack.frontend}
- Backend: ${input.techStack.backend}
- Database: ${input.techStack.database}
- ORM: ${input.techStack.orm}

=== КРИТИЧЕСКИ ВАЖНО ===
Это должен быть ПОЛНЫЙ, РАБОТАЮЩИЙ проект, готовый к запуску. Минимум 17+ файлов!

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:

1. package.json - используй ТОЛЬКО конкретные версии (НЕ "latest"):
{
  "name": "project-name",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@prisma/client": "^5.18.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "prisma": "^5.18.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41"
  }
}

ВАЖНО ПРО БАЗУ ДАННЫХ:
- Используй SQLite для локальной разработки (provider = "sqlite")
- В prisma/schema.prisma укажи: datasource db { provider = "sqlite", url = env("DATABASE_URL") }
- ОБЯЗАТЕЛЬНО создай файл .env (НЕ .env.example!) с содержимым: DATABASE_URL="file:./dev.db"
- Также создай .env.example для документации с тем же содержимым

2. ПОЛНАЯ структура Next.js App Router (минимум 18 файлов):

КОНФИГУРАЦИЯ (8 файлов):
- package.json
- tsconfig.json
- next.config.js
- tailwind.config.js
- postcss.config.js
- .env (с DATABASE_URL="file:./dev.db")
- .env.example (с DATABASE_URL="file:./dev.db")
- prisma/schema.prisma (с provider = "sqlite")

APP ROUTER (3+ файла):
- app/layout.tsx - root layout с metadata
- app/page.tsx - главная страница с полным функционалом
- app/globals.css - Tailwind + кастомные стили

API ROUTES (3+ файла):
- app/api/[resource]/route.ts - GET all, POST
- app/api/[resource]/[id]/route.ts - GET one, PUT, DELETE
(где [resource] = реальное название, например: todos, posts, tasks)

COMPONENTS (5+ файлов):
- components/Button.tsx
- components/Input.tsx
- components/Card.tsx
- components/[MainFeature]Form.tsx - форма создания/редактирования
- components/[MainFeature]List.tsx - список элементов

LIB (2+ файла):
- lib/prisma.ts - Prisma client singleton
- lib/types.ts - TypeScript интерфейсы

ПРИМЕР ПРАВИЛЬНОЙ СТРУКТУРЫ:
\`\`\`
project/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── prisma/
│   └── schema.prisma
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── todos/
│           ├── route.ts
│           └── [id]/
│               └── route.ts
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── TodoForm.tsx
│   └── TodoList.tsx
└── lib/
    ├── prisma.ts
    └── types.ts
\`\`\`

КОД ДОЛЖЕН БЫТЬ ПОЛНЫМ И РАБОЧИМ:
- Все импорты правильные
- TypeScript типы везде
- Prisma схема с полными моделями
- API routes с валидацией и обработкой ошибок
- Компоненты стилизованы Tailwind CSS
- Используй дизайн-систему (цвета из спецификации)
- React hooks (useState, useEffect) где нужно
- Обработка loading/error состояний

API Routes пример:
\`\`\`typescript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
\`\`\`

ВЕРНИ JSON:
{
  "files": [
    {"path": "package.json", "content": "полное содержимое"},
    {"path": "tsconfig.json", "content": "..."},
    {"path": "next.config.js", "content": "..."},
    {"path": "tailwind.config.js", "content": "..."},
    {"path": "postcss.config.js", "content": "..."},
    {"path": ".env", "content": "DATABASE_URL=\\"file:./dev.db\\""},
    {"path": ".env.example", "content": "DATABASE_URL=\\"file:./dev.db\\""},
    {"path": "prisma/schema.prisma", "content": "generator client { provider = \\"prisma-client-js\\" }\\n\\ndatasource db { provider = \\"sqlite\\" url = env(\\"DATABASE_URL\\") }\\n\\nmodel ..."},
    {"path": "app/layout.tsx", "content": "полный код"},
    {"path": "app/page.tsx", "content": "полный код с UI"},
    {"path": "app/globals.css", "content": "@tailwind base..."},
    {"path": "app/api/[resource]/route.ts", "content": "GET, POST handlers"},
    {"path": "app/api/[resource]/[id]/route.ts", "content": "GET, PUT, DELETE"},
    {"path": "components/Button.tsx", "content": "..."},
    {"path": "components/[Feature]Form.tsx", "content": "..."},
    {"path": "components/[Feature]List.tsx", "content": "..."},
    {"path": "lib/prisma.ts", "content": "..."},
    {"path": "lib/types.ts", "content": "..."}
  ],
  "documentation": "# Project\\n\\nПодробное описание...",
  "setupInstructions": "# Setup\\n\\n1. npm install\\n2. npx prisma migrate dev --name init\\n3. npm run dev"
}`;
  }

  private parseOutput(response: string): ProjectOutput {
    // Удаляем markdown code blocks если есть
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Ищем JSON объект с files массивом
    const jsonMatch = cleanResponse.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось получить JSON ответ от агента. Ответ должен содержать объект с полем "files".');
    }

    let jsonStr = jsonMatch[0];

    // Находим последнюю закрывающую скобку для "files" массива
    const filesStart = jsonStr.indexOf('"files"');
    if (filesStart === -1) {
      throw new Error('JSON не содержит поле "files"');
    }

    // Пытаемся найти корректное окончание JSON
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    let jsonEnd = -1;

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }

    if (jsonEnd > 0) {
      jsonStr = jsonStr.substring(0, jsonEnd);
    }

    try {
      const parsed = JSON.parse(jsonStr);

      return {
        projectPath: '',
        files: parsed.files || [],
        documentation: parsed.documentation || '',
        setupInstructions: parsed.setupInstructions || '',
      };
    } catch (error) {
      this.log(`Ошибка парсинга JSON: ${error}`, 'error');
      this.log(`Первые 500 символов ответа: ${response.substring(0, 500)}`, 'error');
      throw new Error(`Не удалось распарсить JSON ответ от агента: ${error}`);
    }
  }
}
