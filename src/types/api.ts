import type {
  PostWithDetails,
  CommentWithDetails,
  UserWithDetails,
  SentimentWithDetails,
  Post,
  Comment,
  Sentiment,
  Reaction,
  PageWithStats,
} from './data';
import type { AuthUser } from './auth';

/**
 * Request/Response Models
 */

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

/**
 * Analytics Models
 */

export interface UserActivity {
  user_id: string;
  post_id: string;
  comments: Comment[];
  reactions: Reaction[];
  comment_count: number;
  reaction_count: number;
}

export interface SentimentSummary {
  post_id: string;
  total_sentiments: number;
  sentiment_categories: Record<string, number>;
  average_confidence: number;
  average_polarity: number;
}

export interface WebhookNotification {
  stage: 'posts_inserted' | 'sentiment_complete';
  auth_user_id: string;
  request_id: string;
  post_count?: number;
  comment_count?: number;
  timestamp: string;
}

/**
 * Scraping Models
 */

export interface ScrapeRequest {
  page_urls?: string[];
  post_urls?: string[];
  source: string;
}

export interface ScrapeStatus {
  request_id: string;
  stage: 'posts_inserted' | 'sentiment_complete' | null;
  created_at: string;
  post_count?: number;
  comment_count?: number;
}

/**
 * Query Options
 */

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PostQueryOptions extends QueryOptions {
  page_id?: string;
  page_url?: string;
  page_name?: string;
  full_url?: string;
  includeComments?: boolean;
  includeSentiments?: boolean;
  includeReactions?: boolean;
  includePage?: boolean;
  sentiment?: string;
  search?: string;
}

export interface PageQueryOptions extends QueryOptions {
  page_url?: string;
  page_name?: string;
  includePostStats?: boolean;
  sentiment?: string;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface CommentQueryOptions extends QueryOptions {
  post_id?: string;
  user_id?: string;
  includeUser?: boolean;
  includePost?: boolean;
  includeSentiments?: boolean;
}

export interface UserQueryOptions extends QueryOptions {
  fb_profile_id?: string;
  full_name?: string;
  includeComments?: boolean;
  includeReactions?: boolean;
  includeStats?: boolean;
  onlyWithComments?: boolean;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
}

export interface SentimentQueryOptions extends QueryOptions {
  post_id?: string;
  comment_id?: string;
  sentiment_category?: string;
  minConfidence?: number;
  maxConfidence?: number;
  onlyPostSentiments?: boolean;
  onlyCommentSentiments?: boolean;
  includePost?: boolean;
  includeComment?: boolean;
}

/**
 * API Response Types
 */

// Authentication responses
export type AuthRegisterResponse = SuccessResponse<AuthResponse>;
export type AuthLoginResponse = SuccessResponse<AuthResponse>;
export type AuthMeResponse = SuccessResponse<AuthUser>;
export type AuthLogoutResponse = SuccessResponse<{ message: string }>;

// Post responses
export type PostsResponse = SuccessResponse<PostWithDetails[]>;
export type PostResponse = SuccessResponse<PostWithDetails>;

// Comment responses
export type CommentsResponse = SuccessResponse<CommentWithDetails[]>;
export type CommentResponse = SuccessResponse<CommentWithDetails>;

// User responses
export type UsersResponse = SuccessResponse<UserWithDetails[]> & { meta?: PaginationMeta };
export type UserResponse = SuccessResponse<UserWithDetails>;

// Sentiment responses
export type SentimentsResponse = SuccessResponse<SentimentWithDetails[]>;
export type SentimentResponse = SuccessResponse<SentimentWithDetails>;

// Analytics responses
export type SentimentSummaryResponse = SuccessResponse<SentimentSummary>;
export type UserActivityResponse = SuccessResponse<UserActivity>;

// Page responses
export type PagesResponse = SuccessResponse<PageWithStats[]>;

export interface UsersListResult {
  users: UserWithDetails[];
  totalCount: number;
  meta?: PaginationMeta;
}

// Scraping responses
export type ScrapeInitiateResponse = SuccessResponse<{ request_id: string }>;
export type ScrapeStatusResponse = SuccessResponse<ScrapeStatus>;
export type ScrapeHistoryResponse = SuccessResponse<ScrapeStatus[]>;
