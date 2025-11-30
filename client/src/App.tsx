import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ColorThemeProvider } from "./contexts/ColorThemeContext";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import { useEffect } from "react";

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    // 在應用程式啟動時，嘗試從 localStorage 獲取 token 並驗證登入狀態
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在組件掛載時執行一次

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
