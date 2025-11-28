/**
 * ArticleDetail - 文章詳情頁面
 * 根據 id 顯示指南文章的詳細內容
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// 指南文章列表（與 Guide.tsx 保持一致）
const guides = [
  {
    id: 1,
    title: '三步驟生成 30 秒腳本',
    description: '快速掌握腳本生成技巧，從零到一完成你的第一支短影音腳本',
    category: '入門必讀',
    readTime: '5 分鐘',
    slug: 'three-steps-to-generate-30-second-script',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 2,
    title: 'AI 帳號定位 14 天計劃',
    description: '找到你的獨特風格，建立清晰的帳號定位和內容策略',
    category: '帳號定位',
    readTime: '10 分鐘',
    slug: 'ai-account-positioning-14-day-plan',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 3,
    title: 'Reels/Shorts/TikTok 腳本差異',
    description: '針對不同平台優化腳本，提升內容表現和互動率',
    category: '平台策略',
    readTime: '8 分鐘',
    slug: 'reels-shorts-tiktok-script-differences',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 4,
    title: '腳本結構選擇指南',
    description: '選擇最適合的腳本架構，讓你的內容更有吸引力',
    category: '腳本技巧',
    readTime: '7 分鐘',
    slug: 'script-structure-selection-guide',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 5,
    title: '如何取得 LLM API Key',
    description: '完整教學：申請和設定 OpenAI、Claude 等 AI 服務的 API 金鑰',
    category: '技術設定',
    readTime: '6 分鐘',
    slug: 'how-to-get-llm-api-key',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 6,
    title: '什麼是生命曲線？',
    description: '理解生命曲線理論，打造更有共鳴的短影音內容',
    category: '內容理論',
    readTime: '8 分鐘',
    slug: 'what-is-life-curve',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 7,
    title: '進階 IP 規劃',
    description: '打造個人品牌影響力，從創作者到 KOL 的進階策略',
    category: '進階技巧',
    readTime: '12 分鐘',
    slug: 'advanced-ip-planning',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 8,
    title: '短影音變現策略',
    description: '從流量到收益的完整路徑，掌握短影音變現的關鍵要素',
    category: '變現策略',
    readTime: '15 分鐘',
    slug: 'short-video-monetization',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 9,
    title: 'AI 效率提升指南',
    description: '善用 AI 工具提升創作效率，讓你的內容產出速度翻倍',
    category: 'AI 應用',
    readTime: '10 分鐘',
    slug: 'ai-efficiency-boost',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 10,
    title: 'AI 帳號定位提示詞',
    description: '精選帳號定位提示詞範例，快速生成專業的定位分析',
    category: '提示詞庫',
    readTime: '6 分鐘',
    slug: 'ai-account-positioning-prompts',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 11,
    title: 'AI 選題提示詞',
    description: '掌握選題提示詞技巧，讓 AI 幫你找到爆款主題',
    category: '提示詞庫',
    readTime: '6 分鐘',
    slug: 'ai-topic-selection-prompts',
    content: '文章內容正在準備中，敬請期待...'
  },
  {
    id: 12,
    title: 'AI 腳本生成提示詞',
    description: '優化腳本生成提示詞，創作出更符合平台特性的內容',
    category: '提示詞庫',
    readTime: '7 分鐘',
    slug: 'ai-script-generation-prompts',
    content: '文章內容正在準備中，敬請期待...'
  }
];

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<typeof guides[0] | null>(null);

  useEffect(() => {
    if (id) {
      const articleId = parseInt(id);
      const found = guides.find(g => g.id === articleId);
      if (found) {
        setArticle(found);
      } else {
        // 如果找不到文章，導向指南列表頁
        navigate('/#/guide');
      }
    }
  }, [id, navigate]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">載入中...</p>
          <Button onClick={() => navigate('/#/guide')}>返回指南列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/#/guide')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回指南
          </Button>
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            ReelMind
          </h1>
        </div>
      </nav>

      {/* 文章內容 */}
      <article className="container max-w-4xl py-12 px-4">
        {/* 文章標題區 */}
        <div className="mb-8">
          <Badge className="mb-4">{article.category}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>實戰指南</span>
            </div>
          </div>
        </div>

        {/* 文章描述 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-lg text-muted-foreground">{article.description}</p>
          </CardContent>
        </Card>

        {/* 文章正文 */}
        <Card>
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {article.content}
            </div>
          </CardContent>
        </Card>

        {/* 返回按鈕 */}
        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/#/guide')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回指南列表
          </Button>
        </div>
      </article>
    </div>
  );
}
