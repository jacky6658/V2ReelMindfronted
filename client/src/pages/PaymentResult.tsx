/**
 * PaymentResult - 付款結果頁面
 * 處理綠界金流回調
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentResult() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 從 URL 參數獲取付款結果
    const params = new URLSearchParams(window.location.search);
    const rtnCode = params.get('RtnCode');
    const rtnMsg = params.get('RtnMsg');
    const merchantTradeNo = params.get('MerchantTradeNo');
    const tradeNo = params.get('TradeNo');
    const tradeAmt = params.get('TradeAmt');
    const paymentType = params.get('PaymentType');
    const paymentDate = params.get('PaymentDate');

    // ECPay 的 RtnCode: 1=成功, 其他=失敗
    if (rtnCode === '1') {
      setStatus('success');
      setMessage('付款成功！您的訂閱已啟用。');
      
      // 記錄成功資訊
      console.log('付款成功:', {
        merchantTradeNo,
        tradeNo,
        tradeAmt,
        paymentType,
        paymentDate
      });
    } else {
      setStatus('failed');
      setMessage(rtnMsg || '付款失敗，請稍後再試。');
      
      // 記錄失敗資訊
      console.error('付款失敗:', {
        rtnCode,
        rtnMsg,
        merchantTradeNo
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">處理中...</h2>
              <p className="text-muted-foreground">
                正在確認您的付款狀態，請稍候
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-green-600">付款成功！</h2>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => navigate('/mode1')}
                >
                  開始使用 ReelMind
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/userdb')}
                >
                  查看我的資料
                </Button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-red-600">付款失敗</h2>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  重新訂閱
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  返回首頁
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                如有問題，請聯繫客服：
                <a 
                  href="mailto:aiagent168168@gmail.com"
                  className="text-primary hover:underline ml-1"
                >
                  aiagent168168@gmail.com
                </a>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
