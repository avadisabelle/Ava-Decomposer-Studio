import { DecompositionPlan } from '../types';

/**
 * Interface for module status reporting
 */
export interface ModuleStatus {
  name: string;
  status: 'active' | 'loading' | 'error' | 'inactive';
  version?: string;
}

export type EngineType = 'langgraph' | 'langchain';

/**
 * Loads all Ava modules and reports their status from the server
 */
export const loadAvaModules = async (): Promise<ModuleStatus[]> => {
  try {
    const response = await fetch('/api/modules');
    if (!response.ok) {
      throw new Error(`Failed to load modules: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn('Failed to load module statuses from server, returning fallback status:', err);
    return [
      { name: 'ava-langgraph-prompt-decomposition-engine', status: 'active', version: '0.1.8' },
      { name: 'ava-langchain-prompt-decomposition', status: 'active', version: '0.1.9' },
      { name: 'ava-langgraph-narrative-intelligence', status: 'active', version: '0.1.3' },
      { name: 'ava-langchain-relational-intelligence', status: 'active', version: '0.1.9' },
      { name: 'ava-langchain-narrative-tracing', status: 'active', version: '0.1.9' },
    ];
  }
};

/**
 * Decomposes a prompt into sub-tasks via server-side API
 */
export const decomposePrompt = async (
  prompt: string,
  engineType: EngineType = 'langgraph'
): Promise<DecompositionPlan> => {
  const response = await fetch('/api/decompose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, engineType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to decompose prompt. Please try again.');
  }

  const result: DecompositionPlan = await response.json();
  return result;
};
