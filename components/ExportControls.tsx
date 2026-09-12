import React from 'react';
import { FileText, FileCode } from 'lucide-react';
import { DecompositionPlan, ExecutionResult } from '../types';
import { formatPlanToMarkdown, formatPlanToJSON, generateSafeFilename, downloadFile } from '../utils/exportUtils';

interface ExportControlsProps {
  plan: DecompositionPlan | null;
  executionResults: Record<string, ExecutionResult>;
  prompt: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ plan, executionResults, prompt }) => {
  const handleExportMarkdown = () => {
    if (!plan) return;
    const md = formatPlanToMarkdown(plan, executionResults);
    const filename = generateSafeFilename(prompt, 'md');
    downloadFile(md, filename, 'text/markdown');
  };

  const handleExportJSON = () => {
    if (!plan) return;
    const json = formatPlanToJSON(plan, executionResults, prompt);
    const filename = generateSafeFilename(prompt, 'json');
    downloadFile(json, filename, 'application/json');
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExportMarkdown}
        disabled={!plan}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as Markdown"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>MD</span>
      </button>
      <button
        onClick={handleExportJSON}
        disabled={!plan}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as JSON"
      >
        <FileCode className="w-3.5 h-3.5" />
        <span>JSON</span>
      </button>
    </div>
  );
};
