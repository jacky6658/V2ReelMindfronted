/**
 * 個人資料頁面
 */

import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscription, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主控台
            </Button>
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>
              ReelMind
            </h1>
            <span className="text-sm text-muted-foreground hidden md:inline">
              個人資料
            </span>
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">個人資料</h1>

          {/* 用戶資訊卡片 */}
          {user && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Badge variant={subscription === 'pro' ? 'default' : 'secondary'}>
                      {subscription === 'pro' ? 'Pro' : subscription === 'free' ? 'Free' : 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">訂閱狀態:</p>
                    <Badge variant={user.is_subscribed ? 'default' : 'outline'}>
                      {user.is_subscribed ? '已訂閱' : '未訂閱'}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="destructive"
                  className="mt-4"
                >
                  登出
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
