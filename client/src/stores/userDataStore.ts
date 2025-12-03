/**
 * 用戶數據全局管理 Store (Zustand)
 * 在用戶登入後自動預載入所有數據，避免各頁面重複載入
 */

import { create } from 'zustand';
import { apiGet } from '@/lib/api-client';

// 數據類型定義
export interface Script {
  id: string;
  script_name?: string;
  title?: string;
  content: string;
  platform?: string;
  topic?: string;
  profile?: string;
  created_at: string;
  updated_at: string;
}

export interface IPPlanningResult {
  id: string;
  result_type: 'profile' | 'plan' | 'scripts';
  title: string;
  content: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  mode: string;
  summary: string;
  message_count: number;
  created_at: string;
}

export interface Generation {
  platform: string;
  topic: string;
  content: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total: {
    scripts: number;
    conversations: number;
    generations: number;
  };
  recent: {
    scripts: number;
    conversations: number;
    generations: number;
  };
}

interface UserDataState {
  // 數據狀態
  scripts: Script[];
  ipPlanningResults: IPPlanningResult[];
  conversations: Conversation[];
  generations: Generation[];
  analyticsOverview: AnalyticsOverview | null;
  
  // 載入狀態
  loading: {
    scripts: boolean;
    ipPlanning: boolean;
    conversations: boolean;
    generations: boolean;
    analytics: boolean;
  };
  
  // 錯誤狀態
  errors: {
    scripts: string | null;
    ipPlanning: string | null;
    conversations: string | null;
    generations: string | null;
    analytics: string | null;
  };
  
  // 最後更新時間
  lastUpdated: {
    scripts: number | null;
    ipPlanning: number | null;
    conversations: number | null;
    generations: number | null;
    analytics: number | null;
  };
  
  // 是否正在預載入
  isPreloading: boolean;
  
  // Actions
  loadScripts: (userId: string, force?: boolean) => Promise<void>;
  loadIPPlanningResults: (userId: string, force?: boolean) => Promise<void>;
  loadConversations: (userId: string, force?: boolean) => Promise<void>;
  loadGenerations: (userId: string, force?: boolean) => Promise<void>;
  loadAnalytics: (userId: string, force?: boolean) => Promise<void>;
  preloadAllData: (userId: string) => Promise<void>;
  clearAllData: () => void;
  refreshAllData: (userId: string) => Promise<void>;
}

// 數據緩存時間（毫秒）- 5 分鐘內不重新載入
const CACHE_DURATION = 5 * 60 * 1000;

