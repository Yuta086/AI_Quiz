import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Project, Submission, Attempt, Question } from '../types';
import * as supabaseService from '../services/supabaseService';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleGenAI } from '@google/genai';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

interface AppContextType {
  users: User[];
  projects: Project[];
  submissions: Submission[];
  attempts: Attempt[];
  isLoading: boolean;
  error: string | null;
  
  // Gemini API
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeySet: boolean;
  aiInstance: GoogleGenAI | null;

  // Supabase
  supabaseClient: SupabaseClient | null;
  isSupabaseConfigured: boolean;

  // User Actions
  addUser: (name: string) => Promise<void>;
  updateUser: (id: string, name: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  replaceUsers: (newUsers: Omit<User, 'id'>[]) => Promise<void>;
  // Project Actions
  getProjectById: (id: string) => Promise<Project | null>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'questions'> & { questions: Omit<Question, 'id'>[] }) => Promise<void>;
  // FIX: Correct the type for 'projectData' to avoid an impossible intersection for the 'questions' property.
  updateProject: (id: string, projectData: Omit<Partial<Project>, 'questions'> & { questions?: Omit<Question, 'id'>[] }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Submission/Attempt Actions
  addSubmission: (submission: Omit<Submission, 'id'>) => Promise<void>;
  addAttempt: (attempt: Omit<Attempt, 'id'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SupabaseErrorScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold mb-4">Supabase 設定エラー</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Supabaseの接続情報が環境変数に設定されていません。アプリケーションをデプロイする管理者にご連絡ください。
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    (開発者向け: <code>SUPABASE_URL</code> と <code>SUPABASE_KEY</code> を環境変数に設定してください。)
                </p>
            </div>
        </div>
    );
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gemini API State
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini_api_key', '');
  const [aiInstance, setAiInstance] = useState<GoogleGenAI | null>(null);

  // Supabase State
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        setAiInstance(ai);
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        setAiInstance(null);
      }
    } else {
      setAiInstance(null);
    }
  }, [apiKey]);
  
  const isApiKeySet = !!apiKey && !!aiInstance;

  useEffect(() => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      if (supabaseUrl && supabaseKey) {
          try {
              const client = createClient(supabaseUrl, supabaseKey);
              setSupabaseClient(client);
          } catch(e) {
              console.error("Failed to initialize Supabase client:", e);
              setError("Supabaseへの接続情報が正しくありません。");
              setSupabaseClient(null);
          }
      } else {
          setSupabaseClient(null);
      }
  }, []);

  const isSupabaseConfigured = !!supabaseClient;

  const loadInitialData = useCallback(async (client: SupabaseClient) => {
    try {
      setIsLoading(true);
      setError(null);
      const [loadedUsers, loadedProjects, loadedSubmissions, loadedAttempts] = await Promise.all([
        supabaseService.getUsers(client),
        supabaseService.getProjects(client),
        supabaseService.getSubmissions(client),
        supabaseService.getAttempts(client),
      ]);
      setUsers(loadedUsers);
      setProjects(loadedProjects);
      setSubmissions(loadedSubmissions);
      setAttempts(loadedAttempts);
    } catch (e: any) {
      setError(e.message || "データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isSupabaseConfigured) {
      loadInitialData(supabaseClient);
    } else {
      setIsLoading(false);
    }
  }, [isSupabaseConfigured, supabaseClient, loadInitialData]);

  // --- Actions ---
  const performAction = useCallback(async <T,>(action: (client: SupabaseClient) => Promise<T>): Promise<T | undefined> => {
    if (!supabaseClient) {
      setError("Supabaseが設定されていません。");
      return;
    }
    try {
      return await action(supabaseClient);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [supabaseClient]);


  // --- User Actions ---
  const addUser = useCallback(async (name: string) => {
    await performAction(async (client) => {
        const newUser = await supabaseService.addUser(client, { name });
        setUsers(prev => [...prev, newUser]);
    });
  }, [performAction]);

  const updateUser = useCallback(async (id: string, name: string) => {
    await performAction(async (client) => {
        const updatedUser = await supabaseService.updateUser(client, id, { name });
        setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    });
  }, [performAction]);

  const deleteUser = useCallback(async (id: string) => {
    await performAction(async (client) => {
        await supabaseService.deleteUser(client, id);
        setUsers(prev => prev.filter(u => u.id !== id));
    });
  }, [performAction]);
  
  const replaceUsers = useCallback(async (newUsersData: Omit<User, 'id'>[]) => {
    await performAction(async (client) => {
        const createdUsers = await supabaseService.replaceUsers(client, newUsersData);
        setUsers(createdUsers);
    });
  }, [performAction]);

  // --- Project Actions ---
  const getProjectById = useCallback(async (id: string) => {
      return await performAction((client) => supabaseService.getProjectById(client, id)) || null;
  }, [performAction]);

  const createProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'questions'> & { questions: Omit<Question, 'id'>[] }) => {
    await performAction(async (client) => {
        const newProject = await supabaseService.addProject(client, project);
        setProjects(prev => [...prev, newProject]);
    });
  }, [performAction]);

  const updateProject = useCallback(async (id: string, projectData: Omit<Partial<Project>, 'questions'> & { questions?: Omit<Question, 'id'>[] }) => {
    await performAction(async (client) => {
        const updatedProject = await supabaseService.updateProject(client, id, projectData);
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
    });
  }, [performAction]);

  const deleteProject = useCallback(async (id: string) => {
      await performAction(async (client) => {
          await supabaseService.deleteProject(client, id);
          setProjects(prev => prev.filter(p => p.id !== id));
      });
  }, [performAction]);

  // --- Submission/Attempt Actions ---
  const addSubmission = useCallback(async (submission: Omit<Submission, 'id'>) => {
      await performAction(async (client) => {
          const newSubmission = await supabaseService.addSubmission(client, submission);
          setSubmissions(prev => [...prev, newSubmission]);
      });
  }, [performAction]);

  const addAttempt = useCallback(async (attempt: Omit<Attempt, 'id'>) => {
    await performAction(async (client) => {
        const newAttempt = await supabaseService.addAttempt(client, attempt);
        setAttempts(prev => [...prev, newAttempt]);
    });
  }, [performAction]);

  const value = {
    users, projects, submissions, attempts, isLoading, error,
    apiKey, setApiKey, isApiKeySet, aiInstance,
    supabaseClient, isSupabaseConfigured,
    addUser, updateUser, deleteUser, replaceUsers,
    getProjectById, createProject, updateProject, deleteProject,
    addSubmission, addAttempt
  };

  const renderContent = () => {
    if (!isSupabaseConfigured && !isLoading) {
        return <SupabaseErrorScreen />;
    }
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">データを読み込み中...</div>;
    }
    return children;
  }

  return (
    <AppContext.Provider value={value}>
      {renderContent()}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
