/**
 * 認證模組（已廢棄）
 * 
 * ⚠️ 此檔案已廢棄，請使用 @/stores/authStore 中的 useAuthStore
 * 
 * 此檔案保留僅為了向後兼容性，新的程式碼應該使用：
 * - useAuthStore().getToken() 替代 getToken()
 * - useAuthStore().setToken() 替代 setToken()
 * - useAuthStore().clearAuth() 替代 clearAuth()
 * - useAuthStore().isLoggedIn 替代 isAuthenticated()
 */

import { APP_CONFIG } from './api-config';

const TOKEN_KEY = APP_CONFIG.ACCESS_TOKEN_KEY;
const TOKEN_UPDATED = APP_CONFIG.ACCESS_TOKEN_UPDATED_AT;
const REFRESH_KEY = APP_CONFIG.REFRESH_TOKEN_KEY;

/**
 * 獲取 Access Token（已廢棄）
 * @deprecated 請使用 useAuthStore().getToken()
 */
export function getToken(): string | null {
  console.warn('getToken() 已廢棄，請使用 useAuthStore().getToken()');
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 設置 Access Token（已廢棄）
 * @deprecated 請使用 useAuthStore().setToken()
 */
export function setToken(token: string): void {
  console.warn('setToken() 已廢棄，請使用 useAuthStore().setToken()');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_UPDATED, Date.now().toString());
}

/**
 * 獲取 Refresh Token（已廢棄）
 * @deprecated 請使用 useAuthStore().getRefreshToken()
 */
export function getRefreshToken(): string | null {
  console.warn('getRefreshToken() 已廢棄，請使用 useAuthStore().getRefreshToken()');
  return localStorage.getItem(REFRESH_KEY);
}

/**
 * 設置 Refresh Token（已廢棄）
 * @deprecated 請使用 useAuthStore().setRefreshToken()
 */
export function setRefreshToken(refreshToken: string): void {
  console.warn('setRefreshToken() 已廢棄，請使用 useAuthStore().setRefreshToken()');
  if (!refreshToken) return;
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

/**
 * 清除所有認證資訊（已廢棄）
 * @deprecated 請使用 useAuthStore().clearAuth()
 */
export function clearAuth(): void {
  console.warn('clearAuth() 已廢棄，請使用 useAuthStore().clearAuth()');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_UPDATED);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * 檢查是否已登入（已廢棄）
 * @deprecated 請使用 useAuthStore().isLoggedIn
 */
export function isAuthenticated(): boolean {
  console.warn('isAuthenticated() 已廢棄，請使用 useAuthStore().isLoggedIn');
  return !!getToken();
}

/**
 * 獲取 Token 更新時間
 */
export function getTokenUpdatedAt(): number | null {
  const updated = localStorage.getItem(TOKEN_UPDATED);
  return updated ? parseInt(updated, 10) : null;
}

/**
 * 檢查 Token 是否過期（簡單檢查，實際過期由後端判斷）
 */
export function isTokenExpired(): boolean {
  const updated = getTokenUpdatedAt();
  if (!updated) return true;
  
  // 假設 Token 有效期為 1 小時
  const oneHour = 60 * 60 * 1000;
  return Date.now() - updated > oneHour;
}
