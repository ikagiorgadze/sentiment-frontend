import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ThumbsUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CommentCard } from '@/components/data/CommentCard';
import { useUser } from '@/hooks/useApi';
import type { UserQueryOptions } from '@/types/api';
import type { Comment, UserWithDetails } from '@/types/data';

const SentimentBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1 text-xs">
    <div className="flex items-center justify-between text-slate-500">
      <span className="font-medium uppercase tracking-[0.2em]">{label}</span>
      <span className="font-semibold text-slate-800">{Math.round(value)}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

const toCommentCardPayload = (comment: Comment, user: UserWithDetails) => ({
  id: comment.id,
  content: comment.content,
  inserted_at: comment.inserted_at,
  createdAt: comment.inserted_at,
  full_url: comment.full_url,
  post_id: comment.post_id,
  user_id: comment.user_id,
  author: user.full_name || user.fb_profile_id || 'Unknown User',
  user: {
    full_name: user.full_name || user.fb_profile_id || 'Unknown User',
    inserted_at: user.inserted_at,
  },
  sentiments: comment.sentiments ?? [],
});

const getSentimentTotals = (sentiments?: {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  average_polarity: number | null;
}) => {
  if (!sentiments || sentiments.total <= 0) {
    return {
      total: 0,
      positivePct: 0,
      neutralPct: 0,
      negativePct: 0,
      averagePolarity: sentiments?.average_polarity ?? null,
    };
  }

  const total = sentiments.total;
  return {
    total,
    positivePct: (sentiments.positive / total) * 100,
    neutralPct: (sentiments.neutral / total) * 100,
    negativePct: (sentiments.negative / total) * 100,
    averagePolarity: sentiments.average_polarity,
  };
};

