/**
 * Guide - 實戰指南主頁面
 * 展示所有指南文章列表
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';

// 指南文章列表
const guides = [
  {
    id: 1,
    title: '三步驟生成 30 秒腳本',
    description: '快速掌握腳本生成技巧，從零到一完成你的第一支短影音腳本',
    category: '入門必讀',
    readTime: '5 分鐘',
    slug: 'three-steps-to-generate-30-second-script'
  },
  {
    id: 2,
    title: 'AI 帳號定位 14 天計劃',
    description: '找到你的獨特風格，建立清晰的帳號定位和內容策略',
    category: '帳號定位',
    readTime: '10 分鐘',
    slug: 'ai-account-positioning-14-day-plan'
  },
  {
    id: 3,
    title: 'Reels/Shorts/TikTok 腳本差異',
    description: '針對不同平台優化腳本，提升內容表現和互動率',
    category: '平台策略',
    readTime: '8 分鐘',
    slug: 'reels-shorts-tiktok-script-differences'
  },
  {
    id: 4,
    title: '腳本結構選擇指南',
    description: '選擇最適合的腳本架構，讓你的內容更有吸引力',
    category: '腳本技巧',
    readTime: '7 分鐘',
    slug: 'script-structure-selection-guide'
  },
  {
    id: 5,
    title: '如何取得 LLM API Key',
    description: '完整教學：申請和設定 OpenAI、Claude 等 AI 服務的 API 金鑰',
    category: '技術設定',
    readTime: '6 分鐘',
    slug: 'how-to-get-llm-api-key'
  },
  {
    id: 6,
    title: '什麼是生命曲線？',
    description: '理解生命曲線理論，打造更有共鳴的短影音內容',
    category: '內容理論',
    readTime: '8 分鐘',
    slug: 'what-is-life-curve'
  },
  {
    id: 7,
    title: '進階 IP 規劃',
    description: '打造個人品牌影響力，從創作者到 KOL 的進階策略',
    category: '進階技巧',
    readTime: '12 分鐘',
    slug: 'advanced-ip-planning'
  },
  {
    id: 8,
    title: '短影音變現策略',
    description: '從流量到收益的完整路徑，掌握短影音變現的關鍵要素',
    category: '變現策略',
    readTime: '15 分鐘',
    slug: 'short-video-monetization'
  },
  {
    id: 9,
    title: 'AI 效率提升指南',
    description: '善用 AI 工具提升創作效率，讓你的內容產出速度翻倍',
    category: 'AI 應用',
    readTime: '10 分鐘',
    slug: 'ai-efficiency-boost'
  },
  {
    id: 10,
    title: 'AI 帳號定位提示詞',
    description: '精選帳號定位提示詞範例，快速生成專業的定位分析',
    category: '提示詞庫',
    readTime: '6 分鐘',
    slug: 'ai-account-positioning-prompts'
  },
  {
    id: 11,
    title: 'AI 選題提示詞',
    description: '掌握選題提示詞技巧，讓 AI 幫你找到爆款主題',
    category: '提示詞庫',
    readTime: '6 分鐘',
    slug: 'ai-topic-selection-prompts'
  },
  {
    id: 12,
    title: 'AI 腳本生成提示詞',
    description: '優化腳本生成提示詞，創作出更符合平台特性的內容',
    category: '提示詞庫',
    readTime: '7 分鐘',
    slug: 'ai-script-generation-prompts'
  }
];

// 分類列表
const categories = [
  '全部',
  '入門必讀',
  '帳號定位',
  '平台策略',
  '腳本技巧',
  '技術設定',
  '內容理論',
  '進階技巧',
  '變現策略',
  'AI 應用',
  '提示詞庫'
];

export default function Guide() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const handleGoogleLogin = async () => {
    try {
      // 使用與 Login.tsx 相同的登入邏輯
      // 使用新版前端的專用端點 /api/auth/google-new
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google-new');
      window.location.href = auth_url;
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error('登入失敗，請稍後再試');
    }
  };

  // 篩選文章
  const filteredGuides = selectedCategory === '全部'
    ? guides
    : guides.filter(guide => guide.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            ReelMind
          </h1>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="default" onClick={() => navigate('/')}>
              返回首頁
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero 區塊 */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            實戰指南
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            從新手到專家的完整指南
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            12 篇精選文章，涵蓋短影音創作的所有關鍵知識，幫助你快速掌握 AI 短影音創作技巧
          </p>
        </div>
      </section>

      {/* 分類篩選 */}
      <section className="py-8 px-4 border-b bg-background sticky top-16 z-40">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* 文章列表 */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map(guide => (
              <Card 
                key={guide.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/guide/${guide.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{guide.category}</Badge>
                    <span className="text-xs text-muted-foreground">{guide.readTime}</span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {guide.title}
                  </CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                    閱讀更多
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">此分類暫無文章</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA 區塊 */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            準備好開始實踐了嗎？
          </h2>
          <p className="text-muted-foreground mb-8">
            閱讀完指南後，立即使用 ReelMind 開始你的短影音創作之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}>
              立即開始創作
            </Button>
            <Button size="lg" variant="outline" onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}>
              免費體驗
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
