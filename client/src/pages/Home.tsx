import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, Sparkles, Target, Zap, TrendingUp, CheckCircle2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiGet } from "@/lib/api-client";
import { toast } from "sonner";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">ReelMind</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">功能</a>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/intro')}>產品介紹</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/guide')}>實戰指南</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/forum')}>論壇</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/pricing')}>方案</span>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">定價</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label={theme === 'dark' ? '切換到淺色模式' : '切換到深色模式'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {isLoggedIn ? (
              <Button variant="default" className="hidden md:inline-flex" onClick={() => navigate('/userdb')}>
                我的資料
              </Button>
            ) : (
              <Button variant="default" className="hidden md:inline-flex" onClick={handleGoogleLogin}>
                登入
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero 區塊 */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* 影片背景 */}
        <div className="video-background">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover"
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        {/* Hero 內容 */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              AI 短影音智能體
              <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                從靈感枯竭到內容量產
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              專為 IG、TikTok、Shorts 打造。AI 生成爆款腳本、精準帳號定位，效率提升 70%
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base px-8" onClick={() => navigate('/mode1')}>
                立即開始
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate('/experience')}>
                免費體驗
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              每天不到 NT$66，全年 AI 幫你生成靈感與爆款腳本
            </p>
          </div>
        </div>
      </section>

      {/* 功能區塊 */}
      <section id="features" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              三大智能模式，解決短影音創作者的所有痛點
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>IP 人設規劃</CardTitle>
                <CardDescription>
                  14 天帳號定位計劃，找到你的獨特風格
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">受眾分析與定位</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">內容支柱規劃</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">上片節奏建議</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI 腳本生成</CardTitle>
                <CardDescription>
                  3 步驟生成 30 秒爆款腳本
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">開場 Hook 設計</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">橋段重點規劃</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">CTA 行動呼籲</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>一鍵生成</CardTitle>
                <CardDescription>
                  從靈感到腳本，30 秒完成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">AI 選題建議</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">自動腳本生成</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">平台優化建議</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 解決方案區塊 */}
      <section id="solutions" className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">解決創作者痛點</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              從靈感枯竭到內容量產，ReelMind 陪你一路成長
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4 p-6 rounded-lg bg-background border hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">不知道拍什麼？</h3>
                <p className="text-sm text-muted-foreground">
                  AI 根據你的產業和平台，自動生成熱門題材和腳本靈感
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-lg bg-background border hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">帳號沒有定位？</h3>
                <p className="text-sm text-muted-foreground">
                  14 天 IP 人設規劃，幫你找到受眾和內容方向
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-lg bg-background border hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">寫腳本太費時？</h3>
                <p className="text-sm text-muted-foreground">
                  3 步驟生成 30 秒腳本，包含開場、橋段和 CTA
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-lg bg-background border hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">上片頻率不穩？</h3>
                <p className="text-sm text-muted-foreground">
                  一鍵生成模式，30 秒完成從靈感到腳本的全流程
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 實戰指南區塊 */}
      <section id="guide" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">實戰指南</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              從新手到專家，完整的短影音創作指南
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "三步驟生成 30 秒腳本", desc: "快速掌握腳本生成技巧", slug: "three-steps-to-generate-30-second-script" },
              { title: "AI 帳號定位 14 天計劃", desc: "找到你的獨特風格", slug: "ai-account-positioning-14-day-plan" },
              { title: "Reels/Shorts/TikTok 腳本差異", desc: "針對不同平台優化", slug: "reels-shorts-tiktok-script-differences" },
              { title: "腳本結構選擇指南", desc: "選擇最適合的腳本架構", slug: "script-structure-selection-guide" },
              { title: "進階 IP 規劃", desc: "打造個人品牌影響力", slug: "advanced-ip-planning" },
              { title: "短影音變現策略", desc: "從流量到收益的完整路徑", slug: "short-video-monetization" },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => navigate(`/guide/${item.slug}`)}
                  >
                    閱讀更多 →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube 課程介紹區塊 */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ReelMind 使用教學</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              完整的影片教學，快速上手 AI 短影音創作
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/Pw1_MRIJ9GA"
                title="ReelMind AI 短影音智能體示範影片"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* 定價區塊 */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">選擇適合的方案</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              每天不到 NT$66，全年 AI 幫你生成靈感與爆款腳本
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            <Card className="relative hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Script Lite 入門版</CardTitle>
                <CardDescription>適合剛起步的創作者</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">NT$8,280</span>
                  <span className="text-muted-foreground">/年</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">AI 腳本生成</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">基礎選題建議</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">每月 100 次生成</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    navigate('/pricing');
                  }}
                >
                  選擇方案
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-primary hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  最受歡迎
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Creator Pro 雙年方案</CardTitle>
                <CardDescription>專業創作者的最佳選擇</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">NT$9,900</span>
                  <span className="text-muted-foreground">/2年</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">所有 Lite 功能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">IP 人設規劃</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">無限次生成</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">優先客服支援</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => {
                    navigate('/pricing');
                  }}
                >
                  選擇方案
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 區塊 */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            準備好開始你的短影音之旅了嗎？
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            立即體驗 AI 短影音智能體，從靈感枯竭到內容量產
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-base px-8"
              onClick={() => navigate('/intro')}
            >
              產品介紹
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/experience')}
            >
              免費體驗
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/forum')}
            >
              加入論壇
            </Button>
          </div>
        </div>
      </section>

      {/* 頁尾 */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 ReelMind AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
