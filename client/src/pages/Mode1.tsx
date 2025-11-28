/**
 * Mode1 - IP 人設規劃
 * 包含：帳號定位對話、14天規劃、今日腳本
 */

import { useState, useEffect, useRef } from 'react';
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
  Maximize2
} from 'lucide-react';
import { apiPost, apiGet, apiDelete, apiStream } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
}

export default function Mode1() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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

  // 檢查登入狀態（已移除以便本地預覽）
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     toast.error('請先登入');
  //     navigate('/');
  //   }
  // }, [setLocation]);

  // 載入歷史記錄
  useEffect(() => {
    loadHistory();
  }, [activeTab]);

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

  // 檢測儲存意圖
  const detectSaveIntent = (message: string): boolean => {
    const saveKeywords = ['儲存', '保存', '存起來', 'save', '存檔', '記錄'];
    return saveKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
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
        user_id: user?.user_id || null // 使用當前登入用戶的 ID
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
        (error) => {
          console.error('流式請求錯誤:', error);
          toast.error('生成失敗，請重試');
        },
        () => {
          setIsLoading(false);
          
          // 如果檢測到儲存意圖，自動儲存結果
          if (shouldAutoSave && assistantMessage) {
            const category = activeTab === 'profile' ? 'positioning' : activeTab === 'planning' ? 'topics' : 'script';
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
      // 這裡應該調用 API 儲存到 UserDB
      // await apiPost('/api/userdb/save', { ...result });
      toast.success('已儲存到創作者資料庫');
    } catch (error: any) {
      toast.error(error.message || '儲存失敗');
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
                onClick={login}
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
          <Card className="h-[calc(100vh-200px)] flex flex-col">
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
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
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
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                      
                      {/* AI 訊息下方的操作按鈕 */}
                      {message.role === 'assistant' && message.content.length > 100 && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const category = activeTab === 'profile' ? 'positioning' : activeTab === 'planning' ? 'topics' : 'script';
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
                      onClick={() => handleQuickButton(button.prompt)}
                      disabled={isLoading}
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
                  placeholder="輸入你的問題或需求...（輸入「儲存」可自動保存結果）"
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
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
      <Dialog open={showResults} onOpenChange={setShowResults}>
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

            <TabsContent value={resultTab} className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[calc(60vh-100px)]">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveToUserDB(result)}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            存到資料庫
                          </Button>
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

          <ScrollArea className="flex-1 pr-4">
            <div className="whitespace-pre-wrap text-sm">
              {expandedResult?.content}
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
            <Button
              variant="outline"
              onClick={() => expandedResult && handleSaveToUserDB(expandedResult)}
            >
              <Save className="w-4 h-4 mr-2" />
              存到資料庫
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
