
import React, { useState } from 'react';
import { LockIcon } from './icons';
import { verifyPassword } from '../services/geminiService';

interface PasswordModalProps {
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyPassword(password);
      if (result?.success) {
        onSuccess();
      } else {
        setError('パスワードが正しくありません。');
      }
    } catch (err) {
      console.error('Password verification failed:', err);
      setError('認証中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <LockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-2xl font-bold leading-6 text-gray-900">
                アクセス認証
            </h3>
            <p className="mt-2 text-sm text-gray-600">
                続けるにはパスワードを入力してください。
            </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '確認中...' : '入室する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
