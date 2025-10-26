import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { usePost, usePostComments } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { CommentCard } from '@/components/data/CommentCard';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { SimpleLineChart } from '@/components/charts/SimpleLineChart';
import { ArrowLeft, ExternalLink, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { normalizeSentiment, getSentimentScore } from '@/lib/sentiment';
import type { PostWithDetails, CommentWithDetails, Sentiment } from '@/types/data';
import type { SentimentType } from '@/types';

type ExtendedPost = PostWithDetails & {
  sentiment?: string | null;
  sentimentScore?: number | null;
  aiAnalysis?: string | null;
  likes?: number | null;
  shares?: number | null;
  comments?: number | null;
  createdAt?: string | null;
  url?: string | null;
  platform?: string | null;
};

type ExtendedComment = CommentWithDetails & {
  sentiment?: string | null;
  sentiment_category?: string | null;
  sentimentScore?: number | null;
  sentiment_score?: number | null;
  createdAt?: string | null;
};

const getPrimaryPostSentiment = (post?: PostWithDetails | null): Sentiment | null => {
  if (!post?.sentiments || post.sentiments.length === 0) return null;
  const postOnly = post.sentiments.filter((sentiment) => !sentiment.comment_id);
  if (postOnly.length > 0) {
    return postOnly[0];
  }
  return post.sentiments[0];
};

const getPrimaryCommentSentiment = (comment: CommentWithDetails): Sentiment | null => {
  if (!comment.sentiments || comment.sentiments.length === 0) return null;
  return comment.sentiments[0];
};

const getCommentTimestamp = (comment: ExtendedComment): string | null => {
  return comment.createdAt ?? comment.inserted_at ?? null;
};

const getCommentSentimentDetails = (
  comment: ExtendedComment,
): { label: SentimentType | null; score?: number } => {
  const primaryRecord = getPrimaryCommentSentiment(comment);
  const directLabel = normalizeSentiment(comment.sentiment ?? comment.sentiment_category ?? null);
  const label = directLabel ?? normalizeSentiment(primaryRecord?.sentiment ?? primaryRecord?.sentiment_category ?? null);
  const score = getSentimentScore(primaryRecord, comment.sentimentScore ?? comment.sentiment_score ?? null);
  return { label, score };
};

const resolveUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `https://${value}`;
};

const resolvePlatform = (post?: ExtendedPost | null): string => {
  const candidate = post?.platform ?? post?.page_url ?? post?.full_url ?? null;
  if (!candidate) return 'Unknown platform';
  try {
    const normalized = resolveUrl(candidate) ?? candidate;
    const url = new URL(normalized);
    return url.hostname.replace(/^www\./, '');
  } catch (error) {
    return candidate;
  }
};

