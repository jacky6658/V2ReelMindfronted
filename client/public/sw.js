// Service Worker for ReelMind PWA
// 更新版本號以觸發 Service Worker 更新（當有新版本時，請更新此版本號）
const CACHE_NAME = 'reelmind-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/images/android-chrome-192x192.png',
  '/assets/images/android-chrome-512x512.png',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache addAll failed:', error);
      })
  );
  // 立即激活新的 Service Worker，確保用戶獲得最新版本
  self.skipWaiting();
});

// 拦截请求，使用缓存（Network First 策略，確保獲取最新內容）
self.addEventListener('fetch', (event) => {
  // 跳過非 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 如果網絡請求成功，更新緩存並返回響應
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 如果網絡請求失敗，嘗試從緩存獲取
        return caches.match(event.request);
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // 立即控制所有客户端，確保新版本立即生效
      return self.clients.claim();
    })
  );
  console.log('[SW] Service worker activated');
});

// 监听来自主线程的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

