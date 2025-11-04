export type AgentRole =
  | 'product_manager'
  | 'designer'
  | 'developer'
  | 'reviewer'
  | 'tester'
  | 'manager';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentMessage {
  from: AgentRole;
  to: AgentRole | 'all';
  content: string;
  timestamp: Date;
  type: 'request' | 'response' | 'feedback' | 'approval' | 'revision';
}

export interface ProjectRequirements {
  idea: string;
  additionalRequirements?: string;
  techStack: TechStack;
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  orm: string;
}

export interface ProductSpecification {
  projectName: string;
  description: string;
  features: string[];
  userStories: string[];
  technicalRequirements: string[];
  businessGoals: string[];
}

export interface DesignSpecification {
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headings: string;
    body: string;
  };
  components: string[];
  layouts: {
    name: string;
    description: string;
  }[];
  wireframes: string;
}

export interface CodeReviewResult {
  approved: boolean;
  issues: {
    severity: 'critical' | 'major' | 'minor';
    file: string;
    line?: number;
    description: string;
    suggestion: string;
  }[];
  generalFeedback: string;
}

export interface TestResult {
  passed: boolean;
  coverage?: number;
  testCases: {
    name: string;
    status: 'passed' | 'failed';
    error?: string;
  }[];
  recommendations: string[];
}

export interface ProjectOutput {
  projectPath: string;
  files: {
    path: string;
    content: string;
  }[];
  documentation: string;
  setupInstructions: string;
}

export interface AgentConfig {
  name: string;
  role: AgentRole;
  systemPrompt: string;
  model?: string;
}

export interface WorkflowState {
  currentPhase: 'requirements' | 'design' | 'development' | 'review' | 'testing' | 'complete';
  requirements?: ProductSpecification;
  design?: DesignSpecification;
  codebase?: ProjectOutput;
  reviewResult?: CodeReviewResult;
  testResult?: TestResult;
  messages: AgentMessage[];
  revisionCount: number;
  maxRevisions: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
