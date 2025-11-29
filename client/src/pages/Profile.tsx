/**
 * 個人資料 / 訂閱狀態 / LLM Key 管理 / 使用統計頁面
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiGet, apiPost } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/api-config';
import { toast } from 'sonner';
import { Key, Trash2, Plus, TestTube, Loader2, BarChart3, MessageSquare, Zap, Database, Calendar } from 'lucide-react';

interface LLMKey {
  provider: string;
  last4: string;
  model_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UsageStats {
  conversations: number;
  generations: number;
  scripts: number;
  lastActive: string | null;
}

const Profile: React.FC = () => {
  const { user, subscription, logout } = useAuthStore();
  const [llmKeys, setLlmKeys] = useState<LLMKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<LLMKey | null>(null);
  const [testingKey, setTestingKey] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 新增 Key 表單狀態
  const [newKey, setNewKey] = useState({
    provider: 'gemini',
    api_key: '',
    model_name: ''
  });
  const [availableModels, setAvailableModels] = useState<{
    gemini: Array<{ value: string; label: string }>;
    openai: Array<{ value: string; label: string }>;
  }>({ gemini: [], openai: [] });

  // 載入 LLM Keys
  const loadLlmKeys = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const data = await apiGet<{ keys: LLMKey[] }>(`/api/user/llm-keys/${user.user_id}`);
      setLlmKeys(data.keys || []);
    } catch (error: any) {
      console.error('載入 LLM Keys 失敗:', error);
      toast.error('載入 API Keys 失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入可用模型列表
  const loadAvailableModels = async () => {
    try {
      const models = await apiGet<{
        gemini: Array<{ value: string; label: string }>;
        openai: Array<{ value: string; label: string }>;
      }>('/api/llm/models');
      setAvailableModels(models);
    } catch (error) {
      console.error('載入模型列表失敗:', error);
    }
  };

  // 載入使用統計
  const loadUsageStats = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoadingStats(true);
      // 獲取對話記錄數量
      const conversations = await apiGet<any[]>(`/api/user/conversations/${user.user_id}`).catch(() => []);
      // 獲取生成記錄數量
      const generations = await apiGet<any[]>(`/api/user/generations/${user.user_id}`).catch(() => []);
      // 獲取腳本數量
      const scripts = await apiGet<any[]>(`/api/scripts/my`).catch(() => []);
      
      // 獲取最後活動時間（從最近的記錄中取得）
      let lastActive: string | null = null;
      if (conversations.length > 0) {
        lastActive = conversations[0]?.created_at || null;
      } else if (generations.length > 0) {
        lastActive = generations[0]?.created_at || null;
      } else if (scripts.length > 0) {
        lastActive = scripts[0]?.created_at || null;
      }

      setUsageStats({
        conversations: conversations.length || 0,
        generations: generations.length || 0,
        scripts: scripts.length || 0,
        lastActive
      });
    } catch (error) {
      console.error('載入使用統計失敗:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadLlmKeys();
      loadUsageStats();
      loadAvailableModels();
    }
  }, [user?.user_id]);

  // 測試 API Key
  const handleTestKey = async () => {
    if (!newKey.api_key.trim()) {
      toast.error('請輸入 API Key');
      return;
    }

    try {
      setTestingKey(true);
      const result = await apiPost<{ valid: boolean; message?: string; error?: string }>('/api/user/llm-keys/test', {
        provider: newKey.provider,
        api_key: newKey.api_key,
        model_name: newKey.model_name || undefined
      });

      if (result.valid) {
        toast.success(result.message || 'API Key 有效');
      } else {
        toast.error(result.error || 'API Key 無效');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '測試失敗');
    } finally {
      setTestingKey(false);
    }
  };

  // 儲存 API Key
  const handleSaveKey = async () => {
    if (!user?.user_id) {
      toast.error('請先登入');
      return;
    }

    if (!newKey.api_key.trim()) {
      toast.error('請輸入 API Key');
      return;
    }

    try {
      setLoading(true);
      await apiPost('/api/user/llm-keys', {
        user_id: user.user_id,
        provider: newKey.provider,
        api_key: newKey.api_key,
        model_name: newKey.model_name || undefined
      });

      toast.success('API Key 已保存');
      setShowAddKeyDialog(false);
      setNewKey({ provider: 'gemini', api_key: '', model_name: '' });
      loadLlmKeys();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '保存失敗');
    } finally {
      setLoading(false);
    }
  };

  // 刪除 API Key
  const handleDeleteKey = async () => {
    if (!user?.user_id || !keyToDelete) return;

    try {
      setLoading(true);
      // 後端 DELETE API 需要 body，使用 fetch 直接調用
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE_URL}/api/user/llm-keys/${user.user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ provider: keyToDelete.provider }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '刪除失敗');
      }

      toast.success('API Key 已刪除');
      setShowDeleteDialog(false);
      setKeyToDelete(null);
      loadLlmKeys();
    } catch (error: any) {
      toast.error(error?.message || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">個人資料</h1>

        {/* 用戶資訊卡片 */}
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

        {/* 使用統計卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <CardTitle>使用統計</CardTitle>
            </div>
            <CardDescription>查看您的使用數據與分析</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : usageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{usageStats.conversations}</p>
                    <p className="text-sm text-muted-foreground">對話記錄</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{usageStats.generations}</p>
                    <p className="text-sm text-muted-foreground">生成記錄</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                  <Database className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{usageStats.scripts}</p>
                    <p className="text-sm text-muted-foreground">腳本數量</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                  <Calendar className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{formatDate(usageStats.lastActive)}</p>
                    <p className="text-sm text-muted-foreground">最後活動</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">暫無數據</p>
            )}
          </CardContent>
        </Card>

        {/* LLM Key 管理卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                <CardTitle>LLM API Key 管理</CardTitle>
              </div>
              <Button
                onClick={() => setShowAddKeyDialog(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                新增 Key
              </Button>
            </div>
            <CardDescription>綁定您的 LLM API Key，使用自己的配額進行 AI 生成</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : llmKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>尚未綁定任何 API Key</p>
                <p className="text-sm mt-2">點擊「新增 Key」開始綁定</p>
              </div>
            ) : (
              <div className="space-y-3">
                {llmKeys.map((key, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="uppercase">
                          {key.provider}
                        </Badge>
                        {key.model_name && (
                          <Badge variant="secondary" className="text-xs">
                            {key.model_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Key: ••••{key.last4}
                      </p>
                      {key.updated_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          更新於: {formatDate(key.updated_at)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setKeyToDelete(key);
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新增 Key Dialog */}
        <Dialog open={showAddKeyDialog} onOpenChange={setShowAddKeyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新增 LLM API Key</DialogTitle>
              <DialogDescription>
                輸入您的 API Key，系統會加密儲存以確保安全
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Provider</Label>
                <Select
                  value={newKey.provider}
                  onValueChange={(value) => {
                    setNewKey({ ...newKey, provider: value, model_name: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>模型（可選）</Label>
                <Select
                  value={newKey.model_name}
                  onValueChange={(value) => setNewKey({ ...newKey, model_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇模型（可選）" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels[newKey.provider as 'gemini' | 'openai']?.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder={`輸入您的 ${newKey.provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key`}
                  value={newKey.api_key}
                  onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleTestKey}
                disabled={!newKey.api_key.trim() || testingKey}
                className="gap-2"
              >
                {testingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                測試 Key
              </Button>
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddKeyDialog(false);
                    setNewKey({ provider: 'gemini', api_key: '', model_name: '' });
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveKey}
                  disabled={!newKey.api_key.trim() || loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  儲存
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 刪除確認 Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認刪除</DialogTitle>
              <DialogDescription>
                確定要刪除這個 API Key 嗎？此操作無法復原。
              </DialogDescription>
            </DialogHeader>
            {keyToDelete && (
              <div className="py-4">
                <p className="text-sm">
                  Provider: <Badge variant="outline" className="uppercase">{keyToDelete.provider}</Badge>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Key: ••••{keyToDelete.last4}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setKeyToDelete(null);
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteKey}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                刪除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;
