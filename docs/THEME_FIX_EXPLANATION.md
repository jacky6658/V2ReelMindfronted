# 主題切換問題修復說明

## 問題描述

用戶回報了兩個主題切換問題：

1. **主題切換只有 Hero 區變化**：點擊主題切換按鈕後，只有 Hero 區塊的背景會變化，其他區塊（h1、功能區塊等）都沒有變化
2. **本地和發布環境主題不一致**：本地開發環境預設是黑色（深色模式），但發布後預設是白色（淺色模式）

## 根本原因

### 問題 1：主題切換只影響部分區塊

**原因**：Tailwind CSS 4 的 `@custom-variant dark` 配置錯誤

```css
/* 錯誤的配置 */
@custom-variant dark (&:is(.dark *));
```

這個配置的問題是：
- `&:is(.dark *)` 只會匹配 `.dark` 元素的**子元素**
- 不會匹配 `.dark` 元素本身（也就是 `<html class="dark">`）
- 導致只有部分使用了特定選擇器的元素會套用深色樣式

### 問題 2：本地和發布環境主題不一致

**原因**：HTML 沒有初始主題設定

1. `index.html` 的 `<html>` 標籤沒有預設的 `dark` class
2. ThemeContext 在 React 載入後才執行，但此時頁面已經渲染了一次
3. 本地開發時，localStorage 可能已經保存了 `dark` 主題
4. 發布後的新環境沒有 localStorage，會使用預設的 `light` 主題

## 修復方案

### 修復 1：更正 CSS dark variant 配置

```css
/* 修復後的配置 */
@custom-variant dark (&:where(.dark, .dark *));
```

使用 `&:where(.dark, .dark *)` 可以：
- 同時匹配 `.dark` 元素本身和其子元素
- 確保所有使用 `dark:` 前綴的樣式都能正確套用

### 修復 2：添加初始主題設定腳本

在 `index.html` 的 `<body>` 開頭添加：

```html
<body>
  <!-- Theme initialization script (must run before React) -->
  <script>
    (function() {
      const theme = localStorage.getItem('theme') || 'dark';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  <div id="root"></div>
  ...
</body>
```

這個腳本的作用：
- 在 React 載入前就執行
- 從 localStorage 讀取主題設定，如果沒有則使用 `'dark'` 作為預設
- 立即設定 `<html>` 的 class，避免閃爍

### 修復 3：改進 ThemeContext

```tsx
useEffect(() => {
  const root = document.documentElement;
  
  // 移除所有主題 class
  root.classList.remove('light', 'dark');
  
  // 添加當前主題 class
  root.classList.add(theme);

  if (switchable) {
    localStorage.setItem("theme", theme);
  }
}, [theme, switchable]);
```

改進點：
- 明確移除 `light` 和 `dark` class，避免衝突
- 添加當前主題的 class（而不是只處理 `dark`）
- 確保 localStorage 和 DOM 同步

## 測試驗證

### 測試步驟

1. **清除 localStorage**
   ```javascript
   localStorage.clear();
   ```

2. **重新載入頁面**
   - 應該看到深色模式（預設）
   - 所有區塊都應該是深色背景

3. **點擊主題切換按鈕**
   - 整個頁面應該切換到淺色模式
   - 包括導航欄、Hero、功能區塊、定價區塊等所有區域

4. **再次點擊主題切換按鈕**
   - 整個頁面應該切換回深色模式

5. **重新載入頁面**
   - 主題應該保持在上次選擇的狀態（localStorage 持久化）

### 預期結果

✅ **深色模式**：
- 導航欄：深色背景
- Hero 區塊：深色背景 + 深色影片遮罩
- 功能區塊：深色 Card
- 定價區塊：深色背景
- 所有文字：淺色

✅ **淺色模式**：
- 導航欄：淺色背景
- Hero 區塊：淺色背景 + 淺色影片遮罩
- 功能區塊：淺色 Card
- 定價區塊：淺色背景
- 所有文字：深色

## 技術細節

### Tailwind CSS 4 Dark Mode

Tailwind CSS 4 使用 `@custom-variant` 來定義自訂變體：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

這個配置告訴 Tailwind：
- 當元素有 `.dark` class，或者其祖先元素有 `.dark` class 時
- 套用 `dark:` 前綴的樣式

### CSS 變數系統

我們使用 CSS 變數來定義主題顏色：

```css
:root {
  /* 淺色模式 */
  --background: oklch(0.985 0.002 247.839);
  --foreground: oklch(0.235 0.015 65);
}

.dark {
  /* 深色模式 */
  --background: oklch(0.141 0.01 247.858);
  --foreground: oklch(0.92 0.005 65);
}
```

當 `<html>` 有 `.dark` class 時，所有 CSS 變數都會自動切換到深色模式的值。

### React Context

ThemeContext 負責：
1. 管理主題狀態（`light` 或 `dark`）
2. 提供 `toggleTheme` 函數
3. 同步主題到 DOM 和 localStorage

## 部署注意事項

### 環境變數

確保以下環境變數已設定：
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_REDIRECT_URI`
- `VITE_FRONTEND_URL`
- `VITE_API_BASE_URL`

### 建置和部署

```bash
# 安裝依賴
pnpm install

# 建置
pnpm build

# 部署到 Zeabur
# 確保設定了正確的環境變數
```

### 驗證

部署後，請驗證：
1. 預設主題是深色模式
2. 主題切換按鈕能正常工作
3. 主題設定會持久化（重新載入後保持）
4. 所有頁面的主題都能正確切換

## 總結

通過以下三個修復：
1. 更正 CSS dark variant 配置
2. 添加初始主題設定腳本
3. 改進 ThemeContext 邏輯

我們解決了主題切換的兩個主要問題：
- ✅ 整個頁面都能正確切換主題（不只 Hero 區）
- ✅ 本地和發布環境的預設主題一致（都是深色模式）
