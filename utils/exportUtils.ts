import { DecompositionPlan, ExecutionResult } from '../types';

export const formatDate = (date: Date): string => {
  const yy = date.getFullYear().toString().slice(-2);
  const MM = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const HH = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${yy}${MM}${dd}${HH}${mm}`;
};

export const generateSafeFilename = (title: string, ext: string): string => {
  const timestamp = formatDate(new Date());
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
  return `${timestamp}-${safeTitle}.${ext}`;
};

export const formatPlanToMarkdown = (plan: DecompositionPlan, results: Record<string, ExecutionResult>): string => {
  let md = `# ${plan.originalPrompt}\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;
  md += `## Reasoning\n${plan.reasoning}\n\n`;
  
  md += `## Tasks\n`;
  plan.tasks.forEach(task => {
    md += `### ${task.title} (${task.id})\n`;
    md += `**Description:** ${task.description}\n`;
    md += `**Type:** ${task.taskType}\n`;
    md += `**Complexity:** ${task.estimatedComplexity}\n`;
    if (task.dependencies.length > 0) {
      md += `**Dependencies:** ${task.dependencies.join(', ')}\n`;
    }
    
    const result = results[task.id];
    if (result && result.output) {
      md += `\n**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n`;
    } else if (result && result.error) {
      md += `\n**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n`;
    }
    md += `\n---\n\n`;
  });
  
  return md;
};

export const formatPlanToJSON = (plan: DecompositionPlan, results: Record<string, ExecutionResult>, prompt: string): string => {
  return JSON.stringify({
    prompt,
    timestamp: new Date().toISOString(),
    plan,
    results
  }, null, 2);
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

export const generateSessionTitle = (prompt: string): string => {
  return prompt.split(' ').slice(0, 5).join(' ') || 'Untitled Session';
};
