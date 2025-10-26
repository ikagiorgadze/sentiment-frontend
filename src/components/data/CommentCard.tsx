import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeSentiment, getSentimentScore } from '@/lib/sentiment';
import type { SentimentType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CommentCardProps {
  comment: {
    id: string;
    content?: string | null;
    author?: string | null;
    authorAvatar?: string | null;
    createdAt?: string | null;
    inserted_at?: string | null;
    sentiment?: string | null;
    sentiment_category?: string | null;
    sentimentScore?: number | null;
    sentiment_score?: number | null;
    likes?: number | null;
    user?: {
      full_name?: string | null;
      inserted_at?: string | null;
    } | null;
    sentiments?: Array<{
      sentiment?: string | null;
      sentiment_category?: string | null;
      confidence?: number | null;
      polarity?: number | null;
      inserted_at?: string | null;
    }>;
  };
  className?: string;
}

export function CommentCard({ comment, className }: CommentCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const hasWindow = typeof window !== 'undefined';

  const timestamp = comment.createdAt || comment.inserted_at || comment.user?.inserted_at || null;
  const content = comment.content || 'No comment text available.';
  const authorName = comment.author ?? comment.user?.full_name ?? null;
  const likeCount = typeof comment.likes === 'number' ? comment.likes : null;

  const sentimentRecords = [...(comment.sentiments ?? [])];
  if (!sentimentRecords.length && (comment.sentiment || comment.sentiment_category)) {
    sentimentRecords.push({
      sentiment: comment.sentiment ?? null,
      sentiment_category: comment.sentiment_category ?? null,
      confidence: comment.sentimentScore ?? comment.sentiment_score ?? null,
      polarity: null,
      inserted_at: comment.inserted_at ?? null,
    });
  }

  const normalizedRecords = sentimentRecords.map((record) => {
    const label = normalizeSentiment(record.sentiment ?? record.sentiment_category ?? null);
    const score = getSentimentScore(record, comment.sentimentScore ?? comment.sentiment_score ?? null);
    return {
      label,
      score,
      rawLabel: record.sentiment ?? record.sentiment_category ?? 'Unknown',
      sentimentText: record.sentiment ?? null,
      categoryText: record.sentiment_category ?? null,
      timestamp: record.inserted_at ?? null,
    };
  });

  const summary: Record<SentimentType, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  let unmapped = 0;
  let scoreTotal = 0;
  let scoreSamples = 0;

  normalizedRecords.forEach(({ label, score }) => {
    if (label) {
      summary[label] += 1;
    } else {
      unmapped += 1;
    }

    if (typeof score === 'number') {
      scoreTotal += score;
      scoreSamples += 1;
    }
  });

  const totalAnalyses = normalizedRecords.length;
  const primaryRecord = normalizedRecords[0];
  const averageConfidence = scoreSamples > 0 ? scoreTotal / scoreSamples : undefined;

  const chartSegments = [
    { key: 'positive' as const, count: summary.positive, color: 'bg-sky-500' },
    { key: 'neutral' as const, count: summary.neutral, color: 'bg-slate-400' },
    { key: 'negative' as const, count: summary.negative, color: 'bg-orange-400' },
    { key: 'unmapped' as const, count: unmapped, color: 'bg-slate-300' },
  ].filter((segment) => segment.count > 0 && totalAnalyses > 0);

  const formatPercent = (value: number) => `${((value / Math.max(totalAnalyses, 1)) * 100).toFixed(0)}%`;
  const segmentLabels: Record<string, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    unmapped: 'Unmapped',
  };

  const sentimentTexts = Array.from(
    new Set(
      normalizedRecords
        .map(({ sentimentText }) => sentimentText?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const sentimentCategories = Array.from(
    new Set(
      normalizedRecords
        .map(({ categoryText }) => categoryText?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const tooltipContent =
    tooltipVisible && hasWindow
      ? createPortal(
          <div
            className="fixed z-50 max-w-md pointer-events-none"
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
            }}
          >
            <div className="p-0 border-2 border-slate-900 bg-white text-black shadow-xl">
              <div className="border-b-2 border-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em]">
                Comment
              </div>
              <div className="p-4 text-sm leading-relaxed">
                {comment.content}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const card = (
    <Card className={cn('group border-2 border-slate-900 bg-white transition-shadow hover:shadow-lg', className)}>
      <CardHeader className="border-b-2 border-slate-900 bg-white/60 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold tracking-tight text-black">
              {authorName || 'Comment'}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
              {timestamp
                ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
                : 'Timestamp unavailable'}
            </CardDescription>
          </div>
          {likeCount !== null && likeCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <Heart className="h-3 w-3" />
              <span className="tracking-normal text-slate-700">
                {likeCount.toLocaleString()} likes
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div
          className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700 cursor-pointer"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          onMouseMove={(event) =>
            setTooltipPosition({ x: event.clientX + 16, y: event.clientY + 16 })
          }
        >
          {content}
        </div>

        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">
            Sentiment Analysis
          </div>

          {totalAnalyses > 0 ? (
            <div className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-700">
              {(() => {
                const sentimentName = primaryRecord?.label
                  ? primaryRecord.label.charAt(0).toUpperCase() + primaryRecord.label.slice(1)
                  : primaryRecord?.rawLabel ?? null;
                const confidenceText =
                  averageConfidence !== undefined
                    ? ` (avg confidence ${(Math.abs(averageConfidence) * 100).toFixed(1)}%)`
                    : '';
                return sentimentName ? (
                  <p>
                    Dominant sentiment: <span className="font-semibold text-black">{sentimentName}</span>
                    {confidenceText}.
                  </p>
                ) : null;
              })()}

              {chartSegments.length > 0 && (
                <p>
                  Distribution{' '}
                  <span className="font-medium text-black">
                    {chartSegments
                      .map(
                        (segment) =>
                          `${segmentLabels[segment.key]} ${segment.count.toLocaleString()} (${formatPercent(segment.count)})`
                      )
                      .join(' • ')}
                  </span>
                </p>
              )}

              {sentimentTexts.length > 0 && (
                <p>
                  Sentiment labels{' '}
                  <span className="font-medium text-black">{sentimentTexts.join(' • ')}</span>
                </p>
              )}

              {sentimentCategories.length > 0 && (
                <p>
                  Sentiment categories{' '}
                  <span className="font-medium text-black">{sentimentCategories.join(' • ')}</span>
                </p>
              )}

              {primaryRecord?.timestamp && (
                <p>
                  Last analyzed{' '}
                  <span className="font-medium text-black">
                    {formatDistanceToNow(new Date(primaryRecord.timestamp), { addSuffix: true })}
                  </span>
                </p>
              )}

              <p>
                Analyses recorded{' '}
                <span className="font-medium text-black">{totalAnalyses}</span>
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500">
              Sentiment analysis not available for this comment yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {card}
      {tooltipContent}
    </>
  );
}
