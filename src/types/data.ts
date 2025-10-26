/**
 * Core Data Models
 * Base interfaces for database entities
 */

export interface Page {
  id: string;
  page_url: string | null;
  page_name: string | null;
  inserted_at: string;
}

export interface PageWithStats extends Page {
  post_count?: number;
  last_post_at?: string | null;
  comment_count?: number;
  reaction_count?: number;
  engagement_score?: number;
  sentiment_summary?: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    average_polarity: number | null;
  };
}

export interface User {
  id: string;
  fb_profile_id: string | null;
  full_name: string | null;
  inserted_at: string;
}

export interface Post {
  id: string;
  page_url: string | null;
  full_url: string | null;
  content: string | null;
  inserted_at: string;
  comments?: Comment[];
  sentiments?: Sentiment[];
  reactions?: Reaction[];
  comment_count?: number;
  reaction_count?: number;
  engagement_score?: number;
}

export interface Comment {
  id: string;
  full_url: string | null;
  post_id: string | null;
  user_id: string | null;
  content: string | null;
  inserted_at: string;
  user?: User;
  sentiments?: Sentiment[];
}

export interface Sentiment {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  sentiment: string | null;
  sentiment_category: string | null;
  confidence: number | null;
  probabilities: Record<string, number> | null;
  polarity: number | null;
  inserted_at: string;
}

export interface Reaction {
  id: string;
  user_id: string | null;
  post_id: string | null;
  comment_id: string | null;
  reaction_type: 'like' | 'love' | 'sad' | 'angry' | 'haha' | 'wow' | null;
  inserted_at: string;
}

/**
 * Extended Models with Joined Data
 * Models that include related data through joins
 */

export interface PostWithDetails extends Post {
  comments: CommentWithDetails[];
  sentiments: Sentiment[];
  reactions: Reaction[];
  comment_count: number;
  reaction_count: number;
}

export interface CommentWithDetails extends Comment {
  user: User;
  post: Post;
  sentiments: Sentiment[];
  reactions: Reaction[];
}

export interface UserWithDetails extends User {
  comments?: Comment[];
  reactions?: Reaction[];
  comment_count?: number;
  reaction_count?: number;
  stats?: {
    total_comments: number;
    posts_commented: number;
    total_reactions: number;
    sentiment_breakdown: {
      positive: number;
      neutral: number;
      negative: number;
      total: number;
      average_polarity: number | null;
    };
    top_pages: Array<{
      page_id: string | null;
      page_name: string | null;
      comment_count: number;
      sentiment_breakdown: {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
        average_polarity: number | null;
      };
    }>;
  };
}

export interface SentimentWithDetails extends Sentiment {
  post: Post;
  comment: Comment;
}
