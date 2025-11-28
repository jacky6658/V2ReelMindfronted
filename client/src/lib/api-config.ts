/**
 * API 配置
 * 根據環境自動切換 API 端點
 */

const isLocalDev = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0';

export const API_BASE_URL = isLocalDev 
  ? 'http://127.0.0.1:8000'  // 本地測試
  : 'https://api.aijob.com.tw';  // 正式版後端

export const APP_CONFIG = {
  API_BASE: API_BASE_URL,
  ACCESS_TOKEN_KEY: 'ipPlanningToken',
  ACCESS_TOKEN_UPDATED_AT: 'ipPlanningTokenUpdated',
  REFRESH_TOKEN_KEY: 'ipPlanningRefreshToken'
} as const;

// 調試輸出
if (import.meta.env.DEV) {
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] Environment:', isLocalDev ? 'Development' : 'Production');
}
