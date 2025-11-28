# ReelMind React 專案整合指南

## 📋 專案概述

這是一個基於 React + TypeScript + Vite 的 ReelMind 前端專案，整合了您原始網站的核心功能，並使用現代化的設計風格。

### 技術棧

- **前端框架**：React 19 + TypeScript
- **建構工具**：Vite
- **樣式系統**：Tailwind CSS 4
- **UI 組件**：shadcn/ui
- **路由**：Wouter
- **後端 API**：Python FastAPI (https://api.aijob.com.tw)

## ✅ 已實現功能

### 1. 首頁 (/)
- ✅ 深色/淺色主題切換
- ✅ 3D 流體動畫影片背景
- ✅ 玻璃擬態設計風格
- ✅ 完整的 SEO 優化
- ✅ Google OAuth 登入整合
- ✅ 響應式設計

### 2. Mode1 - IP 人設規劃 (/mode1)
- ✅ 三個功能標籤：帳號定位、14天規劃、今日腳本
- ✅ AI 對話式介面
- ✅ 流式 API 支援
- ✅ 歷史記錄管理
- ✅ 登入保護
- ✅ 使用說明 Dialog

### 3. Mode3 - 一鍵生成 (/mode3)
- ✅ AI 對話式腳本生成
- ✅ 流式 API 支援
- ✅ 複製功能
- ✅ 清空對話
- ✅ 登入保護
- ✅ 使用說明 Dialog

### 4. UserDB - 使用者資料 (/userdb)
- ✅ 三個資料標籤：我的腳本、對話記錄、生成記錄
- ✅ 資料表格顯示
- ✅ 查看詳情 Dialog
- ✅ 刪除功能
- ✅ 複製功能
- ✅ 登入保護

### 5. OAuth 認證
- ✅ Google OAuth 登入
- ✅ Token 管理
- ✅ 自動刷新 Token
- ✅ 登入狀態保持
- ✅ OAuth 回調處理

## 🔧 後端 API 對接

### API 配置

所有 API 配置在 `client/src/lib/api-config.ts`：

```typescript
export const API_BASE_URL = isLocalDev 
  ? 'http://127.0.0.1:8000'  // 本地測試
  : 'https://api.aijob.com.tw';  // 正式版後端
```

### 已對接的 API 端點

#### 認證相關
- `GET /api/auth/google` - Google OAuth 登入
- `GET /api/auth/csrf-token` - 獲取 CSRF Token
- `POST /api/auth/refresh` - 刷新 Token

#### Mode1 相關
- `POST /api/generate/positioning` - 帳號定位生成
- `POST /api/generate/topics` - 14天規劃生成
- `POST /api/generate/script` - 今日腳本生成
- `GET /api/ip-planning/my` - 獲取歷史記錄
- `DELETE /api/ip-planning/results/{id}` - 刪除記錄

#### Mode3 相關
- `POST /api/chat/stream` - 流式對話生成

#### UserDB 相關
- `GET /api/user/scripts/me` - 獲取我的腳本
- `GET /api/user/conversations/me` - 獲取對話記錄
- `GET /api/user/generations/me` - 獲取生成記錄
- `DELETE /api/user/scripts/{id}` - 刪除腳本
- `DELETE /api/user/conversations/{id}` - 刪除對話
- `DELETE /api/user/generations/{id}` - 刪除生成記錄

## 🚀 本地開發

### 安裝依賴

```bash
cd /home/ubuntu/reelmind_demo
pnpm install
```

### 啟動開發伺服器

```bash
pnpm dev
```

開發伺服器會在 http://localhost:3000 啟動

### 建構生產版本

```bash
pnpm build
```

建構產物會輸出到 `client/dist` 目錄

## 📦 部署

### 1. 環境變數

確保後端環境變數正確設定：

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://api.aijob.com.tw/api/auth/google/callback

# JWT
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256

# 前端 URL
FRONTEND_URL=https://reelmind.aijob.com.tw

# 資料庫
DATABASE_URL=your_database_url
```

### 2. 後端 CORS 配置

您的 Python FastAPI 後端已經正確配置了 CORS：

```python
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://reelmind.aijob.com.tw",  # ✅ 您的前端網域
    "https://admin.aijob.com.tw",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. 部署前端

#### 選項 A：部署到 Zeabur

1. 建構專案：
```bash
pnpm build
```

2. 上傳 `client/dist` 目錄到 Zeabur

3. 配置靜態網站服務

#### 選項 B：部署到 Vercel/Netlify

1. 連接 GitHub 倉庫

2. 配置建構設定：
   - Build Command: `cd client && pnpm build`
   - Output Directory: `client/dist`

3. 部署

## 🔐 Google OAuth 配置

### 1. Google Cloud Console 設定

確保在 Google Cloud Console 中添加以下授權重定向 URI：

```
https://api.aijob.com.tw/api/auth/google/callback
```

### 2. OAuth 流程

1. 使用者點擊「登入」按鈕
2. 彈出 Google OAuth 視窗
3. 使用者授權後，Google 重定向到後端
4. 後端處理認證，重定向到前端 `/auth/callback`
5. 前端接收 Token，儲存到 localStorage
6. 自動重定向到首頁

## 📝 待實現功能

以下功能尚未實現，可以根據需要逐步添加：

### 1. Mode2 - AI 腳本生成
- 3 步驟腳本生成流程
- 平台選擇（IG/TikTok/Shorts）
- 腳本結構選擇

### 2. 其他頁面
- Experience（免費體驗）
- Subscription（訂閱方案）
- Guide（12 篇指南文章）
- About（關於我們）
- Contact（聯絡我們）
- Forum（論壇）

### 3. 進階功能
- 腳本編輯器
- 匯出功能（PDF、Word）
- 分享功能
- 協作功能

## 🐛 已知問題

### 1. API 端點可能需要調整

某些 API 端點可能與您的實際後端不完全一致，需要根據實際情況調整：

- `client/src/lib/api-client.ts` - API 請求邏輯
- `client/src/pages/Mode1.tsx` - Mode1 API 調用
- `client/src/pages/Mode3.tsx` - Mode3 API 調用
- `client/src/pages/UserDB.tsx` - UserDB API 調用

### 2. 資料結構可能需要調整

API 回應的資料結構可能與程式碼中的 TypeScript 介面不完全一致，需要根據實際 API 回應調整。

## 💡 開發建議

### 1. API 測試

建議使用 Postman 或類似工具測試所有 API 端點，確保：
- 回應格式正確
- 認證流程正常
- CORS 配置正確

### 2. 錯誤處理

目前的錯誤處理較為基礎，建議增強：
- 更詳細的錯誤訊息
- 錯誤日誌記錄
- 使用者友善的錯誤提示

### 3. 效能優化

- 使用 React.memo 優化組件渲染
- 使用 useMemo 和 useCallback 優化計算
- 實現虛擬滾動（大量資料時）
- 圖片懶加載

### 4. 測試

建議添加：
- 單元測試（Vitest）
- 整合測試
- E2E 測試（Playwright）

## 📞 技術支援

如有問題，請檢查：

1. **瀏覽器開發者工具**
   - Console：查看 JavaScript 錯誤
   - Network：查看 API 請求和回應

2. **後端日誌**
   - 檢查 FastAPI 伺服器日誌
   - 確認 CORS 配置

3. **環境變數**
   - 確認所有必要的環境變數已設定
   - 檢查 API URL 是否正確

## 🎯 下一步

1. **測試所有功能**
   - 在本地環境測試
   - 確認與後端 API 正確對接

2. **調整 API 端點**
   - 根據實際後端 API 調整程式碼

3. **部署到生產環境**
   - 建構生產版本
   - 部署到 Zeabur 或其他平台

4. **持續優化**
   - 根據使用者反饋優化
   - 添加更多功能

---

**專案狀態**：✅ 核心功能已完成，可以開始測試和部署

**最後更新**：2025-11-27
