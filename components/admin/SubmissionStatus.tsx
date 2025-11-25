import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const SubmissionStatus: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { users, submissions, attempts, projects } = useAppContext();
    const [activeTab, setActiveTab] = useState<'submitted' | 'not-submitted'>('submitted');
    
    const project = projects.find(p => p.id === projectId);

    const { submittedUsers, notSubmittedUsers, responseRate, totalUsers, submittedCount } = useMemo(() => {
        if (!projectId) return { submittedUsers: [], notSubmittedUsers: [], responseRate: 0, totalUsers: 0, submittedCount: 0 };

        const projectSubmissions = submissions.filter(s => s.projectId === projectId);
        const submittedUserIds = new Set(projectSubmissions.map(s => s.userId));
        
        // Users who have submitted
        const submitted = projectSubmissions.map(submission => {
            const user = users.find(u => u.id === submission.userId);
            return {
                name: user ? user.name : '不明なユーザー',
                submittedAt: new Date(submission.submittedAt).toLocaleString(),
                attemptCount: submission.attempt_count,
            };
        }).sort((a,b) => a.name.localeCompare(b.name));

        // Users who haven't submitted
        const notSubmitted = users
            .filter(u => !submittedUserIds.has(u.id))
            .map(user => ({ name: user.name }))
            .sort((a,b) => a.name.localeCompare(b.name));
            
        // Calculate Response Rate
        const total = users.length;
        const subCount = submitted.length;
        const rate = total > 0 ? Math.round((subCount / total) * 100) : 0;
        
        return { 
            submittedUsers: submitted, 
            notSubmittedUsers: notSubmitted, 
            responseRate: rate,
            totalUsers: total,
            submittedCount: subCount
        };

    }, [projectId, users, submissions, attempts]);
    
    if (!project) return <p>プロジェクトが見つかりません。</p>;

    const renderTable = (data: any[], headers: {key: string, label: string}[]) => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {headers.map(header => (
                            <th key={header.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {data.map((row, index) => (
                        <tr key={index}>
                            {headers.map(header => (
                                <td key={header.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {row[header.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-gray-400">記録が見つかりません。</p>}
        </div>
    );
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">提出状況</h2>
            <h3 className="text-lg text-gray-600 dark:text-gray-300 mb-6">{project.name}</h3>

            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">回答率</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{responseRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${responseRate}%` }}></div>
                </div>
                <div className="text-right text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {submittedCount} / {totalUsers} 人
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'submitted' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        提出済み ({submittedUsers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('not-submitted')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'not-submitted' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        未提出 ({notSubmittedUsers.length})
                    </button>
                </nav>
            </div>
            
            <div>
                {activeTab === 'submitted' && renderTable(submittedUsers, [{key: 'name', label: '名前'}, {key: 'submittedAt', label: '提出日時'}, {key: 'attemptCount', label: '受験回数'}])}
                {activeTab === 'not-submitted' && renderTable(notSubmittedUsers, [{key: 'name', label: '名前'}])}
            </div>
        </div>
    );
};

export default SubmissionStatus;