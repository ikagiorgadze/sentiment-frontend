import { useMemo } from 'react';
import { usePages } from '@/hooks/useApi';
import { PageCard } from '@/components/data/PageCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Layers, MessageCircle, Smile } from 'lucide-react';

export default function Pages() {
  const { data: pages, isLoading } = usePages({ includePostStats: true, orderBy: 'page_name' });

  const summary = useMemo(() => {
    if (!pages || pages.length === 0) {
      return {
        totalPages: 0,
        totalPosts: 0,
        totalComments: 0,
        avgPostsPerPage: 0,
        avgCommentsPerPage: 0,
        avgPolarity: null as number | null,
      };
    }

    const totals = pages.reduce(
      (acc, page) => {
        const posts = page.post_count ?? 0;
        const comments = page.comment_count ?? 0;
        const polarity = page.sentiment_summary?.average_polarity ?? null;
        const polaritySamples = polarity !== null ? 1 : 0;

        return {
          totalPosts: acc.totalPosts + posts,
          totalComments: acc.totalComments + comments,
          polaritySum: acc.polaritySum + (polarity ?? 0),
          polaritySamples: acc.polaritySamples + polaritySamples,
        };
      },
      { totalPosts: 0, totalComments: 0, polaritySum: 0, polaritySamples: 0 }
    );

    const avgPostsPerPage = totals.totalPosts / pages.length;
    const avgCommentsPerPage = totals.totalComments / pages.length;
    const avgPolarity = totals.polaritySamples > 0 ? totals.polaritySum / totals.polaritySamples : null;

    return {
      totalPages: pages.length,
      totalPosts: totals.totalPosts,
      totalComments: totals.totalComments,
      avgPostsPerPage,
      avgCommentsPerPage,
      avgPolarity,
    };
  }, [pages]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 py-16 bg-white">
        <h1 className="px-8 text-6xl font-bold tracking-tighter text-black">Pages</h1>
        <p className="px-8 text-xl font-light text-slate-600">
          Explore connected pages, their activity, and sentiment performance
        </p>
      </div>
      <div className="space-y-12 py-12">
        {/* Summary */}
        <section className="px-0">
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <Layers className="h-3 w-3" />
                  Total Pages
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalPages.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <TrendingUp className="h-3 w-3" />
                  Total Posts
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalPosts.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {summary.totalPages > 0 ? `${summary.avgPostsPerPage.toFixed(1)} per page` : 'No pages yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <MessageCircle className="h-3 w-3" />
                  Total Comments
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalComments.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {summary.totalPages > 0 ? `${summary.avgCommentsPerPage.toFixed(1)} per page` : 'No comments yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <Smile className="h-3 w-3" />
                  Avg Polarity
                </div>
                <p className="text-4xl font-bold text-black">
                  {summary.avgPolarity !== null ? summary.avgPolarity.toFixed(2) : '—'}
                </p>
                <p className="text-xs text-slate-500">Across pages with sentiment data</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Page Grid */}
        <section className="space-y-6">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Page Library
          </h2>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-64 border-2 border-slate-200" />
              ))}
            </div>
          ) : pages && pages.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pages.map((page) => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg font-semibold text-slate-700">No pages available</p>
                <p className="mt-2 text-sm text-slate-500">
                  Start scraping to populate page activity and sentiment insights.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
