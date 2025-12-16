import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download } from 'lucide-react';
import { isInstalled } from '@/lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    if (isInstalled()) {
      return;
    }

    // 检测设备类型
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 检查是否已经关闭过提示（24小时内不重复显示）
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const dismissed = new Date(dismissedTime);
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return; // 24小时内不重复显示
      }
    }

    // 监听 beforeinstallprompt 事件（Android Chrome）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Android 设备延迟显示，避免干扰首次访问体验
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // 5秒后显示
    };

    // 对于 iOS，直接显示提示（因为 iOS 不支持 beforeinstallprompt）
    if (isIOSDevice) {
      // 延迟显示，避免干扰首次访问体验
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // 5秒后显示
      return () => clearTimeout(timer);
    }

    // Android Chrome 监听安装提示事件
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android Chrome 安装流程
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('用户接受了安装提示');
      } else {
        console.log('用户拒绝了安装提示');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 记录关闭时间
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">安裝 ReelMind App</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {isIOS ? (
                  <>
                    將 ReelMind 加入主畫面，隨時隨地使用 AI 短影音智能體
                  </>
                ) : isAndroid ? (
                  <>
                    將 ReelMind 安裝到手機，享受更流暢的使用體驗
                  </>
                ) : (
                  <>
                    將 ReelMind 安裝到設備，享受更快速的使用體驗
                  </>
                )}
              </p>
              
              {isIOS ? (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">1.</span>
                    <span>點擊瀏覽器底部的</span>
                    <span className="font-semibold text-primary">分享</span>
                    <span>按鈕</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">2.</span>
                    <span>選擇</span>
                    <span className="font-semibold text-primary">「加入主畫面」</span>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="w-full mt-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  立即安裝
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

