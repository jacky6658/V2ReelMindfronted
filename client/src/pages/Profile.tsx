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
import { ArrowLeft, Loader2, Save, CreditCard, Clock, Activity, User, Settings, ExternalLink, Calendar, Copy, Check, Sparkles, Gift, HelpCircle, Home } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  
  // 推薦邀請碼相關狀態
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<{ totalReferrals: number; rewards: number } | null>(null);
  const [referralList, setReferralList] = useState<Array<{
    id: number;
    referred_user_id: string;
    referred_user_name: string;
    referred_user_email: string;
    created_at: string;
    reward_status: string;
    has_paid?: boolean;
    is_subscribed?: boolean;
  }>>([]);
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  
  // 使用說明對話框狀態
  const [showCreatorHelpDialog, setShowCreatorHelpDialog] = useState(false);
  const [showPreferencesHelpDialog, setShowPreferencesHelpDialog] = useState(false);

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
      loadReferralCode();
    }
  }, [user?.user_id]);
  
  // 載入推薦邀請碼
  const loadReferralCode = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoadingReferral(true);
      
      // 從後端獲取推薦碼
      try {
        const codeData = await apiGet<{ referral_code: string }>(`/api/user/referral/code/${user.user_id}`);
        if (codeData?.referral_code) {
          setReferralCode(codeData.referral_code);
        } else {
          // 如果後端沒有返回推薦碼，使用臨時生成（向後兼容）
          const code = user.user_id.substring(0, 8).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
          setReferralCode(code);
        }
      } catch (error: any) {
        console.error('載入推薦碼失敗:', error);
        // 如果 API 失敗，使用臨時生成（向後兼容）
        const code = user.user_id.substring(0, 8).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
        setReferralCode(code);
      }
      
      // 獲取推薦統計
      try {
        const stats = await apiGet<{ total_referrals: number; rewards: number }>(`/api/user/referral/stats/${user.user_id}`);
        setReferralStats({
          totalReferrals: stats.total_referrals || 0,
          rewards: stats.rewards || 0
        });
      } catch (error: any) {
        // 如果 API 返回錯誤，使用預設值（避免顯示錯誤）
        console.error('載入推薦統計失敗:', error);
        setReferralStats({ totalReferrals: 0, rewards: 0 });
      }
      
      // 獲取推薦邀請成功列表
      try {
        const listData = await apiGet<{
          referrals: Array<{
            id: number;
            referred_user_id: string;
            referred_user_name: string;
            referred_user_email: string;
            created_at: string;
            reward_status: string;
            has_paid?: boolean;
            is_subscribed?: boolean;
          }>;
          total: number;
        }>(`/api/user/referral/list/${user.user_id}`);
        
        if (listData?.referrals) {
          setReferralList(listData.referrals);
        }
      } catch (error: any) {
        console.error('載入推薦列表失敗:', error);
        setReferralList([]);
      }
    } catch (error) {
      console.error('載入推薦碼失敗:', error);
    } finally {
      setLoadingReferral(false);
    }
  };
  
  // 複製推薦碼
  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferralCode(true);
    toast.success('推薦碼已複製到剪貼簿');
    setTimeout(() => setCopiedReferralCode(false), 2000);
  };
  
  // 複製推薦連結
  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/#/?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedReferralLink(true);
    toast.success('推薦連結已複製到剪貼簿');
    setTimeout(() => setCopiedReferralLink(false), 2000);
  };

  // 根據平台生成連結格式
  const getPlatformUrlFormat = (platform: string, username: string): string => {
    if (!username) return '';
    const cleanUsername = username.replace(/^@/, '').trim();
    
    const urlFormats: Record<string, string> = {
      instagram: `https://www.instagram.com/${cleanUsername}/`,
      tiktok: `https://www.tiktok.com/@${cleanUsername}`,
      youtube_short: `https://www.youtube.com/@${cleanUsername}`,
      facebook_reels: `https://www.facebook.com/${cleanUsername}`,
    };
    
    return urlFormats[platform] || '';
  };

  // 根據平台獲取佔位符提示
  const getPlatformPlaceholder = (platform: string): string => {
    const placeholders: Record<string, string> = {
      instagram: '@username 或 username',
      tiktok: '@username 或 username',
      youtube_short: '@username 或 username',
      facebook_reels: 'username 或 page-name',
      other: '@username',
    };
    return placeholders[platform] || '@username';
  };

  // 根據平台獲取連結範例
  const getPlatformUrlExample = (platform: string): string => {
    const examples: Record<string, string> = {
      instagram: 'https://www.instagram.com/username/',
      tiktok: 'https://www.tiktok.com/@username',
      youtube_short: 'https://www.youtube.com/@username',
      facebook_reels: 'https://www.facebook.com/username',
      other: 'https://...',
    };
    return examples[platform] || 'https://...';
  };

  // 驗證連結格式
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // 空值視為有效（可選欄位）
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 自動生成連結
  const handleUsernameChange = (username: string) => {
    const newProfile = { ...profile!, creator_username: username };
    
    // 如果已選擇平台且有用戶名，自動生成連結
    if (profile?.creator_platform && username && !profile.creator_profile_url) {
      // 只有在沒有手動輸入連結時才自動生成
      const autoUrl = getPlatformUrlFormat(profile.creator_platform, username);
      if (autoUrl) {
        newProfile.creator_profile_url = autoUrl;
      }
    }
    
    setProfile(newProfile);
  };

  // 複製連結
  const handleCopyUrl = async () => {
    if (!profile?.creator_profile_url) {
      toast.error('沒有可複製的連結');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(profile.creator_profile_url);
      setCopiedUrl(true);
      toast.success('連結已複製到剪貼簿');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast.error('複製失敗');
    }
  };

  // 儲存個人資料
  const handleSave = async () => {
    if (!user?.user_id || !profile) return;
    
    // 驗證連結格式
    if (profile.creator_profile_url && !validateUrl(profile.creator_profile_url)) {
      toast.error('請輸入有效的連結格式（需以 http:// 或 https:// 開頭）');
      setUrlValid(false);
      return;
    }
    
    try {
      setSaving(true);
      await apiPost('/api/profile', profile);
      toast.success('個人資料已儲存');
      setUrlValid(true);
      loadProfile();
    } catch (error: any) {
      console.error('儲存失敗:', error);
      toast.error(error?.response?.data?.error || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  // 格式化日期（使用台灣時區）
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
              <TabsList className="flex flex-wrap w-full gap-1 md:grid md:grid-cols-6">
                <TabsTrigger value="basic" className="flex-1 md:flex-none text-xs md:text-sm min-w-0">基本資訊</TabsTrigger>
                <TabsTrigger value="creator" className="flex-1 md:flex-none text-xs md:text-sm min-w-0">創作者資訊</TabsTrigger>
                <TabsTrigger value="preferences" className="flex-1 md:flex-none text-xs md:text-sm min-w-0">偏好設定</TabsTrigger>
                <TabsTrigger value="billing" className="flex-1 md:flex-none text-xs md:text-sm min-w-0">帳務資訊</TabsTrigger>
                <TabsTrigger value="referral" className="flex-1 md:flex-none text-xs md:text-sm min-w-0">推薦邀請</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 md:flex-none text-xs md:text-sm min-w-0 w-full md:w-auto">使用紀錄</TabsTrigger>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>創作者帳號資訊</CardTitle>
                        <CardDescription>填寫您的創作平台資訊，幫助 AI 更好地為您生成內容</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCreatorHelpDialog(true)}
                        title="使用說明"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="creator_platform">創作平台</Label>
                        <Select
                          value={profile?.creator_platform || ''}
                          onValueChange={(value) => {
                            const newProfile = { ...profile!, creator_platform: value };
                            // 如果已有用戶名，自動生成連結
                            if (value && profile?.creator_username && !profile.creator_profile_url) {
                              newProfile.creator_profile_url = getPlatformUrlFormat(value, profile.creator_username);
                            }
                            setProfile(newProfile);
                          }}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          選擇平台後，輸入帳號名稱可自動生成連結
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="creator_username">平台帳號名稱</Label>
                        <Input
                          id="creator_username"
                          placeholder={profile?.creator_platform ? getPlatformPlaceholder(profile.creator_platform) : '@username'}
                          value={profile?.creator_username || ''}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          輸入帳號名稱後，系統會自動生成連結（可手動修改）
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="creator_profile_url">平台帳號連結</Label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Input
                              id="creator_profile_url"
                              type="url"
                              placeholder={profile?.creator_platform ? getPlatformUrlExample(profile.creator_platform) : 'https://...'}
                              value={profile?.creator_profile_url || ''}
                              onChange={(e) => {
                                const url = e.target.value;
                                setProfile({ ...profile!, creator_profile_url: url });
                                setUrlValid(validateUrl(url));
                              }}
                              className={urlValid === false ? 'border-destructive' : ''}
                            />
                            {urlValid === false && (
                              <p className="text-xs text-destructive mt-1">
                                請輸入有效的連結格式（需以 http:// 或 https:// 開頭）
                              </p>
                            )}
                          </div>
                          {profile?.creator_profile_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleCopyUrl}
                              title="複製連結"
                            >
                              {copiedUrl ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          系統會根據平台和帳號名稱自動生成，您也可以手動輸入或修改
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="creator_follower_count">目前粉絲數</Label>
                        <Input
                          id="creator_follower_count"
                          type="number"
                          placeholder="例如：1000"
                          min="0"
                          value={profile?.creator_follower_count || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProfile({ ...profile!, creator_follower_count: value ? parseInt(value) || 0 : undefined });
                          }}
                        />
                        {profile?.creator_follower_count && profile.creator_follower_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            已設定：{profile.creator_follower_count.toLocaleString()} 位粉絲
                          </p>
                        )}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>AI 個性化設定</CardTitle>
                        <CardDescription>設定您的偏好，讓 AI 生成時自動套用這些設定</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPreferencesHelpDialog(true)}
                        title="使用說明"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </Button>
                    </div>
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

              {/* 推薦邀請 */}
              <TabsContent value="referral" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      推薦邀請碼
                    </CardTitle>
                    <CardDescription>
                      分享您的邀請碼，邀請好友加入即可獲得獎勵
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingReferral ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* 推薦碼顯示 */}
                        <div>
                          <Label>您的推薦碼</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={referralCode}
                              readOnly
                              className="font-mono text-lg font-bold"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleCopyReferralCode}
                            >
                              {copiedReferralCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* 推薦連結 */}
                        <div>
                          <Label>推薦連結</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={referralCode ? `${window.location.origin}/#/?ref=${referralCode}` : ''}
                              readOnly
                              className="text-sm"
                            />
                            <Button
                              variant="outline"
                              onClick={handleCopyReferralLink}
                            >
                              {copiedReferralLink ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  已複製
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  複製連結
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* 推薦統計 */}
                        {referralStats && (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">{referralStats.totalReferrals}</p>
                              <p className="text-sm text-muted-foreground">成功邀請</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-primary">{referralStats.rewards}</p>
                              <p className="text-sm text-muted-foreground">累積獎勵</p>
                            </div>
                          </div>
                        )}

                        {/* 成功邀請的好友列表 */}
                        {referralList.length > 0 && (
                          <div className="pt-4 border-t space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">成功邀請的好友</h3>
                              <Badge variant="secondary">{referralList.length} 位</Badge>
                            </div>
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-2 pr-4">
                                {referralList.map((referral) => (
                                  <Card key={referral.id} className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-medium truncate">{referral.referred_user_name}</p>
                                          <Badge 
                                            variant={referral.reward_status === 'completed' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {referral.reward_status === 'completed' ? '已發放獎勵' : '待發放'}
                                          </Badge>
                                          {referral.has_paid && (
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                              已付款
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{referral.referred_user_email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-muted-foreground font-mono">
                                            用戶ID: {referral.referred_user_id}
                                          </p>
                                          {referral.is_subscribed && (
                                            <Badge variant="outline" className="text-xs">
                                              已訂閱
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-xs text-muted-foreground">
                                          {referral.created_at 
                                            ? new Date(referral.created_at).toLocaleDateString('zh-TW', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                              })
                                            : '未知'}
                                        </p>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {/* 獎勵說明 - FOMO 設計 */}
                        <div className="pt-4 border-t">
                          <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg p-6 border-2 border-primary/20 space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">🎁</span>
                              </div>
                              <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                推薦邀請獎勵機制
                              </h3>
                            </div>
                            
                            {/* 獎勵表格 */}
                            <div className="space-y-3">
                              {/* 基礎獎勵 */}
                              <div className="bg-background/80 rounded-lg p-4 border border-green-500/30">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                    <h4 className="font-semibold text-foreground">基礎獎勵（無上限）</h4>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    立即獲得
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground ml-8">
                                  每成功邀請一位好友註冊，<strong className="text-foreground">邀請人與被邀請人雙方</strong>都可獲得 <strong className="text-primary font-bold">7 天免費試用延長</strong>
                                </p>
                                <div className="mt-2 ml-8 p-2 bg-muted/50 rounded text-xs">
                                  <p className="text-muted-foreground">
                                    💡 一個帳號最多延長至 <strong className="text-foreground">5 週（共 35 天）</strong>，一個帳號至多可以免費體驗全功能 <strong className="text-primary">2 個月</strong>
                                  </p>
                                </div>
                              </div>

                              {/* 額外獎勵 */}
                              <div className="bg-background/80 rounded-lg p-4 border-2 border-purple-500/40 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">⭐</span>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-foreground">額外獎勵（二擇一）</h4>
                                        <p className="text-xs text-muted-foreground">任一完成後即無獎勵</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                      限時活動
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-3 ml-8">
                                    {/* 選項 1 */}
                                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-purple-500 font-bold">選項 A</span>
                                        <Badge variant="outline" className="text-xs">熱門</Badge>
                                      </div>
                                      <p className="text-sm text-foreground">
                                        累積邀請 <strong className="text-purple-500 font-bold text-base">10 位用戶</strong> → 
                                      </p>
                                      <p className="text-sm text-primary font-bold mt-1">
                                        🎉 可獲得 <strong className="text-lg">1 個月免費使用</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">（每個推薦人只能獲得一次）</p>
                                    </div>

                                    {/* 選項 2 */}
                                    <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/30">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-pink-500 font-bold">選項 B</span>
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">快速達成</Badge>
                                      </div>
                                      <p className="text-sm text-foreground">
                                        邀請的好友中有一位完成 <strong className="text-pink-500 font-bold">月付或年付付款</strong> → 
                                      </p>
                                      <p className="text-sm text-primary font-bold mt-1">
                                        🎉 可獲得 <strong className="text-lg">1 個月免費使用</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">（每個推薦人只能獲得一次）</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* FOMO 提示 */}
                              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-500/30">
                                <div className="flex items-start gap-2">
                                  <span className="text-2xl">🔥</span>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground mb-1">
                                      為什麼要現在開始邀請？
                                    </p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                      <li>• 邀請越多，免費使用時間越長（最多 2 個月）</li>
                                      <li>• 額外獎勵活動可能隨時結束，把握機會！</li>
                                      <li>• 好友訂閱後，您也能立即獲得 1 個月免費使用</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
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
      
      {/* 創作者帳號資訊使用說明對話框 */}
      <Dialog open={showCreatorHelpDialog} onOpenChange={setShowCreatorHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>創作者帳號資訊使用說明</DialogTitle>
            <DialogDescription>了解如何填寫創作者帳號資訊，讓 AI 更好地為您生成內容</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">為什麼要填寫創作者帳號資訊？</h4>
              <p className="text-muted-foreground">
                填寫您的創作平台資訊可以幫助 AI 更好地理解您的帳號定位、目標受眾和內容風格，從而生成更符合您需求的內容。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">如何填寫？</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><strong>選擇創作平台</strong>：選擇您主要使用的平台（Instagram、TikTok、YouTube Short 等）</li>
                <li><strong>輸入帳號名稱</strong>：輸入您的平台帳號名稱，系統會自動生成連結</li>
                <li><strong>確認或修改連結</strong>：檢查自動生成的連結是否正確，可以手動修改</li>
                <li><strong>填寫粉絲數</strong>：輸入您目前的粉絲數，幫助 AI 了解您的帳號規模</li>
                <li><strong>選擇創作類型</strong>：選擇您主要創作的內容類型（搞笑、教育、美妝等）</li>
                <li><strong>AI 生成人設定位</strong>：此欄位會從 IP 人設規劃模組自動同步，無需手動填寫</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">注意事項</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>填寫的資訊會用於 AI 生成內容時的參考，不會公開顯示</li>
                <li>可以隨時更新您的資訊，讓 AI 生成更準確的內容</li>
                <li>AI 生成人設定位會自動從 IP 人設規劃模組同步，無需手動維護</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 偏好設定使用說明對話框 */}
      <Dialog open={showPreferencesHelpDialog} onOpenChange={setShowPreferencesHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI 個性化設定使用說明</DialogTitle>
            <DialogDescription>了解如何設定您的偏好，讓 AI 生成時自動套用這些設定</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">什麼是 AI 個性化設定？</h4>
              <p className="text-muted-foreground">
                AI 個性化設定可以讓您預先設定常用的生成參數，當您使用 IP 人設規劃或一鍵生成功能時，AI 會自動套用這些設定，節省您每次都要重新設定的時間。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">可設定的項目</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>預設腳本語氣</strong>：選擇您偏好的腳本語氣（專業、幽默、口語、權威、感性）</li>
                <li><strong>預設腳本語言</strong>：選擇您偏好的語言（台灣中文、香港中文、馬來中文、英文）</li>
                <li><strong>預設影片長度</strong>：選擇您常用的影片長度（6-10秒、10-15秒、20-30秒）</li>
                <li><strong>偏好主題類別</strong>：選擇您常創作的主題類別（可多選），AI 會優先考慮這些主題</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">如何使用？</h4>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>根據您的創作習慣，設定各項偏好</li>
                <li>點擊「儲存偏好設定」保存您的設定</li>
                <li>之後使用 IP 人設規劃或一鍵生成時，AI 會自動套用這些設定</li>
                <li>您仍然可以在每次生成時手動調整這些設定</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">注意事項</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>設定的偏好是預設值，不會強制套用，您可以在每次生成時調整</li>
                <li>可以隨時更新您的偏好設定</li>
                <li>偏好主題類別可以多選，幫助 AI 更好地理解您的創作方向</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
