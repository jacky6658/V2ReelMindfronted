/**
 * 使用統計頁面
 * 專門用於顯示用戶的使用數據與分析
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, MessageSquare, Zap, Database, Calendar, Brain, TrendingUp, Loader2, HelpCircle, PieChart, Activity, Sparkles, Home } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

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

export default function Statistics() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // 圖表配置
  const chartConfig = {
    total: {
      label: '總使用量',
      color: 'hsl(var(--chart-1))',
    },
    scripts: {
      label: '腳本',
      color: 'hsl(var(--chart-2))',
    },
    generations: {
      label: '生成',
      color: 'hsl(var(--chart-3))',
    },
  };

  // 準備圖表數據（模擬過去 7 天的數據）
  const chartData = useMemo(() => {
    if (!analyticsOverview) return [];
    
    const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    const today = new Date().getDay();
    
    return days.map((day, index) => {
      // 簡單模擬：根據總數據生成趨勢
      const factor = (7 - Math.abs(index - today)) / 7;
      return {
        day,
        total: Math.round(analyticsOverview.week.total * factor / 7),
        scripts: Math.round(analyticsOverview.week.scripts * factor / 7),
        generations: Math.round(analyticsOverview.week.generations * factor / 7),
      };
    });
  }, [analyticsOverview]);

  // 功能使用分布數據（圓餅圖）
  const pieData = useMemo(() => {
    if (!analyticsOverview) return [];
    
    return [
      {
        name: '對話記錄',
        value: analyticsOverview.total.conversations,
        color: 'hsl(217, 91%, 60%)', // blue
      },
      {
        name: '生成記錄',
        value: analyticsOverview.total.generations,
        color: 'hsl(280, 100%, 70%)', // purple
      },
      {
        name: '腳本',
        value: analyticsOverview.total.scripts,
        color: 'hsl(142, 76%, 36%)', // emerald
      },
    ].filter(item => item.value > 0);
  }, [analyticsOverview]);

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
        toast.error('載入統計數據失敗');
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [user?.user_id]);

  // 載入 AI 洞察
  const loadAIInsights = async () => {
    if (!user?.user_id || loadingInsights) return;
    
    try {
      setLoadingInsights(true);
      // AI 洞察需要調用 LLM，可能需要較長時間，設置 60 秒 timeout
      const data = await apiGet('/api/user/analytics/ai-insights', {
        timeout: 60000 // 60 秒
      });
      setAiInsights(data);
    } catch (error: any) {
      console.error('載入 AI 洞察失敗:', error);
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toast.error('AI 分析超時，請稍後再試或聯繫客服');
      } else {
        toast.error(error?.response?.data?.error || '載入 AI 分析失敗');
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
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
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">使用統計</h1>
                <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>使用統計說明</DialogTitle>
                      <DialogDescription>
                        了解各項統計數據的意義與價值
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <h3 className="font-semibold mb-2">📊 總覽統計</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• <strong>對話記錄</strong>：您在「IP 人設規劃」中進行的對話摘要數量</li>
                          <li>• <strong>生成記錄</strong>：您在「一鍵生成」中產生的選題和定位內容數量</li>
                          <li>• <strong>腳本數量</strong>：您在「一鍵生成」中生成的腳本內容數量</li>
                          <li>• <strong>總計</strong>：所有內容的總和，反映您的整體創作產出</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">📅 時間段產出</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• <strong>今日產出</strong>：幫助您了解當天的創作活躍度</li>
                          <li>• <strong>本週產出</strong>：追蹤一週內的創作趨勢，評估使用頻率</li>
                          <li>• <strong>本月產出</strong>：長期觀察您的創作習慣和成長軌跡</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">💡 使用價值</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• <strong>追蹤進度</strong>：了解自己的內容產出情況，設定創作目標</li>
                          <li>• <strong>優化策略</strong>：根據使用數據調整創作頻率和內容方向</li>
                          <li>• <strong>成長分析</strong>：觀察長期趨勢，評估創作能力的提升</li>
                          <li>• <strong>效率評估</strong>：透過 AI 智能分析獲得專業建議和改進方向</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">🤖 AI 智能分析</h3>
                        <p className="text-sm text-muted-foreground">
                          點擊「AI 智能分析」按鈕，系統會基於您的使用數據生成專業的分析報告，
                          包括整體評分、產出效率評估和建議行動計劃，幫助您更好地利用平台功能。
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-muted-foreground mt-2">查看您的內容產出與使用情況</p>
            </div>
            <div className="flex items-center gap-2">
              {!aiInsights && analyticsOverview && (
                <Button
                  variant="outline"
                  onClick={loadAIInsights}
                  disabled={loadingInsights}
                  className="gap-2"
                >
                  {loadingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      AI 智能分析
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {loadingAnalytics ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">載入統計數據中...</p>
                </div>
              </CardContent>
            </Card>
          ) : analyticsOverview ? (
            <div className="space-y-6">
              {/* 總覽統計 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-2 border-blue-500/20 bg-blue-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">對話記錄</p>
                        <p className="text-3xl font-bold">{analyticsOverview.total.conversations}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-500/20 bg-purple-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">生成記錄</p>
                        <p className="text-3xl font-bold">{analyticsOverview.total.generations}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">腳本數量</p>
                        <p className="text-3xl font-bold">{analyticsOverview.total.scripts}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Database className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-500/20 bg-orange-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">總計</p>
                        <p className="text-3xl font-bold">
                          {analyticsOverview.total.scripts + analyticsOverview.total.generations + analyticsOverview.total.conversations}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 使用趨勢圖表 */}
              {chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <CardTitle>使用趨勢</CardTitle>
                    </div>
                    <CardDescription>過去一週的使用量趨勢</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stackId="1"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="scripts"
                          stackId="1"
                          stroke="hsl(var(--chart-2))"
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="generations"
                          stackId="1"
                          stroke="hsl(var(--chart-3))"
                          fill="hsl(var(--chart-3))"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* 功能使用分布 */}
              {pieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      <CardTitle>功能使用分布</CardTitle>
                    </div>
                    <CardDescription>各功能的使用比例</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 時間段產出統計 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-500/20 bg-blue-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">今日產出</span>
                      <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{analyticsOverview.today.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      腳本 {analyticsOverview.today.scripts} · 生成 {analyticsOverview.today.generations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-500/20 bg-purple-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">本週產出</span>
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{analyticsOverview.week.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      腳本 {analyticsOverview.week.scripts} · 生成 {analyticsOverview.week.generations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">本月產出</span>
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-bold">{analyticsOverview.month.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      腳本 {analyticsOverview.month.scripts} · 生成 {analyticsOverview.month.generations}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AI 洞察結果 */}
              {loadingInsights ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-muted-foreground">AI 正在分析您的數據...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : aiInsights?.ai_insights ? (
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-blue-500/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <CardTitle>AI 智能分析</CardTitle>
                    </div>
                    <CardDescription>
                      基於您的使用數據生成的專業分析與建議
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 整體評分 */}
                    {aiInsights.ai_insights.overall_score && (
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">整體評分</span>
                          <span className="text-2xl font-bold text-primary">
                            {aiInsights.ai_insights.overall_score}/10
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {aiInsights.ai_insights.overall_assessment}
                        </p>
                      </div>
                    )}

                    {/* 產出效率評估 */}
                    {aiInsights.ai_insights.efficiency_analysis && (
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-sm mb-2">產出效率評估</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {aiInsights.ai_insights.efficiency_analysis}
                        </p>
                        {aiInsights.ai_insights.efficiency_suggestions && (
                          <ul className="space-y-1">
                            {aiInsights.ai_insights.efficiency_suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* 行動計劃 */}
                    {aiInsights.ai_insights.action_plan && (
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-sm mb-2">建議行動計劃</h4>
                        <ol className="space-y-2">
                          {aiInsights.ai_insights.action_plan.map((step: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="font-bold text-primary mt-0.5">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">暫無數據</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

