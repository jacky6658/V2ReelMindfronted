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
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Subscription() {
  const navigate = useNavigate();
  const { getToken, isLoggedIn } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

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
          amount: billingCycle === 'yearly' ? (currentPlan as any).actualPrice : currentPlan.price,
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
              三種方案（Lite / Pro / Max），方案不變、月付/年付可切換。
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
              年付
            </Button>
          </div>
        </div>

        {/* Three Column Layout: Lite / Pro / Max */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {/* Lite */}
          <Card className="border-2 border-muted flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Lite 方案</CardTitle>
              <CardDescription className="text-base">
                我已經有金鑰，只想用一個順手的創作工具
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-green-600 dark:text-green-400">
                    NT${getAmount('lite').toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/ {billingCycle === 'yearly' ? '年' : '月'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {billingCycle === 'yearly'
                    ? `平均 NT$${priceTable.lite.monthly.toLocaleString()} / 月`
                    : `年繳 NT$${priceTable.lite.yearly.toLocaleString()}`}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {[
                  '需要綁定自己的 Gemini 金鑰',
                  '日曆排程 / 選題管理',
                  'AI 人設規劃',
                  '單篇生成',
                  '使用次數：依你的金鑰額度為準',
                  '平台保底：0 次 / 月',
                  '批次生成：✖',
                  'AI 智能分析：✖',
                  '平台保底：✖'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-14 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => {
                    const token = getToken();
                    if (!token) {
                      toast.error('請先登入');
                      navigate('/login');
                      return;
                    }
                    window.location.href = `/#/checkout?tier=lite&plan=${billingCycle}&amount=${getAmount('lite')}`;
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  前往付款
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-2 border-primary shadow-lg flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Pro 方案</CardTitle>
              <CardDescription className="text-base">
                我想穩定產出，不想被額度卡住
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">
                    NT${getAmount('pro').toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/ {billingCycle === 'yearly' ? '年' : '月'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {billingCycle === 'yearly'
                    ? `平均 NT$${priceTable.pro.monthly.toLocaleString()} / 月`
                    : `年繳 NT$${priceTable.pro.yearly.toLocaleString()}`}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {[
                  '建議綁定自己的 Gemini 金鑰',
                  '平台保底（單篇生成）：每月 10 次',
                  '日曆排程 / 選題管理',
                  'AI 人設規劃',
                  '單篇生成',
                  '使用次數：自帶金鑰依你的額度；平台保底依每月 10 次',
                  '批次生成：✖',
                  'AI 智能分析：✖'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto pt-4">
                <Button
                  size="lg"
                  className="w-full text-lg h-14"
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
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      處理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      前往付款
                    </>
                  )}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                  <Shield className="w-4 h-4" />
                  <span>由綠界金流（ECPay）提供安全加密付款</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Max */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">Max 方案</CardTitle>
              <CardDescription className="text-base">
                你幫我包好，我只管用
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                    NT${getAmount('max').toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/ {billingCycle === 'yearly' ? '年' : '月'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {billingCycle === 'yearly'
                    ? `平均 NT$${priceTable.max.monthly.toLocaleString()} / 月`
                    : `年繳 NT$${priceTable.max.yearly.toLocaleString()}`}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {[
                  '不需要綁定金鑰（平台已提供）',
                  '日曆排程 / 選題管理',
                  'AI 人設規劃',
                  '單篇生成',
                  '使用次數：每日 1,000 次 / 每月 30,000 次',
                  '高品質模式：每月 5,000 次（超過自動降級，服務不中斷）',
                  '批次生成：有上限（可加購）',
                  'AI 智能分析：有上限（可加購）'
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-14 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  onClick={() => {
                    const token = getToken();
                    if (!token) {
                      toast.error('請先登入');
                      navigate('/login');
                      return;
                    }
                    window.location.href = `/#/checkout?tier=max&plan=${billingCycle}&amount=${getAmount('max')}`;
                  }}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  前往付款
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
                  A：可以。您可以隨時在帳戶設定中取消訂閱，取消後將在當前計費週期結束時停止續訂。
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
