/**
 * OAuth 回調頁面
 * 處理 Google OAuth 登入後的回調
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    handleCallback();
  }, [searchParams]);

  const handleCallback = async () => {
    try {
      // 從 URL 獲取授權碼
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('登入失敗');
        navigate('/login', { replace: true });
        return;
      }

      if (!code) {
        toast.error('缺少授權碼');
        navigate('/login', { replace: true });
        return;
      }

      // 任務 3: 調用後端的 OAuth callback 結果 / 使用者資訊 API
      // ❗不要變更任何 OAuth 相關 API 的 URL、Query Params、Body、回傳格式
      // 傳遞完整的 redirect_uri 以便後端判斷使用哪組 Google OAuth 憑證
      const redirect_uri = window.location.origin + '/oauth/callback';
      
      // 從 localStorage 獲取推薦碼
      const referralCode = localStorage.getItem('referral_code');
      
      const response = await apiPost<{
        access_token: string;
        refresh_token: string;
        user: {
          user_id: string;
          email: string;
          name: string;
          picture: string;
          is_subscribed: boolean;
        };
      }>('/api/auth/google/callback', {
        code,
        redirect_uri: redirect_uri,
        referral_code: referralCode || undefined  // 如果有推薦碼，傳遞給後端
      });
      
      // 登入成功後清除推薦碼（避免重複使用）
      if (referralCode) {
        localStorage.removeItem('referral_code');
      }

      // 任務 3: 若成功取得 user + token → 呼叫前端 auth 狀態的 setAuth() 寫入資料
      if (response.user && response.access_token) {
        const subscription = response.user.is_subscribed ? "pro" : "free";
        setAuth({
          user: response.user,
          token: response.access_token,
          subscription: subscription
        });

        toast.success(`歡迎回來，${response.user.name}！`);
        
        // 任務 3: 成功後 navigate("/app")
        navigate('/app', { replace: true });
      } else {
        throw new Error('OAuth callback failed: Incomplete data from backend');
      }
    } catch (error: any) {
      console.error('OAuth 回調處理失敗:', error);
      // 任務 3: 若後端回應失敗，顯示錯誤訊息並導回 /login
      toast.error(error?.message || '登入失敗，請稍後再試');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">登入中...</p>
      </div>
    </div>
  );
}