export const useUserDataStore = create<UserDataState>((set, get) => ({
  // 初始狀態
  scripts: [],
  ipPlanningResults: [],
  conversations: [],
  generations: [],
  analyticsOverview: null,
  
  loading: {
    scripts: false,
    ipPlanning: false,
    conversations: false,
    generations: false,
    analytics: false,
  },
  
  errors: {
    scripts: null,
    ipPlanning: null,
    conversations: null,
    generations: null,
    analytics: null,
  },
  
  lastUpdated: {
    scripts: null,
    ipPlanning: null,
    conversations: null,
    generations: null,
    analytics: null,
  },
  
  isPreloading: false,
  
  // 載入腳本列表
  loadScripts: async (userId: string, force: boolean = false) => {
    const state = get();
    
    // 檢查緩存
    if (!force && state.lastUpdated.scripts) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.scripts;
      if (timeSinceUpdate < CACHE_DURATION) {
        console.log('[UserDataStore] 使用緩存的腳本數據');
        return;
      }
    }
    
    // 如果正在載入，跳過
    if (state.loading.scripts) {
      return;
    }
    
    set({ loading: { ...state.loading, scripts: true }, errors: { ...state.errors, scripts: null } });
    
    try {
      const data = await apiGet<{ scripts: Script[] }>('/api/scripts/my', { timeout: 30000 });
      set({
        scripts: data.scripts || [],
        loading: { ...state.loading, scripts: false },
        errors: { ...state.errors, scripts: null },
        lastUpdated: { ...state.lastUpdated, scripts: Date.now() },
      });
      console.log('[UserDataStore] 腳本數據載入成功:', data.scripts?.length || 0, '個');
    } catch (error: any) {
      console.error('[UserDataStore] 載入腳本失敗:', error);
      set({
        loading: { ...state.loading, scripts: false },
        errors: { ...state.errors, scripts: error?.message || '載入失敗' },
      });
    }
  },
  
  // 載入 IP 人設規劃結果
  loadIPPlanningResults: async (userId: string, force: boolean = false) => {
    const state = get();
    
    // 檢查緩存
    if (!force && state.lastUpdated.ipPlanning) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.ipPlanning;
      if (timeSinceUpdate < CACHE_DURATION) {
        console.log('[UserDataStore] 使用緩存的 IP 規劃數據');
        return;
      }
    }
    
    // 如果正在載入，跳過
    if (state.loading.ipPlanning) {
      return;
    }
    
    set({ loading: { ...state.loading, ipPlanning: true }, errors: { ...state.errors, ipPlanning: null } });
    
    try {
      const data = await apiGet<{ results: IPPlanningResult[] }>('/api/ip-planning/my', { timeout: 30000 });
      set({
        ipPlanningResults: data.results || [],
        loading: { ...state.loading, ipPlanning: false },
        errors: { ...state.errors, ipPlanning: null },
        lastUpdated: { ...state.lastUpdated, ipPlanning: Date.now() },
      });
      console.log('[UserDataStore] IP 規劃數據載入成功:', data.results?.length || 0, '個');
    } catch (error: any) {
      console.error('[UserDataStore] 載入 IP 規劃失敗:', error);
      // 403 錯誤是正常的（權限不足），不記錄為錯誤
      if (error?.response?.status !== 403 && error?.response?.status !== 401) {
        set({
          loading: { ...state.loading, ipPlanning: false },
          errors: { ...state.errors, ipPlanning: error?.message || '載入失敗' },
        });
      } else {
        set({
          loading: { ...state.loading, ipPlanning: false },
          errors: { ...state.errors, ipPlanning: null },
        });
      }
    }
  },
  
  // 載入對話記錄
  loadConversations: async (userId: string, force: boolean = false) => {
    const state = get();
    
    // 檢查緩存
    if (!force && state.lastUpdated.conversations) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.conversations;
      if (timeSinceUpdate < CACHE_DURATION) {
        console.log('[UserDataStore] 使用緩存的對話記錄數據');
        return;
      }
    }
    
    // 如果正在載入，跳過
    if (state.loading.conversations) {
      return;
    }
    
    set({ loading: { ...state.loading, conversations: true }, errors: { ...state.errors, conversations: null } });
    
    try {
      const data = await apiGet<{ user_id: string; conversations: Conversation[] }>(`/api/user/conversations/${userId}`, { timeout: 30000 });
      set({
        conversations: data.conversations || [],
        loading: { ...state.loading, conversations: false },
        errors: { ...state.errors, conversations: null },
        lastUpdated: { ...state.lastUpdated, conversations: Date.now() },
      });
      console.log('[UserDataStore] 對話記錄載入成功:', data.conversations?.length || 0, '個');
    } catch (error: any) {
      console.error('[UserDataStore] 載入對話記錄失敗:', error);
      // 403/401 錯誤是正常的，不記錄為錯誤
      if (error?.response?.status !== 403 && error?.response?.status !== 401) {
        set({
          loading: { ...state.loading, conversations: false },
          errors: { ...state.errors, conversations: error?.message || '載入失敗' },
        });
      } else {
        set({
          loading: { ...state.loading, conversations: false },
          errors: { ...state.errors, conversations: null },
        });
      }
    }
  },
  
  // 載入生成記錄
  loadGenerations: async (userId: string, force: boolean = false) => {
    const state = get();
    
    // 檢查緩存
    if (!force && state.lastUpdated.generations) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.generations;
      if (timeSinceUpdate < CACHE_DURATION) {
        console.log('[UserDataStore] 使用緩存的生成記錄數據');
        return;
      }
    }
    
    // 如果正在載入，跳過
    if (state.loading.generations) {
      return;
    }
    
    set({ loading: { ...state.loading, generations: true }, errors: { ...state.errors, generations: null } });
    
    try {
      const data = await apiGet<{ user_id: string; generations: Generation[] }>(`/api/user/generations/${userId}`, { timeout: 30000 });
      set({
        generations: data.generations || [],
        loading: { ...state.loading, generations: false },
        errors: { ...state.errors, generations: null },
        lastUpdated: { ...state.lastUpdated, generations: Date.now() },
      });
      console.log('[UserDataStore] 生成記錄載入成功:', data.generations?.length || 0, '個');
    } catch (error: any) {
      console.error('[UserDataStore] 載入生成記錄失敗:', error);
      // 403/401 錯誤是正常的，不記錄為錯誤
      if (error?.response?.status !== 403 && error?.response?.status !== 401) {
        set({
          loading: { ...state.loading, generations: false },
          errors: { ...state.errors, generations: error?.message || '載入失敗' },
        });
      } else {
        set({
          loading: { ...state.loading, generations: false },
          errors: { ...state.errors, generations: null },
        });
      }
    }
  },
  
  // 載入統計數據
  loadAnalytics: async (userId: string, force: boolean = false) => {
    const state = get();
    
    // 檢查緩存
    if (!force && state.lastUpdated.analytics) {
      const timeSinceUpdate = Date.now() - (state.lastUpdated.analytics || 0);
      if (timeSinceUpdate < CACHE_DURATION) {
        console.log('[UserDataStore] 使用緩存的統計數據');
        return;
      }
    }
    
    // 如果正在載入，跳過
    if (state.loading.analytics) {
      return;
    }
    
    set({ loading: { ...state.loading, analytics: true }, errors: { ...state.errors, analytics: null } });
    
    try {
      const data = await apiGet<AnalyticsOverview>('/api/user/analytics/overview', { timeout: 30000 });
      set({
        analyticsOverview: data,
        loading: { ...state.loading, analytics: false },
        errors: { ...state.errors, analytics: null },
        lastUpdated: { ...state.lastUpdated, analytics: Date.now() },
      });
      console.log('[UserDataStore] 統計數據載入成功');
    } catch (error: any) {
      console.error('[UserDataStore] 載入統計數據失敗:', error);
      set({
        loading: { ...state.loading, analytics: false },
        errors: { ...state.errors, analytics: error?.message || '載入失敗' },
      });
    }
  },
  
  // 預載入所有數據（並行載入，不阻塞）
  preloadAllData: async (userId: string) => {
    const state = get();
    
    // 如果正在預載入，跳過
    if (state.isPreloading) {
      console.log('[UserDataStore] 已在預載入中，跳過');
      return;
    }
    
    set({ isPreloading: true });
    console.log('[UserDataStore] 開始預載入所有用戶數據...');
    
    try {
      // 並行載入所有數據（不等待完成，讓它們在背景執行）
      const promises = [
        get().loadScripts(userId),
        get().loadIPPlanningResults(userId),
        get().loadConversations(userId),
        get().loadGenerations(userId),
        // 統計數據可選，因為可能需要較長時間
        // get().loadAnalytics(userId),
      ];
      
      // 不等待所有完成，讓它們在背景執行
      Promise.allSettled(promises).then(() => {
        console.log('[UserDataStore] 數據預載入完成');
        set({ isPreloading: false });
      });
    } catch (error) {
      console.error('[UserDataStore] 預載入過程中出錯:', error);
      set({ isPreloading: false });
    }
  },
  
  // 清除所有數據（登出時使用）
  clearAllData: () => {
    set({
      scripts: [],
      ipPlanningResults: [],
      conversations: [],
      generations: [],
      analyticsOverview: null,
      loading: {
        scripts: false,
        ipPlanning: false,
        conversations: false,
        generations: false,
        analytics: false,
      },
      errors: {
        scripts: null,
        ipPlanning: null,
        conversations: null,
        generations: null,
        analytics: null,
      },
      lastUpdated: {
        scripts: null,
        ipPlanning: null,
        conversations: null,
        generations: null,
        analytics: null,
      },
      isPreloading: false,
    });
    console.log('[UserDataStore] 已清除所有數據');
  },
  
  // 強制刷新所有數據
  refreshAllData: async (userId: string) => {
    console.log('[UserDataStore] 強制刷新所有數據...');
    await Promise.all([
      get().loadScripts(userId, true),
      get().loadIPPlanningResults(userId, true),
      get().loadConversations(userId, true),
      get().loadGenerations(userId, true),
      get().loadAnalytics(userId, true),
    ]);
    console.log('[UserDataStore] 所有數據刷新完成');
  },
}));

