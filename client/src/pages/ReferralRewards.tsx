import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ReferralRewards() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* 導航欄 */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <h1 className="text-xl font-bold">推薦邀請獎勵機制</h1>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="container py-12 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg p-6 md:p-8 border-2 border-primary/20 space-y-6">
          {/* 標題 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                推薦邀請獎勵機制
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                邀請好友一起使用 ReelMind，雙方都能獲得獎勵！
              </p>
            </div>
          </div>

          {/* 獎勵表格 */}
          <div className="space-y-4">
            {/* 基礎獎勵 */}
            <Card className="border-green-500/30 bg-background/80">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">基礎獎勵（無上限）</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        每成功邀請一位好友註冊即可獲得
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    立即獲得
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <p className="text-sm text-foreground">
                    每成功邀請一位好友註冊，<strong className="text-green-600 font-bold">邀請人</strong>可獲得
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    🎁 +50 次本月額度
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    💡 <strong className="text-foreground">最多邀請 10 位用戶</strong>，基礎獎勵最多可獲得 <strong className="text-primary">+500 次本月額度</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 額外獎勵 */}
            <Card className="border-2 border-purple-500/40 bg-background/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">⭐</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">額外獎勵（二擇一）</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        任一完成後即無獎勵，後續有新活動另外公布
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    限時活動
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                {/* 選項 1 */}
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-500 font-bold text-base">選項 A</span>
                    <Badge variant="outline" className="text-xs">熱門</Badge>
                  </div>
                  <p className="text-sm text-foreground mb-2">
                    累積邀請 <strong className="text-purple-500 font-bold text-lg">10 位用戶</strong> →
                  </p>
                  <p className="text-base text-primary font-bold">
                    🎉 可獲得 <strong className="text-xl">+500 次本月額度</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">（每個推薦人只能獲得一次，二擇一）</p>
                </div>

                {/* 選項 2 */}
                <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-pink-500 font-bold text-base">選項 B</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">快速達成</Badge>
                  </div>
                  <p className="text-sm text-foreground mb-2">
                    邀請的好友中有一位完成 <strong className="text-pink-500 font-bold">月付或年付付款</strong> →
                  </p>
                  <p className="text-base text-primary font-bold">
                    🎉 可獲得 <strong className="text-xl">+500 次本月額度</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">（每個推薦人只能獲得一次，二擇一）</p>
                </div>
              </CardContent>
            </Card>

            {/* FOMO 提示 */}
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔥</span>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      為什麼要現在開始邀請？
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>邀請越多，額外額度越多（基礎獎勵最多 +500 次，額外獎勵 +500 次，總計最多 +1000 次）</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>額外獎勵活動可能隨時結束，把握機會！</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>好友訂閱後，您也能立即獲得 +500 次本月額度</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 行動按鈕 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => navigate('/profile')}
            >
              <Gift className="w-5 h-5 mr-2" />
              查看我的推薦碼
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/pricing')}
            >
              前往訂閱
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

