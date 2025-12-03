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
  Home,
  Calendar as CalendarIcon,
  Info,
  Loader2,
  TrendingUp,
  ExternalLink,
  User,
  Save,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiGet, apiDelete, apiPost, apiPut } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useUserDataStore } from '@/stores/userDataStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

// 14 天規劃日曆：後端 planning_days 模型
interface PlanningDayEntry {
  id: string | number;
  date: string;           // YYYY-MM-DD
  weekday?: string;
  day_index?: number;     // 第幾天（1-14）
  topic: string;
  account_positioning?: string | null; // IP 帳號定位
  script_content?: string | null;
  script_structure?: string | null;
  duration_seconds?: number | null;
  platform?: string | null;
  extra_notes?: string | null;
  video_url?: string | null;
  performance_notes?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  posted_at?: string | null;
  plan_result_id?: string | number;
  ip_profile_title?: string | null;
  ip_profile_content?: string | null;
}

// 14 天規劃日曆視圖元件（自定義 Grid）
function PlanningCalendarView({
  days,
  month,
  onMonthChange,
  onDayClick,
}: {
  days: PlanningDayEntry[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onDayClick: (day: PlanningDayEntry | null, date: Date) => void;
}) {
  const year = month.getFullYear();
  const currentMonth = month.getMonth(); // 0-11

  const firstDayOfMonth = new Date(year, currentMonth, 1);
  const lastDayOfMonth = new Date(year, currentMonth + 1, 0);
  
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  // Generate calendar cells
  const cells = [];
  
  // 計算這個月需要多少行（用於動態調整手機版單元格高度）
  const totalDaysForCalendar = daysInMonth + startDayOfWeek;
  const calendarRowCount = Math.ceil(totalDaysForCalendar / 7);
  
  // 手機版單元格高度：根據行數動態調整，確保完整顯示一個月
  // 4行：每行約75px，5行：每行約60px，6行：每行約50px
  const getCellHeightForMobile = () => {
    if (calendarRowCount <= 4) return 'h-[75px]';
    if (calendarRowCount === 5) return 'h-[60px]';
    return 'h-[50px]';
  };
  
  const cellHeightMobile = getCellHeightForMobile();
  
  // Padding for previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(
      <div 
        key={`empty-${i}`} 
        className={cn(
          "bg-muted/20 border-b border-r",
          cellHeightMobile,
          "md:min-h-[8rem] lg:min-h-[10rem]"
        )} 
      />
    );
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, currentMonth, d);
    const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const entry = days.find(day => day.date === dateStr);
    const isToday = new Date().toDateString() === currentDate.toDateString();

    // Helper to get display title from topic (remove markdown and prefix)
    const displayTitle = entry 
        ? entry.topic.split('\n')[0]
            .replace(/^(\*\*|##|\s)*(Day|第)\s*\d+.*?[：:]\s*/i, '') // Remove "Day X: " prefix
            .replace(/^\*\*|\*\*$/g, '') // Remove wrapping bold
            .trim()
        : '';

    cells.push(
      <div 
        key={d} 
        className={cn(
          "relative border-b border-r",
          cellHeightMobile,
          "md:min-h-[8rem] lg:min-h-[10rem]",
          "p-1 md:p-2",
          "flex flex-col gap-0.5 md:gap-1",
          "transition-colors hover:bg-muted/50 active:bg-muted/70",
          "cursor-pointer group bg-background",
          entry ? "bg-primary/5" : ""
        )}
        onClick={() => onDayClick(entry || null, currentDate)}
      >
        <div className="flex justify-between items-start shrink-0">
            <span className={cn(
              "text-[11px] md:text-xs lg:text-sm font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shrink-0",
              isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}>
              {d}
            </span>
        </div>
        
        {entry && (
          <div className="flex-1 overflow-hidden flex flex-col gap-0.5 md:gap-1 min-h-0">
            <div className="text-[9px] md:text-[10px] lg:text-xs font-medium text-primary bg-primary/10 rounded px-0.5 md:px-1 py-0.5 line-clamp-2 md:line-clamp-3 lg:line-clamp-4 leading-tight">
               {displayTitle || '點擊查看詳情'}
            </div>
            {entry.script_content && (
                <div className="mt-auto flex items-center gap-0.5 md:gap-1 pt-0.5 md:pt-1 shrink-0">
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-[8px] md:text-[9px] lg:text-[10px] text-muted-foreground truncate">已生成</span>
                </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Fill remaining cells to complete the week row
  const cellsCount = cells.length;
  const remainingCells = 7 - (cellsCount % 7);
  if (remainingCells < 7) {
    for (let i = 0; i < remainingCells; i++) {
         cells.push(
           <div 
             key={`empty-end-${i}`} 
             className={cn(
               "bg-muted/20 border-b border-r",
               cellHeightMobile,
               "md:min-h-[8rem] lg:min-h-[10rem]"
             )} 
           />
         );
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col bg-card rounded-xl border shadow-sm w-full overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b shrink-0">
        <div className="flex items-center gap-1 md:gap-2 flex-1">
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => onMonthChange(new Date(year, currentMonth - 1, 1))}>
                <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            <h2 className="text-base md:text-lg font-semibold min-w-[120px] md:min-w-[140px] text-center">
                {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => onMonthChange(new Date(year, currentMonth + 1, 1))}>
                <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
        </div>
        <div className="text-xs md:text-sm text-muted-foreground hidden md:block ml-4">
            點擊日期查看/編輯 14 天規劃詳情
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b bg-muted/30 shrink-0">
        {weekDays.map(day => (
            <div key={day} className="py-1.5 md:py-2 text-center text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
            </div>
        ))}
      </div>

      {/* Grid Body - 手機版完整顯示一個月（無滾動），電腦版完整顯示整個月份 */}
      <div className={cn(
        "grid grid-cols-7 border-l border-t-0",
        "overflow-visible", // 手機版和電腦版都不滾動
        // 手機版：根據行數動態設置高度，確保完整顯示
        calendarRowCount <= 4 ? "min-h-[300px]" : calendarRowCount === 5 ? "min-h-[300px]" : "min-h-[300px]",
        // 電腦版：固定最小高度
        "md:min-h-[700px]"
      )}>
        {cells}
      </div>
    </div>
  );
}


export default function UserDB() {
  const navigate = useNavigate();
  const { logout, user, loading: authLoading } = useAuthStore();
  
  // 從 store 讀取數據
  const storeScripts = useUserDataStore((state) => state.scripts);
  const storeIPPlanningResults = useUserDataStore((state) => state.ipPlanningResults);
  const loadScriptsFromStore = useUserDataStore((state) => state.loadScripts);
  const loadIPPlanningFromStore = useUserDataStore((state) => state.loadIPPlanningResults);
  const loadingScripts = useUserDataStore((state) => state.loading.scripts);
  const loadingIPPlanning = useUserDataStore((state) => state.loading.ipPlanning);
  
  const [activeTab, setActiveTab] = useState<'scripts' | 'ip-planning' | 'planning'>('scripts');
  // 保留本地狀態用於過濾和排序（從 store 數據派生）
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
  // 14 天規劃檢視模式：列表 / 日曆
  const [planningViewMode, setPlanningViewMode] = useState<'list' | 'calendar'>('list');
  
  // 标题编辑状态
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  // 详情对话框中的标题编辑状态
  const [isEditingDetailTitle, setIsEditingDetailTitle] = useState(false);
  const [detailTitleValue, setDetailTitleValue] = useState<string>('');

  // 14 天規劃日曆相關狀態
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [planningDays, setPlanningDays] = useState<PlanningDayEntry[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<PlanningDayEntry | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [scriptGenerating, setScriptGenerating] = useState(false);
  const [scriptSaving, setScriptSaving] = useState(false);
  const [calendarScriptStructure, setCalendarScriptStructure] = useState<string>('hook-story-offer');
  const [calendarDuration, setCalendarDuration] = useState<string>('60');
  const [calendarPlatform, setCalendarPlatform] = useState<string>('tiktok');
  const [calendarExtraNotes, setCalendarExtraNotes] = useState<string>('');
  const [calendarScriptContent, setCalendarScriptContent] = useState<string>('');
  const [calendarVideoUrl, setCalendarVideoUrl] = useState<string>('');
  const [calendarPerformanceNotes, setCalendarPerformanceNotes] = useState<string>('');
  const [calendarViews, setCalendarViews] = useState<string>('');
  const [calendarLikes, setCalendarLikes] = useState<string>('');
  const [calendarComments, setCalendarComments] = useState<string>('');
  const [calendarShares, setCalendarShares] = useState<string>('');
  // 選題編輯狀態
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editingTopicValue, setEditingTopicValue] = useState<string>('');
  // 14 天規劃排入日曆 Dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTargetPlan, setScheduleTargetPlan] = useState<IPPlanningResult | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());

  // 處理生成腳本（在日曆對話框中）
  const handleGenerateCalendarScript = async () => {
    if (!selectedCalendarDay) return;
    
    try {
      setScriptGenerating(true);
      
      // 呼叫後端 API 生成腳本
      // 使用 apiPost，超時設定已在 api-client.ts 中統一調整為 60s，這裡不需要額外處理
      // 為了保險起見，如果需要更長，可以直接使用 axios config (apiPost 第三個參數)
      const response = await apiPost<{ script_content: string }>(
        `/api/planning-days/${selectedCalendarDay.id}/generate-script`, 
        {
          script_structure: calendarScriptStructure,
          duration_seconds: parseInt(calendarDuration),
          platform: calendarPlatform,
          extra_notes: calendarExtraNotes
        },
        { timeout: 60000 } // 顯式設置 60s 超時，以防萬一
      );
      
      setCalendarScriptContent(response.script_content);
      toast.success('腳本生成成功');
    } catch (error: any) {
      console.error('生成腳本失敗:', error);
      toast.error(error.message || '生成腳本失敗，請稍後再試');
    } finally {
      setScriptGenerating(false);
    }
  };

  // 處理儲存腳本和成效（在日曆對話框中）
  const handleSaveCalendarScript = async () => {
    if (!selectedCalendarDay) return;
    
    try {
      setScriptSaving(true);
      
      // 構建儲存資料
      const saveData = {
        script_content: calendarScriptContent,
        script_structure: calendarScriptStructure,
        duration_seconds: parseInt(calendarDuration),
        platform: calendarPlatform,
        extra_notes: calendarExtraNotes,
        video_url: calendarVideoUrl,
        performance_notes: calendarPerformanceNotes,
        views: calendarViews ? parseInt(calendarViews) : null,
        likes: calendarLikes ? parseInt(calendarLikes) : null,
        comments: calendarComments ? parseInt(calendarComments) : null,
        shares: calendarShares ? parseInt(calendarShares) : null,
        // 如果勾選了「已發佈」，且之前沒有發佈時間，則設置為今天（或選定的日期）
        // 注意：這裡簡化處理，實際應用可能需要單獨的日期選擇
        // 後端 PUT /api/planning-days/{day_id}/script
      };

      await apiPut(`/api/planning-days/${selectedCalendarDay.id}/script`, saveData);
      
      // 更新本地狀態
      setPlanningDays(prev => prev.map(day => {
        if (day.id === selectedCalendarDay.id) {
          return {
            ...day,
            ...saveData,
            // 注意：後端可能會更新 posted_at，這裡暫時不更新，或者重新載入資料
          };
        }
        return day;
      }));
      
      // 重新載入當前選擇的天資料，以獲取最新的 posted_at 等
      // 這裡簡單地更新 selectedCalendarDay
      setSelectedCalendarDay(prev => prev ? { ...prev, ...saveData } : null);

      toast.success('儲存成功');
    } catch (error: any) {
      console.error('儲存失敗:', error);
      toast.error(error.message || '儲存失敗');
    } finally {
      setScriptSaving(false);
    }
  };

  // 處理下載日曆腳本為 PDF
  const handleDownloadCalendarScriptPDF = () => {
    if (!selectedCalendarDay || !calendarScriptContent) {
      toast.error('請先生成腳本內容');
      return;
    }

    const dateStr = selectedCalendarDate?.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }) || '';
    
    const structureMap: Record<string, string> = {
      'hook-story-offer': 'Hook-Story-Offer (標準)',
      'problem-agitate-solve': 'Problem-Agitate-Solve (痛點)',
      'before-after-bridge': 'Before-After-Bridge (對比)',
      'listicle': 'Listicle (清單式)',
      'educational': 'Educational (教學式)'
    };

    const platformMap: Record<string, string> = {
      'tiktok': 'TikTok',
      'instagram': 'Instagram Reels',
      'youtube': 'YouTube Shorts',
      'facebook': 'Facebook Reels'
    };

    const title = `短影音腳本 - ${dateStr}`;
    
    // 構建完整的 PDF 內容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              margin: 2cm;
            }
            body {
              font-family: 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif;
              line-height: 1.8;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            h1 {
              color: #1e40af;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .meta-info {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .meta-row {
              display: flex;
              margin-bottom: 8px;
            }
            .meta-label {
              font-weight: bold;
              min-width: 120px;
              color: #4b5563;
            }
            .meta-value {
              color: #1f2937;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            .script-content {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.8;
            }
            .performance-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
            }
            .performance-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .performance-item {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 6px;
            }
            .performance-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .performance-value {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
          </div>
          
          <div class="meta-info">
            <div class="meta-row">
              <span class="meta-label">日期：</span>
              <span class="meta-value">${dateStr}</span>
            </div>
            ${selectedCalendarDay.topic ? `
            <div class="meta-row">
              <span class="meta-label">當天選題：</span>
              <span class="meta-value">${selectedCalendarDay.topic.replace(/\*\*/g, '').replace(/\*/g, '')}</span>
            </div>
            ` : ''}
            <div class="meta-row">
              <span class="meta-label">腳本結構：</span>
              <span class="meta-value">${structureMap[calendarScriptStructure] || calendarScriptStructure}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">預計秒數：</span>
              <span class="meta-value">${calendarDuration} 秒</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">發佈平台：</span>
              <span class="meta-value">${platformMap[calendarPlatform] || calendarPlatform}</span>
            </div>
            ${calendarExtraNotes ? `
            <div class="meta-row">
              <span class="meta-label">補充說明：</span>
              <span class="meta-value">${calendarExtraNotes}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">📝 腳本內容</div>
            <div class="script-content">${calendarScriptContent.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, '<br>')}</div>
          </div>
          
          ${(calendarVideoUrl || calendarViews || calendarLikes || calendarComments || calendarShares || calendarPerformanceNotes) ? `
          <div class="section performance-section">
            <div class="section-title">📊 成效追蹤</div>
            ${calendarVideoUrl ? `
            <div class="meta-row" style="margin-bottom: 15px;">
              <span class="meta-label">影片連結：</span>
              <span class="meta-value">${calendarVideoUrl}</span>
            </div>
            ` : ''}
            ${(calendarViews || calendarLikes || calendarComments || calendarShares) ? `
            <div class="performance-grid">
              ${calendarViews ? `
              <div class="performance-item">
                <div class="performance-label">觀看次數</div>
                <div class="performance-value">${calendarViews}</div>
              </div>
              ` : ''}
              ${calendarLikes ? `
              <div class="performance-item">
                <div class="performance-label">按讚數</div>
                <div class="performance-value">${calendarLikes}</div>
              </div>
              ` : ''}
              ${calendarComments ? `
              <div class="performance-item">
                <div class="performance-label">留言數</div>
                <div class="performance-value">${calendarComments}</div>
              </div>
              ` : ''}
              ${calendarShares ? `
              <div class="performance-item">
                <div class="performance-label">分享數</div>
                <div class="performance-value">${calendarShares}</div>
              </div>
              ` : ''}
            </div>
            ` : ''}
            ${calendarPerformanceNotes ? `
            <div style="margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 6px;">
              <div class="meta-label" style="margin-bottom: 8px;">成效備註：</div>
              <div style="white-space: pre-wrap; color: #1f2937;">${calendarPerformanceNotes.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="footer">
            <p>由 ReelMind 短影音智能體生成</p>
            <p>生成時間：${new Date().toLocaleString('zh-TW')}</p>
          </div>
        </body>
      </html>
    `;

    // 使用瀏覽器列印功能生成 PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success('正在準備 PDF 下載...');
    } else {
      toast.error('無法開啟新視窗，請允許彈出視窗');
    }
  };

  // 處理排入日曆
  const handleSchedulePlanning = async () => {
    if (!scheduleTargetPlan || !scheduleDate) {
      toast.error('請選擇開始日期');
      return;
    }

    try {
      const dateStr = scheduleDate.toISOString().slice(0, 10);
      
      // 呼叫後端 API 排入日曆
      // 預期後端 API: POST /api/planning-days/schedule
      // Body: { plan_result_id: string, start_date: string }
      await apiPost('/api/planning-days/schedule', {
        plan_result_id: scheduleTargetPlan.id,
        start_date: dateStr
      });

      toast.success('已成功排入日曆');
      setScheduleDialogOpen(false);
      
      // 如果當前在日曆模式，重新載入日曆資料
      // 如果不在日曆模式，切換到日曆模式
      if (planningViewMode === 'calendar') {
        loadPlanningDays(calendarMonth);
      } else {
        setPlanningViewMode('calendar');
      }
    } catch (error: any) {
      console.error('排入日曆失敗:', error);
      toast.error(error.message || '排入日曆失敗');
    }
  };

  // 載入指定月份的 planning_days
  const loadPlanningDays = async (monthDate: Date) => {
    try {
      setCalendarLoading(true);
      const year = monthDate.getFullYear();
      const month = String(monthDate.getMonth() + 1).padStart(2, '0');
      const resp = await apiGet<{ days: PlanningDayEntry[] }>(`/api/planning-days?month=${year}-${month}`);
      setPlanningDays(resp.days || []);
    } catch (e) {
      console.error('載入日曆資料失敗:', e);
    } finally {
      setCalendarLoading(false);
    }
  };

  // 當切換到日曆視圖時，自動載入一次當月資料
  useEffect(() => {
    if (planningViewMode === 'calendar') {
      loadPlanningDays(calendarMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningViewMode]);

  // 檢查登入狀態（已移除以便本地預覽）
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     toast.error('請先登入');
  //     navigate('/');
  //   }
  // }, [setLocation]);

  // 載入資料
  useEffect(() => {
    // 等待用户信息加载完成后再加载数据
    if (user?.user_id && !authLoading) {
      loadData();
    }
  }, [activeTab, user?.user_id, authLoading]);
  
  // 页面可见性监听：当页面重新获得焦点时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.user_id && !authLoading) {
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.user_id, authLoading]);

  // 監聽資料更新事件（當 IP人設規劃功能 儲存內容到 UserDB 時）
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      const { type } = event.detail || {};
      
      // 如果更新的是 IP 人設規劃資料
      if (type === 'ip-planning' && user?.user_id) {
        if (activeTab === 'ip-planning') {
          // 如果當前在 IP 人設規劃標籤，自動刷新 store 數據
          loadIPPlanningFromStore(user.user_id, true); // force refresh
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
      } else if (type === 'scripts' && user?.user_id) {
        // 如果更新的是腳本資料
        loadScriptsFromStore(user.user_id, true); // force refresh
      }
    };

    window.addEventListener('userdb-data-updated', handleDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userdb-data-updated', handleDataUpdate as EventListener);
    };
  }, [activeTab, user?.user_id, loadIPPlanningFromStore, loadScriptsFromStore]);

  // 從 store 同步數據到本地狀態（用於過濾和排序）
  useEffect(() => {
    if (activeTab === 'scripts') {
      setScripts(storeScripts as Script[]);
    } else if (activeTab === 'ip-planning' || activeTab === 'planning') {
      setIpPlanningResults(storeIPPlanningResults);
    }
  }, [storeScripts, storeIPPlanningResults, activeTab]);

  // 載入資料（從 store 載入，如果沒有則觸發載入）
  const loadData = async () => {
    if (!user?.user_id) return;
    
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'scripts':
          // 如果 store 中沒有數據或數據過舊，觸發載入
          await loadScriptsFromStore(user.user_id);
          break;
        case 'ip-planning':
        case 'planning':
          await loadIPPlanningFromStore(user.user_id);
          break;
      }
    } catch (error: any) {
      console.error('載入資料失敗:', error);
      // 不顯示錯誤，因為 store 會處理錯誤狀態
    } finally {
      setIsLoading(false);
    }
  };

  // 載入腳本（已廢棄，改用 store）
  // const loadScripts = async () => { ... }

  // 載入 IP 人設規劃結果（已廢棄，改用 store）
  // const loadIPPlanningResults = async () => { ... }

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
      // 刪除後刷新 store 數據
      if (user?.user_id) {
        if (type === 'script') {
          await loadScriptsFromStore(user.user_id, true); // force refresh
        } else if (type === 'ip-planning') {
          await loadIPPlanningFromStore(user.user_id, true); // force refresh
        }
      }
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

  // 清理 Markdown 格式符號，移除所有格式符號但保留文字內容
  // 粗體、斜體、下劃線等格式符號都會被移除，只保留純文字
  const cleanMarkdown = (text: string): string => {
    if (!text) return '';
    
    let cleaned = text;
    
    // 先處理換行：\n → <br>（但保留在代碼塊中的換行）
    // 先標記代碼塊
    const codeBlockPlaceholders: string[] = [];
    let codeBlockIndex = 0;
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `__CODEBLOCK_${codeBlockIndex}__`;
      codeBlockPlaceholders.push(match);
      codeBlockIndex++;
      return placeholder;
    });
    
    // 粗體：**text** 或 __text__ → <strong>text</strong>（優先處理，避免與單個*混淆）
    // 使用非貪婪匹配，並確保不會匹配到已經處理過的
    cleaned = cleaned.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    cleaned = cleaned.replace(/__(?!_)([^_\n]+?)(?<!_)__/g, '<strong>$1</strong>');
    
    // 處理單個*（斜體，但我們移除符號）
    cleaned = cleaned.replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, '$1');
    
    // 處理單個_（斜體，但我們移除符號，但要避免匹配__）
    cleaned = cleaned.replace(/(?<!_)_(?!_)([^_\n]+?)(?<!_)_(?!_)/g, '$1');
    
    // 刪除線：~~text~~ → text
    cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');
    
    // 行內代碼：`text` → text
    cleaned = cleaned.replace(/`([^`]+?)`/g, '$1');
    
    // 恢復代碼塊（不移除）
    codeBlockPlaceholders.forEach((placeholder, index) => {
      cleaned = cleaned.replace(`__CODEBLOCK_${index}__`, placeholder);
    });
    
    // 代碼塊：```...``` → 移除整個代碼塊（現在處理）
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    
    // 標題：### text → text
    cleaned = cleaned.replace(/#{1,6}\s+(.+)/gm, '$1');
    
    // 鏈接：[text](url) → text
    cleaned = cleaned.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
    
    // 圖片：![alt](url) → alt
    cleaned = cleaned.replace(/!\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
    
    // 處理換行：\n → <br>（在處理完所有其他格式後）
    cleaned = cleaned.replace(/\n/g, '<br>');
    
    // 處理多個連續的<br>，保留最多2個
    cleaned = cleaned.replace(/(<br>\s*){3,}/g, '<br><br>');
    
    return cleaned;
  };

  // 清理 Markdown 格式符號為純文字（用於編輯模式）
  // 完全移除所有 Markdown 符號，返回純文字，不包含任何 HTML 標籤
  const cleanMarkdownToPlainText = (text: string): string => {
    if (!text) return '';
    
    let cleaned = text;
    
    // 先移除所有 HTML 標籤（如果有的話）
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // 粗體：**text** 或 __text__ → text（移除符號）
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
    cleaned = cleaned.replace(/__(.+?)__/g, '$1');
    
    // 斜體：*text* → text（移除符號，注意不要匹配 **text**）
    // 使用更精確的匹配，避免匹配 **text** 中的單個 *
    cleaned = cleaned.replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, '$1');
    
    // 下劃線：_text_ → text（移除符號，注意不要匹配 __text__）
    // 使用更精確的匹配，避免匹配 __text__ 中的單個 _
    cleaned = cleaned.replace(/(?<!_)_(?!_)([^_\n]+?)_(?!_)/g, '$1');
    
    // 刪除線：~~text~~ → text
    cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');
    
    // 行內代碼：`text` → text
    cleaned = cleaned.replace(/`([^`]+?)`/g, '$1');
    
    // 代碼塊：```...``` → 移除整個代碼塊
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    
    // 標題：### text → text
    cleaned = cleaned.replace(/#{1,6}\s+(.+)/gm, '$1');
    
    // 鏈接：[text](url) → text
    cleaned = cleaned.replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
    
    // 圖片：![alt](url) → alt
    cleaned = cleaned.replace(/!\[([^\]]+?)\]\([^\)]+?\)/g, '$1');
    
    // 移除多餘的空白行（連續3個以上換行變成2個）
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  };

  // 渲染清理後的內容（支持粗體等格式）
  const renderCleanContent = (text: string, maxLength?: number): JSX.Element => {
    if (!text) return <span>無內容</span>;
    
    let displayText = text;
    if (maxLength && text.length > maxLength) {
      displayText = text.substring(0, maxLength) + '...';
    }
    
    const cleanedText = cleanMarkdown(displayText);
    
    return (
      <span dangerouslySetInnerHTML={{ __html: cleanedText }} />
    );
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
      setIsEditingDetailTitle(false);
      return;
    }

    // 樂觀更新：立即更新本地狀態，不等待後端響應
    const oldTitle = item.title || ('topic' in item ? item.topic : '') || '';
    const trimmedTitle = newTitle.trim();
    
    // 立即更新本地狀態
    if ('platform' in item && item.platform) {
      // Script 類型
      setScripts(prevScripts => 
        prevScripts.map(s => 
          s.id === item.id ? { ...s, title: trimmedTitle } : s
        )
      );
    } else if ('result_type' in item) {
      // IP Planning 類型
      setIpPlanningResults(prevResults => 
        prevResults.map(r => 
          r.id === item.id ? { ...r, title: trimmedTitle } : r
        )
      );
    }
    
    // 更新 selectedItem（如果正在查看詳情）
    if (selectedItem && 'id' in selectedItem && selectedItem.id === item.id) {
      if ('title' in item) {
        setSelectedItem({ ...selectedItem, title: trimmedTitle } as SelectedItem);
      } else if ('topic' in item) {
        setSelectedItem({ ...selectedItem, topic: trimmedTitle } as SelectedItem);
      }
    }
    
    // 關閉編輯狀態（立即，不等待後端）
    setEditingTitleId(null);
    setIsEditingDetailTitle(false);
    
    // 後端請求在背景進行（不阻塞 UI）
    try {
      if ('platform' in item && item.platform) {
        await apiPut(`/api/scripts/${item.id}/name`, { name: trimmedTitle });
      } else if ('result_type' in item) {
        await apiPut(`/api/ip-planning/results/${item.id}/title`, { title: trimmedTitle });
      }
      // 成功時不顯示 toast（已經樂觀更新了，避免打擾用戶）
    } catch (error: any) {
      console.error('更新標題失敗:', error);
      
      // 自動回滾：失敗時恢復舊標題
      if ('platform' in item && item.platform) {
        setScripts(prevScripts => 
          prevScripts.map(s => 
            s.id === item.id ? { ...s, title: oldTitle } : s
          )
        );
      } else if ('result_type' in item) {
        setIpPlanningResults(prevResults => 
          prevResults.map(r => 
            r.id === item.id ? { ...r, title: oldTitle } : r
          )
        );
      }
      
      // 恢復 selectedItem
      if (selectedItem && 'id' in selectedItem && selectedItem.id === item.id) {
        if ('title' in item) {
          setSelectedItem({ ...selectedItem, title: oldTitle } as SelectedItem);
        } else if ('topic' in item) {
          setSelectedItem({ ...selectedItem, topic: oldTitle } as SelectedItem);
        }
      }
      
      toast.error(error?.response?.data?.error || '更新標題失敗，已恢復原標題');
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

  // 分享功能（支援 IG / Line / FB）
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
    
    const pageUrl = window.location.href;
    const previewText = text ? text + '...' : '';

    // 優先使用 Web Share API（行動裝置原生分享，會自動支援 Line / FB / IG 等 App）
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || '內容',
          text: previewText,
          url: pageUrl,
        });
        toast.success('已呼叫系統分享，請在列表中選擇 IG / Line / FB');
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return; // 使用者取消，不再往下
        }
      }
    }

    // 如果沒有 Web Share API，就提供常用社群分享連結（以目前頁面 URL 為主）
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedText = encodeURIComponent(previewText || title || 'ReelMind 內容分享');

    const lineUrl = `https://line.me/R/msg/text/?${encodedText}%20${encodedUrl}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    // IG 沒有正式的文字分享網址，只能開啟 IG 首頁讓用戶手動貼上
    const igUrl = `https://www.instagram.com/`;

    // 簡單策略：先把文字內容複製到剪貼簿，然後提示用戶選擇要開啟的社群 App
    try {
      await navigator.clipboard.writeText(previewText || `${title}\n${pageUrl}`);
      toast.info('內容已複製，接下來會開啟社群頁面，請自行貼上貼文內容');
    } catch {
      // 如果無法複製，就忽略
    }

    // 開啟三個社群選項中的一個（這裡預設先開 Line，如果是桌機則會落到 FB 或 IG）
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(lineUrl, '_blank');
    } else {
      window.open(fbUrl, '_blank');
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
    if (!dateString) return '';
    
    try {
      let dateStr = dateString.trim();
      
      // 如果已經是完整的 ISO 格式（包含時區），直接使用
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)) {
        return new Date(dateStr).toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // 如果是 UTC 格式（結尾是 Z）
      if (dateStr.endsWith('Z')) {
        return new Date(dateStr).toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // 如果沒有時區資訊（例如：2024-01-01T12:00:00），假設是台灣時區
      let date = new Date(dateStr);
      
      // 檢查解析是否成功
      if (isNaN(date.getTime())) {
        console.warn('無法解析日期:', dateStr);
        return dateStr;
      }
      
      // 使用台灣時區格式化
      return date.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('日期格式化失敗:', error, dateString);
      return dateString;
    }
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
      ipPlanning: ipPlanningResults_filtered.length,  // IP 人設規劃
      planning: planningResults.length,  // 14 天規劃
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
                  <p className="text-sm text-muted-foreground">IP人設規劃</p>
                  <p className="text-2xl font-bold">{stats.ipPlanning}</p>
                </div>
                <Sparkles className="w-8 h-8 text-orange-500 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">14 天規劃</p>
                  <p className="text-2xl font-bold">{stats.planning}</p>
                </div>
                <Sparkles className="w-8 h-8 text-purple-500 opacity-70" />
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
                <ScrollArea className="h-[calc(100vh-380px)] md:h-[calc(100vh-550px)]">
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
                      <div className="md:hidden space-y-2">
                        {filteredAndSortedData.map((script: Script) => {
                          const titleId = `script-${script.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                          <Card key={script.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-2.5">
                              <div className="space-y-1.5">
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
                                      className="flex-1 h-7 text-sm"
                                      autoFocus
                                    />
                                  ) : (
                                    <h3 
                                      className="font-medium text-xs flex-1 cursor-pointer hover:text-primary group flex items-center gap-1 leading-tight"
                                      onClick={() => {
                                        setEditingTitleId(titleId);
                                        setEditingTitleValue(script.title);
                                      }}
                                    >
                                      <span className="line-clamp-1">{script.title}</span>
                                      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                                    </h3>
                                  )}
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{script.platform}</Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatDate(script.created_at)}
                                  </p>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px]"
                                      onClick={() => handleView(script)}
                                    >
                                      <Eye className="w-3 h-3 mr-0.5" />
                                      查看
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-[10px]"
                                      onClick={() => handleCopy(script.content)}
                                    >
                                      <Copy className="w-3 h-3 mr-0.5" />
                                      複製
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreVertical className="w-3 h-3" />
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
                <ScrollArea className="h-[calc(100vh-380px)] md:h-[calc(100vh-550px)]">
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
                                        <DropdownMenuItem
                                          onClick={() => {
                                            // 在 IP 人設規劃功能中繼續使用這份內容
                                            navigate('/mode1', {
                                              state: {
                                                fromUserDB: true,
                                                fromIpPlanning: true,
                                                planningResultId: result.id,
                                                planningContent: result.content,
                                                planningType: getIPPlanningTypeLabel(result),
                                              },
                                            });
                                          }}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          在 IP人設規劃中使用
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
                      <div className="md:hidden space-y-2">
                        {filteredAndSortedData.map((result: IPPlanningResult) => {
                          const typeLabel = getIPPlanningTypeLabel(result);
                          const sourceLabel = getSourceLabel(result);
                          const titleId = `ip-planning-${result.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                            <Card key={result.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-2.5">
                                <div className="space-y-1.5">
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
                                        className="flex-1 h-7 text-sm"
                                        autoFocus
                                      />
                                    ) : (
                                      <h3 
                                        className="font-medium text-xs flex-1 cursor-pointer hover:text-primary group flex items-center gap-1 leading-tight"
                                        onClick={() => {
                                          setEditingTitleId(titleId);
                                          setEditingTitleValue(result.title || '未命名');
                                        }}
                                      >
                                        <span className="line-clamp-1">{result.title || '未命名'}</span>
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                                      </h3>
                                    )}
                                    <div className="flex flex-col gap-0.5 items-end shrink-0">
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeLabel}</Badge>
                                      {sourceLabel && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {sourceLabel}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-muted/50 rounded p-1.5">
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                                      {result.content ? renderCleanContent(result.content, 80) : <span>無內容</span>}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatDate(result.created_at)}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[10px]"
                                        onClick={() => handleView(result)}
                                      >
                                        <Eye className="w-3 h-3 mr-0.5" />
                                        查看
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[10px]"
                                        onClick={() => handleCopy(result.content)}
                                      >
                                        <Copy className="w-3 h-3 mr-0.5" />
                                        複製
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <MoreVertical className="w-3 h-3" />
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
                                            navigate('/mode1', {
                                              state: {
                                                fromUserDB: true,
                                                fromIpPlanning: true,
                                                planningResultId: result.id,
                                                planningContent: result.content,
                                                planningType: getIPPlanningTypeLabel(result),
                                              },
                                            });
                                          }}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          在 IP人設規劃中使用
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
                {/* 視圖切換：列表 / 日曆 */}
                <div className="flex items-center justify-between mb-4 gap-3">
                  <p className="text-sm text-muted-foreground">
                    檢視並管理你在 IP 人設規劃功能中產生的 14 天內容規劃。
                  </p>
                  <div className="inline-flex rounded-lg border bg-muted/40 p-1 text-xs md:text-sm">
                    <Button
                      variant={planningViewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2 md:px-3"
                      onClick={() => setPlanningViewMode('list')}
                    >
                      列表模式
                    </Button>
                    <Button
                      variant={planningViewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      className="px-2 md:px-3"
                      onClick={() => setPlanningViewMode('calendar')}
                    >
                      日曆視圖
                    </Button>
                  </div>
                </div>

                {planningViewMode === 'calendar' ? (
                  <div className="flex flex-col space-y-3 overflow-visible">
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        先在列表中對想要執行的 14 天規劃使用「排入日曆」，再在此查看與管理每天的選題與腳本。
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 md:h-9"
                        onClick={() => loadPlanningDays(calendarMonth)}
                        disabled={calendarLoading}
                      >
                        {calendarLoading ? (
                          <span className="text-[10px] md:text-xs">載入中...</span>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            <span className="text-[10px] md:text-xs">重新載入</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="w-full overflow-visible">
                      <PlanningCalendarView
                        days={planningDays}
                        month={calendarMonth}
                        onMonthChange={(m) => {
                          setCalendarMonth(m);
                          loadPlanningDays(m);
                        }}
                        onDayClick={(entry, date) => {
                          setSelectedCalendarDay(entry);
                          setSelectedCalendarDate(date);
                          if (entry) {
                            setCalendarScriptContent(entry.script_content || '');
                            setCalendarScriptStructure(entry.script_structure || 'hook-story-offer');
                            setCalendarDuration(
                              entry.duration_seconds ? String(entry.duration_seconds) : '60'
                            );
                            setCalendarPlatform(entry.platform || 'tiktok');
                            setCalendarExtraNotes(entry.extra_notes || '');
                            setCalendarVideoUrl(entry.video_url || '');
                            setCalendarPerformanceNotes(entry.performance_notes || '');
                            setCalendarViews(entry.views != null ? String(entry.views) : '');
                            setCalendarLikes(entry.likes != null ? String(entry.likes) : '');
                            setCalendarComments(entry.comments != null ? String(entry.comments) : '');
                            setCalendarShares(entry.shares != null ? String(entry.shares) : '');
                          } else {
                            setCalendarScriptContent('');
                            setCalendarExtraNotes('');
                            setCalendarVideoUrl('');
                            setCalendarPerformanceNotes('');
                            setCalendarViews('');
                            setCalendarLikes('');
                            setCalendarComments('');
                            setCalendarShares('');
                          }
                          
                          // 重置生成和儲存狀態
                          setScriptGenerating(false);
                          setScriptSaving(false);
                          
                          setCalendarDialogOpen(true);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                <ScrollArea className="h-[calc(100vh-380px)] md:h-[calc(100vh-550px)]">
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
                                          一鍵生成腳本
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            navigate('/mode1', {
                                              state: {
                                                fromPlanning: true,
                                                planningContent: result.content,
                                              },
                                            });
                                          }}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          在 IP 人設規劃中使用
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (!user?.user_id) {
                                              toast.error('請先登入');
                                              navigate('/login');
                                              return;
                                            }
                                            setScheduleTargetPlan(result);
                                            setScheduleDate(new Date());
                                            setScheduleDialogOpen(true);
                                          }}
                                        >
                                          <CalendarIcon className="w-4 h-4 mr-2" />
                                          排入日曆
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
                      <div className="md:hidden space-y-2">
                        {filteredAndSortedData.map((result: IPPlanningResult) => {
                          const sourceLabel = getSourceLabel(result);
                          const titleId = `planning-${result.id}`;
                          const isEditing = editingTitleId === titleId;
                          return (
                            <Card key={result.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-2.5">
                                <div className="space-y-1.5">
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
                                        className="flex-1 h-7 text-sm"
                                        autoFocus
                                      />
                                    ) : (
                                      <h3 
                                        className="font-medium text-xs flex-1 cursor-pointer hover:text-primary group flex items-center gap-1 leading-tight"
                                        onClick={() => {
                                          setEditingTitleId(titleId);
                                          setEditingTitleValue(result.title || '未命名');
                                        }}
                                      >
                                        <span className="line-clamp-1">{result.title || '未命名'}</span>
                                        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                                      </h3>
                                    )}
                                    {sourceLabel && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                        {sourceLabel}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-muted/50 rounded p-1.5">
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                                      {result.content ? renderCleanContent(result.content, 80) : <span>無內容</span>}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatDate(result.created_at)}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[10px]"
                                        onClick={() => handleView(result)}
                                      >
                                        <Eye className="w-3 h-3 mr-0.5" />
                                        查看
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[10px]"
                                        onClick={() => handleCopy(result.content)}
                                      >
                                        <Copy className="w-3 h-3 mr-0.5" />
                                        複製
                                      </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreVertical className="w-3 h-3" />
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
                                          一鍵生成腳本
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            navigate('/mode1', {
                                              state: {
                                                fromPlanning: true,
                                                planningContent: result.content,
                                              },
                                            });
                                          }}
                                        >
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          在 IP 人設規劃中使用
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
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 排入日曆 Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>排入日曆</DialogTitle>
            <DialogDescription>
              請選擇這 14 天規劃的開始日期，系統將自動為您安排接下來的 14 天發布排程。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-date">開始日期</Label>
              <div className="flex justify-center p-2 border rounded-md">
                <UiCalendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            </div>
            {scheduleDate && (
              <div className="text-sm text-muted-foreground text-center">
                預計排程期間：{scheduleDate.toLocaleDateString()} 至 {new Date(scheduleDate.getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>取消</Button>
            <Button onClick={handleSchedulePlanning} disabled={!scheduleDate}>
              確認排入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 詳情 Dialog */}
      <Dialog open={showDetail} onOpenChange={(open) => {
        setShowDetail(open);
        if (!open) {
          setIsEditingDetailTitle(false);
          setDetailTitleValue('');
        } else if (selectedItem) {
          // 當打開對話框時，初始化標題值
          const currentTitle = selectedItem && 'title' in selectedItem ? selectedItem.title : 
                               (selectedItem && 'topic' in selectedItem ? selectedItem.topic : 
                                (selectedItem && 'mode' in selectedItem ? `${selectedItem.mode} - 對話記錄` : '詳情'));
          setDetailTitleValue(currentTitle);
        }
      }}>
        <DialogContent className="max-w-[95vw] md:max-w-[90vw] max-h-[95vh] overflow-hidden flex flex-col w-[95vw] md:w-[90vw]">
          <DialogHeader className="shrink-0">
            {isEditingDetailTitle && selectedItem && (('title' in selectedItem) || ('topic' in selectedItem)) ? (
              <div className="flex items-center gap-2">
                <Input
                  value={detailTitleValue}
                  onChange={(e) => setDetailTitleValue(e.target.value)}
                  onBlur={() => {
                    if (detailTitleValue.trim() && selectedItem) {
                      handleSaveTitle(selectedItem, detailTitleValue);
                      setIsEditingDetailTitle(false);
                    } else {
                      setIsEditingDetailTitle(false);
                      // 恢復原值
                      const currentTitle = selectedItem && 'title' in selectedItem ? selectedItem.title : 
                                         (selectedItem && 'topic' in selectedItem ? selectedItem.topic : '');
                      setDetailTitleValue(currentTitle);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (detailTitleValue.trim() && selectedItem) {
                        handleSaveTitle(selectedItem, detailTitleValue);
                        setIsEditingDetailTitle(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingDetailTitle(false);
                      // 恢復原值
                      const currentTitle = selectedItem && 'title' in selectedItem ? selectedItem.title : 
                                         (selectedItem && 'topic' in selectedItem ? selectedItem.topic : '');
                      setDetailTitleValue(currentTitle);
                    }
                  }}
                  className="flex-1"
                  autoFocus
                />
              </div>
            ) : (
              <DialogTitle 
                className="flex items-center gap-2 group cursor-pointer hover:text-primary"
                onClick={() => {
                  if (selectedItem && (('title' in selectedItem) || ('topic' in selectedItem))) {
                    const currentTitle = selectedItem && 'title' in selectedItem ? selectedItem.title : 
                                       (selectedItem && 'topic' in selectedItem ? selectedItem.topic : '');
                    setDetailTitleValue(currentTitle);
                    setIsEditingDetailTitle(true);
                  }
                }}
              >
                <span>
                  {selectedItem && 'title' in selectedItem ? selectedItem.title : 
                   (selectedItem && 'topic' in selectedItem ? selectedItem.topic : 
                    (selectedItem && 'mode' in selectedItem ? `${selectedItem.mode} - 對話記錄` : '詳情'))}
                </span>
                {selectedItem && (('title' in selectedItem) || ('topic' in selectedItem)) && (
                  <Edit className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </DialogTitle>
            )}
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
                    ? selectedItem.content // 傳遞原始內容，讓 ScriptEditor 在只讀模式下渲染粗體
                    : (selectedItem && 'summary' in selectedItem 
                        ? `對話類型：${selectedItem.mode || '未知'}\n訊息數：${selectedItem.message_count || 0}\n\n摘要：\n${selectedItem.summary || ''}` 
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

      {/* 14 天規劃日曆詳情 Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={(open) => {
        setCalendarDialogOpen(open);
        if (!open) {
          setSelectedCalendarDay(null);
          setSelectedCalendarDate(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-2 shrink-0 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {selectedCalendarDate?.toLocaleDateString()} ({selectedCalendarDay?.weekday || selectedCalendarDate?.toLocaleDateString('zh-TW', { weekday: 'long' })})
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {selectedCalendarDay ? (
                   // Clean markdown here as well if topic contains it
                  <span className="font-medium text-foreground" dangerouslySetInnerHTML={{ __html: cleanMarkdown(selectedCalendarDay.topic) }} />
                ) : (
                  <span className="text-muted-foreground italic">當天尚未有規劃</span>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col overflow-hidden">
            <Tabs defaultValue="topic" className="h-full flex flex-col min-h-0">
              <div className="mb-4">
                <TabsList className="grid w-full grid-cols-3 shrink-0">
                  <TabsTrigger value="profile">帳號定位</TabsTrigger>
                  <TabsTrigger value="topic">當天選題</TabsTrigger>
                  <TabsTrigger value="script">短影音腳本</TabsTrigger>
                </TabsList>
              </div>
              
              {/* 帳號定位 Tab */}
              <TabsContent value="profile" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-4 pb-4">
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <h3 className="font-semibold text-lg mb-2">
                        IP 帳號定位
                      </h3>
                      {selectedCalendarDay?.account_positioning ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                           <div dangerouslySetInnerHTML={{ __html: cleanMarkdown(selectedCalendarDay.account_positioning) }} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <User className="w-12 h-12 mb-4 opacity-20" />
                          <p>找不到相關聯的 IP 人設定位資料</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* 當天選題 Tab */}
              <TabsContent value="topic" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col min-h-0">
                 <div className="flex-1 overflow-y-auto pr-2">
                    <div className="flex flex-col pb-4">
                        <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mb-4 flex-shrink-0 flex flex-col justify-center items-center text-center min-h-[200px]">
                          <div className="flex items-center gap-2 mb-4 w-full justify-center">
                            <h3 className="text-2xl font-bold text-primary">今日選題</h3>
                            {selectedCalendarDay && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setIsEditingTopic(true);
                                  setEditingTopicValue(selectedCalendarDay.topic || '');
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {isEditingTopic && selectedCalendarDay ? (
                            <div className="w-full max-w-2xl space-y-2">
                              <Textarea
                                value={editingTopicValue}
                                onChange={(e) => setEditingTopicValue(e.target.value)}
                                className="min-h-[120px] text-base"
                                placeholder="輸入選題內容..."
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsEditingTopic(false);
                                    setEditingTopicValue('');
                                  }}
                                >
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (!selectedCalendarDay?.id) return;
                                    if (!editingTopicValue.trim()) {
                                      toast.error('選題內容不能為空');
                                      return;
                                    }
                                    try {
                                      await apiPut(`/api/planning-days/${selectedCalendarDay.id}/topic`, {
                                        topic: editingTopicValue.trim()
                                      });
                                      toast.success('選題已更新');
                                      setIsEditingTopic(false);
                                      // 更新本地狀態
                                      setSelectedCalendarDay({
                                        ...selectedCalendarDay,
                                        topic: editingTopicValue.trim()
                                      });
                                      setPlanningDays(prev => prev.map(day => 
                                        day.id === selectedCalendarDay.id 
                                          ? { ...day, topic: editingTopicValue.trim() }
                                          : day
                                      ));
                                      // 重新載入日曆資料
                                      loadPlanningDays(calendarMonth);
                                    } catch (error: any) {
                                      console.error('更新選題失敗:', error);
                                      toast.error(error.message || '更新選題失敗');
                                    }
                                  }}
                                >
                                  儲存
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full max-w-2xl">
                              <p className="text-xl font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanMarkdown(selectedCalendarDay?.topic || '無選題') }} />
                              {selectedCalendarDay?.topic && selectedCalendarDay.day_index && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  此選題來自 14 天規劃的第 {selectedCalendarDay.day_index} 天
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border flex-shrink-0">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            創作提示
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            這個選題是根據您的 IP 人設定位與 14 天規劃策略生成的。建議您在創作時，保持與人設的一致性，並嘗試在影片前 3 秒抓住觀眾注意力。
                          </p>
                        </div>
                        {selectedCalendarDay && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!selectedCalendarDay?.id) return;
                                if (!confirm('確定要刪除這一天的規劃嗎？此操作無法復原。')) return;
                                
                                try {
                                  await apiDelete(`/api/planning-days/${selectedCalendarDay.id}`);
                                  toast.success('已刪除當天的規劃');
                                  setCalendarDialogOpen(false);
                                  setSelectedCalendarDay(null);
                                  setSelectedCalendarDate(null);
                                  // 重新載入日曆資料
                                  loadPlanningDays(calendarMonth);
                                } catch (error: any) {
                                  console.error('刪除失敗:', error);
                                  toast.error(error.message || '刪除失敗');
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              刪除這一天的規劃
                            </Button>
                          </div>
                        )}
                     </div>
                 </div>
              </TabsContent>
              
              {/* 短影音腳本 Tab */}
              <TabsContent value="script" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-6 pb-4">
                    {/* 腳本設定區塊 */}
                    <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/30 rounded-lg border">
                      <div className="space-y-2">
                        <Label>腳本結構</Label>
                        <Select 
                          value={calendarScriptStructure} 
                          onValueChange={setCalendarScriptStructure}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇結構" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hook-story-offer">Hook-Story-Offer (標準)</SelectItem>
                            <SelectItem value="problem-agitate-solve">Problem-Agitate-Solve (痛點)</SelectItem>
                            <SelectItem value="before-after-bridge">Before-After-Bridge (對比)</SelectItem>
                            <SelectItem value="listicle">Listicle (清單式)</SelectItem>
                            <SelectItem value="educational">Educational (教學式)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>預計秒數</Label>
                        <Select 
                          value={calendarDuration} 
                          onValueChange={setCalendarDuration}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇秒數" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 秒</SelectItem>
                            <SelectItem value="30">30 秒</SelectItem>
                            <SelectItem value="60">60 秒</SelectItem>
                            <SelectItem value="90">90 秒</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>發佈平台</Label>
                        <Select 
                          value={calendarPlatform} 
                          onValueChange={setCalendarPlatform}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇平台" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="instagram">Instagram Reels</SelectItem>
                            <SelectItem value="youtube">YouTube Shorts</SelectItem>
                            <SelectItem value="facebook">Facebook Reels</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>補充說明</Label>
                        <Input 
                          placeholder="例如：語氣要活潑、強調某個重點..." 
                          value={calendarExtraNotes}
                          onChange={(e) => setCalendarExtraNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 腳本內容編輯器 */}
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <Label>腳本內容</Label>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleGenerateCalendarScript}
                            disabled={scriptGenerating || !selectedCalendarDay}
                            className="flex-1 md:flex-none"
                          >
                            {scriptGenerating ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                {calendarScriptContent ? '換一個' : '一鍵生成腳本'}
                              </>
                            )}
                          </Button>
                          {calendarScriptContent && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleDownloadCalendarScriptPDF}
                              disabled={!selectedCalendarDay}
                              className="flex-1 md:flex-none"
                            >
                              <FileDown className="w-3 h-3 mr-1" />
                              下載 PDF
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={handleSaveCalendarScript}
                            disabled={scriptSaving || !selectedCalendarDay}
                            className="flex-1 md:flex-none"
                          >
                             {scriptSaving ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                儲存中...
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3 mr-1" />
                                儲存
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <ScriptEditor
                        content={calendarScriptContent}
                        onSave={(content) => {
                          setCalendarScriptContent(content);
                          // 不自動儲存到後端，等待用戶點擊儲存按鈕
                        }}
                        className="min-h-[300px]"
                        showToolbar={true}
                      />
                    </div>

                    {/* 成效追蹤區塊 */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        成效追蹤
                      </h4>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>影片連結</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://..." 
                              value={calendarVideoUrl}
                              onChange={(e) => setCalendarVideoUrl(e.target.value)}
                            />
                            {calendarVideoUrl && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={calendarVideoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-8">
                           <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="is-posted" 
                              checked={!!selectedCalendarDay?.posted_at}
                              onCheckedChange={(checked) => {
                                // Update local state optimistically if needed, 
                                // but actual update happens on Save
                              }}
                            />
                            <Label htmlFor="is-posted" className="font-normal cursor-pointer">
                              已發佈 (勾選後儲存以標記日期)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">觀看次數</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={calendarViews}
                            onChange={(e) => setCalendarViews(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">按讚數</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={calendarLikes}
                            onChange={(e) => setCalendarLikes(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">留言數</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={calendarComments}
                            onChange={(e) => setCalendarComments(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">分享數</Label>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            value={calendarShares}
                            onChange={(e) => setCalendarShares(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>成效備註</Label>
                        <Textarea 
                          placeholder="記錄這支影片的表現、觀眾反應或改進點..." 
                          className="min-h-[80px]"
                          value={calendarPerformanceNotes}
                          onChange={(e) => setCalendarPerformanceNotes(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex justify-end pb-4">
                         <Button 
                            onClick={handleSaveCalendarScript}
                            disabled={scriptSaving || !selectedCalendarDay}
                            className="w-full md:w-auto"
                          >
                             {scriptSaving ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                儲存中...
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3 mr-1" />
                                儲存所有變更
                              </>
                            )}
                          </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
