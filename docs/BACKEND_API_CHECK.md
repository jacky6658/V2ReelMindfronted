# 後端 API 對接檢查報告

## 前端 API 配置

### API 基礎設定
**檔案**: `client/src/lib/api-config.ts`

```typescript
export const API_CONFIG = {
  baseURL: 'https://api.aijob.com.tw',
  timeout: 30000,
  withCredentials: true
};
```

✅ **配置正確**：
- 使用您的後端 API 網域
- 啟用 credentials（支援 Cookie 認證）
- 30 秒超時設定

---

## API 端點對接清單

### 1. 認證相關 API

#### Google OAuth
**前端調用**: `client/src/lib/google-auth.ts`
```typescript
// 登入
window.location.href = `${API_CONFIG.baseURL}/api/auth/google/login`;

// 回調
GET /api/auth/google/callback?code={code}
```

**後端端點**（需確認）:
- `POST /api/auth/google/login` - 發起 Google OAuth
- `GET /api/auth/google/callback` - 處理 OAuth 回調

#### 登出
**前端調用**: `clearAuth()` - 清除本地 token
**後端端點**（可選）:
- `POST /api/auth/logout` - 伺服器端登出

---

### 2. Mode1 (IP 人設規劃) API

#### 帳號定位對話
**前端調用**: `client/src/pages/Mode1.tsx`
```typescript
POST /api/chat/stream
Body: {
  message: string,
  conversation_history: Array<{role, content}>,
  mode: 'profile' | 'planning' | 'script'
}
```

**後端需求**:
- 支援 **Server-Sent Events (SSE)** 流式回應
- Content-Type: `text/event-stream`
- 回應格式: `data: {chunk}\n\n`

#### 載入歷史記錄
**前端調用**:
```typescript
GET /api/ip-planning/my
Response: {
  results: Array<{
    id: string,
    title: string,
    content: string,
    created_at: string,
    type: 'profile' | 'planning' | 'script'
  }>
}
```

#### 刪除記錄
**前端調用**:
```typescript
DELETE /api/ip-planning/{id}
```

---

### 3. Mode3 (一鍵生成) API

#### AI 對話生成
**前端調用**: `client/src/pages/Mode3.tsx`
```typescript
POST /api/chat/stream
Body: {
  message: string,
  conversation_history: Array<{role, content}>
}
```

**後端需求**:
- 與 Mode1 相同，支援 SSE 流式回應
- 可能需要區分 mode 參數

---

### 4. UserDB (使用者資料) API

#### 載入腳本
**前端調用**: `client/src/pages/UserDB.tsx`
```typescript
GET /api/scripts/my
Response: {
  results: Array<{
    id: string,
    title: string,
    content: string,
    platform: string,
    created_at: string
  }>
}
```

#### 載入對話記錄
**前端調用**:
```typescript
GET /api/conversations/my
Response: {
  results: Array<{
    id: string,
    title: string,
    message_count: number,
    last_message: string,
    created_at: string
  }>
}
```

#### 載入生成記錄
**前端調用**:
```typescript
GET /api/generations/my
Response: {
  results: Array<{
    id: string,
    type: string,
    title: string,
    content: string,
    created_at: string
  }>
}
```

#### 刪除資料
**前端調用**:
```typescript
DELETE /api/scripts/{id}
DELETE /api/conversations/{id}
DELETE /api/generations/{id}
```

---

## 需要確認的後端配置

### 1. CORS 設定
**您的後端已配置**:
```python
cors_origins = [
    "https://reelmind.aijob.com.tw",  # ✅ 前端網域
    "http://localhost:5173",           # ✅ 本地開發
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,            # ✅ 允許 Cookie
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**需要添加**（部署到 Zeabur 後）:
```python
cors_origins = [
    "https://reelmind.aijob.com.tw",
    "https://your-zeabur-domain.zeabur.app",  # 添加 Zeabur 網域
    "http://localhost:5173",
]
```

### 2. JWT 認證
**前端發送**:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**後端需要**:
- 驗證 JWT token
- 從 token 中提取 user_id
- 保護需要認證的端點

### 3. Google OAuth 回調 URL
**前端回調頁面**: `/oauth/callback`
**後端需要配置**:
```python
GOOGLE_REDIRECT_URI = "https://reelmind.aijob.com.tw/oauth/callback"
# 或
GOOGLE_REDIRECT_URI = "https://api.aijob.com.tw/api/auth/google/callback"
```

**Google Cloud Console 需要添加**:
- 授權重新導向 URI: `https://api.aijob.com.tw/api/auth/google/callback`
- 或: `https://reelmind.aijob.com.tw/oauth/callback`

