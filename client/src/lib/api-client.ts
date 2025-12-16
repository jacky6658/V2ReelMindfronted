/**
 * API 客戶端
 * 處理所有與後端的 HTTP 請求
 * 使用 axios 並整合 Zustand authStore
 * 添加請求隊列和重試機制以支持高並發
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from './api-config';
import { useAuthStore } from '../stores/authStore';

// ===== 請求隊列（限制並發請求數，避免前端過載） =====
class RequestQueue {
  private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 15) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const item = this.queue.shift();
    if (item) {
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.running--;
        // 繼續處理下一個請求
        setTimeout(() => this.process(), 0);
      }
    }
  }
}

const requestQueue = new RequestQueue(15); // 最多 15 個並發請求

// ===== 重試邏輯 =====
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // 如果是 4xx 錯誤（客戶端錯誤），不重試
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error;
      }
      
      // 如果是網絡錯誤或超時，重試
      if (i < maxRetries - 1) {
        const waitTime = delay * (i + 1);
        console.log(`請求失敗，${waitTime}ms 後重試 (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 降低到 30 秒（原本 60 秒）
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 包含 cookies
});

// 請求攔截器：在每個請求發送前，檢查是否存在 token 並將其添加到 Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    // 從 Zustand store 中獲取 token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 對於需要 CSRF Token 的請求（POST/PUT/DELETE/PATCH），添加 CSRF Token
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      // 檢查端點是否在排除列表中（不需要 CSRF Token）
      const excludedPaths = [
        '/api/csrf-token',
        '/api/auth/refresh',
        '/api/auth/google/callback',
        '/api/memory/long-term',
        '/api/ip-planning/',
        '/api/scripts/',                // 我的腳本相關端點：與後端 CSRF 排除規則一致
        '/api/planning-days/',          // 14 天規劃日曆相關端點
        '/api/user/notifications/',     // 通知標記已讀
        '/api/user/subscription/auto-renew', // 自動續費開關
        '/api/user/usage-event',        // 使用事件記錄
        '/api/generations',             // 生成記錄新增 / 刪除
        '/api/user/referral/bind',      // 手動綁定推薦碼
        '/api/admin/',
        '/api/mode3/',
        '/api/chat/stream',
        '/api/generate/',
      ];
      
      const needsCsrf = !excludedPaths.some(path => config.url?.startsWith(path));
      
      if (needsCsrf) {
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        } else {
          console.warn('[API Client] 無法獲取 CSRF Token，請求可能失敗', {
            url: config.url,
            method: config.method
          });
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器：處理錯誤響應，例如 401 Unauthorized 和 403 CSRF Token 驗證失敗
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

    // 如果是 403 錯誤，可能是 CSRF Token 驗證失敗，嘗試刷新並重試
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || '';
      const isCsrfError = errorMessage.includes('CSRF') || 
                         errorMessage.includes('csrf') || 
                         errorMessage.includes('Token') ||
                         errorMessage.includes('驗證失敗');
      
      // 對於 POST/PUT/DELETE/PATCH 請求，如果是 403 錯誤，都嘗試刷新 CSRF Token
      const isModifyingRequest = ['post', 'put', 'delete', 'patch'].includes(
        (originalRequest.method || '').toLowerCase()
      );
      
      if (isCsrfError || (isModifyingRequest && !originalRequest.url?.includes('/api/admin/'))) {
        originalRequest._csrfRetry = true;
        
        console.log('[API Client] 檢測到 403 錯誤，嘗試刷新 CSRF Token 並重試', {
          url: originalRequest.url,
          method: originalRequest.method,
          errorMessage,
          isCsrfError,
          isModifyingRequest
        });
        
        // 清除 CSRF Token 緩存並強制刷新
        clearCsrfToken();
        
        // 重新獲取 CSRF Token（強制刷新）
        const csrfToken = await getCsrfToken(true);
        if (csrfToken) {
          console.log('[API Client] 成功獲取新的 CSRF Token，重試請求');
          // 更新請求的 CSRF Token header
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
          // 重試原始請求
          return apiClient(originalRequest);
        } else {
          console.warn('[API Client] 無法獲取新的 CSRF Token');
        }
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
 * @param forceRefresh 是否強制刷新（忽略緩存）
 */
