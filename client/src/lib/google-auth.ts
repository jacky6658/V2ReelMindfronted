/**
 * Google OAuth 認證模組（已廢棄）
 * 
 * ⚠️ 此檔案已廢棄，OAuth 登入流程現在由以下檔案處理：
 * - @/pages/Login.tsx - 處理登入按鈕點擊
 * - @/pages/OAuthCallback.tsx - 處理 OAuth 回調
 * 
 * 新的登入流程：
 * 1. 用戶點擊登入按鈕 → 調用 /api/auth/google 獲取 auth_url
 * 2. 重定向到 Google OAuth 頁面
 * 3. Google 回調到 /auth/callback
 * 4. OAuthCallback.tsx 處理回調並更新 authStore
 */

import { API_BASE_URL } from './api-config';
import { setToken, setRefreshToken } from './auth';

let loginWindow: Window | null = null;

/**
 * Google OAuth 登入（已廢棄）
 * @deprecated 請在 Login.tsx 中使用 apiGet('/api/auth/google') 獲取 auth_url
 */
export async function googleLogin(): Promise<void> {
  console.warn('googleLogin() 已廢棄，請在 Login.tsx 中使用新的登入流程');
  
  // 從環境變數獲取 Google OAuth 配置
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  
  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID 未設定');
    alert('Google 登入配置錯誤，請聯繫管理員');
    return;
  }
  
  if (!redirectUri) {
    console.error('VITE_GOOGLE_REDIRECT_URI 未設定');
    alert('Google 登入配置錯誤，請聯繫管理員');
    return;
  }
  
  // 直接生成 Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: frontendUrl, // 使用前端的環境變數
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // 直接導向到 Google OAuth 頁面（不使用彈窗）
  window.location.href = authUrl;
}

/**
 * 處理 OAuth 回調訊息（已廢棄）
 * @deprecated OAuth 回調現在由 OAuthCallback.tsx 處理
 */
export function setupOAuthListener(): void {
  console.warn('setupOAuthListener() 已廢棄，OAuth 回調現在由 OAuthCallback.tsx 處理');
  
  // 監聽來自彈窗的訊息
  window.addEventListener('message', async (event) => {
    // 只接受同源訊息
    if (event.origin !== window.location.origin) return;
    
    const data = event.data;
    
    if (data.type === 'GOOGLE_AUTH_SUCCESS') {
      const token = data.ipPlanningToken || data.accessToken;
      const refreshToken = data.refreshToken || data.refresh_token;
      
      if (token) {
        setToken(token);
        if (refreshToken) {
          setRefreshToken(refreshToken);
        }
        
        // 關閉彈窗
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close();
        }
        
        // 派發登入成功事件
        window.dispatchEvent(new CustomEvent('auth:logged-in'));
        
        // 刷新頁面或更新 UI
        window.location.reload();
      }
    }
  });
  
  // 使用 BroadcastChannel（如果支援）
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('auth');
    
    channel.onmessage = (event) => {
      const msg = event.data;
      
      if (msg.type === 'login-success') {
        if (msg.access_token) {
          setToken(msg.access_token);
        }
        if (msg.refresh_token) {
          setRefreshToken(msg.refresh_token);
        }
        
        window.dispatchEvent(new CustomEvent('auth:logged-in'));
        window.location.reload();
      }
    };
  }
}
