/**
 * Subscription - 訂閱方案頁面
 * 整合綠界金流付款功能
 */

import { useState } from 'react';
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

  // 方案資訊
  const plans = {
    monthly: {
      price: 399,
      period: '月',
      save: 0,
      features: [
        '包含免費方案所有功能',
        'IP 人設規劃工具（AI 深度對話建立個人品牌）',
        '14 天短影音內容規劃',
        '今日腳本快速生成',
        '創作者資料庫完整功能',
        '腳本歷史記錄與管理',
        '多平台腳本優化建議',
        '優先客服支援'
      ]
    },
    yearly: {
      price: 4788, // 原價 399 * 12
      monthlyPrice: 332, // 優惠後的平均月費 (3990 / 12)
      period: '月', // 顯示為每月價格
      save: 4788 - 3990,
      savePercent: Math.round(((4788 - 3990) / 4788) * 100),
      actualPrice: 3990, // 實際付款金額
      features: [
        '包含免費方案所有功能',
        'IP 人設規劃工具（AI 深度對話建立個人品牌）',
        '14 天短影音內容規劃',
        '今日腳本快速生成',
        '創作者資料庫完整功能',
        '腳本歷史記錄與管理',
        '多平台腳本優化建議',
        '優先客服支援',
        '年度專屬優惠',
        '新功能搶先體驗'
      ]
    }
  };

  const currentPlan = plans[billingCycle];

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
              單一訂閱制，解鎖所有功能。包含 7 天免費試用期（註冊後）。
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
              月
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="rounded-full"
            >
              年
              {billingCycle === 'yearly' && (
                <Badge variant="secondary" className="ml-2">
                  省 {(currentPlan as any).savePercent}%
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Three Column Layout: Free Plan (Left) + Full Feature Plan (Center) + Custom Project (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {/* 左邊：免費方案卡片 */}
          <Card className="border-2 border-muted flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">免費方案</CardTitle>
              <CardDescription className="text-base">
                體驗 AI 短影音生成功能
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-green-600 dark:text-green-400">
                    NT$0
                  </span>
                  <span className="text-muted-foreground">/ 永久</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {[
                  '免費體驗一鍵生成功能',
                  '支援自訂 AI 模型，使用自己的 API Key 完全掌控生成品質',
                  '無限次生成腳本，不受系統配額限制',
                  '帳號定位分析',
                  '選題推薦',
                  '短影音腳本生成'
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
                  onClick={handleFreeExperience}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  立即體驗
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右邊：ReelMind 全功能方案卡片 */}
          <Card className="border-2 border-primary shadow-lg flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">ReelMind 全功能方案</CardTitle>
              <CardDescription className="text-base">
                解鎖所有 AI 短影音創作工具
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-muted-foreground line-through mb-2">
                    原價 NT${currentPlan.price.toLocaleString()} / 年
                  </div>
                )}
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">
                    NT${(billingCycle === 'yearly' ? (currentPlan as any).monthlyPrice : currentPlan.price).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/ {currentPlan.period}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <Badge variant="secondary" className="text-sm">
                      年繳 NT${(currentPlan as any).actualPrice.toLocaleString()}
                    </Badge>
                    <span className="text-xs text-green-600 font-medium">
                      省下 NT${(currentPlan as any).save} ({Math.round((currentPlan as any).savePercent)}%)
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {currentPlan.features.map((feature, index) => (
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
                      return;
                    }
                    // 導向到 Checkout 頁面，並帶上方案資訊
                    window.location.href = `/#/checkout?plan=${billingCycle}&amount=${billingCycle === 'yearly' ? (currentPlan as any).actualPrice : currentPlan.price}`;
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

          {/* 右邊：客製化專案卡片 */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 flex flex-col h-full">
            <CardHeader className="text-center pb-6 flex-shrink-0">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl mb-2">客製化專案</CardTitle>
              <CardDescription className="text-base">
                企業級客製化服務
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                    客製化
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  依需求報價
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Features */}
              <div className="space-y-3 flex-1">
                {[
                  '專屬 AI 模型訓練',
                  '客製化功能開發',
                  '企業級技術支援',
                  '專案管理服務',
                  'API 整合服務',
                  '優先技術諮詢'
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
                  onClick={() => navigate('/contact')}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  聯繫我們
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
                <h3 className="font-bold mb-2">Q：有免費試用嗎？</h3>
                <p className="text-muted-foreground">
                  A：目前沒有免費試用，但我們提供「立即體驗」功能，讓您在訂閱前先體驗 AI 生成腳本的效果。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
