/**
 * 登入頁面
 * 包含 Google 登入按鈕和推薦碼輸入
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string>('');

  useEffect(() => {
    // 任務 3: 若使用者已登入卻訪問 /login，自動導向 /app
    if (isLoggedIn) {
      navigate('/app', { replace: true });
      return;
    }

    // 從 URL 參數獲取推薦碼（?ref=code）
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      // 儲存到 localStorage，以便在 OAuth 回調時使用
      localStorage.setItem('referral_code', refCode);
      toast.info('已偵測到推薦碼');
    } else {
      // 檢查 localStorage 中是否有推薦碼
      const savedCode = localStorage.getItem('referral_code');
      if (savedCode) {
        setReferralCode(savedCode);
      }
    }
  }, [isLoggedIn, navigate, searchParams]);

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.trim().toUpperCase();
    setReferralCode(code);
    // 儲存到 localStorage
    if (code) {
      localStorage.setItem('referral_code', code);
    } else {
      localStorage.removeItem('referral_code');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 如果有推薦碼，確保儲存到 localStorage
      if (referralCode) {
        localStorage.setItem('referral_code', referralCode);
      }

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
        {/* 推薦碼輸入框 */}
        <div className="mb-4">
          <Label htmlFor="referral-code" className="text-sm text-gray-700 dark:text-gray-300">
            推薦碼（選填）
          </Label>
          <Input
            id="referral-code"
            type="text"
            value={referralCode}
            onChange={handleReferralCodeChange}
            placeholder="輸入推薦碼"
            className="mt-1 w-full"
            maxLength={20}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            輸入推薦碼可獲得額外獎勵
          </p>
        </div>

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

