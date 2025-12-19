/**
 * Subscription - 訂閱方案頁面
 * 整合綠界金流付款功能
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Sparkles, 
  Zap,
  Shield,
  CreditCard,
  Mail,
  ArrowLeft,
  Calendar,
  Target,
  FileText,
  MessageSquare,
  BarChart,
  Key,
  Package,
  Star,
  TrendingUp,
  Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface PlanStatusResponse {
  plan: 'free' | 'lite' | 'pro' | 'vip' | 'max';
  billing_cycle: 'none' | 'monthly' | 'yearly' | string;
}

export default function Subscription() {
  const navigate = useNavigate();
  const { getToken, isLoggedIn, user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'lite' | 'pro' | 'vip' | 'max' | null>(null);

  // 獲取用戶當前方案
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!isLoggedIn || !user?.user_id) {
        setCurrentPlan(null);
        return;
      }

      try {
        const planData = await apiGet<PlanStatusResponse>('/api/user/plan-status');
        if (planData?.plan) {
          // VIP 方案對應 Pro 方案顯示
          const displayPlan = planData.plan === 'vip' ? 'pro' : planData.plan;
          setCurrentPlan(displayPlan);
        }
      } catch (error) {
        console.error('獲取方案狀態失敗:', error);
        // 如果獲取失敗，嘗試從 authStore 獲取
        const { subscription } = useAuthStore.getState();
        if (subscription) {
          // VIP 方案對應 Pro 方案顯示
          const displayPlan = subscription === 'vip' ? 'pro' : subscription;
          setCurrentPlan(displayPlan);
        }
      }
    };

    fetchCurrentPlan();
  }, [isLoggedIn, user]);

  // 處理「立即體驗」按鈕點擊
  const handleFreeExperience = () => {
    if (isLoggedIn) {
      // 已登入：跳轉到 Mode3（一鍵生成）
      navigate('/mode3');
    } else {
      // 未登入：跳轉到登入頁
      navigate('/login');
      toast.info('請先登入以使用一鍵生成功能');
    }
  };

  const priceTable = useMemo(() => ({
    lite: { monthly: 300, yearly: 3600 },
    pro: { monthly: 800, yearly: 9600 },
    max: { monthly: 2000, yearly: 24000 }
  }), []);

  const getAmount = (tier: 'lite' | 'pro' | 'max') =>
    billingCycle === 'yearly' ? priceTable[tier].yearly : priceTable[tier].monthly;

  // 處理付款
  const handleCheckout = async () => {
    const token = getToken();
    
    if (!token) {
      toast.error('請先登入');
      return;
    }

    setIsProcessing(true);

    try {
      // 調用後端 API 創建訂單
      // 傳遞 frontend_return_url 以便後端在付款完成後重定向到新版前端的付款結果頁面
      const frontend_return_url = `${window.location.origin}/payment-result`;
      const response = await fetch('https://api.aijob.com.tw/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: billingCycle,
          amount: 0, // 這個函數似乎沒有被使用，保留原樣避免錯誤
          frontend_return_url: frontend_return_url  // 新增：告知後端付款完成後的重定向目標
        })
      });

      if (response.ok) {
        const html = await response.text();
        
        // 檢查返回的 HTML 是否包含 ECPay 表單
        if (html.includes('ecpayForm') || html.includes('ECPay') || html.includes('payment-stage')) {
          // 替換整個頁面內容為綠界金流表單
          document.body.innerHTML = html;
          
          // 自動提交表單
          setTimeout(() => {
            const form = document.getElementById('ecpayForm') as HTMLFormElement;
            if (form) {
              console.log('找到 ECPay 表單，準備提交...');
              form.submit();
            } else {
              console.error('找不到 ECPay 表單');
              toast.error('無法載入付款頁面');
              setIsProcessing(false);
            }
          }, 100);
        } else {
          console.error('後端返回的內容不是 ECPay 表單');
          toast.error('無法載入付款頁面，請稍後再試');
          setIsProcessing(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: '建立訂單失敗' }));
        toast.error(errorData.error || '建立訂單失敗，請稍後再試');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('付款錯誤:', error);
      toast.error('付款處理失敗，請檢查網路連線');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首頁
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              訂閱方案
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              選擇最適合你的方案
              <span className="text-primary">.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              四種方案（免費版 / Lite / Pro / Max），方案不變、月付/年付可切換。
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container py-16">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-full">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-[90rem] mx-auto mb-16">
          {/* Free */}
          <Card className={`border-2 flex flex-col h-full relative ${currentPlan === 'free' ? 'border-primary shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}>
            {currentPlan === 'free' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  當前方案
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-6 flex-shrink-0 pt-8">
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
                      <span className="text-foreground">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="mt-auto pt-4">
                <Button
                  size="lg"
                  variant={currentPlan === 'free' ? 'default' : 'outline'}
                  className={`w-full text-lg h-14 ${currentPlan === 'free' ? '' : 'border-gray-600 dark:border-gray-400 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20'}`}
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate('/login');
                      toast.info('請先登入以使用功能');
                      return;
                    }
                    navigate('/app');
                  }}
                  disabled={currentPlan === 'free'}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  {currentPlan === 'free' ? '當前方案' : (isLoggedIn ? '立即使用' : '免費註冊')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lite */}
          <Card className={`border-2 flex flex-col h-full relative ${currentPlan === 'lite' ? 'border-primary shadow-lg' : 'border-muted'}`}>
            {currentPlan === 'lite' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  當前方案
                </Badge>
              </div>
            )}
              <CardHeader className="text-center pb-6 flex-shrink-0 pt-8">
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
                      <span className="text-foreground">{feature.text}</span>
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
                    const token = getToken();
                    if (!token) {
                      toast.error('請先登入');
                      navigate('/login');
                      return;
                    }
                    window.location.href = `/#/checkout?tier=lite&plan=${billingCycle}&amount=${getAmount('lite')}`;
                  }}
                  disabled={currentPlan === 'lite'}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {currentPlan === 'lite' ? '當前方案' : '前往付款'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className={`border-2 flex flex-col h-full relative ${currentPlan === 'pro' ? 'border-primary shadow-lg' : 'border-primary shadow-lg'}`}>
            {currentPlan === 'pro' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  當前方案
                </Badge>
              </div>
            )}
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
                      <span className="text-foreground">{feature.text}</span>
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
                      ? '' 
                      : 'border-primary text-primary hover:bg-primary/10'
                  }`}
                  onClick={() => {
                    const token = getToken();
                    if (!token) {
                      toast.error('請先登入');
                      navigate('/login');
                      return;
                    }
                    // 導向到 Checkout 頁面，並帶上方案資訊
                    window.location.href = `/#/checkout?tier=pro&plan=${billingCycle}&amount=${getAmount('pro')}`;
                  }}
                  disabled={isProcessing || currentPlan === 'pro'}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      處理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      {currentPlan === 'pro' ? '當前方案' : '前往付款'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Max */}
          <Card className={`border-2 flex flex-col h-full relative ${currentPlan === 'max' ? 'border-primary shadow-lg' : 'border-purple-200 dark:border-purple-800'}`}>
            {currentPlan === 'max' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  當前方案
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-6 flex-shrink-0 pt-8">
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
                      <span className="text-foreground">{feature.text}</span>
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
                    const token = getToken();
                    if (!token) {
                      toast.error('請先登入');
                      navigate('/login');
                      return;
                    }
                    window.location.href = `/#/checkout?tier=max&plan=${billingCycle}&amount=${getAmount('max')}`;
                  }}
                  disabled={currentPlan === 'max'}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  {currentPlan === 'max' ? '當前方案' : '前往付款'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">常見問題</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Q：付款是否安全？</h3>
                <p className="text-muted-foreground">
                  A：所有付款皆透過綠界金流（ECPay）或官方合作支付管道，採用 SSL 加密連線，確保交易安全。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Q：可以隨時取消訂閱嗎？</h3>
                <p className="text-muted-foreground">
                  A：可以。您可以隨時在帳戶設定中取消訂閱。年付方案取消後將在當前計費週期結束時停止續訂；月付方案到期後不會自動續費，無需取消。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Q：年繳方案可以退款嗎？</h3>
                <p className="text-muted-foreground">
                  A：訂閱後 7 天內如未使用任何功能，可申請全額退款。超過 7 天或已使用功能則不提供退款。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Q：Lite / Pro / Max 差在哪？</h3>
                <p className="text-muted-foreground">
                  A：差別在「是否需要 BYOK」、「是否有平台保底（Fallback）」與「是否為 Platform Mode」。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
