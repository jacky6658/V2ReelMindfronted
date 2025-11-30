/**
 * HelpCenter - 幫助中心頁面
 * 提供常見問題、快速入門、功能教程和聯繫支持
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  ExternalLink,
  Sparkles,
  ChevronRight,
  Zap,
  Database,
  MessageSquare,
  Settings,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'features' | 'technical' | 'account' | 'billing';
  tags: string[];
}

const faqData: FAQItem[] = [
  // 快速入門
  {
    id: 'faq-1',
    question: '如何開始使用 ReelMind？',
    answer: '您可以先使用「免費體驗」功能試用 AI 生成腳本。滿意後，登入帳號並綁定您的 LLM API Key（Gemini 或 OpenAI），即可開始使用完整功能。建議先閱讀「實戰指南」中的「三步驟生成 30 秒腳本」教學。',
    category: 'getting-started',
    tags: ['入門', '快速開始']
  },
  {
    id: 'faq-2',
    question: '如何取得 LLM API Key？',
    answer: '請前往「實戰指南」→「如何取得 LLM API Key」，我們提供了完整的圖文和影片教學，包含 Gemini 和 OpenAI 兩種 API Key 的申請方式。取得後，在「設定」頁面中綁定即可。',
    category: 'getting-started',
    tags: ['API Key', '設定']
  },
  {
    id: 'faq-3',
    question: '免費體驗和訂閱方案有什麼差別？',
    answer: '免費體驗：無需登入即可試用基本功能，但無法儲存內容。訂閱方案：可儲存所有生成的內容、使用完整功能、獲得優先技術支援，並可匯出資料。',
    category: 'getting-started',
    tags: ['訂閱', '方案']
  },
  // 功能使用
  {
    id: 'faq-4',
    question: 'Mode1（IP人設規劃）和 Mode3（一鍵生成）有什麼不同？',
    answer: 'Mode1 是對話式 AI 顧問，適合深度規劃帳號定位、內容策略和 14 天規劃。Mode3 是快速生成工具，三步驟即可產出腳本，適合快速產出內容。建議先用 Mode1 建立定位，再用 Mode3 快速生成。',
    category: 'features',
    tags: ['Mode1', 'Mode3', '功能']
  },
  {
    id: 'faq-5',
    question: '如何儲存和管理生成的內容？',
    answer: '所有生成的內容會自動儲存到「創作者資料庫」。您可以在「我的資料」頁面中查看、編輯、匯出或刪除所有腳本、對話記錄和生成記錄。',
    category: 'features',
    tags: ['儲存', '資料庫']
  },
  {
    id: 'faq-6',
    question: '可以匯出生成的腳本嗎？',
    answer: '可以！在「創作者資料庫」中點擊任何腳本，選擇「匯出」即可下載為 TXT、PDF 或 Word 格式。您也可以一次匯出所有資料為 CSV 檔案。',
    category: 'features',
    tags: ['匯出', '下載']
  },
  // 技術問題
  {
    id: 'faq-7',
    question: '為什麼 AI 沒有回應或回應很慢？',
    answer: '可能原因：1) API Key 額度用盡或設定錯誤，請檢查「設定」頁面中的 API Key 狀態。2) 網路連線問題。3) API 服務暫時無法使用。建議先測試 API Key，或聯繫技術支援。',
    category: 'technical',
    tags: ['技術', 'API', '錯誤']
  },
  {
    id: 'faq-8',
    question: '支援哪些 LLM 服務？',
    answer: '目前支援 Google Gemini 和 OpenAI（ChatGPT）。您可以在「設定」頁面中綁定多個 API Key，系統會優先使用您設定的 API Key。',
    category: 'technical',
    tags: ['LLM', 'API', '支援']
  },
  {
    id: 'faq-9',
    question: '生成的內容不符合預期怎麼辦？',
    answer: '建議：1) 在 Mode1 中更詳細地描述您的需求。2) 調整「個人資料」中的 AI 偏好設定（語氣、語言、主題）。3) 使用「創作者資料庫」中的編輯功能手動調整。4) 多次嘗試，AI 會根據您的反饋改進。',
    category: 'technical',
    tags: ['生成', '優化']
  },
  // 帳號問題
  {
    id: 'faq-10',
    question: '如何修改個人資料和偏好設定？',
    answer: '前往「個人資料」頁面，您可以設定創作者帳號資訊、AI 偏好（語氣、語言、影片長度、主題類別）等。這些設定會影響 AI 生成的內容風格。',
    category: 'account',
    tags: ['帳號', '設定']
  },
  {
    id: 'faq-11',
    question: '忘記密碼怎麼辦？',
    answer: 'ReelMind 使用 Google OAuth 登入，無需設定密碼。如果無法登入，請確認您的 Google 帳號狀態，或聯繫客服協助。',
    category: 'account',
    tags: ['登入', '密碼']
  },
  {
    id: 'faq-12',
    question: '如何刪除帳號？',
    answer: '目前帳號刪除功能正在開發中。如需刪除帳號，請聯繫客服，我們會協助您處理。',
    category: 'account',
    tags: ['帳號', '刪除']
  },
  // 付費問題
  {
    id: 'faq-13',
    question: '訂閱方案如何計費？',
    answer: '我們提供月付和年付方案，年付享有優惠。訂閱後可隨時取消，取消後仍可使用至當期結束。詳細方案請查看「定價」頁面。',
    category: 'billing',
    tags: ['訂閱', '付費']
  },
  {
    id: 'faq-14',
    question: '如何查看訂單記錄？',
    answer: '前往「我的訂單」頁面，您可以查看所有訂單記錄、付款狀態和發票資訊。',
    category: 'billing',
    tags: ['訂單', '付款']
  },
  {
    id: 'faq-15',
    question: '是否提供發票？',
    answer: '是的，所有訂閱都會提供電子發票。如需統一編號，請在訂閱時填寫公司資訊，或在「我的訂單」中查看發票。',
    category: 'billing',
    tags: ['發票', '統一編號']
  },
];

const quickLinks = [
  {
    title: '快速入門',
    description: '三步驟生成你的第一支腳本',
    icon: Zap,
    link: '/guide/three-steps-to-generate-30-second-script',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: '如何取得 API Key',
    description: '完整教學：申請和設定 API 金鑰',
    icon: Settings,
    link: '/guide/how-to-get-llm-api-key',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'IP 人設規劃',
    description: '建立清晰的帳號定位和內容策略',
    icon: MessageSquare,
    link: '/guide/ai-account-positioning-14-day-plan',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    title: '實戰指南',
    description: '查看所有教學文章',
    icon: BookOpen,
    link: '/guide',
    color: 'from-orange-500 to-red-500'
  },
];

const categoryLabels = {
  'getting-started': { label: '快速入門', icon: Zap, color: 'text-blue-500' },
  'features': { label: '功能使用', icon: Sparkles, color: 'text-purple-500' },
  'technical': { label: '技術問題', icon: Settings, color: 'text-emerald-500' },
  'account': { label: '帳號問題', icon: HelpCircle, color: 'text-orange-500' },
  'billing': { label: '付費問題', icon: TrendingUp, color: 'text-pink-500' },
};

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  // 過濾 FAQ
  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    // 分類過濾
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // 搜索過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // 統計各分類數量
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    faqData.forEach(faq => {
      counts[faq.category] = (counts[faq.category] || 0) + 1;
    });
    return counts;
  }, []);

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
              <ArrowLeft className="w-4 h-4" />
              返回主控台
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">ReelMind</span>
            </div>
            <Badge variant="outline" className="hidden md:inline-flex">
              幫助中心
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">幫助中心</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            找到您需要的答案，或聯繫我們獲得協助
          </p>
        </div>

        {/* 快速連結 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.title}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                onClick={() => navigate(link.link)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                  <div className="mt-4 flex items-center text-sm text-primary group-hover:gap-2 transition-all">
                    查看詳情
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 搜索框 */}
        <div className="max-w-2xl mx-auto relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="搜索問題或關鍵字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 分類篩選 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              全部 ({faqData.length})
            </Button>
            {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label} ({categoryCounts[key] || 0})
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ 列表 */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">沒有找到相關問題</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}>
                  清除篩選
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq) => {
                const categoryInfo = categoryLabels[faq.category];
                const CategoryIcon = categoryInfo.icon;
                return (
                  <Card key={faq.id} className="border-2">
                    <AccordionItem value={faq.id} className="border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-start gap-4 flex-1 text-left">
                          <div className={`mt-1 ${categoryInfo.color}`}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{faq.question}</h3>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {faq.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="pl-9">
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                );
              })}
            </Accordion>
          )}
        </div>

        {/* 聯繫支持 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary" />
                還需要協助？
              </CardTitle>
              <CardDescription>
                如果以上問題無法解決您的疑問，歡迎聯繫我們的支援團隊
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => window.open('https://AIJobschool.short.gy/E49kA8', '_blank')}
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold">LINE 官方帳號</div>
                    <div className="text-xs text-muted-foreground">即時客服支援</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => window.open('https://AIJobschool.short.gy/UUwpEG', '_blank')}
                >
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="font-semibold">Discord 社群</div>
                    <div className="text-xs text-muted-foreground">加入討論交流</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/contact')}
                >
                  <Mail className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">聯絡我們</div>
                    <div className="text-xs text-muted-foreground">填寫表單聯繫</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

