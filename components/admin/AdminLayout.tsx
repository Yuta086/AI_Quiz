import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const navItems = [
  { name: 'プロジェクト', href: '/admin/projects' },
  { name: 'マスター名簿', href: '/admin/master-list' },
];

const ApiKeyModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { apiKey, setApiKey } = useAppContext();
    const [localApiKey, setLocalApiKey] = useState(apiKey);

    useEffect(() => {
        setLocalApiKey(apiKey);
    }, [apiKey, isOpen]);

    const handleSave = () => {
        setApiKey(localApiKey);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold">Gemini APIキーの設定</h3>
                </div>
                <div className="p-6">
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                        クイズの自動生成機能を利用するには、ご自身のGemini APIキーが必要です。キーはブラウザのローカルストレージに安全に保存されます。
                    </p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        APIキーの取得はこちら
                    </a>
                    <input
                        type="password"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        placeholder="APIキーを入力"
                        className="w-full p-2 mt-4 border rounded-md dark:bg-gray-900 dark:border-gray-600"
                    />
                </div>
                <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        キャンセル
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors">
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminLayout: React.FC = () => {
  const { isApiKeySet, isSupabaseConfigured } = useAppContext();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-primary dark:text-indigo-400">
              AIクイズ管理画面
            </h1>
            <div className="flex items-center space-x-4">
               {!isSupabaseConfigured && (
                 <div className="flex items-center bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span>DB未接続</span>
                 </div>
               )}
               {!isApiKeySet && isSupabaseConfigured && (
                 <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.026 2.073-1.026 2.709 0l5.836 9.42c.622 1.004-.16 2.273-1.355 2.273H3.776c-1.194 0-1.977-1.269-1.355-2.273l5.836-9.42zM10 14a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    <span>APIキー未設定</span>
                 </div>
               )}
                <button onClick={() => setIsApiModalOpen(true)} className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 011.5 1.5v2.879a1.5 1.5 0 01-.44 1.06L5.94 14.06a1.5 1.5 0 01-2.122-2.122L8.939 6.82a1.5 1.5 0 011.06-.44V5A1.5 1.5 0 0110 3.5z" /><path d="M14 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                    APIキー設定
                </button>
                <nav className="flex space-x-4">
                {navItems.map((item) => (
                    <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`
                    }
                    >
                    {item.name}
                    </NavLink>
                ))}
                </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-gray-800 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        © 2024 AIクイズジェネレーター
      </footer>
      <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
    </div>
  );
};

export default AdminLayout;