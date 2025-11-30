/**
 * 主操作介面（智能體主畫面）
 * 這是登入後用戶會看到的核心功能頁面
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { Sparkles, Target, Zap, Database, ArrowRight, CheckCircle2, TrendingUp, MessageSquare, Home, BookOpen, Users, ExternalLink, Settings, ShoppingBag, BarChart3, HelpCircle, User, Key, Download, FileText, LogOut, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AnalyticsOverview {
  today: {
    scripts: number;
    generations: number;
    total: number;
  };
  week: {
    scripts: number;
    generations: number;
    total: number;
  };
  month: {
    scripts: number;
    generations: number;
    total: number;
  };
  total: {
    scripts: number;
    generations: number;
    conversations: number;
  };
}

const AppDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showStatisticsHelpDialog, setShowStatisticsHelpDialog] = useState(false);

  // 登出處理
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 載入統計數據
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoadingAnalytics(true);
        const data = await apiGet<AnalyticsOverview>('/api/user/analytics/overview');
        setAnalyticsOverview(data);
      } catch (error) {
        console.error('載入統計數據失敗:', error);
        // 不顯示錯誤提示，因為這是可選功能
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [user?.user_id]);

  // 準備圖表數據
  const chartData = useMemo(() => {
    if (!analyticsOverview) return [];
    
    return [
      { period: '今日', scripts: analyticsOverview.today.scripts, generations: analyticsOverview.today.generations, total: analyticsOverview.today.total },
      { period: '本週', scripts: analyticsOverview.week.scripts, generations: analyticsOverview.week.generations, total: analyticsOverview.week.total },
      { period: '本月', scripts: analyticsOverview.month.scripts, generations: analyticsOverview.month.generations, total: analyticsOverview.month.total },
    ];
  }, [analyticsOverview]);

  const chartConfig = {
    scripts: {
      label: '腳本',
      color: 'hsl(var(--chart-1))',
    },
    generations: {
      label: '生成',
      color: 'hsl(var(--chart-2))',
    },
    total: {
      label: '總計',
      color: 'hsl(var(--chart-3))',
    },
  };

  const features = [
    {
      id: 'mode1',
      title: 'IP人設規劃',
      description: 'AI 對話式規劃，打造專屬 IP 人設與內容策略',
      icon: MessageSquare,
      link: '/mode1',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      features: ['AI 對話規劃', '智能內容建議', '個性化策略']
    },
    {
      id: 'mode3',
      title: '一鍵生成',
      description: '快速生成短影音腳本，三步驟完成專業內容',
      icon: Zap,
      link: '/mode3',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      features: ['帳號定位', '選題建議', '腳本生成']
    },
    {
      id: 'userdb',
      title: '創作者資料庫',
      description: '管理您的所有創作內容，隨時查看與編輯',
      icon: Database,
      link: '/userdb',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      features: ['腳本管理', '對話記錄', '生成歷史']
    }
  ];

  const settingsItems = [
    {
      id: 'profile',
      title: '個人資料',
      description: '管理個人資訊與帳號',
      icon: User,
      link: '/profile',
      gradient: 'from-teal-500 to-green-500',
      bgGradient: 'from-teal-500/10 to-green-500/10'
    },
    {
      id: 'settings',
      title: '設定',
      description: 'LLM API Key 管理、數據匯出與設定',
      icon: Settings,
      link: '/settings',
      gradient: 'from-slate-500 to-gray-600',
      bgGradient: 'from-slate-500/10 to-gray-600/10'
    },
    {
      id: 'orders',
      title: '我的訂單',
      description: '查看訂單記錄與付款狀態',
      icon: ShoppingBag,
      link: '/orders',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10'
    },
    {
      id: 'statistics',
      title: '使用統計',
      description: '查看使用數據與分析',
      icon: BarChart3,
      link: '/statistics',
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-500/10 to-purple-600/10',
      isStatistics: true // 標記為統計卡片，需要特殊處理
    },
    {
      id: 'help',
      title: '幫助中心',
      description: '常見問題、快速入門與技術支援',
      icon: HelpCircle,
      link: '/help',
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10'
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* 頁首導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* ReelMind Logo 和標題 */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ReelMind</span>
          </div>

          {/* 右側操作區 */}
          <div className="flex items-center gap-2">
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
                onClick={() => navigate('/login')}
              >
                登入
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero 區塊 - 帶影片背景 */}
      <section className="relative min-h-[400px] md:min-h-[500px] flex items-center overflow-hidden border-b">
        {/* 影片背景 */}
        <div className="video-background">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover"
          >
            <source src="/reelmind.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
        </div>

        {/* Hero 內容 */}
        <div className="container relative z-10 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg backdrop-blur-sm bg-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  歡迎回來
                  {user && (
                    <span className="block mt-1 text-xl md:text-2xl text-foreground/90 font-normal">
                      {user.name || user.email}
                    </span>
                  )}
                </h1>
              </div>
            </div>
            <p className="text-lg text-foreground/80">
              開始使用 AI 智能體，讓內容創作變得更簡單高效
            </p>
          </div>
        </div>
      </section>

      {/* 功能卡片區塊 */}
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* 背景漸變 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  {/* 功能列表 */}
                  <ul className="space-y-2">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* 操作按鈕 */}
                  <Link to={feature.link} className="block">
                    <Button 
                      className={`w-full bg-gradient-to-r ${feature.gradient} hover:opacity-90 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      開始使用
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 快速提示區塊 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">智能規劃</h3>
                  <p className="text-xs text-muted-foreground">AI 協助制定策略</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">快速生成</h3>
                  <p className="text-xs text-muted-foreground">三步驟完成內容</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">數據管理</h3>
                  <p className="text-xs text-muted-foreground">集中管理所有內容</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 設定卡片區塊 */}
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">設定與管理</h2>
            <p className="text-muted-foreground">管理您的帳號與查看相關資訊</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isStatistics = (item as any).isStatistics;
              
              // 如果是統計卡片，顯示增強版本
              if (isStatistics) {
                return (
                  <Card
                    key={item.id}
                    className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                    onClick={() => {
                      navigate(item.link);
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <CardContent className="pt-6 pb-6">
                      {/* 標題和圖標 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{item.title}</h3>
                            <p className="text-xs text-muted-foreground">查看詳細分析</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStatisticsHelpDialog(true);
                            }}
                            title="使用說明"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                        </div>
                      </div>

                      {/* 統計數據 */}
                      {loadingAnalytics ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : analyticsOverview ? (
                        <>
                          {/* 關鍵指標 */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center p-2 rounded-lg bg-background/50 border border-indigo-500/20">
                              <p className="text-xs text-muted-foreground mb-1">今日</p>
                              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {analyticsOverview.today.total}
                              </p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-background/50 border border-purple-500/20">
                              <p className="text-xs text-muted-foreground mb-1">本週</p>
                              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {analyticsOverview.week.total}
                              </p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-background/50 border border-pink-500/20">
                              <p className="text-xs text-muted-foreground mb-1">本月</p>
                              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                {analyticsOverview.month.total}
                              </p>
                            </div>
                          </div>

                          {/* 小型趨勢圖表 */}
                          {chartData.length > 0 && (
                            <div className="h-[120px] -mx-2">
                              <ChartContainer config={chartConfig} className="h-full">
                                <AreaChart data={chartData}>
                                  <defs>
                                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                  <XAxis 
                                    dataKey="period" 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    className="text-xs"
                                  />
                                  <YAxis 
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    className="text-xs"
                                    width={30}
                                  />
                                  <ChartTooltip content={<ChartTooltipContent />} />
                                  <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="hsl(var(--chart-3))"
                                    fill="url(#fillTotal)"
                                    strokeWidth={2}
                                  />
                                </AreaChart>
                              </ChartContainer>
                            </div>
                          )}

                          {/* 總計信息 */}
                          <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-muted-foreground">腳本 {analyticsOverview.total.scripts}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span className="text-muted-foreground">生成 {analyticsOverview.total.generations}</span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              總計 {analyticsOverview.total.scripts + analyticsOverview.total.generations + analyticsOverview.total.conversations}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground">暫無數據</p>
                          <p className="text-xs text-muted-foreground mt-1">開始使用功能後會顯示統計</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }
              
              // 其他卡片保持原樣
              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    navigate(item.link);
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 導航連結區塊 */}
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">探索更多資源</h2>
            <p className="text-muted-foreground">了解更多功能與使用技巧</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* 回首頁 */}
            <Card 
              className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg mb-1">回到首頁</h3>
                    <p className="text-sm text-muted-foreground mb-3">查看產品介紹與功能特色</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto group-hover:border-primary group-hover:text-primary"
                    >
                      前往首頁
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 實戰指南 */}
            <Card 
              className="group relative overflow-hidden border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
              onClick={() => navigate('/guide')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg mb-1">實戰指南</h3>
                    <p className="text-sm text-muted-foreground mb-3">學習使用技巧與最佳實踐</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto group-hover:border-purple-500 group-hover:text-purple-500"
                    >
                      查看指南
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 論壇 */}
            <Card 
              className="group relative overflow-hidden border-2 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg cursor-pointer sm:col-span-2 lg:col-span-1"
              onClick={() => navigate('/forum')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg mb-1">論壇</h3>
                    <p className="text-sm text-muted-foreground mb-3">與其他創作者交流分享</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto group-hover:border-emerald-500 group-hover:text-emerald-500"
                    >
                      進入論壇
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 設定 Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">設定與管理</DialogTitle>
            <DialogDescription>
              管理您的 LLM API Key、匯出資料與查看教學
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* LLM API Key 管理 */}
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => {
                setShowSettingsDialog(false);
                navigate('/settings');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">LLM API Key 管理</h3>
                    <p className="text-sm text-muted-foreground">綁定與管理您的 LLM API Key</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* 數據管理 - 匯出 */}
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={async () => {
                if (!user?.user_id) {
                  toast.error('請先登入');
                  return;
                }

                try {
                  // 匯出用戶的所有資料
                  const [scriptsRes, conversationsRes, generationsRes, ipPlanningRes] = await Promise.all([
                    apiGet<any[]>(`/api/scripts/my`).catch(() => []),
                    apiGet<any[]>(`/api/user/conversations/${user.user_id}`).catch(() => []),
                    apiGet<any[]>(`/api/user/generations/${user.user_id}`).catch(() => []),
                    apiGet<{ results: any[] }>(`/api/ip-planning/my`).catch(() => ({ results: [] }))
                  ]);

                  const scripts = Array.isArray(scriptsRes) ? scriptsRes : [];
                  const conversations = Array.isArray(conversationsRes) ? conversationsRes : [];
                  const generations = Array.isArray(generationsRes) ? generationsRes : [];
                  const ipPlanning = ipPlanningRes?.results || [];

                  // 創建 CSV 內容
                  let csvContent = '資料類型,ID,標題/主題,內容,建立時間\n';
                  
                  // 匯出腳本
                  scripts.forEach((script: any) => {
                    const title = (script.title || script.name || '').replace(/"/g, '""');
                    const content = (script.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
                    const date = script.created_at || '';
                    csvContent += `腳本,${script.id},"${title}","${content}",${date}\n`;
                  });

                  // 匯出對話記錄
                  conversations.forEach((conv: any) => {
                    const summary = (conv.summary || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
                    const date = conv.created_at || '';
                    csvContent += `對話記錄,${conv.id},"${conv.mode || ''}","${summary}",${date}\n`;
                  });

                  // 匯出生成記錄
                  generations.forEach((gen: any) => {
                    const topic = (gen.topic || '').replace(/"/g, '""');
                    const content = (gen.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
                    const date = gen.created_at || '';
                    csvContent += `生成記錄,${gen.id || ''},"${topic}","${content}",${date}\n`;
                  });

                  // 匯出 IP 規劃結果
                  ipPlanning.forEach((plan: any) => {
                    const title = (plan.title || '').replace(/"/g, '""');
                    const content = (plan.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
                    const date = plan.created_at || '';
                    csvContent += `IP規劃,${plan.id},"${title}","${content}",${date}\n`;
                  });

                  // 下載 CSV
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `reelmind-data-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  toast.success('資料匯出成功');
                  setShowSettingsDialog(false);
                } catch (error: any) {
                  console.error('匯出失敗:', error);
                  toast.error('匯出失敗，請稍後再試');
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">數據管理</h3>
                    <p className="text-sm text-muted-foreground">匯出您的所有資料（腳本、對話、生成記錄等）</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* 如何取得 LLM API Key */}
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => {
                setShowSettingsDialog(false);
                navigate('/guide/how-to-get-llm-api-key');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">如何取得 LLM API Key</h3>
                    <p className="text-sm text-muted-foreground">查看詳細教學，學習如何取得與設定 API Key</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 使用統計使用說明對話框 */}
      <Dialog open={showStatisticsHelpDialog} onOpenChange={setShowStatisticsHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>使用統計使用說明</DialogTitle>
            <DialogDescription>了解如何使用統計功能，掌握您的創作產出狀況</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">什麼是使用統計？</h4>
              <p className="text-muted-foreground">
                使用統計功能可以幫助您追蹤和分析您的創作產出，包括腳本生成、對話記錄、生成記錄等數據，讓您更好地了解自己的創作習慣和產出效率。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">統計數據包含什麼？</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>今日/本週/本月總計</strong>：快速了解您的創作頻率和產出量</li>
                <li><strong>趨勢圖表</strong>：透過視覺化圖表，清楚看到使用趨勢</li>
                <li><strong>腳本與生成記錄統計</strong>：了解您更偏好使用哪種功能</li>
                <li><strong>AI 智能分析</strong>：系統會使用 AI 分析您的統計數據，提供個人化建議</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">如何使用？</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>點擊「使用統計」卡片進入詳細統計頁面</li>
                <li>查看不同時間段的統計數據（今日、本週、本月）</li>
                <li>透過趨勢圖表了解您的創作習慣變化</li>
                <li>使用 AI 智能分析功能獲取個人化建議</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">注意事項</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>統計數據會自動更新，無需手動刷新</li>
                <li>所有數據僅供您個人查看，不會與第三方分享</li>
                <li>可以隨時查看歷史統計數據，了解長期趨勢</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppDashboard;
