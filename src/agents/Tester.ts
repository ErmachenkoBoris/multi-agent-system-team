import { BaseAgent } from '../core/BaseAgent.js';
import { LLMService } from '../services/llm.service.js';
import { ProjectOutput, TestResult, ProductSpecification } from '../types/index.js';

interface TestInput {
  project: ProjectOutput;
  specification: ProductSpecification;
}

export class TesterAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    super(
      {
        name: 'QA Tester',
        role: 'tester',
        systemPrompt: `Ты опытный QA инженер с экспертизой в тестировании web приложений.

Твои обязанности:
- Анализировать код проекта на предмет тестируемости
- Проверять соответствие функциональным требованиям
- Создавать тест-кейсы для всех user stories
- Оценивать покрытие тестами
- Находить потенциальные баги и edge cases
- Давать рекомендации по улучшению качества

Области тестирования:
1. Функциональное тестирование (соответствие требованиям)
2. UI/UX тестирование
3. API тестирование
4. Валидация данных
5. Обработка ошибок
6. Edge cases и граничные условия
7. Безопасность
8. Производительность

Отвечай ТОЛЬКО в формате JSON:
{
  "passed": boolean,
  "coverage": число от 0 до 100 (опционально),
  "testCases": [
    {
      "name": "название тест-кейса",
      "status": "passed" | "failed",
      "error": "описание ошибки если failed"
    }
  ],
  "recommendations": ["рекомендация 1", "рекомендация 2", ...]
}`,
      },
      llmService
    );
  }

  async execute(input: TestInput): Promise<TestResult> {
    this.log('Начинаю тестирование проекта...', 'thinking');

    const prompt = this.buildTestPrompt(input);

    try {
      const response = await this.ask(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось получить JSON ответ от агента');
      }

      const result: TestResult = JSON.parse(jsonMatch[0]);

      this.log('✓ Тестирование завершено', 'success');
      this.log(`Статус: ${result.passed ? '✅ Passed' : '❌ Failed'}`);
      this.log(`Тест-кейсов: ${result.testCases.length}`);

      const passed = result.testCases.filter(t => t.status === 'passed').length;
      const failed = result.testCases.filter(t => t.status === 'failed').length;

      this.log(`  ✅ Passed: ${passed}`, 'success');
      if (failed > 0) {
        this.log(`  ❌ Failed: ${failed}`, 'error');
      }

      if (result.coverage) {
        this.log(`Покрытие: ${result.coverage}%`);
      }

      return result;
    } catch (error) {
      this.log(`Ошибка при тестировании: ${error}`, 'error');
      throw error;
    }
  }

  private buildTestPrompt(input: TestInput): string {
    const filesList = input.project.files
      .map(f => `${f.path}:\n${f.content.substring(0, 1000)}...`)
      .join('\n\n');

    return `Протестируй следующий проект на соответствие требованиям:

=== ТРЕБОВАНИЯ ===
Проект: ${input.specification.projectName}

Функции:
${input.specification.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

User Stories:
${input.specification.userStories.map((s, i) => `${i + 1}. ${s}`).join('\n')}

=== КОД ПРОЕКТА ===
${filesList}

=== ЗАДАЧИ ===
1. Создай тест-кейсы для всех функций и user stories
2. Проанализируй код и определи статус каждого тест-кейса (passed/failed)
3. Найди потенциальные баги и edge cases
4. Оцени покрытие тестами (%)
5. Дай рекомендации по улучшению

Верни результат в JSON формате.`;
  }
}
