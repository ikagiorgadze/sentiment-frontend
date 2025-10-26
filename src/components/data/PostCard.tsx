import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SentimentBadge } from '@/components/ui/sentiment-badge';
import { Heart, MessageCircle, Share2, ExternalLink, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SentimentType } from '@/types';

interface PostCardProps {
  post: {
    id: string;
    content?: string | null;
    author?: string | null;
    authorAvatar?: string;
    platform?: string | null;
    url?: string;
    createdAt?: string;
    inserted_at?: string;
    sentiment?: string | null;
    sentimentScore?: number | null;
    sentiments?: Array<{
      sentiment?: string | null;
      sentiment_category?: string | null;
      confidence?: number | null;
      comment_id?: string | null;
    }>;
    likes?: number;
    reaction_count?: number;
    comments?: number | Array<unknown>;
    comment_count?: number;
    shares?: number;
    aiAnalysis?: string;
    page?: {
      page_name?: string;
    };
  };
  className?: string;
}

export function PostCard({ post, className }: PostCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/posts/${post.id}`);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const createdAt = post.createdAt || post.inserted_at;
  const sentimentFromList = post.sentiments?.find((sentiment) => !sentiment.comment_id) ?? post.sentiments?.[0];
  const normalizedSentiment = (() => {
    const candidates: Array<string | undefined | null> = [
      post.sentiment,
      sentimentFromList?.sentiment_category,
      sentimentFromList?.sentiment,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const value = candidate.toLowerCase();
      if (value === 'positive' || value === 'negative' || value === 'neutral') {
        return value as SentimentType;
      }
    }
    return undefined;
  })();
  const sentimentScore = post.sentimentScore ?? sentimentFromList?.confidence ?? undefined;
  const likesTotal = typeof post.likes === 'number' ? post.likes : post.reaction_count ?? 0;
  const commentsTotal = (() => {
    if (typeof post.comments === 'number') return post.comments;
    if (Array.isArray(post.comments)) return post.comments.length;
    if (typeof post.comment_count === 'number') return post.comment_count;
    return 0;
  })();
  const sharesTotal = typeof post.shares === 'number' ? post.shares : 0;
  const displayContent = post.content ? truncateContent(post.content) : 'No content available.';
  const authorName = post.author;
  const platformLabel = post.platform || undefined;
  const publishedAtText = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : 'Publish time unavailable';

  const headerTitle = post.page?.page_name || 'Unknown Page';
  const headerSubtitle = platformLabel || 'Social Post';

  const metrics = [
    {
      label: 'Comments',
      icon: MessageCircle,
      value: commentsTotal,
      helper: 'Total comments',
    },
    {
      label: 'Reactions',
      icon: Heart,
      value: likesTotal,
      helper: 'Total reactions',
    },
    {
      label: 'Shares',
      icon: Share2,
      value: sharesTotal,
      helper: 'Total shares',
    },
  ];

  return (
    <Card
      className={cn(
        'group cursor-pointer border-2 border-slate-900 bg-white transition-shadow hover:shadow-lg',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="border-b-2 border-slate-900 bg-white/60 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-black">
              {headerTitle}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
              {headerSubtitle}
            </CardDescription>
            <p className="text-[11px] text-slate-500">{publishedAtText}</p>
          </div>
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black hover:underline"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-96 p-5">
        <div className="flex-grow space-y-5 overflow-hidden">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700 max-h-32 overflow-hidden">
            {displayContent}
          </div>
        </div>

        <div className="space-y-5 mt-auto">
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">Sentiment</div>
            {normalizedSentiment ? (
              <div className="flex items-center gap-2.5">
                <SentimentBadge sentiment={normalizedSentiment} score={sentimentScore ?? undefined} />
                {typeof sentimentScore === 'number' && (
                  <span className="text-[11px] text-slate-600">
                    Confidence {(Math.abs(sentimentScore) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">Sentiment analysis not available yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {metrics.map(({ label, icon: Icon, value, helper }) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <span>{label}</span>
                  <Icon className="h-3 w-3" />
                </div>
                <p className="mt-1.5 text-xl font-bold text-black">{value.toLocaleString()}</p>
                <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            <span>View post insights</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}