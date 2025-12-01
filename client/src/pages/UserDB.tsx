/**
 * UserDB - 創作者資料庫
 * 管理用戶主動保存的內容：我的腳本、IP 人設規劃、14 天規劃
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Share2,
  FileDown,
  HelpCircle,
  Home
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiDelete, apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScriptEditor from '@/components/ScriptEditor';

interface Script {
  id: string | number;
  name?: string; // 後端返回的是 name（script_name）
  title: string;
  content: string;
  script_data?: any;
  platform: string;
  topic?: string;
  profile?: string;
  created_at: string;
  updated_at?: string;
}

interface Conversation {
  id: string;
  mode: string; // 後端返回的是 mode 而不是 title
  summary: string; // 後端返回的是 summary 而不是 last_message
  message_count: number;
  created_at: string;
}

interface Generation {
  id?: string; // 後端可能沒有 id
  platform: string; // 後端返回的是 platform 而不是 type
  topic: string; // 後端返回的是 topic 而不是 title
  content: string;
  created_at: string;
}

interface IPPlanningResult {
  id: string;
  result_type: 'profile' | 'plan' | 'scripts';
  title: string;
  content: string;
  metadata?: {
    source?: 'mode1' | 'mode3';  // 來源：IP人設規劃功能 或 一鍵生成功能
    category?: 'positioning' | 'topics' | 'planning' | 'script';  // 原始分類
    timestamp?: string;
    platform?: string;
    topic?: string;
    [key: string]: any;  // 其他可能的 metadata 欄位
  };
  created_at: string;
}

type SortField = 'time' | 'title' | 'platform' | 'type';
type SortOrder = 'asc' | 'desc';

type SelectedItem = Script | IPPlanningResult | null;

export default function UserDB() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'scripts' | 'ip-planning' | 'planning'>('scripts');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [ipPlanningResults, setIpPlanningResults] = useState<IPPlanningResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDataAccessInfo, setShowDataAccessInfo] = useState(false);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [ipPlanningCategoryFilter, setIpPlanningCategoryFilter] = useState<string>('all'); // IP 人設規劃子分類篩選
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // 标题编辑状态
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');

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

  // 監聽資料更新事件（當 IP人設規劃功能 儲存內容到 UserDB 時）
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
        case 'ip-planning':
        case 'planning':
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
    if (!user?.user_id) {
      setScripts([]);
      return;
    }
    try {
      // 後端端點：/api/scripts/my（自動使用當前登入用戶）
      const data = await apiGet<{ scripts: Script[] }>('/api/scripts/my');
      setScripts(data.scripts || []);
    } catch (error) {
      console.error('載入腳本失敗:', error);
      setScripts([]);
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
          // 後端端點：DELETE /api/scripts/{script_id}
          endpoint = `/api/scripts/${id}`;
          break;
        case 'ip-planning':
          // 後端端點：DELETE /api/ip-planning/results/{result_id}
          // 注意：/api/ip-planning/ 在 CSRF 排除列表中，不需要 CSRF Token
          endpoint = `/api/ip-planning/results/${id}`;
          break;
        default:
          toast.error('未知的刪除類型');
          return;
      }
      
      await apiDelete(endpoint);
      toast.success('刪除成功');
      loadData();
    } catch (error: any) {
      console.error('刪除失敗:', error);
      const errorMessage = error?.response?.data?.error || error?.message || '刪除失敗';
      toast.error(errorMessage);
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

  // 獲取 IP 規劃結果的類型標籤（基於 metadata.category）
  const getIPPlanningTypeLabel = (result: IPPlanningResult): string => {
    const category = result.metadata?.category;
    if (category === 'positioning') return '帳號定位';
    if (category === 'topics') return '選題方向';
    if (category === 'planning') return '14 天規劃';
    if (category === 'script') return '腳本';
    // 向後兼容：如果沒有 category，使用 result_type
    const typeLabels: Record<string, string> = {
      'profile': '帳號定位',
      'plan': '選題規劃',
      'scripts': '腳本'
    };
    return typeLabels[result.result_type] || result.result_type;
  };

  // 獲取來源標籤
  const getSourceLabel = (result: IPPlanningResult): string | null => {
    const source = result.metadata?.source;
    if (source === 'mode1') return 'IP人設規劃';
    if (source === 'mode3') return '一鍵生成';
    return null;
  };

  // 保存標題
  const handleSaveTitle = async (item: Script | IPPlanningResult, newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error('標題不能為空');
      setEditingTitleId(null);
      return;
    }

    try {
      let endpoint = '';
      
      if ('platform' in item && item.platform) {
        // Script 類型
        endpoint = `/api/scripts/${item.id}/name`;
        await apiPost(endpoint, { name: newTitle.trim() });
      } else if ('result_type' in item) {
        // IP Planning 類型
        endpoint = `/api/ip-planning/results/${item.id}/title`;
        await apiPost(endpoint, { title: newTitle.trim() });
      }
      
      toast.success('標題已更新');
      setEditingTitleId(null);
      loadData(); // 重新載入資料
    } catch (error: any) {
      console.error('更新標題失敗:', error);
      toast.error(error?.response?.data?.error || '更新標題失敗');
      setEditingTitleId(null);
    }
  };

  // 儲存編輯後的內容
  const handleSaveContent = async (content: string) => {
    if (!selectedItem) return;
    
    try {
      // 根據類型選擇不同的 API endpoint
      // 注意：後端可能沒有更新 API，這裡先嘗試，如果失敗則提示
      let endpoint = '';
      
      // 判斷類型（從 selectedItem 的結構判斷）
      if ('platform' in selectedItem && selectedItem.platform && 'title' in selectedItem) {
        // Script 類型
        endpoint = `/api/user/scripts/${selectedItem.id}`;
      } else if ('result_type' in selectedItem && selectedItem.result_type) {
        // IP Planning 類型
        endpoint = `/api/ip-planning/results/${selectedItem.id}`;
      } else {
        // 預設為 script
        endpoint = `/api/user/scripts/${selectedItem.id}`;
      }
      
      try {
        await apiPost(endpoint, { content });
        toast.success('已儲存');
        
        // 更新本地狀態
        if ('content' in selectedItem) {
          setSelectedItem({ ...selectedItem, content } as SelectedItem);
        }
        loadData();
      } catch (apiError: any) {
        // 如果 API 不存在，提示用戶
        if (apiError?.response?.status === 404 || apiError?.response?.status === 405) {
          toast.info('此功能需要後端 API 支援，目前僅支援本地編輯');
          // 仍然更新本地狀態（僅前端）
          if ('content' in selectedItem) {
            setSelectedItem({ ...selectedItem, content } as SelectedItem);
          }
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      toast.error(error.message || '儲存失敗');
    }
  };

  // 匯出功能
  const handleExport = async (format: 'txt' | 'pdf' | 'word') => {
    if (!selectedItem) return;
    
    // 根據不同類型獲取內容和標題
    let content = '';
    let title = '';
    
    if ('title' in selectedItem && selectedItem.title) {
      // Script, IPPlanningResult
      title = selectedItem.title;
      content = ('content' in selectedItem && selectedItem.content) ? selectedItem.content : '';
    } else if ('topic' in selectedItem && selectedItem.topic) {
      // Generation
      title = selectedItem.topic;
      content = ('content' in selectedItem && selectedItem.content) ? selectedItem.content : '';
    } else if ('summary' in selectedItem && selectedItem.summary) {
      // Conversation - 對話記錄目前只有摘要，無法匯出完整內容
      title = selectedItem.mode || '對話記錄';
      content = `對話類型：${selectedItem.mode || '未知'}\n訊息數：${selectedItem.message_count || 0}\n摘要：\n${selectedItem.summary || '無摘要'}`;
    } else {
      title = '內容';
      content = ('content' in selectedItem && selectedItem.content) ? selectedItem.content : '';
    }
    
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('已匯出為 TXT');
    } else if (format === 'pdf') {
      // 使用瀏覽器列印功能生成 PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                pre { white-space: pre-wrap; line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <pre>${content}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } else if (format === 'word') {
      // Word 格式匯出（使用 HTML 格式）
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
          </head>
          <body>
            <h1>${title}</h1>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${content}</pre>
          </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('已匯出為 Word');
    }
  };

  // 分享功能
  const handleShare = async () => {
    if (!selectedItem) return;
    
    // 根據不同類型獲取標題和內容
    let title = '';
    let text = '';
    let itemId = '';
    
    if ('title' in selectedItem && selectedItem.title) {
      // Script, IPPlanningResult
      title = selectedItem.title;
      text = ('content' in selectedItem && selectedItem.content) ? selectedItem.content.substring(0, 100) : '';
      itemId = selectedItem.id.toString();
    } else if ('topic' in selectedItem && selectedItem.topic) {
      // Generation
      title = selectedItem.topic;
      text = ('content' in selectedItem && selectedItem.content) ? selectedItem.content.substring(0, 100) : '';
      itemId = selectedItem.id?.toString() || '';
    } else if ('summary' in selectedItem && selectedItem.summary) {
      // Conversation
      title = selectedItem.mode || '對話記錄';
      text = (selectedItem.summary && typeof selectedItem.summary === 'string') ? selectedItem.summary.substring(0, 100) : '';
      itemId = selectedItem.id;
    } else {
      title = '內容';
      text = ('content' in selectedItem && selectedItem.content) ? selectedItem.content.substring(0, 100) : '';
      itemId = ('id' in selectedItem) ? selectedItem.id.toString() : '';
    }
    
    const shareData = {
      title: title || '內容',
      text: text ? text + '...' : '',
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('已分享');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // 如果不支援分享，則複製連結
          const shareUrl = `${window.location.origin}${window.location.pathname}#/share/${itemId}`;
          navigator.clipboard.writeText(shareUrl);
          toast.success('連結已複製到剪貼簿');
        }
      }
    } else {
      // 降級方案：複製連結
      const shareUrl = `${window.location.origin}${window.location.pathname}#/share/${itemId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('連結已複製到剪貼簿');
    }
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

  // 获取所有平台列表（用于筛选）
  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    scripts.forEach(s => s.platform && platforms.add(s.platform));
    return Array.from(platforms).sort();
  }, [scripts]);

  // 统计数据（使用 metadata.category 区分选题方向和 14 天规划）
  const stats = useMemo(() => {
    // 14 天规划：result_type === 'plan' 且 metadata.category === 'planning'
    const planningResults = ipPlanningResults.filter(r => 
      r.result_type === 'plan' && r.metadata?.category === 'planning'
    );
    
    // IP 人設規劃：包含帳號定位、選題方向、腳本
    // - result_type === 'profile' (帳號定位)
    // - result_type === 'plan' 且 metadata.category === 'topics' (選題方向)
    // - result_type === 'scripts' (腳本)
    const ipPlanningResults_filtered = ipPlanningResults.filter(r => {
      if (r.result_type === 'profile') return true;  // 帳號定位
      if (r.result_type === 'scripts') return true;  // 腳本
      if (r.result_type === 'plan' && r.metadata?.category === 'topics') return true;  // 選題方向
      return false;
    });
    
    return {
      scripts: scripts.length,
      ipPlanning: ipPlanningResults_filtered.length,
      planning: planningResults.length,
      total: scripts.length + ipPlanningResults.length
    };
  }, [scripts, ipPlanningResults]);

  // 过滤和排序后的数据
  const filteredAndSortedData = useMemo(() => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'scripts':
        data = [...scripts];
        break;
      case 'ip-planning':
        // IP 人設規劃：顯示帳號定位、選題方向、腳本
        // - result_type === 'profile' (帳號定位)
        // - result_type === 'plan' 且 metadata.category === 'topics' (選題方向)
        // - result_type === 'scripts' (腳本)
        data = [...ipPlanningResults.filter(r => {
          if (r.result_type === 'profile') return true;  // 帳號定位
          if (r.result_type === 'scripts') return true;  // 腳本
          if (r.result_type === 'plan' && r.metadata?.category === 'topics') return true;  // 選題方向
          return false;
        })];
        
        // 子分類篩選（IP 人設規劃）
        if (ipPlanningCategoryFilter !== 'all') {
          data = data.filter(r => {
            const category = r.metadata?.category;
            if (ipPlanningCategoryFilter === 'positioning') return category === 'positioning' || r.result_type === 'profile';
            if (ipPlanningCategoryFilter === 'topics') return category === 'topics';
            if (ipPlanningCategoryFilter === 'scripts') return category === 'script' || r.result_type === 'scripts';
            return true;
          });
        }
        break;
      case 'planning':
        // 14 天規劃：只顯示真正的 14 天規劃（result_type === 'plan' 且 metadata.category === 'planning'）
        data = [...ipPlanningResults.filter(r => 
          r.result_type === 'plan' && r.metadata?.category === 'planning'
        )];
        break;
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => {
        const title = (item.title || item.topic || item.mode || '').toLowerCase();
        const content = (item.content || item.summary || '').toLowerCase();
        return title.includes(query) || content.includes(query);
      });
    }

    // 平台筛选（仅对 scripts）
    if (platformFilter !== 'all' && activeTab === 'scripts') {
      data = data.filter(item => item.platform === platformFilter);
    }

    // 排序
    data.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'time':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = (a.title || a.topic || a.mode || '').toLowerCase();
          bValue = (b.title || b.topic || b.mode || '').toLowerCase();
          break;
        case 'platform':
          aValue = (a.platform || '').toLowerCase();
          bValue = (b.platform || '').toLowerCase();
          break;
        case 'type':
          aValue = (a.result_type || a.mode || '').toLowerCase();
          bValue = (b.result_type || b.mode || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [activeTab, scripts, ipPlanningResults, searchQuery, platformFilter, ipPlanningCategoryFilter, sortField, sortOrder]);

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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDataAccessInfo(true)}
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <div className="flex-1 container py-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">我的腳本</p>
                  <p className="text-2xl font-bold">{stats.scripts}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IP 規劃</p>
                  <p className="text-2xl font-bold">{stats.ipPlanning}</p>
                </div>
                <Sparkles className="w-8 h-8 text-orange-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>我的資料</CardTitle>
            <CardDescription>
              查看和管理你的腳本、對話記錄和生成記錄
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 搜索和筛选工具栏 */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索標題或內容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
                  {activeTab === 'scripts' && allPlatforms.length > 0 && (
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="選擇平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有平台</SelectItem>
                    {allPlatforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeTab === 'ip-planning' && (
                <Select value={ipPlanningCategoryFilter} onValueChange={setIpPlanningCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有類型</SelectItem>
                    <SelectItem value="positioning">帳號定位</SelectItem>
                    <SelectItem value="topics">選題方向</SelectItem>
                    <SelectItem value="scripts">腳本</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-desc">時間：最新</SelectItem>
                  <SelectItem value="time-asc">時間：最舊</SelectItem>
                  <SelectItem value="title-asc">標題：A-Z</SelectItem>
                  <SelectItem value="title-desc">標題：Z-A</SelectItem>
                  {activeTab === 'scripts' && (
                    <>
                      <SelectItem value="platform-asc">平台：A-Z</SelectItem>
                      <SelectItem value="platform-desc">平台：Z-A</SelectItem>
                    </>
                  )}
                  {(activeTab === 'ip-planning' || activeTab === 'planning') && (
                    <>
                      <SelectItem value="type-asc">類型：A-Z</SelectItem>
                      <SelectItem value="type-desc">類型：Z-A</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as any);
              setSearchQuery('');
              setPlatformFilter('all');
              setIpPlanningCategoryFilter('all');
            }}>
              <TabsList className="flex md:grid w-full md:grid-cols-3 gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0">
                <TabsTrigger value="scripts" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap flex-shrink-0 min-w-fit">
                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">我的腳本</span>
                  <span className="sm:hidden">腳本</span>
                </TabsTrigger>
                <TabsTrigger value="ip-planning" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap flex-shrink-0 min-w-fit">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">IP 人設規劃</span>
                  <span className="sm:hidden">IP規劃</span>
                </TabsTrigger>
                <TabsTrigger value="planning" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap flex-shrink-0 min-w-fit">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">14 天規劃</span>
                  <span className="sm:hidden">規劃</span>
                </TabsTrigger>
              </TabsList>

              {/* 我的腳本 */}
              <TabsContent value="scripts" className="mt-6">
                <ScrollArea className="h-[calc(100vh-500px)] md:h-[calc(100vh-550px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : filteredAndSortedData.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80 mb-2">
                        {searchQuery || platformFilter !== 'all' ? '沒有找到符合條件的腳本' : '暫無腳本記錄'}
                      </p>
                      {searchQuery || platformFilter !== 'all' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery('');
                            setPlatformFilter('all');
                          }}
                        >
                          清除篩選
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">前往一鍵生成或 IP人設規劃生成腳本內容</p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/mode3')}
                            >
                              前往一鍵生成
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/mode1')}
                            >
                              前往 IP人設規劃
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* 桌面版：表格布局 */}
                      <div className="hidden md:block overflow-x-auto">
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
                            {filteredAndSortedData.map((script: Script) => {
                          const titleId = `script-${script.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                          <TableRow key={script.id}>
                            <TableCell className="font-medium">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editingTitleValue}
                                    onChange={(e) => setEditingTitleValue(e.target.value)}
                                    onBlur={() => {
                                      if (editingTitleValue.trim()) {
                                        handleSaveTitle(script, editingTitleValue);
                                      } else {
                                        setEditingTitleId(null);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveTitle(script, editingTitleValue);
                                      } else if (e.key === 'Escape') {
                                        setEditingTitleId(null);
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <div 
                                  className="flex items-center gap-2 group cursor-pointer hover:text-primary"
                                  onClick={() => {
                                    setEditingTitleId(titleId);
                                    setEditingTitleValue(script.title);
                                  }}
                                >
                                  <span>{script.title}</span>
                                  <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{script.platform}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(script.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleView(script)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        查看詳情
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopy(script.content)}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        複製內容
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedItem(script);
                                        setShowDetail(true);
                                        handleExport('txt');
                                      }}>
                                        <FileDown className="w-4 h-4 mr-2" />
                                        匯出為 TXT
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(script.id, 'script')}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        刪除
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          </TableBody>
                        </Table>
                      </div>
                      {/* 移動版：卡片布局 */}
                      <div className="md:hidden space-y-4">
                        {filteredAndSortedData.map((script: Script) => {
                          const titleId = `script-${script.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                          <Card key={script.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  {isEditing ? (
                                    <Input
                                      value={editingTitleValue}
                                      onChange={(e) => setEditingTitleValue(e.target.value)}
                                      onBlur={() => {
                                        if (editingTitleValue.trim()) {
                                          handleSaveTitle(script, editingTitleValue);
                                        } else {
                                          setEditingTitleId(null);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveTitle(script, editingTitleValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingTitleId(null);
                                        }
                                      }}
                                      className="flex-1 h-8"
                                      autoFocus
                                    />
                                  ) : (
                                    <h3 
                                      className="font-medium text-sm flex-1 cursor-pointer hover:text-primary group flex items-center gap-1"
                                      onClick={() => {
                                        setEditingTitleId(titleId);
                                        setEditingTitleValue(script.title);
                                      }}
                                    >
                                      <span>{script.title}</span>
                                      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </h3>
                                  )}
                                  <Badge variant="outline" className="text-xs">{script.platform}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(script.created_at)}
                                </p>
                                <div className="bg-muted/50 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {script.content ? script.content.substring(0, 100) + '...' : '無內容'}
                                  </p>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                  onClick={() => handleView(script)}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    查看
                                </Button>
                                <Button
                                  variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                  onClick={() => handleCopy(script.content)}
                                >
                                    <Copy className="w-4 h-4 mr-1" />
                                    複製
                                </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedItem(script);
                                        setShowDetail(true);
                                        handleExport('txt');
                                      }}>
                                        <FileDown className="w-4 h-4 mr-2" />
                                        匯出
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                  onClick={() => handleDelete(script.id, 'script')}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        刪除
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>


              {/* IP 人設規劃結果 */}
              <TabsContent value="ip-planning" className="mt-6">
                <ScrollArea className="h-[calc(100vh-500px)] md:h-[calc(100vh-550px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : filteredAndSortedData.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">
                        {searchQuery || ipPlanningCategoryFilter !== 'all' ? '沒有找到符合條件的 IP 規劃記錄' : '暫無 IP 人設規劃記錄'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        IP 人設規劃包含：帳號定位、選題方向、腳本
                      </p>
                      {searchQuery || ipPlanningCategoryFilter !== 'all' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery('');
                            setIpPlanningCategoryFilter('all');
                          }}
                        >
                          清除篩選
                        </Button>
                      ) : (
                        <div className="space-y-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/mode1')}
                          >
                            前往 IP人設規劃
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/mode3')}
                          >
                            前往一鍵生成
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* 桌面版：表格布局 */}
                      <div className="hidden md:block overflow-x-auto">
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
                            {filteredAndSortedData.map((result: IPPlanningResult) => {
                          const typeLabel = getIPPlanningTypeLabel(result);
                          const sourceLabel = getSourceLabel(result);
                          const titleId = `ip-planning-${result.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                            <TableRow key={result.id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline">{typeLabel}</Badge>
                                  {sourceLabel && (
                                    <Badge variant="secondary" className="text-xs w-fit">
                                      {sourceLabel}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editingTitleValue}
                                      onChange={(e) => setEditingTitleValue(e.target.value)}
                                      onBlur={() => {
                                        if (editingTitleValue.trim()) {
                                          handleSaveTitle(result, editingTitleValue);
                                        } else {
                                          setEditingTitleId(null);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveTitle(result, editingTitleValue);
                                        } else if (e.key === 'Escape') {
                                          setEditingTitleId(null);
                                        }
                                      }}
                                      className="h-8"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <div 
                                    className="flex items-center gap-2 group cursor-pointer hover:text-primary"
                                    onClick={() => {
                                      setEditingTitleId(titleId);
                                      setEditingTitleValue(result.title || '未命名');
                                    }}
                                  >
                                    <span>{result.title || '未命名'}</span>
                                    <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(result.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleView(result)}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          查看詳情
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopy(result.content)}>
                                          <Copy className="w-4 h-4 mr-2" />
                                          複製內容
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedItem(result);
                                          setShowDetail(true);
                                          handleExport('txt');
                                        }}>
                                          <FileDown className="w-4 h-4 mr-2" />
                                          匯出為 TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(result.id, 'ip-planning')}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          刪除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {/* 移動版：卡片布局 */}
                      <div className="md:hidden space-y-4">
                        {filteredAndSortedData.map((result: IPPlanningResult) => {
                          const typeLabel = getIPPlanningTypeLabel(result);
                          const sourceLabel = getSourceLabel(result);
                          const titleId = `ip-planning-${result.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                            <Card key={result.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    {isEditing ? (
                                      <Input
                                        value={editingTitleValue}
                                        onChange={(e) => setEditingTitleValue(e.target.value)}
                                        onBlur={() => {
                                          if (editingTitleValue.trim()) {
                                            handleSaveTitle(result, editingTitleValue);
                                          } else {
                                            setEditingTitleId(null);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveTitle(result, editingTitleValue);
                                          } else if (e.key === 'Escape') {
                                            setEditingTitleId(null);
                                          }
                                        }}
                                        className="flex-1 h-8"
                                        autoFocus
                                      />
                                    ) : (
                                      <h3 
                                        className="font-medium text-sm flex-1 cursor-pointer hover:text-primary group flex items-center gap-1"
                                        onClick={() => {
                                          setEditingTitleId(titleId);
                                          setEditingTitleValue(result.title || '未命名');
                                        }}
                                      >
                                        <span>{result.title || '未命名'}</span>
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                      </h3>
                                    )}
                                    <div className="flex flex-col gap-1 items-end">
                                      <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
                                      {sourceLabel && (
                                        <Badge variant="secondary" className="text-xs">
                                          {sourceLabel}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-2">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {result.content ? result.content.substring(0, 100) + '...' : '無內容'}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(result.created_at)}
                                  </p>
                                  <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    variant="ghost"
                                      size="sm"
                                      className="flex-1"
                                    onClick={() => handleView(result)}
                                  >
                                      <Eye className="w-4 h-4 mr-1" />
                                      查看
                                  </Button>
                                  <Button
                                    variant="ghost"
                                      size="sm"
                                      className="flex-1"
                                    onClick={() => handleCopy(result.content)}
                                  >
                                      <Copy className="w-4 h-4 mr-1" />
                                      複製
                                  </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedItem(result);
                                          setShowDetail(true);
                                          handleExport('txt');
                                        }}>
                                          <FileDown className="w-4 h-4 mr-2" />
                                          匯出
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                    onClick={() => handleDelete(result.id, 'ip-planning')}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          刪除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* 14 天規劃 */}
              <TabsContent value="planning" className="mt-6">
                <ScrollArea className="h-[calc(100vh-500px)] md:h-[calc(100vh-550px)]">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">載入中...</p>
                    </div>
                  ) : filteredAndSortedData.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground/70 opacity-50" />
                      <p className="text-muted-foreground dark:text-muted-foreground/80">
                        {searchQuery ? '沒有找到符合條件的 14 天規劃記錄' : '暫無 14 天規劃記錄'}
                      </p>
                      {searchQuery ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => setSearchQuery('')}
                        >
                          清除搜索
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">前往 IP人設規劃生成 14 天規劃內容</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => navigate('/mode1')}
                          >
                            前往 IP人設規劃
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* 桌面版：表格布局 */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>來源</TableHead>
                              <TableHead>標題</TableHead>
                              <TableHead>建立時間</TableHead>
                              <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedData.map((result: IPPlanningResult) => {
                              const sourceLabel = getSourceLabel(result);
                              const titleId = `planning-${result.id}`;
                              const isEditing = editingTitleId === titleId;
                              return (
                                <TableRow key={result.id}>
                                  <TableCell>
                                    {sourceLabel ? (
                                      <Badge variant="secondary">{sourceLabel}</Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">未知</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={editingTitleValue}
                                          onChange={(e) => setEditingTitleValue(e.target.value)}
                                          onBlur={() => {
                                            if (editingTitleValue.trim()) {
                                              handleSaveTitle(result, editingTitleValue);
                                            } else {
                                              setEditingTitleId(null);
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleSaveTitle(result, editingTitleValue);
                                            } else if (e.key === 'Escape') {
                                              setEditingTitleId(null);
                                            }
                                          }}
                                          className="h-8"
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <div 
                                        className="flex items-center gap-2 group cursor-pointer hover:text-primary"
                                        onClick={() => {
                                          setEditingTitleId(titleId);
                                          setEditingTitleValue(result.title || '未命名');
                                        }}
                                      >
                                        <span>{result.title || '未命名'}</span>
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                    {formatDate(result.created_at)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleView(result)}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          查看詳情
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopy(result.content)}>
                                          <Copy className="w-4 h-4 mr-2" />
                                          複製內容
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedItem(result);
                                          setShowDetail(true);
                                          handleExport('txt');
                                        }}>
                                          <FileDown className="w-4 h-4 mr-2" />
                                          匯出為 TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            navigate('/mode3', { 
                                              state: { 
                                                fromPlanning: true,
                                                planningContent: result.content 
                                              } 
                                            });
                                          }}
                                        >
                                          <Sparkles className="w-4 h-4 mr-2" />
                                          基於此規劃生成腳本
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(result.id, 'ip-planning')}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          刪除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {/* 移動版：卡片布局 */}
                      <div className="md:hidden space-y-4">
                        {filteredAndSortedData.map((result: IPPlanningResult) => {
                          const sourceLabel = getSourceLabel(result);
                          const titleId = `planning-${result.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                            <Card key={result.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    {isEditing ? (
                                      <Input
                                        value={editingTitleValue}
                                        onChange={(e) => setEditingTitleValue(e.target.value)}
                                        onBlur={() => {
                                          if (editingTitleValue.trim()) {
                                            handleSaveTitle(result, editingTitleValue);
                                          } else {
                                            setEditingTitleId(null);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveTitle(result, editingTitleValue);
                                          } else if (e.key === 'Escape') {
                                            setEditingTitleId(null);
                                          }
                                        }}
                                        className="flex-1 h-8"
                                        autoFocus
                                      />
                                    ) : (
                                      <h3 
                                        className="font-medium text-sm flex-1 cursor-pointer hover:text-primary group flex items-center gap-1"
                                        onClick={() => {
                                          setEditingTitleId(titleId);
                                          setEditingTitleValue(result.title || '未命名');
                                        }}
                                      >
                                        <span>{result.title || '未命名'}</span>
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                      </h3>
                                    )}
                                    {sourceLabel && (
                                      <Badge variant="secondary" className="text-xs">
                                        {sourceLabel}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-2">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {result.content ? result.content.substring(0, 100) + '...' : '無內容'}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(result.created_at)}
                                  </p>
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleView(result)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      查看
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleCopy(result.content)}
                                    >
                                      <Copy className="w-4 h-4 mr-1" />
                                      複製
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedItem(result);
                                          setShowDetail(true);
                                          handleExport('txt');
                                        }}>
                                          <FileDown className="w-4 h-4 mr-2" />
                                          匯出
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => {
                                            navigate('/mode3', { 
                                              state: { 
                                                fromPlanning: true,
                                                planningContent: result.content 
                                              } 
                                            });
                                          }}
                                        >
                                          <Sparkles className="w-4 h-4 mr-2" />
                                          生成腳本
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDelete(result.id, 'ip-planning')}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          刪除
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 詳情 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-[95vw] md:max-w-[90vw] max-h-[95vh] overflow-hidden flex flex-col w-[95vw] md:w-[90vw]">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {selectedItem && 'title' in selectedItem ? selectedItem.title : 
               (selectedItem && 'topic' in selectedItem ? selectedItem.topic : 
                (selectedItem && 'mode' in selectedItem ? `${selectedItem.mode} - 對話記錄` : '詳情'))}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && 'created_at' in selectedItem && selectedItem.created_at ? `建立時間：${formatDate(selectedItem.created_at)}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-4">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <div className="min-w-full">
            <ScriptEditor
                content={
                  selectedItem && 'content' in selectedItem 
                    ? selectedItem.content 
                    : (selectedItem && 'summary' in selectedItem 
                        ? `對話類型：${selectedItem.mode || '未知'}\n訊息數：${selectedItem.message_count || 0}\n\n摘要：\n${selectedItem.summary}` 
                        : '')
                }
                title={
                  selectedItem && 'title' in selectedItem 
                    ? selectedItem.title 
                    : (selectedItem && 'topic' in selectedItem 
                        ? selectedItem.topic 
                        : (selectedItem && 'mode' in selectedItem 
                            ? `${selectedItem.mode} - 對話記錄` 
                            : '詳情'))
                }
              onSave={handleSaveContent}
              onExport={handleExport}
              onShare={handleShare}
                readOnly={selectedItem ? 'summary' in selectedItem : false} // 對話記錄為唯讀
              showToolbar={true}
            />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 shrink-0 pt-4 border-t">
              <Button onClick={() => setShowDetail(false)}>
                關閉
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 資料存取說明 Dialog */}
      <Dialog open={showDataAccessInfo} onOpenChange={setShowDataAccessInfo}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>資料存取說明</DialogTitle>
            <DialogDescription>
              了解各功能會存取哪些資料
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">• <strong>我的腳本</strong>：存取您在一鍵生成生成的腳本內容</p>
              <p className="text-sm font-medium">• <strong>對話記錄</strong>：存取您在 IP人設規劃的對話摘要（不包含完整對話內容）</p>
              <p className="text-sm font-medium">• <strong>生成記錄</strong>：存取您在一鍵生成生成的選題和定位內容</p>
              <p className="text-sm font-medium">• <strong>IP 規劃</strong>：存取您在 IP人設規劃生成的帳號定位和腳本內容</p>
              <p className="text-sm font-medium">• <strong>14 天規劃</strong>：存取您在 IP人設規劃生成的 14 天短影音規劃內容</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                所有資料僅儲存在您的帳號中，我們不會與第三方分享您的內容。
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