export default function UserInsights() {
  const { userId = '' } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const queryOptions = useMemo<UserQueryOptions>(
    () => ({
      includeStats: true,
      includeComments: true,
      includeReactions: true,
    }),
    []
  );

  const { data: user, isLoading, isError, error } = useUser(userId, queryOptions, Boolean(userId));

  const comments = useMemo(() => {
    if (!user?.comments) return [];
    return [...user.comments].sort((a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime());
  }, [user?.comments]);

  const stats = user?.stats;
  const topPages = stats?.top_pages ?? [];
  const sentimentTotals = getSentimentTotals(stats?.sentiment_breakdown);
  const totalComments = stats?.total_comments ?? user?.comment_count ?? comments.length ?? 0;
  const totalReactions = stats?.total_reactions ?? user?.reaction_count ?? user?.reactions?.length ?? 0;
  const postsCommented = stats?.posts_commented ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b-2 border-slate-900 bg-white py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-2 border-slate-900 bg-white px-4 py-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {user && (
              <Badge variant="secondary" className="rounded-full border border-slate-300 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-600">
                {user.fb_profile_id || 'User ID'}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tighter text-black">
              {user?.full_name || user?.fb_profile_id || 'User Insights'}
            </h1>
            <p className="mt-2 text-xl font-light text-slate-600">
              Detailed view of this contributor's activity, sentiment footprint, and comment history.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-12 py-12 px-4">
        {isLoading && (
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-48 border-2 border-slate-200" />
            ))}
            <Skeleton className="h-96 border-2 border-slate-200 lg:col-span-3" />
          </div>
        )}

        {isError && (
          <Card className="border-2 border-red-500 bg-red-50">
            <CardContent className="p-6 text-red-700">
              Failed to load user insights. {error instanceof Error ? error.message : 'Unknown error.'}
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && !user && (
          <Card className="border-2 border-slate-200 bg-slate-50">
            <CardContent className="p-6 text-slate-600">User not found.</CardContent>
          </Card>
        )}

        {user && (
          <>
            <section className="grid gap-6 lg:grid-cols-3">
              <Card className="border-2 border-slate-900 bg-white">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <MessageCircle className="h-3 w-3" />
                    Comments
                  </div>
                  <p className="text-4xl font-bold text-black">{totalComments.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Across {postsCommented.toLocaleString()} posts</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-900 bg-white">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <ThumbsUp className="h-3 w-3" />
                    Reactions
                  </div>
                  <p className="text-4xl font-bold text-black">{totalReactions.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Total reactions on posts and comments</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-slate-900 bg-white">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                    <BookOpen className="h-3 w-3" />
                    Sentiment Mix
                  </div>
                  {sentimentTotals.total > 0 ? (
                    <div className="space-y-3">
                      <SentimentBar label="Positive" value={sentimentTotals.positivePct} color="#0ea5e9" />
                      <SentimentBar label="Neutral" value={sentimentTotals.neutralPct} color="#94a3b8" />
                      <SentimentBar label="Negative" value={sentimentTotals.negativePct} color="#f97316" />
                      {typeof sentimentTotals.averagePolarity === 'number' && (
                        <p className="text-xs text-slate-500">
                          Avg polarity {sentimentTotals.averagePolarity.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No sentiment analyses yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <Card className="border-2 border-slate-900 bg-white lg:col-span-2">
                <CardHeader className="border-b-2 border-slate-900 bg-white/60 px-6 py-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Most Active Pages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {topPages.length > 0 ? (
                    topPages.map((page) => {
                      const breakdown = page.sentiment_breakdown;
                      const total = breakdown.total > 0 ? breakdown.total : page.comment_count;
                      const positivePct = total > 0 ? (breakdown.positive / total) * 100 : 0;
                      const neutralPct = total > 0 ? (breakdown.neutral / total) * 100 : 0;
                      const negativePct = total > 0 ? (breakdown.negative / total) * 100 : 0;

                      return (
                        <div key={`${page.page_id ?? 'none'}-${page.comment_count}`} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 truncate pr-4 font-semibold text-slate-800">
                              {page.page_name || 'Unknown Page'}
                            </div>
                            <Badge variant="outline" className="border-slate-300 text-xs uppercase tracking-[0.2em] text-slate-500">
                              {page.comment_count.toLocaleString()} comments
                            </Badge>
                          </div>
                          {total > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                <span className="font-semibold text-sky-600">Pos {Math.round(positivePct)}%</span>
                                <span className="font-semibold text-slate-500">Neu {Math.round(neutralPct)}%</span>
                                <span className="font-semibold text-amber-500">Neg {Math.round(negativePct)}%</span>
                                {breakdown.average_polarity !== null && (
                                  <span className="font-semibold text-slate-700 normal-case tracking-normal">
                                    Avg Polarity {breakdown.average_polarity.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div className="bg-sky-500" style={{ width: `${Math.max(0, Math.min(100, positivePct))}%` }} />
                                <div className="bg-slate-400" style={{ width: `${Math.max(0, Math.min(100, neutralPct))}%` }} />
                                <div className="bg-amber-500" style={{ width: `${Math.max(0, Math.min(100, negativePct))}%` }} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No sentiment data for this page yet.</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">No page activity recorded for this user.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-900 bg-white">
                <CardHeader className="border-b-2 border-slate-900 bg-white/60 px-6 py-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Quick Facts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-6 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>First seen</span>
                    <span className="font-semibold text-slate-900">
                      {user.inserted_at ? new Date(user.inserted_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reactions recorded</span>
                    <span className="font-semibold text-slate-900">{totalReactions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Posts engaged</span>
                    <span className="font-semibold text-slate-900">{postsCommented.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sentiment average</span>
                    <span className="font-semibold text-slate-900">
                      {typeof sentimentTotals.averagePolarity === 'number'
                        ? sentimentTotals.averagePolarity.toFixed(2)
                        : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Comment History</h2>
                <Badge variant="outline" className="border-slate-300 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {comments.length.toLocaleString()} entries
                </Badge>
              </div>

              {comments.length > 0 ? (
                <div className="grid gap-4">
                  {comments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={toCommentCardPayload(comment, user)}
                      className="border-slate-900"
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
                  <CardContent className="py-16 text-center text-sm text-slate-500">
                    No comments recorded for this user yet.
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
