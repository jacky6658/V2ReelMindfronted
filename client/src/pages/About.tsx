/**
 * About - 關於我們頁面
 * 介紹 ReelMind 的使命、功能和團隊
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Sparkles, Target, Zap, TrendingUp, Users, Heart, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            關於 ReelMind
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            以 AI 建立你的短影音內容系統，讓每個創作者都能打造可持續、可量產、可進化的內容生產力
          </p>
        </div>
      </section>

      {/* 使命願景 */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>我們的使命</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  讓每個創作者都能輕鬆掌握短影音創作，透過 AI 技術降低內容生產門檻，
                  幫助更多人實現自媒體夢想。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>我們的願景</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  成為華語圈最受信賴的短影音 AI 工具，打造一個讓創作者、品牌方和行銷團隊
                  都能高效產出優質內容的生態系統。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>我們的價值</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  以使用者為中心，持續優化產品體驗；以創新為驅動，不斷探索 AI 技術的可能性；
                  以品質為基石，確保每個功能都經過精心打磨。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 產品功能 */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">核心功能</h2>
            <p className="text-muted-foreground">
              三大智能模式，解決短影音創作者的所有痛點
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>IP 人設規劃</CardTitle>
                <CardDescription>
                  14 天帳號定位計劃，找到你的獨特風格
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>受眾分析與定位</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>內容支柱規劃</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>上片節奏建議</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI 腳本生成</CardTitle>
                <CardDescription>
                  3 步驟生成 30 秒爆款腳本
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>開場 Hook 設計</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>橋段重點規劃</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>CTA 行動呼籲</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>一鍵生成</CardTitle>
                <CardDescription>
                  從靈感到腳本，30 秒完成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>AI 選題建議</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>自動腳本生成</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>平台優化建議</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 適用對象 */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">誰適合使用 ReelMind？</h2>
            <p className="text-muted-foreground">
              無論你是創作新手還是資深行銷人員，ReelMind 都能幫助你提升效率
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">個人創作者</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  想要開始短影音創作，但不知道如何定位和寫腳本的新手創作者
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">自媒體經營者</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  已有粉絲基礎，想要提升內容產出效率和品質的自媒體工作者
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">品牌行銷</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  需要大量短影音內容進行品牌推廣的企業行銷團隊
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Rocket className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">電商賣家</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  想透過短影音帶貨，提升商品曝光和銷售的電商經營者
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 技術優勢 */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">為什麼選擇 ReelMind？</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  專為華語市場設計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  深度理解台灣、香港、中國大陸等華語地區的短影音生態，
                  針對 IG Reels、TikTok、YouTube Shorts 等平台優化腳本結構。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  AI 技術持續進化
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  採用最新的大型語言模型，持續學習和優化，確保生成的腳本緊跟潮流趨勢，
                  符合各平台的演算法偏好。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  完整的內容系統
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  不只是腳本生成工具，更提供帳號定位、選題策略、內容規劃等完整解決方案，
                  幫助你建立可持續的內容生產系統。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA 區塊 */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">
            準備好開始你的短影音之旅了嗎？
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            立即體驗 AI 短影音智能體，從靈感枯竭到內容量產
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" onClick={() => navigate('/mode1')}>
              立即開始
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate('/experience')}>
              免費體驗
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
