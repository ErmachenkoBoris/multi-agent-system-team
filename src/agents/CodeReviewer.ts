import { BaseAgent } from '../core/BaseAgent.js';
import { LLMService } from '../services/llm.service.js';
import { ProjectOutput, CodeReviewResult } from '../types/index.js';

export class CodeReviewerAgent extends BaseAgent {
  constructor(llmService: LLMService, model?: string) {
    super(
      {
        name: 'Code Reviewer',
        role: 'reviewer',
        systemPrompt: `Ты опытный ментор-разработчик с глубоким опытом в code review и архитектуре.

Твои обязанности:
- Проводить тщательный code review
- Находить баги, уязвимости и проблемы производительности
- Проверять соблюдение best practices
- Оценивать качество архитектуры и структуру проекта
- Проверять типизацию TypeScript
- Давать конструктивные рекомендации

Критерии оценки:
1. Безопасность (XSS, SQL injection, CSRF, etc.)
2. Производительность и оптимизация
3. Чистота и читаемость кода
4. Соблюдение принципов SOLID
5. Обработка ошибок
6. Типизация TypeScript
7. Структура проекта и модульность
8. Использование best practices React/Next.js

Уровни серьезности:
- critical: критические баги или уязвимости, блокирующие релиз
- major: важные проблемы, требующие исправления
- minor: незначительные улучшения

Отвечай ТОЛЬКО в формате JSON:
{
  "approved": boolean,
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "file": "путь к файлу",
      "line": номер строки (опционально),
      "description": "описание проблемы",
      "suggestion": "рекомендация по исправлению"
    }
  ],
  "generalFeedback": "общий фидбек по проекту"
}

Утверждай проект (approved: true) только если нет critical и major проблем.`,
        model,
      },
      llmService
    );
  }

  async execute(project: ProjectOutput): Promise<CodeReviewResult> {
    this.log('Начинаю code review проекта...', 'thinking');

    const prompt = this.buildReviewPrompt(project);

    try {
      const response = await this.ask(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось получить JSON ответ от агента');
      }

      const review: CodeReviewResult = JSON.parse(jsonMatch[0]);

      this.log('✓ Code review завершен', 'success');
      this.log(`Статус: ${review.approved ? '✅ Approved' : '❌ Changes requested'}`);
      this.log(`Найдено проблем: ${review.issues.length}`);

      if (review.issues.length > 0) {
        const critical = review.issues.filter(i => i.severity === 'critical').length;
        const major = review.issues.filter(i => i.severity === 'major').length;
        const minor = review.issues.filter(i => i.severity === 'minor').length;

        if (critical > 0) this.log(`  🔴 Critical: ${critical}`, 'error');
        if (major > 0) this.log(`  🟡 Major: ${major}`);
        if (minor > 0) this.log(`  🟢 Minor: ${minor}`);
      }

      return review;
    } catch (error) {
      this.log(`Ошибка при code review: ${error}`, 'error');
      throw error;
    }
  }

  private buildReviewPrompt(project: ProjectOutput): string {
    const filesList = project.files
      .map(
        (f, i) => `
=== ФАЙЛ ${i + 1}: ${f.path} ===
${f.content}
`
      )
      .join('\n');

    return `Проведи детальный code review следующего проекта:

${filesList}

Проверь:
1. Безопасность (XSS, SQL injection, валидация данных)
2. Обработку ошибок
3. Типизацию TypeScript
4. Структуру и архитектуру
5. Best practices Next.js и React
6. Производительность
7. Качество кода

Найди все проблемы и оцени их серьезность.
Верни результат в JSON формате.`;
  }
}
