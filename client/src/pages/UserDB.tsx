/**
 * UserDB - 使用者資料管理
 * 包含：我的腳本、對話記錄、生成記錄
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  MessageSquare, 
  Sparkles,
  Trash2,
  Download,
  RefreshCw,
  LogOut,
  Copy,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiDelete } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Script {
  id: string;
  title: string;
  content: string;
  platform: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message: string;
  created_at: string;
}

interface Generation {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
}

interface IPPlanningResult {
  id: string;
  result_type: 'profile' | 'plan' | 'scripts';
  title: string;
  content: string;
  metadata?: any;
  created_at: string;
}

export default function UserDB() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'scripts' | 'conversations' | 'generations' | 'ip-planning'>('scripts');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [ipPlanningResults, setIpPlanningResults] = useState<IPPlanningResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // 檢查登入狀態（已移除以便本地預覽）
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     toast.error('請先登入');
  //     navigate('/');
  //   }
  // }, [setLocation]);

  // 載入資料
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // 監聽資料更新事件（當 Mode1 儲存內容到 UserDB 時）
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      const { type } = event.detail || {};
      
      // 如果更新的是 IP 人設規劃資料
      if (type === 'ip-planning') {
        if (activeTab === 'ip-planning') {
          // 如果當前在 IP 人設規劃標籤，自動刷新
          loadIPPlanningResults();
          toast.info('資料已更新', { duration: 2000 });
        } else {
          // 如果不在 IP 人設規劃標籤，顯示提示
          toast.info('有新的 IP 人設規劃內容已儲存', {
            duration: 4000,
            action: {
              label: '前往查看',
              onClick: () => setActiveTab('ip-planning')
            }
          });
        }
      }
    };

    window.addEventListener('userdb-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userdb-data-updated', handleDataUpdate as EventListener);
    };
  }, [activeTab]);

  // 載入資料
  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'scripts':
          await loadScripts();
          break;
        case 'conversations':
          await loadConversations();
          break;
        case 'generations':
          await loadGenerations();
          break;
        case 'ip-planning':
          await loadIPPlanningResults();
          break;
      }
    } catch (error: any) {
      console.error('載入資料失敗:', error);
      toast.error(error.message || '載入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入腳本
  const loadScripts = async () => {
    try {
      const data = await apiGet<{ scripts: Script[] }>('/api/user/scripts/me');
      setScripts(data.scripts || []);
    } catch (error) {
      console.error('載入腳本失敗:', error);
      setScripts([]);
    }
  };

  // 載入對話記錄
  const loadConversations = async () => {
    try {
      const data = await apiGet<{ conversations: Conversation[] }>('/api/user/conversations/me');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('載入對話記錄失敗:', error);
      setConversations([]);
    }
  };

  // 載入生成記錄
  const loadGenerations = async () => {
    try {
      const data = await apiGet<{ generations: Generation[] }>('/api/user/generations/me');
      setGenerations(data.generations || []);
    } catch (error) {
      console.error('載入生成記錄失敗:', error);
      setGenerations([]);
    }
  };

  // 載入 IP 人設規劃結果
  const loadIPPlanningResults = async () => {
    try {
      const data = await apiGet<{ results: IPPlanningResult[] }>('/api/ip-planning/my');
      setIpPlanningResults(data.results || []);
    } catch (error) {
      console.error('載入 IP 人設規劃結果失敗:', error);
      setIpPlanningResults([]);
    }
  };

  // 刪除項目
  const handleDelete = async (id: string, type: string) => {
    try {
      let endpoint = '';
      switch (type) {
        case 'script':
          endpoint = `/api/user/scripts/${id}`;
          break;
        case 'conversation':
          endpoint = `/api/user/conversations/${id}`;
          break;
        case 'generation':
          endpoint = `/api/user/generations/${id}`;
          break;
        case 'ip-planning':
          endpoint = `/api/ip-planning/results/${id}`;
          break;
      }
      
      await apiDelete(endpoint);
      toast.success('刪除成功');
      loadData();
    } catch (error: any) {
      toast.error(error.message || '刪除失敗');
    }
  };

  // 複製內容
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已複製到剪貼簿');
  };

  // 查看詳情
  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  // 登出
  const handleLogout = async () => {
    await logout();
    toast.success('已登出');
    navigate('/');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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
              className="hidden md:flex gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              ReelMind
            </h1>
            <Badge variant="outline" className="hidden md:inline-flex">
              我的資料
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <div className="flex-1 container py-6">
        <Card>
          <CardHeader>
            <CardTitle>我的資料</CardTitle>
            <CardDescription>
              查看和管理你的腳本、對話記錄和生成記錄
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scripts" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  我的腳本
                </TabsTrigger>
                <TabsTrigger value="conversations" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  對話記錄
                </TabsTrigger>
                <TabsTrigger value="generations" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  生成記錄
                </TabsTrigger>
                <TabsTrigger value="ip-planning" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  IP 人設規劃
                </TabsTrigger>
              </TabsList>

              {/* 我的腳本 */}
              <TabsContent value="scripts" className="mt-6">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : scripts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">暫無腳本記錄</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>標題</TableHead>
                          <TableHead>平台</TableHead>
                          <TableHead>建立時間</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scripts.map((script) => (
                          <TableRow key={script.id}>
                            <TableCell className="font-medium">{script.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{script.platform}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(script.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(script)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(script.content)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(script.id, 'script')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* 對話記錄 */}
              <TabsContent value="conversations" className="mt-6">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">暫無對話記錄</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>標題</TableHead>
                          <TableHead>訊息數</TableHead>
                          <TableHead>最後訊息</TableHead>
                          <TableHead>時間</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversations.map((conv) => (
                          <TableRow key={conv.id}>
                            <TableCell className="font-medium">{conv.title}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{conv.message_count}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                              {conv.last_message}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(conv.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(conv)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(conv.id, 'conversation')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* 生成記錄 */}
              <TabsContent value="generations" className="mt-6">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : generations.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">暫無生成記錄</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>類型</TableHead>
                          <TableHead>標題</TableHead>
                          <TableHead>建立時間</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generations.map((gen) => (
                          <TableRow key={gen.id}>
                            <TableCell>
                              <Badge>{gen.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{gen.title}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(gen.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleView(gen)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(gen.content)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(gen.id, 'generation')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* IP 人設規劃結果 */}
              <TabsContent value="ip-planning" className="mt-6">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : ipPlanningResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">暫無 IP 人設規劃記錄</p>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground/70 mt-2">前往 Mode1 頁面生成並儲存內容</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>類型</TableHead>
                          <TableHead>標題</TableHead>
                          <TableHead>建立時間</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ipPlanningResults.map((result) => {
                          const typeLabels: Record<string, string> = {
                            'profile': '帳號定位',
                            'plan': '選題規劃',
                            'scripts': '腳本'
                          };
                          return (
                            <TableRow key={result.id}>
                              <TableCell>
                                <Badge variant="outline">{typeLabels[result.result_type] || result.result_type}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{result.title || '未命名'}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(result.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleView(result)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopy(result.content)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(result.id, 'ip-planning')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 詳情 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title || '詳情'}</DialogTitle>
            <DialogDescription>
              {selectedItem?.created_at && `建立時間：${formatDate(selectedItem.created_at)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ScrollArea className="max-h-[500px]">
              <div className="whitespace-pre-wrap break-words p-4 bg-muted rounded-lg">
                {selectedItem?.content}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedItem?.content)}
              >
                <Copy className="w-4 h-4 mr-2" />
                複製
              </Button>
              <Button onClick={() => setShowDetail(false)}>
                關閉
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
