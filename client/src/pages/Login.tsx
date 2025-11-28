/**
 * 登入頁面
 * 包含 Google 登入按鈕
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // 任務 3: 若使用者已登入卻訪問 /login，自動導向 /app
    if (isLoggedIn) {
      navigate('/app', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleGoogleLogin = async () => {
    try {
      // 任務 3: 按下「使用 Google 登入」按鈕時，直接導向後端的 OAuth URL
      // 使用新版前端的專用端點 /api/auth/google-new
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google-new');
      // 重定向到 Google 登入頁面
      window.location.href = auth_url;
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error('登入失敗，請稍後再試');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">登入 ReelMind</h1>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
        >
          使用 Google 登入
        </button>
        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          登入後即可開始使用 ReelMind 智能體功能
        </p>
      </div>
    </div>
  );
};

export default Login;

