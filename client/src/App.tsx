import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ColorThemeProvider } from "./contexts/ColorThemeContext";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const updateLastActivity = useAuthStore((state) => state.updateLastActivity);
  const checkIdleTimeout = useAuthStore((state) => state.checkIdleTimeout);
  const logout = useAuthStore((state) => state.logout);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 檢查 URL 參數中的推薦碼
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // 立即保存推薦碼到 localStorage（不阻塞 UI）
      localStorage.setItem('referral_code', refCode.toUpperCase());
      console.log('[推薦碼] 已從 URL 參數保存推薦碼:', refCode);
      
      // 顯示提示訊息
      toast.info('推薦碼已自動保存，登入後將自動綁定', {
        duration: 5000
      });
      
      // 清除 URL 參數（避免重複處理）
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
    
    // 在應用程式啟動時，嘗試從 localStorage 獲取 token 並驗證登入狀態
    // 使用 setTimeout 确保不会阻塞初始渲染
    const timer = setTimeout(() => {
      fetchCurrentUser().catch(() => {
        // 如果失败，确保 loading 状态被清除
        useAuthStore.setState({ loading: false });
      });
    }, 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在組件掛載時執行一次

  // 24小時閒置自動登出機制
  useEffect(() => {
    if (!isLoggedIn) {
      // 如果未登入，清除檢查間隔
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // 檢查啟動時的閒置狀態
    if (checkIdleTimeout()) {
      toast.info('您已閒置超過 24 小時，系統將自動登出', { duration: 3000 });
      setTimeout(() => {
        logout();
      }, 1000);
      return;
    }

    // 設置定期檢查（每 5 分鐘檢查一次）
    checkIntervalRef.current = setInterval(() => {
      if (checkIdleTimeout()) {
        toast.info('您已閒置超過 24 小時，系統將自動登出', { duration: 3000 });
        setTimeout(() => {
          logout();
        }, 1000);
      }
    }, 5 * 60 * 1000); // 每 5 分鐘檢查一次

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isLoggedIn, checkIdleTimeout, logout]);

  // 監聽用戶活動（滑鼠移動、鍵盤輸入、點擊、滾動等）
  useEffect(() => {
    if (!isLoggedIn) return;

    // 節流函數：避免過於頻繁更新
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttleDelay = 60000; // 每 1 分鐘最多更新一次

    const handleUserActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        updateLastActivity();
        throttleTimer = null;
      }, throttleDelay);
    };

    // 監聽各種用戶活動事件
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 頁面可見性變化時也更新活動時間
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isLoggedIn, updateLastActivity]);

  // 全局錯誤處理：捕獲動態導入失敗和 MIME 類型錯誤
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      const errorMessage = typeof error === 'string' ? error : error?.message || '';
      
      // 檢查是否為 MIME 類型錯誤
      if (
        errorMessage.includes('MIME type') ||
        errorMessage.includes('module script') ||
        errorMessage.includes('javascript-or-wasm') ||
        errorMessage.includes('Failed to fetch dynamically imported module')
      ) {
        console.error('MIME type error detected, redirecting to 404...', error);
        event.preventDefault(); // 阻止默認錯誤處理
        window.location.href = '/#/404';
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMessage = reason?.message || String(reason || '');
      
      // 檢查是否為 MIME 類型錯誤
      if (
        errorMessage.includes('MIME type') ||
        errorMessage.includes('module script') ||
        errorMessage.includes('javascript-or-wasm') ||
        errorMessage.includes('Failed to fetch dynamically imported module')
      ) {
        console.error('MIME type error in promise rejection, redirecting to 404...', reason);
        event.preventDefault(); // 阻止默認錯誤處理
        window.location.href = '/#/404';
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 路由切換時自動滾動到頁面頂部，避免有時候停在中間或底部
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ColorThemeProvider>
        <ThemeProvider
          defaultTheme="dark"
          switchable
        >
          {/* AuthProvider 已移除，由 Zustand 全局管理 */}
          <TooltipProvider>
            <Toaster />
            <RouterProvider router={router} />
          </TooltipProvider>
        </ThemeProvider>
      </ColorThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
