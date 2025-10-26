import { useDashboardStats } from '@/hooks/useApi';
import { MessageSquare, ThumbsUp, ThumbsDown, Activity, MinusCircle } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-black border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalPosts = stats?.totalPosts ?? 0;
  const positivePosts = stats?.positivePosts ?? 0;
  const neutralPosts = stats?.neutralPosts ?? 0;
  const negativePosts = stats?.negativePosts ?? 0;
  const avgEngagement = stats?.avgEngagement ?? 0;
  const avgEngagementDisplay = avgEngagement.toFixed(1);
  const pageSummary = stats?.pageSummary;
  const postSummary = stats?.postSummary;

  const totalPagesTracked = pageSummary?.totalPages ?? 0;
  const avgPostsPerPageRaw = pageSummary?.avgPostsPerPage ?? 0;
  const avgCommentsPerPage = pageSummary?.avgCommentsPerPage ?? 0;
  const avgSentimentConfidencePages = pageSummary?.avgSentimentConfidence ?? 0;
  const avgPostsPerPagePer7d = avgPostsPerPageRaw / 7;
  const estimatedPostsAcrossPages = Math.max(0, Math.round(avgPostsPerPagePer7d * totalPagesTracked));
  const estimatedCommentsAcrossPages = Math.max(0, Math.round(avgCommentsPerPage * totalPagesTracked));

  const postsLast7Days = postSummary?.postsLast7Days ?? 0;
  const avgCommentsPerPost = postSummary?.avgCommentsPerPost ?? 0;
  const uniqueCommenters = postSummary?.uniqueCommenters ?? 0;
  const avgSentimentConfidence = postSummary?.avgSentimentConfidence ?? 0;
  const estimatedCommentsLastWeek = Math.max(0, Math.round(avgCommentsPerPost * postsLast7Days));
  const commentersPerPost = postsLast7Days > 0 ? uniqueCommenters / postsLast7Days : 0;

  const formatMetric = (value: number, decimals = 0, suffix = '') => {
    if (!Number.isFinite(value)) {
      return suffix ? `0${suffix}` : '0';
    }
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return suffix ? `${formatted}${suffix}` : formatted;
  };

  const pageSummaryMetrics = [
    {
      key: 'totalPages',
      label: 'Total Pages',
      value: formatMetric(pageSummary?.totalPages ?? 0),
      helper:
        totalPosts > 0
          ? `${formatMetric(totalPosts)} posts tracked across these sources.`
          : 'Watching for new pages to ingest.',
    },
    {
      key: 'avgPostsPerPage',
      label: 'Avg Posts / Page / 7D',
      value: formatMetric(avgPostsPerPagePer7d, 1),
      helper:
        avgPostsPerPagePer7d > 0
          ? `${formatMetric(estimatedPostsAcrossPages || totalPosts)} posts per week across pages.`
          : 'Post activity per page not available yet.',
    },
    {
      key: 'avgCommentsPerPage',
      label: 'Avg Comments / Page',
      value: formatMetric(pageSummary?.avgCommentsPerPage ?? 0, 1),
      helper:
        avgCommentsPerPage > 0
          ? `${formatMetric(estimatedCommentsAcrossPages)} total comments across pages.`
          : 'No comment activity recorded yet.',
    },
    {
      key: 'avgSentimentConfidencePages',
      label: 'Avg Sentiment Confidence',
      value: formatMetric(avgSentimentConfidencePages * 100, 1, '%'),
      helper:
        avgSentimentConfidencePages > 0
          ? `Confidence across ${formatMetric(totalPagesTracked)} tracked pages.`
          : 'Sentiment processing pending for pages.',
    },
  ];

  const postSummaryMetrics = [
    {
      key: 'avgCommentsPerPost',
      label: 'Avg Comments / Post',
      value: formatMetric(postSummary?.avgCommentsPerPost ?? 0, 1),
      helper:
        avgCommentsPerPost > 0
          ? `${formatMetric(estimatedCommentsLastWeek)} comments across last week.`
          : 'Comments have not been captured yet.',
    },
    {
      key: 'uniqueCommenters',
      label: 'Unique Commenters',
      value: formatMetric(postSummary?.uniqueCommenters ?? 0),
      helper:
        uniqueCommenters > 0
          ? `${formatMetric(commentersPerPost, 1)} commenters per post on average.`
          : 'No unique commenters detected yet.',
    },
    {
      key: 'avgSentimentConfidence',
      label: 'Avg Sentiment Confidence',
      value: formatMetric((postSummary?.avgSentimentConfidence ?? 0) * 100, 1, '%'),
      helper:
        avgSentimentConfidence > 0
          ? `Confidence across ${formatMetric(postsLast7Days > 0 ? postsLast7Days : totalPosts)} analyzed posts.`
          : 'Sentiment processing pending for recent posts.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 py-16 bg-white">
        <h1 className="text-6xl font-bold mb-3 tracking-tighter text-black px-8">Dashboard</h1>
        <p className="text-xl text-slate-600 font-light px-8">Real-time sentiment analysis metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="py-12">
        <div className="grid md:grid-cols-5 border-2 border-slate-900 bg-white">
          {/* Total Posts */}
          <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
            <div className="mb-6">
              <MessageSquare className="w-8 h-8 text-black" strokeWidth={2} />
            </div>
            <div className="text-5xl font-bold text-black mb-2 tracking-tighter">
              {totalPosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Total Posts
            </div>
          </div>

          {/* Positive */}
          <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
            <div className="mb-6">
              <ThumbsUp className="w-8 h-8 text-black" strokeWidth={2} />
            </div>
            <div className="text-5xl font-bold text-black mb-2 tracking-tighter">
              {positivePosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Positive
            </div>
          </div>

          {/* Neutral */}
          <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
            <div className="mb-6">
              <MinusCircle className="w-8 h-8 text-black" strokeWidth={2} />
            </div>
            <div className="text-5xl font-bold text-black mb-2 tracking-tighter">
              {neutralPosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Neutral
            </div>
          </div>

          {/* Negative */}
          <div className="p-8 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
            <div className="mb-6">
              <ThumbsDown className="w-8 h-8 text-black" strokeWidth={2} />
            </div>
            <div className="text-5xl font-bold text-black mb-2 tracking-tighter">
              {negativePosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Negative
            </div>
          </div>

          {/* Engagement */}
          <div className="p-8 border-slate-900">
            <div className="mb-6">
              <Activity className="w-8 h-8 text-black" strokeWidth={2} />
            </div>
            <div className="text-5xl font-bold text-black mb-2 tracking-tighter">
              {avgEngagementDisplay}%
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Avg Engagement
            </div>
          </div>
        </div>
      </div>

      {/* Summaries */}
      <div className="pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Page Summary */}
          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Page Summary</h2>
              <p className="mt-2 text-sm text-slate-600">
                High-level metrics that describe the breadth and freshness of your tracked pages.
              </p>
            </div>
            <div className="p-6 bg-white">
              <div className="grid sm:grid-cols-2 gap-4">
                {pageSummaryMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                      {metric.label}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-black">{metric.value}</div>
                    <div className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {metric.helper}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Post Summary */}
          <div className="border-2 border-slate-900 bg-white">
            <div className="border-b-2 border-slate-900 bg-white p-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Post Summary</h2>
              <p className="mt-2 text-sm text-slate-600">
                Key engagement and volume statistics that capture how posts are performing.
              </p>
            </div>
            <div className="p-6 bg-white">
              <div className="grid sm:grid-cols-2 gap-4">
                {postSummaryMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                      {metric.label}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-black">{metric.value}</div>
                    <div className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {metric.helper}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
