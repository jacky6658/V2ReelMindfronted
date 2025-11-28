import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Palette, Check } from "lucide-react";
import { useColorTheme, colorThemes, ColorTheme } from "@/contexts/ColorThemeContext";
import { useState } from "react";

export function ColorThemePicker() {
  const { theme: currentTheme, setTheme } = useColorTheme();
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (theme: ColorTheme) => {
    setTheme(theme);
    // 延遲關閉對話框，讓用戶看到選擇效果
    setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="glass border-border/50 hover:bg-primary/10"
          title="選擇配色方案"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">選擇配色方案</DialogTitle>
          <DialogDescription className="text-base">
            選擇最適合您的配色風格，所有方案都經過精心設計，確保美觀性和可讀性
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {(Object.entries(colorThemes) as [ColorTheme, typeof colorThemes[ColorTheme]][]).map(
            ([themeKey, themeData]) => {
              const isSelected = currentTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => handleThemeSelect(themeKey)}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300
                    hover:scale-[1.02] hover:shadow-lg
                    ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/50 hover:border-primary/50"
                    }
                  `}
                >
                  {/* 配色預覽 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: themeData.preview.primary }}
                    />
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: themeData.preview.secondary }}
                    />
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border border-border/30"
                      style={{ backgroundColor: themeData.preview.background }}
                    />
                  </div>

                  {/* 配色資訊 */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{themeData.name}</h3>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-primary text-sm font-medium">
                          <Check className="h-4 w-4" />
                          <span>使用中</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{themeData.description}</p>
                  </div>

                  {/* 選中指示器 */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            }
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center pt-2 border-t border-border/50">
          💡 提示：配色方案會自動保存，下次訪問時會記住您的選擇
        </div>
      </DialogContent>
    </Dialog>
  );
}
