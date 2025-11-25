import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Project } from '../../types';


const ProjectCard: React.FC<{ 
    project: Project; 
    onDelete: (id: string) => void;
    totalUsers: number;
    submittedCount: number;
}> = ({ project, onDelete, totalUsers, submittedCount }) => {
    const navigate = useNavigate();

    const percentage = totalUsers > 0 ? Math.round((submittedCount / totalUsers) * 100) : 0;

    const copyUrl = () => {
        const url = `${window.location.origin}${window.location.pathname}#/quiz/${project.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('共有可能なクイズのURLをクリップボードにコピーしました！');
        });
    };
    
    // プログレスバーの色を達成率によって変える（オプション）
    const getBarColor = (p: number) => {
        if (p >= 100) return 'bg-green-500';
        if (p >= 50) return 'bg-blue-500';
        return 'bg-blue-500'; // デフォルト
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col justify-between transition-shadow hover:shadow-xl">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {project.is_published ? '公開中' : '下書き'}
                    </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    作成日: {new Date(project.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {project.questions.length} 問
                </p>

                {/* 回答率プログレスバー */}
                <div className="mb-4">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">回答率</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {percentage}% ({submittedCount}/{totalUsers})
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                            className={`${getBarColor(percentage)} h-2.5 rounded-full transition-all duration-500 ease-out`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-2 justify-end">
                {project.is_published && (
                    <button onClick={copyUrl} className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        URLをコピー
                    </button>
                )}
                <button onClick={() => navigate(`/admin/projects/${project.id}/status`)} className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                    提出状況
                </button>
                <button onClick={() => navigate(`/admin/projects/${project.id}/edit`)} className="text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                    編集
                </button>
                <button onClick={() => onDelete(project.id)} className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                    削除
                </button>
            </div>
        </div>
    );
};

const ProjectList: React.FC = () => {
  const { projects, deleteProject, users, submissions } = useAppContext();

  const handleDelete = async (id: string) => {
    if (window.confirm('このプロジェクトを本当に削除しますか？この操作は元に戻せません。')) {
      try {
        await deleteProject(id);
      } catch (error) {
        alert('プロジェクトの削除に失敗しました。');
      }
    }
  };

  const sortedProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getSubmittedCount = (projectId: string) => {
      // 指定されたプロジェクトIDに対する提出記録をフィルタリング
      const projectSubmissions = submissions.filter(s => s.projectId === projectId);
      // 重複しないユーザーIDのセットを作成してカウント
      const uniqueUsers = new Set(projectSubmissions.map(s => s.userId));
      return uniqueUsers.size;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">プロジェクト</h2>
        <Link 
          to="/admin/projects/new"
          className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
        >
          + 新規プロジェクト作成
        </Link>
      </div>
      {sortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map(project => (
            <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleDelete} 
                totalUsers={users.length}
                submittedCount={getSubmittedCount(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">プロジェクトが見つかりません。</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">新しいプロジェクトを作成して始めましょう。</p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;