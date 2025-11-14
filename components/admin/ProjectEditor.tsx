import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Project, Question } from '../../types';
import { generateQuizFromTranscript } from '../../services/geminiService';
import QuizTaker from '../quiz/QuizTaker';

const EditableQuestion: React.FC<{ 
    question: Omit<Question, 'id'> & { id?: string }; // id can be optional for new questions
    index: number; 
    onUpdate: (index: number, updatedQuestion: Omit<Question, 'id'> & { id?: string }) => void; 
    onDelete: (index: number) => void;
}> = ({ question, index, onUpdate, onDelete }) => {
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(index, { ...question, [e.target.name]: e.target.value });
    };

    const handleOptionChange = (optIndex: number, value: string) => {
        const newOptions = [...question.options];
        newOptions[optIndex] = value;
        onUpdate(index, { ...question, options: newOptions });
    };
    
    const handleCorrectAnswerChange = (optIndex: number) => {
        onUpdate(index, { ...question, correct_answer: optIndex + 1 });
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">問題 {index + 1}</label>
                <button onClick={() => onDelete(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">削除</button>
            </div>
            <textarea
                name="question_text"
                value={question.question_text}
                onChange={handleTextChange}
                rows={2}
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
            />
            <div className="mt-2 space-y-2">
                {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                        <input
                            type="radio"
                            name={`correct_answer_${index}`}
                            checked={question.correct_answer === optIndex + 1}
                            onChange={() => handleCorrectAnswerChange(optIndex)}
                            className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        />
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                            className="w-full p-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProjectEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getProjectById, createProject, updateProject, aiInstance } = useAppContext();
    
    const [name, setName] = useState('');
    const [transcript, setTranscript] = useState('');
    const [questions, setQuestions] = useState<(Omit<Question, 'id'> & { id?: string })[]>([]);
    const [isPublished, setIsPublished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchProject = async () => {
                setIsLoading(true);
                const project = await getProjectById(id);
                if (project) {
                    setName(project.name);
                    setTranscript(project.transcript);
                    setQuestions(project.questions || []);
                    setIsPublished(project.is_published);
                } else {
                    setError("プロジェクトが見つかりません。");
                }
                setIsLoading(false);
            };
            fetchProject();
        }
    }, [id, getProjectById]);

    const handleGenerateQuiz = async () => {
        if (!transcript) {
            setError('クイズを生成するには、文字起こしを入力してください。');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const generated = await generateQuizFromTranscript(aiInstance, transcript);
            setQuestions(prev => [...prev, ...generated]);
        } catch (err: any) {
            setError(err.message || '不明なエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuestion = (index: number, updatedQuestion: Omit<Question, 'id'> & { id?: string }) => {
        const newQuestions = [...questions];
        newQuestions[index] = updatedQuestion;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: 1 }]);
    };
    
    const deleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = useCallback(async (publishState: boolean) => {
        if (!name) {
            setError('プロジェクト名は必須です。');
            return;
        }
        
        setIsSaving(true);
        setError('');

        // Remove temporary client-side IDs before saving
        const questionsToSave = questions.map(({ id, ...rest }) => rest);

        try {
            if (id) {
                await updateProject(id, { name, transcript, questions: questionsToSave, is_published: publishState });
            } else {
                await createProject({ name, transcript, questions: questionsToSave, is_published: publishState });
            }
            navigate('/admin/projects');
        } catch(err: any) {
            console.error("Failed to save project:", err); // For developer debugging
            let errorMessage = 'プロジェクトの保存に失敗しました。';
            if (err && err.message) {
                if (err.message.includes("violates row-level security policy")) {
                     errorMessage += '\n\n[原因]\nデータベースへの書き込み権限がありません。SupabaseのRow Level Security (RLS) ポリシー設定で、`projects` テーブルと `questions` テーブルへのINSERT/UPDATEを許可してください。';
                } else {
                    errorMessage += `\n\n[原因]\n${err.message}`;
                }
                if(err.details) errorMessage += `\n\n[詳細]\n${err.details}`;
                if(err.hint) errorMessage += `\n\n[ヒント]\n${err.hint}`;
            } else {
                errorMessage += '\n\n予期せぬエラーが発生しました。開発者コンソールをご確認ください。';
            }
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [id, name, transcript, questions, createProject, updateProject, navigate]);

    if (isLoading && id) {
        return <div>プロジェクトを読み込んでいます...</div>
    }

    // A temporary ID for preview rendering
    const questionsForPreview = questions.map((q, i) => ({ ...q, id: q.id || `temp-${i}` })) as Question[];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">{id ? 'プロジェクトを編集' : '新規プロジェクト作成'}</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">プロジェクト名</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"/>
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">文字起こし</label>
                <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={10} className="w-full p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"/>
            </div>

            <button 
                onClick={handleGenerateQuiz} 
                disabled={isLoading || isSaving || !aiInstance} 
                className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover disabled:bg-gray-400 transition-colors"
                title={!aiInstance ? 'クイズを生成するにはAPIキーの設定が必要です。' : '文字起こしからクイズを生成します'}
            >
                {isLoading ? '生成中...' : 'AIでクイズを生成'}
            </button>
            
            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-red-600 dark:text-red-300 text-sm whitespace-pre-wrap">{error}</p>
                </div>
            )}
            
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">クイズの問題 ({questions.length}問)</h3>
                {questions.map((q, i) => (
                    <EditableQuestion key={q.id || `new-${i}`} question={q} index={i} onUpdate={updateQuestion} onDelete={deleteQuestion} />
                ))}
                <button onClick={addQuestion} className="mt-2 text-sm text-primary hover:underline">+ 手動で問題を追加</button>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end space-x-4">
                <button onClick={() => setIsPreviewOpen(true)} disabled={isSaving} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:bg-gray-400">プレビュー</button>
                <button onClick={() => handleSave(isPublished)} disabled={isSaving} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-400">{isSaving ? '保存中...' : '下書き保存'}</button>
                <button onClick={() => handleSave(!isPublished)} disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:bg-gray-400">{isSaving ? '保存中...' : (isPublished ? '非公開にして保存' : '公開する')}</button>
            </div>

            {isPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsPreviewOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">クイズプレビュー</h3>
                            <button 
                                onClick={() => setIsPreviewOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                aria-label="閉じる"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-8 bg-gray-50 dark:bg-gray-800">
                             {questionsForPreview.length > 0 ? (
                                <QuizTaker
                                    projectTitle={name || '（無題のプロジェクト）'}
                                    questions={questionsForPreview}
                                    onSubmit={() => alert('これはプレビューモードです。提出は記録されません。')}
                                    onGrade={() => { /* プレビューでは何もしない */ }}
                                    isStickyFooter={false}
                                />
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400">プレビューする問題がありません。AIで生成するか、手動で追加してください。</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectEditor;
