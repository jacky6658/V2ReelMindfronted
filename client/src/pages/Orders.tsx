/**
 * 我的訂單頁面
 * 顯示用戶的所有訂單記錄
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, Loader2, Calendar, CreditCard, FileText, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Order {
  id: number;
  order_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  expires_at: string | null;
  invoice_number: string | null;
  invoice_type: string | null;
  vat_number: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  note: string | null;
  created_at: string | null;
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入訂單記錄
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.user_id) {
        toast.error('請先登入');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const data = await apiGet<{ orders: Order[] }>(`/api/user/orders/${user.user_id}`);
        setOrders(data.orders || []);
      } catch (error: any) {
        console.error('載入訂單失敗:', error);
        toast.error(error?.response?.data?.error || '載入訂單失敗');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, navigate]);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei'
      });
    } catch {
      return dateString;
    }
  };

  // 格式化金額
  const formatAmount = (amount: number, currency: string = 'TWD') => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency || 'TWD'
    }).format(amount);
  };

  // 獲取付款狀態標籤
  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'paid': { label: '已付款', variant: 'default' },
      'pending': { label: '待付款', variant: 'secondary' },
      'failed': { label: '付款失敗', variant: 'destructive' },
      'cancelled': { label: '已取消', variant: 'outline' },
      'refunded': { label: '已退款', variant: 'outline' }
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || { label: status || '未知', variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // 獲取方案類型標籤
  const getPlanTypeLabel = (planType: string) => {
    const planMap: Record<string, string> = {
      'lifetime': '永久方案',
      'yearly': '年付方案',
      'monthly': '月付方案',
      'trial': '試用方案'
    };
    return planMap[planType?.toLowerCase()] || planType || '未知方案';
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
              我的訂單
            </span>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            我的訂單
          </h2>
          <p className="text-muted-foreground">查看您的所有訂單記錄與付款狀態</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">載入訂單中...</p>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">尚無訂單記錄</h3>
                <p className="text-muted-foreground mb-6">您還沒有任何訂單記錄</p>
                <Button onClick={() => navigate('/pricing')}>
                  前往訂閱
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 桌面版：表格布局 */}
            <div className="hidden md:block">
              <Card>
                <CardHeader>
                  <CardTitle>訂單列表</CardTitle>
                  <CardDescription>共 {orders.length} 筆訂單</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>訂單編號</TableHead>
                          <TableHead>方案類型</TableHead>
                          <TableHead>金額</TableHead>
                          <TableHead>付款方式</TableHead>
                          <TableHead>付款狀態</TableHead>
                          <TableHead>付款時間</TableHead>
                          <TableHead>到期時間</TableHead>
                          <TableHead>建立時間</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.order_id || `#${order.id}`}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{getPlanTypeLabel(order.plan_type)}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(order.amount, order.currency)}
                            </TableCell>
                            <TableCell>{order.payment_method || 'N/A'}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {order.paid_at ? formatDate(order.paid_at) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {order.expires_at ? formatDate(order.expires_at) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* 移動版：卡片布局 */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">
                          訂單 #{order.order_id || order.id}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(order.created_at)}
                        </CardDescription>
                      </div>
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">方案類型</span>
                      <Badge variant="outline">{getPlanTypeLabel(order.plan_type)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">金額</span>
                      <span className="font-semibold">{formatAmount(order.amount, order.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">付款方式</span>
                      <span className="text-sm">{order.payment_method || 'N/A'}</span>
                    </div>
                    {order.paid_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">付款時間</span>
                        <span className="text-sm">{formatDate(order.paid_at)}</span>
                      </div>
                    )}
                    {order.expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">到期時間</span>
                        <span className="text-sm">{formatDate(order.expires_at)}</span>
                      </div>
                    )}
                    {order.invoice_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">發票號碼</span>
                        <span className="text-sm font-mono">{order.invoice_number}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

