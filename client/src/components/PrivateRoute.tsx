/**
 * PrivateRoute 組件
 * 用於保護需要登入才能訪問的路由
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface PrivateRouteProps {
  children: React.ReactElement;
  requiresAuth?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiresAuth = true }) => {
  const { isLoggedIn, loading } = useAuthStore();

  // 如果正在載入，顯示載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果需要登入但未登入，導向登入頁
  if (requiresAuth && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 已登入或不需要驗證，正常渲染子組件
  return children;
};

export default PrivateRoute;

