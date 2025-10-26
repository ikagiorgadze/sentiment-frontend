import { lazy } from 'react';

// Lazy load pages for code splitting
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyPosts = lazy(() => import('@/pages/Posts'));
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyScraping = lazy(() => import('@/pages/Scraping'));
export const LazyUsers = lazy(() => import('@/pages/Users'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyLogin = lazy(() => import('@/pages/Login'));
export const LazyRegister = lazy(() => import('@/pages/Register'));
