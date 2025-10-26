import axios, { AxiosInstance } from 'axios';
import type {
  PostQueryOptions,
  CommentQueryOptions,
  UserQueryOptions,
  SentimentQueryOptions,
  QueryOptions,
  RegisterRequest,
  LoginRequest,
  ScrapeRequest,
  ScrapeStatus,
  PageQueryOptions,
} from '@/types/api';
import type {
  GrantAccessRequest,
  RevokeAccessRequest,
  BulkGrantPostRequest,
  BulkGrantUserRequest,
} from '@/types/auth';
import type {
  PostWithDetails,
  CommentWithDetails,
  UserWithDetails,
  SentimentWithDetails,
  User,
  Post,
  Comment,
  Sentiment,
  Reaction,
  PageWithStats,
} from '@/types/data';
import type { AuthUser } from '@/types/auth';
import type { 
  User as LegacyUser, 
  Post as LegacyPost, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData,
  DashboardStats,
  Comment as LegacyComment,
  ScrapingJob 
} from '@/types';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Client Configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.dispatchEvent(
          new CustomEvent('auth:unauthorized', {
            detail: { reason: 'token_expired' },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

// Error handling helper
export interface ApiError {
  success: false;
  error: string;
  message: string;
}

export const handleApiError = (error: unknown): ApiError => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { data?: ApiError } }).response?.data
  ) {
    return (error as { response: { data: ApiError } }).response.data;
  }
  return {
    success: false,
    error: 'NETWORK_ERROR',
    message:
      error instanceof Error
        ? error.message
        : 'Network error occurred. Please try again.',
  };
};

// API Service Interface
interface UserActivity {
  user_id: string;
  post_id: string;
  comments: Comment[];
  reactions: Reaction[];
  comment_count: number;
  reaction_count: number;
}

interface SentimentSummary {
  post_id: string;
  total_sentiments: number;
  sentiment_categories: Record<string, number>;
  average_confidence: number;
  average_polarity: number;
}

interface ApiService {
  // Authentication
  register: (data: RegisterRequest | RegisterData) => Promise<AuthResponse>;
  login: (data: LoginRequest | LoginCredentials) => Promise<AuthResponse>;
  getCurrentUser: () => Promise<LegacyUser>;
  logout: () => Promise<void>;

  // Posts
  getPosts: (options?: PostQueryOptions | { sentiment?: string; search?: string }) => Promise<LegacyPost[]>;
  getPost: (id: string) => Promise<PostWithDetails>;
  getPostComments: (postId: string) => Promise<CommentWithDetails[]>;

  // Comments
  getComments: (options?: CommentQueryOptions) => Promise<CommentWithDetails[]>;
  getComment: (id: string, options?: CommentQueryOptions) => Promise<CommentWithDetails>;

  // Users
  getUsers: (options?: UserQueryOptions) => Promise<UserWithDetails[]>;
  getUser: (id: string, options?: UserQueryOptions) => Promise<UserWithDetails>;

  // Sentiments
  getSentiments: (options?: SentimentQueryOptions) => Promise<SentimentWithDetails[]>;
  getSentiment: (id: string, options?: SentimentQueryOptions) => Promise<SentimentWithDetails>;

  // Analytics
  getSentimentSummary: (postId: string) => Promise<SentimentSummary>;
  getCommentsWithSentiment: (options?: CommentQueryOptions) => Promise<CommentWithDetails[]>;
  getPostUsers: (postId: string, options?: QueryOptions) => Promise<UserWithDetails[]>;
  getUserPosts: (userId: string, options?: QueryOptions) => Promise<PostWithDetails[]>;
  getUserActivity: (userId: string, postId: string) => Promise<UserActivity>;
  getPages: (options?: PageQueryOptions) => Promise<PageWithStats[]>;

  // Dashboard
  getStats: () => Promise<DashboardStats>;

  // Scraping
  initiateScraping: (data: ScrapeRequest | string) => Promise<{ request_id: string } | ScrapingJob>;
  getScrapeStatus: (requestId: string) => Promise<ScrapeStatus>;
  getUserScrapeRequests: () => Promise<ScrapeStatus[] | ScrapingJob[]>;
  getJobs: () => Promise<ScrapingJob[]>;
  startJob: (url: string) => Promise<ScrapingJob>;
  startMultipleJobs: (urls: string[]) => Promise<ScrapingJob[]>;

  // Access Control
  grantAccess: (data: GrantAccessRequest) => Promise<void>;
  revokeAccess: (data: RevokeAccessRequest) => Promise<void>;
  getUserAccessiblePosts: (userId: string) => Promise<string[]>;
  getPostAccessibleUsers: (postId: string) => Promise<AuthUser[]>;
  bulkGrantPostAccess: (data: BulkGrantPostRequest) => Promise<void>;
  bulkGrantUserAccess: (data: BulkGrantUserRequest) => Promise<void>;

  // Seed Data
  seedDatabase: () => Promise<{ stats: Record<string, number> }>;
  clearDatabase: () => Promise<void>;
}

