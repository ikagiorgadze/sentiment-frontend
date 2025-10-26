import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '@/hooks/useApi';
import { PostCard } from '@/components/data/PostCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PostQueryOptions } from '@/types/api';

export default function Posts() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sentiment, setSentiment] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();

  const pageId = searchParams.get('page_id');
  const pageName = searchParams.get('page_name');

  const options = useMemo(() => {
    const base: PostQueryOptions & { sentiment?: string; search?: string } = {
      includeSentiments: true,
    };

    if (sentiment !== 'all') {
      base.sentiment = sentiment;
    }

    if (query.trim().length > 0) {
      base.search = query.trim();
    }

    if (pageId) {
      base.page_id = pageId;
      base.includePage = true;
    }

    return base;
  }, [sentiment, query, pageId]);

  const { data: posts, isLoading } = usePosts(options);

  const clearPageFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('page_id');
    next.delete('page_name');
    setSearchParams(next, { replace: true });
  };

  const pageFilterActive = Boolean(pageId);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 py-16 bg-white">
        <h1 className="text-6xl font-bold mb-3 tracking-tighter text-black px-8">Posts</h1>
        <p className="text-xl text-slate-600 font-light px-8">Browse and analyze social media content</p>
      </div>

      {/* Search and Filter */}
      <div className="py-12">
        <div className="border-2 border-slate-900 bg-white">
          <div className="flex flex-col md:flex-row">
            <div className="relative flex-1 border-b-2 border-slate-900 md:border-b-0 md:border-r-2">
              <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500 z-20" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setQuery(search.trim());
                  }
                }}
                className="w-full h-14 border-none rounded-none bg-transparent pl-16 pr-6 text-xl font-semibold tracking-tight text-black placeholder:text-slate-500 focus-visible:ring-0 focus-visible:outline-none"
              />
            </div>
            <div className="relative md:w-80 border-t-2 border-slate-900 md:border-t-0 md:border-l-2 border-r-2 border-slate-900">
              <Filter className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Select value={sentiment} onValueChange={setSentiment}>
                <SelectTrigger className="h-14 w-full rounded-none border-none bg-transparent pl-16 pr-10 text-sm font-semibold uppercase tracking-[0.35em] text-black focus-visible:ring-0 focus-visible:outline-none">
                  <SelectValue placeholder="Filter by sentiment" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-slate-900">
                  <SelectItem value="all">All Sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {pageFilterActive && (
        <div className="-mt-6 px-8 pb-10">
          <Card className="border-2 border-slate-900 bg-slate-50">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Filter applied</p>
                <p className="text-base text-slate-600">
                  Showing posts from{' '}
                  <span className="font-semibold text-black">
                    {pageName || 'selected page'}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={clearPageFilter}
                className="h-10 border-2 border-slate-900 bg-white text-sm font-semibold uppercase tracking-[0.3em] text-black hover:bg-slate-100"
              >
                Clear filter
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts List */}
      <div className="pb-16">
        {isLoading ? (
          <div className="border-b-2 border-slate-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 border-b-2 border-slate-200 last:border-b-0">
                <div className="flex gap-6">
                  <Skeleton className="h-12 w-12" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Card className="border-2 border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-slate-600">No posts found</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
