# Google OAuth 登入功能實現

## 📋 後端 API 端點

### 1. 發起 Google OAuth 認證
**端點**: `GET /api/auth/google`

**查詢參數**:
- `fb` (optional): 前端 base URL（必須在白名單內）

**回應**:
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. Google OAuth 回調（GET）
**端點**: `GET /api/auth/google/callback`

**查詢參數**:
- `code`: Google 授權碼
- `state` (optional): 前端 base URL
- `redirect_uri` (optional): 重定向 URI

**流程**:
1. 接收 Google 的授權碼
2. 交換授權碼獲取訪問令牌
3. 獲取用戶資訊
4. 生成用戶 ID
5. 保存或更新用戶認證資訊
6. 生成 JWT token
7. 重定向到前端並設定 cookie

### 3. Google OAuth 回調（POST）
**端點**: `POST /api/auth/google/callback`

**請求格式**:
```json
{
  "code": "授權碼",
  "redirect_uri": "重定向 URI"
}
```

**回應**:
```json
{
  "access_token": "JWT token",
  "refresh_token": "refresh token",
  "user": {
    "user_id": "...",
    "email": "...",
    "name": "...",
    "picture": "...",
    "is_subscribed": false
  }
}
```

### 4. 刷新 Token
**端點**: `POST /api/auth/refresh`

**請求格式**:
```json
{
  "refresh_token": "refresh token"
}
```

**回應**:
```json
{
  "access_token": "new JWT token",
  "refresh_token": "new refresh token"
}
```

### 5. 獲取當前用戶資訊
**端點**: `GET /api/auth/me`

**Headers**:
- `Authorization: Bearer {access_token}`

**回應**:
```json
{
  "user_id": "...",
  "email": "...",
  "name": "...",
  "picture": "...",
  "is_subscribed": false
}
```

### 6. 登出
**端點**: `POST /api/auth/logout`

**Headers**:
- `Authorization: Bearer {access_token}`

**回應**:
```json
{
  "message": "登出成功"
}
```

---

## 🔧 前端實現步驟

### 1. 創建 AuthContext

創建 `client/src/contexts/AuthContext.tsx`：

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  is_subscribed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 載入用戶資訊
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiGet<User>('/api/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('載入用戶資訊失敗:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      // 獲取 Google OAuth URL
      const { auth_url } = await apiGet<{ auth_url: string }>('/api/auth/google');
      // 重定向到 Google 登入頁面
      window.location.href = auth_url;
    } catch (error) {
      console.error('登入失敗:', error);
    }
  };

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout');
      setUser(null);
      // 清除 token
      localStorage.removeItem('ipPlanningToken');
      localStorage.removeItem('ipPlanningRefreshToken');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem('ipPlanningRefreshToken');
      if (!refresh_token) {
        throw new Error('No refresh token');
      }

      const response = await apiPost<{
        access_token: string;
        refresh_token: string;
      }>('/api/auth/refresh', { refresh_token });

      localStorage.setItem('ipPlanningToken', response.access_token);
      localStorage.setItem('ipPlanningRefreshToken', response.refresh_token);

      await loadUser();
    } catch (error) {
      console.error('刷新 token 失敗:', error);
      setUser(null);
      localStorage.removeItem('ipPlanningToken');
      localStorage.removeItem('ipPlanningRefreshToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 2. 創建 OAuth 回調頁面

創建 `client/src/pages/OAuthCallback.tsx`：

```typescript
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 從 URL 獲取授權碼
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        toast.error('登入失敗');
        setLocation('/');
        return;
      }

      if (!code) {
        toast.error('缺少授權碼');
        setLocation('/');
        return;
      }

      // 調用後端 API 交換 token
      const response = await apiPost<{
        access_token: string;
        refresh_token: string;
        user: any;
      }>('/api/auth/google/callback', {
        code,
        redirect_uri: window.location.origin + '/oauth/callback'
      });

      // 保存 token
      localStorage.setItem('ipPlanningToken', response.access_token);
      localStorage.setItem('ipPlanningRefreshToken', response.refresh_token);

      toast.success('登入成功');
      setLocation('/mode1');
    } catch (error) {
      console.error('OAuth 回調處理失敗:', error);
      toast.error('登入失敗');
      setLocation('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在登入...</p>
      </div>
    </div>
  );
}
```

### 3. 更新 App.tsx

```typescript
import { AuthProvider } from '@/contexts/AuthContext';
import OAuthCallback from '@/pages/OAuthCallback';

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/oauth/callback" component={OAuthCallback} />
          <Route path="/mode1" component={Mode1} />
          {/* ... 其他路由 */}
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 4. 更新 Mode1 使用 user_id

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function Mode1() {
  const { user } = useAuth();

  // 在 API 請求中使用 user_id
  const requestData = {
    message: userMessage.content,
    history: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    conversation_type: 'ip_planning',
    user_id: user?.user_id || null
  };
}
```

### 5. 添加登入按鈕

在導航欄添加登入/登出按鈕：

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

function Navigation() {
  const { user, login, logout } = useAuth();

  return (
    <nav>
      {user ? (
        <div className="flex items-center gap-4">
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
          <span>{user.name}</span>
          <Button onClick={logout}>登出</Button>
        </div>
      ) : (
        <Button onClick={login}>登入</Button>
      )}
    </nav>
  );
}
```

---

## 🔐 環境變數設定

後端需要設定以下環境變數：

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.aijob.com.tw/api/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret

# 前端 URL
FRONTEND_BASE_URL=https://3000-iow3h13qpsifo2f0gf2rp-d43b9b5c.manus-asia.computer
```

---

## ✅ 實現檢查清單

- [ ] 創建 AuthContext
- [ ] 創建 OAuthCallback 頁面
- [ ] 更新 App.tsx 添加 AuthProvider 和路由
- [ ] 更新 Mode1 使用 user_id
- [ ] 添加登入/登出按鈕到導航欄
- [ ] 測試登入流程
- [ ] 測試登出流程
- [ ] 測試 token 刷新
- [ ] 測試 API 調用帶上 user_id
