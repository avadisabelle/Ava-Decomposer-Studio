import React from 'react';
import { History, Trash2, Plus } from 'lucide-react';
import { Session } from '../types';

interface SessionManagerProps {
  sessions: Session[];
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-gray-900/50 border border-gray-800 hover:bg-gray-800 transition-colors"
      >
        <History className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-300">Sessions</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase">Recent Sessions</span>
            <button 
              onClick={() => {
                onNewSession();
                setIsOpen(false);
              }}
              className="p-1 hover:bg-gray-800 rounded text-blue-400"
              title="New Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <ul className="py-1">
            {sessions.length === 0 ? (
              <li className="px-4 py-2 text-xs text-gray-500 text-center">No saved sessions</li>
            ) : (
              sessions.map(session => (
                <li key={session.id} className={`group flex items-center justify-between px-3 py-2 hover:bg-gray-800 cursor-pointer ${currentSessionId === session.id ? 'bg-gray-800/50' : ''}`}>
                  <div 
                    className="flex-1 min-w-0 mr-2"
                    onClick={() => {
                      onLoadSession(session.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="text-sm text-gray-300 truncate font-medium">{session.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{new Date(session.timestamp).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
