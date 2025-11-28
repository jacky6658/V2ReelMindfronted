/**
 * Contact - 聯繫我們頁面
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Users, Briefcase } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container py-16 md:py-24 text-center">
          <Badge className="mb-4">
            <Mail className="w-3 h-3 mr-1" />
            聯繫我們
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            讓我們一起創造價值
            <span className="text-primary">.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            無論是產品諮詢、企業合作或技術支援，我們都樂意為您服務
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Email Contact */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>電子郵件</CardTitle>
              </div>
              <CardDescription>
                最快速的聯繫方式，我們會在 24 小時內回覆
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:aiagent168168@gmail.com"
                className="text-primary hover:underline font-medium"
              >
                aiagent168168@gmail.com
              </a>
            </CardContent>
          </Card>

          {/* Customer Service */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>客服支援</CardTitle>
              </div>
              <CardDescription>
                訂閱用戶享有優先客服支援
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                服務時間：週一至週五 9:00 - 18:00
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Services */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">企業服務</h2>
            <p className="text-muted-foreground">
              為企業客戶提供客製化解決方案
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>企業培訓</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 短影音創作工作坊</li>
                  <li>• AI 工具應用培訓</li>
                  <li>• 內容行銷策略諮詢</li>
                  <li>• 團隊建置與管理</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>客製化方案</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• API 整合服務</li>
                  <li>• 私有化部署</li>
                  <li>• 品牌客製化</li>
                  <li>• 專屬功能開發</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">常見問題</h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">如何開始使用 ReelMind？</h3>
                <p className="text-muted-foreground">
                  您可以先使用「立即體驗」功能免費體驗 AI 生成腳本，滿意後再選擇適合的訂閱方案。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">企業方案如何計價？</h3>
                <p className="text-muted-foreground">
                  企業方案根據使用人數、功能需求和服務內容客製化報價。請透過電子郵件聯繫我們，我們會安排專人為您服務。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">技術支援時間？</h3>
                <p className="text-muted-foreground">
                  一般用戶：電子郵件支援，24 小時內回覆<br />
                  訂閱用戶：優先支援，工作時間內 4 小時內回覆<br />
                  企業用戶：專屬客服，即時支援
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">是否提供發票？</h3>
                <p className="text-muted-foreground">
                  是的，所有訂閱和企業服務都會提供電子發票。如需統一編號，請在訂閱時填寫公司資訊。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">準備好開始了嗎？</h3>
              <p className="text-muted-foreground mb-6">
                立即聯繫我們，讓 AI 幫助您的短影音創作更上一層樓
              </p>
              <a 
                href="mailto:aiagent168168@gmail.com"
                className="inline-flex items-center justify-center h-12 px-8 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-5 h-5 mr-2" />
                發送郵件
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
