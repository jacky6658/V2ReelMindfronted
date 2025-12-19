/**
 * IP 人設規劃功能
 * 包含：帳號定位對話、14天規劃、今日腳本
 */

import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Send, 
  Sparkles, 
  Calendar, 
  FileText, 
  Trash2,
  Download,
  RefreshCw,
  User,
  HelpCircle,
  Save,
  FolderOpen,
  CheckCircle,
  Edit2,
  X,
  Copy,
  Maximize2,
  ArrowLeft,
  Key,
  ChevronDown,
  Home
} from 'lucide-react';
import { apiPost, apiGet, apiDelete, apiStream } from '@/lib/api-client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ThinkingAnimation from '@/components/ThinkingAnimation';

// 處理行內 Markdown（粗體、斜體）
function formatInlineMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  // 先處理粗體 **text**（優先級更高）
  const boldRegex = /\*\*(.+?)\*\*/g;
  const boldMatches: Array<{ index: number; text: string; fullMatch: string }> = [];
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    boldMatches.push({
      index: match.index,
      text: match[1],
      fullMatch: match[0]
    });
  }
  
  // 處理斜體 *text*（排除粗體中的 *）
  const italicRegex = /(?<!\*)\*([^*]+?)\*(?!\*)/g;
  const italicMatches: Array<{ index: number; text: string; fullMatch: string }> = [];
  while ((match = italicRegex.exec(text)) !== null) {
    // 檢查是否在粗體範圍內
    const isInBold = boldMatches.some(b => 
      match.index >= b.index && match.index < b.index + b.fullMatch.length
    );
    if (!isInBold) {
      italicMatches.push({
        index: match.index,
        text: match[1],
        fullMatch: match[0]
      });
    }
  }
  
  // 合併並排序所有匹配
  const allMatches = [
    ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
    ...italicMatches.map(m => ({ ...m, type: 'italic' as const }))
  ].sort((a, b) => a.index - b.index);
  
  // 構建結果
  allMatches.forEach((match, idx) => {
    // 添加匹配前的文字
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // 添加格式化內容
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${idx}`} className="font-bold">{match.text}</strong>);
    } else if (match.type === 'italic') {
      parts.push(<em key={`italic-${idx}`} className="italic">{match.text}</em>);
    }
    
    lastIndex = match.index + match.fullMatch.length;
  });
  
  // 添加剩餘的文字
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // 如果沒有匹配，直接返回原文字
  if (allMatches.length === 0) {
    return [text];
  }
  
  return parts;
}

// 格式化文字：將 Markdown 符號轉換為 HTML 格式
// 支援 **粗體**、*斜體*、## 標題、### 標題、表格等
const FormatText = memo(({ content }: { content: string }) => {
  const formattedContent = useMemo(() => {
    const lines = content.split('\n');
    const result: JSX.Element[] = [];
    let tableRows: string[] = [];
    let isInTable = false;
    let tableStartIndex = -1;
    
    const renderTable = (rows: string[], startIndex: number) => {
      if (rows.length === 0) return null;
      
      // 找到分隔符位置（通常在第二行）
      let headerEndIndex = 0;
      for (let i = 1; i < rows.length; i++) {
        const trimmed = rows[i].trim();
        if (/^\|[\s\-:]+\|$/.test(trimmed)) {
          headerEndIndex = i;
          break;
        }
      }
      
      const headerRows = headerEndIndex > 0 ? rows.slice(0, headerEndIndex) : [];
      const bodyRows = headerEndIndex > 0 ? rows.slice(headerEndIndex + 1) : rows;
      
      return (
        <div key={`table-${startIndex}`} className="my-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-border dark:border-border/50 bg-card dark:bg-card/50 text-black dark:text-black font-bold">
            {headerRows.length > 0 && (
              <thead className="bg-muted/30 dark:bg-muted/20">
                {headerRows.map((row, rowIndex) => {
                  const cells = row.split('|').map(c => c.trim()).filter(c => c);
                  return (
                    <tr key={`header-${rowIndex}`} className="border-b border-border dark:border-border/50">
                      {cells.map((cell, cellIndex) => (
                        <th key={cellIndex} className="border border-border dark:border-border/50 px-4 py-2 text-left font-bold">
                          {formatInlineMarkdown(cell)}
                        </th>
                      ))}
                    </tr>
                  );
                })}
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, rowIndex) => {
                // 過濾掉分隔符行（只包含 - 或 : 的行）
                const trimmed = row.trim();
                if (/^\|[\s\-:]+\|$/.test(trimmed)) {
                  return null;
                }
                const cells = row.split('|').map(c => c.trim()).filter(c => c);
                // 過濾掉空行或只有分隔符的單元格
                if (cells.length === 0 || cells.every(cell => /^[\s\-:]+$/.test(cell))) {
                  return null;
                }
                return (
                  <tr key={`row-${rowIndex}`} className="border-b border-border dark:border-border/50 hover:bg-muted/30 dark:hover:bg-muted/20">
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-border dark:border-border/50 px-4 py-2">
                        {formatInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      const isTableRow = /^\|.+\|$/.test(trimmedLine);
      const isTableSeparator = /^\|[\s\-:]+\|$/.test(trimmedLine);
      
      if (isTableRow || isTableSeparator) {
        // 表格行
        if (!isInTable) {
          // 開始新表格
          isInTable = true;
          tableStartIndex = lineIndex;
          tableRows = [];
        }
        tableRows.push(trimmedLine);
      } else {
        // 非表格行
        if (isInTable) {
          // 結束表格
          const tableElement = renderTable(tableRows, tableStartIndex);
          if (tableElement) {
            result.push(tableElement);
          }
          isInTable = false;
          tableRows = [];
          tableStartIndex = -1;
        }
        
        // 處理標題（## 或 ### 開頭的行）
        const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          const HeadingTag = level === 2 ? 'h2' : 'h3';
          result.push(
            <HeadingTag 
              key={`line-${lineIndex}`} 
              className={`font-bold text-black dark:text-black ${level === 2 ? 'text-xl mt-4 mb-2' : 'text-lg mt-3 mb-1'}`}
            >
              {formatInlineMarkdown(text)}
            </HeadingTag>
          );
          return;
        }
        
        // 處理普通行（包含粗體和斜體）
        if (line.trim()) {
          result.push(
            <div key={`line-${lineIndex}`} className="text-black dark:text-black font-bold">
              {formatInlineMarkdown(line)}
            </div>
          );
        } else {
          // 空行
          result.push(<br key={`line-${lineIndex}`} />);
        }
      }
    });
    
    // 處理最後的表格（如果內容以表格結尾）
    if (isInTable && tableRows.length > 0) {
      const tableElement = renderTable(tableRows, tableStartIndex);
      if (tableElement) {
        result.push(tableElement);
      }
    }
    
    return result;
  }, [content]);
  
  return (
    <div className="break-words text-black dark:text-black font-bold">
      {formattedContent}
    </div>
  );
});

FormatText.displayName = 'FormatText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  prompt?: string; // 用於「換一個」功能
}

interface HistoryItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type: 'profile' | 'planning' | 'script';
  metadata?: {
    category?: 'positioning' | 'topics' | 'planning' | 'script';
    source?: 'mode1' | 'mode3';
    timestamp?: string;
  };
}

interface SavedResult {
  id: string;
  title: string;
  content: string;
  category: 'positioning' | 'topics' | 'planning' | 'script';
  timestamp: Date;
  isEditing?: boolean;
  savedToDB?: boolean; // 標記是否已儲存到資料庫
}

export default function Mode1() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, loading: authLoading, subscription } = useAuthStore();
  // Premium 模式支持：Pro、VIP、MAX 方案
  const supportsPremium = subscription === 'pro' || subscription === 'vip' || subscription === 'max';
  const [usePremium, setUsePremium] = useState(false);
  const qualityMode = supportsPremium && usePremium ? 'premium' : 'economy';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // activeTab 已移除，但保留用於生成結果分類
  const [activeTab] = useState<'profile' | 'planning' | 'script'>('profile');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [resultTab, setResultTab] = useState<'positioning' | 'topics' | 'planning' | 'script'>('positioning');
  const [expandedResult, setExpandedResult] = useState<SavedResult | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasLlmKey, setHasLlmKey] = useState<boolean | null>(null);
  const [showLlmKeyDialog, setShowLlmKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);  // 用於監聽滾動
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);  // 是否顯示滾動到底部按鈕
  const [hasConsumedPlanningState, setHasConsumedPlanningState] = useState(false);
  const fromPlanningState = location.state as { fromPlanning?: boolean; planningContent?: string } | null;
  const [contextId, setContextId] = useState<string | null>(null); // 當前使用的 context_id
  const [contextSource, setContextSource] = useState<{ type: 'file' | 'url'; name: string } | null>(null); // 上下文來源資訊
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // 不支持 Premium 的方案時強制關閉 Premium（避免送出 premium 參數）
  useEffect(() => {
    if (!supportsPremium && usePremium) setUsePremium(false);
  }, [supportsPremium, usePremium]);

  // 快速按鈕
  const quickButtons = [
    { label: 'IP Profile', prompt: '請幫我建立 IP 人設檔案，包含目標受眾、傳達目標、帳號定位、內容方向、風格調性和差異化優勢。' },
    { label: '14天規劃', prompt: '請幫我生成 14 天的短影音內容規劃。' },
    { label: '今日腳本', prompt: '請幫我生成今日的短影音腳本。' },
    { label: '換腳本結構', prompt: '請提供不同的腳本結構選擇（A/B/C/D/E 五種），讓我選擇最適合的結構。' },
    { label: '重新定位', prompt: '請顯示短影音內容策略矩陣表格，協助我重新規劃帳號定位。' },
  ];

  // 檢查登入狀態和權限（開發階段：暫時放寬權限檢查）
  useEffect(() => {
    const checkPermission = async () => {
      if (!isLoggedIn || !user) {
        toast.error('請先登入');
        navigate('/login');
        return;
      }

      setCheckingPermission(true);
      try {
        // 檢查用戶是否綁定 LLM API Key
        let hasLlmKeyValue = false;
        try {
          const llmKeyCheck = await apiGet<{ has_key: boolean; provider: string | null }>('/api/user/llm-keys/check');
          hasLlmKeyValue = llmKeyCheck.has_key;
          setHasLlmKey(hasLlmKeyValue);
        } catch (error) {
          console.warn('檢查 LLM Key 失敗:', error);
          setHasLlmKey(null);
        }

        // 權限檢查邏輯：
        // 1. 如果用戶已訂閱（VIP），直接允許
        // 2. 如果用戶有 LLM Key，允許使用（使用自己的 Key）
        // 3. 否則檢查試用期（後端會處理）
        if (user.is_subscribed) {
          setHasPermission(true);
          setCheckingPermission(false);
          return;
        }

        // 如果有 LLM Key，允許使用
        if (hasLlmKeyValue) {
          setHasPermission(true);
          setCheckingPermission(false);
          return;
        }

        // 對於未訂閱且沒有 LLM Key 的用戶，允許進入但使用時會檢查權限
        // 後端會根據試用期（7天內）或 LLM Key 判斷是否有權限
          setHasPermission(null); // 設為 null 表示未知，允許進入但使用時會檢查
      } catch (error) {
        console.error('檢查權限時出錯:', error);
        // 開發階段：即使出錯也允許使用
        setHasPermission(true);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [isLoggedIn, user, navigate]);

  // 獲取 localStorage 鍵名
  const getStorageKey = () => `mode1_saved_results_${user?.user_id || 'guest'}`;

  // 從 localStorage 載入暫存的結果
  const loadFromLocalStorage = (): SavedResult[] => {
    try {
      if (!user?.user_id) return [];
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // 將 timestamp 字串轉換回 Date 對象
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        savedToDB: false // localStorage 中的都是未儲存到資料庫的
      }));
    } catch (error) {
      console.error('從 localStorage 載入失敗:', error);
      return [];
    }
  };

  // 保存到 localStorage
  const saveToLocalStorage = (results: SavedResult[], saveAll: boolean = false) => {
    try {
      if (!user?.user_id) return;
      const storageKey = getStorageKey();
      // 如果 saveAll 為 true，保存所有結果（包括已保存到資料庫的，用於緩存）
      // 否則只保存未儲存到資料庫的結果
      const toSave = saveAll ? results : results.filter(r => !r.savedToDB);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
      console.log('[Mode1] 已保存到 localStorage:', toSave.length, '個結果', saveAll ? '(包含已保存到資料庫的)' : '(僅未保存的)');
    } catch (error) {
      console.error('保存到 localStorage 失敗:', error);
    }
  };

  // 頁面載入時立即載入 localStorage 緩存（不等待權限檢查）
  useEffect(() => {
    if (user?.user_id) {
      const localResults = loadFromLocalStorage();
      if (localResults.length > 0) {
        setSavedResults(localResults);
        console.log('[Mode1] 從 localStorage 載入緩存:', localResults.length, '個結果');
      }
    }
  }, [user?.user_id]); // 只在 user_id 變化時執行

  // 如果是從 UserDB 的 14 天規劃導入，自動把內容發送給 AI
  useEffect(() => {
    if (
      !fromPlanningState?.fromPlanning ||
      !fromPlanningState.planningContent ||
      hasConsumedPlanningState
    ) {
      return;
    }
    // 開發階段：放寬權限檢查，只要已登入即可
    // 需要已登入且權限檢查完成，並且目前沒有對話內容在畫面上，避免打亂使用者既有對話
    if (!user || checkingPermission || messages.length > 0) {
      return;
    }
    // 開發階段：暫時移除 hasPermission === false 的檢查
    // if (!user || checkingPermission || hasPermission === false || messages.length > 0) {
    //   return;
    // }

    const content = fromPlanningState.planningContent;
    if (!content.trim()) return;

    // 將內容放入輸入框，接著在下一個事件迴圈送出
    setInput(content);
    setHasConsumedPlanningState(true);

    setTimeout(() => {
      handleSend();
      // 清除路由 state，避免返回時重複觸發
      navigate('/mode1', { replace: true, state: null });
    }, 0);
  }, [
    fromPlanningState?.fromPlanning,
    fromPlanningState?.planningContent,
    hasConsumedPlanningState,
    user,
    checkingPermission,
    hasPermission,
    messages.length,
    navigate,
  ]);
  
  // 載入歷史記錄（開發階段：放寬權限檢查）
  useEffect(() => {
    // 開發階段：只要已登入且權限檢查完成，就載入數據
    if (user?.user_id && !checkingPermission) {
      // 開發階段：直接載入，不檢查 hasPermission
      loadHistory();
      // 同時載入生成結果（從資料庫和 localStorage）
      loadSavedResults(true); // 先顯示緩存，然後異步更新資料庫數據
    }
    
    // 正式環境的權限檢查邏輯（暫時註釋）
    /*
    if (hasPermission === true) {
      loadHistory();
      loadSavedResults(true);
    } else if (user?.user_id && !checkingPermission) {
      loadSavedResults(true);
    }
    */
  }, [activeTab, hasPermission, user?.user_id, checkingPermission]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // 滾動到底部後隱藏按鈕
    setShowScrollToBottom(false);
  }, [messages]);

  // 檢查是否在底部
  const checkIfAtBottom = () => {
    if (!scrollAreaRef.current) return;
    
    const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    if (!viewport) return;
    
    const threshold = 100; // 距離底部 100px 以內視為在底部
    const isAtBottom = 
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;
    
    setShowScrollToBottom(!isAtBottom);
  };

  // 滾動到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // 也嘗試直接滾動 viewport
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    setShowScrollToBottom(false);
  };

  // 監聽滾動事件
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const viewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    if (!viewport) return;
    
    // 初始檢查
    checkIfAtBottom();
    
    // 監聽滾動事件（使用節流優化性能）
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        checkIfAtBottom();
        scrollTimeout = null;
      }, 100); // 每 100ms 最多檢查一次
    };
    
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    
    // 監聽內容變化（當訊息更新時）
    const resizeObserver = new ResizeObserver(() => {
      checkIfAtBottom();
    });
    resizeObserver.observe(viewport);
    
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [messages]); // 當訊息更新時重新檢查

  // 載入歷史記錄
  const loadHistory = async () => {
    try {
      // 增加超時時間到 30 秒，因為後端處理可能需要較長時間
      const data = await apiGet<{ results: HistoryItem[] }>('/api/ip-planning/my', {
        timeout: 30000 // 30 秒超時
      });
      const filtered = data.results.filter(item => item.type === activeTab);
      setHistory(filtered);
    } catch (error: any) {
      console.error('載入歷史記錄失敗:', error);
      // 如果是超時錯誤，不顯示錯誤訊息（後端可能正在處理）
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        console.log('載入歷史記錄超時，但後端可能正在處理，不顯示錯誤');
        return;
      }
      // 如果是 401 錯誤，不顯示錯誤訊息（用戶未登入）
      if (error && typeof error === 'object' && 'status' in error && error.status !== 401) {
        toast.error('載入歷史記錄失敗');
      }
    }
  };

  // 載入生成結果（從資料庫和 localStorage）
  // 優化：先顯示 localStorage 緩存，然後異步更新資料庫數據
  const loadSavedResults = async (showCacheFirst: boolean = false) => {
    try {
      if (!user?.user_id) return;
      
      // 1. 先從 localStorage 載入（立即顯示，無需等待）
      const localResults = loadFromLocalStorage();
      
      if (showCacheFirst && localResults.length > 0) {
        // 如果要求先顯示緩存，立即設置 localStorage 的結果
        setSavedResults(localResults);
      }
      
      // 2. 從資料庫載入（異步，不阻塞 UI）
      let dbResults: SavedResult[] = [];
      try {
        // 增加超時時間到 30 秒，因為後端處理可能需要較長時間
        const data = await apiGet<{ results: HistoryItem[] }>('/api/ip-planning/my', {
          timeout: 30000 // 30 秒超時
        });
        
        // 將資料庫結果轉換為 SavedResult 格式
        dbResults = data.results.map(item => {
          // 映射 result_type 到 category
          // 注意：需要根據 metadata.category 來判斷，如果沒有則使用 result_type
          let category: 'positioning' | 'topics' | 'planning' | 'script' = 'positioning';
          
          // 優先使用 metadata.category（更準確）
          if (item.metadata?.category) {
            category = item.metadata.category as 'positioning' | 'topics' | 'planning' | 'script';
          } else {
            // 如果沒有 metadata.category，使用 result_type 映射
            // 重要：'plan' 類型需要進一步判斷是 'planning' 還是 'topics'
            // 如果 title 或 content 中包含"14天"或"14 天"，則是 'planning'，否則可能是 'topics'
            const categoryMap: Record<string, 'positioning' | 'topics' | 'planning' | 'script'> = {
              'profile': 'positioning',
              'scripts': 'script'
            };
            
            if (item.type === 'plan' || item.type === 'planning') {
              // 判斷是 14天規劃 還是 選題方向
              const titleContent = ((item.title || '') + ' ' + (item.content || '')).toLowerCase();
              if (titleContent.includes('14天') || titleContent.includes('14 天') || titleContent.includes('14天規劃') || titleContent.includes('14 天規劃')) {
                category = 'planning';
              } else {
                // 預設為 topics（選題方向）
                category = 'topics';
              }
            } else if (item.type === 'topics') {
              category = 'topics';
            } else {
              category = categoryMap[item.type as keyof typeof categoryMap] || 'positioning';
            }
          }
          
          return {
            id: item.id,
            title: item.title,
            content: item.content,
            category: category,
            timestamp: new Date(item.created_at),
            isEditing: false,
            savedToDB: true // 標記為已儲存到資料庫
          };
        });
      } catch (error: any) {
        console.error('從資料庫載入失敗:', error);
        // 如果是 403 錯誤（權限不足），這是正常的，不顯示錯誤
        // 但如果是其他錯誤（如網絡錯誤、超時），記錄詳細信息
        if (error?.response?.status !== 403 && error?.response?.status !== 401) {
          console.warn('[Mode1] 資料庫載入失敗，將僅顯示 localStorage 緩存:', {
            status: error?.response?.status,
            message: error?.message,
            timeout: error?.code === 'ECONNABORTED'
          });
        }
      }
      
      // 3. 合併結果（避免重複）
      const dbIds = new Set(dbResults.map(r => r.id));
      
      // 過濾掉已經在資料庫中的本地結果（避免重複）
      const localOnly = localResults.filter(r => !dbIds.has(r.id));
      
      // 合併：資料庫結果 + localStorage 結果
      const allResults = [...dbResults, ...localOnly];
      
      // 按時間排序（最新的在前）
      allResults.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // 更新狀態（包含資料庫和本地結果）
      setSavedResults(allResults);
      
      // 4. 更新 localStorage（保存所有結果，包括已保存到資料庫的，用於緩存）
      saveToLocalStorage(allResults, true); // true 表示保存所有結果（包括已保存到資料庫的）
      
      console.log('[Mode1] 生成結果載入完成:', {
        資料庫結果: dbResults.length,
        localStorage結果: localResults.length,
        合併後總數: allResults.length,
        已保存到資料庫: allResults.filter(r => r.savedToDB).length
      });
    } catch (error) {
      console.error('載入生成結果失敗:', error);
      // 即使出錯，也至少顯示 localStorage 的數據
      if (showCacheFirst) {
        const localResults = loadFromLocalStorage();
        if (localResults.length > 0) {
          setSavedResults(localResults);
        }
      }
    }
  };

  // 檢測儲存意圖
  const detectSaveIntent = (message: string): boolean => {
    const saveKeywords = ['儲存', '保存', '存起來', 'save', '存檔', '記錄'];
    return saveKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
  };

  // 根據對話內容判斷 category
  const detectCategory = (userMessage: string, aiResponse: string): 'positioning' | 'topics' | 'planning' | 'script' => {
    const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
    const hasTable = /\|.+\|/.test(aiResponse);
    
    console.log('[Mode1] 分類檢測:', {
      userMessage: userMessage.substring(0, 50),
      combinedText: combinedText.substring(0, 100),
      hasTable: hasTable
    });
    
    // 1. 優先檢測 14天規劃相關關鍵字（提高優先級，避免被誤判為腳本）
    const planningKeywords = [
      '14天', '14 天', '14天規劃', '14 天規劃', '14天內容', '14 天內容',
      'planning', '十四天', '十四 天', '兩週', '兩周', '14日', '14 日',
      '14 天短影音', '14天短影音', '14 天內容規劃', '14天內容規劃',
      '內容策略矩陣', 'content mix framework', '14天內容策略'
    ];
    const matchedPlanningKeyword = planningKeywords.find(keyword => combinedText.includes(keyword));
    if (matchedPlanningKeyword) {
      console.log('[Mode1] 分類結果: planning (14天規劃)', { matchedKeyword: matchedPlanningKeyword });
      return 'planning';
    }
    
    // 2. 檢測腳本相關關鍵字（需要更精確的匹配，避免誤判）
    // 只有在明確提到腳本生成時才分類為腳本
    const scriptKeywords = [
      '今日腳本', '短影音腳本', '生成腳本', '幫我寫腳本', '幫我生成腳本',
      'script', '台詞', '劇本', '腳本內容'
    ];
    // 檢查是否在用戶訊息中明確提到腳本（優先級更高）
    const userMessageLower = userMessage.toLowerCase();
    if (scriptKeywords.some(keyword => userMessageLower.includes(keyword))) {
      console.log('[Mode1] 分類結果: script (用戶明確要求腳本)');
      return 'script';
    }
    // 如果 AI 回應中明確提到腳本生成，且沒有規劃相關內容
    if (scriptKeywords.some(keyword => aiResponse.toLowerCase().includes(keyword)) && 
        !planningKeywords.some(keyword => combinedText.includes(keyword))) {
      console.log('[Mode1] 分類結果: script (AI 回應包含腳本)');
      return 'script';
    }
    
    // 3. 檢測選題方向相關關鍵字
    const topicsKeywords = [
      '選題', '選題方向', '主題', '內容方向', 'topics', 
      '推薦主題', '主題推薦', '內容主題'
    ];
    if (topicsKeywords.some(keyword => combinedText.includes(keyword))) {
      console.log('[Mode1] 分類結果: topics');
      return 'topics';
    }
    
    // 4. 檢測定位相關關鍵字
    const positioningKeywords = [
      '定位', '人設', 'ip profile', '帳號定位', '個人品牌', 
      '品牌定位', 'positioning', '帳號設定', '帳號規劃'
    ];
    if (positioningKeywords.some(keyword => combinedText.includes(keyword))) {
      console.log('[Mode1] 分類結果: positioning');
      return 'positioning';
    }
    
    // 5. 改進預設值邏輯：根據 AI 回應的結構判斷
    // 如果 AI 回應包含表格且包含「天」或「day」或「規劃」，優先判斷為 14 天規劃
    const hasDayPattern = /\d+[天日]|day\s*\d+|第\s*\d+[天日]|規劃|planning/i.test(aiResponse);
    const hasPlanningPattern = /內容規劃|內容策略|規劃.*天|天.*規劃/i.test(aiResponse);
    if (hasTable && (hasDayPattern || hasPlanningPattern)) {
      console.log('[Mode1] 分類結果: planning (根據表格和規劃模式)');
      return 'planning';
    }
    
    // 如果 AI 回應包含「第 X 天」或「Day X」或明確的規劃內容，可能是規劃
    if (hasDayPattern || hasPlanningPattern) {
      console.log('[Mode1] 分類結果: planning (根據 AI 回應結構)');
      return 'planning';
    }
    
    // 如果 AI 回應明確包含「腳本」或「台詞」，且沒有規劃相關內容，可能是腳本
    if (/腳本|台詞|劇本/i.test(aiResponse) && !hasPlanningPattern) {
      console.log('[Mode1] 分類結果: script (根據 AI 回應結構)');
      return 'script';
    }
    
    // 預設為定位（向後兼容）
    console.log('[Mode1] 分類結果: positioning (預設)');
    return 'positioning';
  };

  // 自動儲存結果（改進：自動保存到資料庫）
  const autoSaveResult = async (content: string, category: 'positioning' | 'topics' | 'planning' | 'script') => {
    const categoryTitles: Record<'positioning' | 'topics' | 'planning' | 'script', string> = {
      'positioning': '帳號定位',
      'topics': '選題方向',
      'planning': '14天規劃',
      'script': '短影音腳本'
    };
    
    const newResult: SavedResult = {
      id: Date.now().toString(),
      title: `${categoryTitles[category]} - ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      content: content,
      category: category,
      timestamp: new Date(),
      isEditing: false,
      savedToDB: false // 標記為未儲存到資料庫
    };

    setSavedResults(prev => {
      const updated = [newResult, ...prev];
      // 同時保存到 localStorage
      saveToLocalStorage(updated);
      return updated;
    });
    
    // 自動切換到對應的標籤頁
    setResultTab(category);
    
    // 自動打開生成結果面板
    setShowResults(true);
    
    // 改進：自動嘗試保存到資料庫（如果用戶已登入且有權限）
    if (isLoggedIn && user?.user_id) {
      try {
        // 映射 category 到 result_type（修复：与 handleSaveToUserDB 保持一致）
        const resultTypeMap: Record<'positioning' | 'topics' | 'planning' | 'script', string> = {
          'positioning': 'profile',    // 帳號定位 → profile
          'topics': 'plan',            // 選題方向 → plan（修复：后端只接受 profile, plan, scripts）
          'planning': 'plan',          // 14 天規劃 → plan
          'script': 'scripts'
        };

        const result_type = resultTypeMap[category] || 'profile';
        
        const savePayload = {
          user_id: user.user_id,
          result_type: result_type,
          title: newResult.title,
          content: newResult.content,
          metadata: {
            source: 'mode1',
            category: category,  // 重要：確保 14天規劃的 category 是 'planning'
            timestamp: newResult.timestamp.toISOString(),
            auto_saved: true // 標記為自動保存
          }
        };
        
        console.log('[Mode1 AutoSave] 自動保存到資料庫:', savePayload);
        
        // 靜默保存，不顯示錯誤（除非是網絡錯誤）
        await apiPost('/api/ip-planning/save', savePayload);
        
        console.log('[Mode1 AutoSave] 自動保存成功');
        
        // 標記為已儲存到資料庫
        setSavedResults(prev => {
          const updated = prev.map(r => 
            r.id === newResult.id ? { ...r, savedToDB: true } : r
          );
          // 更新 localStorage（已儲存到資料庫的項目會從 localStorage 移除）
          saveToLocalStorage(updated);
          return updated;
        });
        
        // 發送自定義事件，通知 UserDB 頁面刷新資料
        window.dispatchEvent(new CustomEvent('userdb-data-updated', {
          detail: { type: 'ip-planning' }
        }));
        
        // 顯示成功提示
        toast.success('已自動儲存到生成結果', {
          description: `已切換到「${categoryTitles[category]}」標籤頁，並自動保存到創作者資料庫`,
          duration: 3000
        });
      } catch (error: any) {
        // 靜默處理權限錯誤（403）和認證錯誤（401），只記錄其他錯誤
        if (error?.response?.status === 403 || error?.response?.status === 401) {
          console.log('[Mode1 AutoSave] 自動保存失敗（權限不足或未登入），將保留在本地:', error?.response?.status);
          // 仍然顯示成功提示，但說明只保存到本地
          toast.success('已自動儲存到生成結果', {
            description: `已切換到「${categoryTitles[category]}」標籤頁，點擊「生成結果」查看`,
            duration: 3000
          });
        } else {
          // 網絡錯誤或其他錯誤，記錄但不影響用戶體驗
          console.warn('[Mode1 AutoSave] 自動保存到資料庫失敗（將保留在本地）:', error);
          toast.success('已自動儲存到生成結果', {
            description: `已切換到「${categoryTitles[category]}」標籤頁，點擊「生成結果」查看`,
            duration: 3000
          });
        }
      }
    } else {
      // 未登入，只顯示本地保存提示
      toast.success('已自動儲存到生成結果', {
        description: `已切換到「${categoryTitles[category]}」標籤頁，點擊「生成結果」查看`,
        duration: 3000
      });
    }
  };

  // 發送訊息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const inputText = input.trim();
    
    // 檢測是否為 URL，如果是則先抓取內容（允許替換現有上下文）
    if (isUrl(inputText)) {
      await handleUrlFetch(inputText);
      setInput(''); // 清空輸入框
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };
    
    // 儲存當前的 prompt 以便「換一個」功能使用
    const currentPrompt = inputText;

    // 檢測儲存意圖
    const shouldAutoSave = detectSaveIntent(userMessage.content);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantMessage = '';

    try {
      // 統一使用一個 API endpoint，讓 LLM 自動判斷類型
      const endpoint = '/api/chat/stream';
      const requestData = {
        message: userMessage.content,
        history: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        conversation_type: 'ip_planning', // IP 人設規劃類型
        user_id: user?.user_id || null, // 使用當前登入用戶的 ID
        feature_mode: 'mode1', // 新增：指定使用 Mode1 權限檢查
        context_id: contextId || null, // 新增：LLM 上下文 ID（檔案上傳或 URL 抓取的內容）
        quality_mode: qualityMode
      };

      // 使用流式 API
      await apiStream(
        endpoint,
        requestData,
        (chunk) => {
          assistantMessage += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = assistantMessage;
            } else {
              newMessages.push({
                role: 'assistant',
                content: assistantMessage,
                timestamp: Date.now(),
                prompt: currentPrompt // 儲存 prompt 以便「換一個」
              });
            }
            
            return newMessages;
          });
        },
        (error: any) => {
          console.error('流式請求錯誤:', error);
          setIsLoading(false);
          
          // 根本修复：增强错误消息提取，处理各种可能的错误格式
          const errorMessage = error?.message || 
                              error?.content ||
                              error?.response?.data?.error ||
                              error?.response?.data?.message ||
                              error?.response?.data?.detail ||
                              (typeof error === 'string' ? error : '生成失敗，請稍後再試');
          
          // 清理錯誤訊息，移除可能的技術性錯誤訊息
          const cleanedErrorMessage = errorMessage.replace(/cannot access local variable 'error_msg' where it is not associated with a value/i, '伺服器處理錯誤，請稍後再試').replace(/cannot access (local variable|free variable) 'chat' where it is not associated with a value/i, '伺服器處理錯誤，請稍後再試');
          
          // 區分「用量已達上限」和「API 配額用盡」
          const isDailyLimitReached = cleanedErrorMessage.includes('已達今日上限') || 
                                      cleanedErrorMessage.includes('已達') && cleanedErrorMessage.includes('上限') ||
                                      cleanedErrorMessage.includes('今日') && cleanedErrorMessage.includes('上限') ||
                                      cleanedErrorMessage.includes('daily') && cleanedErrorMessage.includes('limit') ||
                                      cleanedErrorMessage.includes('請明天再試');
          
          const isApiQuotaError = (cleanedErrorMessage.includes('配額') && !isDailyLimitReached) || 
                                 cleanedErrorMessage.includes('quota') || 
                                 cleanedErrorMessage.includes('exceeded') ||
                                 cleanedErrorMessage.includes('rate limit') ||
                                 error?.error_code === '429' ||
                                 error?.is_quota_error === true;
          
          // 處理 403 錯誤 (權限不足/試用期已過)
          // Mode1 必須訂閱或試用期內才能使用，即使有 LLM Key 也不能繞過此限制
          if (error?.response?.status === 403 || (error && typeof error === 'object' && 'status' in error && error.status === 403)) {
            const errorMsg = error?.response?.data?.error || error?.message || cleanedErrorMessage || '試用期已過，請訂閱以繼續使用';
            setHasPermission(false);
            setShowSubscriptionDialog(true);
            toast.error(errorMsg, {
              action: {
                label: '去訂閱',
                onClick: () => navigate('/pricing')
              },
              duration: 5000
            });
          } 
          // 處理「用量已達上限」（平台配額限制）
          else if (isDailyLimitReached) {
            toast.error('⚠️ 今日用量已達上限', {
              description: cleanedErrorMessage || '您今日的使用次數已用完，請明天再試或升級方案',
              duration: 8000,
              action: {
                label: '查看用量',
                onClick: () => navigate('/settings')
              }
            });
          }
          // 處理「API 配額用盡」（Gemini API 配額限制）
          else if (isApiQuotaError || error?.response?.status === 429) {
            toast.error('⚠️ API 配額已用盡', {
              description: '請檢查您的 API 金鑰配額或稍後再試',
              duration: 8000,
              action: {
                label: '查看用量',
                onClick: () => window.open('https://ai.dev/usage?tab=rate-limit', '_blank')
              }
            });
          } 
          else if (error?.response?.status === 401) {
            toast.error('登入已過期，請重新登入', {
              action: {
                label: '去登入',
                onClick: () => navigate('/login')
              }
            });
          } 
          else {
            // 使用清理後的錯誤訊息
            toast.error(cleanedErrorMessage, {
              duration: 5000
            });
          }
        },
        () => {
          setIsLoading(false);
          
          // 如果檢測到儲存意圖，自動儲存結果
          if (shouldAutoSave && assistantMessage) {
            const category = detectCategory(userMessage.content, assistantMessage);
            console.log('[Mode1] 自動儲存檢測:', {
              userMessage: userMessage.content,
              category: category,
              hasContent: !!assistantMessage
            });
            autoSaveResult(assistantMessage, category);
            // 如果是 14 天規劃，確保切換到正確的標籤頁
            if (category === 'planning') {
              setResultTab('planning');
              toast.info('14 天規劃已自動儲存到生成結果，請點擊「生成結果」查看「14天規劃」標籤頁。', { duration: 5000 });
            }
          }
          
          // 重新載入歷史記錄
          loadHistory();
        }
      );
    } catch (error: any) {
      console.error('發送訊息失敗:', error);
      toast.error(error.message || '發送失敗');
      setIsLoading(false);
    }
  };

  // 快速按鈕點擊
  const handleQuickButton = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  // 處理檔案上傳
  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('請先登入');
      return;
    }

    // 檢查檔案格式
    const fileExt = file.name.toLowerCase().split('.').pop() || '';
    const supportedFormats = ['txt', 'md', 'docx', 'pdf'];
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    
    if (imageFormats.includes(fileExt)) {
      toast.error('目前不支援圖片格式，請使用文字檔案（.txt, .md, .docx, .pdf）或貼上網址');
      return;
    }
    
    if (!supportedFormats.includes(fileExt)) {
      toast.error(`不支援的檔案格式: .${fileExt}。目前支援: .txt, .md, .docx, .pdf`);
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 使用 axios 直接發送 FormData（不通過 apiPost，因為需要 multipart/form-data）
      const { useAuthStore } = await import('@/stores/authStore');
      const token = useAuthStore.getState().token;
      const axios = (await import('axios')).default;
      const { API_BASE_URL } = await import('@/lib/api-config');
      
      const response = await axios.post<{
        context_id: string;
        source_type: string;
        source_name: string;
        content_length: number;
        message: string;
      }>(`${API_BASE_URL}/api/llm/context/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        withCredentials: true
      });
      
      const responseData = response.data;

      setContextId(responseData.context_id);
      setContextSource({
        type: 'file',
        name: responseData.source_name
      });
      toast.success(`✅ 檔案「${responseData.source_name}」已上傳，內容已準備好供 AI 使用`);
    } catch (error: any) {
      console.error('檔案上傳失敗:', error);
      toast.error(error?.response?.data?.error || error?.message || '檔案上傳失敗');
    } finally {
      setUploadingFile(false);
    }
  };

  // 處理 URL 抓取
  const handleUrlFetch = async (url: string) => {
    if (!url.trim()) {
      toast.error('請輸入 URL');
      return;
    }

    if (!user) {
      toast.error('請先登入');
      return;
    }

    setFetchingUrl(true);
    try {
      const response = await apiPost<{
        context_id: string;
        source_type: string;
        source_name: string;
        content_length: number;
        message: string;
      }>('/api/llm/context/fetch-url', {
        url: url.trim()
      });

      setContextId(response.context_id);
      setContextSource({
        type: 'url',
        name: response.source_name
      });
      toast.success(`✅ URL 內容已抓取，內容已準備好供 AI 使用`);
    } catch (error: any) {
      console.error('URL 抓取失敗:', error);
      toast.error(error?.response?.data?.error || error?.message || 'URL 抓取失敗');
    } finally {
      setFetchingUrl(false);
    }
  };

  // 檢測是否為 URL（更準確的檢測）
  const isUrl = (text: string): boolean => {
    const trimmed = text.trim();
    // 檢測是否包含 http:// 或 https://
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }
    }
    // 檢測是否為常見的網址格式（包含 .com, .tw, .org 等）
    const urlPattern = /^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(trimmed) && trimmed.includes('.');
  };

  // 清除上下文
  const handleClearContext = () => {
    setContextId(null);
    setContextSource(null);
    toast.info('已清除參考資料');
  };

  // 處理檔案拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 刪除歷史記錄
  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/ip-planning/results/${id}`);
      toast.success('刪除成功');
      loadHistory();
    } catch (error: any) {
      toast.error(error.message || '刪除失敗');
    }
  };

  // 刪除生成結果
  const handleDeleteResult = (id: string) => {
    setSavedResults(prev => prev.filter(r => r.id !== id));
    toast.success('已刪除');
  };

  // 編輯結果標題
  const handleEditTitle = (id: string, newTitle: string) => {
    setSavedResults(prev => prev.map(r => 
      r.id === id ? { ...r, title: newTitle, isEditing: false } : r
    ));
  };

  // 複製結果內容
  const handleCopyResult = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已複製到剪貼簿');
  };

  // 儲存到 UserDB
  const handleSaveToUserDB = async (result: SavedResult) => {
    try {
      console.log('[Mode1 Save] 開始儲存:', {
        category: result.category,
        title: result.title,
        isLoggedIn: isLoggedIn,
        hasUser: !!user,
        userId: user?.user_id,
        authLoading: authLoading,
        token: !!useAuthStore.getState().token
      });

      // 如果正在載入認證狀態，等待載入完成
      if (authLoading) {
        toast.info('正在載入用戶資訊，請稍候...');
        return;
      }

      // 更嚴格的檢查：同時檢查 isLoggedIn 和 user?.user_id
      // 如果檢查失敗，嘗試從 store 獲取最新的用戶狀態（可能閉包中的 user 已過時）
      let finalUser = user;
      if (!isLoggedIn || !user?.user_id) {
        console.warn('[Mode1 Save] 登入狀態檢查失敗，嘗試從 store 獲取最新狀態:', {
          isLoggedIn,
          hasUser: !!user,
          userId: user?.user_id,
          token: !!useAuthStore.getState().token
        });
        
        // 從 store 獲取最新的用戶狀態
        const storeState = useAuthStore.getState();
        finalUser = storeState.user;
        
        // 如果 store 中也沒有用戶資訊，但 token 存在，嘗試重新獲取
        if (!finalUser?.user_id && storeState.token) {
          console.log('[Mode1 Save] Token 存在但用戶資訊缺失，嘗試重新獲取...');
          try {
            await storeState.fetchCurrentUser();
            finalUser = useAuthStore.getState().user;
            if (!finalUser?.user_id) {
              // 如果是已訂閱用戶，不應該跳轉到登入頁，可能是狀態同步問題
              if (finalUser?.is_subscribed || user?.is_subscribed) {
                console.warn('[Mode1 Save] 已訂閱用戶但狀態檢查失敗，可能是狀態同步問題');
                toast.error('無法獲取用戶資訊，請重新整理頁面');
                return;
              }
              toast.error('無法獲取用戶資訊，請重新登入');
              navigate('/login');
              return;
            }
            console.log('[Mode1 Save] 用戶資訊已重新獲取，繼續儲存...');
          } catch (error) {
            console.error('[Mode1 Save] 重新獲取用戶資訊失敗:', error);
            // 如果是已訂閱用戶，不應該跳轉到登入頁
            if (finalUser?.is_subscribed || user?.is_subscribed) {
              console.warn('[Mode1 Save] 已訂閱用戶但重新獲取失敗，可能是狀態同步問題');
              toast.error('無法獲取用戶資訊，請重新整理頁面');
              return;
            }
            toast.error('登入已過期，請重新登入');
            navigate('/login');
            return;
          }
        } else if (!finalUser?.user_id) {
          // 既沒有用戶資訊也沒有 token，需要登入
          // 但如果是已訂閱用戶，可能是狀態同步問題
          if (user?.is_subscribed || finalUser?.is_subscribed) {
            console.warn('[Mode1 Save] 已訂閱用戶但狀態檢查失敗，可能是狀態同步問題');
            toast.error('無法獲取用戶資訊，請重新整理頁面');
            return;
          }
          toast.error('請先登入');
          navigate('/login');
          return;
        }
      }

      // 將 category 映射到 result_type
      const resultTypeMap: Record<string, string> = {
        'positioning': 'profile',
        'topics': 'plan',        // 選題方向 → plan
        'planning': 'plan',      // 14 天規劃 → plan
        'script': 'scripts'
      };

      const result_type = resultTypeMap[result.category] || 'profile';
      
      console.log('[Mode1 Save] 映射結果:', {
        category: result.category,
        result_type: result_type
      });

      // 調用 API 儲存到 UserDB
      // 使用 finalUser（已經過檢查和可能的重新獲取）
      if (!finalUser?.user_id) {
        toast.error('無法獲取用戶資訊，請重新登入');
        navigate('/login');
        return;
      }

      const savePayload = {
        user_id: finalUser.user_id,
        result_type: result_type,
        title: result.title,
        content: result.content,
        metadata: {
          source: 'mode1',        // 標記來源為 IP人設規劃功能
          category: result.category,  // 保存原始 category 用於區分（重要：14天規劃必須是 'planning'）
          timestamp: result.timestamp.toISOString()
        }
      };
      
      console.log('[Mode1 Save] 發送儲存請求:', savePayload);
      
      await apiPost('/api/ip-planning/save', savePayload);
      
      console.log('[Mode1 Save] 儲存成功');

      // 根據 category 告訴用戶存在哪裡（使用 category 而不是 result_type 來區分）
      let locationHint = '';
      if (result.category === 'positioning') {
        locationHint = '可在「我的資料」→「IP 人設規劃」標籤頁查看';
      } else if (result.category === 'topics') {
        locationHint = '可在「我的資料」→「IP 人設規劃」標籤頁查看（選題方向）';
      } else if (result.category === 'planning') {
        locationHint = '可在「我的資料」→「14 天規劃」標籤頁查看';
      } else if (result.category === 'script') {
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
      
      // 標記為已儲存到資料庫，但不移除（保留在生成結果中）
      setSavedResults(prev => {
        const updated = prev.map(r => 
          r.id === result.id ? { ...r, savedToDB: true } : r
        );
        // 更新 localStorage（已儲存到資料庫的項目會從 localStorage 移除）
        saveToLocalStorage(updated);
        return updated;
      });
      
      // 發送自定義事件，通知 UserDB 頁面刷新資料
      window.dispatchEvent(new CustomEvent('userdb-data-updated', {
        detail: { type: 'ip-planning' }
      }));
    } catch (error: any) {
      console.error('儲存到 UserDB 失敗:', error);
      
      // 處理 403 錯誤 (權限不足/試用期已過)
      // Mode1 必須訂閱或試用期內才能使用，即使有 LLM Key 也不能繞過此限制
      if (error?.response?.status === 403 || (error && typeof error === 'object' && 'status' in error && error.status === 403)) {
        const errorMessage = error?.response?.data?.error || error?.message || '試用期已過，請訂閱以繼續使用';
        setHasPermission(false);
        setShowSubscriptionDialog(true);
        toast.error(errorMessage, {
          action: {
            label: '去訂閱',
            onClick: () => navigate('/pricing')
          },
          duration: 5000
        });
      } else if (error?.response?.status === 401) {
        toast.error('登入已過期，請重新登入', {
          action: {
            label: '去登入',
            onClick: () => navigate('/login')
          }
        });
      } else {
        toast.error(error?.response?.data?.error || error.message || '儲存失敗');
      }
    }
  };


  // 處理 Enter 鍵發送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 過濾生成結果
  const filteredResults = savedResults.filter(r => r.category === resultTab);

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">返回主控台</span>
            </Button>
          </div>
          
          {/* 中間：ReelMind（僅在桌面版置中顯示，避免手機寬度重疊） */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2">
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              生成結果
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInstructions(true)}
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            {user ? (
              <div className="hidden md:flex items-center gap-2 px-2">
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                <span className="text-sm">{user.name}</span>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
              >
                登入
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 對話區 */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-6 py-4 md:py-6">
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0 shadow-lg">
            <CardHeader className="border-b shrink-0 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                IP 人設規劃
              </CardTitle>
              <CardDescription className="text-sm">
                透過 AI 對話，建立你的 IP 人設檔案、規劃 14 天內容、生成今日腳本
              </CardDescription>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  模式：{qualityMode === 'premium' ? '高品質' : '省額度'}
                  {!supportsPremium && <span className="ml-2">（高品質僅 Pro/VIP/MAX）</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">高品質（Premium）</span>
                  <Switch checked={usePremium} onCheckedChange={setUsePremium} disabled={!supportsPremium} />
                </div>
              </div>
            </CardHeader>

            {/* 訊息列表 - 添加 ref 和相對定位 */}
            <div className="flex-1 min-h-0 relative" ref={scrollAreaRef}>
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>開始對話，讓 AI 幫你規劃</p>
                      <p className="text-sm mt-2">點擊上方快速按鈕開始</p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[75%]">
                        <div
                          className={`rounded-xl p-4 md:p-5 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <FormatText content={message.content} />
                          ) : (
                            <div className="whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          )}
                        </div>
                        
                        {/* AI 訊息下方的操作按鈕 */}
                        {message.role === 'assistant' && message.content.length > 100 && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // 找到對應的用戶訊息（用於判斷 category）
                                // 往前找最近的用戶訊息
                                let userMessage = '';
                                for (let i = index - 1; i >= 0; i--) {
                                  if (messages[i].role === 'user') {
                                    userMessage = messages[i].content;
                                    break;
                                  }
                                }
                                const category = detectCategory(userMessage, message.content);
                                autoSaveResult(message.content, category);
                              }}
                              className="text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              儲存
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (message.prompt) {
                                  setInput(message.prompt);
                                  handleSend();
                                }
                              }}
                              disabled={!message.prompt || isLoading}
                              className="text-xs"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              換一個
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* AI 思考中動畫 */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-muted rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 flex-shrink-0">
                            {/* 旋轉的載入動畫 */}
                            <div className="absolute inset-0 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">AI 思考中</span>
                            <div className="flex gap-1 mt-1">
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse"
                                  style={{
                                    animationDelay: `${i * 0.2}s`,
                                    animationDuration: '1s'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* 滾動到底部按鈕 - 浮動在右下角，避免被輸入區域遮擋 */}
              {showScrollToBottom && (
                <Button
                  onClick={scrollToBottom}
                  size="icon"
                  className="absolute bottom-24 right-4 rounded-full shadow-lg z-20 h-10 w-10 bg-primary hover:bg-primary/90 animate-in fade-in slide-in-from-bottom-2"
                  aria-label="滾動到底部"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* 輸入區 - 確保固定在底部 */}
            <div className="border-t shrink-0 bg-background sticky bottom-0">
              {/* 快速按鈕 */}
              <div className="border-b p-3 md:p-4 bg-muted/30">
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
                  {quickButtons.map((button, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 開發階段：暫時移除權限檢查，直接執行
                          handleQuickButton(button.prompt);
                        // 正式環境邏輯（暫時註釋）：
                        // if (hasPermission === false) {
                        //   setShowSubscriptionDialog(true);
                        // } else {
                        //   handleQuickButton(button.prompt);
                        // }
                      }}
                      disabled={isLoading || checkingPermission}
                      // 開發階段：暫時移除 hasPermission === false 的檢查
                      className="hover:bg-primary hover:text-primary-foreground transition-colors text-xs md:text-sm"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* 顯示當前上下文資訊（如果有） */}
              {contextId && (
                <div className="px-4 md:px-6 pb-2 pt-4">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {contextSource?.type === 'file' ? (
                          <FileText className="w-4 h-4 text-primary" />
                        ) : (
                          <Home className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          參考資料：{contextSource?.name || '未知來源'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearContext}
                        className="text-xs h-6"
                      >
                        <X className="w-3 h-3 mr-1" />
                        清除
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Textarea 和發送按鈕 */}
              <div className="p-4 md:p-6">
                <div className="flex gap-3 max-w-3xl mx-auto">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    placeholder={
                      checkingPermission 
                        ? "正在檢查權限..." 
                        : "輸入你的問題或需求，或直接拖放檔案、貼上網址...（或是直接點選快速按鈕）"
                        // 開發階段：暫時移除權限提示
                        // : hasPermission === false 
                        // ? "試用期已過，請訂閱以繼續使用"
                    }
                    className="min-h-[60px] md:min-h-[70px] resize-none text-base"
                    disabled={isLoading || checkingPermission || uploadingFile || fetchingUrl}
                    // 開發階段：暫時移除 hasPermission === false 的檢查
                  />
                  <Button
                    onClick={() => {
                      // 開發階段：暫時移除權限檢查，直接執行
                        handleSend();
                      // 正式環境邏輯（暫時註釋）：
                      // if (hasPermission === false) {
                      //   setShowSubscriptionDialog(true);
                      // } else {
                      //   handleSend();
                      // }
                    }}
                    disabled={!input.trim() || isLoading || checkingPermission}
                    // 開發階段：暫時移除 hasPermission === false 的檢查
                    size="icon"
                    className="h-[60px] md:h-[70px] w-[60px] md:w-[70px] shrink-0"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 使用說明 Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>使用說明</DialogTitle>
            <DialogDescription>
              了解如何使用 IP 人設規劃功能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                開始對話
              </h3>
              <p className="text-sm text-muted-foreground">
                點擊快速按鈕或輸入你的需求，開始與 AI 對話。
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                深度交流
              </h3>
              <p className="text-sm text-muted-foreground">
                詳細描述你的產業、目標受眾和內容方向，AI 會根據你的回答提供更精準的建議。
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                AI 生成內容
              </h3>
              <p className="text-sm text-muted-foreground">
                AI 會根據對話內容，生成帳號定位、14 天規劃或今日腳本。
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                儲存生成內容
              </h3>
              <p className="text-sm text-muted-foreground">
                在對話中輸入「儲存」關鍵字，AI 會自動將結果保存到生成結果管理中。你也可以手動點擊「生成結果」按鈕查看和管理所有內容。
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">💡 使用技巧</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>先完成帳號定位，再進行 14 天規劃</li>
                <li>使用快速按鈕可以快速開始對話</li>
                <li>在對話中說「儲存」即可自動保存結果</li>
                <li>點擊「生成結果」可以查看、編輯和管理所有內容</li>
                <li>歷史記錄會自動保存，方便隨時查看</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 生成結果管理 Dialog */}
      <Dialog open={showResults} onOpenChange={(open) => {
        setShowResults(open);
        // 當打開 Dialog 時，立即顯示緩存數據，然後異步更新
        if (open && user?.user_id) {
          loadSavedResults(true); // true 表示先顯示緩存
        }
      }}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>生成結果管理</DialogTitle>
            <DialogDescription>
              查看、編輯和管理所有生成的內容
            </DialogDescription>
          </DialogHeader>

          <Tabs value={resultTab} onValueChange={(v) => setResultTab(v as any)} className="flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="positioning">帳號定位</TabsTrigger>
              <TabsTrigger value="planning">14天規劃</TabsTrigger>
              <TabsTrigger value="topics">選題方向</TabsTrigger>
              <TabsTrigger value="script">短影音腳本</TabsTrigger>
            </TabsList>

            <TabsContent value={resultTab} className="flex-1 overflow-hidden mt-4 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-4 pr-4 pb-4">
                  {filteredResults.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暫無{
                        resultTab === 'positioning' ? '帳號定位' : 
                        resultTab === 'planning' ? '14天規劃' : 
                        resultTab === 'topics' ? '選題方向' : 
                        '短影音腳本'
                      }結果</p>
                      <p className="text-sm mt-2">在對話中說「儲存」即可自動保存結果</p>
                    </div>
                  )}

                  {filteredResults.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="space-y-3">
                        {/* 標題 */}
                        <div className="flex items-start justify-between gap-2">
                          {result.isEditing ? (
                            <div className="flex-1 flex gap-2">
                              <Input
                                defaultValue={result.title}
                                onBlur={(e) => handleEditTitle(result.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditTitle(result.id, e.currentTarget.value);
                                  }
                                }}
                                className="flex-1"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSavedResults(prev => prev.map(r => 
                                  r.id === result.id ? { ...r, isEditing: false } : r
                                ))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{result.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {result.timestamp.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSavedResults(prev => prev.map(r => 
                                  r.id === result.id ? { ...r, isEditing: true } : r
                                ))}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>

                        {/* 內容預覽 */}
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {result.content}
                          </p>
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedResult(result)}
                          >
                            <Maximize2 className="w-4 h-4 mr-2" />
                            展開
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyResult(result.content)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            複製
                          </Button>
                          {!result.savedToDB && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveToUserDB(result)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              存到資料庫
                            </Button>
                          )}
                          {result.savedToDB && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              已儲存
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            刪除
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 展開結果 Dialog */}
      <Dialog open={!!expandedResult} onOpenChange={() => setExpandedResult(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-[1400px] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{expandedResult?.title}</DialogTitle>
            <DialogDescription>
              {expandedResult?.timestamp.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
            <div className="pr-4 pb-4 space-y-4">
              {expandedResult && <FormatText content={expandedResult.content} />}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => expandedResult && handleCopyResult(expandedResult.content)}
            >
              <Copy className="w-4 h-4 mr-2" />
              複製
            </Button>
            {expandedResult && !expandedResult.savedToDB && (
              <Button
                variant="outline"
                onClick={() => handleSaveToUserDB(expandedResult)}
              >
                <Save className="w-4 h-4 mr-2" />
                存到資料庫
              </Button>
            )}
            {expandedResult && expandedResult.savedToDB && (
              <Button
                variant="outline"
                disabled
                className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                已儲存到資料庫
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 訂閱推廣 Dialog (FOMO) */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎯 解鎖完整 IP 人設規劃功能</DialogTitle>
            <DialogDescription className="text-center text-base">
              您的試用期已過，訂閱即可享受完整功能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 功能列表 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">✨ 訂閱後您將獲得：</h3>
              <div className="space-y-2">
                {[
                  'IP 人設規劃工具（AI 深度對話建立個人品牌）',
                  '14 天短影音內容規劃',
                  '今日腳本快速生成',
                  '創作者資料庫完整功能',
                  '腳本歷史記錄與管理',
                  '多平台腳本優化建議',
                  '優先客服支援'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 價格資訊 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold text-primary">NT$332</span>
                <span className="text-muted-foreground">/ 月</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                年付方案，平均每月只需 NT$332（原價 NT$399/月）
              </p>
            </div>

            {/* CTA 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  setShowSubscriptionDialog(false);
                  navigate('/pricing');
                }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                立即訂閱
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => setShowSubscriptionDialog(false)}
              >
                稍後再說
              </Button>
            </div>

            {/* 額外提示 */}
            <p className="text-xs text-center text-muted-foreground">
              💡 訂閱後立即解鎖所有功能，無需等待
            </p>
          </div>
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
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  setShowLlmKeyDialog(false);
                  // 使用 window.open 在新標籤頁打開，避免重定向循環
                  window.open('/#/settings', '_blank');
                }}
              >
                <Key className="w-5 h-5 mr-2" />
                前往綁定 API Key
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => {
                  setShowLlmKeyDialog(false);
                  // 開發階段：關閉對話框後允許繼續使用
                }}
              >
                稍後再說
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
