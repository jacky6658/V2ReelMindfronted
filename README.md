# ReelMind React 專案開發文件

> **專案版本**: 2.0.0  
> **最後更新**: 2025-11-28  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Python FastAPI  
> **狀態**: ✅ 核心功能已完成，可進入生產環境

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [已完成功能](#已完成功能)
3. [待完成工作](#待完成工作)
4. [技術架構](#技術架構)
5. [部署指南](#部署指南)
6. [API 對接說明](#api-對接說明)
7. [開發注意事項](#開發注意事項)
8. [未來規劃與維護注意事項](#未來規劃與維護注意事項)

---

## 專案概述

ReelMind 是一個 AI 短影音智能體平台，從靈感枯竭到內容量產，專為 IG、TikTok、Shorts 打造。本專案將原始的純 HTML 網站轉換為現代化的 React 應用，保留深色科技感設計風格，並整合 Python FastAPI 後端。

### 核心功能
- **Mode1（IP 人設規劃）**: AI 對話式帳號定位、14天規劃、今日腳本生成
- **Mode3（一鍵生成）**: 表單式 3 步驟生成（帳號定位 + 選題建議 + 腳本內容）
- **Experience（免費體驗）**: 與 Mode3 相同功能，無需登入
- **UserDB（使用者資料）**: 腳本、對話、生成記錄管理
- **實戰指南**: 12 篇專業文章
- **訂閱付款**: 綠界金流整合

---

## ✅ 已完成功能

### 1. 核心頁面
- [x] **首頁（Home）**：3D 流體動畫背景、核心功能介紹、定價方案。
- [x] **Mode3（一鍵生成）**：完整的 3 步驟生成流程，串接 Gemini AI。
- [x] **Experience（免費體驗）**：無需登入即可使用的生成功能。
- [x] **Mode1（IP 人設規劃）**：AI 對話介面，支援多標籤頁切換。
- [x] **UserDB（使用者資料管理）**：腳本庫、對話記錄、生成記錄管理。
- [x] **Guide（實戰指南）**：文章列表與詳情頁。
- [x] **Subscription（訂閱方案）**：整合綠界金流，支援月繳/年繳。
- [x] **登入/註冊**：Google OAuth 2.0 登入整合。

### 2. 技術架構優化
- [x] **前端路由**：遷移至 `HashRouter` 以解決 SPA 部署時的 404 問題。
- [x] **OAuth 流程**：修正 Google OAuth 回調流程，解決 Zeabur 部署後的路由重定向問題。
- [x] **後端 API**：
  - 修正 Gemini 模型名稱為 `gemini-pro`。
  - 添加 CORS 白名單與 CSRF 豁免路徑。
  - 調整 API 參數接收名稱 (`message` vs `prompt`) 以匹配前端。
- [x] **載入動畫**：為生成功能添加質感 `ThinkingAnimation`。
- [x] **錯誤頁面**：美化 404 頁面，提供返回首頁與功能導航。

---

## 📋 待完成工作

### 🔴 高優先級
#### 1. Mode1 IP 人設規劃功能增強 ✅ 已完成
- [x] **快速按鈕**：對話框上方添加快速指令按鈕。 ✅ 已完成
- [x] **生成結果管理**：優化結果展示彈窗，支援儲存到資料庫。 ✅ 已完成
- [x] **自動儲存**：檢測對話意圖自動儲存重要內容。 ✅ 已完成

#### 2. UserDB 與 Mode1 整合 ✅ 已完成
- [x] 實現從 Mode1 直接儲存內容到 UserDB。 ✅ 已完成
- [x] UserDB 資料同步機制。 ✅ 已完成（儲存後從本地移除，UserDB 需手動刷新）

### 🟡 中優先級
#### 3. 實戰指南內容補充 ✅ 已完成
- [x] 補充剩餘文章的詳細內容。 ✅ 已完成（9 篇文章已補充完整內容）

#### 4. UI/UX 細節優化 ✅ 已完成
- [x] 全面檢查深色/淺色主題切換效果。 ✅ 已完成
- [x] 表格樣式美化。 ✅ 已完成

### 🟢 低優先級（可選優化）
#### 5. 效能優化
- [ ] 使用 React.memo 優化組件渲染
- [ ] 使用 useMemo 和 useCallback 優化計算
- [ ] 圖片懶加載優化

#### 6. 功能增強
- [ ] 腳本編輯器（富文本編輯）
- [ ] 匯出功能（PDF、Word）
- [ ] 分享功能
- [ ] 協作功能

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
└── Sonner (Toast 提示)
```

### 專案結構
```
reelmind_demo/
├── client/
│   ├── public/
│   │   ├── oauth/callback/index.html  # OAuth Redirector
│   │   └── Caddyfile                  # 靜態伺服器配置
│   ├── src/
│   │   ├── components/                # 共用組件
│   │   ├── pages/                     # 頁面組件
│   │   ├── lib/                       # 工具庫 (API client)
│   │   └── router.tsx                 # 路由配置
├── ReelMindbackend-main/              # Python 後端
│   └── app.py                         # 主程式
└── ...
```

---

## 部署指南

### Zeabur 部署

由於 Zeabur 的靜態網站託管對於 SPA 的 Rewrite 支援可能不穩定，本專案採用 **Hash Router** 方案，並配合 **Redirector 頁面** 來處理 Google OAuth 回調。

#### 1. 環境變數設定
在 Zeabur 設定以下環境變數：

**前端 (Client):**
```bash
VITE_API_BASE_URL=https://api.aijob.com.tw
```

**後端 (Server):**
```bash
GOOGLE_CLIENT_ID=舊版ID
GOOGLE_CLIENT_SECRET=舊版Secret
GOOGLE_REDIRECT_URI=舊版RedirectURI

GOOGLE_CLIENT_ID_NEW=新版ID
GOOGLE_CLIENT_SECRET_NEW=新版Secret
GOOGLE_REDIRECT_URI_NEW=https://reelmindv2.zeabur.app/oauth/callback

GEMINI_API_KEY=您的APIKey
JWT_SECRET=您的JWT密鑰
```

#### 2. 路由配置 (關鍵)
- **前端路由**: 使用 `HashRouter` (`/#/path`)。
- **OAuth 回調**: 
  - Google 設定 Redirect URI 為 `https://reelmindv2.zeabur.app/oauth/callback`。
  - 伺服器端需存在 `client/public/oauth/callback/index.html` 檔案。
  - 該 HTML 負責將流量重定向到 `/#/auth/callback`。

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

---

## 未來規劃與維護注意事項

### 1. 路由模式
目前使用 **Hash Router** (`/#/`) 是為了最穩定的跨平台部署兼容性。若未來需要改回 **Browser Router** (`/`)，必須確保伺服器（Nginx/Caddy）正確配置 Rewrite 規則（所有 404 導向 index.html），並同時解決 Google OAuth 不支援帶 Hash 的回調問題（可能需要後端協助轉址）。

### 2. 雙版本共存
目前後端同時支援舊版前端 (`reelmind.aijob.com.tw`) 和新版前端 (`reelmindv2.zeabur.app`)。
- 新版前端使用 `_NEW` 結尾的環境變數。
- 後端根據 `redirect_uri` 判斷請求來源。
- 若未來全面切換到新版，可移除舊版邏輯並將環境變數合併。

### 3. API 參數規範
後端 Pydantic 模型 `ChatBody` 要求必填欄位為 `message`。前端開發時請務必遵守此規範，避免 422 錯誤。若需修改欄位名稱，請優先修改前端適配，或在後端添加 Alias。

### 4. 部署檢查清單
每次部署前請確認：
- [ ] `vite.config.ts` 的輸出目錄是否正確。
- [ ] `client/public/oauth/callback/index.html` 是否存在（用於 OAuth 跳轉）。
- [ ] 後端 `ALLOWED_FRONTENDS` 是否包含當前部署的域名。
