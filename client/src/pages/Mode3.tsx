
/**
 * 一鍵生成功能
 * 表單式 AI 腳本生成（3 步驟流程）
 */

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, CheckCircle2, Loader2, Copy, Lock, Save, Key, Home, HelpCircle, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiStream, apiPost, apiGet } from '@/lib/api-client';
import ThinkingAnimation from '@/components/ThinkingAnimation';
import { useAuthStore } from '@/stores/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// 格式化文字：將 **文字** 轉換為粗體
const FormatText = memo(({ content }: { content: string }) => {
  // 使用 useMemo 優化正則匹配結果
  const parts = useMemo(() => {
    const result: (string | { type: 'bold'; text: string })[] = [];
    let lastIndex = 0;
    const regex = /\*\*(.+?)\*\*/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // 添加匹配前的普通文字
      if (match.index > lastIndex) {
        result.push(content.substring(lastIndex, match.index));
      }
      // 添加粗體文字
      result.push({ type: 'bold', text: match[1] });
      lastIndex = regex.lastIndex;
    }
    
    // 添加剩餘的文字
    if (lastIndex < content.length) {
      result.push(content.substring(lastIndex));
    }
    
    return result;
  }, [content]);
  
  // 如果沒有匹配到任何粗體，直接返回原文字
  if (parts.length === 0) {
    return <div className="whitespace-pre-wrap text-black dark:text-white">{content}</div>;
  }
  
  return (
    <div className="whitespace-pre-wrap text-black dark:text-white">
      {parts.map((part, index) => {
        if (typeof part === 'object' && part.type === 'bold') {
          return <strong key={index} className="font-bold">{part.text}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
});

FormatText.displayName = 'FormatText';

// 腳本結構選項
const SCRIPT_STRUCTURES = [
  {
    id: 'A',
    name: '標準行銷三段式',
    desc: 'Hook → Value → CTA，適合商業推廣'
  },
  {
    id: 'B',
    name: '問題→解決→證明',
    desc: '實用性強，適合教學內容'
  },
  {
    id: 'C',
    name: 'Before→After',
    desc: '視覺反差感強，適合改變類題材'
  },
  {
    id: 'D',
    name: '教學知識型',
    desc: '步驟→實作→要點→行動，適合知識傳播'
  },
  {
    id: 'E',
    name: '故事敘事型',
    desc: '起→承→轉→合，適合個人品牌'
  }
];

export default function Mode3() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isLoggedIn } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // 調試：在開發環境中輸出認證狀態
  if (import.meta.env.DEV) {
    console.log('[Mode3] 認證狀態:', {
      authLoading,
      isLoggedIn,
      hasUser: !!user,
      userId: user?.user_id,
      userEmail: user?.email
    });
  }
  
  // 權限相關狀態
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [hasLlmKey, setHasLlmKey] = useState<boolean | null>(null);
  const [showLlmKeyDialog, setShowLlmKeyDialog] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // 表單資料
  const [formData, setFormData] = useState({
    topic: '',
    positioning: '',
    goal: '',
    platform: '',
    duration: '30',
    structure: '',
    additionalInfo: ''
  });
  
  // 生成結果
  const [results, setResults] = useState({
    positioning: '',
    topics: '',
    script: ''
  });
  
  // 追蹤每個步驟的生成完成狀態
  const [generationStatus, setGenerationStatus] = useState({
    positioning: false,
    topics: false,
    script: false
  });
  
  const [activeResultTab, setActiveResultTab] = useState('positioning');
  
  // 檢查是否所有步驟都已完成
  const allStepsCompleted = useMemo(() => {
    return generationStatus.positioning && generationStatus.topics && generationStatus.script;
  }, [generationStatus]);

  // ===== localStorage 緩存功能 =====
  // 獲取 localStorage 鍵名
  const getStorageKey = () => `mode3_cache_${user?.user_id || 'guest'}`;

  // 從 localStorage 載入緩存
  const loadFromLocalStorage = () => {
    try {
      if (!user?.user_id) return null;
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      const cached = JSON.parse(stored);
      return {
        formData: cached.formData || formData,
        results: cached.results || results,
        generationStatus: cached.generationStatus || generationStatus,
        currentStep: cached.currentStep || 1
      };
    } catch (error) {
      console.error('[Mode3] 從 localStorage 載入失敗:', error);
      return null;
    }
  };

  // 保存到 localStorage
  const saveToLocalStorage = () => {
    try {
      if (!user?.user_id) return;
      const storageKey = getStorageKey();
      const cache = {
        formData,
        results,
        generationStatus,
        currentStep
      };
      localStorage.setItem(storageKey, JSON.stringify(cache));
    } catch (error) {
      console.error('[Mode3] 保存到 localStorage 失敗:', error);
    }
  };

  // 清除 localStorage 緩存
  const clearLocalStorage = () => {
    try {
      if (!user?.user_id) return;
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('[Mode3] 清除 localStorage 失敗:', error);
    }
  };

  // 判斷是否為「從 14 天規劃 / UserDB 規劃記錄跳轉而來」
  const fromPlanningState = location.state as { fromPlanning?: boolean; planningContent?: string } | null;
  const fromPlanning = !!fromPlanningState?.fromPlanning;

  // 頁面載入時恢復緩存（僅在用戶登入且沒有現有數據時，且不是從 14 天規劃跳轉而來）
  useEffect(() => {
    if (fromPlanning) return;
    if (user?.user_id && !formData.topic && !results.positioning && !results.topics && !results.script) {
      const cached = loadFromLocalStorage();
      if (cached) {
        // 恢復表單數據
        if (cached.formData && Object.values(cached.formData).some(v => v)) {
          setFormData(cached.formData);
        }
        // 恢復生成結果
        if (cached.results && (cached.results.positioning || cached.results.topics || cached.results.script)) {
          setResults(cached.results);
          // 如果有生成結果，提示用戶
          toast.info('已恢復未保存的生成結果', { duration: 3000 });
        }
        // 恢復生成狀態
        if (cached.generationStatus) {
          setGenerationStatus(cached.generationStatus);
        }
        // 恢復當前步驟
        if (cached.currentStep && cached.currentStep > 1) {
          setCurrentStep(cached.currentStep);
        }
      }
    }
  }, [user?.user_id, fromPlanning]); // 只在 user_id 或來源狀態變化時執行

  // 從 14 天規劃跳轉時，重置一鍵生成狀態並帶入規劃內容
  useEffect(() => {
    if (!fromPlanning || !fromPlanningState?.planningContent) return;

    // 清掉舊的緩存與生成結果，避免看到之前的內容
    clearLocalStorage();
    setCurrentStep(1);
    setResults({ positioning: '', topics: '', script: '' });
    setGenerationStatus({ positioning: false, topics: false, script: false });

    // 將 14 天規劃內容放入表單的補充說明欄位，方便用戶直接生成腳本
    setFormData(prev => ({
      ...prev,
      additionalInfo: fromPlanningState.planningContent || prev.additionalInfo,
    }));

    // 移除 location.state，避免返回此頁時重複觸發
    navigate('/mode3', { replace: true, state: null });
  }, [fromPlanning, fromPlanningState?.planningContent, navigate]);

  // 用戶登出時清除緩存
  useEffect(() => {
    if (!user?.user_id && !isLoggedIn) {
      // 用戶已登出，清除緩存
      try {
        const storageKey = `mode3_cache_guest`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('[Mode3] 清除訪客緩存失敗:', error);
      }
    }
  }, [user?.user_id, isLoggedIn]);

  // 認證就緒檢查 - 確保認證狀態完全加載後才啟用保存按鈕
  useEffect(() => {
    // 等待認證加載完成
    if (!authLoading) {
      // 延遲一點時間確保狀態已更新
      const timer = setTimeout(() => {
        const isReady = isLoggedIn && !!user?.user_id;
        setAuthReady(isReady);
        if (import.meta.env.DEV) {
          console.log('[Mode3] 認證狀態更新:', {
            authLoading,
            isLoggedIn,
            hasUser: !!user,
            userId: user?.user_id,
            authReady: isReady
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAuthReady(false);
    }
  }, [authLoading, isLoggedIn, user?.user_id]);

  // 當表單數據、生成結果或狀態變化時自動保存到 localStorage
  useEffect(() => {
    if (user?.user_id) {
      // 使用 setTimeout 避免頻繁寫入
      const timer = setTimeout(() => {
        saveToLocalStorage();
      }, 500); // 防抖：500ms 內只保存一次
      
      return () => clearTimeout(timer);
    }
  }, [formData, results, generationStatus, currentStep, user?.user_id]);

  // 使用 useMemo 優化當前結果內容
  const currentResult = useMemo(() => {
    const result = results[activeResultTab as keyof typeof results] || '';
    console.log('[Mode3] currentResult 計算:', { 
      activeResultTab, 
      resultLength: result.length, 
      hasContent: !!result.trim(),
      results: {
        positioning: results.positioning?.substring(0, 50),
        topics: results.topics?.substring(0, 50),
        script: results.script?.substring(0, 50)
      }
    });
    return result;
  }, [results, activeResultTab]);

  // 使用 useMemo 優化結構資訊
  const structureInfo = useMemo(() => {
    return SCRIPT_STRUCTURES.find(s => s.id === formData.structure);
  }, [formData.structure]);

  // 處理表單輸入 - 使用 useCallback 優化
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 驗證步驟 1 - 使用 useCallback 優化
  const validateStep1 = useCallback(() => {
    if (!formData.topic.trim()) {
      toast.error('請填寫主題或產品');
      return false;
    }
    if (!formData.positioning.trim()) {
      toast.error('請填寫帳號定位');
      return false;
    }
    if (!formData.goal) {
      toast.error('請選擇影片目標');
      return false;
    }
    if (!formData.platform) {
      toast.error('請選擇社群平台');
      return false;
    }
    if (!formData.structure) {
      toast.error('請選擇腳本結構');
      return false;
    }
    return true;
  }, [formData]);

  // 前往下一步 - 使用 useCallback 優化
  const goToNextStep = useCallback(() => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, [currentStep, validateStep1]);

  // 返回上一步 - 使用 useCallback 優化
  const goToPrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // 通用的權限錯誤處理
  const handlePermissionError = (error: any) => {
      if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
          setPermissionError('您的試用期已過，請訂閱或輸入 Gemini API Key 以繼續使用。');
          setShowPermissionDialog(true);
          return true;
      }
      return false;
  }

  // 處理 API Key 保存
  const handleSaveApiKey = async () => {
      if (!apiKey.trim()) {
          toast.error('請輸入 API Key');
          return;
      }
      // 這裡可以實作保存 API Key 的邏輯，例如存到 localStorage 或發送到後端
      // 暫時先假設保存成功並重試
      // 實際應用中應該有一個專門的 API 設置用戶的 Key
      
      // 假設這裡調用一個設置 Key 的 API
      // await apiPost('/api/user/settings/key', { provider: 'gemini', key: apiKey });
      
      // 由於我們現在沒有這個 API，我們提示用戶去個人設定頁面，或者如果後端支援在請求頭帶 Key
      toast.info('請前往個人設定頁面設置 API Key，或直接訂閱解鎖全部功能。');
      
      // 導向訂閱頁面是商業邏輯首選
      navigate('/pricing');
      setShowPermissionDialog(false);
  };

  // 生成內容
  const handleGenerate = async () => {
    // 清空之前的結果和狀態
    setResults({
      positioning: '',
      topics: '',
      script: ''
    });
    setGenerationStatus({
      positioning: false,
      topics: false,
      script: false
    });
    setActiveResultTab('positioning');
    setPermissionError('');
    
    // 清除 localStorage 中的舊生成結果（保留表單數據）
    const cached = loadFromLocalStorage();
    if (cached) {
      cached.results = { positioning: '', topics: '', script: '' };
      cached.generationStatus = { positioning: false, topics: false, script: false };
      localStorage.setItem(getStorageKey(), JSON.stringify(cached));
    }
    
    // 先跳到步驟3並設置loading，確保動畫立即顯示
    setCurrentStep(3);
    setLoading(true);
    
    try {
      // 生成帳號定位
      try {
        console.log('[Mode3] 開始生成帳號定位');
        await generatePositioning();
        console.log('[Mode3] 帳號定位生成完成，當前 results.positioning:', results.positioning?.substring(0, 100));
        setGenerationStatus(prev => ({ ...prev, positioning: true }));
      } catch (error) {
        console.error('[Mode3] 生成帳號定位失敗:', error);
        throw error; // 重新拋出錯誤，讓外層 catch 處理
      }
      
      // 生成選題
      try {
        console.log('[Mode3] 開始生成選題建議');
        await generateTopics();
        console.log('[Mode3] 選題建議生成完成，當前 results.topics:', results.topics?.substring(0, 100));
        setGenerationStatus(prev => ({ ...prev, topics: true }));
      } catch (error) {
        console.error('[Mode3] 生成選題失敗:', error);
        throw error; // 重新拋出錯誤，讓外層 catch 處理
      }
      
      // 生成腳本
      try {
        console.log('[Mode3] 開始生成腳本內容');
        await generateScript();
        console.log('[Mode3] 腳本內容生成完成，當前 results.script:', results.script?.substring(0, 100));
        setGenerationStatus(prev => ({ ...prev, script: true }));
      } catch (error) {
        console.error('[Mode3] 生成腳本失敗:', error);
        throw error; // 重新拋出錯誤，讓外層 catch 處理
      }
      
      toast.success('生成完成！');
    } catch (error: any) {
      console.error('生成失敗:', error);
      
      // 根本修复：检查是否为配额错误
      const errorMessage = error?.message || '生成失敗，請稍後再試';
      const isQuotaError = errorMessage.includes('配額') || 
                           errorMessage.includes('quota') || 
                           error?.error_code === '429' ||
                           error?.is_quota_error === true;
      
      if (!handlePermissionError(error)) {
        if (isQuotaError) {
          toast.error('⚠️ API 配額已用盡', {
            description: '請檢查您的 API 金鑰配額或稍後再試',
            duration: 8000,
            action: {
              label: '查看用量',
              onClick: () => window.open('https://ai.dev/usage?tab=rate-limit', '_blank')
            }
          });
        } else {
          toast.error(errorMessage, {
            duration: 5000
          });
        }
      } else {
          // 如果是權限錯誤，停止後續生成，返回確認頁面
          setCurrentStep(2);
          setLoading(false);
          // 重置生成狀態
          setGenerationStatus({
            positioning: false,
            topics: false,
            script: false
          });
          return; 
      }
    } finally {
      setLoading(false);
    }
  };

  // 過濾談話性開頭語句的輔助函數
  const filterConversationalPrefix = useCallback((text: string): string => {
    if (!text) return text;
    
    let filtered = text;
    
    // 1. 移除開頭的完整對話性段落（多行模式，包含換行）
    // 匹配 "身為您的ReelMind短影音顧問，這就為您的「...」帳號在...上進行專業定位分析。🚀" 這類完整開場白
    filtered = filtered.replace(/^身為您的[^，,。.\n]*?ReelMind[^，,。.\n]*?短影音顧問[，,]?[^。.\n]*?這就為您的[^。.\n]*?帳號[^。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, '');
    filtered = filtered.replace(/^身為您的[^，,。.\n]*?AI[^，,。.\n]*?短影音顧問[，,]?[^。.\n]*?這就為您的[^。.\n]*?帳號[^。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, ''); // 兼容舊的 AIJob 開場白
    filtered = filtered.replace(/^身為您的[^，,。.\n]*?短影音顧問[，,]?[^。.\n]*?這就為您的[^。.\n]*?帳號[^。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, '');
    filtered = filtered.replace(/^身為您的[^，,。.\n]*?ReelMind[^，,。.\n]*?顧問[，,]?[^。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, '');
    filtered = filtered.replace(/^身為您的[^，,。.\n]*?AI[^，,。.\n]*?顧問[，,]?[^。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, ''); // 兼容舊的 AIJob 開場白
    filtered = filtered.replace(/^這就為您的[^，,。.\n]*?帳號[^，,。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, '');
    filtered = filtered.replace(/^為您的[^，,。.\n]*?帳號[^，,。.\n]*?進行[^。.\n]*?分析[。.]?[\s\n]*/i, '');
    
    // 2. 移除結尾的問答式提示（可能出現在任何位置，但通常在結尾）
    filtered = filtered.replace(/[\s\n]*您想要儲存這個[^？?。.\n]*?嗎[？?]?[\s\n]*/gi, '');
    filtered = filtered.replace(/[\s\n]*或者您想要我重新生成一個[？?]?[\s\n]*/gi, '');
    filtered = filtered.replace(/[\s\n]*您想要我重新生成一個[？?]?[\s\n]*/gi, '');
    filtered = filtered.replace(/[\s\n]*需要我重新生成嗎[？?]?[\s\n]*/gi, '');
    filtered = filtered.replace(/[\s\n]*您想要儲存嗎[？?]?[\s\n]*/gi, '');
    filtered = filtered.replace(/[\s\n]*您想要重新生成嗎[？?]?[\s\n]*/gi, '');
    
    // 3. 常見的談話性開頭語句模式（單行，僅匹配開頭）
    const conversationalPatterns = [
      /^好的[！!]?[，,]?/i,
      /^好的[！!]?針對[，,]?/i,
      /^針對[，,]?/i,
      /^我將為您[，,]?/i,
      /^我來為您[，,]?/i,
      /^讓我為您[，,]?/i,
      /^根據您提供[的]?資訊[，,]?/i,
      /^基於您提供[的]?資訊[，,]?/i,
      /^根據您[的]?需求[，,]?/i,
      /^基於您[的]?需求[，,]?/i,
      /^針對.*?平台[，,]?.*?主題[，,]?.*?定位[，,]?我將為您進行.*?分析[。.]/i,
      /^針對.*?平台[，,]?.*?主題[，,]?.*?定位[，,]?我來為您進行.*?分析[。.]/i,
      /^針對.*?平台[，,]?.*?主題[，,]?.*?定位[，,]?讓我為您進行.*?分析[。.]/i,
      /^身為您的.*?顧問[，,]?/i,
    ];
    
    for (const pattern of conversationalPatterns) {
      filtered = filtered.replace(pattern, '').trim();
    }
    
    // 4. 移除開頭和結尾的空白、換行、表情符號
    filtered = filtered.replace(/^[\s\n\r🚀✨✅🔥📌]+/, '');
    filtered = filtered.replace(/[\s\n\r]+$/, '');
    
    // 5. 清理多餘的換行（連續3個以上換行變成2個）
    filtered = filtered.replace(/\n{3,}/g, '\n\n');
    
    // 如果過濾後為空或只有空白，返回原文字（避免完全清空）
    if (!filtered.trim()) {
      console.warn('[Mode3] filterConversationalPrefix 過濾後為空，返回原文字', { 
        originalLength: text.length, 
        filteredLength: filtered.length,
        originalPreview: text.substring(0, 100)
      });
      return text;
    }
    
    console.log('[Mode3] filterConversationalPrefix 過濾成功', { 
      originalLength: text.length, 
      filteredLength: filtered.length,
      removedLength: text.length - filtered.length
    });
    return filtered;
  }, []);

  // 生成帳號定位
  const generatePositioning = async () => {
    // 使用簡潔直接的 prompt，要求直接生成不要詢問
    const prompt = `請幫我進行帳號定位分析。直接生成結果，不要詢問任何問題。

主題：${formData.topic}
目標受眾：${formData.positioning}
平台：${formData.platform}

請直接提供：
1. 帳號定位描述
2. 目標受眾分析
3. 內容方向建議

重要：直接生成完整內容，不要詢問任何問題，不要說「需要您先提供資訊」之類的話，不要說「好的！」、「針對...我將為您...」等開場白，直接從內容開始。格式要求：分段清楚，短句，每段換行，適度加入表情符號（如：✅✨🔥📌）。`;

    let result = '';
    // 使用 Mode3 專用端點，傳遞結構化參數
    await apiStream('/api/mode3/generate/positioning', { 
        message: prompt,
        platform: formData.platform,
        topic: formData.topic,
        profile: formData.positioning,
        conversation_type: 'one_click',
        user_id: user?.user_id || null
    }, (chunk) => {
      result += chunk;
      console.log('[Mode3] 收到帳號定位 chunk:', { chunkLength: chunk.length, totalLength: result.length, chunk: chunk.substring(0, 50) });
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      console.log('[Mode3] 過濾後的帳號定位:', { originalLength: result.length, filteredLength: filtered.length, hasContent: !!filtered.trim() });
      setResults(prev => {
        const newResults = { ...prev, positioning: filtered };
        console.log('[Mode3] 更新 results.positioning:', { newLength: filtered.length, hasContent: !!filtered.trim() });
        return newResults;
      });
    }, (error) => {
      // 根本修复：增强错误处理，显示用户友好的提示
      const errorMessage = error?.message || error?.content || '生成失敗，請稍後再試';
      const isQuotaError = errorMessage.includes('配額') || 
                           errorMessage.includes('quota') || 
                           errorMessage.includes('exceeded') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('rate-limit') ||
                           errorMessage.includes('ResourceExhausted') ||
                           error?.error_code === '429' ||
                           error?.is_quota_error === true ||
                           error?.response?.status === 429;
      
      console.error('[Mode3] 生成帳號定位錯誤:', {
        error,
        errorMessage,
        isQuotaError,
        errorCode: error?.error_code,
        status: error?.response?.status,
        originalError: error?.original_error
      });
      
      if (isQuotaError) {
        // 使用后端返回的用户友好消息，如果没有则使用默认消息
        const quotaMessage = errorMessage.includes('配額') || errorMessage.includes('quota') 
          ? errorMessage 
          : '⚠️ API 配額或速率限制已用盡\n\n您的 Gemini API 可能已達到：\n1. 每日請求限制 (RPD)\n2. 每分鐘請求限制 (RPM)\n3. 總配額限制\n\n請前往 https://ai.dev/usage?tab=rate-limit 查看詳細用量';
        
        toast.error(quotaMessage, {
          description: '請檢查您的 API 金鑰配額和速率限制',
          duration: 10000,
          action: {
            label: '查看用量',
            onClick: () => window.open('https://ai.dev/usage?tab=rate-limit', '_blank')
          }
        });
      } else if (error?.response?.status === 403) {
        handlePermissionError(error);
      } else {
        toast.error(errorMessage, {
          duration: 5000
        });
      }
      
      throw error; // 仍然抛出错误供 handleGenerate 捕获
    });
  };

  // 生成選題
  const generateTopics = async () => {
    // 使用簡潔直接的 prompt，要求直接生成不要詢問
    const prompt = `請幫我推薦選題。直接生成結果，不要詢問任何問題。

主題：${formData.topic}
目標受眾：${formData.positioning}
影片目標：${formData.goal}
平台：${formData.platform}

請直接提供 5 個具體的選題，每個選題包含標題和簡短說明。

重要：直接生成完整內容，不要詢問任何問題，不要說「好的！」、「針對...我將為您...」等開場白，直接從內容開始。格式要求：分段清楚，短句，每段換行，適度加入表情符號（如：✅✨🔥📌）。`;

    let result = '';
    // 使用 Mode3 專用端點，傳遞結構化參數
    await apiStream('/api/mode3/generate/topics', { 
        message: prompt,
        platform: formData.platform,
        topic: formData.topic,
        profile: formData.positioning,
        conversation_type: 'one_click',
        user_id: user?.user_id || null
    }, (chunk) => {
      result += chunk;
      console.log('[Mode3] 收到選題建議 chunk:', { chunkLength: chunk.length, totalLength: result.length, chunk: chunk.substring(0, 50) });
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      console.log('[Mode3] 過濾後的選題建議:', { originalLength: result.length, filteredLength: filtered.length, hasContent: !!filtered.trim() });
      setResults(prev => {
        const newResults = { ...prev, topics: filtered };
        console.log('[Mode3] 更新 results.topics:', { newLength: filtered.length, hasContent: !!filtered.trim() });
        return newResults;
      });
    }, (error) => {
      // 根本修复：增强错误处理，显示用户友好的提示
      const errorMessage = error?.message || error?.content || '生成失敗，請稍後再試';
      const isQuotaError = errorMessage.includes('配額') || 
                           errorMessage.includes('quota') || 
                           errorMessage.includes('exceeded') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('rate-limit') ||
                           errorMessage.includes('ResourceExhausted') ||
                           error?.error_code === '429' ||
                           error?.is_quota_error === true ||
                           error?.response?.status === 429;
      
      console.error('[Mode3] 生成選題建議錯誤:', {
        error,
        errorMessage,
        isQuotaError,
        errorCode: error?.error_code,
        status: error?.response?.status,
        originalError: error?.original_error
      });
      
      if (isQuotaError) {
        // 使用后端返回的用户友好消息，如果没有则使用默认消息
        const quotaMessage = errorMessage.includes('配額') || errorMessage.includes('quota') 
          ? errorMessage 
          : '⚠️ API 配額或速率限制已用盡\n\n您的 Gemini API 可能已達到：\n1. 每日請求限制 (RPD)\n2. 每分鐘請求限制 (RPM)\n3. 總配額限制\n\n請前往 https://ai.dev/usage?tab=rate-limit 查看詳細用量';
        
        toast.error(quotaMessage, {
          description: '請檢查您的 API 金鑰配額和速率限制',
          duration: 10000,
          action: {
            label: '查看用量',
            onClick: () => window.open('https://ai.dev/usage?tab=rate-limit', '_blank')
          }
        });
      } else if (error?.response?.status === 403) {
        handlePermissionError(error);
      } else {
        toast.error(errorMessage, {
          duration: 5000
        });
      }
      
      throw error; // 仍然抛出错误供 handleGenerate 捕获
    });
  };

  // 生成腳本
  const generateScript = async () => {
    const structureMessages: Record<string, string> = {
      'A': '請使用標準行銷三段式（Hook → Value → CTA）結構生成完整腳本',
      'B': '請使用問題 → 解決 → 證明（Problem → Solution → Proof）結構生成完整腳本',
      'C': '請使用Before → After → 秘密揭露結構生成完整腳本',
      'D': '請使用教學知識型（迷思 → 原理 → 要點 → 行動）結構生成完整腳本',
      'E': '請使用故事敘事型（起 → 承 → 轉 → 合）結構生成完整腳本'
    };
    
    // 使用簡潔直接的 prompt，要求直接生成不要詢問
    const prompt = `${structureMessages[formData.structure] || '請生成完整短影音腳本'}。直接生成結果，不要詢問任何問題。

主題：${formData.topic}
目標受眾：${formData.positioning}
影片目標：${formData.goal}
平台：${formData.platform}
腳本秒數：${formData.duration}秒
${formData.additionalInfo ? `補充說明：${formData.additionalInfo}` : ''}

請直接生成完整的短影音腳本，包含：
1. 開場 Hook（前 3 秒）
2. 主要內容
3. CTA 行動呼籲

重要：直接生成完整內容，不要詢問任何問題，不要說「好的！」、「針對...我將為您...」等開場白，直接從內容開始。格式要求：分段清楚，短句，每段換行，適度加入表情符號（如：✅✨🔥📌）。`;

    let result = '';
    // 使用 Mode3 專用端點，傳遞結構化參數
    await apiStream('/api/mode3/generate/script', { 
        message: prompt,
        platform: formData.platform,
        topic: formData.topic,
        profile: formData.positioning,
        duration: formData.duration,
        script_structure: formData.structure,
        conversation_type: 'one_click',
        user_id: user?.user_id || null
    }, (chunk) => {
      result += chunk;
      console.log('[Mode3] 收到腳本內容 chunk:', { chunkLength: chunk.length, totalLength: result.length, chunk: chunk.substring(0, 50) });
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      console.log('[Mode3] 過濾後的腳本內容:', { originalLength: result.length, filteredLength: filtered.length, hasContent: !!filtered.trim() });
      setResults(prev => {
        const newResults = { ...prev, script: filtered };
        console.log('[Mode3] 更新 results.script:', { newLength: filtered.length, hasContent: !!filtered.trim() });
        return newResults;
      });
    }, (error) => {
      // 根本修复：增强错误处理，显示用户友好的提示
      const errorMessage = error?.message || error?.content || '生成失敗，請稍後再試';
      const isQuotaError = errorMessage.includes('配額') || 
                           errorMessage.includes('quota') || 
                           errorMessage.includes('exceeded') ||
                           errorMessage.includes('rate limit') ||
                           errorMessage.includes('rate-limit') ||
                           errorMessage.includes('ResourceExhausted') ||
                           error?.error_code === '429' ||
                           error?.is_quota_error === true ||
                           error?.response?.status === 429;
      
      console.error('[Mode3] 生成腳本內容錯誤:', {
        error,
        errorMessage,
        isQuotaError,
        errorCode: error?.error_code,
        status: error?.response?.status,
        originalError: error?.original_error
      });
      
      if (isQuotaError) {
        // 使用后端返回的用户友好消息，如果没有则使用默认消息
        const quotaMessage = errorMessage.includes('配額') || errorMessage.includes('quota') 
          ? errorMessage 
          : '⚠️ API 配額或速率限制已用盡\n\n您的 Gemini API 可能已達到：\n1. 每日請求限制 (RPD)\n2. 每分鐘請求限制 (RPM)\n3. 總配額限制\n\n請前往 https://ai.dev/usage?tab=rate-limit 查看詳細用量';
        
        toast.error(quotaMessage, {
          description: '請檢查您的 API 金鑰配額和速率限制',
          duration: 10000,
          action: {
            label: '查看用量',
            onClick: () => window.open('https://ai.dev/usage?tab=rate-limit', '_blank')
          }
        });
      } else if (error?.response?.status === 403) {
        handlePermissionError(error);
      } else {
        toast.error(errorMessage, {
          duration: 5000
        });
      }
      
      throw error; // 仍然抛出错误供 handleGenerate 捕获
    });
  };

  // 複製到剪貼簿 - 使用 useCallback 優化
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已複製到剪貼簿');
  }, []);

  // 儲存結果到 UserDB - 使用 useCallback 優化
  const handleSaveResult = useCallback(async (type: 'positioning' | 'topics' | 'script') => {
    // 調試日誌 - 強制輸出，確保能看到
    console.log('[Mode3 Save] ========== 儲存按鈕被點擊 ==========');
    console.log('[Mode3 Save] 儲存請求:', {
      type,
      authLoading,
      isLoggedIn,
      hasUser: !!user,
      userId: user?.user_id,
      userObject: user
    });
    
    // 檢查用戶是否已登入
    if (!isLoggedIn) {
      console.error('[Mode3 Save] 用戶未登入', {
        isLoggedIn,
        authLoading
      });
      toast.error('請先登入');
      navigate('/login');
      return;
    }
    
    // 如果正在載入用戶資訊，等待載入完成
    if (authLoading) {
      console.warn('[Mode3 Save] 正在載入用戶資訊，等待中...');
      toast.info('正在載入用戶資訊，請稍候...');
      return;
    }
    
    // 檢查是否有 user_id
    if (!user?.user_id) {
      console.error('[Mode3 Save] 缺少 user_id', {
        hasUser: !!user,
        userId: user?.user_id,
        userObject: user
      });
      toast.error('用戶資訊不完整，請重新登入');
      navigate('/login');
      return;
    }
    
    console.log('[Mode3 Save] 通過認證檢查，繼續儲存流程...');

    const content = results[type];
    if (!content.trim()) {
      toast.error('沒有可儲存的內容');
      return;
    }

    // 映射類型到後端格式
    const resultTypeMap: Record<string, 'profile' | 'plan' | 'scripts'> = {
      positioning: 'profile',
      topics: 'plan',
      script: 'scripts'
    };

    const titleMap: Record<string, string> = {
      positioning: `帳號定位 - ${formData.topic}`,
      topics: `選題建議 - ${formData.topic}`,
      script: `短影音腳本 - ${formData.topic}`
    };

    // 顯示載入提示
    const loadingToast = toast.loading('正在儲存...');

    try {
      const savePayload = {
        user_id: user.user_id,
        result_type: resultTypeMap[type],
        title: titleMap[type],
        content: content,
        metadata: {
          source: 'mode3',  // 標記來源為一鍵生成功能，允許免費版用戶儲存
          platform: formData.platform,
          goal: formData.goal,
          duration: formData.duration,
          structure: formData.structure,
          topic: formData.topic,
          positioning: formData.positioning
        }
      };
      
      console.log('[Mode3 Save] 發送儲存請求:', savePayload);

      // 增加超時時間到 30 秒（保存操作可能需要較長時間）
      await apiPost('/api/ip-planning/save', savePayload, { timeout: 30000 });

      toast.dismiss(loadingToast);
      
      // 根據類型告訴用戶存在哪裡
      let locationHint = '';
      if (type === 'positioning') {
        locationHint = '可在「我的資料」→「IP 人設規劃」標籤頁查看';
      } else if (type === 'topics') {
        locationHint = '可在「我的資料」→「14 天規劃」標籤頁查看';
      } else if (type === 'script') {
        locationHint = '可在「我的資料」→「我的腳本」標籤頁查看';
      }
      
      toast.success('已儲存到創作者資料庫', {
        description: locationHint,
        duration: 5000,
        action: {
          label: '前往查看',
          onClick: () => navigate('/userdb')
        }
      });
      console.log('[Mode3 Save] 儲存成功');
      
      // 保存成功後，清除對應的生成結果（從 state 和 localStorage）
      setResults(prev => {
        const updated = {
          ...prev,
          [type]: '' // 清除已保存的結果
        };
        
        // 更新 localStorage（移除已保存的結果，但保留表單數據）
        try {
          const storageKey = getStorageKey();
          const cached = loadFromLocalStorage();
          if (cached) {
            cached.results[type] = '';
            cached.generationStatus[type] = false;
            localStorage.setItem(storageKey, JSON.stringify(cached));
          }
          
          // 如果所有結果都已保存，清除生成結果緩存（但保留表單數據）
          const allSaved = !updated.positioning && !updated.topics && !updated.script;
          if (allSaved) {
            // 只清除生成結果，保留表單數據
            const formDataOnly = {
              formData: formData,
              results: { positioning: '', topics: '', script: '' },
              generationStatus: { positioning: false, topics: false, script: false },
              currentStep: currentStep
            };
            localStorage.setItem(storageKey, JSON.stringify(formDataOnly));
            console.log('[Mode3] 所有結果已保存，清除生成結果緩存（保留表單數據）');
          }
        } catch (error) {
          console.error('[Mode3] 更新 localStorage 失敗:', error);
        }
        
        return updated;
      });
      
      // 更新生成狀態
      setGenerationStatus(prev => ({
        ...prev,
        [type]: false
      }));
      
      // 發送自定義事件通知 UserDB 刷新
      window.dispatchEvent(new CustomEvent('userdb-data-updated', { detail: { type: 'ip-planning' } }));
    } catch (error: any) {
      console.error('[Mode3 Save] 儲存失敗:', error);
      console.error('[Mode3 Save] 錯誤詳情:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      });
      
      toast.dismiss(loadingToast);
      if (error?.response?.status === 403) {
        toast.error('您沒有權限儲存此內容，請訂閱以解鎖此功能');
      } else if (error?.response?.status === 401) {
        toast.error('登入已過期，請重新登入');
        navigate('/login');
      } else {
        toast.error('儲存失敗，請稍後再試');
      }
    }
  }, [user, authLoading, isLoggedIn, results, formData, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between relative">
          {/* 左侧：返回主控台 */}
          <div className="flex-1 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">返回主控台</span>
            </Button>
          </div>
          
          {/* 中间：ReelMind（手机版置中） */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ReelMind</span>
          </div>
          
          {/* 右侧：返回首页 */}
          <div className="flex-1 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">返回首頁</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="container max-w-5xl py-8">
        {/* 進度指示器 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  currentStep === step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step === 1 ? '填寫需求' : step === 2 ? '確認資訊' : '生成結果'}
                </span>
              </div>
              {index < 2 && (
                <div className={`w-16 h-0.5 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 步驟 1：填寫需求 */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                告訴 AI 你的需求
              </CardTitle>
              <CardDescription>
                填寫以下資訊，讓 AI 為你量身打造短影音內容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 主題或產品 */}
              <div className="space-y-2">
                <Label htmlFor="topic">你的主題或產品 *</Label>
                <Input
                  id="topic"
                  placeholder="例如：美白咀嚼錠、健身教學、美食分享..."
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                />
              </div>

              {/* 帳號定位 */}
              <div className="space-y-2">
                <Label htmlFor="positioning">帳號定位 *</Label>
                <Input
                  id="positioning"
                  placeholder="例如：25-35歲女性、健身新手、上班族..."
                  value={formData.positioning}
                  onChange={(e) => handleInputChange('positioning', e.target.value)}
                />
              </div>

              {/* 影片目標 */}
              <div className="space-y-2">
                <Label>影片目標 *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '流量型', label: '流量型', desc: '吸粉/破圈' },
                    { value: '轉換型', label: '轉換型', desc: '帶貨/留資' },
                    { value: '教育型', label: '教育型', desc: '建立信任' }
                  ].map((goal) => (
                    <Button
                      key={goal.value}
                      type="button"
                      variant={formData.goal === goal.value ? 'default' : 'outline'}
                      onClick={() => handleInputChange('goal', goal.value)}
                      className="flex flex-col h-auto py-3"
                    >
                      <div className="font-medium">{goal.label}</div>
                      <div className="text-xs opacity-80">{goal.desc}</div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 社群平台 */}
              <div className="space-y-2">
                <Label>社群平台 *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['TikTok', 'Instagram Reels', '小紅書', 'YouTube Shorts', 'Facebook Reels'].map((platform) => (
                    <Button
                      key={platform}
                      type="button"
                      variant={formData.platform === platform ? 'default' : 'outline'}
                      onClick={() => handleInputChange('platform', platform)}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 腳本秒數 */}
              <div className="space-y-2">
                <Label htmlFor="duration">腳本秒數 *</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15秒</SelectItem>
                    <SelectItem value="30">30秒</SelectItem>
                    <SelectItem value="45">45秒</SelectItem>
                    <SelectItem value="60">60秒</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 常用腳本結構 */}
              <div className="space-y-2">
                <Label>常用腳本結構 *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SCRIPT_STRUCTURES.map((structure) => (
                    <Button
                      key={structure.id}
                      type="button"
                      variant={formData.structure === structure.id ? 'default' : 'outline'}
                      onClick={() => handleInputChange('structure', structure.id)}
                      className="flex items-start gap-3 h-auto py-3 px-4 text-left"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                        formData.structure === structure.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {structure.id}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{structure.name}</div>
                        <div className="text-xs opacity-80 mt-1">{structure.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 補充說明 */}
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">補充說明（選填）</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="例如：想要敘事型風格、需要反差感、有 Before/After 素材..."
                  rows={4}
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={goToNextStep} size="lg">
                  下一步
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步驟 2：確認資訊 */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>確認資訊</CardTitle>
              <CardDescription>請確認以下資訊是否正確</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">主題或產品</div>
                  <div className="mt-1">{formData.topic}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">帳號定位</div>
                  <div className="mt-1">{formData.positioning}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">影片目標</div>
                  <div className="mt-1">{formData.goal}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">社群平台</div>
                  <div className="mt-1">{formData.platform}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">腳本秒數</div>
                  <div className="mt-1">{formData.duration}秒</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">腳本結構</div>
                  <div className="mt-1">
                    {structureInfo?.name}
                  </div>
                </div>
              </div>
              {formData.additionalInfo && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">補充說明</div>
                  <div className="mt-1">{formData.additionalInfo}</div>
                </div>
              )}
              <div className="flex justify-between gap-3 pt-4">
                <Button onClick={goToPrevStep} variant="outline">
                  上一步
                </Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '開始生成'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步驟 3：生成結果 */}
        {currentStep === 3 && (
          <div className="space-y-4 pb-24 md:pb-4">
            {/* 使用說明提示 */}
            {!allStepsCompleted && (
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1 text-blue-900 dark:text-blue-100">
                        使用說明
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        建議等待 <strong>帳號定位</strong>、<strong>選題建議</strong> 和 <strong>腳本內容</strong> 三個部分都生成完成後再儲存，以確保資料完整性。
                        目前進度：{[
                          generationStatus.positioning && '✓ 帳號定位',
                          generationStatus.topics && '✓ 選題建議',
                          generationStatus.script && '✓ 腳本內容'
                        ].filter(Boolean).join('、') || '尚未開始生成'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 結果標籤切換 */}
            <div className="flex border-b overflow-x-auto">
              {[
                { id: 'positioning', label: '帳號定位' },
                { id: 'topics', label: '選題建議' },
                { id: 'script', label: '腳本內容' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveResultTab(tab.id)}
                  className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeResultTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 結果內容 */}
            <Card>
              <CardContent className="pt-6">
                {loading && !currentResult && (
                  <ThinkingAnimation message={`AI 正在為您生成${
                    activeResultTab === 'positioning' ? '帳號定位' :
                    activeResultTab === 'topics' ? '選題建議' : '短影音腳本'
                  }...`} />
                )}
                {!loading && !currentResult && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>尚未生成內容</p>
                    <p className="text-sm mt-2">請等待生成完成或點擊「重新生成」</p>
                  </div>
                )}
                {currentResult && (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-black dark:text-white">
                      <FormatText content={currentResult} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(currentResult)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        複製內容
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 操作按鈕區域 - 手機版固定底部，桌面版正常布局 */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:relative md:border-t-0 md:bg-transparent z-50 md:z-auto md:mt-4">
              <div className="container max-w-5xl px-4 py-3 md:px-0 md:py-0">
                <div className="flex flex-col md:flex-row justify-between gap-3">
                  <Button 
                    onClick={() => {
                      setResults({
                        positioning: '',
                        topics: '',
                        script: ''
                      });
                      setGenerationStatus({
                        positioning: false,
                        topics: false,
                        script: false
                      });
                      setActiveResultTab('positioning');
                      setCurrentStep(1);
                    }} 
                    variant="outline"
                    className="w-full md:w-auto order-2 md:order-1"
                  >
                    重新生成
                  </Button>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto order-1 md:order-2">
                    {results.positioning && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log('[Mode3] 儲存帳號定位按鈕被點擊');
                          handleSaveResult('positioning');
                        }}
                        disabled={
                          loading || 
                          !generationStatus.positioning || 
                          !authReady || 
                          !isLoggedIn || 
                          !user?.user_id
                        }
                        className="w-full md:w-auto"
                        title={(() => {
                          if (loading) return '正在生成中，請稍候...';
                          if (!generationStatus.positioning) return '帳號定位尚未生成完成';
                          if (!authReady) return '正在載入用戶資訊...';
                          if (!isLoggedIn) return '請先登入';
                          if (!user?.user_id) return '用戶資訊不完整';
                          return '儲存帳號定位';
                        })()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        儲存帳號定位
                      </Button>
                    )}
                    {results.topics && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log('[Mode3] 儲存選題建議按鈕被點擊');
                          handleSaveResult('topics');
                        }}
                        disabled={
                          loading || 
                          !generationStatus.topics || 
                          !authReady || 
                          !isLoggedIn || 
                          !user?.user_id
                        }
                        className="w-full md:w-auto"
                        title={(() => {
                          if (loading) return '正在生成中，請稍候...';
                          if (!generationStatus.topics) return '選題建議尚未生成完成';
                          if (!authReady) return '正在載入用戶資訊...';
                          if (!isLoggedIn) return '請先登入';
                          if (!user?.user_id) return '用戶資訊不完整';
                          return '儲存選題建議';
                        })()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        儲存選題建議
                      </Button>
                    )}
                    {results.script && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log('[Mode3] 儲存腳本內容按鈕被點擊');
                          handleSaveResult('script');
                        }}
                        disabled={
                          loading || 
                          !generationStatus.script || 
                          !authReady || 
                          !isLoggedIn || 
                          !user?.user_id
                        }
                        className="w-full md:w-auto"
                        title={(() => {
                          if (loading) return '正在生成中，請稍候...';
                          if (!generationStatus.script) return '腳本內容尚未生成完成';
                          if (!authReady) return '正在載入用戶資訊...';
                          if (!isLoggedIn) return '請先登入';
                          if (!user?.user_id) return '用戶資訊不完整';
                          return '儲存腳本內容';
                        })()}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        儲存腳本內容
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* 權限提示 Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        需要權限
                    </DialogTitle>
                    <DialogDescription>
                        {permissionError || '您需要訂閱或配置 API Key 才能繼續使用此功能。'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>訂閱解鎖完整功能（推薦）</Label>
                        <p className="text-sm text-muted-foreground">
                            升級為 VIP 會員，無限制使用所有 AI 生成功能，無需煩惱 API Key。
                        </p>
                        <Button className="w-full" onClick={() => navigate('/pricing')}>
                            查看訂閱方案
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                或者
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>我有 Gemini API Key</Label>
                        <Input 
                            type="password" 
                            placeholder="輸入您的 Google Gemini API Key" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            我們不會儲存您的 Key 用於其他用途，僅用於本次生成。
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                        確認使用 Key
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* LLM API Key 綁定提示 Dialog */}
        <Dialog open={showLlmKeyDialog} onOpenChange={setShowLlmKeyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">🔑 請先綁定 LLM API Key</DialogTitle>
              <DialogDescription className="text-center text-base">
                為了獲得最佳體驗，建議優先綁定您的 LLM API Key
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* 說明 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">✨ 綁定 API Key 的好處：</h3>
                <div className="space-y-2">
                  {[
                    '使用您自己的 API Key，完全掌控生成品質',
                    '優先使用您選擇的 LLM 模型',
                    '不受系統配額限制',
                    '更好的隱私保護'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA 按鈕 */}
              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    setShowLlmKeyDialog(false);
                    navigate('/settings');
                  }}
                >
                  <Key className="w-5 h-5 mr-2" />
                  前往綁定 API Key
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowLlmKeyDialog(false)}
                >
                  稍後再說
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

    </div>
  );
}
