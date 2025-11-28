# 後端 API 端點分析（Mode1 相關）

## 📋 Mode1（IP 人設規劃）相關 API 端點

### 1. 生成類 API

#### 1.1 `/api/generate/positioning` (POST)
- **功能**：一鍵生成帳號定位
- **限流**：10 次/分鐘
- **請求格式**：`ChatBody`
  - `user_input`: 用戶輸入
  - `conversation_history`: 對話歷史
  - `user_id`: 用戶 ID（可選）
- **特點**：
  - 支持用戶自定義 API Key（BYOK）
  - 如果沒有用戶 API Key，使用系統預設的 `GEMINI_API_KEY`

#### 1.2 `/api/generate/topics` (POST)
- **功能**：一鍵生成選題推薦
- **限流**：10 次/分鐘
- **請求格式**：`ChatBody`
  - `user_input`: 用戶輸入
  - `conversation_history`: 對話歷史
  - `profile`: 帳號定位資訊（從歷史記錄中獲取）
  - `user_id`: 用戶 ID（可選）

#### 1.3 `/api/generate/script` (POST)
- **功能**：一鍵生成腳本
- **限流**：10 次/分鐘
- **請求格式**：`ChatBody`
  - `user_input`: 用戶輸入
  - `conversation_history`: 對話歷史
  - `profile`: 帳號定位資訊
  - `topic`: 選題資訊
  - `user_id`: 用戶 ID（可選）

#### 1.4 `/api/chat/stream` (POST)
- **功能**：流式對話 API（通用）
- **限流**：30 次/分鐘
- **請求格式**：`ChatBody`
  - `user_input`: 用戶輸入
  - `conversation_history`: 對話歷史
  - `user_id`: 用戶 ID（可選）
- **特點**：
  - 支持流式回覆（Server-Sent Events）
  - 支持用戶自定義 API Key（BYOK）
  - 驗證用戶 ID 和消息長度

---

### 2. 儲存類 API

#### 2.1 `/api/user/positioning/save` (POST)
- **功能**：保存帳號定位結果
- **請求格式**：
  - `user_id`: 用戶 ID
  - `content`: 定位內容
  - `title`: 標題（可選）

#### 2.2 `/api/user/positioning/{user_id}` (GET)
- **功能**：獲取用戶的帳號定位記錄

#### 2.3 `/api/user/positioning/{record_id}` (DELETE)
- **功能**：刪除帳號定位記錄

#### 2.4 `/api/scripts/save` (POST)
- **功能**：保存腳本結果
- **請求格式**：
  - `user_id`: 用戶 ID
  - `content`: 腳本內容
  - `title`: 標題（可選）

#### 2.5 `/api/scripts/my` (GET)
- **功能**：獲取用戶的腳本記錄

#### 2.6 `/api/scripts/{script_id}` (DELETE)
- **功能**：刪除腳本記錄

#### 2.7 `/api/scripts/{script_id}/name` (PUT)
- **功能**：更新腳本名稱

---

### 3. IP 規劃結果管理 API

#### 3.1 `/api/ip-planning/save` (POST)
- **功能**：保存 IP 規劃結果
- **請求格式**：
  - `user_id`: 用戶 ID
  - `title`: 標題
  - `content`: 內容
  - `category`: 類別（positioning/topics/script）

#### 3.2 `/api/ip-planning/my` (GET)
- **功能**：獲取用戶的 IP 規劃結果
- **查詢參數**：
  - `user_id`: 用戶 ID
  - `category`: 類別（可選，用於過濾）

#### 3.3 `/api/ip-planning/results/{result_id}` (DELETE)
- **功能**：刪除 IP 規劃結果

#### 3.4 `/api/ip-planning/results/{result_id}/title` (PUT)
- **功能**：更新 IP 規劃結果標題
- **請求格式**：
  - `title`: 新標題

#### 3.5 `/api/user/ip-planning/permission` (GET)
- **功能**：檢查用戶是否有權限使用 IP 規劃功能

---

### 4. 記憶系統 API

#### 4.1 `/api/user/memory/{user_id}` (GET)
- **功能**：獲取用戶的記憶資訊

#### 4.2 `/api/user/conversations/{user_id}` (GET)
- **功能**：獲取用戶的對話記錄

#### 4.3 `/api/user/generations/{user_id}` (GET)
- **功能**：獲取用戶的生成記錄

#### 4.4 `/api/user/stm/{user_id}` (GET)
- **功能**：獲取用戶的短期記憶

#### 4.5 `/api/user/stm/{user_id}` (DELETE)
- **功能**：清除用戶的短期記憶

#### 4.6 `/api/memory/long-term` (POST)
- **功能**：保存長期記憶

#### 4.7 `/api/memory/long-term` (GET)
- **功能**：獲取長期記憶

---

## 🔍 前端目前使用的 API

