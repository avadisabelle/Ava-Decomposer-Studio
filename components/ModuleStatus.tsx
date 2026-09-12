import React from 'react';
import { XCircle, Loader2, Activity } from 'lucide-react';
import { ModuleStatus as IModuleStatus } from '../services/decompositionEngine';

interface ModuleStatusProps {
  modules: IModuleStatus[];
  isLoading: boolean;
}

export const ModuleStatus: React.FC<ModuleStatusProps> = ({ modules, isLoading }) => {
  if (isLoading && modules.length === 0) {
     return (
        <div className="flex items-center space-x-2 text-gray-500 text-xs animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Initializing Ava Neural Modules...</span>
        </div>
     );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Neural Modules</h3>
      </div>
      <div className="space-y-1.5">
        {modules.map((mod) => (
          <div key={mod.name} className="flex items-center justify-between group">
             <div className="flex items-center space-x-2 overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${mod.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-400 truncate max-w-[200px] font-mono group-hover:text-gray-200 transition-colors" title={mod.name}>
                    {mod.name.replace('ava-', '')}
                </span>
             </div>
             <div className="flex items-center">
                {mod.status === 'active' ? (
                     <span className="text-[10px] text-gray-600 bg-gray-900 px-1.5 rounded border border-gray-800">{mod.version || 'v0.1.1'}</span>
                ) : (
                    <XCircle className="w-3 h-3 text-red-900" />
                )}
             </div>
          </div>
        ))}
        {modules.length === 0 && !isLoading && (
            <div className="text-xs text-gray-600 italic">No modules detected.</div>
        )}
      </div>
    </div>
  );
};
