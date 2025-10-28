import { useMemo, useState, useCallback, useEffect } from 'react';
import { useUsers } from '@/hooks/useApi';
import { UserCard } from '@/components/data/UserCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Users as UsersIcon, MessageCircle, ThumbsUp, Smile } from 'lucide-react';
import type { UserQueryOptions } from '@/types/api';
import { useNavigate } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export default function Users() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 18;

  const queryOptions = useMemo<UserQueryOptions>(() => {
    const trimmedQuery = query.trim();
    const base: UserQueryOptions = {
      includeStats: true,
      orderBy: 'comment_count',
      orderDirection: 'DESC',
      onlyWithComments: true,
      limit: pageSize,
      offset: (Math.max(page, 1) - 1) * pageSize,
    };

    if (trimmedQuery.length > 0) {
      base.full_name = trimmedQuery;
    }

    return base;
  }, [page, pageSize, query]);

  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useUsers(queryOptions);
  const isInitialLoading = !data && isLoading;
  const users = data?.users ?? [];
  const totalCount = data?.totalCount ?? 0;
  const paginationMeta = data?.meta;
  const inferredPage =
    paginationMeta?.page && paginationMeta.page > 0 ? paginationMeta.page : page;
  const totalPagesRaw =
    paginationMeta?.totalPages && paginationMeta.totalPages > 0
      ? paginationMeta.totalPages
      : pageSize > 0
        ? Math.ceil(totalCount / pageSize) || 1
        : 1;
  const totalPages = Math.max(1, totalPagesRaw);
  const offset =
    paginationMeta?.offset && paginationMeta.offset >= 0
      ? paginationMeta.offset
      : (Math.max(page, 1) - 1) * pageSize;
  const hasUsers = users.length > 0;
  const rangeStart = totalCount === 0 || !hasUsers ? 0 : Math.min(offset + 1, totalCount);
  const rangeEnd =
    totalCount === 0 || !hasUsers ? 0 : Math.min(offset + users.length, totalCount);

  useEffect(() => {
    if (isLoading || isFetching) {
      return;
    }
    const safeTotalPages = Math.max(1, totalPages);
    if (page > safeTotalPages) {
      setPage(safeTotalPages);
      return;
    }
    const normalizedPage = Math.max(1, inferredPage);
    if (normalizedPage !== page) {
      setPage(normalizedPage);
    }
  }, [inferredPage, isFetching, isLoading, page, totalPages]);

  const handleSelectUser = useCallback(
    (userId: string) => {
      navigate(`/users/${userId}`);
    },
    [navigate]
  );

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const aComments = a.stats?.total_comments ?? a.comment_count ?? 0;
      const bComments = b.stats?.total_comments ?? b.comment_count ?? 0;
      return bComments - aComments;
    });
  }, [users]);

  const summary = useMemo(() => {
    if (!sortedUsers || sortedUsers.length === 0) {
      return {
        totalUsers: totalCount,
        totalComments: 0,
        totalReactions: 0,
        avgCommentsPerUser: 0,
        avgReactionsPerUser: 0,
        positiveShare: 0,
        topCommenter: null as string | null,
      };
    }

    const totals = sortedUsers.reduce(
      (acc, user) => {
        const stats = user.stats;
        const comments = stats?.total_comments ?? user.comment_count ?? 0;
        const reactions = stats?.total_reactions ?? user.reaction_count ?? 0;
        const sentiment = stats?.sentiment_breakdown;

        acc.totalComments += comments;
        acc.totalReactions += reactions;

        if (sentiment) {
          acc.positive += sentiment.positive;
          acc.neutral += sentiment.neutral;
          acc.negative += sentiment.negative;
        }

        return acc;
      },
      { totalComments: 0, totalReactions: 0, positive: 0, neutral: 0, negative: 0 }
    );

    const pageUserCount = sortedUsers.length;
    const sentimentTotal = totals.positive + totals.neutral + totals.negative;
    const positiveShare = sentimentTotal > 0 ? (totals.positive / sentimentTotal) * 100 : 0;

    return {
      totalUsers: totalCount,
      totalComments: totals.totalComments,
      totalReactions: totals.totalReactions,
      avgCommentsPerUser: pageUserCount > 0 ? totals.totalComments / pageUserCount : 0,
      avgReactionsPerUser: pageUserCount > 0 ? totals.totalReactions / pageUserCount : 0,
      positiveShare,
      topCommenter: sortedUsers[0]?.full_name || sortedUsers[0]?.fb_profile_id || null,
    };
  }, [sortedUsers, totalCount]);

  const safeCurrentPage = Math.max(1, inferredPage);
  const rangeLabel =
    totalCount > 0
      ? hasUsers
        ? `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${totalCount.toLocaleString()} contributors`
        : `Showing 0 of ${totalCount.toLocaleString()} contributors`
      : 'No contributors available';
  const rangeLabelDisplay = (isInitialLoading || isFetching) ? 'Loading contributors…' : rangeLabel;

  const paginationRange = useMemo<Array<number | 'left-ellipsis' | 'right-ellipsis'>>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const siblings = 1;
    const firstPage = 1;
    const lastPage = totalPages;
    const startPage = Math.max(firstPage + 1, safeCurrentPage - siblings);
    const endPage = Math.min(lastPage - 1, safeCurrentPage + siblings);

    const range: Array<number | 'left-ellipsis' | 'right-ellipsis'> = [firstPage];

    if (startPage > firstPage + 1) {
      range.push('left-ellipsis');
    } else {
      for (let pageNumber = firstPage + 1; pageNumber < startPage; pageNumber += 1) {
        range.push(pageNumber);
      }
    }

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
      range.push(pageNumber);
    }

    if (endPage < lastPage - 1) {
      range.push('right-ellipsis');
    } else {
      for (let pageNumber = endPage + 1; pageNumber < lastPage; pageNumber += 1) {
        range.push(pageNumber);
      }
    }

    if (range[range.length - 1] !== lastPage) {
      range.push(lastPage);
    }

    return range;
  }, [safeCurrentPage, totalPages]);

  const goToPage = useCallback(
    (targetPage: number) => {
      const safeTotal = Math.max(1, totalPages);
      const safeTarget = Math.max(1, Math.min(targetPage, safeTotal));
      setPage((prev) => (prev === safeTarget ? prev : safeTarget));
    },
    [totalPages],
  );

  const showPagination = totalCount > 0 && totalPages > 1;
  const disablePrev = safeCurrentPage <= 1 || isInitialLoading || isFetching;
  const disableNext =
    safeCurrentPage >= Math.max(1, totalPages) || isInitialLoading || isFetching || totalCount === 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b-2 border-slate-900 bg-white py-16">
        <h1 className="px-8 text-6xl font-bold tracking-tighter text-black">Users</h1>
        <p className="px-8 text-xl font-light text-slate-600">
          Understand how contributors engage across pages and sentiments
        </p>
      </div>

      <div className="space-y-12 py-12">
        {/* Search */}
        <section className="px-0">
          <div className="border-2 border-slate-900 bg-white">
            <div className="relative">
              <Search className="pointer-events-none absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search users by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = search.trim();
                    setQuery(trimmed);
                    setPage(1);
                  }
                }}
                className="h-14 w-full rounded-none border-none bg-transparent pl-16 pr-6 text-xl font-semibold tracking-tight text-black placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-0"
              />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="px-0">
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <UsersIcon className="h-3 w-3" />
                  Total Users
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {summary.topCommenter ? `Top contributor: ${summary.topCommenter}` : 'No activity yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <MessageCircle className="h-3 w-3" />
                  Comments Logged
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalComments.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {sortedUsers.length > 0 ? `${summary.avgCommentsPerUser.toFixed(1)} per user` : 'No comments yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <ThumbsUp className="h-3 w-3" />
                  Reactions Given
                </div>
                <p className="text-4xl font-bold text-black">{summary.totalReactions.toLocaleString()}</p>
                <p className="text-xs text-slate-500">
                  {sortedUsers.length > 0 ? `${summary.avgReactionsPerUser.toFixed(1)} per user` : 'No reactions yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-900 bg-white">
              <CardContent className="space-y-2 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <Smile className="h-3 w-3" />
                  Positive Share
                </div>
                <p className="text-4xl font-bold text-black">{summary.positiveShare.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">Of all comment sentiments</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Users Grid */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Community Contributors
            </h2>
            <span className="text-sm text-slate-500">{rangeLabelDisplay}</span>
          </div>
          {isInitialLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-72 border-2 border-slate-200" />
              ))}
            </div>
          ) : sortedUsers.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedUsers.map((user) => (
                  <UserCard key={user.id} user={user} onSelect={(selected) => handleSelectUser(selected.id)} />
                ))}
              </div>
              {showPagination && (
                <Pagination className="pt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (disablePrev) return;
                          goToPage(safeCurrentPage - 1);
                        }}
                        aria-disabled={disablePrev}
                        className={cn(disablePrev && 'pointer-events-none opacity-50')}
                      />
                    </PaginationItem>
                    {paginationRange.map((item, index) => (
                      <PaginationItem key={`${item}-${index}`}>
                        {typeof item === 'number' ? (
                          <PaginationLink
                            href="#"
                            isActive={item === safeCurrentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              if (item === safeCurrentPage) return;
                              goToPage(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        ) : (
                          <PaginationEllipsis />
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (disableNext) return;
                          goToPage(safeCurrentPage + 1);
                        }}
                        aria-disabled={disableNext}
                        className={cn(disableNext && 'pointer-events-none opacity-50')}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg font-semibold text-slate-700">No users found</p>
                <p className="mt-2 text-sm text-slate-500">Try adjusting your search query.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
