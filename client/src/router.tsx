/**
 * React Router 路由配置
 * 使用 React Router v6 取代 wouter
 */

import React, { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
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
const Mode1 = lazy(() => import('./pages/Mode1'));
const Mode3 = lazy(() => import('./pages/Mode3'));
const UserDB = lazy(() => import('./pages/UserDB'));
const Experience = lazy(() => import('./pages/Experience'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Forum = lazy(() => import('./pages/Forum'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const Subscription = lazy(() => import('./pages/Subscription'));
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

// 創建路由配置
export const router = createHashRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    ),
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
    path: '/experience',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Experience />
      </Suspense>
    ),
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
    path: '*',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

