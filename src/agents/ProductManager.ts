import { BaseAgent } from '../core/BaseAgent.js';
import { LLMService } from '../services/llm.service.js';
import { ProjectRequirements, ProductSpecification } from '../types/index.js';

export class ProductManagerAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    super(
      {
        name: 'Product Manager',
        role: 'product_manager',
        systemPrompt: `Ты опытный Product Manager с глубоким пониманием бизнеса и технологий.

Твои обязанности:
- Анализировать идеи проектов и превращать их в детальные спецификации
- Определять ключевые функции и приоритеты
- Создавать user stories и acceptance criteria
- Формулировать бизнес-цели и метрики успеха
- Учитывать технические ограничения и стек технологий

Всегда создавай конкретные, измеримые и реализуемые требования.
Твой ответ должен быть структурированным и включать:
1. Название проекта
2. Описание проекта (что, для кого, зачем)
3. Список основных функций (features)
4. User stories в формате "Как [роль], я хочу [действие], чтобы [выгода]"
5. Технические требования
6. Бизнес-цели и KPI

Отвечай ТОЛЬКО в формате JSON со следующей структурой:
{
  "projectName": "название проекта",
  "description": "описание проекта",
  "features": ["функция 1", "функция 2", ...],
  "userStories": ["user story 1", "user story 2", ...],
  "technicalRequirements": ["требование 1", "требование 2", ...],
  "businessGoals": ["цель 1", "цель 2", ...]
}`,
      },
      llmService
    );
  }

  async execute(requirements: ProjectRequirements): Promise<ProductSpecification> {
    this.log('Начинаю анализ требований проекта...', 'thinking');

    const prompt = `Проанализируй следующую идею проекта и создай детальную спецификацию:

ИДЕЯ:
${requirements.idea}

${requirements.additionalRequirements ? `ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ:\n${requirements.additionalRequirements}` : ''}

ТЕХНИЧЕСКИЙ СТЕК:
- Frontend: ${requirements.techStack.frontend}
- Backend: ${requirements.techStack.backend}
- База данных: ${requirements.techStack.database}
- ORM: ${requirements.techStack.orm}

Создай полную спецификацию продукта в формате JSON.`;

    try {
      const response = await this.ask(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось получить JSON ответ от агента');
      }

      const specification: ProductSpecification = JSON.parse(jsonMatch[0]);

      this.log('✓ Спецификация продукта готова', 'success');
      this.log(`Проект: ${specification.projectName}`);
      this.log(`Функций: ${specification.features.length}`);
      this.log(`User Stories: ${specification.userStories.length}`);

      return specification;
    } catch (error) {
      this.log(`Ошибка при создании спецификации: ${error}`, 'error');
      throw error;
    }
  }
}
