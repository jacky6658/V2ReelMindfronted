/**
 * 主操作介面（智能體主畫面）
 * 這是登入後用戶會看到的核心功能頁面
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AppDashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">歡迎來到 ReelMind 主操作介面</h1>
      {user && (
        <p className="mb-6 text-muted-foreground">您好，{user.name || user.email}！</p>
      )}
      <p className="mb-8">在這裡您可以開始使用智能體功能。</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>IP人設規劃</CardTitle>
            <CardDescription>規劃您的 IP 人設</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/mode1">
              <Button>開始使用</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>一鍵生成</CardTitle>
            <CardDescription>快速生成短影音腳本</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/mode3">
              <Button>開始使用</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>創作者資料庫</CardTitle>
            <CardDescription>管理您的創作者資料</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/userdb">
              <Button>開始使用</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* API 對接狀態檢查 */}
      <div className="mt-8 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border dark:border-border/50">
        <h3 className="font-semibold mb-2 text-foreground dark:text-foreground">API 對接狀態</h3>
        <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Mode1: 使用 <code className="bg-background dark:bg-background/50 px-1 rounded border border-border dark:border-border/50">/api/mode1/chat/stream</code></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Mode3: 使用 <code className="bg-background dark:bg-background/50 px-1 rounded border border-border dark:border-border/50">/api/mode3/generate/*</code></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Experience: 使用 <code className="bg-background dark:bg-background/50 px-1 rounded border border-border dark:border-border/50">/api/mode3/generate/*</code></span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AppDashboard;

