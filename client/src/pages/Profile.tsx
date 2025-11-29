/**
 * 個人資料頁面
 * 包含：用戶資訊、創作者帳號資訊、使用者偏好、帳務資訊摘要、最近使用紀錄
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet, apiPost } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, CreditCard, Clock, Activity, User, Settings, ExternalLink, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserProfile {
  user_id: string;
  preferred_platform?: string;
  preferred_style?: string;
  preferred_duration?: string;
  content_preferences?: any;
  // 創作者帳號資訊
  creator_platform?: string;
  creator_username?: string;
  creator_profile_url?: string;
  creator_follower_count?: number;
  creator_content_type?: string;
  ai_persona_positioning?: string;
  // 使用者偏好
  preferred_tone?: string;
  preferred_language?: string;
  preferred_video_length?: string;
  preferred_topic_categories?: string[];
}

interface BillingSummary {
  order?: {
    plan_name: string;
    purchase_date: string | null;
    next_billing_date: string | null;
    payment_method: string | null;
    payment_last4: string | null;
    payment_status: string;
    amount: number;
    currency: string;
  };
  license?: {
    tier: string;
    start_date: string | null;
    expires_at: string | null;
    status: string;
  };
}

interface RecentActivity {
  id: string | number;
  type: string;
  description: string;
  timestamp: string | null;
  category: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscription, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // 載入個人資料
  const loadProfile = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const data = await apiGet<UserProfile>(`/api/profile/${user.user_id}`);
      if (data && !data.message) {
        setProfile(data);
      } else {
        // 如果沒有資料，初始化一個空的 profile
        setProfile({
          user_id: user.user_id,
          preferred_topic_categories: []
        });
      }
    } catch (error) {
      console.error('載入個人資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入帳務資訊摘要
  const loadBillingSummary = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoadingBilling(true);
      const data = await apiGet<BillingSummary>('/api/user/billing-summary');
      setBillingSummary(data);
    } catch (error) {
      console.error('載入帳務資訊失敗:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  // 載入最近使用紀錄
  const loadRecentActivity = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoadingActivity(true);
      const data = await apiGet<{ activities: RecentActivity[] }>('/api/user/recent-activity?limit=10');
      setRecentActivity(data.activities || []);
    } catch (error) {
      console.error('載入使用紀錄失敗:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadProfile();
      loadBillingSummary();
      loadRecentActivity();
    }
  }, [user?.user_id]);

  // 儲存個人資料
  const handleSave = async () => {
    if (!user?.user_id || !profile) return;
    
    try {
      setSaving(true);
      await apiPost('/api/profile', profile);
      toast.success('個人資料已儲存');
      loadProfile();
    } catch (error: any) {
      console.error('儲存失敗:', error);
      toast.error(error?.response?.data?.error || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

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
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // 獲取活動圖標
  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'conversation':
        return '💬';
      case 'generation':
        return '⚡';
      case 'script':
        return '📝';
      case 'login':
        return '🔐';
      default:
        return '📌';
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
              個人資料
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">個人資料</h1>

          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="basic">基本資訊</TabsTrigger>
                <TabsTrigger value="creator">創作者資訊</TabsTrigger>
                <TabsTrigger value="preferences">偏好設定</TabsTrigger>
                <TabsTrigger value="billing">帳務資訊</TabsTrigger>
                <TabsTrigger value="activity">使用紀錄</TabsTrigger>
              </TabsList>

              {/* 基本資訊 */}
              <TabsContent value="basic" className="space-y-6">
                {user && (
                  <Card>
                    <CardHeader>
                      <CardTitle>用戶資訊</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user.picture && (
                        <div className="flex items-center gap-4">
                          <img 
                            src={user.picture} 
                            alt={user.name} 
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Email:</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">姓名:</p>
                          <p className="font-medium">{user.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">訂閱等級:</p>
                          <Badge variant={subscription === 'pro' ? 'default' : 'secondary'}>
                            {subscription === 'pro' ? 'Pro' : subscription === 'free' ? 'Free' : 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">訂閱狀態:</p>
                          <Badge variant={user.is_subscribed ? 'default' : 'outline'}>
                            {user.is_subscribed ? '已訂閱' : '未訂閱'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={logout}
                        variant="destructive"
                        className="mt-4"
                      >
                        登出
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 創作者帳號資訊 */}
              <TabsContent value="creator" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>創作者帳號資訊</CardTitle>
                    <CardDescription>填寫您的創作平台資訊，幫助 AI 更好地為您生成內容</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="creator_platform">創作平台</Label>
                        <Select
                          value={profile?.creator_platform || ''}
                          onValueChange={(value) => setProfile({ ...profile!, creator_platform: value })}
                        >
                          <SelectTrigger id="creator_platform">
                            <SelectValue placeholder="選擇平台" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube_short">YouTube Short</SelectItem>
                            <SelectItem value="facebook_reels">Facebook Reels</SelectItem>
                            <SelectItem value="other">其他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="creator_username">平台帳號名稱</Label>
                        <Input
                          id="creator_username"
                          placeholder="@username"
                          value={profile?.creator_username || ''}
                          onChange={(e) => setProfile({ ...profile!, creator_username: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="creator_profile_url">平台帳號連結</Label>
                        <Input
                          id="creator_profile_url"
                          type="url"
                          placeholder="https://..."
                          value={profile?.creator_profile_url || ''}
                          onChange={(e) => setProfile({ ...profile!, creator_profile_url: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="creator_follower_count">目前粉絲數</Label>
                        <Input
                          id="creator_follower_count"
                          type="number"
                          placeholder="0"
                          value={profile?.creator_follower_count || ''}
                          onChange={(e) => setProfile({ ...profile!, creator_follower_count: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="creator_content_type">創作類型</Label>
                        <Select
                          value={profile?.creator_content_type || ''}
                          onValueChange={(value) => setProfile({ ...profile!, creator_content_type: value })}
                        >
                          <SelectTrigger id="creator_content_type">
                            <SelectValue placeholder="選擇類型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="搞笑">搞笑</SelectItem>
                            <SelectItem value="教育">教育</SelectItem>
                            <SelectItem value="情緒療癒">情緒療癒</SelectItem>
                            <SelectItem value="美妝">美妝</SelectItem>
                            <SelectItem value="健康">健康</SelectItem>
                            <SelectItem value="商業">商業</SelectItem>
                            <SelectItem value="其他">其他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="ai_persona_positioning">AI 生成人設定位</Label>
                        <Input
                          id="ai_persona_positioning"
                          placeholder="從 IP 人設模組同步"
                          value={profile?.ai_persona_positioning || ''}
                          onChange={(e) => setProfile({ ...profile!, ai_persona_positioning: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          此欄位會從 IP 人設規劃模組自動同步
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          儲存創作者資訊
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 使用者偏好設定 */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI 個性化設定</CardTitle>
                    <CardDescription>設定您的偏好，讓 AI 生成時自動套用這些設定</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferred_tone">預設腳本語氣</Label>
                        <Select
                          value={profile?.preferred_tone || ''}
                          onValueChange={(value) => setProfile({ ...profile!, preferred_tone: value })}
                        >
                          <SelectTrigger id="preferred_tone">
                            <SelectValue placeholder="選擇語氣" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="專業">專業</SelectItem>
                            <SelectItem value="幽默">幽默</SelectItem>
                            <SelectItem value="口語">口語</SelectItem>
                            <SelectItem value="權威">權威</SelectItem>
                            <SelectItem value="感性">感性</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="preferred_language">預設腳本語言</Label>
                        <Select
                          value={profile?.preferred_language || ''}
                          onValueChange={(value) => setProfile({ ...profile!, preferred_language: value })}
                        >
                          <SelectTrigger id="preferred_language">
                            <SelectValue placeholder="選擇語言" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="台灣中文">台灣中文</SelectItem>
                            <SelectItem value="香港中文">香港中文</SelectItem>
                            <SelectItem value="馬來中文">馬來中文</SelectItem>
                            <SelectItem value="英文">英文</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="preferred_video_length">預設影片長度</Label>
                        <Select
                          value={profile?.preferred_video_length || ''}
                          onValueChange={(value) => setProfile({ ...profile!, preferred_video_length: value })}
                        >
                          <SelectTrigger id="preferred_video_length">
                            <SelectValue placeholder="選擇長度" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6-10秒">6-10 秒</SelectItem>
                            <SelectItem value="10-15秒">10-15 秒</SelectItem>
                            <SelectItem value="20-30秒">20-30 秒</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>偏好主題類別（可多選）</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {['搞笑', '教育', '情緒療癒', '美妝', '健康', '商業', '科技', '生活', '旅遊', '美食', '時尚', '運動'].map((category) => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profile?.preferred_topic_categories?.includes(category) || false}
                              onChange={(e) => {
                                const current = profile?.preferred_topic_categories || [];
                                if (e.target.checked) {
                                  setProfile({ ...profile!, preferred_topic_categories: [...current, category] });
                                } else {
                                  setProfile({ ...profile!, preferred_topic_categories: current.filter(c => c !== category) });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          儲存偏好設定
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 帳務資訊摘要 */}
              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>帳務資訊摘要</CardTitle>
                    <CardDescription>查看您的訂閱與付款資訊</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingBilling ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : billingSummary?.order || billingSummary?.license ? (
                      <div className="space-y-4">
                        {billingSummary.order && (
                          <div className="p-4 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold">訂單資訊</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">方案名稱</p>
                                <p className="font-medium">{billingSummary.order.plan_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">購買日期</p>
                                <p className="font-medium">{formatDate(billingSummary.order.purchase_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">下次扣款日</p>
                                <p className="font-medium">{formatDate(billingSummary.order.next_billing_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">付款方式</p>
                                <p className="font-medium">
                                  {billingSummary.order.payment_last4 
                                    ? `****${billingSummary.order.payment_last4}` 
                                    : billingSummary.order.payment_method || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">付款狀態</p>
                                <Badge variant={billingSummary.order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                  {billingSummary.order.payment_status === 'paid' ? '已付款' : '待付款'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">金額</p>
                                <p className="font-medium">
                                  {new Intl.NumberFormat('zh-TW', {
                                    style: 'currency',
                                    currency: billingSummary.order.currency || 'TWD'
                                  }).format(billingSummary.order.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {billingSummary.license && (
                          <div className="p-4 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold">授權資訊</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">方案等級</p>
                                <Badge variant="outline">{billingSummary.license.tier}</Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">開始日期</p>
                                <p className="font-medium">{formatDate(billingSummary.license.start_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">到期日期</p>
                                <p className="font-medium">{formatDate(billingSummary.license.expires_at)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">狀態</p>
                                <Badge variant={billingSummary.license.status === 'active' ? 'default' : 'secondary'}>
                                  {billingSummary.license.status === 'active' ? '有效' : '已過期'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate('/orders')}
                        >
                          查看完整訂單記錄
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>尚無訂單記錄</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('/pricing')}
                        >
                          前往訂閱
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 最近使用紀錄 */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>最近使用紀錄</CardTitle>
                    <CardDescription>查看您最近的操作記錄</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingActivity ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : recentActivity.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {recentActivity.map((activity, index) => (
                            <div
                              key={`${activity.category}-${activity.id}-${index}`}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="text-2xl flex-shrink-0">
                                {getActivityIcon(activity.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{activity.type}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>尚無使用紀錄</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
