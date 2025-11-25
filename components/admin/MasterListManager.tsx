import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

const MasterListManager: React.FC = () => {
  const { users, addUser, deleteUser, updateUser, replaceUsers } = useAppContext();
  const [message, setMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const header = lines.shift()?.toLowerCase();
        
        // Check for header.
        if (!header?.startsWith('名前')) {
            setMessage('エラー: CSVの1列目のヘッダーは「名前」である必要があります。');
            return;
        }

        const newUsers: Omit<User, 'id'>[] = lines.map(line => {
            // Handle CSV splitting properly (simple split by comma)
            const parts = line.split(',');
            const name = parts[0].trim();
            return { name };
        });
        
        setIsSubmitting(true);
        const resultMessage = await replaceUsers(newUsers);
        setMessage(resultMessage);
      } catch (error) {
          setMessage('エラー: CSVファイルの解析または更新に失敗しました。');
      } finally {
        setIsSubmitting(false);
        // Clear the file input so the same file can be uploaded again
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };
  
  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim() === '' || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await addUser({ name: newUserName.trim() });
      
      setMessage(`${newUserName.trim()}さんを追加しました。`);
      setNewUserName('');
    } catch (error) {
      console.error(error);
      setMessage('エラー: ユーザーの追加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userIdToDelete: string, userName: string) => {
    if (window.confirm(`${userName}さんを名簿から削除しますか？`)) {
      try {
        await deleteUser(userIdToDelete);
        setMessage(`${userName}さんを削除しました。`);
      } catch (error: any) {
        if (error.message.includes("提出記録があるため")) {
            setMessage(`エラー: ${error.message}`);
        } else {
            setMessage('エラー: ユーザーの削除に失敗しました。');
        }
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserName('');
  };

  const handleUpdateUser = async (userIdToUpdate: string) => {
    if (editingUserName.trim() === '' || isSubmitting) {
      setMessage('エラー: 名前は空にできません。');
      return;
    }
    try {
      setIsSubmitting(true);
      await updateUser(userIdToUpdate, editingUserName.trim());
      setMessage(`ユーザー名を更新しました。`);
      handleCancelEdit();
    } catch (error) {
      setMessage('エラー: ユーザー名の更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">マスター名簿管理</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        CSVファイルをアップロードして、マスター名簿を更新します。<br/>
        1列目に「名前」を入力してください。
      </p>
      
      <div className="flex items-center space-x-4 mb-8">
        <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
        />
        <button
            onClick={triggerFileInput}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
        >
          {isSubmitting ? '処理中...' : 'CSVをアップロード'}
        </button>
        {message && <p className={`text-sm whitespace-pre-wrap ${message.startsWith('エラー') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
      </div>
      
      <div className="mt-8 border-t dark:border-gray-700 pt-6">
        <h3 className="text-xl font-semibold mb-4">名簿の直接編集</h3>
        <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="新しい名前を入力"
            className="flex-grow p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 w-full sm:w-auto"
          />
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-hover transition-colors disabled:bg-gray-400 whitespace-nowrap">
            {isSubmitting ? '追加中...' : '追加'}
          </button>
        </form>

        <h3 className="text-xl font-semibold mb-2 mt-6">現在のマスター名簿 ({users.length} 人)</h3>
        {users.length > 0 ? (
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-3 flex justify-between items-center">
                  {editingUserId === user.id ? (
                    <>
                      <input
                        type="text"
                        value={editingUserName}
                        onChange={(e) => setEditingUserName(e.target.value)}
                        className="flex-grow p-1 border rounded-md dark:bg-gray-900 dark:border-gray-600"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser(user.id)}
                      />
                      <div className="flex items-center ml-2 space-x-2 flex-shrink-0">
                        <button onClick={() => handleUpdateUser(user.id)} className="text-green-500 hover:text-green-700 text-sm font-medium" disabled={isSubmitting}>
                          {isSubmitting ? '保存中...' : '保存'}
                        </button>
                        <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                          キャンセル
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                          <span className="truncate mr-2">{user.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                          編集
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">マスター名簿にユーザーがいません。CSVファイルをアップロードするか、手動で追加してください。</p>
        )}
      </div>
    </div>
  );
};

export default MasterListManager;