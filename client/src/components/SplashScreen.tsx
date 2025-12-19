import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // 檢查是否為 PWA 模式
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true ||
                     document.referrer.includes('android-app://');
    
    setIsPWA(checkPWA);
    
    // 檢查是否已經顯示過啟動畫面（使用 sessionStorage，只在當前會話有效）
    const splashShown = sessionStorage.getItem('splash-shown');
    
    if (checkPWA && !splashShown) {
      setShow(true);
      // 標記已顯示過
      sessionStorage.setItem('splash-shown', 'true');
      
      // 2 秒後隱藏啟動畫面
      const timer = setTimeout(() => {
        setShow(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary via-blue-600 to-purple-600 flex items-center justify-center">
      {/* 背景粒子 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* 主內容 */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 animate-fadeIn">
        {/* Logo 容器 */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* 外圈旋轉 */}
          <div className="absolute w-36 h-36 border-4 border-white/30 border-t-white/90 rounded-full animate-spin-slow" />
          {/* 內圈反向旋轉 */}
          <div className="absolute w-24 h-24 border-2 border-white/20 border-b-white/80 rounded-full animate-spin-reverse" />
          {/* Logo 文字 */}
          <div className="relative text-5xl font-extrabold text-white drop-shadow-lg animate-pulse-slow">
            RM
          </div>
        </div>

        {/* 副標題 */}
        <div className="text-white/90 text-lg font-medium animate-fadeInUp">
          AI 短影音智能體
        </div>

        {/* 載入動畫 */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(50px) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out 0.3s both;
        }
        
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

