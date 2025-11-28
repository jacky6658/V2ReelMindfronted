/**
 * Forum - 論壇介紹頁面
 * AIJob 學院 Discord 社群介紹
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, Users, BookOpen } from 'lucide-react';

export default function Forum() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-200">
              🚀 AIJob 學院 · Discord 社群
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">
              一起把短影音做成「可複製的系統」
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              一鍵生成分享｜AI 顧問問答｜IP 人設規劃｜創作者資料庫整合。加入 Discord，邊做邊學邊上片。
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="https://AIJobschool.short.gy/UUwpEG" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  立即加入 Discord
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#channels">
                  熱門頻道
                </a>
              </Button>
            </div>
            
            {/* 跑馬燈 */}
            <div className="mt-12 pt-4 border-t border-border flex flex-wrap gap-8 justify-center text-sm font-bold text-blue-600">
              <span>🔥 #一鍵生成工作區 每天新貼文 30+</span>
              <span>🧭 #IP人設規劃 真實案例交流</span>
              <span>🤖 #AI顧問問答 節奏 / Hook / CTA</span>
              <span>📦 你的成果可存回「創作者資料庫」</span>
            </div>
          </div>
        </div>
      </div>

      {/* 社群日常時間軸 */}
      <div className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-foreground">社群日常｜今天在討論什麼？</h2>
        
        <div className="relative max-w-2xl pl-8">
          {/* Timeline 線 */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
          
          {/* Timeline Items */}
          <div className="space-y-4">
            {[
              {
                time: '09:32',
                channel: '#一鍵生成工作區',
                title: '美股盤後速報：如何做 20 秒短評？',
                content: '用 3 句話框，Hook→數據→CTA，並附上下一支預告。'
              },
              {
                time: '13:15',
                channel: '#AI顧問問答',
                title: '台灣女性受眾語氣，哪些詞更自然？',
                content: '把口氣從「教導」改為「陪伴」，並加入在地口語轉場。'
              },
              {
                time: '20:41',
                channel: '#IP人設規劃',
                title: '14 天上片節奏：週一腳本、週三錄影、週末輪播',
                content: '建立固定節點，資料庫版本管理更好找。'
              }
            ].map((item, index) => (
              <Card key={index} className="relative">
                <div className="absolute -left-5 top-5 w-3 h-3 rounded-full bg-blue-500 border-2 border-background" />
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.time} · {item.channel}
                  </div>
                  <h3 className="font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 頻道地圖 */}
      <div id="channels" className="bg-muted/50 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8 text-foreground">頻道地圖｜先從這三個開始</h2>
          
          <div className="max-w-3xl">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: '📌', name: '#歡迎與規則', desc: '貼文格式、友善交流' },
                    { icon: '⚡', name: '#一鍵生成工作區', desc: '貼成果拿回饋' },
                    { icon: '🤖', name: '#AI顧問問答', desc: '定位/節奏/變現' },
                    { icon: '🧭', name: '#IP人設規劃', desc: 'Profile＋14天' }
                  ].map((channel, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-dashed border-blue-300 rounded-lg">
                      <span className="text-xl">{channel.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-foreground">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">{channel.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground mb-4">
                  ✅ 建議順序：#歡迎與規則 → #IP人設規劃 → #一鍵生成工作區
                </div>
                
                <Button asChild>
                  <a href="https://AIJobschool.short.gy/UUwpEG" target="_blank" rel="noopener noreferrer">
                    <Users className="w-4 h-4 mr-2" />
                    加入 Discord
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 聯絡方式 */}
      <div className="container py-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-foreground">聯絡方式</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold mb-4 text-foreground">LINE 官方帳號</div>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <a href="https://AIJobschool.short.gy/E49kA8" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  加入 LINE 好友
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold mb-4 text-foreground">Discord</div>
              <Button asChild className="bg-blue-500 hover:bg-blue-600">
                <a href="https://AIJobschool.short.gy/UUwpEG" target="_blank" rel="noopener noreferrer">
                  <Users className="w-4 h-4 mr-2" />
                  AIJob 學院
                </a>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="font-bold mb-4 text-foreground">LINE 社群</div>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <a 
                  href="https://line.me/ti/g2/xaKhtD6TG78lZ8tOLP2T4Lz0zD-edf8GJF8x5w?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  加入 LINE 社群
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
