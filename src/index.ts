import dotenv from 'dotenv';

dotenv.config();

export { ProjectManager } from './core/ProjectManager.js';
export { BaseAgent } from './core/BaseAgent.js';

export { ProductManagerAgent } from './agents/ProductManager.js';
export { DesignerAgent } from './agents/Designer.js';
export { DeveloperAgent } from './agents/Developer.js';
export { CodeReviewerAgent } from './agents/CodeReviewer.js';

export { LLMService } from './services/llm.service.js';

export { CommunicationLogger } from './utils/logger.js';
export { FileSystemHelper } from './utils/fileSystem.js';

export { loadAgentModelConfig, getAgentModel } from './config/agentConfig.js';
export type { AgentModelConfig, AgentModelConfigMap } from './config/agentConfig.js';

export * from './types/index.js';
