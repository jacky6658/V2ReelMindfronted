import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, Share2, Plus } from 'lucide-react';

export default function PWAInstallGuide() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">將 ReelMind 安裝到手機</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            將 ReelMind 加入主畫面，隨時隨地使用 AI 短影音智能體，享受更流暢的使用體驗
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* iOS 安裝教學 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">iOS 安裝教學</CardTitle>
              </div>
              <CardDescription>
                適用於 iPhone 和 iPad（Safari 瀏覽器）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">開啟 Safari 瀏覽器</p>
                    <p className="text-xs text-muted-foreground">
                      在 iPhone 或 iPad 上使用 Safari 瀏覽器開啟 ReelMind
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">點擊分享按鈕</p>
                    <p className="text-xs text-muted-foreground">
                      點擊瀏覽器底部的 <span className="font-semibold text-primary">分享</span> 按鈕
                      <Share2 className="w-4 h-4 inline-block ml-1 text-primary" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">選擇「加入主畫面」</p>
                    <p className="text-xs text-muted-foreground">
                      在分享選單中向下滾動，選擇 <span className="font-semibold text-primary">「加入主畫面」</span>
                      <Plus className="w-4 h-4 inline-block ml-1 text-primary" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">確認安裝</p>
                    <p className="text-xs text-muted-foreground">
                      點擊右上角的「加入」，ReelMind 就會出現在主畫面上
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android 安裝教學 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Android 安裝教學</CardTitle>
              </div>
              <CardDescription>
                適用於 Android 手機和平板（Chrome 瀏覽器）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">開啟 Chrome 瀏覽器</p>
                    <p className="text-xs text-muted-foreground">
                      在 Android 手機或平板上使用 Chrome 瀏覽器開啟 ReelMind
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">點擊選單按鈕</p>
                    <p className="text-xs text-muted-foreground">
                      點擊瀏覽器右上角的三點選單 <span className="font-semibold text-primary">「⋮」</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">選擇「安裝應用程式」</p>
                    <p className="text-xs text-muted-foreground">
                      在選單中找到 <span className="font-semibold text-primary">「安裝應用程式」</span> 或 <span className="font-semibold text-primary">「加入主畫面」</span>
                      <Download className="w-4 h-4 inline-block ml-1 text-primary" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">確認安裝</p>
                    <p className="text-xs text-muted-foreground">
                      點擊「安裝」，ReelMind 就會安裝到主畫面，像原生 App 一樣使用
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 額外說明 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <Download className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">自動更新：</span>
              當網頁版更新時，PWA 版本會自動同步更新，無需手動重新安裝
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