---

## API 回應格式要求

### 成功回應
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": "錯誤訊息",
  "code": "ERROR_CODE"
}
```

### SSE 流式回應
```
data: {"chunk": "這是"}

data: {"chunk": "流式"}

data: {"chunk": "回應"}

data: [DONE]
```

---

## 部署後需要測試的項目

### 1. Google OAuth 流程
- [ ] 點擊「登入」按鈕
- [ ] 重定向到 Google 登入頁面
- [ ] 授權後回到前端
- [ ] 成功取得 JWT token
- [ ] Token 儲存在 localStorage

### 2. Mode1 功能
- [ ] 帳號定位對話正常運作
- [ ] 流式回應正確顯示
- [ ] 歷史記錄正確載入
- [ ] 刪除功能正常

### 3. Mode3 功能
- [ ] AI 對話正常運作
- [ ] 流式回應正確顯示

### 4. UserDB 功能
- [ ] 腳本列表正確載入
- [ ] 對話記錄正確載入
- [ ] 生成記錄正確載入
- [ ] 刪除功能正常

### 5. CORS 和認證
- [ ] 跨域請求成功
- [ ] Cookie 正確傳送
- [ ] JWT token 正確驗證

---

## 潛在問題和解決方案

### 問題 1: CORS 錯誤
**症狀**: 瀏覽器控制台顯示 CORS policy 錯誤

**解決方案**:
1. 確認後端 CORS 設定包含前端網域
2. 確認 `allow_credentials=True`
3. 確認 `allow_methods` 和 `allow_headers` 設定正確

### 問題 2: 401 未授權
**症狀**: API 請求返回 401 錯誤

**解決方案**:
1. 檢查 JWT token 是否正確儲存在 localStorage
2. 檢查 Authorization header 格式
3. 檢查後端 JWT 驗證邏輯

### 問題 3: SSE 流式回應失敗
**症狀**: 流式回應中斷或無法顯示

**解決方案**:
1. 確認後端 Content-Type 為 `text/event-stream`
2. 確認回應格式為 `data: {chunk}\n\n`
3. 確認前端 `apiStream` 函數正確處理 SSE

### 問題 4: Google OAuth 回調失敗
**症狀**: 授權後無法回到前端或無法取得 token

**解決方案**:
1. 檢查 Google Cloud Console 的授權重新導向 URI
2. 檢查後端 GOOGLE_REDIRECT_URI 配置
3. 檢查前端 `/oauth/callback` 路由

---

## 建議

1. **先在本地測試**:
   - 前端: `http://localhost:5173`
   - 後端: `http://localhost:8000`
   - 確認所有功能正常後再部署

2. **使用 Postman 測試 API**:
   - 測試每個端點的回應格式
   - 確認 CORS 設定
   - 確認認證流程

3. **監控錯誤**:
   - 前端: 瀏覽器開發者工具 Console 和 Network 標籤
   - 後端: 伺服器日誌

4. **逐步部署**:
   - 先部署後端，確認 API 可訪問
   - 再部署前端，測試整合
   - 最後配置 Google OAuth

---

## 總結

✅ **前端 API 配置正確**
✅ **後端 CORS 已配置**
⚠️ **需要確認**:
1. 所有 API 端點是否已實現
2. SSE 流式回應格式是否正確
3. Google OAuth 回調 URL 配置
4. Zeabur 部署後的網域 CORS 設定

**建議**: 部署後使用瀏覽器開發者工具的 Network 標籤監控所有 API 請求，確認回應格式和狀態碼。
