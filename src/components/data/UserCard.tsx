import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, ThumbsUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserWithDetails } from '@/types/data';

interface UserCardProps {
  user: UserWithDetails;
  className?: string;
  onSelect?: (user: UserWithDetails) => void;
}

const SentimentBar = ({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) => (
  <div className="space-y-1 text-xs">
    <div className="flex items-center justify-between text-slate-500">
      <span className="font-medium uppercase tracking-[0.2em]">{label}</span>
      <span className="font-semibold text-slate-800">{Math.round(percentage)}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export function UserCard({ user, className, onSelect }: UserCardProps) {
  const stats = user.stats;
  const totalComments = stats?.total_comments ?? user.comment_count ?? user.comments?.length ?? 0;
  const postsCommented = stats?.posts_commented ?? 0;
  const totalReactions = stats?.total_reactions ?? user.reaction_count ?? user.reactions?.length ?? 0;
  const sentiment = stats?.sentiment_breakdown;
  const topPages = stats?.top_pages ?? [];
  const displayName = user.full_name || user.fb_profile_id || 'Unknown User';
  const isClickable = typeof onSelect === 'function';

  const sentimentTotals = sentiment?.total ?? 0;
  const positivePercentage = sentimentTotals > 0 ? (sentiment!.positive / sentimentTotals) * 100 : 0;
  const neutralPercentage = sentimentTotals > 0 ? (sentiment!.neutral / sentimentTotals) * 100 : 0;
  const negativePercentage = sentimentTotals > 0 ? (sentiment!.negative / sentimentTotals) * 100 : 0;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <Card
      className={cn(
        'border-2 border-slate-900 bg-white',
        isClickable && 'cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
        className,
      )}
      onClick={() => {
        if (isClickable) {
          onSelect(user);
        }
      }}
      onKeyDown={(event) => {
        if (!isClickable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(user);
        }
      }}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <CardHeader className="border-b-2 border-slate-900 bg-white/60">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{initials || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-bold tracking-tight text-black">{displayName}</CardTitle>
          </div>
          {totalComments > 0 && (
            <Badge variant="secondary" className="ml-auto rounded-full uppercase tracking-[0.3em]">
              {totalComments} comments
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Comments</span>
              <MessageCircle className="h-3 w-3" />
            </div>
            <p className="mt-2 text-2xl font-bold text-black">{totalComments.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">Across {postsCommented.toLocaleString()} posts</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Reactions</span>
              <ThumbsUp className="h-3 w-3" />
            </div>
            <p className="mt-2 text-2xl font-bold text-black">{totalReactions.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">All time</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Avg Polarity</span>
              <BookOpen className="h-3 w-3" />
            </div>
            <p className="mt-2 text-2xl font-bold text-black">
              {sentiment?.average_polarity !== null && sentiment?.average_polarity !== undefined
                ? sentiment.average_polarity.toFixed(2)
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Based on comment sentiment</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sentiment Profile</div>
          {sentimentTotals > 0 ? (
            <div className="space-y-3">
              <SentimentBar label="Positive" percentage={positivePercentage} color="#0ea5e9" />
              <SentimentBar label="Neutral" percentage={neutralPercentage} color="#94a3b8" />
              <SentimentBar label="Negative" percentage={negativePercentage} color="#f97316" />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No sentiment data available yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Most Active Pages</div>
          {topPages.length > 0 ? (
            <ul className="space-y-3">
              {topPages.map((page) => {
                const breakdown = page.sentiment_breakdown;
                const totalForPage = breakdown.total > 0 ? breakdown.total : page.comment_count;
                const positivePct = totalForPage > 0 ? (breakdown.positive / totalForPage) * 100 : 0;
                const neutralPct = totalForPage > 0 ? (breakdown.neutral / totalForPage) * 100 : 0;
                const negativePct = totalForPage > 0 ? (breakdown.negative / totalForPage) * 100 : 0;

                return (
                  <li
                    key={`${user.id}-${page.page_id ?? 'none'}-${page.comment_count}`}
                    className="space-y-2 rounded-lg border border-slate-200 bg-white/70 p-3 text-sm text-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 truncate pr-3 font-medium text-slate-800">
                        {page.page_name || 'Unknown Page'}
                      </div>
                      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {page.comment_count.toLocaleString()} comments
                      </span>
                    </div>

                    {totalForPage > 0 ? (
                      <>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          <span className="font-semibold text-sky-600">Pos {Math.round(positivePct)}%</span>
                          <span className="font-semibold text-slate-500">Neu {Math.round(neutralPct)}%</span>
                          <span className="font-semibold text-amber-500">Neg {Math.round(negativePct)}%</span>
                          {breakdown.average_polarity !== null && (
                            <span className="font-semibold text-slate-700 normal-case tracking-normal">Avg Polarity {breakdown.average_polarity.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="bg-sky-500"
                            style={{ width: `${Math.max(0, Math.min(100, positivePct))}%` }}
                          />
                          <div
                            className="bg-slate-400"
                            style={{ width: `${Math.max(0, Math.min(100, neutralPct))}%` }}
                          />
                          <div
                            className="bg-amber-500"
                            style={{ width: `${Math.max(0, Math.min(100, negativePct))}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">No sentiment data yet for this page.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No page interactions recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
