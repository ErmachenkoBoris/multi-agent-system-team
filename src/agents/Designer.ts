import { BaseAgent } from '../core/BaseAgent.js';
import { LLMService } from '../services/llm.service.js';
import { ProductSpecification, DesignSpecification } from '../types/index.js';

export class DesignerAgent extends BaseAgent {
  constructor(llmService: LLMService) {
    super(
      {
        name: 'UI/UX Designer',
        role: 'designer',
        systemPrompt: `Ты креативный UI/UX дизайнер с отличным чувством стиля и пониманием современных трендов.

Твои обязанности:
- Создавать дизайн-системы на основе спецификаций продукта
- Определять цветовую палитру, типографику и компоненты
- Проектировать layouts и wireframes
- Следовать принципам доступности и usability
- Учитывать responsive design

Твой дизайн должен быть:
- Современным и привлекательным
- Функциональным и intuitive
- Соответствовать best practices

Отвечай ТОЛЬКО в формате JSON со следующей структурой:
{
  "colorScheme": {
    "primary": "hex цвет",
    "secondary": "hex цвет",
    "accent": "hex цвет"
  },
  "typography": {
    "headings": "название шрифта",
    "body": "название шрифта"
  },
  "components": ["компонент 1", "компонент 2", ...],
  "layouts": [
    {
      "name": "название layout",
      "description": "описание структуры"
    }
  ],
  "wireframes": "детальное описание основных экранов и их структуры"
}`,
      },
      llmService
    );
  }

  async execute(specification: ProductSpecification): Promise<DesignSpecification> {
    this.log('Начинаю разработку дизайна...', 'thinking');

    const prompt = `На основе следующей спецификации продукта создай детальный дизайн:

ПРОЕКТ: ${specification.projectName}
ОПИСАНИЕ: ${specification.description}

ОСНОВНЫЕ ФУНКЦИИ:
${specification.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

USER STORIES:
${specification.userStories.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Создай полную дизайн-систему в формате JSON, включая:
- Цветовую схему (используй современные hex цвета)
- Типографику (подбери подходящие Google Fonts)
- Список всех необходимых UI компонентов
- Описание layouts для основных страниц
- Детальные wireframes с описанием структуры каждого экрана`;

    try {
      const response = await this.ask(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Не удалось получить JSON ответ от агента');
      }

      const design: DesignSpecification = JSON.parse(jsonMatch[0]);

      this.log('✓ Дизайн-система готова', 'success');
      this.log(`Цветовая схема: ${design.colorScheme.primary} / ${design.colorScheme.secondary}`);
      this.log(`Компонентов: ${design.components.length}`);
      this.log(`Layouts: ${design.layouts.length}`);

      return design;
    } catch (error) {
      this.log(`Ошибка при создании дизайна: ${error}`, 'error');
      throw error;
    }
  }
}
