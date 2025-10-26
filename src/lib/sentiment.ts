import type { Sentiment } from '@/types/data';
import type { SentimentType } from '@/types';

const POSITIVE_KEYWORDS = new Set([
  'positive',
  'pos',
  'joy',
  'approval',
  'admiration',
  'trust',
  'anticipation',
  'support',
  'love',
  'optimism',
  'gratitude',
  'happy',
  'happiness',
  'delight',
  'satisfaction',
]);

const NEGATIVE_KEYWORDS = new Set([
  'negative',
  'neg',
  'anger',
  'sad',
  'sadness',
  'fear',
  'disgust',
  'hate',
  'criticism',
  'concern',
  'anxiety',
  'frustration',
  'disappointment',
  'outrage',
  'anger',
  'worry',
]);

const NEUTRAL_KEYWORDS = new Set([
  'neutral',
  'neu',
  'mixed',
  'ambiguous',
  'undetermined',
  'unknown',
  'other',
  'informational',
]);

export const normalizeSentiment = (value?: string | null): SentimentType | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();

  if (POSITIVE_KEYWORDS.has(normalized) || /positive|optimistic|favorable/.test(normalized)) {
    return 'positive';
  }

  if (NEGATIVE_KEYWORDS.has(normalized) || /negative|critical|unfavorable|angry|sad/.test(normalized)) {
    return 'negative';
  }

  if (NEUTRAL_KEYWORDS.has(normalized) || /neutral|mixed|objective|informational/.test(normalized)) {
    return 'neutral';
  }

  return null;
};

export const getSentimentScore = (
  record?: Partial<Pick<Sentiment, 'confidence' | 'polarity'>> | null,
  fallback?: number | null | undefined,
): number | undefined => {
  const candidates: Array<number | undefined | null> = [
    record?.confidence,
    record?.polarity,
    fallback,
  ];

  for (const value of candidates) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue;
      if (value > 1) {
        // Assume value is a percentage and scale back to 0-1
        return value > 100 ? 1 : value / 100;
      }
      if (value < -1) {
        return value < -100 ? -1 : value / 100;
      }
      return value;
    }
  }

  return undefined;
};
