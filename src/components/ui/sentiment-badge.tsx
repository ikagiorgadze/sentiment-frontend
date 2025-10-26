import { cn } from '@/lib/utils';
import { SentimentType } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  score?: number;
  showIcon?: boolean;
  className?: string;
}

export function SentimentBadge({ 
  sentiment, 
  score, 
  showIcon = true,
  className 
}: SentimentBadgeProps) {
  const getStyles = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success-bg text-success border-success/20';
      case 'negative':
        return 'bg-destructive-bg text-destructive border-destructive/20';
      case 'neutral':
        return 'bg-muted text-neutral border-border';
    }
  };

  const getIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      case 'neutral':
        return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-fast',
        getStyles(),
        className
      )}
    >
      {showIcon && getIcon()}
      <span className="capitalize">{sentiment}</span>
      {score !== undefined && (
        <span className="ml-0.5 opacity-70 font-mono text-[10px]">
          {Math.abs(score * 100).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
