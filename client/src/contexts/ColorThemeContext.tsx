import React, { createContext, useContext, useState, useEffect } from "react";

export type ColorTheme = 
  | "light-tech"      // 淺色科技感（當前）
  | "dark-tech"       // 深色科技感
  | "ocean-blue"      // 海洋藍
  | "sunset-orange"   // 日落橙
  | "forest-green";   // 森林綠

interface ColorThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const colorThemes = {
  "light-tech": {
    name: "淺色科技感",
    description: "清新專業，適合日間使用",
    preview: {
      primary: "#0ea5e9",
      secondary: "#10b981",
      background: "#f8f9fb",
    },
    colors: {
      primary: "oklch(0.55 0.20 220)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.60 0.18 160)",
      secondaryForeground: "oklch(0.98 0 0)",
      accent: "oklch(0.65 0.25 195)",
      accentForeground: "oklch(0.10 0.01 240)",
      background: "oklch(0.98 0.002 240)",
      foreground: "oklch(0.20 0.01 240)",
      card: "oklch(1 0 0 / 0.8)",
      cardForeground: "oklch(0.20 0.01 240)",
      muted: "oklch(0.95 0.005 240)",
      mutedForeground: "oklch(0.45 0.01 240)",
      border: "oklch(0.88 0.005 240 / 0.4)",
      videoOpacity: "0.25",
      videoFilter: "brightness(1.2) saturate(0.8)",
    },
  },
  "dark-tech": {
    name: "深色科技感",
    description: "沉穩專業，適合夜間使用",
    preview: {
      primary: "#0ea5e9",
      secondary: "#6366f1",
      background: "#0a0e1a",
    },
    colors: {
      primary: "oklch(0.55 0.20 220)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.58 0.22 265)",
      secondaryForeground: "oklch(0.98 0 0)",
      accent: "oklch(0.65 0.25 195)",
      accentForeground: "oklch(0.15 0.01 240)",
      background: "oklch(0.12 0.01 240)",
      foreground: "oklch(0.95 0.005 240)",
      card: "oklch(0.18 0.015 240 / 0.5)",
      cardForeground: "oklch(0.95 0.005 240)",
      muted: "oklch(0.22 0.015 240)",
      mutedForeground: "oklch(0.65 0.01 240)",
      border: "oklch(0.25 0.02 240 / 0.3)",
      videoOpacity: "1",
      videoFilter: "none",
    },
  },
  "ocean-blue": {
    name: "海洋藍",
    description: "深邃寧靜，專業可信賴",
    preview: {
      primary: "#0284c7",
      secondary: "#06b6d4",
      background: "#f0f9ff",
    },
    colors: {
      primary: "oklch(0.52 0.18 230)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.68 0.15 200)",
      secondaryForeground: "oklch(0.98 0 0)",
      accent: "oklch(0.75 0.12 210)",
      accentForeground: "oklch(0.15 0.01 230)",
      background: "oklch(0.97 0.008 230)",
      foreground: "oklch(0.18 0.015 230)",
      card: "oklch(1 0 0 / 0.85)",
      cardForeground: "oklch(0.18 0.015 230)",
      muted: "oklch(0.94 0.01 230)",
      mutedForeground: "oklch(0.42 0.015 230)",
      border: "oklch(0.86 0.01 230 / 0.4)",
      videoOpacity: "0.3",
      videoFilter: "brightness(1.1) saturate(0.9) hue-rotate(10deg)",
    },
  },
  "sunset-orange": {
    name: "日落橙",
    description: "溫暖活力，創意十足",
    preview: {
      primary: "#f97316",
      secondary: "#fb923c",
      background: "#fffbf5",
    },
    colors: {
      primary: "oklch(0.68 0.20 35)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.72 0.18 50)",
      secondaryForeground: "oklch(0.98 0 0)",
      accent: "oklch(0.75 0.22 25)",
      accentForeground: "oklch(0.15 0.01 35)",
      background: "oklch(0.98 0.005 50)",
      foreground: "oklch(0.20 0.015 35)",
      card: "oklch(1 0 0 / 0.85)",
      cardForeground: "oklch(0.20 0.015 35)",
      muted: "oklch(0.95 0.008 50)",
      mutedForeground: "oklch(0.45 0.015 35)",
      border: "oklch(0.88 0.01 50 / 0.4)",
      videoOpacity: "0.22",
      videoFilter: "brightness(1.15) saturate(0.85) hue-rotate(-30deg)",
    },
  },
  "forest-green": {
    name: "森林綠",
    description: "自然清新，健康環保",
    preview: {
      primary: "#059669",
      secondary: "#10b981",
      background: "#f0fdf4",
    },
    colors: {
      primary: "oklch(0.55 0.18 155)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.65 0.16 165)",
      secondaryForeground: "oklch(0.98 0 0)",
      accent: "oklch(0.70 0.14 150)",
      accentForeground: "oklch(0.15 0.01 155)",
      background: "oklch(0.98 0.008 155)",
      foreground: "oklch(0.18 0.015 155)",
      card: "oklch(1 0 0 / 0.85)",
      cardForeground: "oklch(0.18 0.015 155)",
      muted: "oklch(0.95 0.01 155)",
      mutedForeground: "oklch(0.42 0.015 155)",
      border: "oklch(0.86 0.012 155 / 0.4)",
      videoOpacity: "0.28",
      videoFilter: "brightness(1.1) saturate(0.9) hue-rotate(80deg)",
    },
  },
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("reelmind-color-theme");
    return (saved as ColorTheme) || "light-tech";
  });

  useEffect(() => {
    const root = document.documentElement;
    const colors = colorThemes[theme].colors;

    // 應用顏色變數
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.accentForeground);
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-foreground", colors.cardForeground);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--muted-foreground", colors.mutedForeground);
    root.style.setProperty("--border", colors.border);

    // 應用影片樣式
    root.style.setProperty("--video-opacity", colors.videoOpacity);
    root.style.setProperty("--video-filter", colors.videoFilter);

    // 保存到 localStorage
    localStorage.setItem("reelmind-color-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ColorThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}
