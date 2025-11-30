import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isMimeTypeError: boolean;
}

// 檢查是否為 MIME 類型錯誤
function isMimeTypeError(error: Error | null): boolean {
  if (!error) return false;
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('mime type') ||
    errorMessage.includes('module script') ||
    errorMessage.includes('javascript-or-wasm') ||
    errorMessage.includes('failed to fetch dynamically imported module') ||
    errorMessage.includes('expected a javascript')
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isMimeTypeError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isMimeError = isMimeTypeError(error);
    
    // 如果是 MIME 類型錯誤，重定向到 404
    if (isMimeError) {
      // 使用 setTimeout 確保在渲染完成後重定向
      setTimeout(() => {
        window.location.href = '/#/404';
      }, 100);
    }
    
    return { hasError: true, error, isMimeTypeError: isMimeError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 如果是 MIME 類型錯誤，記錄並重定向
    if (isMimeTypeError(error)) {
      console.error('MIME type error detected, redirecting to 404...');
    }
  }

  render() {
    if (this.state.hasError) {
      // 如果是 MIME 類型錯誤，顯示簡短的錯誤訊息（因為會重定向）
      if (this.state.isMimeTypeError) {
        return (
          <div className="flex items-center justify-center min-h-screen p-8 bg-background">
            <div className="flex flex-col items-center w-full max-w-2xl p-8">
              <AlertTriangle
                size={48}
                className="text-destructive mb-6 flex-shrink-0 animate-pulse"
              />
              <h2 className="text-xl mb-4">資源載入錯誤</h2>
              <p className="text-muted-foreground mb-4">正在跳轉到錯誤頁面...</p>
            </div>
          </div>
        );
      }

      // 其他錯誤顯示完整錯誤訊息
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">發生未預期的錯誤</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/#/'}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-secondary text-secondary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <Home size={16} />
                返回首頁
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                重新載入
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
