export type TaskType = 'research' | 'reasoning' | 'coding' | 'creative' | 'review';

export interface DecompositionTask {
  id: string;
  title: string;
  description: string;
  dependencies: string[]; // IDs of tasks that must complete first
  estimatedComplexity: 'Low' | 'Medium' | 'High';
  // v0.1.2 Enhanced Fields
  taskType: TaskType;
  recommendedTools?: string[]; // e.g., ["WebSearch", "Calculator", "VectorDB"]
  reasoningStrategy?: string; // Brief note on how this task contributes to the whole
}

export interface DecompositionPlan {
  originalPrompt: string;
  tasks: DecompositionTask[];
  reasoning: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ExecutionResult {
  taskId: string;
  status: TaskStatus;
  output?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface Session {
  id: string;
  timestamp: string;
  title: string;
  prompt: string;
  plan: DecompositionPlan | null;
  executionResults: Record<string, ExecutionResult>;
  selectedEngine: 'langgraph' | 'langchain';
  lastModified: number;
}
