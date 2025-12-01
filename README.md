# ReelMind React 專案開發文件

> **專案版本**: 2.0.0  
> **最後更新**: 2025-11-30  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Python FastAPI  
> **狀態**: ✅ 核心功能已完成，可進入生產環境  
> **前端域名**: `https://reelmindv2.zeabur.app` (開發階段) → `https://reelmind.aijob.com.tw` (生產環境)

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [已完成功能](#已完成功能)
3. [核心功能詳述](#核心功能詳述)
4. [技術架構](#技術架構)
5. [部署指南](#部署指南)
6. [API 對接說明](#api-對接說明)
7. [開發注意事項](#開發注意事項)
8. [未來規劃與維護注意事項](#未來規劃與維護注意事項)

---

## 專案概述

ReelMind 是一個 AI 短影音智能體平台，從靈感枯竭到內容量產，專為 IG、TikTok、Shorts 打造。本專案將原始的純 HTML 網站轉換為現代化的 React 應用，保留深色科技感設計風格，並整合 Python FastAPI 後端。

### 核心功能
- **IP人設規劃**（原 Mode1）: AI 對話式帳號定位、14天規劃、今日腳本生成
- **一鍵生成**（原 Mode3）: 表單式 3 步驟生成（帳號定位 + 選題建議 + 腳本內容）
- **免費體驗**: 與一鍵生成相同功能，無需登入
- **創作者資料庫**（UserDB）: 腳本、對話、生成記錄管理
- **使用統計**: 數據視覺化與 AI 智能分析
- **推薦邀請碼**: 邀請好友獲得獎勵
- **實戰指南**: 12 篇專業文章
- **幫助中心**: 完整的 FAQ 和支援系統
- **訂閱付款**: 綠界金流整合

---

## ✅ 已完成功能

### 1. 核心頁面
- [x] **首頁（Home）**：3D 流體動畫背景、核心功能介紹、定價方案
- [x] **一鍵生成（Mode3）**：完整的 3 步驟生成流程，串接 Gemini AI
- [x] **免費體驗（Experience）**：無需登入即可使用的生成功能
- [x] **IP人設規劃（Mode1）**：AI 對話介面，支援多標籤頁切換、結果管理
- [x] **創作者資料庫（UserDB）**：腳本庫、對話記錄、生成記錄、IP 規劃、14 天規劃管理
- [x] **使用統計（Statistics）**：數據視覺化、趨勢分析、AI 智能洞察
- [x] **個人資料（Profile）**：基本資訊、創作者資訊、偏好設定、帳務資訊、推薦邀請、使用紀錄
- [x] **設定（Settings）**：LLM API Key 管理、數據匯出、如何取得 API Key 說明
- [x] **幫助中心（Help Center）**：FAQ、快速連結、聯繫支援
- [x] **Guide（實戰指南）**：文章列表與詳情頁（12 篇完整文章）
- [x] **Subscription（訂閱方案）**：整合綠界金流，支援月繳/年繳
- [x] **Checkout（付款頁面）**：完整的付款流程與發票設定
- [x] **登入/註冊**：Google OAuth 2.0 登入整合

### 2. 功能優化與增強

#### 2.1 IP人設規劃（Mode1）✅
- [x] **快速按鈕**：對話框上方添加快速指令按鈕
- [x] **生成結果管理**：優化結果展示彈窗，支援儲存到資料庫
- [x] **自動儲存**：檢測對話意圖自動儲存重要內容
- [x] **本地儲存**：未儲存的結果自動保存到 localStorage
- [x] **分類管理**：自動分類結果（帳號定位、14 天規劃、腳本）
- [x] **使用說明**：點擊幫助圖標查看使用說明
- [x] **響應式設計**：優化手機版界面，添加返回主控台按鈕

#### 2.2 創作者資料庫（UserDB）✅
- [x] **完整功能**：腳本、對話記錄、生成記錄、IP 規劃、14 天規劃
- [x] **搜索與篩選**：標題/內容搜索、平台篩選、時間排序
- [x] **統計卡片**：各類型數據統計
- [x] **操作選單**：查看詳情、複製內容、匯出為 TXT、刪除
- [x] **資料存取說明**：點擊幫助圖標查看各功能對應的資料位置
- [x] **響應式設計**：優化手機版標籤頁（橫向滾動）、移除登出按鈕
- [x] **詳情對話框**：與 Mode1 相同大小的詳情查看視窗
- [x] **彈窗寬度優化**：電腦版彈窗寬度增加至 90vw，提供更寬敞的查看體驗
- [x] **內容滑動支援**：詳細內容區域支援左右滑動，方便查看長內容
- [x] **按鈕佈局優化**：ScriptEditor 工具列響應式設計，防止按鈕重疊

#### 2.3 使用統計（Statistics）✅
- [x] **數據總覽**：今日/本週/本月總計
- [x] **趨勢圖表**：AreaChart 顯示使用趨勢
- [x] **功能分布圖**：PieChart 顯示各功能使用比例
- [x] **AI 智能分析**：使用 LLM 分析用戶數據，提供個人化建議
- [x] **Dashboard 整合**：在主控台顯示統計卡片與圖表
- [x] **使用說明**：點擊幫助圖標查看統計數據的價值與意義

#### 2.4 推薦邀請碼系統 ✅
- [x] **推薦碼生成**：基於 user_id 生成穩定推薦碼
- [x] **推薦連結**：自動生成推薦連結
- [x] **統計顯示**：成功邀請數、累積獎勵
- [x] **獎勵機制說明**：
  - 每成功邀請一位好友註冊，邀請人與被邀請人雙方都可獲得 7 天免費試用延長（一個帳號最多延長至 5 週，共 35 天）
  - 上述規則不與下方規則抵觸，一個帳號至多可以免費體驗全功能 2 個月
  - **額外獎勵**：
    - 累積邀請 10 位用戶 → 可獲得 1 個月免費使用（每個推薦人只能獲得一次）

#### 2.5 幫助中心（Help Center）✅
- [x] **FAQ 系統**：15 個常見問題，分類管理
- [x] **快速連結**：快速入門、API Key 教學、IP 人設規劃、實戰指南
- [x] **搜索功能**：搜索問題或關鍵字
- [x] **分類篩選**：快速入門、功能使用、技術問題、帳號問題、付費問題
- [x] **聯繫支援**：LINE 官方帳號、Discord 社群、聯絡表單

#### 2.6 個人資料頁面 ✅
- [x] **基本資訊**：用戶資訊顯示與編輯
- [x] **創作者資訊**：平台帳號、粉絲數、內容類型、使用說明
- [x] **偏好設定**：AI 語氣、語言、影片長度、主題類別、使用說明
- [x] **帳務資訊**：訂單記錄、授權狀態
- [x] **推薦邀請**：推薦碼、推薦連結、統計數據、獎勵機制
- [x] **使用紀錄**：最近操作記錄
- [x] **響應式優化**：手機版標籤頁優化，確保所有標籤都可點擊

### 3. 技術架構優化
- [x] **前端路由**：遷移至 `HashRouter` 以解決 SPA 部署時的 404 問題
- [x] **OAuth 流程**：修正 Google OAuth 回調流程，解決 Zeabur 部署後的路由重定向問題
- [x] **後端 API**：
  - 修正 Gemini 模型名稱
  - 添加 CORS 白名單與 CSRF 豁免路徑
  - 調整 API 參數接收名稱以匹配前端
  - 支付結帳 API 添加 CORS 支援
- [x] **載入動畫**：為生成功能添加質感 `ThinkingAnimation`
- [x] **錯誤頁面**：美化 404 頁面，提供返回首頁與功能導航
- [x] **響應式設計**：全面優化手機版界面
- [x] **用戶體驗**：添加 Toast 通知、使用說明 Dialog、資料存取說明
- [x] **時區處理**：所有時間顯示統一使用台灣時區（Asia/Taipei）
- [x] **自動登出機制**：24 小時閒置自動登出，提升安全性
- [x] **圖表組件修復**：確保所有圖表組件正確使用 ChartContainer
- [x] **圖標導入優化**：檢查並修復所有頁面的圖標導入問題

### 4. UI/UX 優化
- [x] **深色/淺色主題**：全面檢查主題切換效果
- [x] **表格樣式**：美化表格樣式，添加操作選單
- [x] **卡片設計**：統計卡片、功能卡片優化
- [x] **圖表視覺化**：使用 Recharts 實現數據視覺化
- [x] **手機版優化**：標籤頁橫向滾動、按鈕文字優化、導航欄簡化
- [x] **頁首佈局優化**：電腦版和手機版頁首佈局分離，電腦版保持原樣，手機版居中顯示
- [x] **彈窗寬度優化**：UserDB 詳情彈窗電腦版寬度增加，提供更好的查看體驗
- [x] **工具列優化**：ScriptEditor 工具列響應式設計，防止按鈕重疊，手機版只顯示圖標
- [x] **內容滑動**：長內容支援左右滑動查看

---

## 核心功能詳述

### IP人設規劃（Mode1）

**功能特點**：
- AI 對話式規劃，支援多輪對話
- 自動檢測對話意圖並分類結果
- 快速按鈕：帳號定位、14 天規劃、今日腳本、換腳本結構、重新定位
- 生成結果管理：查看、儲存、編輯、匯出
- 本地儲存：未儲存的結果自動保存到 localStorage
- 使用說明：點擊幫助圖標查看詳細使用說明

**儲存位置**：
- 帳號定位 → UserDB「IP 人設規劃」標籤
- 14 天規劃 → UserDB「14 天規劃」標籤
- 腳本內容 → UserDB「IP 人設規劃」標籤

### 一鍵生成（Mode3）

**功能特點**：
- 三步驟生成：帳號定位 → 選題建議 → 腳本內容
- 表單式輸入，快速生成
- 支援多平台：TikTok、Instagram Reels、YouTube Shorts
- 結果可儲存到 UserDB「我的腳本」標籤

### 創作者資料庫（UserDB）

**功能特點**：
- **我的腳本**：一鍵生成生成的腳本內容
- **對話記錄**：IP人設規劃的對話摘要（不包含完整對話內容）
- **生成記錄**：一鍵生成生成的選題和定位內容
- **IP 人設規劃**：IP人設規劃生成的帳號定位和腳本內容
- **14 天規劃**：IP人設規劃生成的 14 天短影音規劃內容

**操作功能**：
- 搜索：標題或內容搜索
- 篩選：平台篩選、時間排序
- 操作：查看詳情、複製內容、匯出為 TXT、刪除
- 統計：各類型數據統計卡片

### 使用統計（Statistics）

**功能特點**：
- 數據總覽：今日/本週/本月總計
- 趨勢圖表：AreaChart 顯示使用趨勢
- 總計統計：腳本、生成記錄、對話記錄總數
- AI 智能分析：使用 LLM 分析用戶數據，提供個人化建議

### 推薦邀請碼系統

**功能特點**：
- 自動生成推薦碼（基於 user_id）
- 推薦連結生成
- 統計顯示：成功邀請數、累積獎勵
- 獎勵機制：
  - 註冊獎勵：每邀請一位好友註冊 → 7 天免費試用延長（無限制）
  - **二選一獎勵（擇一發放，先達到條件者優先）：**
    - 訂閱獎勵：好友完成首次訂閱 → 30 天使用期限（每個被推薦用戶只能觸發一次）
    - 里程碑獎勵：累積邀請 5 位付費用戶（必須完成付費訂閱，月付或年付均可）→ 1 個月免費使用（每個推薦人只能獲得一次）
  - **注意**：兩個獎勵為二選一，先達到條件者優先發放，已發放過的獎勵不會重複發放

**注意**：里程碑獎勵只計算完成付費訂閱的好友，僅完成註冊但未付費的好友不會計入。

---

## 技術架構

### 前端技術棧
```
React 19
├── TypeScript 5.x
├── Vite 6.x
├── Tailwind CSS 4.x
├── shadcn/ui
├── React Router v6 (HashRouter)
├── Zustand (狀態管理)
├── Recharts (圖表視覺化)
└── Sonner (Toast 提示)
```

### 專案結構
```
V2ReelMindfronted-main/
├── client/
│   ├── public/
│   │   ├── oauth/callback/index.html  # OAuth Redirector
│   │   ├── _redirects                  # 路由重定向配置
│   │   └── vercel.json                  # Vercel 部署配置
│   ├── src/
│   │   ├── components/                 # 共用組件
│   │   │   ├── ui/                     # shadcn/ui 組件
│   │   │   ├── ScriptEditor.tsx        # 腳本編輯器
│   │   │   ├── ThinkingAnimation.tsx   # 載入動畫
│   │   │   └── ...
│   │   ├── pages/                      # 頁面組件
│   │   │   ├── Mode1.tsx              # IP人設規劃
│   │   │   ├── Mode3.tsx              # 一鍵生成
│   │   │   ├── UserDB.tsx             # 創作者資料庫
│   │   │   ├── Statistics.tsx         # 使用統計
│   │   │   ├── Profile.tsx            # 個人資料
│   │   │   ├── HelpCenter.tsx         # 幫助中心
│   │   │   └── ...
│   │   ├── lib/                        # 工具庫
│   │   │   ├── api-client.ts          # API 客戶端
│   │   │   ├── api-config.ts          # API 配置
│   │   │   └── ...
│   │   ├── stores/                     # 狀態管理
│   │   │   └── authStore.ts           # 認證狀態
│   │   └── router.tsx                  # 路由配置
├── ReelMindbackend-main/               # Python 後端
│   └── app.py                          # 主程式
└── ...
```

---

## 部署指南

### Zeabur 部署

由於 Zeabur 的靜態網站託管對於 SPA 的 Rewrite 支援可能不穩定，本專案採用 **Hash Router** 方案，並配合 **Redirector 頁面** 來處理 Google OAuth 回調。

#### 1. 環境變數設定

**前端 (Client):**
```bash
VITE_API_BASE_URL=https://api.aijob.com.tw
```

**後端 (Server):**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=舊版ID
GOOGLE_CLIENT_SECRET=舊版Secret
GOOGLE_REDIRECT_URI=舊版RedirectURI

GOOGLE_CLIENT_ID_NEW=新版ID
GOOGLE_CLIENT_SECRET_NEW=新版Secret
GOOGLE_REDIRECT_URI_NEW=https://reelmindv2.zeabur.app/oauth/callback

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

#### 2. 路由配置 (關鍵)
- **前端路由**: 使用 `HashRouter` (`/#/path`)
- **OAuth 回調**: 
  - Google 設定 Redirect URI 為 `https://reelmindv2.zeabur.app/oauth/callback`（開發階段）
  - 或 `https://reelmind.aijob.com.tw/oauth/callback`（生產環境）
  - 伺服器端需存在 `client/public/oauth/callback/index.html` 檔案
  - 該 HTML 負責將流量重定向到 `/#/auth/callback`

#### 3. 域名遷移注意事項

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

---

## API 對接說明

### 生成 API
前端發送請求時，統一使用 `message` 作為參數名稱：

```typescript
// 正確範例
await apiStream('/api/generate/topics', { message: prompt }, ...);
```

### 認證 API
- 登入：`GET /api/auth/google-new` (新版前端專用)
- 回調：`POST /api/auth/google/callback` (需帶上 `redirect_uri` 參數)
- 刷新 Token：`POST /api/auth/refresh`

### 用戶數據 API
- 腳本：`GET /api/scripts/my`
- 對話記錄：`GET /api/user/conversations/{user_id}`
- 生成記錄：`GET /api/user/generations/{user_id}`
- IP 規劃：`GET /api/ip-planning/my`

### 統計 API
- 總覽：`GET /api/user/analytics/overview`
- AI 洞察：`GET /api/user/analytics/ai-insights`
- 生產力：`GET /api/user/analytics/productivity`

### 支付 API
- 建立訂單：`POST /api/payment/checkout`
- 支付回調：`POST /api/payment/webhook` (ECPay 伺服器端通知)
- 支付結果：`GET /api/payment/result`

### 推薦邀請 API
- 獲取推薦碼：`GET /api/user/referral/code`
- 推薦統計：`GET /api/user/referral/stats/{user_id}`
- 推薦記錄：`GET /api/user/referral/records`

---

## 開發注意事項

### 1. 術語規範
**重要**：在用戶可見的界面中，**不應出現**開發者術語（如 "Mode1"、"Mode3"），應使用用戶友好的名稱：
- Mode1 → **IP人設規劃**
- Mode3 → **一鍵生成**

### 2. 路由模式
目前使用 **Hash Router** (`/#/`) 是為了最穩定的跨平台部署兼容性。若未來需要改回 **Browser Router** (`/`)，必須確保伺服器（Nginx/Caddy）正確配置 Rewrite 規則（所有 404 導向 index.html），並同時解決 Google OAuth 不支援帶 Hash 的回調問題（可能需要後端協助轉址）。

### 3. 雙版本共存
目前後端同時支援舊版前端 (`reelmind.aijob.com.tw`) 和新版前端 (`reelmindv2.zeabur.app`)。
- 新版前端使用 `_NEW` 結尾的環境變數
- 後端根據 `redirect_uri` 判斷請求來源
- 若未來全面切換到新版，可移除舊版邏輯並將環境變數合併

### 4. API 參數規範
後端 Pydantic 模型 `ChatBody` 要求必填欄位為 `message`。前端開發時請務必遵守此規範，避免 422 錯誤。若需修改欄位名稱，請優先修改前端適配，或在後端添加 Alias。

### 5. CORS 配置
支付結帳 API (`/api/payment/checkout`) 需要正確的 CORS 配置。所有 `HTMLResponse` 都應包含 CORS 頭，確保跨域請求正常。

### 6. 響應式設計
- 手機版標籤頁使用橫向滾動（`flex` + `overflow-x-auto`）
- 導航欄在手機版簡化（移除不必要的元素）
- 按鈕文字在手機版可縮短（使用 `hidden sm:inline`）

### 7. 資料存取說明
- UserDB 和 Mode1 都應提供「資料存取說明」功能
- 使用 Dialog 形式，點擊幫助圖標後顯示
- 說明各功能對應的資料儲存位置

### 8. 自動登出機制
- **24 小時閒置自動登出**：用戶超過 24 小時未活動時自動登出
- **活動追蹤**：監聽滑鼠、鍵盤、點擊、滾動等用戶活動
- **節流優化**：每 1 分鐘最多更新一次活動時間，避免頻繁寫入
- **定期檢查**：每 5 分鐘檢查一次是否超過閒置時間
- **用戶提示**：登出前顯示提示訊息

### 9. 時區處理
- **統一時區**：所有時間顯示統一使用台灣時區（Asia/Taipei）
- **日期格式化**：使用 `toLocaleString` 並明確指定 `timeZone: 'Asia/Taipei'`
- **一致性**：確保所有頁面的時間顯示格式一致

---

## 最新更新（2025-11-30）

### 🔒 安全性增強
- ✅ **24 小時閒置自動登出**：用戶超過 24 小時未活動時自動登出，提升帳號安全性
- ✅ **活動追蹤機制**：智能追蹤用戶活動（滑鼠、鍵盤、點擊、滾動），節流優化避免頻繁寫入

### 🎨 UI/UX 優化
- ✅ **UserDB 彈窗寬度優化**：電腦版彈窗寬度增加至 90vw，提供更寬敞的查看體驗
- ✅ **內容滑動支援**：詳細內容區域支援左右滑動，方便查看長內容
- ✅ **ScriptEditor 工具列優化**：響應式設計，防止按鈕重疊，手機版只顯示圖標
- ✅ **頁首佈局優化**：電腦版和手機版頁首佈局分離，電腦版保持原樣，手機版居中顯示

### 🐛 問題修復
- ✅ **圖表組件修復**：修復 Statistics 頁面 PieChart 的 ChartContainer 包裹問題
- ✅ **圖標導入修復**：檢查並修復所有頁面的圖標導入問題（Sparkles、Home 等）
- ✅ **時區處理統一**：所有時間顯示統一使用台灣時區（Asia/Taipei）
- ✅ **認證狀態優化**：優化 fetchCurrentUser 超時處理，避免阻塞頁面載入
- ✅ **Mode3 儲存鎖定**：三個生成步驟完成前鎖定儲存按鈕，避免超時錯誤

### 📚 使用說明增強
- ✅ **使用說明 Dialog**：為多個功能添加使用說明（創作者資訊、偏好設定、使用統計、LLM Key）
- ✅ **資料存取說明**：UserDB 和 Mode1 提供資料存取說明，清楚告知用戶各功能對應的資料位置

---

## 未來規劃與維護注意事項

### 1. 推薦邀請碼系統 ✅
- [x] 後端數據庫表結構（referral_codes, referral_records, referral_rewards）
- [x] 推薦碼生成 API
- [x] 推薦統計 API
- [x] 獎勵發放機制
- [x] 前端 UI 整合（Profile 頁面）
- [ ] 通知系統（Toast、站內通知、Email）- 待後端實現

詳細實現指南請參考：`使用統計價值與推薦邀請碼機制報告.md`

### 2. 使用統計優化 ✅
- [x] 增加更多視覺化圖表（圓餅圖、柱狀圖、趨勢圖）
- [x] 功能使用分布圖（PieChart）
- [x] 使用趨勢圖（AreaChart）
- [x] AI 智能分析與建議
- [x] 使用說明 Dialog
- [ ] 對比分析（週期對比、成長率）- 可選增強
- [ ] 個人化洞察（最佳創作時段、最常用功能）- 可選增強
- [ ] 導出功能（PDF 報告、CSV 匯出）- 可選增強

### 3. 功能增強 ✅
- [x] 腳本編輯器（ScriptEditor 組件）
- [x] 匯出功能（TXT、PDF、Word）
- [x] 分享功能（Web Share API + 降級方案）
- [x] 複製功能
- [ ] 富文本編輯（Markdown 支援）- 部分實現
- [ ] 協作功能 - 待規劃

### 4. 效能優化（可選）
- [ ] 使用 React.memo 優化組件渲染
- [ ] 使用 useMemo 和 useCallback 優化計算
- [ ] 圖片懶加載優化

### 5. 部署檢查清單
每次部署前請確認：
- [ ] `vite.config.ts` 的輸出目錄是否正確
- [ ] `client/public/oauth/callback/index.html` 是否存在（用於 OAuth 跳轉）
- [ ] 後端 `cors_origins` 是否包含當前部署的域名
- [ ] 環境變數是否正確設定
- [ ] Google OAuth Redirect URI 是否正確
- [ ] ECPay 支付回調 URL 是否正確

---

## 相關文檔

- **域名遷移指南**：`域名遷移與功能優化指南.md`
- **推薦邀請碼機制**：`使用統計價值與推薦邀請碼機制報告.md`
- **UserDB 欄位說明**：`docs/UserDB-欄位說明.md`
- **後端 API 分析**：`docs/BACKEND_API_ANALYSIS.md`
- **部署指南**：`docs/ZEABUR_DEPLOYMENT_GUIDE.md`

---

## 聯絡資訊

如有問題或建議，請聯繫開發團隊或查看幫助中心頁面。
