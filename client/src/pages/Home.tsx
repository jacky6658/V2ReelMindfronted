import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Target, Zap, TrendingUp, CheckCircle2, Play, Check, Mail, Shield, CreditCard, Menu, User, LogOut, Home as HomeIcon, BookOpen, Users, Settings, ArrowLeft, Gift, Calendar, FileText, MessageSquare, BarChart, Key, Package, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import SiteFooterContacts from "@/components/SiteFooterContacts";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAInstallGuide from "@/components/PWAInstallGuide";

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, getToken, user, logout } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 處理錨點滾動（因為使用 HashRouter，需要手動處理）
  const handleScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGoogleLogin = () => {
    // 導向登入頁面，讓用戶有機會輸入推薦碼
    navigate('/login');
  };

  // 確保影片在載入後立即播放
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const playVideo = async () => {
        try {
          await video.play();
        } catch (error) {
          console.warn('Video autoplay prevented:', error);
        }
      };
      
      if (video.readyState >= 2) {
        // 如果影片已經載入足夠數據，立即播放
        playVideo();
      } else {
        // 否則等待載入完成
        video.addEventListener('loadeddata', playVideo, { once: true });
        video.addEventListener('canplay', playVideo, { once: true });
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between relative">
          {/* 桌面版：左侧 ReelMind Logo */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ReelMind</span>
          </div>

          {/* 手机版：左侧返回主控台（如果有登录） */}
          <div className="md:hidden flex-1 flex items-center">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回主控台</span>
              </Button>
            )}
          </div>
          
          {/* 手机版：中间 ReelMind（置中） */}
          <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ReelMind</span>
          </div>
          
          {/* 手机版：右侧返回首页 */}
          <div className="md:hidden flex-1 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">返回首頁</span>
            </Button>
          </div>
          
          {/* 桌面版：中间导航链接 */}
          <div className="hidden md:flex items-center gap-6">
            <span 
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" 
              onClick={() => handleScrollTo('features')}
            >
              功能
            </span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/intro')}>產品介紹</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/guide')}>實戰指南</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/forum')}>論壇</span>
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/pricing')}>方案</span>
            <span 
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer" 
              onClick={() => handleScrollTo('pricing')}
            >
              定價
            </span>
          </div>

          {/* 桌面版：右侧按钮（登录/主控台） */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Button variant="default" onClick={() => navigate('/app')}>
                主控台
              </Button>
            ) : (
              <Button variant="default" onClick={handleGoogleLogin}>
                登入
              </Button>
            )}
          </div>

          {/* 移動版：選單按鈕 */}
          <div className="md:hidden flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="開啟選單"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>選單</SheetTitle>
                  <SheetDescription>
                    {isLoggedIn ? `歡迎，${user?.name || '用戶'}` : '瀏覽 ReelMind'}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* 用戶資訊（已登入時顯示） */}
                  {isLoggedIn && user && (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <img 
                          src={user.picture} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* 快速導航 */}
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <HomeIcon className="w-4 h-4 mr-2" />
                      首頁
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        handleScrollTo('features');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      功能
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/intro');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      產品介紹
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/guide');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      實戰指南
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate('/forum');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      論壇
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        handleScrollTo('pricing');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      定價
                    </Button>
                  </div>

                  <Separator />

                  {/* 主要操作按鈕 */}
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          navigate('/app');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        進入主控台
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigate('/profile');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        個人設定
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={async () => {
                          await logout();
                          setMobileMenuOpen(false);
                          toast.success('已登出');
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        登出
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => {
                        handleGoogleLogin();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      登入
                    </Button>
                  )}

                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero 區塊 - 強制淺色模式 */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden light">
        {/* 影片背景 */}
        <div className="video-background">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/assets/images/hero-poster.jpg"
            className="object-cover"
            onLoadedData={() => {
              // 確保影片載入後立即播放
              const video = videoRef.current;
              if (video && video.paused) {
                video.play().catch(e => console.warn('Video play failed:', e));
              }
            }}
            onError={(e) => {
              console.warn('视频加载失败，使用背景色替代');
              e.currentTarget.style.display = 'none';
            }}
          >
            {/* 使用壓縮後的影片（2.3MB），優先使用 MP4，其次 WebM */}
            <source src="/assets/videos/hero-bg.mp4" type="video/mp4" />
            <source src="/hero-bg.webm" type="video/webm" />
          </video>
          <div className="video-overlay"></div>
        </div>

        {/* Hero 內容 - 強制淺色模式樣式 */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              AI 短影音智能體
              <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                從靈感枯竭到內容量產
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              專為 IG、TikTok、Shorts 打造。AI 生成爆款腳本、精準帳號定位，效率提升 70%
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-base px-8" onClick={() => navigate('/app')}>
                立即開始
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary font-semibold" 
                onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}
              >
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
            
            {/* 課程推廣區塊 */}
            <div className="mt-8 text-center space-y-4">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                  🎓 想要更深入學習？完整線上課程等你來！
                </h3>
                <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                  從零基礎到成為短影音創作高手，我們為你準備了完整的線上課程。
                  <span className="block mt-2 font-semibold text-foreground">
                    學會 AI 工具搭配、內容策略規劃、爆款腳本撰寫，讓你的短影音從想法到爆款，一次到位！
                  </span>
                </p>
                <Button
                  size="lg"
                  className="text-lg h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => window.open('https://www.pressplay.cc/link/s/2114860B', '_blank')}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  立即前往課程頁面
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PWA 安裝教學區塊 */}
      <PWAInstallGuide />

      {/* 定價區塊 - 優化 SEO 和 FOMO */}
      <section id="pricing" className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          {/* SEO 優化的標題和描述 */}
          <div className="text-center mb-12">
            <Badge className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              限時優惠
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ReelMind AI 短影音腳本生成工具 - 選擇最適合的方案
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-2">
              <strong className="text-foreground">每天不到 NT$66</strong>，全年 AI 幫你生成靈感與爆款腳本。
              <span className="block mt-2 text-base">
                專為 TikTok、Instagram Reels、YouTube Shorts 創作者設計的 AI 智能體，提升內容創作效率 70%
              </span>
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              ⚡ 方案不變，月付/年付可切換 | 🔒 付費前可先綁定 BYOK 測試
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 p-1 bg-background rounded-full border border-border shadow-sm">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
                className="rounded-full"
              >
                月付
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
                className="rounded-full"
              >
                🔥 年付優惠
              </Button>
            </div>
          </div>

          {/* Four Column Layout: Free / Lite / Pro / Max */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-[90rem] mx-auto">
            {/* Free */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-6 flex-shrink-0">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Gift className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">免費版</CardTitle>
                <CardDescription className="text-base">
                  適合新手體驗，每日 10 次生成額度
                </CardDescription>
                
                {/* Price */}
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-600 dark:text-gray-400">
                      NT$0
                    </span>
                    <span className="text-muted-foreground">/ 永久</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    完全免費，無需付費
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    { icon: Sparkles, text: '所有核心功能完整開放' },
                    { icon: Calendar, text: '14 天內容規劃日曆（一次規劃 = 1 次）' },
                    { icon: Target, text: 'AI 人設定位與選題建議（每次生成 = 1 次）' },
                    { icon: FileText, text: '短影音腳本一鍵生成（每次生成 = 1 次）' },
                    { icon: MessageSquare, text: 'AI 對話式內容規劃（每次對話 = 1 次）' },
                    { icon: BarChart, text: '每日可用 10 次（約可生成 10 個腳本）' },
                    { icon: BarChart, text: '每月可用 150 次（約可生成 150 個腳本）' },
                    { icon: Key, text: '需綁定自己的 AI 金鑰（不計入平台配額）' },
                    { icon: Shield, text: '平台不提供備用配額' },
                    { icon: Zap, text: '高品質模式：不支援' },
                    { icon: Package, text: '批次生成：不支援' }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-foreground text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <div className="mt-auto pt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-lg h-14 border-gray-600 dark:border-gray-400 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                    onClick={() => {
                      if (!isLoggedIn) {
                        handleGoogleLogin();
                        return;
                      }
                      navigate('/app');
                    }}
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    {isLoggedIn ? '立即使用' : '免費註冊'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lite */}
            <Card className="border-2 border-muted flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-6 flex-shrink-0">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mb-2">
                  <Badge className="mb-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                    入門首選
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">Lite 方案</CardTitle>
                <CardDescription className="text-base">
                  適合已有 AI 金鑰的創作者，每日 20 次生成額度
                </CardDescription>
                
                {/* Price */}
                <div className="mt-6">
                  {billingCycle === 'yearly' ? (
                    <>
                      <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="text-sm text-muted-foreground line-through">
                          NT$360 / 月
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl font-bold text-green-600 dark:text-green-400">
                            NT$300
                          </span>
                          <span className="text-muted-foreground">/ 月</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        年付省 NT$720
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-green-600 dark:text-green-400">
                          NT$300
                        </span>
                        <span className="text-muted-foreground">/ 月</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        年繳 NT$3,600
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    { icon: Sparkles, text: '所有核心功能完整開放' },
                    { icon: Calendar, text: '14 天內容規劃日曆（一次規劃 = 1 次）' },
                    { icon: Target, text: 'AI 人設定位與選題建議（每次生成 = 1 次）' },
                    { icon: FileText, text: '短影音腳本一鍵生成（每次生成 = 1 次）' },
                    { icon: MessageSquare, text: 'AI 對話式內容規劃（每次對話 = 1 次）' },
                    { icon: BarChart, text: '每日可用 20 次（約可生成 20 個腳本）' },
                    { icon: BarChart, text: '每月可用 300 次（約可生成 300 個腳本）' },
                    { icon: Key, text: '可使用自己的 AI 金鑰（省成本，不計入平台配額）' },
                    { icon: Shield, text: '平台提供備用配額（金鑰故障時自動切換，不中斷）' },
                    { icon: Zap, text: '高品質模式：不支援' },
                    { icon: Package, text: '批次生成：不支援' }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-foreground text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <div className="mt-auto pt-4">
                  <Button
                    size="lg"
                    variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                    className={`w-full text-lg h-14 ${
                      billingCycle === 'yearly' 
                        ? 'bg-green-600 dark:bg-green-400 text-white hover:bg-green-700 dark:hover:bg-green-500' 
                        : 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    onClick={() => {
                      if (!isLoggedIn) {
                        handleGoogleLogin();
                        return;
                      }
                      navigate(`/checkout?tier=lite&plan=${billingCycle}&amount=${billingCycle === 'yearly' ? 3600 : 300}`);
                    }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    前往付款
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-2 border-primary shadow-xl flex flex-col h-full relative hover:shadow-2xl transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  ⭐ 最受歡迎
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 flex-shrink-0 pt-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">Pro 方案</CardTitle>
                <CardDescription className="text-base">
                  適合專業創作者，每日 300 次 + 高品質模式 2,000 次/月
                </CardDescription>
                
                {/* Price */}
                <div className="mt-6">
                  {billingCycle === 'yearly' ? (
                    <>
                      <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="text-sm text-muted-foreground line-through">
                          NT$1,000 / 月
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl font-bold text-primary">
                            NT$800
                          </span>
                          <span className="text-muted-foreground">/ 月</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-primary">
                        🔥 年付省 NT$2,400
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-primary">
                          NT$800
                        </span>
                        <span className="text-muted-foreground">/ 月</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        年繳 NT$9,600
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    { icon: Sparkles, text: '所有核心功能完整開放' },
                    { icon: Calendar, text: '14 天內容規劃日曆（一次規劃 = 1 次）' },
                    { icon: Target, text: 'AI 人設定位與選題建議（每次生成 = 1 次）' },
                    { icon: FileText, text: '短影音腳本一鍵生成（每次生成 = 1 次）' },
                    { icon: MessageSquare, text: 'AI 對話式內容規劃（每次對話 = 1 次）' },
                    { icon: BarChart, text: '每日可用 300 次（約可生成 300 個腳本）' },
                    { icon: BarChart, text: '每月可用 10,000 次（約可生成 10,000 個腳本）' },
                    { icon: Key, text: '可使用自己的 AI 金鑰（省成本，不計入平台配額）' },
                    { icon: Shield, text: '平台提供備用配額（金鑰故障時自動切換，不中斷）' },
                    { icon: Star, text: '高品質模式：每月 2,000 次（內容更優質，自動降級不中斷）' },
                    { icon: Package, text: '批次生成：不支援' }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-foreground text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <div className="mt-auto pt-4">
                  <Button
                    size="lg"
                    className="w-full text-lg h-14 font-semibold"
                    onClick={() => {
                      if (!isLoggedIn) {
                        handleGoogleLogin();
                        return;
                      }
                      navigate(`/checkout?tier=pro&plan=${billingCycle}&amount=${billingCycle === 'yearly' ? 9600 : 800}`);
                    }}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isLoggedIn ? '前往付款' : '登入訂閱'}
                  </Button>

                </div>
              </CardContent>
            </Card>

            {/* Max */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 flex flex-col h-full hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-6 flex-shrink-0">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mb-2">
                  <Badge className="mb-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                    高階方案
                  </Badge>
                </div>
                <CardTitle className="text-2xl mb-2">Max 方案</CardTitle>
                <CardDescription className="text-base">
                  適合團隊或大量產出，每日 1,000 次 + 高品質模式 5,000 次/月
                </CardDescription>
                
                {/* Price */}
                <div className="mt-6">
                  {billingCycle === 'yearly' ? (
                    <>
                      <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="text-sm text-muted-foreground line-through">
                          NT$2,500 / 月
                        </div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                            NT$2,000
                          </span>
                          <span className="text-muted-foreground">/ 月</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        年付省 NT$6,000
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                          NT$2,000
                        </span>
                        <span className="text-muted-foreground">/ 月</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        年繳 NT$24,000
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    { icon: Sparkles, text: '所有核心功能完整開放' },
                    { icon: Calendar, text: '14 天內容規劃日曆（一次規劃 = 1 次）' },
                    { icon: Target, text: 'AI 人設定位與選題建議（每次生成 = 1 次）' },
                    { icon: FileText, text: '短影音腳本一鍵生成（每次生成 = 1 次）' },
                    { icon: MessageSquare, text: 'AI 對話式內容規劃（每次對話 = 1 次）' },
                    { icon: BarChart, text: '每日可用 1,000 次（約可生成 1,000 個腳本）' },
                    { icon: BarChart, text: '每月可用 30,000 次（約可生成 30,000 個腳本）' },
                    { icon: Key, text: '可使用自己的 AI 金鑰（省成本，不計入平台配額）' },
                    { icon: Shield, text: '平台提供完整配額（無需綁定金鑰也能用，開箱即用）' },
                    { icon: Star, text: '高品質模式：每月 5,000 次（內容更優質，自動降級不中斷）' },
                    { icon: Package, text: '批次生成：支援（可加購擴充，一次生成多個腳本）' },
                    { icon: TrendingUp, text: 'AI 智能分析：支援（可加購擴充，數據洞察與優化建議）' }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <IconComponent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-foreground text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <div className="mt-auto pt-4">
                  <Button
                    size="lg"
                    variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                    className={`w-full text-lg h-14 ${
                      billingCycle === 'yearly' 
                        ? 'bg-purple-600 dark:bg-purple-400 text-white hover:bg-purple-700 dark:hover:bg-purple-500' 
                        : 'border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                    onClick={() => {
                      if (!isLoggedIn) {
                        handleGoogleLogin();
                        return;
                      }
                      navigate(`/checkout?tier=max&plan=${billingCycle}&amount=${billingCycle === 'yearly' ? 24000 : 2000}`);
                    }}
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    前往付款
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FOMO 和 SEO 優化的額外資訊 */}
          <div className="mt-12 text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Lite / Pro / Max 三方案</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>隨時可取消</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>安全加密付款</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>24/7 客服支援</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              ReelMind 是專為 TikTok、Instagram Reels、YouTube Shorts 創作者設計的 AI 短影音腳本生成工具。
              透過 AI 智能體技術，幫助創作者從靈感枯竭到內容量產，提升內容創作效率 70%。
              立即訂閱，開始你的 AI 短影音創作之旅！
            </p>
          </div>

          {/* 推薦獎勵按鈕 */}
          <div className="flex justify-center mt-8 mb-12">
            <Button
              variant="outline"
              size="lg"
              className="border-primary/50 hover:bg-primary/10 text-primary"
              onClick={() => navigate('/referral-rewards')}
            >
              <Gift className="w-5 h-5 mr-2" />
              🎁 查看推薦邀請獎勵機制
            </Button>
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
              onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}
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

      {/* 頁尾：全站聯繫方式與社群 */}
      <SiteFooterContacts />

      {/* PWA 安裝提示 */}
      <PWAInstallPrompt />
    </div>
  );
}
