import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

const PENDING_LICENSE_CODE_KEY = 'pending_activation_code';

function normalizeActivationCode(raw: string) {
  return raw.trim().toUpperCase();
}

export default function LicenseActivate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuthStore();
  const [activating, setActivating] = useState(false);

  const activationCode = useMemo(() => {
    const code =
      searchParams.get('activation_code') ||
      searchParams.get('license') ||
      searchParams.get('license_code') ||
      searchParams.get('code') ||
      '';
    return code ? normalizeActivationCode(code) : '';
  }, [searchParams]);

  useEffect(() => {
    // 如果有 code 但還沒登入：先暫存，登入後在 OAuthCallback 自動啟用
    if (!authLoading && !isLoggedIn) {
      if (!activationCode) return;
      localStorage.setItem(PENDING_LICENSE_CODE_KEY, activationCode);
      toast.info('已保存授權碼，請先登入，登入後將自動啟用', { duration: 5000 });
    }
  }, [authLoading, isLoggedIn, activationCode]);

  useEffect(() => {
    const run = async () => {
      if (authLoading) return;
      if (!activationCode) return;
      if (!isLoggedIn) return;

      try {
        setActivating(true);
        const res = await apiPost<{ success?: boolean; message?: string; error?: string }>(
          '/api/user/license/activate',
          { activation_code: activationCode }
        );

        if ((res as any)?.error) {
          toast.error((res as any).error || '授權啟用失敗');
          return;
        }

        toast.success(res?.message || '授權啟用成功');
        localStorage.removeItem(PENDING_LICENSE_CODE_KEY);
        // 導到個人頁，讓用戶看得到「授權資訊」
        navigate('/profile', { replace: true });
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || '授權啟用失敗，請稍後再試';
        toast.error(msg);
      } finally {
        setActivating(false);
      }
    };

    run();
  }, [authLoading, isLoggedIn, activationCode, navigate]);

  const goLogin = () => {
    if (activationCode) {
      localStorage.setItem(PENDING_LICENSE_CODE_KEY, activationCode);
    }
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">授權碼啟用</h1>

        {!activationCode ? (
          <p className="text-muted-foreground">缺少授權碼，請從信件連結重新開啟。</p>
        ) : authLoading ? (
          <p className="text-muted-foreground">登入狀態檢查中...</p>
        ) : !isLoggedIn ? (
          <>
            <p className="text-muted-foreground mb-4">
              我們已先保存您的授權碼。請先登入，登入後會自動完成授權啟用。
            </p>
            <Button className="w-full" onClick={goLogin}>
              前往登入
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-4">
              正在為您啟用授權碼 <span className="font-mono">{activationCode}</span> ...
            </p>
            <Button className="w-full" disabled>
              {activating ? '啟用中...' : '啟用中...'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}


