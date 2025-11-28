/**
 * 個人資料 / 訂閱狀態頁面
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Profile: React.FC = () => {
  const { user, subscription, logout } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">個人資料</h1>
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>用戶資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.picture && (
              <div className="flex items-center gap-4">
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Email:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">姓名:</p>
              <p className="font-medium">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">訂閱等級:</p>
              <p className="font-medium">{subscription === 'pro' ? 'Pro' : subscription === 'free' ? 'Free' : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">訂閱狀態:</p>
              <p className="font-medium">{user.is_subscribed ? '已訂閱' : '未訂閱'}</p>
            </div>
            <Button
              onClick={logout}
              variant="destructive"
              className="mt-6"
            >
              登出
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-4">您尚未登入。</p>
      )}
    </div>
  );
};

export default Profile;

