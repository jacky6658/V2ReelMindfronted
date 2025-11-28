# Zeabur 部署指南

## 📦 需要上傳的檔案

### ✅ 必須上傳的檔案和目錄

```
reelmind_demo/
├── client/                    # 前端源碼目錄
│   ├── src/                   # React 組件和頁面
│   ├── public/                # 靜態資源（影片、圖片等）
│   └── index.html             # 入口 HTML
├── package.json               # 依賴配置
├── pnpm-lock.yaml             # 鎖定依賴版本
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
├── components.json            # shadcn/ui 配置
├── robots.txt                 # SEO：搜尋引擎爬蟲規則
└── sitemap.xml                # SEO：網站地圖
```

### ❌ 不需要上傳的檔案和目錄

```
node_modules/                  # 依賴包（Zeabur 會自動安裝）
dist/                          # 建構輸出（Zeabur 會自動建構）
.git/                          # Git 版本控制（可選）
*.md                           # 文檔檔案（可選，不影響運行）
```

---

## 🚀 部署步驟

### 步驟 1：準備專案檔案

1. **下載專案**：
   - 點擊 Manus 介面的「Download」按鈕
   - 或使用 Code 面板下載所有檔案

2. **整理檔案**：
   ```bash
   reelmind_demo/
   ├── client/
   ├── package.json
   ├── pnpm-lock.yaml
   ├── vite.config.ts
   ├── tsconfig.json
   ├── components.json
   ├── robots.txt          # 從您提供的檔案複製
   └── sitemap.xml         # 從您提供的檔案複製
   ```

3. **移動 robots.txt 和 sitemap.xml**：
   ```bash
   # 將這兩個檔案放到 client/public/ 目錄
   mv robots.txt client/public/
   mv sitemap.xml client/public/
   ```

### 步驟 2：上傳到 Zeabur

#### 方法 A：使用 Git（推薦）

1. **初始化 Git 倉庫**（如果還沒有）：
   ```bash
   cd reelmind_demo
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub/GitLab**：
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **在 Zeabur 中連接倉庫**：
   - 登入 Zeabur
   - 創建新專案
   - 選擇「從 Git 倉庫部署」
   - 授權並選擇您的倉庫

#### 方法 B：直接上傳（簡單但不推薦）

1. **壓縮專案**：
   ```bash
   cd reelmind_demo
   zip -r reelmind_demo.zip . -x "node_modules/*" -x "dist/*" -x ".git/*"
   ```

2. **上傳到 Zeabur**：
   - 登入 Zeabur
   - 創建新專案
   - 選擇「上傳檔案」
   - 上傳 ZIP 檔案

### 步驟 3：配置 Zeabur

#### 建構設定

Zeabur 會自動檢測 Vite 專案，但您可以手動配置：

**建構命令**：
```bash
pnpm install && pnpm run build
```

**輸出目錄**：
```
dist
```

**安裝命令**：
```bash
pnpm install
```

#### 環境變數

在 Zeabur 專案設定中添加以下環境變數：

```bash
# 後端 API 網址
VITE_API_BASE_URL=https://api.aijob.com.tw

# Google OAuth（如果需要）
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**注意**：Vite 的環境變數必須以 `VITE_` 開頭才能在前端訪問。

### 步驟 4：配置自訂網域（可選）

1. 在 Zeabur 專案設定中找到「Domains」
2. 添加您的網域：`reelmind.aijob.com.tw`
3. 按照指示配置 DNS 記錄：
   - 類型：CNAME
   - 名稱：reelmind
   - 值：<zeabur-提供的網址>

### 步驟 5：更新後端 CORS 設定

部署後，您需要更新 Python 後端的 CORS 設定：

```python
cors_origins = [
    "https://reelmind.aijob.com.tw",           # 您的自訂網域
    "https://your-project.zeabur.app",         # Zeabur 預設網域
    "http://localhost:5173",                   # 本地開發
]
```

---

## 🔧 常見問題

### 問題 1：建構失敗

**可能原因**：
- Node.js 版本不相容
- 依賴安裝失敗

**解決方案**：
1. 檢查 `package.json` 中的 `engines` 欄位：
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. 確保 `pnpm-lock.yaml` 存在

### 問題 2：靜態資源 404

**可能原因**：
- 資源路徑錯誤
- 資源未包含在建構中

**解決方案**：
1. 確保所有靜態資源在 `client/public/` 目錄
2. 在程式碼中使用絕對路徑：`/assets/...`

### 問題 3：API 請求失敗（CORS 錯誤）

**可能原因**：
- 後端 CORS 未包含前端網域

**解決方案**：
1. 更新後端 CORS 設定（見步驟 5）
2. 確保後端允許 credentials：
   ```python
   allow_credentials=True
   ```

### 問題 4：環境變數未生效

**可能原因**：
- 環境變數名稱錯誤（Vite 需要 `VITE_` 前綴）
- 建構時未包含環境變數

**解決方案**：
1. 確保環境變數以 `VITE_` 開頭
2. 重新建構專案

---

## 📊 部署檢查清單

部署前請確認：

- [ ] 所有必要檔案已準備好
- [ ] `robots.txt` 和 `sitemap.xml` 已移動到 `client/public/`
- [ ] `package.json` 中的建構腳本正確
- [ ] 環境變數已在 Zeabur 中設定
- [ ] 後端 CORS 已包含前端網域
- [ ] 靜態資源路徑使用絕對路徑

部署後請測試：

- [ ] 首頁正常載入
- [ ] 影片背景正常播放
- [ ] 主題切換功能正常
- [ ] 所有頁面路由正常
- [ ] API 請求成功（無 CORS 錯誤）
- [ ] Google OAuth 登入流程正常
- [ ] 綠界金流付款流程正常

---

## 🎯 下一步

部署成功後：

1. **測試所有功能**：逐一測試每個頁面和功能
2. **監控錯誤**：使用瀏覽器開發者工具查看錯誤
3. **優化效能**：檢查載入速度和資源大小
4. **設定 Analytics**：整合 Google Analytics 追蹤流量

---

## 💡 提示

### 關於 `public` 目錄

您提到舊檔案都在 `public` 目錄，這是正確的！

**React/Vite 專案結構**：
- `client/public/`：靜態資源（影片、圖片、robots.txt、sitemap.xml 等）
- `client/src/`：React 組件和程式碼

**建構後**：
- `client/public/` 中的所有檔案會直接複製到 `dist/` 根目錄
- 可以通過 `/filename` 訪問（例如：`/robots.txt`、`/sitemap.xml`）

### 關於舊檔案

您提到我把舊檔案也放進去了，這是為了：
1. **保留 SEO 設定**：robots.txt 和 sitemap.xml
2. **保留靜態資源**：圖片、影片等
3. **保持相容性**：確保所有連結正常運作

如果有不需要的檔案，可以刪除。

---

## 📞 需要協助？

如果遇到問題：
1. 檢查 Zeabur 的建構日誌
2. 檢查瀏覽器開發者工具的 Console 和 Network 標籤
3. 參考 `BACKEND_API_CHECK.md` 檢查 API 對接
