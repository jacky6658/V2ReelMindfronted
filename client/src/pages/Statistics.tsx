/**
 * 使用統計頁面
 * 專門用於顯示用戶的使用數據與分析
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, MessageSquare, Zap, Database, Calendar, Brain, TrendingUp, Loader2 } from 'lucide-react';

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              ReelMind
            </h1>
            <span className="text-sm text-muted-foreground hidden md:inline">
              使用統計
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">使用統計</h1>
              <p className="text-muted-foreground">查看您的內容產出與使用情況</p>
            </div>
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

