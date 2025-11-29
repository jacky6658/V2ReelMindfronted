
/**
 * Mode3 - 一鍵生成
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
import { ArrowLeft, Sparkles, CheckCircle2, Loader2, Copy, Lock, Save, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
  
  return (
    <div className="whitespace-pre-wrap">
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
  
  const [activeResultTab, setActiveResultTab] = useState('positioning');

  // 使用 useMemo 優化當前結果內容
  const currentResult = useMemo(() => {
    return results[activeResultTab as keyof typeof results] || '';
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
    // 清空之前的結果
    setResults({
      positioning: '',
      topics: '',
      script: ''
    });
    setActiveResultTab('positioning');
    setPermissionError('');
    
    // 先跳到步驟3並設置loading，確保動畫立即顯示
    setCurrentStep(3);
    setLoading(true);
    
    try {
      // 生成帳號定位
      await generatePositioning();
      // 生成選題
      await generateTopics();
      // 生成腳本
      await generateScript();
      
      toast.success('生成完成！');
    } catch (error) {
      console.error('生成失敗:', error);
      if (!handlePermissionError(error)) {
          toast.error('生成失敗，請稍後再試');
      } else {
          // 如果是權限錯誤，停止後續生成，返回確認頁面
          setCurrentStep(2);
          setLoading(false);
          return; 
      }
    } finally {
      setLoading(false);
    }
  };

  // 過濾談話性開頭語句的輔助函數
  const filterConversationalPrefix = useCallback((text: string): string => {
    if (!text) return text;
    
    // 常見的談話性開頭語句模式
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
      /^您想要儲存這個.*?嗎[？?]?/i,
      /^或者您想要我重新生成一個[？?]?/i,
    ];
    
    let filtered = text;
    for (const pattern of conversationalPatterns) {
      filtered = filtered.replace(pattern, '').trim();
    }
    
    // 移除開頭的空白和換行
    filtered = filtered.replace(/^[\s\n\r]+/, '');
    
    return filtered || text; // 如果過濾後為空，返回原文字
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
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      setResults(prev => ({ ...prev, positioning: filtered }));
    }, (error) => {
      throw error; // 拋出錯誤供 handleGenerate 捕獲處理
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
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      setResults(prev => ({ ...prev, topics: filtered }));
    }, (error) => {
      throw error;
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
      // 過濾談話性開頭後再更新狀態
      const filtered = filterConversationalPrefix(result);
      setResults(prev => ({ ...prev, script: filtered }));
    }, (error) => {
      throw error;
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
          source: 'mode3',  // 標記來源為 mode3，允許免費版用戶儲存
          platform: formData.platform,
          goal: formData.goal,
          duration: formData.duration,
          structure: formData.structure,
          topic: formData.topic,
          positioning: formData.positioning
        }
      };
      
      console.log('[Mode3 Save] 發送儲存請求:', savePayload);
      
      await apiPost('/api/ip-planning/save', savePayload);

      toast.dismiss(loadingToast);
      toast.success('已儲存到創作者資料庫');
      console.log('[Mode3 Save] 儲存成功');
      
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold">一鍵生成</h1>
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
          <div className="space-y-4">
            {/* 結果標籤切換 */}
            <div className="flex border-b">
              {[
                { id: 'positioning', label: '帳號定位' },
                { id: 'topics', label: '選題建議' },
                { id: 'script', label: '腳本內容' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveResultTab(tab.id)}
                  className={`px-6 py-3 font-medium transition-colors ${
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
                {currentResult && (
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
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

            <div className="flex justify-between gap-3">
              <Button 
                onClick={() => {
                  // 清空結果並返回第一步
                  setResults({
                    positioning: '',
                    topics: '',
                    script: ''
                  });
                  setActiveResultTab('positioning');
                  setCurrentStep(1);
                }} 
                variant="outline"
              >
                重新生成
              </Button>
              <div className="flex gap-2">
                {results.positioning && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('[Mode3] 儲存帳號定位按鈕被點擊');
                      handleSaveResult('positioning');
                    }}
                    disabled={authLoading || !isLoggedIn || !user?.user_id}
                    title={(() => {
                      if (authLoading && !user) return '正在載入用戶資訊...';
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
                    disabled={authLoading || !isLoggedIn || !user?.user_id}
                    title={(() => {
                      if (authLoading && !user) return '正在載入用戶資訊...';
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
                    disabled={authLoading || !isLoggedIn || !user?.user_id}
                    title={(() => {
                      if (authLoading && !user) return '正在載入用戶資訊...';
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
                    navigate('/profile');
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
