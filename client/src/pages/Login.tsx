/**
 * 登入頁面
 * 包含 Google 登入按鈕和推薦碼輸入
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
    // 若使用者已登入卻訪問 /login，自動導向 /app
    if (isLoggedIn) {
      navigate('/app', { replace: true });
      return;
    }
  }, [isLoggedIn, navigate]);

  const handleGoogleLogin = async () => {
    try {
      // 顯示載入提示
      const loadingToast = toast.loading('正在連接登入服務...');
      
      // 直接調用 Google 登入 API，設置較短的超時時間（10秒）
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google-new', {
        timeout: 10000 // 10 秒超時
      });
      
      toast.dismiss(loadingToast);
      
      // 重定向到 Google 登入頁面
      window.location.href = auth_url;
    } catch (error: any) {
      console.error('登入失敗:', error);
      
      // 根據錯誤類型提供不同的錯誤訊息
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toast.error('連接超時，請檢查網絡連接或稍後再試');
      } else if (error?.response?.status === 500) {
        toast.error('後端服務錯誤，請聯繫管理員');
      } else if (error?.response?.status === 404) {
        toast.error('登入服務不可用，請檢查後端服務是否運行');
      } else if (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK') {
        toast.error('網絡連接失敗，請檢查網絡連接');
      } else {
        toast.error('登入失敗，請稍後再試');
      }
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
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-500">
          如需輸入推薦碼，請在登入後前往個人資料頁面設定
        </p>
      </div>
    </div>
  );
};

export default Login;