根據 Mode1.tsx 的代碼：

```typescript
// 目前使用的 endpoint
const endpoint = '/api/chat';

// 請求格式
const requestData = {
  user_input: userMessage.content,
  conversation_history: messages.map(m => ({
    role: m.role,
    content: m.content
  }))
};
```

**問題**：前端使用 `/api/chat`，但後端沒有這個端點！

---

## ✅ 建議的修正方案

### 方案 1：使用 `/api/chat/stream`（推薦）

**優點**：
- 後端已經實現
- 支持流式回覆（更好的用戶體驗）
- 支持 BYOK
- 限流更寬鬆（30 次/分鐘）

**修改前端**：
```typescript
const endpoint = '/api/chat/stream';
```

### 方案 2：根據功能使用不同端點

**優點**：
- 更精確的功能分類
- 可以針對不同功能優化 prompt

**修改前端**：
```typescript
// 根據快速按鈕或對話內容判斷使用哪個端點
let endpoint = '/api/generate/positioning'; // 預設

// 如果用戶點擊「14天規劃」快速按鈕
if (prompt.includes('14天')) {
  endpoint = '/api/generate/topics';
}

// 如果用戶點擊「今日腳本」快速按鈕
if (prompt.includes('腳本')) {
  endpoint = '/api/generate/script';
}
```

### 方案 3：後端新增 `/api/chat` 端點

**優點**：
- 前端不需要修改
- 後端統一處理所有對話

**修改後端**：
```python
@app.post("/api/chat")
@rate_limit("30/minute")
async def chat(body: ChatBody, request: Request):
    # 統一處理所有對話，讓 LLM 自動判斷類型
    # 實現邏輯類似 /api/chat/stream
    pass
```

---

## 🎯 推薦方案

**使用方案 1：修改前端使用 `/api/chat/stream`**

理由：
1. 後端已經實現，不需要修改後端
2. 流式回覆提供更好的用戶體驗
3. 支持 BYOK 和用戶自定義 API Key
4. 限流更寬鬆（30 次/分鐘 vs 10 次/分鐘）
5. 讓 LLM 自動判斷用戶需求類型（符合您的設計理念）

---

## 📝 需要修改的前端代碼

### 1. 修改 API endpoint

**文件**：`client/src/pages/Mode1.tsx`

**修改**：
```typescript
// 從
const endpoint = '/api/chat';

// 改為
const endpoint = '/api/chat/stream';
```

### 2. 確認請求格式

後端 `ChatBody` 的格式：
```python
class ChatBody(BaseModel):
    user_input: str
    conversation_history: List[Dict[str, str]] = []
    user_id: Optional[str] = None
    profile: Optional[str] = None  # 用於 topics 和 script
    topic: Optional[str] = None    # 用於 script
```

前端目前的格式已經正確：
```typescript
const requestData = {
  user_input: userMessage.content,
  conversation_history: messages.map(m => ({
    role: m.role,
    content: m.content
  }))
};
```

### 3. 添加 user_id（如果有登入功能）

```typescript
const requestData = {
  user_input: userMessage.content,
  conversation_history: messages.map(m => ({
    role: m.role,
    content: m.content
  })),
  user_id: currentUser?.id // 如果有登入功能
};
```

---

## 🔄 儲存功能的 API 對接

目前前端的「儲存」按鈕調用 `autoSaveResult` 函數，但這只是保存到前端狀態。

**建議對接後端 API**：

### 儲存到 IP 規劃結果

```typescript
const handleSaveResult = async (content: string, category: 'positioning' | 'topics' | 'script') => {
  try {
    const response = await fetch('/api/ip-planning/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: currentUser?.id,
        title: `${category === 'positioning' ? '帳號定位' : category === 'topics' ? '選題方向' : '短影音腳本'} - ${new Date().toLocaleString('zh-TW')}`,
        content: content,
        category: category
      })
    });

    if (response.ok) {
      toast.success('已儲存到資料庫');
    } else {
      toast.error('儲存失敗');
    }
  } catch (error) {
    toast.error('儲存失敗');
  }
};
```

### 載入已儲存的結果

```typescript
const loadSavedResults = async () => {
  try {
    const response = await fetch(`/api/ip-planning/my?user_id=${currentUser?.id}`);
    if (response.ok) {
      const data = await response.json();
      setSavedResults(data.results || []);
    }
  } catch (error) {
    console.error('載入結果失敗', error);
  }
};
```

---

## 總結

1. **立即修改**：將前端的 `/api/chat` 改為 `/api/chat/stream`
2. **添加 user_id**：如果有登入功能，添加 user_id 到請求中
3. **對接儲存 API**：將「儲存」按鈕對接到 `/api/ip-planning/save`
4. **載入歷史記錄**：使用 `/api/ip-planning/my` 載入用戶的歷史結果
