/**
 * Intro - 產品 / 智能體介紹頁面
 * ReelMind AI 短影音智能體產品介紹
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Target, 
  FileText, 
  Calendar,
  Database,
  ArrowRight,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGet } from '@/lib/api-client';
import { toast } from 'sonner';

export default function Intro() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      // 使用與 Login.tsx 相同的登入邏輯
      // 使用新版前端的專用端點 /api/auth/google-new
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google-new');
      window.location.href = auth_url;
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error('登入失敗，請稍後再試');
    }
  };
  
  const features = [
    {
      icon: Sparkles,
      title: 'AI 生成腳本',
      description: '一鍵生成短影音腳本，支援多種腳本結構，從 Hook 到 CTA 完整規劃'
    },
    {
      icon: Target,
      title: 'AI 帳號定位',
      description: '智能分析目標受眾，建立清晰的 IP 人設，規劃內容方向'
    },
    {
      icon: FileText,
      title: 'IP 人設規劃',
      description: 'AI 顧問對話式規劃，建立完整的 IP Profile 和 14 天內容規劃'
    },
    {
      icon: Calendar,
      title: '14 天短影音規劃',
      description: '自動生成 14 天內容規劃表，包含選題、腳本、發布時程'
    },
    {
      icon: Database,
      title: '創作者資料庫',
      description: '集中管理所有腳本、對話記錄、生成結果，隨時查看與編輯'
    },
    {
      icon: Zap,
      title: '多平台優化',
      description: '針對 IG、TikTok、YouTube Shorts 等平台優化腳本內容'
    }
  ];

  const useCases = [
    {
      title: '內容創作者',
      description: '從靈感枯竭到內容量產，AI 幫你生成爆款腳本',
      features: ['無限次 AI 對話', '一鍵生成腳本', '14 天規劃表']
    },
    {
      title: '品牌行銷',
      description: '建立清晰的品牌 IP 定位，規劃系列短影音內容',
      features: ['IP 人設規劃', '內容策略制定', '多平台優化']
    },
    {
      title: '個人品牌',
      description: '打造個人 IP，建立專業的短影音內容系統',
      features: ['帳號定位分析', '長期內容規劃', '資料庫管理']
    }
  ];

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
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              AI 短影音智能體
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ReelMind
              <span className="text-primary">.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              從靈感枯竭到內容量產，專為 IG、TikTok、YouTube Shorts 打造的 AI 短影音智能體平台
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}
              >
                免費體驗
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/pricing')}
              >
                查看方案
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 核心功能 */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">核心功能</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            完整的 AI 短影音創作工具鏈，從定位到生成，一次完成
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 適用場景 */}
      <div className="bg-muted/50 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">適用場景</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              無論您是內容創作者、品牌行銷或個人品牌，ReelMind 都能幫助您
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container py-16">
        <Card className="border-2 border-primary">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">準備開始了嗎？</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              立即體驗 ReelMind AI 短影音智能體，或選擇適合的方案開始使用
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                onClick={isLoggedIn ? () => navigate('/app') : handleGoogleLogin}
              >
                免費體驗
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/pricing')}
              >
                查看方案
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
