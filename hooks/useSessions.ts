import { useState, useCallback } from 'react';
import { Session, DecompositionPlan, ExecutionResult } from '../types';
import { generateSessionId, generateSessionTitle } from '../utils/exportUtils';

const STORAGE_KEY = 'ava_sessions';

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEY);
    if (storedSessions) {
      try {
        return JSON.parse(storedSessions);
      } catch {
        console.error('Failed to parse sessions from localStorage');
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEY);
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions);
        if (parsed.length > 0) {
          return parsed[0].id;
        }
      } catch {
        // Ignore
      }
    }
    return null;
  });

  const saveSession = useCallback((session: Session) => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === session.id);
      let newSessions;
      if (existingIndex >= 0) {
        newSessions = [...prev];
        newSessions[existingIndex] = session;
      } else {
        newSessions = [session, ...prev];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
  }, []);

  const createSession = useCallback((prompt: string, plan: DecompositionPlan | null, executionResults: Record<string, ExecutionResult>, selectedEngine: 'langgraph' | 'langchain'): Session => {
    const newSession: Session = {
      id: generateSessionId(),
      timestamp: new Date().toISOString(),
      title: generateSessionTitle(prompt),
      prompt,
      plan,
      executionResults,
      selectedEngine,
      lastModified: Date.now(),
    };
    saveSession(newSession);
    setCurrentSessionId(newSession.id);
    return newSession;
  }, [saveSession]);

  const updateSession = useCallback((id: string, updates: Partial<Session>) => {
    setSessions(prev => {
      const index = prev.findIndex(s => s.id === id);
      if (index === -1) return prev;
      
      const updatedSession = { ...prev[index], ...updates, lastModified: Date.now() };
      const newSessions = [...prev];
      newSessions[index] = updatedSession;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      if (currentSessionId === id) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
      return newSessions;
    });
  }, [currentSessionId]);

  const loadSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      return session;
    }
    return null;
  }, [sessions]);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  return {
    sessions,
    currentSessionId,
    createSession,
    updateSession,
    deleteSession,
    loadSession,
    saveSession,
    clearCurrentSession
  };
};