export async function getCsrfToken(forceRefresh: boolean = false): Promise<string | null> {
  // 如果強制刷新，清除緩存
  if (forceRefresh) {
    csrfTokenCache = null;
  } else {
    // 優先從 Cookie 中讀取
    const csrfTokenFromCookie = getCookie('csrf_token');
    if (csrfTokenFromCookie) {
      csrfTokenCache = csrfTokenFromCookie;
      return csrfTokenCache;
    }
    
    // 如果有緩存，直接返回
    if (csrfTokenCache) return csrfTokenCache;
  }
  
  // 從 API 獲取
  try {
    const response = await apiClient.get<{ csrf_token: string }>('/api/csrf-token');
    csrfTokenCache = response.data.csrf_token;
    console.log('[API Client] 成功獲取 CSRF Token', { forceRefresh });
    return csrfTokenCache;
  } catch (e: any) {
    console.error('[API Client] 獲取 CSRF Token 失敗:', {
      error: e?.message,
      status: e?.response?.status,
      url: '/api/csrf-token',
      forceRefresh
    });
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
 * GET 請求（使用隊列和重試）
 */
export async function apiGet<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return requestQueue.add(() =>
    retryRequest(() => apiClient.get<T>(endpoint, config).then(res => res.data))
  );
}

/**
 * POST 請求（使用隊列和重試）
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return requestQueue.add(() =>
    retryRequest(() => apiClient.post<T>(endpoint, data, config).then(res => res.data))
  );
}

/**
 * PUT 請求（使用隊列和重試）
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return requestQueue.add(() =>
    retryRequest(() => apiClient.put<T>(endpoint, data, config).then(res => res.data))
  );
}

/**
 * DELETE 請求（使用隊列和重試）
 */
export async function apiDelete<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return requestQueue.add(() =>
    retryRequest(() => apiClient.delete<T>(endpoint, config).then(res => res.data))
  );
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
      // 嘗試解析錯誤響應的 JSON
      let errorData: any = null;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
      } catch (e) {
        errorData = { error: `HTTP ${response.status}` };
      }
      
      // 創建一個包含 status 和 response data 的錯誤對象
      const error = new Error(errorData?.error || `HTTP ${response.status}`) as any;
      error.status = response.status;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      throw error;
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
            
            // 處理不同類型的消息
            if (parsed.type === 'token' && parsed.content) {
              // 流式 token 消息，發送內容
              onMessage?.(parsed.content);
            } else if (parsed.type === 'error') {
              // 根本修复：增强错误消息传递，包含更多错误信息
              const errorMessage = parsed.message || parsed.content || '發生錯誤';
              const error = new Error(errorMessage) as any;
              
              // 传递额外的错误信息
              error.error_code = parsed.error_code;
              error.is_quota_error = parsed.is_quota_error;
              error.original_error = parsed.original_error;
              error.content = parsed.content; // 确保 content 也被传递
              
              console.error('[API Client] 收到流式錯誤:', {
                type: parsed.type,
                message: parsed.message,
                content: parsed.content,
                error_code: parsed.error_code,
                is_quota_error: parsed.is_quota_error,
                original_error: parsed.original_error
              });
              
              onError?.(error);
            } else if (parsed.type === 'end') {
              // 結束標記，觸發 onComplete
              onComplete?.();
            } else if (parsed.type === 'start') {
              // 開始標記，不做任何處理，繼續等待後續消息
              continue;
            } else {
              // 其他類型，嘗試提取內容
              const chunk = parsed.chunk || parsed.content || parsed.text;
              if (chunk) {
                onMessage?.(chunk);
              }
            }
          } catch {
            // 如果不是 JSON，直接使用原始內容
            // 過濾掉純 JSON 標記（如 {"type": "end"}）
            if (dataStr.trim().startsWith('{') && dataStr.includes('"type"')) {
              continue; // 跳過 JSON 標記，繼續處理下一行
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
