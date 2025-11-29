/**
 * API 客戶端
 * 處理所有與後端的 HTTP 請求
 * 使用 axios 並整合 Zustand authStore
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from './api-config';
import { useAuthStore } from '../stores/authStore';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 包含 cookies
});

// 請求攔截器：在每個請求發送前，檢查是否存在 token 並將其添加到 Authorization header
apiClient.interceptors.request.use(
  (config) => {
    // 從 Zustand store 中獲取 token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器：處理錯誤響應，例如 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 錯誤且尚未重試過，嘗試刷新 token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshToken();

        // 重試原始請求
        const token = useAuthStore.getState().token;
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失敗，清除認證並導向登入頁
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 其他錯誤直接拒絕
    return Promise.reject(error);
  }
);

// CSRF Token 緩存
let csrfTokenCache: string | null = null;

/**
 * 獲取 Cookie
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * 獲取 CSRF Token
 */
export async function getCsrfToken(): Promise<string | null> {
  // 優先從 Cookie 中讀取
  const csrfTokenFromCookie = getCookie('csrf_token');
  if (csrfTokenFromCookie) {
    csrfTokenCache = csrfTokenFromCookie;
    return csrfTokenCache;
  }
  
  // 如果有緩存，直接返回
  if (csrfTokenCache) return csrfTokenCache;
  
  // 從 API 獲取
  try {
    const response = await apiClient.get<{ csrf_token: string }>('/api/auth/csrf-token');
    csrfTokenCache = response.data.csrf_token;
    return csrfTokenCache;
  } catch (e) {
    console.warn('獲取 CSRF Token 失敗:', e);
  }
  return null;
}

/**
 * 清除 CSRF Token 緩存
 */
export function clearCsrfToken() {
  csrfTokenCache = null;
}

/**
 * GET 請求
 */
export async function apiGet<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(endpoint, config);
  return response.data;
}

/**
 * POST 請求
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(endpoint, data, config);
  return response.data;
}

/**
 * PUT 請求
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(endpoint, data, config);
  return response.data;
}

/**
 * DELETE 請求
 */
export async function apiDelete<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(endpoint, config);
  return response.data;
}

/**
 * 流式請求（用於 SSE）
 * 注意：axios 對 SSE 的支援不如原生 fetch，所以這裡仍使用 fetch
 */
export async function apiStream(
  endpoint: string,
  data?: any,
  onMessage?: (chunk: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<void> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;
  
  // 從 Zustand store 獲取 token
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('無法讀取響應流');
    }
    
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete?.();
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // 保留最後一行（可能不完整）
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // 跳過空行
        if (!trimmed) continue;
        
        // 處理 SSE 格式: data: {content}
        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.substring(5).trim();
          
          // 處理 [DONE] 標記
          if (dataStr === '[DONE]') {
            onComplete?.();
            return;
          }
          
          try {
            // 嘗試解析 JSON
            const parsed = JSON.parse(dataStr);
            
            // 過濾掉控制標記（如 {"type": "end"}）
            if (parsed.type === 'end' || parsed.type === 'error' || parsed.type === 'start') {
              return; // 跳過這些控制標記，不發送給 onMessage
            }
            
            const chunk = parsed.chunk || parsed.content || parsed.text || dataStr;
            if (chunk) {
              onMessage?.(chunk);
            }
          } catch {
            // 如果不是 JSON，直接使用原始內容
            // 過濾掉純 JSON 標記（如 {"type": "end"}）
            if (dataStr.trim().startsWith('{') && dataStr.includes('"type"')) {
              return; // 跳過 JSON 標記
            }
            onMessage?.(dataStr);
          }
        } else {
          // 非 SSE 格式，直接使用
          onMessage?.(trimmed);
        }
      }
    }
  } catch (error) {
    onError?.(error as Error);
  }
}
