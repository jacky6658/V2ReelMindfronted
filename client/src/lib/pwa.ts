// PWA Service Worker 注册
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 有新版本可用
                  console.log('[PWA] New service worker available, will activate automatically');
                  // Service Worker 會自動激活（因為使用了 skipWaiting 和 clients.claim）
                  // 用戶下次重新載入頁面時會獲得新版本
                }
              });
            }
          });

          // 定期檢查更新（每小時檢查一次）
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // 1 小時
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// 处理安装提示（保留向后兼容）
let deferredPrompt: any = null;

export function handleInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 可以在这里显示自定义的安装按钮
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
          installButton.style.display = 'none';
        }
      });
    }
  });
}

// 获取 deferredPrompt（供组件使用）
export function getDeferredPrompt() {
  return deferredPrompt;
}

// 清除 deferredPrompt
export function clearDeferredPrompt() {
  deferredPrompt = null;
}

// 检查是否已安装为 PWA
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

