/**
 * Mode1 - IP 人設規劃
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
import { 
  Send, 
  Sparkles, 
  Calendar, 
  FileText, 
  Trash2,
  Download,
  RefreshCw,
  User,
  LogOut,
  HelpCircle,
  Save,
  FolderOpen,
  CheckCircle,
  Edit2,
  X,
  Copy,
  Maximize2,
  ArrowLeft,
  Key
} from 'lucide-react';
import { apiPost, apiGet, apiDelete, apiStream } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
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
// 支援 **粗體**、*斜體*、## 標題、### 標題等
const FormatText = memo(({ content }: { content: string }) => {
  const formattedContent = useMemo(() => {
    const lines = content.split('\n');
    const result: JSX.Element[] = [];
    
    lines.forEach((line, lineIndex) => {
      // 處理標題（## 或 ### 開頭的行）
      const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const HeadingTag = level === 2 ? 'h2' : 'h3';
        result.push(
          <HeadingTag 
            key={`line-${lineIndex}`} 
            className={`font-bold ${level === 2 ? 'text-xl mt-4 mb-2' : 'text-lg mt-3 mb-1'}`}
          >
            {formatInlineMarkdown(text)}
          </HeadingTag>
        );
        return;
      }
      
      // 處理普通行（包含粗體和斜體）
      if (line.trim()) {
        result.push(
          <div key={`line-${lineIndex}`}>
            {formatInlineMarkdown(line)}
          </div>
        );
      } else {
        // 空行
        result.push(<br key={`line-${lineIndex}`} />);
      }
    });
    
    return result;
  }, [content]);
  
  return (
    <div className="break-words">
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
}

interface SavedResult {
  id: string;
  title: string;
  content: string;
  category: 'positioning' | 'topics' | 'script';
  timestamp: Date;
  isEditing?: boolean;
  savedToDB?: boolean; // 標記是否已儲存到資料庫
}

export default function Mode1() {
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuthStore();
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
  const [resultTab, setResultTab] = useState<'positioning' | 'topics' | 'script'>('positioning');
  const [expandedResult, setExpandedResult] = useState<SavedResult | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasLlmKey, setHasLlmKey] = useState<boolean | null>(null);
  const [showLlmKeyDialog, setShowLlmKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 快速按鈕
  const quickButtons = [
    { label: 'IP Profile', prompt: '請幫我建立 IP 人設檔案，包含目標受眾、傳達目標、帳號定位、內容方向、風格調性和差異化優勢。' },
    { label: '14天規劃', prompt: '請幫我生成 14 天的短影音內容規劃。' },
    { label: '今日腳本', prompt: '請幫我生成今日的短影音腳本。' },
    { label: '換腳本結構', prompt: '請提供不同的腳本結構選擇（A/B/C/D/E 五種），讓我選擇最適合的結構。' },
    { label: '重新定位', prompt: '請顯示短影音內容策略矩陣表格，協助我重新規劃帳號定位。' },
  ];

  // 檢查登入狀態和權限
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
        try {
          const llmKeyCheck = await apiGet<{ has_key: boolean; provider: string | null }>('/api/user/llm-keys/check');
          setHasLlmKey(llmKeyCheck.has_key);
          
          // 如果沒有綁定 API Key，顯示提示對話框
          if (!llmKeyCheck.has_key) {
            setShowLlmKeyDialog(true);
          }
        } catch (error) {
          console.warn('檢查 LLM Key 失敗:', error);
          setHasLlmKey(null);
        }

        // 如果用戶已訂閱（VIP），直接允許
        if (user.is_subscribed) {
          setHasPermission(true);
          setCheckingPermission(false);
          return;
        }

        // 對於未訂閱用戶，嘗試調用後端 API 檢查權限
        // 後端會根據試用期（7天內）判斷是否有權限
        try {
          // 使用 check_user_permission 的邏輯：通過嘗試發送一個測試請求來檢查權限
          // 但為了避免不必要的請求，我們直接調用權限檢查 API
          // 注意：/api/user/ip-planning/permission 使用的是 check_ip_planning_permission
          // 它檢查的是 tier 和 source，而不是試用期
          // 所以我們需要直接使用 Mode1 的權限檢查邏輯
          // 最簡單的方式：設為 null，允許進入，但在使用時會檢查權限（遇到 403 時顯示訂閱推廣）
          setHasPermission(null); // 設為 null 表示未知，允許進入但使用時會檢查
        } catch (error: any) {
          console.warn('權限檢查失敗，將在使用時檢查權限:', error);
          setHasPermission(null);
        }
      } catch (error) {
        console.error('檢查權限時出錯:', error);
        setHasPermission(null);
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [isLoggedIn, user, navigate]);

  // 載入歷史記錄（僅在有權限時載入）
  useEffect(() => {
    if (hasPermission === true) {
      loadHistory();
    }
  }, [activeTab, hasPermission]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 載入歷史記錄
  const loadHistory = async () => {
    try {
      const data = await apiGet<{ results: HistoryItem[] }>('/api/ip-planning/my');
      const filtered = data.results.filter(item => item.type === activeTab);
      setHistory(filtered);
    } catch (error) {
      console.error('載入歷史記錄失敗:', error);
      // 如果是 401 錯誤，不顯示錯誤訊息（用戶未登入）
      if (error && typeof error === 'object' && 'status' in error && error.status !== 401) {
        toast.error('載入歷史記錄失敗');
      }
    }
  };

  // 載入生成結果（從資料庫和本地狀態）
  const loadSavedResults = async () => {
    try {
      if (!user?.user_id) return;
      
      const data = await apiGet<{ results: HistoryItem[] }>('/api/ip-planning/my');
      
      // 將資料庫結果轉換為 SavedResult 格式
      const dbResults: SavedResult[] = data.results.map(item => {
        // 映射 result_type 到 category
        const categoryMap: Record<string, 'positioning' | 'topics' | 'script'> = {
          'profile': 'positioning',
          'plan': 'topics',
          'scripts': 'script'
        };
        
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          category: categoryMap[item.type] || 'positioning',
          timestamp: new Date(item.created_at),
          isEditing: false,
          savedToDB: true // 標記為已儲存到資料庫
        };
      });
      
      // 合併資料庫結果和本地結果（避免重複）
      setSavedResults(prev => {
        const localIds = new Set(prev.map(r => r.id));
        const dbIds = new Set(dbResults.map(r => r.id));
        
        // 保留本地未儲存到資料庫的結果
        const localOnly = prev.filter(r => !r.savedToDB && !dbIds.has(r.id));
        
        // 合併：資料庫結果 + 本地未儲存的結果
        return [...dbResults, ...localOnly];
      });
    } catch (error) {
      console.error('載入生成結果失敗:', error);
      // 不顯示錯誤訊息，避免打擾用戶
    }
  };

  // 檢測儲存意圖
  const detectSaveIntent = (message: string): boolean => {
    const saveKeywords = ['儲存', '保存', '存起來', 'save', '存檔', '記錄'];
    return saveKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
  };

  // 根據對話內容判斷 category
  const detectCategory = (userMessage: string, aiResponse: string): 'positioning' | 'topics' | 'script' => {
    const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
    
    // 檢測選題方向相關關鍵字（優先級較高）
    const topicsKeywords = ['14天', '14 天', '選題', '選題方向', '主題', '內容規劃', '規劃', '內容方向', 'topics'];
    if (topicsKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'topics';
    }
    
    // 檢測腳本相關關鍵字
    const scriptKeywords = ['腳本', '今日腳本', '短影音腳本', 'script', '台詞', '劇本', '腳本內容'];
    if (scriptKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'script';
    }
    
    // 檢測定位相關關鍵字
    const positioningKeywords = ['定位', '人設', 'ip profile', '帳號定位', '個人品牌', '品牌定位', 'positioning'];
    if (positioningKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'positioning';
    }
    
    // 預設為定位（向後兼容）
    return 'positioning';
  };

  // 自動儲存結果
  const autoSaveResult = (content: string, category: 'positioning' | 'topics' | 'script') => {
    const newResult: SavedResult = {
      id: Date.now().toString(),
      title: `${category === 'positioning' ? '帳號定位' : category === 'topics' ? '選題方向' : '短影音腳本'} - ${new Date().toLocaleString('zh-TW')}`,
      content: content,
      category: category,
      timestamp: new Date(),
      isEditing: false
    };

    setSavedResults(prev => [newResult, ...prev]);
    toast.success('已自動儲存到生成結果');
  };

  // 發送訊息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };
    
    // 儲存當前的 prompt 以便「換一個」功能使用
    const currentPrompt = input.trim();

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
        feature_mode: 'mode1' // 新增：指定使用 Mode1 權限檢查
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
          
          // 處理 403 錯誤 (權限不足/試用期已過)
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
            toast.error(error?.message || '生成失敗，請稍後再試');
          }
        },
        () => {
          setIsLoading(false);
          
          // 如果檢測到儲存意圖，自動儲存結果
          if (shouldAutoSave && assistantMessage) {
            const category = detectCategory(userMessage.content, assistantMessage);
            autoSaveResult(assistantMessage, category);
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
      if (!user?.user_id) {
        toast.error('請先登入');
        return;
      }

      // 將 category 映射到 result_type
      const resultTypeMap: Record<string, string> = {
        'positioning': 'profile',
        'topics': 'plan',
        'script': 'scripts'
      };

      const result_type = resultTypeMap[result.category] || 'profile';

      // 調用 API 儲存到 UserDB
      await apiPost('/api/ip-planning/save', {
        user_id: user.user_id,
        result_type: result_type,
        title: result.title,
        content: result.content,
        metadata: {
          category: result.category,
          timestamp: result.timestamp.toISOString()
        }
      });

      toast.success('已儲存到創作者資料庫');
      
      // 標記為已儲存到資料庫，但不移除（保留在生成結果中）
      setSavedResults(prev => prev.map(r => 
        r.id === result.id ? { ...r, savedToDB: true } : r
      ));
      
      // 發送自定義事件，通知 UserDB 頁面刷新資料
      window.dispatchEvent(new CustomEvent('userdb-data-updated', {
        detail: { type: 'ip-planning' }
      }));
    } catch (error: any) {
      console.error('儲存到 UserDB 失敗:', error);
      toast.error(error?.response?.data?.error || error.message || '儲存失敗');
    }
  };

  // 登出
  const handleLogout = async () => {
    await logout();
    navigate('/');
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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="hidden md:flex"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              ReelMind
            </h1>
            <span className="text-sm text-muted-foreground hidden md:inline">
              IP 人設規劃
            </span>
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
              <>
                <div className="hidden md:flex items-center gap-2 px-2">
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  <span className="text-sm">{user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="登出"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
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
      <div className="flex-1 container py-8 md:py-12">
        {/* 對話區 */}
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <Card className="h-[calc(100vh-200px)] flex flex-col overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                IP 人設規劃
              </CardTitle>
              <CardDescription>
                透過 AI 對話，建立你的 IP 人設檔案、規劃 14 天內容、生成今日腳本
              </CardDescription>
            </CardHeader>

            {/* 訊息列表 */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-4 p-4">
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
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
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

            {/* 輸入區 */}
            <div className="border-t">
              {/* 快速按鈕 */}
              <div className="border-b p-3 md:p-4 bg-muted/30">
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickButtons.map((button, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (hasPermission === false) {
                          setShowSubscriptionDialog(true);
                        } else {
                          handleQuickButton(button.prompt);
                        }
                      }}
                      disabled={isLoading || checkingPermission || hasPermission === false}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors text-xs md:text-sm"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Textarea 和發送按鈕 */}
              <div className="p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    checkingPermission 
                      ? "正在檢查權限..." 
                      : hasPermission === false 
                      ? "試用期已過，請訂閱以繼續使用" 
                      : "輸入你的問題或需求...（輸入「儲存」可自動保存結果）"
                  }
                  className="min-h-[60px] resize-none"
                  disabled={isLoading || checkingPermission || hasPermission === false}
                />
                <Button
                  onClick={() => {
                    if (hasPermission === false) {
                      setShowSubscriptionDialog(true);
                    } else {
                      handleSend();
                    }
                  }}
                  disabled={!input.trim() || isLoading || checkingPermission || hasPermission === false}
                  size="icon"
                  className="h-[60px] w-[60px]"
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
        // 當打開 Dialog 時，載入生成結果
        if (open && user?.user_id) {
          loadSavedResults();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>生成結果管理</DialogTitle>
            <DialogDescription>
              查看、編輯和管理所有生成的內容
            </DialogDescription>
          </DialogHeader>

          <Tabs value={resultTab} onValueChange={(v) => setResultTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="positioning">帳號定位</TabsTrigger>
              <TabsTrigger value="topics">選題方向</TabsTrigger>
              <TabsTrigger value="script">短影音腳本</TabsTrigger>
            </TabsList>

            <TabsContent value={resultTab} className="flex-1 overflow-hidden mt-4 min-h-0">
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pr-4">
                  {filteredResults.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暫無{resultTab === 'positioning' ? '帳號定位' : resultTab === 'topics' ? '選題方向' : '短影音腳本'}結果</p>
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
                                  {result.timestamp.toLocaleString('zh-TW')}
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{expandedResult?.title}</DialogTitle>
            <DialogDescription>
              {expandedResult?.timestamp.toLocaleString('zh-TW')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="whitespace-pre-wrap text-sm pr-4">
              {expandedResult && <FormatText content={expandedResult.content} />}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
