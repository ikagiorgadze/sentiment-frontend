/**
 * Central export file for all type definitions
 * 
 * Note: New database types (User, Post, Comment, etc.) are available
 * from './data', './api', and './auth' modules but not exported here
 * to avoid conflicts with legacy types.
 * 
 * Import database types directly when needed:
 * import { User, Post, Comment } from '@/types/data';
 * import { AuthUser } from '@/types/auth';
 */

/**
 * Legacy types for backward compatibility with existing components
 */

export type SentimentType = 'positive' | 'negative' | 'neutral';

// User interface for auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  createdAt: string;
}

// Post interface
export interface Post {
  id: string;
  content: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  sentiment: SentimentType;
  sentimentScore: number;
  likes: number;
  comments: number;
  shares: number;
  platform: 'facebook' | 'instagram' | 'twitter';
  url: string;
  createdAt: string;
  scrapedAt: string;
  aiAnalysis?: string;
}

// Comment interface
export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorId: string;
  sentiment: SentimentType;
  sentimentScore: number;
  createdAt: string;
}

// Dashboard stats (kept for existing components)
export interface DashboardStats {
  totalPosts: number;
  positivePosts: number;
  negativePosts: number;
  neutralPosts: number;
  avgEngagement: number;
  sentimentTrend: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  pageSummary: {
    totalPages: number;
    activePagesLast7Days: number;
    pagesAddedLast30Days: number;
    avgPostsPerPage: number;
    avgCommentsPerPage: number;
    avgSentimentConfidence?: number;
  };
  postSummary: {
    postsLast24Hours: number;
    postsLast7Days: number;
    avgCommentsPerPost: number;
    avgReactionsPerPost: number;
    uniqueCommenters: number;
    avgSentimentConfidence: number;
  };
}

// Scraping job (kept for existing components)
export interface ScrapingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// Legacy auth types (kept for existing components)
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Auth response
export interface AuthResponse {
  token: string;
  user: User;
}
