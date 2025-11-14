import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import QuizTaker from './QuizTaker';
import { Project, User, Submission, Attempt } from '../../types';

const QuizStart: React.FC<{
  onStart: (userId: string) => void;
  projectTitle: string;
  projectId: string;
  users: User[];
  submissions: Submission[];
}> = ({ onStart, projectTitle, projectId, users, submissions }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');

  const availableUsers = users.filter(user => 
    !submissions.some(s => s.userId === user.id && s.projectId === projectId)
  );

  const handleStart = () => {
    if (!selectedUser) {
      setError('名前を選択してください。');
      return;
    }
    setError('');
    onStart(selectedUser);
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">{projectTitle}</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">クイズを始めるには、あなたの名前を選択してください。</p>
      <div className="max-w-xs mx-auto">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary focus:border-primary"
        >
          <option value="">名前を選択...</option>
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={handleStart}
          className="w-full mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all text-lg"
        >
          クイズを開始
        </button>
      </div>
    </div>
  );
};

const QuizComplete: React.FC = () => {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-green-500">提出完了！</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">クイズお疲れ様でした。結果は管理者に送信されました。</p>
        </div>
    );
};

const QuizFlow: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { users, submissions, attempts, addSubmission, addAttempt, getProjectById } = useAppContext();
    const [pageState, setPageState] = useState<'start' | 'taking' | 'complete'>('start');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
        if(currentUserId && project) {
            const hasSubmitted = submissions.some(s => s.userId === currentUserId && s.projectId === project.id);
            if (hasSubmitted) {
                setPageState('complete');
            }
        }
    }, [currentUserId, project, submissions]);

    const handleStartQuiz = (userId: string) => {
        setCurrentUserId(userId);
        setPageState('taking');
    };

    const handleGrade = async (score: number) => {
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
        if (!project || !currentUserId) return;
        
        const userAttempts = attempts.filter(a => a.userId === currentUserId && a.projectId === project.id);
        
        const newSubmission: Omit<Submission, 'id'> = {
            projectId: project.id,
            userId: currentUserId,
            submittedAt: new Date().toISOString(),
            attempt_count: userAttempts.length + 1 // これから採点する今回の試行も含める
        };

        await addSubmission(newSubmission);
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
                            projectTitle={project.name} 
                            projectId={project.id}
                            users={users}
                            submissions={submissions}
                        />;
            case 'taking':
                return <QuizTaker projectTitle={project.name} questions={project.questions} onSubmit={handleSubmit} onGrade={handleGrade} isStickyFooter={true} />;
            case 'complete':
                return <QuizComplete />;
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