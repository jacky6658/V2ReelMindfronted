/**
 * 認證狀態管理 (Zustand)
 * 取代原有的 AuthContext，提供更輕量且高效的狀態管理
 * 
 * 選擇 Zustand 的原因：
 * 1. 輕量級且易於使用，學習曲線平緩
 * 2. 性能優異，避免不必要的重新渲染
 * 3. 不依賴 React Context，可以在組件外部使用 store
 * 4. 對於 SPA 應用程式，它提供了更靈活和高效的狀態管理方案
 */

import { create } from 'zustand';
import { apiGet, apiPost } from '@/lib/api-client';
import { APP_CONFIG } from '@/lib/api-config';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  is_subscribed: boolean;
}

type Subscription = "free" | "pro" | null;

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  subscription: Subscription;
  loading: boolean;
  setAuth: (data: { user: User; token: string; subscription?: Subscription }) => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
  // Token 管理輔助函數
  getToken: () => string | null;
  setToken: (token: string) => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (refreshToken: string) => void;
  clearAuth: () => void;
}

const TOKEN_KEY = APP_CONFIG.ACCESS_TOKEN_KEY;
const TOKEN_UPDATED = APP_CONFIG.ACCESS_TOKEN_UPDATED_AT;
const REFRESH_KEY = APP_CONFIG.REFRESH_TOKEN_KEY;

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  subscription: null,
  loading: true,

  // Token 管理輔助函數
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string) => {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_UPDATED, Date.now().toString());
    set({ token });
  },

  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken: (refreshToken: string) => {
    if (!refreshToken) return;
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_UPDATED);
    localStorage.removeItem(REFRESH_KEY);
    set({ 
      isLoggedIn: false, 
      user: null, 
      token: null, 
      subscription: null,
      loading: false 
    });
  },

  setAuth: ({ user, token, subscription = null }) => {
    get().setToken(token);
    // 根據 user.is_subscribed 判斷 subscription 等級
    const subLevel: Subscription = subscription || (user.is_subscribed ? "pro" : "free");
    set({ 
      isLoggedIn: true, 
      user, 
      token, 
      subscription: subLevel,
      loading: false 
    });
  },

  logout: async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (error) {
      console.error('登出 API 調用失敗:', error);
    } finally {
      // 即使 API 調用失敗，也清除本地狀態
      get().clearAuth();
    }
  },

  fetchCurrentUser: async () => {
    const token = get().getToken();
    if (!token) {
      get().clearAuth();
      return;
    }

    try {
      // ❗不要更改任何後端 API 路徑
      const userData = await apiGet<User>('/api/auth/me');
      const subLevel: Subscription = userData.is_subscribed ? "pro" : "free";
      set({ 
        isLoggedIn: true, 
        user: userData, 
        token, 
        subscription: subLevel,
        loading: false 
      });
    } catch (error: any) {
      // 如果是 401 錯誤，表示未登入，不顯示錯誤訊息
      if (error?.response?.status !== 401) {
        console.error('載入用戶資訊失敗:', error);
      }
      get().clearAuth();
    }
  },

  refreshToken: async () => {
    try {
      const refresh_token = get().getRefreshToken();
      if (!refresh_token) {
        throw new Error('No refresh token');
      }

      const response = await apiPost<{
        access_token: string;
        refresh_token: string;
      }>('/api/auth/refresh', { refresh_token });

      get().setToken(response.access_token);
      get().setRefreshToken(response.refresh_token);

      // 刷新後重新獲取用戶資訊
      await get().fetchCurrentUser();
    } catch (error) {
      console.error('刷新 token 失敗:', error);
      get().clearAuth();
    }
  },
}));
