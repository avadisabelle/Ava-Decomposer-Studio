import React from 'react';
import { DecompositionTask, TaskStatus, ExecutionResult, TaskType } from '../types';
import { 
  CheckCircle2, Circle, AlertCircle, ArrowDown, Cpu, 
  Search, Brain, Code, PenTool, ClipboardCheck, Wrench, Play
} from 'lucide-react';

interface PlanVisualizationProps {
  tasks: DecompositionTask[];
  executionResults: Record<string, ExecutionResult>;
  onExecuteTask: (taskId: string) => void;
}

const StatusIcon = ({ status }: { status?: TaskStatus }) => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case TaskStatus.RUNNING:
      return <Cpu className="w-5 h-5 text-blue-400 animate-spin" />;
    case TaskStatus.FAILED:
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-600" />;
  }
};

const TaskTypeIcon = ({ type }: { type: TaskType }) => {
  switch (type) {
    case 'research': return <Search className="w-3.5 h-3.5" />;
    case 'reasoning': return <Brain className="w-3.5 h-3.5" />;
    case 'coding': return <Code className="w-3.5 h-3.5" />;
    case 'creative': return <PenTool className="w-3.5 h-3.5" />;
    case 'review': return <ClipboardCheck className="w-3.5 h-3.5" />;
    default: return <Brain className="w-3.5 h-3.5" />;
  }
};

const TaskTypeBadge = ({ type }: { type: TaskType }) => {
  const colors = {
    research: 'text-sky-300 bg-sky-950/40 border-sky-800/50',
    reasoning: 'text-purple-300 bg-purple-950/40 border-purple-800/50',
    coding: 'text-amber-300 bg-amber-950/40 border-amber-800/50',
    creative: 'text-pink-300 bg-pink-950/40 border-pink-800/50',
    review: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50',
  };

  const style = colors[type] || colors.reasoning;

  return (
    <span className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${style} uppercase tracking-wider`}>
      <TaskTypeIcon type={type} />
      <span>{type}</span>
    </span>
  );
};

export const PlanVisualization: React.FC<PlanVisualizationProps> = ({ tasks, executionResults, onExecuteTask }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <h2 className="text-xl font-semibold text-white">Decomposition Plan <span className="text-gray-500 font-normal text-sm ml-2">v0.1.2</span></h2>
        <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 text-xs font-mono border border-blue-800">
          {tasks.length} Nodes
        </span>
      </div>

      <div className="relative">
        {tasks.map((task, index) => {
          const result = executionResults[task.id];
          const isLast = index === tasks.length - 1;
          const status = result?.status || TaskStatus.PENDING;
          
          // Check if dependencies are met
          const dependenciesMet = task.dependencies.every(depId => 
             executionResults[depId]?.status === TaskStatus.COMPLETED
          );
          
          const isRunning = status === TaskStatus.RUNNING;
          const isCompleted = status === TaskStatus.COMPLETED;

          return (
            <div key={task.id} className="relative pl-8 pb-8">
              {/* Connecting Line */}
              {!isLast && (
                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-800/60" />
              )}
              
              {/* Node Point */}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-gray-900 border-2 transition-colors duration-300 z-10 ${
                isCompleted ? 'border-green-500/50 bg-green-900/20' : 
                isRunning ? 'border-blue-500 bg-blue-900/20' : 
                'border-gray-700'
              }`}>
                <span className="text-[10px] font-mono text-gray-500">{index + 1}</span>
              </div>

              {/* Card */}
              <div className={`
                relative p-4 rounded-xl border transition-all duration-300 group
                ${isRunning ? 'bg-gray-800/80 border-blue-500/50 shadow-lg shadow-blue-500/10' : 
                  isCompleted ? 'bg-gray-800/50 border-green-500/30' : 
                  'bg-gray-900/60 border-gray-800 hover:border-gray-700'}
              `}>
                {/* Header Row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col space-y-2">
                     <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-200">{task.title}</h3>
                        <TaskTypeBadge type={task.taskType || 'reasoning'} />
                     </div>
                  </div>
                  
                  {/* Action or Status */}
                  <div className="flex items-center space-x-3">
                    {!isCompleted && !isRunning && (
                        <button
                            onClick={() => onExecuteTask(task.id)}
                            disabled={!dependenciesMet}
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-medium transition-all uppercase tracking-wide border
                                ${dependenciesMet 
                                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-500/50' 
                                    : 'bg-gray-800/50 text-gray-600 border-gray-800 cursor-not-allowed'}
                            `}
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Run
                        </button>
                    )}
                    <StatusIcon status={status} />
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-400 mb-3 leading-relaxed">{task.description}</p>
                
                {/* Meta Row */}
                <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-gray-800/50">
                   
                   {/* Tools */}
                   {task.recommendedTools && task.recommendedTools.length > 0 && (
                     <div className="flex items-center space-x-1.5">
                        <Wrench className="w-3 h-3 text-gray-500" />
                        {task.recommendedTools.map(tool => (
                            <span key={tool} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700">
                                {tool}
                            </span>
                        ))}
                     </div>
                   )}
                   
                   {/* Complexity */}
                   <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-auto ${
                      task.estimatedComplexity === 'High' ? 'text-orange-400 bg-orange-950/30' :
                      task.estimatedComplexity === 'Medium' ? 'text-yellow-400 bg-yellow-950/30' :
                      'text-emerald-400 bg-emerald-950/30'
                    }`}>
                      {task.estimatedComplexity} Complexity
                    </span>
                </div>

                {/* Strategy Note (New in 0.1.2) */}
                {task.reasoningStrategy && (
                  <div className="mt-3 text-xs text-gray-500 italic flex items-start space-x-1.5">
                    <span className="opacity-50">Strategy:</span>
                    <span>{task.reasoningStrategy}</span>
                  </div>
                )}
                
                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
                    <ArrowDown className={`w-3 h-3 ${dependenciesMet ? 'text-green-500/50' : 'text-gray-600'}`} />
                    <span className={dependenciesMet ? 'text-green-500/50' : ''}>Waits for: {task.dependencies.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};