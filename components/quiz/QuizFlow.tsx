import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import QuizTaker from './QuizTaker';
import { Project, User, Submission, Attempt } from '../../types';

const ConfirmationModal: React.FC<{
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ userName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">クイズ開始の確認</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            <span className="font-bold text-lg text-primary dark:text-indigo-400">{userName}</span> さんとしてクイズを開始します。よろしいですか？
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              いいえ、戻ります
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              はい、開始します
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizStart: React.FC<{
  onStart: (userId: string) => void;
  onStartGuest: () => void;
  projectTitle: string;
  projectId: string;
  users: User[];
  submissions: Submission[];
}> = ({ onStart, onStartGuest, projectTitle, projectId, users, submissions }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Filter users who haven't submitted yet
  const availableUsers = users.filter(user => {
    return !submissions.some(s => s.userId === user.id && s.projectId === projectId);
  });

  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStart = () => {
    if (!selectedUser) {
      setError('名前を選択してください。');
      return;
    }
    setError('');
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmStart = () => {
    onStart(selectedUser);
    setIsConfirmModalOpen(false);
  };
  
  const selectedUserName = users.find(u => u.id === selectedUser)?.name || '';

  return (
    <>
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{projectTitle}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">クイズを始めるには、あなたの名前を選択してください。</p>
        
        <div className="max-w-md mx-auto">
          <div className="relative mb-4 text-left">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                placeholder="名前を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto mb-4 bg-white dark:bg-gray-700 text-left">
            {filteredUsers.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredUsers.map(user => (
                        <li 
                            key={user.id} 
                            onClick={() => setSelectedUser(user.id)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 flex justify-between items-center transition-colors ${selectedUser === user.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-inset ring-primary' : ''}`}
                        >
                            <span className="font-medium">{user.name}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">該当するユーザーが見つかりません。</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          
          <button
            onClick={handleStart}
            disabled={!selectedUser}
            className="w-full mt-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-lg"
          >
            クイズを開始
          </button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">または</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <button
            onClick={onStartGuest}
            className="w-full px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-all"
          >
            ゲストとして開始
          </button>
        </div>
      </div>
      {isConfirmModalOpen && (
        <ConfirmationModal
          userName={selectedUserName}
          onConfirm={handleConfirmStart}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      )}
    </>
  );
};

const QuizComplete: React.FC<{ isGuest: boolean; onRetry: () => void }> = ({ isGuest, onRetry }) => {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-green-500">
                {isGuest ? '体験完了！' : '提出完了！'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                {isGuest 
                    ? 'クイズの体験お疲れ様でした。ゲストモードのため結果は保存されません。' 
                    : 'クイズお疲れ様でした。結果は管理者に送信されました。'}
            </p>
            {isGuest && (
                 <button 
                    onClick={onRetry}
                    className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                    トップに戻る
                </button>
            )}
        </div>
    );
};

const QuizFlow: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { users, submissions, addSubmission, addAttempt, getProjectById, supabaseClient } = useAppContext();
    const [pageState, setPageState] = useState<'start' | 'taking' | 'complete'>('start');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) {
                setIsLoading(false);
                return;
            };
            try {
                setIsLoading(true);
                const fetchedProject = await getProjectById(projectId);
                if (fetchedProject && fetchedProject.is_published) {
                    setProject(fetchedProject);
                }
            } catch (error) {
                console.error("Failed to fetch project:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [projectId, getProjectById]);

    useEffect(() => {
        if(currentUserId && project && !isGuest) {
            // Check if user has submitted
            const hasSubmitted = submissions.some(s => s.userId === currentUserId && s.projectId === project.id);
            if (hasSubmitted) {
                setPageState('complete');
            }
        }
    }, [currentUserId, project, submissions, isGuest]);

    const handleStartQuiz = (userId: string) => {
        setIsGuest(false);
        setCurrentUserId(userId);
        setPageState('taking');
    };

    const handleStartGuest = () => {
        setIsGuest(true);
        setCurrentUserId(null);
        setPageState('taking');
    };

    const handleGrade = async (score: number) => {
      // Guest users do not record attempts
      if (isGuest) return;

      if (project && currentUserId) {
        const newAttempt: Omit<Attempt, 'id'> = {
          projectId: project.id,
          userId: currentUserId,
          score,
          attemptedAt: new Date().toISOString()
        };
        await addAttempt(newAttempt);
      }
    };

    const handleSubmit = async () => {
        if (isGuest) {
            setPageState('complete');
            return;
        }

        if (!project || !currentUserId || !supabaseClient) {
            throw new Error("提出処理に必要な情報が不足しています。");
        }

        // データベースから直接最新の受験回数を取得して、競合状態を回避する
        const { count, error } = await supabaseClient
            .from('attempts')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('user_id', currentUserId);

        if (error) {
            console.error("受験回数の取得に失敗しました:", error);
            throw error;
        }

        const newSubmission: Omit<Submission, 'id'> = {
            projectId: project.id,
            userId: currentUserId,
            submittedAt: new Date().toISOString(),
            attempt_count: count ?? 0
        };

        await addSubmission(newSubmission);
        
        // Show complete screen
        setPageState('complete');
    };
    
    const renderContent = () => {
        if(isLoading) {
            return <div className="text-center"><p>クイズを読み込んでいます...</p></div>;
        }

        if (!project) {
             return <div className="text-center"><h2 className="text-2xl font-bold">クイズは利用できません</h2><p>このクイズは見つからないか、現在公開されていません。</p></div>;
        }

        switch (pageState) {
            case 'start':
                return <QuizStart 
                            onStart={handleStartQuiz} 
                            onStartGuest={handleStartGuest}
                            projectTitle={project.name} 
                            projectId={project.id}
                            users={users}
                            submissions={submissions}
                        />;
            case 'taking':
                return <QuizTaker projectTitle={project.name} questions={project.questions} onSubmit={handleSubmit} onGrade={handleGrade} isStickyFooter={true} />;
            case 'complete':
                return <QuizComplete isGuest={isGuest} onRetry={() => setPageState('start')} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default QuizFlow;