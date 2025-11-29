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
