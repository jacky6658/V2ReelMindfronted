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
    // 根本修复：增强错误日志，记录详细信息以便诊断
    console.error('=== ErrorBoundary 捕获到错误 ===');
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('组件堆栈:', errorInfo.componentStack);
    console.error('错误对象:', error);
    console.error('错误信息:', errorInfo);
    
    // 尝试识别错误类型
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    if (errorMessage.includes('maximum update depth exceeded') || 
        errorStack.includes('maximum update depth')) {
      console.error('⚠️ 检测到无限渲染循环！这通常是由于 useEffect 依赖项或状态更新导致的。');
    }
    
    if (errorMessage.includes('cannot read') || 
        errorMessage.includes('undefined') ||
        errorMessage.includes('null')) {
      console.error('⚠️ 检测到空值访问错误！可能是某个属性未定义。');
    }
    
    if (errorMessage.includes('rendering') || 
        errorMessage.includes('render')) {
      console.error('⚠️ 检测到渲染错误！可能是组件在渲染时抛出异常。');
    }
    
    // 如果是 MIME 類型錯誤，記錄並重定向
    if (isMimeTypeError(error)) {
      console.error('MIME type error detected, redirecting to 404...');
    }
    
    // 尝试发送错误到后端（如果可能）
    try {
      // 这里可以添加错误上报逻辑
      if (typeof window !== 'undefined' && window.navigator?.sendBeacon) {
        const errorData = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        // 使用 sendBeacon 发送错误（不阻塞页面）
        window.navigator.sendBeacon(
          '/api/error-log',
          JSON.stringify(errorData)
        );
      }
    } catch (reportError) {
      console.warn('无法上报错误:', reportError);
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

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-4 max-h-64">
              <div className="text-sm font-semibold mb-2 text-destructive">錯誤訊息:</div>
              <pre className="text-sm text-muted-foreground whitespace-break-spaces mb-4">
                {this.state.error?.message || '未知錯誤'}
              </pre>
              
              <details className="mt-4">
                <summary className="text-sm font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                  查看詳細堆栈信息
                </summary>
                <pre className="text-xs text-muted-foreground whitespace-break-spaces mt-2">
                  {this.state.error?.stack || '無堆栈信息'}
                </pre>
              </details>
            </div>
            
            <div className="p-3 w-full rounded bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                💡 <strong>提示：</strong>如果此錯誤持續出現，請嘗試：
                <br />1. 清除瀏覽器緩存並重新載入
                <br />2. 檢查瀏覽器主控台的詳細錯誤信息
                <br />3. 如果問題持續，請聯繫技術支援
              </p>
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
