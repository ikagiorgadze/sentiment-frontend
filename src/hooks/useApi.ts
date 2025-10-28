import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type {
  PostQueryOptions,
  CommentQueryOptions,
  UserQueryOptions,
  SentimentQueryOptions,
  QueryOptions,
  ScrapeRequest,
  ScrapeStatus,
  PageQueryOptions,
  UsersListResult,
} from '@/types/api';
import type {
  GrantAccessRequest,
  RevokeAccessRequest,
  BulkGrantPostRequest,
  BulkGrantUserRequest,
} from '@/types/auth';
import type { Post, DashboardStats, ScrapingJob } from '@/types';
import type { PageWithStats, UserWithDetails } from '@/types/data';

/**
 * Custom React Query hooks for API integration
 * These hooks provide type-safe data fetching with automatic caching and refetching
 */

// Posts Queries
export const usePosts = (options: PostQueryOptions | { sentiment?: string; search?: string } = {}) => {
  return useQuery({
    queryKey: ['posts', options],
    queryFn: () => apiService.getPosts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePages = (options: PageQueryOptions = {}) => {
  return useQuery<PageWithStats[]>({
    queryKey: ['pages', options],
    queryFn: () => apiService.getPages(options),
    staleTime: 10 * 60 * 1000,
  });
};

export const useUsers = (options: UserQueryOptions = {}) => {
  return useQuery<UsersListResult>({
    queryKey: ['users', options],
    queryFn: () => apiService.getUsers(options),
    staleTime: 10 * 60 * 1000,
    keepPreviousData: true,
  });
};

export const useUser = (id: string, options: UserQueryOptions = {}, enabled = true) => {
  return useQuery<UserWithDetails>({
    queryKey: ['user', id, options],
    queryFn: () => apiService.getUser(id, options),
    enabled: Boolean(id) && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePost = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => apiService.getPost(id),
    enabled: !!id && enabled,
  });
};

export const usePostComments = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => apiService.getPostComments(postId),
    enabled: !!postId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Dashboard Queries
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Scraping Queries
export const useScrapingJobs = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['scraping-jobs'],
    queryFn: () => apiService.getJobs(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: refetchInterval || 5000, // Refetch every 5 seconds by default
  });
};

export const useScrapeStatus = (requestId: string, enabled = true) => {
  return useQuery({
    queryKey: ['scrape-status', requestId],
    queryFn: () => apiService.getScrapeStatus(requestId),
    enabled: !!requestId && enabled,
    refetchInterval: 3000, // Refetch every 3 seconds
  });
};

export const useUserScrapeRequests = () => {
  return useQuery({
    queryKey: ['user-scrape-requests'],
    queryFn: () => apiService.getUserScrapeRequests(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Analytics Queries
export const useSentimentSummary = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: ['sentiment-summary', postId],
    queryFn: () => apiService.getSentimentSummary(postId),
    enabled: !!postId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserActivity = (userId: string, postId: string, enabled = true) => {
  return useQuery({
    queryKey: ['user-activity', userId, postId],
    queryFn: () => apiService.getUserActivity(userId, postId),
    enabled: !!userId && !!postId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Scraping Mutations
export const useScrapingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ScrapeRequest | string) => apiService.initiateScraping(data),
    onSuccess: () => {
      // Invalidate scraping-related queries
      queryClient.invalidateQueries({ queryKey: ['scraping-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-scrape-requests'] });
    },
  });
};

export const useStartScrapingJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (url: string) => apiService.startJob(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scraping-jobs'] });
    },
  });
};

// Access Control Mutations
export const useGrantAccessMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GrantAccessRequest) => apiService.grantAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-accessible-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-accessible-posts'] });
    },
  });
};

export const useRevokeAccessMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RevokeAccessRequest) => apiService.revokeAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-accessible-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-accessible-posts'] });
    },
  });
};

export const useBulkGrantPostAccess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkGrantPostRequest) => apiService.bulkGrantPostAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-accessible-users'] });
    },
  });
};

export const useBulkGrantUserAccess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkGrantUserRequest) => apiService.bulkGrantUserAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accessible-posts'] });
    },
  });
};

// Seed Data Mutations
export const useSeedDatabaseMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.seedDatabase(),
    onSuccess: () => {
      // Invalidate all data queries
      queryClient.invalidateQueries();
    },
  });
};

export const useClearDatabaseMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.clearDatabase(),
    onSuccess: () => {
      // Invalidate all data queries
      queryClient.invalidateQueries();
    },
  });
};

// Generic query wrapper with custom options
export const useApiQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<T>({
    queryKey,
    queryFn,
    ...options,
  });
};

// Generic mutation wrapper with custom options
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) => {
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
  });
};