// API Service Implementation
const apiService: ApiService = {
  // Authentication
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },
  
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },
  
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Posts
  getPosts: async (options = {}) => {
    const response = await apiClient.get('/posts', { params: options });
    return response.data.data;
  },
  
  getPost: async (id) => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data.data;
  },

  getPostComments: async (postId) => {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    return response.data.data;
  },

  // Comments
  getComments: async (options = {}) => {
    const response = await apiClient.get('/comments', { params: options });
    return response.data.data;
  },
  
  getComment: async (id, options = {}) => {
    const response = await apiClient.get(`/comments/${id}`, { params: options });
    return response.data.data;
  },

  // Users
  getUsers: async (options = {}) => {
    const response = await apiClient.get('/users', { params: options });
    return response.data.data;
  },
  
  getUser: async (id, options = {}) => {
    const response = await apiClient.get(`/users/${id}`, { params: options });
    return response.data.data;
  },

  // Sentiments
  getSentiments: async (options = {}) => {
    const response = await apiClient.get('/sentiments', { params: options });
    return response.data.data;
  },
  
  getSentiment: async (id, options = {}) => {
    const response = await apiClient.get(`/sentiments/${id}`, { params: options });
    return response.data.data;
  },

  // Analytics
  getSentimentSummary: async (postId) => {
    const response = await apiClient.get(`/analytics/posts/${postId}/sentiment-summary`);
    return response.data.data;
  },
  
  getCommentsWithSentiment: async (options = {}) => {
    const response = await apiClient.get('/analytics/comments-with-sentiment', { params: options });
    return response.data.data;
  },
  
  getPostUsers: async (postId, options = {}) => {
    const response = await apiClient.get(`/analytics/posts/${postId}/users`, { params: options });
    return response.data.data;
  },
  
  getUserPosts: async (userId, options = {}) => {
    const response = await apiClient.get(`/analytics/users/${userId}/posts`, { params: options });
    return response.data.data;
  },
  
  getUserActivity: async (userId, postId) => {
    const response = await apiClient.get(`/analytics/users/${userId}/posts/${postId}/activity`);
    return response.data.data;
  },

  getPages: async (options = {}) => {
    const response = await apiClient.get('/pages', { params: options });
    return response.data.data;
  },

  // Dashboard
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  },

  // Scraping
  initiateScraping: async (data) => {
    const response = await apiClient.post('/scrape', typeof data === 'string' ? { url: data } : data);
    return response.data.data;
  },
  
  getScrapeStatus: async (requestId) => {
    const response = await apiClient.get(`/scrape/status/${requestId}`);
    return response.data.data;
  },
  
  getUserScrapeRequests: async () => {
    const response = await apiClient.get('/scrape/user/all');
    return response.data.data;
  },

  getJobs: async () => {
    const response = await apiClient.get('/scrape/jobs');
    return response.data.data;
  },

  startJob: async (url) => {
    // Detect if it's a page or post URL
    const isPostUrl = url.includes('/posts/') || url.includes('/permalink/') || url.includes('/photo');
    
    // Format the request body based on URL type
    const requestBody = isPostUrl 
      ? { post_urls: [url], source: 'api' }
      : { page_urls: [url], source: 'api' };
    
    const response = await apiClient.post('/scrape', requestBody);
    return response.data.data;
  },

  startMultipleJobs: async (urls: string[]) => {
    // Separate page and post URLs
    const pageUrls: string[] = [];
    const postUrls: string[] = [];

    urls.forEach(url => {
      const isPostUrl = url.includes('/posts/') || url.includes('/permalink/') || url.includes('/photo');
      if (isPostUrl) {
        postUrls.push(url);
      } else {
        pageUrls.push(url);
      }
    });

    // Send batch requests
    const requests = [];
    if (pageUrls.length > 0) {
      requests.push(apiClient.post('/scrape', { page_urls: pageUrls, source: 'api' }));
    }
    if (postUrls.length > 0) {
      requests.push(apiClient.post('/scrape', { post_urls: postUrls, source: 'api' }));
    }

    const responses = await Promise.all(requests);
    return responses.map(r => r.data.data);
  },

  // Access Control
  grantAccess: async (data) => {
    await apiClient.post('/access/grant', data);
  },
  
  revokeAccess: async (data) => {
    await apiClient.delete('/access/revoke', { data });
  },
  
  getUserAccessiblePosts: async (userId) => {
    const response = await apiClient.get(`/access/user/${userId}`);
    return response.data.data;
  },
  
  getPostAccessibleUsers: async (postId) => {
    const response = await apiClient.get(`/access/post/${postId}`);
    return response.data.data;
  },
  
  bulkGrantPostAccess: async (data) => {
    await apiClient.post('/access/grant-bulk-post', data);
  },
  
  bulkGrantUserAccess: async (data) => {
    await apiClient.post('/access/grant-bulk-user', data);
  },

  // Seed Data
  seedDatabase: async () => {
    const response = await apiClient.post('/seed');
    return response.data;
  },
  
  clearDatabase: async () => {
    await apiClient.delete('/seed');
  },
};

// Legacy exports for backward compatibility
export const authService = {
  login: apiService.login,
  register: apiService.register,
  getCurrentUser: apiService.getCurrentUser,
  logout: apiService.logout,
};

export const postService = {
  getPosts: apiService.getPosts,
  getPostById: apiService.getPost,
  getPostComments: apiService.getPostComments,
};

export const dashboardService = {
  getStats: apiService.getStats,
};

export const scrapingService = {
  getJobs: apiService.getJobs,
  startJob: apiService.startJob,
};

export { apiService };
export default apiClient;
