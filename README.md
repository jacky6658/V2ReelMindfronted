# ReelMind - AI 短影音智能體平台

> **專案版本**: 2.0.0  
> **最後更新**: 2025-12-19  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Python FastAPI  
> **狀態**: ✅ 生產環境就緒  
> **生產域名**: `https://reelmind.aijob.com.tw`

---

## 📋 目錄

- [專案概述](#專案概述)
- [核心功能](#核心功能)
- [訂閱方案](#訂閱方案)
- [快速開始](#快速開始)
- [技術架構](#技術架構)
- [專案結構](#專案結構)
- [開發指南](#開發指南)
- [部署指南](#部署指南)
- [API 文檔](#api-文檔)
- [相關文檔](#相關文檔)

---

## 專案概述

ReelMind 是一個 AI 短影音智能體平台，專為 TikTok、Instagram Reels、YouTube Shorts 創作者設計。從靈感枯竭到內容量產，AI 幫你生成靈感與爆款腳本，提升內容創作效率 70%。

### 核心價值

- 🎯 **AI 人設規劃**：對話式帳號定位、14 天內容規劃、今日腳本生成
- ⚡ **一鍵生成**：表單式 3 步驟快速生成（帳號定位 + 選題建議 + 腳本內容）
- 📚 **創作者資料庫**：完整的腳本、對話、生成記錄管理
- 📊 **數據分析**：使用統計視覺化與 AI 智能分析
- 🎓 **完整教學**：12 篇實戰指南文章 + 線上課程

---

## 核心功能

### 1. IP 人設規劃（Mode1）

**功能特點**：
- AI 對話式規劃，支援多輪對話
- 自動檢測對話意圖並分類結果
- 快速按鈕：帳號定位、14 天規劃、今日腳本、換腳本結構、重新定位
- 生成結果管理：查看、儲存、編輯、匯出
- 本地儲存：未儲存的結果自動保存到 localStorage

**儲存位置**：
- 帳號定位 → UserDB「IP 人設規劃」標籤
- 14 天規劃 → UserDB「14 天規劃」標籤
- 腳本內容 → UserDB「IP 人設規劃」標籤

### 2. 一鍵生成（Mode3）

**功能特點**：
- 三步驟生成：帳號定位 → 選題建議 → 腳本內容
- 表單式輸入，快速生成
- 支援多平台：TikTok、Instagram Reels、YouTube Shorts
- 結果可儲存到 UserDB「我的腳本」標籤

### 3. 創作者資料庫（UserDB）

**功能特點**：
- **我的腳本**：一鍵生成生成的腳本內容
- **對話記錄**：IP 人設規劃的對話摘要
- **生成記錄**：一鍵生成生成的選題和定位內容
- **IP 人設規劃**：IP 人設規劃生成的帳號定位和腳本內容
- **14 天規劃**：IP 人設規劃生成的 14 天短影音規劃內容

**操作功能**：
- 搜索：標題或內容搜索
- 篩選：平台篩選、時間排序
- 操作：查看詳情、複製內容、匯出為 TXT、刪除
- 統計：各類型數據統計卡片

### 4. 使用統計（Statistics）

**功能特點**：
- 數據總覽：今日/本週/本月總計
- 趨勢圖表：AreaChart 顯示使用趨勢
- 功能分布圖：PieChart 顯示各功能使用比例
- AI 智能分析：使用 LLM 分析用戶數據，提供個人化建議

### 5. 其他功能

- **免費體驗**：無需登入即可使用一鍵生成功能
- **推薦邀請碼**：邀請好友獲得獎勵（7 天免費試用延長）
- **實戰指南**：12 篇專業文章
- **幫助中心**：完整的 FAQ 和支援系統
- **訂閱付款**：綠界金流整合，支援月繳/年繳

---

## 訂閱方案

### Lite 方案
- **價格**：月付 NT$300 / 年付 NT$3,600
- **使用次數**：每日 20 次 / 每月 300 次
- **特色**：適合已有 AI 金鑰的創作者
- **功能**：所有核心功能 + BYOK 支援 + 平台備用配額

### Pro 方案 ⭐ 最受歡迎
- **價格**：月付 NT$800 / 年付 NT$9,600
- **使用次數**：每日 300 次 / 每月 10,000 次
- **高品質模式**：每月 2,000 次（內容更優質）
- **特色**：適合專業創作者，穩定產出
- **功能**：所有核心功能 + BYOK 支援 + 平台備用配額 + Premium 模式

### Max 方案
- **價格**：月付 NT$2,000 / 年付 NT$24,000
- **使用次數**：每日 1,000 次 / 每月 30,000 次
- **高品質模式**：每月 5,000 次（內容更優質）
- **特色**：適合團隊或大量產出
- **功能**：所有核心功能 + BYOK 支援 + 平台完整配額 + Premium 模式 + 批次生成（可加購）+ AI 智能分析（可加購）

### 功能對照表

| 功能 | Lite | Pro | Max |
|------|------|-----|-----|
| 14 天內容規劃日曆 | ✅ | ✅ | ✅ |
| AI 人設定位與選題建議 | ✅ | ✅ | ✅ |
| 短影音腳本一鍵生成 | ✅ | ✅ | ✅ |
| AI 對話式內容規劃 | ✅ | ✅ | ✅ |
| BYOK（使用自己的 AI 金鑰） | ✅ | ✅ | ✅ |
| 平台備用配額 | ✅ | ✅ | ✅ |
| 高品質模式 | ❌ | ✅ (2,000/月) | ✅ (5,000/月) |
| 批次生成 | ❌ | ❌ | ✅ (可加購) |
| AI 智能分析 | ❌ | ❌ | ✅ (可加購) |

---

## 快速開始

### 環境要求

- Node.js 18+ 
- pnpm 10.4.1+ (推薦) 或 npm/yarn

### 安裝依賴

```bash
# 使用 pnpm (推薦)
pnpm install

# 或使用 npm
npm install
```

### 環境變數設定

在專案根目錄創建 `.env` 文件：

```env
# API 基礎 URL
VITE_API_BASE_URL=https://api.aijob.com.tw
```

### 開發模式

```bash
# 啟動開發伺服器
pnpm dev

# 或
npm run dev
```

開發伺服器將在 `http://localhost:3000` 啟動。

### 建置生產版本

```bash
# 生成 sitemap 並建置
pnpm build

# 或
npm run build
```

建置輸出目錄：`dist/public`

### 預覽生產版本

```bash
pnpm preview
```

---

## 技術架構

### 前端技術棧

```
React 19
├── TypeScript 5.x
├── Vite 7.x
├── Tailwind CSS 4.x
├── shadcn/ui (Radix UI)
├── React Router v6 (HashRouter)
├── Zustand (狀態管理)
├── Recharts (圖表視覺化)
└── Sonner (Toast 提示)
```

### 主要依賴

- **UI 框架**：React 19 + TypeScript
- **樣式**：Tailwind CSS 4 + shadcn/ui
- **路由**：React Router v6 (HashRouter)
- **狀態管理**：Zustand
- **圖表**：Recharts
- **表單**：React Hook Form + Zod
- **圖標**：Lucide React
- **動畫**：Framer Motion

---

## 專案結構

```
V2ReelMindfronted-main/
├── client/                          # 前端應用
│   ├── public/                      # 靜態資源
│   │   ├── oauth/callback/         # OAuth 回調頁面
│   │   ├── assets/                 # 圖片、影片資源
│   │   └── guide/                  # 實戰指南 HTML 文章
│   ├── src/
│   │   ├── components/             # 共用組件
│   │   │   ├── ui/                 # shadcn/ui 組件
│   │   │   ├── ScriptEditor.tsx    # 腳本編輯器
│   │   │   ├── ThinkingAnimation.tsx # 載入動畫
│   │   │   └── ...
│   │   ├── pages/                  # 頁面組件
│   │   │   ├── Home.tsx            # 首頁
│   │   │   ├── Mode1.tsx           # IP 人設規劃
│   │   │   ├── Mode3.tsx           # 一鍵生成
│   │   │   ├── UserDB.tsx          # 創作者資料庫
│   │   │   ├── Statistics.tsx      # 使用統計
│   │   │   ├── Profile.tsx         # 個人資料
│   │   │   ├── Settings.tsx        # 設定
│   │   │   ├── Subscription.tsx    # 訂閱方案
│   │   │   └── ...
│   │   ├── lib/                    # 工具庫
│   │   │   ├── api-client.ts       # API 客戶端
│   │   │   └── api-config.ts      # API 配置
│   │   ├── stores/                 # 狀態管理
│   │   │   ├── authStore.ts        # 認證狀態
│   │   │   └── userDataStore.ts    # 用戶數據狀態
│   │   └── router.tsx              # 路由配置
│   └── index.html                  # HTML 入口
├── scripts/                         # 腳本工具
│   └── generate-sitemap.mjs       # Sitemap 生成
├── docs/                            # 文檔
├── package.json                     # 專案配置
├── vite.config.ts                  # Vite 配置
└── tsconfig.json                   # TypeScript 配置
```

---

## 開發指南

### 路由模式

專案使用 **Hash Router** (`/#/path`) 以確保跨平台部署的穩定性。

**重要**：若未來需要改回 Browser Router，必須確保：
1. 伺服器正確配置 Rewrite 規則（所有 404 導向 index.html）
2. 解決 Google OAuth 不支援帶 Hash 的回調問題

### 術語規範

在用戶可見的界面中，**不應出現**開發者術語：

- ❌ Mode1 → ✅ **IP 人設規劃**
- ❌ Mode3 → ✅ **一鍵生成**

### API 參數規範

後端 Pydantic 模型要求必填欄位為 `message`。前端開發時請務必遵守此規範：

```typescript
// ✅ 正確
await apiStream('/api/generate/topics', { message: prompt }, ...);

// ❌ 錯誤
await apiStream('/api/generate/topics', { prompt }, ...);
```

### 響應式設計

- 手機版標籤頁使用橫向滾動（`flex` + `overflow-x-auto`）
- 導航欄在手機版簡化（移除不必要的元素）
- 按鈕文字在手機版可縮短（使用 `hidden sm:inline`）

### 時區處理

所有時間顯示統一使用台灣時區（Asia/Taipei）：

```typescript
new Date().toLocaleString('zh-TW', { 
  timeZone: 'Asia/Taipei',
  // ... 其他選項
});
```

### 自動登出機制

- **24 小時閒置自動登出**：用戶超過 24 小時未活動時自動登出
- **活動追蹤**：監聽滑鼠、鍵盤、點擊、滾動等用戶活動
- **節流優化**：每 1 分鐘最多更新一次活動時間

---

## 部署指南

### Zeabur 部署

專案採用 **Hash Router** 方案，並配合 **Redirector 頁面** 來處理 Google OAuth 回調。

#### 環境變數設定

**前端 (Client):**
```bash
VITE_API_BASE_URL=https://api.aijob.com.tw
```

**後端 (Server):**
```bash
# Google OAuth
GOOGLE_CLIENT_ID_NEW=新版ID
GOOGLE_CLIENT_SECRET_NEW=新版Secret
GOOGLE_REDIRECT_URI_NEW=https://reelmind.aijob.com.tw/oauth/callback

# AI 服務
GEMINI_API_KEY=您的APIKey

# JWT
JWT_SECRET=您的JWT密鑰

# 前端 URL
FRONTEND_BASE_URL=https://reelmind.aijob.com.tw

# ECPay 支付
ECPAY_MERCHANT_ID=您的商戶ID
ECPAY_HASH_KEY=您的HashKey
ECPAY_HASH_IV=您的HashIV
ECPAY_RETURN_URL=https://reelmind.aijob.com.tw/payment-result.html
```

#### OAuth 回調配置

1. Google 設定 Redirect URI 為 `https://reelmind.aijob.com.tw/oauth/callback`
2. 確保 `client/public/oauth/callback/index.html` 檔案存在
3. 該 HTML 負責將流量重定向到 `/#/auth/callback`

#### 域名遷移注意事項

**從開發域名遷移到生產域名時**：

1. **後端 CORS 配置**：
   - 確認新域名在 `cors_origins` 列表中
   - 更新 `required_origins` 列表

2. **OAuth 回調 URL**：
   - 更新後端環境變數 `GOOGLE_REDIRECT_URI_NEW`
   - 在 Google Cloud Console 中添加新的 Redirect URI

3. **支付回調 URL**：
   - 更新 `ECPAY_RETURN_URL` 環境變數
   - 確認 ECPay 後台設定正確

4. **前端 API 配置**：
   - 確認 `VITE_API_BASE_URL` 指向正確的後端

詳細遷移指南請參考：`域名遷移與功能優化指南.md`

### 部署檢查清單

每次部署前請確認：

- [ ] `vite.config.ts` 的輸出目錄是否正確
- [ ] `client/public/oauth/callback/index.html` 是否存在
- [ ] 後端 `cors_origins` 是否包含當前部署的域名
- [ ] 環境變數是否正確設定
- [ ] Google OAuth Redirect URI 是否正確
- [ ] ECPay 支付回調 URL 是否正確
- [ ] Sitemap 是否已生成（`pnpm generate-sitemap`）

---

## API 文檔

### Request ID 追蹤

後端已實作全域 Request ID 功能，所有 API 請求都會自動追蹤：

- **自動生成**：如果前端沒有在 header 中帶入 `X-Request-ID`，後端會自動生成
- **自訂 Request ID**：前端可以在請求 header 中帶入 `X-Request-ID`
- **Response Header**：所有 API 回應都會在 header 中返回 `X-Request-ID`
- **日誌追蹤**：後端所有日誌都包含 `[request_id=xxx]`

### 主要 API 端點

#### 認證 API
- `GET /api/auth/google-new` - Google OAuth 登入（新版前端專用）
- `POST /api/auth/google/callback` - OAuth 回調（需帶上 `redirect_uri` 參數）
- `POST /api/auth/refresh` - 刷新 Token

#### 生成 API
- `POST /api/generate/positioning` - 生成帳號定位
- `POST /api/generate/topics` - 生成選題建議
- `POST /api/generate/script` - 生成腳本內容
- `POST /api/mode1/chat` - IP 人設規劃對話

#### 用戶數據 API
- `GET /api/scripts/my` - 獲取我的腳本
- `GET /api/user/conversations/{user_id}` - 獲取對話記錄
- `GET /api/user/generations/{user_id}` - 獲取生成記錄
- `GET /api/ip-planning/my` - 獲取 IP 規劃記錄

#### 統計 API
- `GET /api/user/analytics/overview` - 數據總覽
- `GET /api/user/analytics/ai-insights` - AI 智能洞察
- `GET /api/user/analytics/productivity` - 生產力分析

#### 支付 API
- `POST /api/payment/checkout` - 建立訂單
- `POST /api/payment/webhook` - 支付回調（ECPay 伺服器端通知）
- `GET /api/payment/result` - 支付結果查詢

#### 推薦邀請 API
- `GET /api/user/referral/code` - 獲取推薦碼
- `GET /api/user/referral/stats/{user_id}` - 推薦統計
- `GET /api/user/referral/records` - 推薦記錄

---

## 相關文檔

- **域名遷移指南**：`域名遷移與功能優化指南.md`
- **推薦邀請碼機制**：`使用統計價值與推薦邀請碼機制報告.md`
- **UserDB 欄位說明**：`docs/UserDB-欄位說明.md`
- **後端 API 分析**：`docs/BACKEND_API_ANALYSIS.md`
- **部署指南**：`docs/ZEABUR_DEPLOYMENT_GUIDE.md`
- **實戰指南文章**：`client/public/guide/`

---

## 最新更新（2025-12-19）

### 🎨 UI/UX 優化
- ✅ **方案說明優化**：使用 Icon 取代 Emoji，文案更易懂
- ✅ **首頁課程推廣**：在教學影片下方添加線上課程推廣區塊
- ✅ **方案對比清晰**：功能列表使用 Icon，使用次數說明更詳細

### 🔧 功能增強
- ✅ **訂閱方案更新**：支援 Lite、Pro、Max 三種方案
- ✅ **Premium 模式**：Pro 和 Max 方案支援高品質模式
- ✅ **BYOK 支援**：所有方案都支援使用自己的 AI 金鑰

### 📚 文檔更新
- ✅ **README 整理**：重新組織結構，更清晰易讀
- ✅ **快速開始指南**：添加完整的開發和部署指南

---

## 聯絡資訊

如有問題或建議，請聯繫開發團隊或查看幫助中心頁面。

**線上課程**：https://www.pressplay.cc/link/s/2114860B

---

## 授權

MIT License
