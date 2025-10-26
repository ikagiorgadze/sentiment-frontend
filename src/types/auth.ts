/**
 * Authentication and Authorization Models
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

/**
 * Access Control Types
 */

export interface GrantAccessRequest {
  authUserId: string;
  postId: string;
}

export interface RevokeAccessRequest {
  authUserId: string;
  postId: string;
}

export interface BulkGrantPostRequest {
  userIds: string[];
  postId: string;
}

export interface BulkGrantUserRequest {
  authUserId: string;
  postIds: string[];
}
