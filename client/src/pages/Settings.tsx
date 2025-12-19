/**
 * 設定頁面
 * 包含：LLM API Key 管理、數據匯出
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, Key, Eye, EyeOff, Trash2, CheckCircle2, XCircle, Loader2, Download, ExternalLink, FileText, HelpCircle, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { guideArticles } from '@/data/guide-articles';

interface LLMKey {
  provider: string;
  last4: string;
  model_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AvailableModel {
  value: string;
  label: string;
}

interface ModelsResponse {
  gemini: AvailableModel[];
  openai: AvailableModel[];
}

interface PlanStatusResponse {
  plan: 'free' | 'lite' | 'pro' | 'vip' | 'max';
  billing_cycle: 'none' | 'monthly' | 'yearly' | string;
  limits: {
    daily: number;
    monthly: number;
    premium_monthly: number;
    vip_premium_default_model?: string;
    premium_byok_allowed?: boolean;
  };
  usage: {
    day: string;
    month: string;
    daily_used: number;
    monthly_used: number;
    premium_monthly_used: number;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [keys, setKeys] = useState<LLMKey[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelsResponse | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null);
  
  // 表單狀態
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState<string>('__default__');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showLLMKeyGuideDialog, setShowLLMKeyGuideDialog] = useState(false);
  const [showUsageCalculationDialog, setShowUsageCalculationDialog] = useState(false);
  

  // 載入已保存的 Keys
  const loadKeys = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const data = await apiGet<{ keys: LLMKey[] }>(`/api/user/llm-keys/${user.user_id}`);
      setKeys(data.keys || []);
    } catch (error) {
      console.error('載入 LLM Keys 失敗:', error);
      toast.error('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 載入可用的模型列表
  const loadAvailableModels = async () => {
    try {
      const data = await apiGet<ModelsResponse>('/api/llm/models');
      setAvailableModels(data);
      // 如果有已保存的 key，設置對應的模型
      if (keys.length > 0 && keys[0].provider === provider) {
        const savedModelName = keys[0].model_name;
        if (savedModelName && savedModelName !== '' && savedModelName !== '__default__') {
          setModelName(savedModelName);
        } else {
          setModelName('__default__');
        }
      } else {
        setModelName('__default__');
      }
    } catch (error) {
      console.error('載入模型列表失敗:', error);
      setModelName('__default__');
    }
  };

  const loadPlanStatus = async () => {
    try {
      const data = await apiGet<PlanStatusResponse>('/api/user/plan-status');
      
      // 檢查數據一致性（後端已修正：monthly_used 現在也包含 BYOK 使用）
      // 理論上 monthly_used 應該 >= daily_used（因為本月包含今日）
      if (data?.usage && data.usage.monthly_used < data.usage.daily_used) {
        console.warn('[Settings] 用量數據異常：本月用量少於今日用量（後端已修正，不應出現）', {
          daily_used: data.usage.daily_used,
          monthly_used: data.usage.monthly_used,
          day: data.usage.day,
          month: data.usage.month
        });
      }
      
      setPlanStatus(data);
    } catch (error) {
      setPlanStatus(null);
    }
  };

  // 載入數據（PrivateRoute 已經處理了登入檢查，這裡不需要再檢查）
  useEffect(() => {
    // 等待認證狀態加載完成且用戶信息已加載
    if (authLoading) {
      return;
    }
    
    // 如果沒有用戶但有 token，嘗試重新獲取用戶信息
    const currentState = useAuthStore.getState();
    if (!user?.user_id && currentState.token && !currentState.loading) {
      useAuthStore.getState().fetchCurrentUser().catch((error) => {
        console.error('[Settings] 獲取用戶信息失敗:', error);
      });
      return;
    }
    
    // 已登入且有用戶信息，載入數據
    if (user?.user_id) {
    loadKeys();
    loadAvailableModels();
      loadPlanStatus();
    }
  }, [user?.user_id, authLoading]);

  // 當 provider 改變時，更新 modelName
  useEffect(() => {
    const existingKey = keys.find(k => k.provider === provider);
    if (existingKey && existingKey.model_name && existingKey.model_name !== '') {
      setModelName(existingKey.model_name);
    } else {
      setModelName('__default__');
    }
  }, [provider, keys]);

  // 測試 API Key
  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('請先輸入 API Key');
      return;
    }

    // 等待認證狀態加載完成
    if (authLoading) {
      toast.info('正在載入用戶資訊，請稍候...');
      return;
    }

    if (!user?.user_id) {
      toast.error('請先登入');
      // 不跳轉，因為 PrivateRoute 會處理
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await apiPost<{ valid: boolean; message?: string; error?: string }>('/api/user/llm-keys/test', {
        provider,
        api_key: apiKey,
        model_name: modelName && modelName !== '' && modelName !== '__default__' ? modelName : undefined
      });

      if (response.valid) {
        const message = response.message || 'API Key 測試成功！';
        setTestResult({ success: true, message });
        toast.success(message);
      } else {
        const errorMessage = response.error || response.message || 'API Key 測試失敗';
        setTestResult({ success: false, message: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '測試失敗，請稍後再試';
      setTestResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  // 保存 API Key
  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('請先輸入 API Key');
      return;
    }

    // 等待認證狀態加載完成 - 使用 store 的當前狀態而不是閉包值
    let currentState = useAuthStore.getState();
    let currentLoading = currentState.loading;
    let currentUser = currentState.user;
    
    // 如果正在載入或沒有用戶，等待並嘗試重新獲取用戶信息
    if (currentLoading || !currentUser?.user_id) {
      toast.info('正在載入用戶資訊，請稍候...');
      
      // 如果有 token 但沒有用戶，嘗試重新獲取用戶信息
      if (!currentUser?.user_id && currentState.token) {
        try {
          await useAuthStore.getState().fetchCurrentUser();
          currentState = useAuthStore.getState();
          currentUser = currentState.user;
          currentLoading = currentState.loading;
        } catch (error) {
          console.error('[Settings] 重新獲取用戶信息失敗:', error);
        }
      }
      
      // 等待最多 3 秒，每次檢查最新的狀態
      let waitCount = 0;
      while ((currentLoading || !currentUser?.user_id) && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        currentState = useAuthStore.getState(); // 獲取最新狀態
        currentLoading = currentState.loading;
        currentUser = currentState.user;
        waitCount++;
      }
      
      // 如果還是載入中或沒有用戶，提示用戶
      if (currentLoading || !currentUser?.user_id) {
        toast.error('載入用戶資訊超時，請重新整理頁面');
      return;
      }
    }

    // 最終檢查登入狀態 - 使用 store 的當前狀態
    if (!currentUser?.user_id) {
      console.error('[Settings] 保存失敗：用戶未登入', { userId: currentUser?.user_id, storeState: useAuthStore.getState() });
      toast.error('請先登入');
      // 不跳轉，因為 PrivateRoute 會處理
      return;
    }

    try {
      setSaving(true);
      console.log('[Settings] 開始保存 LLM Key', { userId: currentUser.user_id, provider });
      
      await apiPost('/api/user/llm-keys', {
        user_id: currentUser.user_id,
        provider,
        api_key: apiKey,
        model_name: modelName && modelName !== '' && modelName !== '__default__' ? modelName : undefined
      });

      toast.success('API Key 已保存');
      setApiKey('');
      setTestResult(null);
      await loadKeys(); // 重新載入列表
    } catch (error: any) {
      console.error('[Settings] 保存 LLM Key 失敗:', error);
      const errorMessage = error.response?.data?.error || error.message || '保存失敗，請稍後再試';
      toast.error(errorMessage);
      
      // 如果是 401 錯誤，可能是認證問題
      if (error.response?.status === 401) {
        console.warn('[Settings] 認證失敗，可能需要重新登入');
        // 不自動跳轉，讓用戶知道問題
      }
    } finally {
      setSaving(false);
    }
  };

  // 刪除 API Key
  const handleDelete = async (providerToDelete: string) => {
    if (!user?.user_id) {
      toast.error('請先登入');
      return;
    }

    if (!confirm(`確定要刪除 ${providerToDelete.toUpperCase()} 的 API Key 嗎？`)) {
      return;
    }

    try {
      setDeleting(providerToDelete);
      
      // 後端 DELETE API 需要 provider 在 request body 中
      await apiDelete(`/api/user/llm-keys/${user.user_id}`, {
        data: { provider: providerToDelete }
      });
      
      toast.success('API Key 已刪除');
      await loadKeys(); // 重新載入列表
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '刪除失敗，請稍後再試';
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // 匯出數據
  const handleExport = async () => {
    if (!user?.user_id) {
      toast.error('請先登入');
      return;
    }

    try {
      // 匯出用戶的所有資料
      const [scriptsRes, conversationsRes, generationsRes, ipPlanningRes] = await Promise.all([
        apiGet<any[]>(`/api/scripts/my`).catch(() => []),
        apiGet<any[]>(`/api/user/conversations/${user.user_id}`).catch(() => []),
        apiGet<any[]>(`/api/user/generations/${user.user_id}`).catch(() => []),
        apiGet<{ results: any[] }>(`/api/ip-planning/my`).catch(() => ({ results: [] }))
      ]);

      const scripts = Array.isArray(scriptsRes) ? scriptsRes : [];
      const conversations = Array.isArray(conversationsRes) ? conversationsRes : [];
      const generations = Array.isArray(generationsRes) ? generationsRes : [];
      const ipPlanning = ipPlanningRes?.results || [];

      // 創建 CSV 內容
      let csvContent = '資料類型,ID,標題/主題,內容,建立時間\n';
      
      // 匯出腳本
      scripts.forEach((script: any) => {
        const title = (script.title || script.name || '').replace(/"/g, '""');
        const content = (script.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
        const date = script.created_at || '';
        csvContent += `腳本,${script.id},"${title}","${content}",${date}\n`;
      });

      // 匯出對話記錄
      conversations.forEach((conv: any) => {
        const summary = (conv.summary || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
        const date = conv.created_at || '';
        csvContent += `對話記錄,${conv.id},"${conv.mode || ''}","${summary}",${date}\n`;
      });

      // 匯出生成記錄
      generations.forEach((gen: any) => {
        const topic = (gen.topic || '').replace(/"/g, '""');
        const content = (gen.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
        const date = gen.created_at || '';
        csvContent += `生成記錄,${gen.id || ''},"${topic}","${content}",${date}\n`;
      });

      // 匯出 IP 規劃結果
      ipPlanning.forEach((plan: any) => {
        const title = (plan.title || '').replace(/"/g, '""');
        const content = (plan.content || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200);
        const date = plan.created_at || '';
        csvContent += `IP規劃,${plan.id},"${title}","${content}",${date}\n`;
      });

      // 下載 CSV
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reelmind-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('資料匯出成功');
    } catch (error: any) {
      console.error('匯出失敗:', error);
      toast.error('匯出失敗，請稍後再試');
    }
  };

  const providerLabels: Record<string, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 頁首導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold">設定</h1>
          </div>
        </div>
      </nav>

      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* 方案狀態 */}
        {planStatus && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>目前方案</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowUsageCalculationDialog(true)}
                      title="用量計算說明"
                    >
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <CardDescription>
                    付款週期：{planStatus.billing_cycle === 'monthly' ? '月付' : planStatus.billing_cycle === 'yearly' ? '年付' : '無'}
                  </CardDescription>
                </div>
                <Badge variant={
                  planStatus.plan === 'max' || planStatus.plan === 'vip' ? 'default' : 
                  planStatus.plan === 'pro' ? 'secondary' : 
                  planStatus.plan === 'lite' ? 'outline' : 
                  'outline'
                }>
                  {planStatus.plan === 'max' ? 'MAX' : planStatus.plan.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                今日用量：<span className="font-medium text-foreground">{planStatus.usage.daily_used}</span> / {planStatus.limits.daily}
              </div>
              <div className="text-sm text-muted-foreground">
                本月用量：<span className="font-medium text-foreground">{planStatus.usage.monthly_used}</span> / {planStatus.limits.monthly}
              </div>
              {(planStatus.plan === 'pro' || planStatus.plan === 'vip' || planStatus.plan === 'max') && (
                <div className="text-sm text-muted-foreground">
                  Premium 本月用量：<span className="font-medium text-foreground">{planStatus.usage.premium_monthly_used}</span> / {planStatus.limits.premium_monthly}
                  {planStatus.limits.vip_premium_default_model && (
                    <span className="ml-2">
                      （預設 Premium：<span className="font-mono">{planStatus.limits.vip_premium_default_model}</span>）
                    </span>
                  )}
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2">
                綁定 BYOK 會優先使用您的金鑰；系統保底僅在您金鑰不可用時啟用。
              </div>
            </CardContent>
          </Card>
        )}

        {/* LLM API Key 管理 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  LLM API Key 管理
                </CardTitle>
                <CardDescription>
                  綁定與管理您的 LLM API Key，用於 AI 生成功能
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                  className="flex items-center gap-2"
                  title="前往 Google AI Studio 查看 API Key 和用量"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">查看用量</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLLMKeyGuideDialog(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">如何取得</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 已保存的 Keys */}
            {keys.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">已保存的 API Keys</h3>
                {keys.map((key) => (
                  <div
                    key={key.provider}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{providerLabels[key.provider] || key.provider}</Badge>
                        {key.model_name && (
                          <Badge variant="secondary">{key.model_name}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        末四碼：****{key.last4}
                      </p>
                      {key.updated_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          更新時間：{new Date(key.updated_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(key.provider)}
                      disabled={deleting === key.provider}
                    >
                      {deleting === key.provider ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
                <Separator />
              </div>
            )}

            {/* 添加/更新 Key 表單 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {keys.find(k => k.provider === provider) ? '更新' : '添加'} API Key
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">提供者</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as 'gemini' | 'openai')}>
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {availableModels && (
                  <div>
                    <Label htmlFor="model">模型（可選）</Label>
                    <Select 
                      value={modelName && modelName !== '' && modelName !== '__default__' ? modelName : '__default__'} 
                      onValueChange={(value) => {
                        if (value && value !== '') {
                          setModelName(value);
                        } else {
                          setModelName('__default__');
                        }
                      }}
                    >
                      <SelectTrigger id="model">
                        <SelectValue placeholder="使用系統預設" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">使用系統預設</SelectItem>
                        {availableModels && availableModels[provider] && availableModels[provider]
                          .filter((model) => model.value && model.value !== '') // 過濾掉空字符串的 value
                          .map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      選擇特定模型，或留空使用系統預設（目前預設為 Gemini 2.0 Flash-Lite）
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={`輸入您的 ${providerLabels[provider]} API Key`}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* 測試結果 */}
                {testResult && (
                  <Alert variant={testResult.success ? 'default' : 'destructive'}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <AlertDescription>{testResult.message}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTest}
                    disabled={!apiKey.trim() || testing}
                    variant="outline"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        測試中...
                      </>
                    ) : (
                      '測試 Key'
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!apiKey.trim() || saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 數據管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              數據管理
            </CardTitle>
            <CardDescription>
              匯出您的所有資料（腳本、對話、生成記錄等）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              匯出所有資料 (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* LLM Key 取得指南對話框 */}
      <Dialog open={showLLMKeyGuideDialog} onOpenChange={setShowLLMKeyGuideDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>如何取得 LLM API Key</DialogTitle>
            <DialogDescription>詳細教學：如何取得與設定 LLM API Key</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            {/* 快速連結區塊 */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-blue-900 dark:text-blue-900 font-bold">🔗 快速連結</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  前往 Google AI Studio
                </Button>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-900 font-bold">
                點擊上方按鈕可直接前往 Google AI Studio 查看您的 API Key 和用量統計
              </p>
            </div>

            {guideArticles['how-to-get-llm-api-key']?.sections.map((section, index) => (
              <div key={index}>
                {section.heading && (
                  <h3 className={`font-semibold mb-3 ${section.level === 1 ? 'text-lg' : 'text-base'}`}>
                    {section.heading}
                  </h3>
                )}
                <div className="space-y-2 text-muted-foreground">
                  {section.content.map((paragraph, pIndex) => {
                    // 處理 YouTube 影片嵌入
                    if (paragraph.startsWith('VIDEO:')) {
                      const videoUrl = paragraph.replace('VIDEO:', '');
                      return (
                        <div key={pIndex} className="my-4">
                          <iframe
                            width="100%"
                            height="400"
                            src={videoUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-lg"
                          />
                        </div>
                      );
                    }
                    
                    // 處理列表項目
                    if (paragraph.startsWith('**') && paragraph.includes('**')) {
                      const parts = paragraph.split('**');
                      return (
                        <div key={pIndex} className="flex gap-2 items-start">
                          <span className="flex-1">
                            {parts.map((part, i) => 
                              i % 2 === 0 ? part : <strong key={i} className="font-semibold text-foreground">{part}</strong>
                            )}
                          </span>
                        </div>
                      );
                    }
                    
                    // 處理粗體文字
                    if (paragraph.includes('**')) {
                      const parts = paragraph.split('**');
                      return (
                        <p key={pIndex} className="leading-relaxed">
                          {parts.map((part, i) => 
                            i % 2 === 0 ? part : <strong key={i} className="font-semibold text-foreground">{part}</strong>
                          )}
                        </p>
                      );
                    }
                    
                    // 一般段落
                    if (paragraph.trim()) {
                      return (
                        <p key={pIndex} className="leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    }
                    
                    return <br key={pIndex} />;
                  })}
                </div>
              </div>
            ))}

            {/* 如何查看用量教學 */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4 text-black dark:text-black font-bold">📊 如何查看 Google AI Studio 用量</h3>
              <div className="space-y-4 text-black dark:text-black font-bold">
                <div>
                  <h4 className="font-semibold mb-2">步驟 1：前往 Google AI Studio</h4>
                  <p className="leading-relaxed mb-2">
                    點擊上方的「前往 Google AI Studio」按鈕，或直接訪問：
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 mb-2">
                    <code className="text-sm break-all">https://aistudio.google.com/app/apikey</code>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">步驟 2：登入您的 Google 帳號</h4>
                  <p className="leading-relaxed">
                    確保使用與建立 API Key 相同的 Google 帳號登入
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">步驟 3：查看 API Key 列表</h4>
                  <p className="leading-relaxed mb-2">
                    在 Google AI Studio 頁面中，您可以看到：
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>已建立的 API Key 列表</li>
                    <li>每個 Key 的建立時間</li>
                    <li>Key 的狀態（啟用/停用）</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">步驟 4：查看用量統計</h4>
                  <p className="leading-relaxed mb-2">
                    在 Google AI Studio 中，您可以：
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>查看每個 API Key 的使用量</li>
                    <li>查看請求次數和配額使用情況</li>
                    <li>查看錯誤率和速率限制</li>
                    <li>查看詳細的使用日誌</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">步驟 5：管理 API Key</h4>
                  <p className="leading-relaxed mb-2">
                    在 Google AI Studio 中，您可以：
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>建立新的 API Key</li>
                    <li>刪除不再使用的 API Key</li>
                    <li>重新命名 API Key 以便管理</li>
                    <li>設定使用限制和配額</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-900">💡 重要提示</h4>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-900">
                    <li>• 用量統計通常會有幾分鐘的延遲，請耐心等待</li>
                    <li>• 如果用量異常，請檢查是否有未授權的使用</li>
                    <li>• 建議定期查看用量，避免超出配額</li>
                    <li>• 可以在 Google Cloud Console 中設定用量提醒</li>
                  </ul>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    前往 Google AI Studio 查看用量
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 用量計算說明對話框 */}
      <Dialog open={showUsageCalculationDialog} onOpenChange={setShowUsageCalculationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用量計算方式說明</DialogTitle>
            <DialogDescription>了解您的用量是如何計算的</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            {/* 今日用量 */}
            <div>
              <h3 className="font-semibold text-base mb-3 text-black dark:text-black font-bold">📊 今日用量</h3>
              <div className="space-y-2 text-black dark:text-black font-bold">
                <p className="leading-relaxed">
                  <strong className="font-bold">計算方式：</strong>每次使用 AI 生成功能時會消耗 1 次用量
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">計算範圍：</strong>BYOK + 系統 key 都算
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">包含功能：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Mode1 對話（每次對話請求 = 1 次）</li>
                  <li>Mode3 一鍵生成（帳號定位、選題推薦、腳本各 = 1 次）</li>
                  <li>Mode1 一鍵生成（帳號定位、選題推薦、腳本各 = 1 次）</li>
                  <li>14 天規劃生成</li>
                </ul>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">重置時間：</strong>每日 00:00 (台灣時間) 自動重置
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">方案限制：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>免費版（Free）：每日 10 次</li>
                  <li>輕量版（Lite）：每日 20 次</li>
                  <li>Pro 方案：每日 300 次</li>
                  <li>MAX 方案：每日 1,000 次</li>
                </ul>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">重要說明：</strong>無論 API 調用成功或失敗，都會計入 1 次用量
                </p>
              </div>
            </div>

            {/* 本月用量 */}
            <div>
              <h3 className="font-semibold text-base mb-3 text-black dark:text-black font-bold">📅 本月用量</h3>
              <div className="space-y-2 text-black dark:text-black font-bold">
                <p className="leading-relaxed">
                  <strong className="font-bold">計算方式：</strong>累計當月所有 AI 生成次數
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">計算範圍：</strong>BYOK + 系統 key 都算（已修復數據一致性問題）
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">限制檢查：</strong>僅對系統 key 使用時進行檢查（BYOK 不受系統 key 限制）
                </p>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">重置時間：</strong>每月 1 日 00:00 (台灣時間) 自動重置
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">方案限制：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>免費版（Free）：每月 100 次</li>
                  <li>輕量版（Lite）：每月 300 次</li>
                  <li>Pro 方案：每月 10,000 次</li>
                  <li>MAX 方案：每月 30,000 次</li>
                </ul>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">重要說明：</strong>使用 BYOK 時，用量會計入統計，但不受系統配額限制
                </p>
              </div>
            </div>

            {/* Premium 用量（僅 Pro、VIP、MAX） */}
            {(planStatus?.plan === 'pro' || planStatus?.plan === 'vip' || planStatus?.plan === 'max') && (
              <div>
                <h3 className="font-semibold text-base mb-3 text-black dark:text-black font-bold">⭐ Premium 本月用量</h3>
                <div className="space-y-2 text-black dark:text-black font-bold">
                  <p className="leading-relaxed">
                    <strong className="font-bold">計算方式：</strong>使用高品質 Premium 模型時會消耗 Premium 用量
                  </p>
                  <p className="leading-relaxed">
                    <strong className="font-bold">計算範圍：</strong>僅系統 key 的 Premium 模式使用
                  </p>
                  <p className="leading-relaxed">
                    <strong className="font-bold">重要限制：</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>❌ <strong>不允許使用 BYOK</strong>：Premium 模式必須使用系統 key</li>
                    <li>✅ 只有同時滿足以下條件才計入 Premium 用量：
                      <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                        <li>用戶選擇 Premium 模式（quality_mode='premium'）</li>
                        <li>使用系統 API key（used_system_key=True）</li>
                        <li>方案為 Pro、VIP 或 MAX</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="leading-relaxed pt-2">
                    <strong className="font-bold">重置時間：</strong>每月 1 日 00:00 (台灣時間) 自動重置
                  </p>
                  <p className="leading-relaxed">
                    <strong className="font-bold">方案限制：</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Pro 方案：每月 2,000 次（僅系統 key）</li>
                    <li>MAX 方案：每月 5,000 次（僅系統 key）</li>
                    <li>VIP 方案：每月 5,000 次（僅系統 key）</li>
                  </ul>
                  <p className="leading-relaxed pt-2">
                    <strong className="font-bold">Premium 模型：</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>VIP/MAX：gemini-2.5-flash-lite（Premium）vs gemini-2.0-flash-lite（Economy）</li>
                    <li>Pro：gemini-2.0-flash（Premium）vs gemini-2.0-flash-lite（Economy）</li>
                  </ul>
                  {planStatus?.limits.vip_premium_default_model && (
                    <p className="leading-relaxed pt-2">
                      <strong className="font-bold">預設 Premium 模型：</strong>
                      <span className="font-mono ml-2">{planStatus.limits.vip_premium_default_model}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* BYOK 說明 */}
            <div>
              <h3 className="font-semibold text-base mb-3 text-black dark:text-black font-bold">🔑 BYOK (Bring Your Own Key) 說明</h3>
              <div className="space-y-2 text-black dark:text-black font-bold">
                <p className="leading-relaxed">
                  <strong className="font-bold">優先順序：</strong>綁定 BYOK 後，系統會優先使用您的 API Key
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">系統保底：</strong>僅在您的 API Key 不可用時（配額用盡、錯誤等），才會使用系統配額
                </p>
                <p className="leading-relaxed">
                  <strong className="font-bold">使用限制：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>✅ <strong>Economy 模式</strong>：所有方案都可以使用 BYOK（自己的 API key）</li>
                  <li>❌ <strong>Premium 模式</strong>：不允許使用 BYOK，必須使用系統 key</li>
                  <li>⚠️ 只有 Pro、VIP、MAX 方案支持 Premium 模式</li>
                </ul>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">用量計算：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>使用 BYOK（用戶自己的 key）</strong>：
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                      <li>✅ 計入 <code className="bg-muted px-1 rounded">daily_used</code> 和 <code className="bg-muted px-1 rounded">monthly_used</code></li>
                      <li>❌ 不計入 <code className="bg-muted px-1 rounded">premium_monthly_used</code>（Premium 模式不允許使用 BYOK）</li>
                      <li>✅ Economy 模式可以使用</li>
                    </ul>
                  </li>
                  <li><strong>使用系統 key</strong>：
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                      <li>✅ 計入 <code className="bg-muted px-1 rounded">daily_used</code> 和 <code className="bg-muted px-1 rounded">monthly_used</code></li>
                      <li>✅ Premium 模式下計入 <code className="bg-muted px-1 rounded">premium_monthly_used</code></li>
                      <li>✅ 所有模式都可以使用（作為保底）</li>
                    </ul>
                  </li>
                </ul>
                <p className="leading-relaxed pt-2">
                  <strong className="font-bold">重要說明：</strong>所有使用都會被統計，確保用量數據的一致性。使用 BYOK 時，用量會計入統計，但不受系統配額限制。
                </p>
              </div>
            </div>

            {/* 重要提示 */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-base mb-2 text-blue-900 dark:text-blue-900 font-bold">💡 重要提示</h3>
              <ul className="space-y-1 text-sm text-blue-900 dark:text-blue-900 font-bold">
                <li>• <strong>用量計算特點</strong>：無論 API 調用成功或失敗，都會計入 1 次用量（在 finally 塊中計入）</li>
                <li>• <strong>時間計算基準</strong>：使用台灣時區（Asia/Taipei），每日重置為 0:00，每月重置為 1 日 0:00</li>
                <li>• <strong>BYOK 使用</strong>：使用 BYOK 時，用量會計入統計，但不受系統配額限制</li>
                <li>• <strong>Premium 模式</strong>：僅 Pro、VIP、MAX 方案支持，且不允許使用 BYOK，必須使用系統 key</li>
                <li>• <strong>用量統計</strong>：會即時更新，您可以在這裡隨時查看</li>
                <li>• <strong>達到上限</strong>：需要等待重置或升級方案</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