export default function PostInsights() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading: postLoading } = usePost(postId || '');
  const { data: comments, isLoading: commentsLoading } = usePostComments(postId || '');

  const extendedPost = post as ExtendedPost | undefined;
  const extendedComments = comments as ExtendedComment[] | undefined;

  const postAnalysisText = useMemo(() => {
    if (!extendedPost) return null;

    const detailedAnalysis = extendedPost.aiAnalysis?.trim();
    if (detailedAnalysis) return detailedAnalysis;

    const primaryRecord = getPrimaryPostSentiment(extendedPost);
    if (!primaryRecord) return null;

    const rawLabel = primaryRecord.sentiment ?? primaryRecord.sentiment_category;
    if (!rawLabel) return null;

    const normalizedLabel = normalizeSentiment(rawLabel);
    const readableLabel = normalizedLabel
      ? `${normalizedLabel.charAt(0).toUpperCase()}${normalizedLabel.slice(1)}`
      : rawLabel;

    const score = getSentimentScore(primaryRecord, extendedPost.sentimentScore ?? null);
    const confidenceText =
      score !== undefined
        ? ` Confidence ${(Math.abs(score) * 100).toFixed(1)}%.`
        : '';

    return `Dominant sentiment detected: ${readableLabel}.${confidenceText}`.trim();
  }, [extendedPost]);

  const commentAnalytics = useMemo(() => {
    const summary: Record<SentimentType, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    const trendDays: { date: string; positive: number; neutral: number; negative: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendDays.push({
        date: date.toISOString().split('T')[0],
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }

    extendedComments?.forEach((comment) => {
      const { label } = getCommentSentimentDetails(comment);
      const timestamp = getCommentTimestamp(comment);
      if (!label || !timestamp) return;

      summary[label] += 1;

      const dateKey = new Date(timestamp).toISOString().split('T')[0];
      const entry = trendDays.find((day) => day.date === dateKey);
      if (entry) {
        entry[label] += 1;
      }
    });

    const data = [
      { name: 'Positive', value: summary.positive, color: '#0ea5e9' },
      { name: 'Neutral', value: summary.neutral, color: '#94a3b8' },
      { name: 'Negative', value: summary.negative, color: '#f97316' },
    ];

    const total = summary.positive + summary.neutral + summary.negative;

    return { summary, data, trend: trendDays, total };
  }, [extendedComments]);

  if (postLoading) {
    return <LoadingSpinner size="lg" overlay />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-black mb-2">Post Not Found</h3>
          <p className="text-slate-600 mb-6">The requested post could not be found</p>
          <Button onClick={() => navigate('/posts')} className="bg-black hover:bg-slate-800 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  const postTimestamp = extendedPost?.createdAt ?? post.inserted_at ?? null;
  const postUrl = resolveUrl(extendedPost?.url ?? post.full_url ?? post.page_url ?? null);
  const platformLabel = resolvePlatform(extendedPost ?? null);
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 py-16 bg-white">
        <div className="px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/posts')}
            className="mb-6 text-black hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Button>
          <h1 className="text-6xl font-bold mb-3 tracking-tighter text-black">Post Insights</h1>
          <p className="text-xl text-slate-600 font-light">Detailed sentiment analysis and metrics</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12">
        {/* Post Content */}
        <div className="grid gap-6 mb-12">
          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Post Text</h2>
            </div>
            <div className="p-8 bg-white space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 uppercase tracking-[0.35em]">
                <span>{platformLabel}</span>
                <span>•</span>
                <span>
                  {postTimestamp
                    ? formatDistanceToNow(new Date(postTimestamp), { addSuffix: true })
                    : 'Unknown date'}
                </span>
                {postUrl && (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-black normal-case tracking-tight"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                <p className="text-base text-slate-800 leading-relaxed">
                  {post.content || 'No post text available.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Post Sentiment Analysis</h2>
            </div>
            <div className="p-8 bg-white space-y-6 text-sm text-black">
              {postAnalysisText ? (
                <div className="space-y-4">
                  <p className="text-base leading-relaxed text-slate-800 whitespace-pre-line">
                    {postAnalysisText}
                  </p>

                  {(() => {
                    if (!extendedPost?.sentiments?.length) return null;

                    const postOnlySentiments = extendedPost.sentiments.filter(
                      (sentiment) => !sentiment.comment_id
                    );

                    const totals = postOnlySentiments.reduce(
                      (acc, sentiment) => {
                        const label = normalizeSentiment(
                          sentiment.sentiment ?? sentiment.sentiment_category ?? null
                        );
                        if (label) {
                          acc[label] += 1;
                        } else {
                          acc.unmapped += 1;
                        }

                        const score = getSentimentScore(sentiment, extendedPost.sentimentScore ?? null);
                        if (typeof score === 'number') {
                          acc.scoreTotal += score;
                          acc.scoreSamples += 1;
                        }

                        return acc;
                      },
                      {
                        positive: 0,
                        neutral: 0,
                        negative: 0,
                        unmapped: 0,
                        scoreTotal: 0,
                        scoreSamples: 0,
                      }
                    );

                    const totalEntries =
                      totals.positive + totals.neutral + totals.negative + totals.unmapped;

                    if (totalEntries === 0) return null;

                    const average =
                      totals.scoreSamples > 0 ? totals.scoreTotal / totals.scoreSamples : undefined;

                    const sentimentTexts = Array.from(
                      new Set(
                        postOnlySentiments
                          .map((entry) => entry.sentiment?.trim())
                          .filter((value): value is string => Boolean(value))
                      )
                    );

                    const sentimentCategories = Array.from(
                      new Set(
                        postOnlySentiments
                          .map((entry) => entry.sentiment_category?.trim())
                          .filter((value): value is string => Boolean(value))
                      )
                    );

                    const describeSegment = (
                      label: string,
                      count: number,
                      total: number,
                    ) => `${label} ${count.toLocaleString()} (${((count / total) * 100).toFixed(0)}%)`;

                    const distributionText = [
                      describeSegment('Positive', totals.positive, totalEntries),
                      describeSegment('Neutral', totals.neutral, totalEntries),
                      describeSegment('Negative', totals.negative, totalEntries),
                      totals.unmapped > 0
                        ? describeSegment('Unmapped', totals.unmapped, totalEntries)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <div className="space-y-3">
                        <p className="leading-relaxed text-slate-700">
                          Distribution:{' '}
                          <span className="font-medium text-black">{distributionText}</span>
                        </p>

                        {average !== undefined && (
                          <p className="leading-relaxed text-slate-700">
                            Average confidence{' '}
                            <span className="font-medium text-black">
                              {(Math.abs(average) * 100).toFixed(1)}%
                            </span>
                          </p>
                        )}

                        {sentimentTexts.length > 0 && (
                          <p className="leading-relaxed text-slate-700">
                            Sentiment labels:{' '}
                            <span className="font-medium text-black">
                              {sentimentTexts.join(' • ')}
                            </span>
                          </p>
                        )}

                        {sentimentCategories.length > 0 && (
                          <p className="leading-relaxed text-slate-700">
                            Sentiment categories:{' '}
                            <span className="font-medium text-black">
                              {sentimentCategories.join(' • ')}
                            </span>
                          </p>
                        )}

                        <p className="leading-relaxed text-slate-700">
                          Records analyzed:{' '}
                          <span className="font-medium text-black">{totalEntries}</span>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">No textual sentiment analysis available for this post yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Sentiment Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Comment Sentiment Distribution</h2>
            </div>
            <div className="p-8 bg-white">
              <SimpleBarChart data={commentAnalytics.data} height={300} />
              <p className="mt-4 text-sm text-slate-600">
                {commentAnalytics.total.toLocaleString()} comments analyzed across sentiment categories.
              </p>
            </div>
          </div>

          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">7-Day Comment Trend</h2>
            </div>
            <div className="p-8 bg-white">
              <SimpleLineChart
                data={commentAnalytics.trend}
                lines={[
                  { key: 'positive', color: '#0ea5e9', label: 'Positive' },
                  { key: 'neutral', color: '#94a3b8', label: 'Neutral' },
                  { key: 'negative', color: '#f97316', label: 'Negative' },
                ]}
                height={300}
              />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="border-2 border-slate-900">
          <div className="border-b-2 border-slate-900 bg-white p-6">
            <h2 className="text-2xl font-bold tracking-tight text-black">
              Comments ({comments?.length || 0})
            </h2>
          </div>
          <div className="p-8 bg-white">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {extendedComments?.map((comment) => (
                  <div key={comment.id} className="overflow-hidden rounded-lg border-2 border-slate-900 bg-white">
                    <CommentCard comment={comment} className="rounded-none border-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No comments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}