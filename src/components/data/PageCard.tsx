import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Globe, MessageCircle } from 'lucide-react';
import type { PageWithStats } from '@/types/data';

interface PageCardProps {
  page: PageWithStats;
  className?: string;
}

const resolveDisplayName = (page: PageWithStats): string => {
  if (page.page_name) return page.page_name;
  if (page.page_url) return page.page_url.replace(/^https?:\/\//, '');
  return 'Unnamed Page';
};

const resolveDomain = (page: PageWithStats): string | null => {
  if (!page.page_url) return null;
  try {
    const url = page.page_url.startsWith('http') ? page.page_url : `https://${page.page_url}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return page.page_url;
  }
};

const SentimentBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center gap-1 text-xs text-slate-600">
    <span className="font-semibold text-slate-700">{Math.round(value)}%</span>
    <div className="relative w-6 h-16 bg-slate-200 overflow-hidden">
      <div
        className="absolute bottom-0 w-full transition-all duration-300"
        style={{
          height: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color
        }}
      />
    </div>
    <span className="text-center uppercase tracking-[0.2em] text-slate-500 text-[10px] leading-tight">{label}</span>
  </div>
);

export function PageCard({ page, className }: PageCardProps) {
  const navigate = useNavigate();

  const totalPosts = page.post_count ?? 0;
  const totalComments = page.comment_count ?? 0;
  const commentPerPost = totalPosts > 0 ? totalComments / totalPosts : 0;
  const lastPostAt = page.last_post_at ? formatDistanceToNow(new Date(page.last_post_at), { addSuffix: true }) : 'No posts yet';
  const sentimentSummary = page.sentiment_summary;
  const sentimentTotal = sentimentSummary?.total ?? 0;

  const sentimentPercentages = sentimentSummary
    ? {
        positive: sentimentTotal > 0 ? (sentimentSummary.positive / sentimentTotal) * 100 : 0,
        neutral: sentimentTotal > 0 ? (sentimentSummary.neutral / sentimentTotal) * 100 : 0,
        negative: sentimentTotal > 0 ? (sentimentSummary.negative / sentimentTotal) * 100 : 0,
      }
    : { positive: 0, neutral: 0, negative: 0 };

  const handleClick = () => {
    const params = new URLSearchParams();
    params.set('page_id', page.id);
    if (page.page_name) {
      params.set('page_name', page.page_name);
    }
    navigate(`/posts?${params.toString()}`);
  };

  const domain = resolveDomain(page);

  return (
    <Card
      className={cn(
        'group cursor-pointer border-2 border-slate-900 bg-white transition-shadow hover:shadow-lg',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="border-b-2 border-slate-900 bg-white/60">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight text-black">
            {resolveDisplayName(page)}
          </CardTitle>
          <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {domain ?? 'Social Page'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Posts</span>
              <ArrowRight className="h-3 w-3" />
            </div>
            <p className="mt-2 text-3xl font-bold text-black">{totalPosts.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">{lastPostAt}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>Comments</span>
              <MessageCircle className="h-3 w-3" />
            </div>
            <p className="mt-2 text-3xl font-bold text-black">{totalComments.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">
              {totalPosts > 0 ? `${commentPerPost.toFixed(1)} per post` : 'No posts yet'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
            <Globe className="h-3 w-3" />
            Sentiment Overview
          </div>
          {sentimentTotal > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <SentimentBar label="Positive" value={sentimentPercentages.positive} color="#0ea5e9" />
              <SentimentBar label="Neutral" value={sentimentPercentages.neutral} color="#94a3b8" />
              <SentimentBar label="Negative" value={sentimentPercentages.negative} color="#f97316" />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No sentiment data available yet.</p>
          )}
          {sentimentSummary?.average_polarity !== null && sentimentSummary?.average_polarity !== undefined && (
            <p className="text-xs text-slate-500">
              Avg polarity{' '}
              <span className="font-semibold text-slate-800">
                {sentimentSummary.average_polarity.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          <span>View page posts</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </CardContent>
    </Card>
  );
}
