import React from 'react';
import { ExecutionResult, TaskStatus, DecompositionTask } from '../types';
import { Terminal, Check, X, Loader2, Download } from 'lucide-react';
import { downloadFile, generateSafeFilename } from '../utils/exportUtils';

interface ExecutionLogProps {
  results: Record<string, ExecutionResult>;
  tasks: DecompositionTask[];
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ results, tasks }) => {
  // Sort results by completion time or ID order
  const completedTasks = tasks.filter(t => results[t.id]);

  if (completedTasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
        <Terminal className="w-12 h-12 mb-4 opacity-20" />
        <p>Execution output will appear here...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-2 mb-6">
        <h2 className="text-xl font-semibold text-white">Execution Output</h2>
      </div>
      
      {completedTasks.map(task => {
        const result = results[task.id];
        if (!result) return null;

        return (
          <div key={task.id} className="group border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50 hover:bg-gray-900 transition-colors">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/30 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-500">ID: {task.id}</span>
                <span className="text-sm font-medium text-gray-300">{task.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {result.status === TaskStatus.COMPLETED && result.output && (
                  <button
                    onClick={() => {
                      const filename = generateSafeFilename(task.title, 'txt');
                      downloadFile(result.output || '', filename, 'text/plain');
                    }}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                    title="Download Output"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                {result.status === TaskStatus.RUNNING && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                {result.status === TaskStatus.COMPLETED && <Check className="w-4 h-4 text-green-400" />}
                {result.status === TaskStatus.FAILED && <X className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            
            <div className="p-4 overflow-x-auto">
              {result.status === TaskStatus.RUNNING ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                </div>
              ) : (
                <pre className="text-sm font-mono text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {result.output || result.error || "No output."}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
