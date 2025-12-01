/**
 * React Router 路由配置
 * 使用 React Router v6 取代 wouter
 */

import React, { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const Intro = lazy(() => import('./pages/Intro'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Guide = lazy(() => import('./pages/Guide'));
const GuideArticle = lazy(() => import('./pages/GuideArticle'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const AppDashboard = lazy(() => import('./pages/AppDashboard'));
const Login = lazy(() => import('./pages/Login'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Mode1 = lazy(() => import('./pages/Mode1'));
const Mode3 = lazy(() => import('./pages/Mode3'));
const UserDB = lazy(() => import('./pages/UserDB'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Forum = lazy(() => import('./pages/Forum'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Orders = lazy(() => import('./pages/Orders'));
const Statistics = lazy(() => import('./pages/Statistics'));
const ReferralRewards = lazy(() => import('./pages/ReferralRewards'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">載入中...</p>
    </div>
  </div>
);

// Error fallback component for route errors
function RouteErrorBoundary() {
  const error = useRouteError();
  const isMimeError = error instanceof Error && (
    error.message.includes('MIME type') ||
    error.message.includes('module script') ||
    error.message.includes('javascript-or-wasm') ||
    error.message.includes('Failed to fetch dynamically imported module')
  );

  // 如果是 MIME 類型錯誤，重定向到 404
  React.useEffect(() => {
    if (isMimeError) {
      window.location.href = '/#/404';
    }
  }, [isMimeError]);

  // 如果是 MIME 類型錯誤，顯示簡短訊息（因為會重定向）
  if (isMimeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">資源載入錯誤，正在跳轉...</p>
        </div>
      </div>
    );
  }

  // 其他錯誤顯示錯誤訊息
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error.status}</h1>
          <p className="text-muted-foreground">{error.statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">發生錯誤</h1>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : '未知錯誤'}
        </p>
      </div>
    </div>
  );
}

// 創建路由配置
export const router = createHashRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/intro',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Intro />
      </Suspense>
    ),
  },
  {
    path: '/pricing',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Pricing />
      </Suspense>
    ),
  },
  {
    path: '/guide',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Guide />
      </Suspense>
    ),
  },
  {
    path: '/guide/:slug',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <GuideArticle />
      </Suspense>
    ),
  },
  {
    path: '/article/:id',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ArticleDetail />
      </Suspense>
    ),
  },
  {
    path: '/about',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <About />
      </Suspense>
    ),
  },
  {
    path: '/contact',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Contact />
      </Suspense>
    ),
  },
  {
    path: '/forum',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Forum />
      </Suspense>
    ),
  },
  {
    path: '/help',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <HelpCenter />
        </PrivateRoute>
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <OAuthCallback />
      </Suspense>
    ),
  },
  {
    path: '/app',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <AppDashboard />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/profile',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Profile />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Settings />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/mode1',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Mode1 />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/mode3',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Mode3 />
        </PrivateRoute>
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/userdb',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <UserDB />
        </PrivateRoute>
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/checkout',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Checkout />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/orders',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Orders />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/statistics',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <Statistics />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/referral-rewards',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ReferralRewards />
      </Suspense>
    ),
  },
  {
    path: '/payment-result',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PrivateRoute requiresAuth={true}>
          <PaymentResult />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/subscription',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Navigate to="/pricing" replace />
      </Suspense>
    ),
  },
  {
    path: '/404',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
]);

