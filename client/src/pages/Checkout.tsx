/**
 * Checkout - 填寫付款資料頁面
 * 整合綠界金流付款功能
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ArrowLeft, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    invoiceType: 'personal',
    vat: '',
    note: ''
  });
  
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [amount, setAmount] = useState<number>(3990);
  const [isProcessing, setIsProcessing] = useState(false);

  // 從 URL 參數讀取方案資訊
  useEffect(() => {
    const planParam = searchParams.get('plan');
    const amountParam = searchParams.get('amount');
    
    if (planParam === 'monthly' || planParam === 'yearly') {
      setPlan(planParam);
      setAmount(planParam === 'yearly' ? 3990 : 399);
    } else if (amountParam) {
      const parsedAmount = parseInt(amountParam);
      if (!isNaN(parsedAmount)) {
        setAmount(parsedAmount);
        setPlan(parsedAmount === 3990 ? 'yearly' : 'monthly');
      }
    }
  }, [searchParams]);

  // 方案資訊
  const planInfo = {
    monthly: {
      name: 'Script Lite 月租版',
      price: 399,
      period: '月',
      features: [
        'AI 顧問無限次對話',
        'AI 一鍵生成腳本',
        'IP 人設規劃工具',
        '14 天短影音規劃',
        '創作者資料庫',
        '腳本歷史記錄',
        '多平台腳本優化',
        '優先客服支援'
      ]
    },
    yearly: {
      name: 'Creator Pro 年度方案',
      price: 3990,
      period: '年',
      monthlyPrice: 332,
      features: [
        'AI 顧問無限次對話',
        'AI 一鍵生成腳本',
        'IP 人設規劃工具',
        '14 天短影音規劃',
        '創作者資料庫',
        '腳本歷史記錄',
        '多平台腳本優化',
        '優先客服支援',
        '年度專屬優惠',
        '新功能搶先體驗'
      ]
    }
  };

  const currentPlan = planInfo[plan];

  // 處理表單輸入
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 驗證表單
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('請填寫姓名或公司抬頭');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('請填寫電子信箱');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('請輸入有效的電子信箱');
      return false;
    }
    if (formData.invoiceType === 'company' && !formData.vat.trim()) {
      toast.error('請填寫統一編號');
      return false;
    }
    return true;
  };

  // 處理付款
  const handleCheckout = async () => {
    if (!validateForm()) return;

    const token = getToken();
    if (!token) {
      toast.error('請先登入');
      navigate('/login');
      return;
    }

    setIsProcessing(true);

    try {
      const frontend_return_url = `${window.location.origin}/#/payment-result`;
      const response = await fetch('https://api.aijob.com.tw/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: plan,
          amount: amount,
          frontend_return_url: frontend_return_url,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          invoice_type: formData.invoiceType,
          vat_number: formData.invoiceType === 'company' ? formData.vat : undefined,
          note: formData.note || undefined
        })
      });

      if (response.ok) {
        const html = await response.text();
        
        if (html.includes('ecpayForm') || html.includes('ECPay') || html.includes('payment-stage')) {
          // 替換整個頁面內容為綠界金流表單
          document.body.innerHTML = html;
          
          setTimeout(() => {
            const form = document.getElementById('ecpayForm') as HTMLFormElement;
            if (form) {
              form.submit();
            } else {
              toast.error('無法載入付款頁面');
              setIsProcessing(false);
            }
          }, 100);
        } else {
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
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">一次付款 · 自動續約 · 可隨時取消</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">填寫付款資訊</h1>
            <p className="text-lg text-muted-foreground">完成以下資訊即可開始使用 ReelMind</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* 左：帳務資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>帳務資訊</CardTitle>
              <CardDescription>請填寫您的付款與發票資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 方案摘要 */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold text-lg">{currentPlan.name}</div>
                <div className="text-2xl font-bold text-primary mt-1">
                  NT${amount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {plan === 'yearly' ? '一次購買，一年使用' : '每月自動續約'}
                </div>
              </div>

              {/* 表單欄位 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">姓名（或公司抬頭）*</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="請輸入姓名或公司名稱"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">電子信箱（收據與通知）*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">手機（選填）</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0912-345-678"
                  />
                </div>

                <div>
                  <Label htmlFor="invoiceType">發票類型*</Label>
                  <Select
                    value={formData.invoiceType}
                    onValueChange={(value) => handleInputChange('invoiceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">個人</SelectItem>
                      <SelectItem value="company">公司（統編）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.invoiceType === 'company' && (
                  <div>
                    <Label htmlFor="vat">統一編號*</Label>
                    <Input
                      id="vat"
                      value={formData.vat}
                      onChange={(e) => handleInputChange('vat', e.target.value)}
                      placeholder="請輸入統一編號"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="note">備註（選填）</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder="如有特殊需求，請在此填寫"
                    rows={3}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">付款方式</div>
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  💳 信用卡（支援 LINE Pay、Apple Pay、ATM、超商等）
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
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

              <p className="text-xs text-center text-muted-foreground">
                付款即代表同意服務條款與退費政策
              </p>
            </CardContent>
          </Card>

          {/* 右：訂單摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 訂單明細 */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{currentPlan.name}</span>
                  <span className="font-semibold">NT${amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>手續費</span>
                  <span>NT$0</span>
                </div>
                <div className="pt-3 border-t flex justify-between text-lg font-bold">
                  <span>應付金額</span>
                  <span className="text-primary">NT${amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="font-semibold mb-3">方案內容</div>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>※ 所有方案皆為一次性付款並自動續約，可於下期前隨時取消，不另收續約手續費。</strong>
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                <Shield className="w-4 h-4" />
                <span>由綠界金流（ECPay）提供安全加密付款</span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/#/pricing')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回選擇方案
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
