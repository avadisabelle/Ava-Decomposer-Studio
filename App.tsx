import React, { useState, useCallback, useEffect } from 'react';
import { Layers, Play, RefreshCw, Zap, Sparkles, BrainCircuit, Share2, Workflow, Link as LinkIcon } from 'lucide-react';
import { decomposePrompt, loadAvaModules, ModuleStatus as IModuleStatus, EngineType } from './services/decompositionEngine';
import { executeTask } from './services/executionService';
import { DecompositionPlan, ExecutionResult, TaskStatus } from './types';
import { PlanVisualization } from './components/PlanVisualization';
import { ExecutionLog } from './components/ExecutionLog';
import { ModuleStatus } from './components/ModuleStatus';
import { SessionManager } from './components/SessionManager';
import { ExportControls } from './components/ExportControls';
import { useSessions } from './hooks/useSessions';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [plan, setPlan] = useState<DecompositionPlan | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, ExecutionResult>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<IModuleStatus[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('langgraph');

  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    updateSession, 
    deleteSession, 
    loadSession,
    clearCurrentSession
  } = useSessions();

  // Load modules on mount
  useEffect(() => {
    const initModules = async () => {
        const statuses = await loadAvaModules();
        setModules(statuses);
        setLoadingModules(false);
    };
    initModules();
  }, []);

  // Auto-save session when state changes
  useEffect(() => {
    if (currentSessionId) {
      const timeoutId = setTimeout(() => {
        updateSession(currentSessionId, {
          prompt,
          plan,
          executionResults,
          selectedEngine
        });
      }, 1000); // Debounce 1s
      return () => clearTimeout(timeoutId);
    }
  }, [prompt, plan, executionResults, selectedEngine, currentSessionId, updateSession]);

  const handleLoadSession = (id: string) => {
    const session = loadSession(id);
    if (session) {
      setPrompt(session.prompt);
      setPlan(session.plan);
      setExecutionResults(session.executionResults);
      setSelectedEngine(session.selectedEngine);
    }
  };

  const handleNewSession = () => {
    setPrompt('');
    setPlan(null);
    setExecutionResults({});
    setError(null);
    clearCurrentSession();
  };

  const handleDecompose = async () => {
    if (!prompt.trim()) return;
    
    setIsDecomposing(true);
    setError(null);
    setPlan(null);
    setExecutionResults({});
    
    // Create a session if one doesn't exist, or we are starting fresh
    if (!currentSessionId) {
      createSession(prompt, null, {}, selectedEngine);
    }

    try {
      const newPlan = await decomposePrompt(prompt, selectedEngine);
      setPlan(newPlan);
      // Session update will happen via useEffect
    } catch (e: any) {
      setError(e.message || "Failed to decompose prompt");
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSingleTaskExecution = useCallback(async (taskId: string) => {
    if (!plan) return;
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Set Running
    setExecutionResults(prev => ({
      ...prev,
      [taskId]: { taskId, status: TaskStatus.RUNNING, startedAt: Date.now() }
    }));

    // Build Context from all currently completed tasks
    const currentContext = Object.values(executionResults)
        .filter(r => r.status === TaskStatus.COMPLETED && r.output)
        .map(r => `[Output from Task ${r.taskId}]:\n${r.output}`)
        .join('\n\n');

    try {
        const output = await executeTask(task.title, task.description, currentContext);
        
        setExecutionResults(prev => ({
          ...prev,
          [taskId]: { 
            taskId, 
            status: TaskStatus.COMPLETED, 
            output, 
            completedAt: Date.now() 
          }
        }));
    } catch (e: any) {
        setExecutionResults(prev => ({
          ...prev,
          [taskId]: { 
            taskId, 
            status: TaskStatus.FAILED, 
            error: e.message, 
            completedAt: Date.now() 
          }
        }));
    }
  }, [plan, executionResults]);

  const handleExecute = useCallback(async () => {
    if (!plan) return;
    
    setIsExecuting(true);
    let currentContext = "";
    
    const tasksToRun = [...plan.tasks];
    
    for (const task of tasksToRun) {
      setExecutionResults(prev => ({
        ...prev,
        [task.id]: { taskId: task.id, status: TaskStatus.RUNNING, startedAt: Date.now() }
      }));

      try {
        const output = await executeTask(task.title, task.description, currentContext);
        
        setExecutionResults(prev => ({
          ...prev,
          [task.id]: { 
            taskId: task.id, 
            status: TaskStatus.COMPLETED, 
            output, 
            completedAt: Date.now() 
          }
        }));
        
        currentContext += `\n\n[Result of ${task.title}]:\n${output}`;
        
      } catch (e: any) {
        setExecutionResults(prev => ({
          ...prev,
          [task.id]: { 
            taskId: task.id, 
            status: TaskStatus.FAILED, 
            error: e.message, 
            completedAt: Date.now() 
          }
        }));
        break;
      }
    }
    
    setIsExecuting(false);
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#030712]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
              Ava Decomposer <span className="font-mono text-xs opacity-50 font-normal ml-1">Studio</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <SessionManager 
              sessions={sessions}
              currentSessionId={currentSessionId}
              onLoadSession={handleLoadSession}
              onDeleteSession={deleteSession}
              onNewSession={handleNewSession}
            />
             <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-900/50 border border-gray-800">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono text-gray-400">
                {modules.filter(m => m.status === 'active').length} Modules Active
              </span>
            </div>
            <div className="h-4 w-px bg-gray-800 hidden md:block"></div>
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-900/50">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300 font-medium">Gemini 3 Pro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Sidebar: Modules & Status */}
            <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
                 <div className="bg-gray-900/30 rounded-xl p-5 border border-gray-800/60 sticky top-24">
                    <ModuleStatus modules={modules} isLoading={loadingModules} />
                    
                    <div className="mt-8 pt-6 border-t border-gray-800/60">
                        <div className="flex items-center space-x-2 mb-3">
                            <Share2 className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capabilities</h3>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-500">
                            <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                <span>Narrative Tracing</span>
                            </li>
                             <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                <span>Relational Intelligence</span>
                            </li>
                             <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                <span>Graph Decomposition</span>
                            </li>
                        </ul>
                    </div>
                 </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 order-1 lg:order-2">
                {/* Intro / Prompt Section */}
                <section className="mb-12 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Decompose Complex Goals</h2>
                <p className="text-gray-400 mb-8 text-lg max-w-2xl">
                    Transform high-level prompts into actionable, dependency-aware execution graphs.
                </p>
                
                <div className="relative group max-w-4xl">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
                    <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-2">
                    
                    {/* Engine Selector */}
                    <div className="flex items-center justify-end px-4 py-2 border-b border-gray-800/50 space-x-4">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Engine:</span>
                        <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
                             <button
                                onClick={() => setSelectedEngine('langgraph')}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    selectedEngine === 'langgraph' 
                                    ? 'bg-blue-900/40 text-blue-300 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                             >
                                <Workflow className="w-3.5 h-3.5" />
                                <span>LangGraph</span>
                             </button>
                             <button
                                onClick={() => setSelectedEngine('langchain')}
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    selectedEngine === 'langchain' 
                                    ? 'bg-purple-900/40 text-purple-300 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                             >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>LangChain</span>
                             </button>
                        </div>
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., Plan a 3-day itinerary for Tokyo focusing on anime culture and traditional food, including travel logistics..."
                        className="w-full bg-transparent border-none text-gray-200 placeholder-gray-600 resize-none h-32 p-4 focus:ring-0 text-lg"
                    />
                    <div className="flex justify-between items-center px-4 pb-2 pt-2 border-t border-gray-800/50">
                        <span className="text-xs text-gray-500 font-mono">
                        {prompt.length} chars
                        </span>
                        <button
                        onClick={handleDecompose}
                        disabled={!prompt.trim() || isDecomposing || isExecuting}
                        className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200
                            ${!prompt.trim() || isDecomposing 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-gray-200 hover:shadow-lg hover:shadow-white/10 active:scale-95'}
                        `}
                        >
                        {isDecomposing ? (
                            <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                            </>
                        ) : (
                            <>
                            <Zap className="w-4 h-4" />
                            <span>Decompose Prompt</span>
                            </>
                        )}
                        </button>
                    </div>
                    </div>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                    {error}
                    </div>
                )}
                </section>

                {/* Results Grid */}
                {plan && (
                <div className="grid lg:grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Execution & Visuals combined vertically since sidebar takes space */}
                    <div className="space-y-8">
                        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 relative">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Engine Reasoning</h3>
                                <ExportControls plan={plan} executionResults={executionResults} prompt={prompt} />
                            </div>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                {plan.reasoning}
                            </p>
                        </div>

                        <div className="bg-gray-950 rounded-2xl border border-gray-800 p-6">
                           <PlanVisualization 
                              tasks={plan.tasks} 
                              executionResults={executionResults} 
                              onExecuteTask={handleSingleTaskExecution}
                           />
                        </div>

                        <div className="bg-gray-950 rounded-2xl border border-gray-800 h-full min-h-[500px] flex flex-col">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/30 rounded-t-2xl">
                                <h3 className="font-semibold text-gray-200">Execution Engine</h3>
                                <button
                                    onClick={handleExecute}
                                    disabled={isExecuting || Object.keys(executionResults).length > 0}
                                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                    ${isExecuting || Object.keys(executionResults).length > 0
                                        ? 'bg-gray-800 text-gray-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}
                                    `}
                                >
                                    {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                    <span>{isExecuting ? 'Executing...' : 'Run All Tasks'}</span>
                                </button>
                            </div>
                            
                            <div className="p-6 flex-1 bg-gradient-to-b from-gray-900/10 to-transparent">
                                <ExecutionLog results={executionResults} tasks={plan.tasks} />
                            </div>
                        </div>
                    </div>

                </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
