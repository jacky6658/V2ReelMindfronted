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
import { ArrowLeft, Key, Eye, EyeOff, Trash2, CheckCircle2, XCircle, Loader2, Download, ExternalLink, FileText } from 'lucide-react';
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

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [keys, setKeys] = useState<LLMKey[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelsResponse | null>(null);
  
  // 表單狀態
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState<string>('__default__');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showLLMKeyGuideDialog, setShowLLMKeyGuideDialog] = useState(false);
  

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

  useEffect(() => {
    loadKeys();
    loadAvailableModels();
  }, [user?.user_id]);

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

    if (!user?.user_id) {
      toast.error('請先登入');
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

    if (!user?.user_id) {
      toast.error('請先登入');
      return;
    }

    try {
      setSaving(true);
      
      await apiPost('/api/user/llm-keys', {
        user_id: user.user_id,
        provider,
        api_key: apiKey,
        model_name: modelName && modelName !== '' && modelName !== '__default__' ? modelName : undefined
      });

      toast.success('API Key 已保存');
      setApiKey('');
      setTestResult(null);
      await loadKeys(); // 重新載入列表
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '保存失敗，請稍後再試';
      toast.error(errorMessage);
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLLMKeyGuideDialog(true)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                如何取得
              </Button>
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
                      選擇特定模型，或留空使用系統預設
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

            {/* 如何取得 API Key */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/guide/how-to-get-llm-api-key')}
              >
                <FileText className="w-4 h-4 mr-2" />
                如何取得 LLM API Key
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

