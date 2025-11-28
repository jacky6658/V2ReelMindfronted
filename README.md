# ReelMind React 專案開發文件

> **專案版本**: 3672ac4c  
> **最後更新**: 2025-11-27  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [已完成功能](#已完成功能)
3. [待完成工作](#待完成工作)
4. [技術架構](#技術架構)
5. [部署指南](#部署指南)
6. [API 對接說明](#api-對接說明)
7. [開發注意事項](#開發注意事項)

---

## 專案概述

ReelMind 是一個 AI 短影音智能體平台，從靈感枯竭到內容量產，專為 IG、TikTok、Shorts 打造。本專案將原始的純 HTML 網站轉換為現代化的 React 應用，保留深色科技感設計風格，並整合 Python FastAPI 後端。

### 核心功能
- **Mode1（IP 人設規劃）**: AI 對話式帳號定位、14天規劃、今日腳本生成
- **Mode3（一鍵生成）**: 表單式 3 步驟生成（帳號定位 + 選題建議 + 腳本內容）
- **Experience（免費體驗）**: 與 Mode3 相同功能，無需登入
- **UserDB（使用者資料）**: 腳本、對話、生成記錄管理
- **實戰指南**: 12 篇專業文章（部分內容待補充）
- **訂閱付款**: 綠界金流整合

---

## ✅ 已完成功能

### 1. 核心頁面
- [x] **首頁（Home）**
  - Hero 區塊（3D 流體動畫影片背景）
  - 核心功能介紹
  - 解決創作者痛點
  - 實戰指南預覽
  - 定價方案
  - CTA 區塊
  - 深色/淺色主題切換（右上角）

- [x] **Mode3（一鍵生成）**
  - 3 步驟進度指示器
  - 步驟 1：填寫需求表單
    - 主題或產品
    - 帳號定位
    - 影片目標（流量型/轉換型/教育型）
    - 社群平台（TikTok/IG/小紅書/YouTube/Facebook）
    - 腳本秒數（15/30/45/60秒）
    - 常用腳本結構（A/B/C/D/E 五種）
    - 補充說明（選填）
  - 步驟 2：確認資訊
  - 步驟 3：生成結果（帳號定位、選題建議、腳本內容）
  - 後端 API 對接（需部署後測試）

- [x] **Experience（免費體驗）**
  - 與 Mode3 相同的表單式 3 步驟生成功能
  - 無需登入即可使用

- [x] **Mode1（IP 人設規劃）**
  - AI 對話介面
  - 標籤頁切換（帳號定位、14天規劃、今日腳本）
  - 歷史記錄查看
  - 基礎功能已實現
  - ⚠️ **待補充**：快速按鈕、生成結果管理、自動儲存（見下方待完成工作）

- [x] **UserDB（使用者資料管理）**
  - 標籤頁切換（腳本庫、對話記錄、生成記錄）
  - 資料表格顯示
  - 搜尋和篩選功能
  - 基礎 CRUD 操作
  - ⚠️ **待優化**：與 Mode1 的儲存功能整合

- [x] **Guide（實戰指南）**
  - 12 篇文章列表
  - 分類篩選（全部/腳本技巧/平台策略/內容規劃/數據分析）
  - 文章詳情頁面
  - 粗體文字正確渲染
  - ⚠️ **待補充**：9 篇文章的詳細內容（目前只有 3 篇完整）

- [x] **About（關於我們）**
  - 公司介紹
  - 團隊願景
  - 核心價值

- [x] **Subscription（訂閱方案）**
  - 三種方案（基礎版/專業版/企業版）
  - 月繳/年繳切換
  - 綠界金流整合
  - 後端 API 對接

- [x] **Contact（聯繫我們）**
  - 聯絡表單
  - 社群媒體連結

- [x] **PaymentResult（付款結果）**
  - 綠界金流回調處理
  - 成功/失敗狀態顯示

### 2. 技術功能
- [x] **SEO 優化**
  - Meta 標籤（Title、Description、Keywords）
  - Open Graph 標籤（Facebook 分享）
  - Twitter Card 標籤
  - Structured Data（JSON-LD）
  - Canonical URL
  - robots.txt
  - sitemap.xml

- [x] **主題系統**
  - 深色/淺色主題切換
  - localStorage 保存偏好
  - CSS 變數系統
  - ⚠️ **待修復**：部分區域未跟隨主題（見下方待完成工作）

- [x] **API 整合**
  - API 客戶端（apiGet、apiPost、apiStream）
  - SSE 流式回應處理
  - 錯誤處理和 Toast 提示
  - CORS 配置檢查

- [x] **認證系統**
  - Google OAuth 整合
  - JWT Token 管理
  - 登入狀態檢查
  - OAuth 回調處理
  - ⚠️ **已移除登入保護**以便本地預覽（部署後需恢復）

- [x] **響應式設計**
  - 支援桌面、平板、手機
  - Tailwind CSS 響應式斷點
  - 移動端優化

---

## 📋 待完成工作

### 🔴 高優先級

#### 1. Mode1 IP 人設規劃功能增強
**目標**: 參考原始設計，添加缺少的核心功能

**待實現功能**:
- [ ] **使用說明彈窗**
  - 更新內容為原始設計的說明
  - 包含 4 個步驟：開始對話、深度交流、AI 生成內容、儲存生成內容
  
- [ ] **快速按鈕**（對話框上方）
  - IP Profile - 建立 IP 人設檔案
  - 14天規劃 - 生成 14 天內容規劃
  - 今日腳本 - 生成今日腳本
  - 換腳本結構 - 提供 A/B/C/D/E 五種結構選擇
  - 重新定位 - 顯示內容策略矩陣表格
  - 點擊後自動填入對應的 prompt

- [ ] **生成結果管理彈窗**
  - 標籤頁切換：帳號定位、選題方向、短影音腳本
  - 每則結果的操作按鈕：
    - ✅ 選擇（套用結果並繼續對話）
    - 📖 展開（新彈窗顯示完整內容）
    - 💾 儲存到創作者資料庫（存到 UserDB）
    - 🗑️ 刪除
    - ✏️ 編輯標題
  - 結果卡片顯示：標題、內容預覽、時間戳記

- [ ] **自動儲存功能**
  - 檢測對話中的「儲存」關鍵字
  - 自動分類儲存到對應標籤頁
  - 顯示儲存成功提示

- [ ] **長期記憶系統**
  - 儲存用戶的 IP 人設資訊
  - 在後續對話中自動引用

**實現參考**:
- 原始檔案: `/home/ubuntu/upload/mode1.html`
- 原始 JS: `/home/ubuntu/upload/ReelMindfrontnd-main/assets/js/mode1.js` (2641 行)
- 截圖: 
  - 使用說明: `截圖2025-11-27下午10.23.39.png`
  - 生成結果: `截圖2025-11-27下午10.24.15.png`
  - 快速按鈕: `截圖2025-11-27下午10.26.50.png`

**技術要點**:
```typescript
// 快速按鈕實現
const quickButtons = [
  { label: 'IP Profile', prompt: '請幫我建立 IP 人設檔案...' },
  { label: '14天規劃', prompt: '請幫我生成 14 天的短影音內容規劃。' },
  // ...
];

// 生成結果資料結構
interface SavedResult {
  id: string;
  title: string;
  content: string;
  category: 'positioning' | 'topics' | 'script';
  timestamp: Date;
  isEditing?: boolean;
}

// 自動儲存檢測
const detectSaveIntent = (message: string) => {
  const saveKeywords = ['儲存', '保存', '存起來', 'save'];
  return saveKeywords.some(keyword => message.includes(keyword));
};
```

#### 2. UserDB 與 Mode1 整合
**目標**: 實現 Mode1 的「儲存到創作者資料庫」功能

**待實現**:
- [ ] Mode1 生成結果可以直接儲存到 UserDB
- [ ] UserDB 可以查看和管理從 Mode1 儲存的內容
- [ ] 資料同步和更新機制

#### 3. 主題切換修復
**問題**: 目前只有 Hero 區域跟隨深色主題，其他區域（核心功能、解決痛點等）仍是白色/淺灰色背景

**待修復**:
- [ ] 修改 Home.tsx 中的固定背景顏色類別
- [ ] 確保所有 section 使用 `bg-background` 而非 `bg-muted/50`
- [ ] 測試深色/淺色主題切換在所有頁面的效果

**技術要點**:
```tsx
// 錯誤示例（固定淺色背景）
<section className="bg-muted/50">

// 正確示例（跟隨主題）
<section className="bg-background">
```

### 🟡 中優先級

#### 4. 實戰指南內容補充
**目標**: 補充剩餘 9 篇文章的詳細內容

**已完成**:
- ✅ 3 篇文章有完整內容：
  1. 三步驟生成 30 秒短影音腳本
  2. 如何用 AI 快速找到爆款選題
  3. 短影音腳本的黃金開場 3 秒

**待補充**:
- [ ] 4. 5 種短影音腳本結構解析
- [ ] 5. IG Reels vs TikTok：平台差異化策略
- [ ] 6. 如何用數據優化短影音內容
- [ ] 7. 14 天短影音內容規劃完整指南
- [ ] 8. 從 0 到 1：新手創作者起步攻略
- [ ] 9. 短影音變現：廣告、業配、帶貨全解析
- [ ] 10. AI 工具如何提升創作效率 10 倍
- [ ] 11. 短影音 SEO：如何讓你的影片被更多人看到
- [ ] 12. 創作者常見錯誤與解決方案

**內容要求**:
- 每篇 1000-2000 字
- 包含實用範例和技巧
- 表格和列表美化呈現
- SEO meta 標籤優化

**技術要點**:
```typescript
// 文章資料結構
{
  slug: 'article-slug',
  title: '文章標題',
  description: 'SEO 描述',
  category: '分類',
  readTime: '閱讀時間',
  date: '發布日期',
  sections: [
    {
      title: '章節標題',
      content: '段落內容...',
      type: 'paragraph' | 'list' | 'table'
    }
  ]
}
```

#### 5. 表格美化
**目標**: 優化實戰指南文章中的表格呈現

**待優化**:
- [ ] 使用 shadcn/ui 的 Table 組件
- [ ] 添加響應式滾動
- [ ] 美化表格樣式（邊框、間距、顏色）
- [ ] 支援深色/淺色主題

**技術要點**:
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>欄位 1</TableHead>
        <TableHead>欄位 2</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>資料 1</TableCell>
        <TableCell>資料 2</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### 🟢 低優先級

#### 6. 舊檔案清理
**問題**: 專案中可能包含舊的 HTML 檔案

**待確認**:
- [ ] 檢查 `client/public` 目錄是否有舊的 HTML 檔案
- [ ] 確認是否需要刪除或保留
- [ ] 更新 `.gitignore` 排除不需要的檔案

#### 7. 性能優化
- [ ] 程式碼分割（Code Splitting）
- [ ] 圖片懶載入（Lazy Loading）
- [ ] 影片優化（壓縮、格式轉換）
- [ ] Bundle 大小分析

#### 8. 測試
- [ ] 單元測試（Vitest）
- [ ] 整合測試
- [ ] E2E 測試（Playwright）
- [ ] 跨瀏覽器測試

---

## 技術架構

### 前端技術棧
```
React 19
├── TypeScript 5.x
├── Vite 6.x
├── Tailwind CSS 4.x
├── shadcn/ui
├── Wouter (路由)
└── Sonner (Toast 提示)
```

### 專案結構
```
reelmind_demo/
├── client/
│   ├── public/
│   │   ├── 7043c9b7-b85b-4d28-afc6-f0b9a8e4d8a9.mp4  # 3D 流體動畫影片
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/          # shadcn/ui 組件
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── data/
│   │   │   └── guide-articles.ts  # 實戰指南文章資料
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api-client.ts     # API 客戶端
│   │   │   ├── api-config.ts     # API 配置
│   │   │   ├── auth.ts           # 認證模組
│   │   │   └── google-auth.ts    # Google OAuth
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Mode1.tsx         # IP 人設規劃
│   │   │   ├── Mode3.tsx         # 一鍵生成
│   │   │   ├── UserDB.tsx        # 使用者資料
│   │   │   ├── Experience.tsx    # 免費體驗
│   │   │   ├── Guide.tsx         # 實戰指南列表
│   │   │   ├── GuideArticle.tsx  # 文章詳情
│   │   │   ├── About.tsx
│   │   │   ├── Subscription.tsx  # 訂閱方案
│   │   │   ├── Contact.tsx
│   │   │   ├── PaymentResult.tsx
│   │   │   └── OAuthCallback.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── PROJECT_README.md  # 本文件
```

### 後端 API 端點

**基礎 URL**: `https://api.aijob.com.tw`

#### 認證相關
- `GET /api/auth/google` - Google OAuth 登入
- `GET /api/auth/google/callback` - OAuth 回調
- `POST /api/auth/logout` - 登出

#### Mode1 IP 人設規劃
- `POST /api/generate/positioning` - 生成帳號定位（流式）
- `POST /api/generate/topics` - 生成選題方向（流式）
- `POST /api/generate/script` - 生成短影音腳本（流式）
- `GET /api/ip-planning/my` - 獲取我的 IP 規劃歷史

#### Mode3 一鍵生成
- `POST /api/mode3/generate` - 一鍵生成（流式）
  - 請求格式：
    ```json
    {
      "topic": "健身教學",
      "target_audience": "25-35歲上班族",
      "video_goal": "教育型",
      "platform": "Instagram Reels",
      "duration": 30,
      "script_structure": "D",
      "additional_notes": "選填"
    }
    ```
  - 回應格式（SSE）：
    ```
    data: {"type": "positioning", "content": "..."}
    data: {"type": "topics", "content": "..."}
    data: {"type": "script", "content": "..."}
    data: [DONE]
    ```

#### UserDB 使用者資料
- `GET /api/userdb/scripts` - 獲取腳本庫
- `GET /api/userdb/conversations` - 獲取對話記錄
- `GET /api/userdb/generations` - 獲取生成記錄
- `POST /api/userdb/save` - 儲存資料
- `DELETE /api/userdb/:id` - 刪除資料
- `PUT /api/userdb/:id` - 更新資料

#### 訂閱付款（綠界金流）
- `POST /api/subscription/create-payment` - 創建付款訂單
  - 請求格式：
    ```json
    {
      "plan": "basic" | "pro" | "enterprise",
      "billing_cycle": "monthly" | "yearly"
    }
    ```
  - 回應格式：
    ```json
    {
      "payment_url": "https://payment.ecpay.com.tw/...",
      "order_id": "..."
    }
    ```
- `POST /api/subscription/payment-callback` - 綠界回調處理

---

## 部署指南

### Zeabur 部署步驟

#### 1. 準備檔案

**需要上傳的檔案**:
```
reelmind_demo/
├── client/          # 前端程式碼
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── .gitignore
```

**不需要上傳的檔案**:
- `node_modules/` - 會自動安裝
- `dist/` - 會自動建構
- `.env.local` - 使用 Zeabur 環境變數

#### 2. 建構配置

**package.json** 確保有以下腳本:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Zeabur 建構命令**:
```bash
pnpm install
pnpm build
```

**Zeabur 啟動命令**:
```bash
pnpm preview
```

#### 3. 環境變數設定

在 Zeabur 設定以下環境變數:

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_REDIRECT_URI=https://reelmind.aijob.com.tw/oauth/callback

# API 端點
VITE_API_BASE_URL=https://api.aijob.com.tw

# 前端 URL
VITE_FRONTEND_URL=https://reelmind.aijob.com.tw
```

#### 4. 網域設定

- 主網域: `reelmind.aijob.com.tw`
- API 網域: `api.aijob.com.tw`（後端）

#### 5. CORS 設定

確保後端 Python FastAPI 的 CORS 設定包含前端網域:

```python
cors_origins = [
    "http://localhost:5173",
    "https://reelmind.aijob.com.tw",  # 前端網域
]
```

### 部署檢查清單

- [ ] 上傳所有必要檔案到 Zeabur
- [ ] 設定環境變數
- [ ] 配置網域
- [ ] 測試建構流程
- [ ] 測試前端頁面載入
- [ ] 測試 API 連接
- [ ] 測試 Google OAuth 登入
- [ ] 測試綠界金流付款
- [ ] 測試 Mode3 一鍵生成
- [ ] 測試 Mode1 對話功能
- [ ] 測試主題切換
- [ ] 測試響應式設計（手機、平板）
- [ ] 檢查 SEO 標籤
- [ ] 檢查 robots.txt 和 sitemap.xml
- [ ] 監控錯誤日誌

---

## API 對接說明

### 流式 API (SSE) 處理

**前端實現**:
```typescript
// client/src/lib/api-client.ts
export async function apiStream(
  endpoint: string,
  data: any,
  onChunk: (chunk: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onComplete?.();
          return;
        }
        try {
          const json = JSON.parse(data);
          onChunk(json.content || json.chunk || data);
        } catch {
          onChunk(data);
        }
      }
    }
  }
}
```

**後端格式要求**:
```python
# Python FastAPI 範例
async def generate_stream(request: Request):
    async def event_generator():
        for chunk in ai_generate(request.user_input):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

### 綠界金流整合

**前端流程**:
1. 用戶選擇方案和付款週期
2. 呼叫 `POST /api/subscription/create-payment`
3. 後端返回綠界付款 URL
4. 前端導向到綠界付款頁面
5. 付款完成後，綠界回調到 `POST /api/subscription/payment-callback`
6. 後端處理回調，更新訂閱狀態
7. 導向到 `/payment-result?status=success`

**前端實現**:
```typescript
const handleSubscribe = async (plan: string, cycle: string) => {
  try {
    const response = await apiPost('/api/subscription/create-payment', {
      plan,
      billing_cycle: cycle
    });
    
    // 導向到綠界付款頁面
    window.location.href = response.payment_url;
  } catch (error) {
    toast.error('建立付款訂單失敗');
  }
};
```

---

## 開發注意事項

### 1. 主題系統

**CSS 變數定義** (`client/src/index.css`):
```css
@layer base {
  :root {
    --background: 222.2 84% 4.9%;      /* 深藍黑 */
    --foreground: 210 40% 98%;         /* 淺白 */
    --primary: 199 89% 48%;            /* 青藍 */
    /* ... */
  }

  .light {
    --background: 0 0% 100%;           /* 白色 */
    --foreground: 222.2 84% 4.9%;      /* 深色文字 */
    /* ... */
  }
}
```

**使用方式**:
```tsx
// ✅ 正確 - 使用語義化類別
<div className="bg-background text-foreground">

// ❌ 錯誤 - 使用固定顏色
<div className="bg-white text-black">
```

### 2. API 錯誤處理

**統一錯誤處理**:
```typescript
try {
  const data = await apiGet('/api/endpoint');
  // 處理成功回應
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('未知錯誤');
  }
}
```

### 3. 響應式設計

**Tailwind 斷點**:
```tsx
<div className="
  w-full           /* 手機 */
  md:w-1/2         /* 平板 */
  lg:w-1/3         /* 桌面 */
">
```

### 4. 性能優化

**程式碼分割**:
```typescript
// 使用 React.lazy 延遲載入
const Mode1 = lazy(() => import('./pages/Mode1'));
const Mode3 = lazy(() => import('./pages/Mode3'));
```

**圖片優化**:
```tsx
<img 
  src="/image.jpg" 
  loading="lazy"           // 懶載入
  alt="描述"
/>
```

### 5. SEO 最佳實踐

**動態 Meta 標籤**:
```typescript
// 使用 react-helmet-async 或手動更新
useEffect(() => {
  document.title = '頁面標題 | ReelMind';
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', '頁面描述');
  }
}, []);
```

---

## 常見問題

### Q1: 為什麼主題切換只有 Hero 區域有效？

**A**: 部分 section 使用了固定的背景顏色類別（如 `bg-muted/50`），需要改為 `bg-background` 才能跟隨主題。

### Q2: 如何恢復登入保護？

**A**: 在 Mode1.tsx、Mode3.tsx、UserDB.tsx 中取消註解以下程式碼：
```typescript
useEffect(() => {
  if (!isAuthenticated()) {
    toast.error('請先登入');
    setLocation('/');
  }
}, [setLocation]);
```

### Q3: 綠界金流測試環境如何設定？

**A**: 在後端設定綠界測試環境的 MerchantID 和 HashKey，前端無需修改。

### Q4: 如何添加新的實戰指南文章？

**A**: 編輯 `client/src/data/guide-articles.ts`，按照現有格式添加新文章資料。

---

## 聯絡資訊

- **專案負責人**: [您的名字]
- **技術支援**: [技術團隊聯絡方式]
- **問題回報**: [GitHub Issues 或其他管道]

---

## 更新日誌

### 2025-11-27
- ✅ 完成 Mode3 一鍵生成功能
- ✅ 完成 Experience 免費體驗頁面
- ✅ 整合綠界金流付款
- ✅ 完善 SEO 配置
- ✅ 添加 robots.txt 和 sitemap.xml
- 🔧 Mode1 功能增強進行中
- 📋 實戰指南內容補充待完成

---

**最後更新**: 2025-11-27  
**專案版本**: 3672ac4c  
**文件版本**: 1.0
