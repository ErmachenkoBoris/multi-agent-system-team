import { AgentRole } from '../types/index.js';

export interface AgentModelConfig {
  model: string;
}

export type AgentModelConfigMap = Partial<Record<AgentRole, AgentModelConfig>>;

/**
 * Загружает конфигурацию моделей для каждого агента из переменных окружения
 * 
 * Поддерживаемые переменные:
 * - OPENROUTER_API_KEY - общий ключ для всех агентов
 * - DEFAULT_MODEL - общая модель (fallback для всех агентов)
 * - MODEL_PRODUCT_MANAGER - модель для Product Manager
 * - MODEL_DESIGNER - модель для Designer
 * - MODEL_DEVELOPER - модель для Developer
 * - MODEL_REVIEWER - модель для Code Reviewer
 */
export function loadAgentModelConfig(): AgentModelConfigMap {
  const defaultModel = process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo';

  const config: AgentModelConfigMap = {};

  // Product Manager
  config.product_manager = {
    model: process.env.MODEL_PRODUCT_MANAGER || defaultModel,
  };

  // Designer
  config.designer = {
    model: process.env.MODEL_DESIGNER || defaultModel,
  };

  // Developer
  config.developer = {
    model: process.env.MODEL_DEVELOPER || defaultModel,
  };

  // Reviewer
  config.reviewer = {
    model: process.env.MODEL_REVIEWER || defaultModel,
  };

  return config;
}

/**
 * Получает модель для конкретного агента
 */
export function getAgentModel(role: AgentRole, configMap: AgentModelConfigMap): string {
  const agentConfig = configMap[role];
  const defaultModel = process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo';

  return agentConfig?.model || defaultModel;
}

