import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const navItems = [
  { name: 'プロジェクト', href: '/admin/projects' },
  { name: 'マスター名簿', href: '/admin/master-list' },
];

const AdminLayout: React.FC = () => {
  const { isGeminiConfigured, isSupabaseConfigured } = useAppContext();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-primary dark:text-indigo-400">
              AIクイズ管理画面
            </h1>
            <div className="flex items-center space-x-4">
               {!isGeminiConfigured && isSupabaseConfigured && (
                 <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.026 2.073-1.026 2.709 0l5.836 9.42c.622 1.004-.16 2.273-1.355 2.273H3.776c-1.194 0-1.977-1.269-1.355-2.273l5.836-9.42zM10 14a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    <span>APIキー未設定</span>
                 </div>
               )}
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
    </div>
  );
};

export default AdminLayout;
