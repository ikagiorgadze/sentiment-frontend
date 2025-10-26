# Mock Data Service Documentation

Comprehensive mock data implementation for demo mode of the Sentiment Database application.

## Overview

The mock data service provides realistic, production-like data for development and demonstration purposes. It includes complete data sets with proper relationships, varied sentiment analysis results, and realistic content.

## Data Categories

### 1. Authentication Data

#### Mock Users
- **mockAuthUser**: Regular user account
  - Username: `johndoe`
  - Email: `john@example.com`
  - Role: `user`

- **mockAdminUser**: Administrator account
  - Username: `admin`
  - Email: `admin@example.com`
  - Role: `admin`

#### Authentication Response
- Includes JWT token (mock)
- User object with complete profile
- Timestamps for creation and last login

### 2. Facebook Users (Database Users)

**mockDbUsers** - 5 Facebook users with profiles:
1. Jane Smith (FB ID: 100001234567890)
2. Mike Johnson (FB ID: 100001234567891)
3. Sarah Wilson (FB ID: 100001234567892)
4. Robert Davis (FB ID: 100001234567893)
5. Emily Chen (FB ID: 100001234567894)

### 3. Posts and Comments

**mockDbPosts** - 5 complete posts with nested data:

#### Post 1: Product Launch (Positive)
- **Platform**: Tech Company
- **Sentiment**: Highly positive (0.95 confidence)
- **Comments**: 2 positive comments
- **Content**: Product announcement with excitement
- **Date**: January 15, 2024

#### Post 2: Job Posting (Positive/Neutral)
- **Platform**: Startup
- **Sentiment**: Positive (0.82 confidence)
- **Comments**: 1 neutral inquiry
- **Content**: Developer hiring announcement
- **Date**: January 14, 2024

#### Post 3: Complaint (Negative)
- **Platform**: Retail Shop
- **Sentiment**: Highly negative (0.92 confidence)
- **Comments**: 1 negative agreement
- **Content**: Customer service complaint
- **Date**: January 13, 2024

#### Post 4: Restaurant Opening (Positive)
- **Platform**: Restaurant
- **Sentiment**: Positive (0.89 confidence)
- **Comments**: 1 positive review
- **Content**: New location announcement
- **Date**: January 12, 2024

#### Post 5: University Announcement (Neutral)
- **Platform**: University
- **Sentiment**: Neutral (0.84 confidence)
- **Comments**: None
- **Content**: Registration information
- **Date**: January 11, 2024

### 4. Sentiment Analysis Data

#### Sentiment Distribution
- **Positive**: ~60% of sentiments
- **Negative**: ~15% of sentiments
- **Neutral**: ~25% of sentiments

#### Confidence Levels
- Range: 0.72 to 0.95
- Average: ~0.87
- Realistic variation across different content types

#### Polarity Scores
- Positive: +0.75 to +0.90
- Negative: -0.75 to -0.88
- Neutral: -0.10 to +0.10

#### Probability Distributions
Each sentiment includes probability distribution:
```typescript
{
  "positive": 0.88,
  "negative": 0.05,
  "neutral": 0.07
}
```

### 5. Analytics Data

#### Sentiment Summary
- Post-level aggregations
- Category breakdowns
- Average confidence and polarity
- Total sentiment counts

#### User Activity
- Comments by user per post
- Reaction tracking
- Engagement metrics
- Activity timestamps

### 6. Scraping Data

#### Scrape Status
- Request ID tracking
- Stage indicators (posts_inserted, sentiment_complete)
- Post and comment counts
- Creation timestamps

#### Scrape History
- 3 sample scrape requests
- Various completion states
- Realistic post/comment counts
- Time-series data

### 7. Access Control Data

#### Accessible Posts
- List of post IDs per user
- Permission tracking
- Role-based filtering

#### Accessible Users
- Users with access to posts
- Admin vs user permissions
- Bulk access scenarios

### 8. Seed Data Statistics

Mock statistics for database seeding:
- Users: 25
- Posts: 50
- Comments: 150
- Sentiments: 200
- Reactions: 75

## Data Relationships

### Post → Comments
Each post contains an array of comments with:
- User attribution
- Sentiment analysis
- Timestamps
- Nested relationships

### Comment → Sentiments
Each comment includes sentiment data:
- Confidence scores
- Category classifications
- Probability distributions
- Polarity values

### Post → Sentiments
Posts have direct sentiment analysis:
- Content-level sentiment
- Higher confidence typically than comments
- Stronger polarity indicators

### User → Comments
Users are linked to their comments:
- Full name and FB profile ID
- Comment history
- Activity tracking

## Content Characteristics

### Realistic Content
- Varied post lengths (50-300 characters)
- Natural language patterns
- Different business contexts
- Authentic sentiment expressions

### Sentiment Variety
- **Highly Positive**: Product launches, achievements
- **Positive**: General positive feedback, compliments
- **Neutral**: Information, questions, neutral statements
- **Negative**: Complaints, criticisms
- **Highly Negative**: Strong complaints, anger

### Time Distribution
- Spans 5 days (Jan 11-15, 2024)
- Realistic posting patterns
- Chronological comment threads
- Time-based analytics support

## Usage Examples

### Fetching Posts
```typescript
import { mockDbPosts } from '@/services/mockData';

// All posts with full details
const posts = mockDbPosts;

// Filter by sentiment
const positivePosts = mockDbPosts.filter(
  p => p.sentiments[0]?.sentiment === 'positive'
);

// Sort by date
const recentPosts = [...mockDbPosts].sort(
  (a, b) => new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
);
```

### Accessing Comments
```typescript
// All comments from all posts
const allComments = mockDbPosts.flatMap(p => p.comments);

// Comments with positive sentiment
const positiveComments = allComments.filter(
  c => c.sentiments[0]?.sentiment === 'positive'
);

// Comments by specific user
const userComments = allComments.filter(
  c => c.user_id === 'specific-user-id'
);
```

### Sentiment Analysis
```typescript
import { mockSentiments } from '@/services/mockData';

// All sentiments
const sentiments = mockSentiments;

// High confidence sentiments
const highConfidence = mockSentiments.filter(
  s => s.confidence && s.confidence > 0.9
);

// Post vs comment sentiments
const postSentiments = mockSentiments.filter(s => s.post_id !== null);
const commentSentiments = mockSentiments.filter(s => s.comment_id !== null);
```

### Analytics Queries
```typescript
import { mockSentimentSummary } from '@/services/mockData';

// Get sentiment distribution
const distribution = mockSentimentSummary.sentiment_categories;

// Calculate percentages
const total = mockSentimentSummary.total_sentiments;
const positivePercent = (distribution.positive / total) * 100;
```

## Data Integrity

### Referential Integrity
- All user_id references point to valid users
- All post_id references match existing posts
- Comment IDs are unique across all posts

### Timestamp Consistency
- Posts created before their comments
- Sentiments analyzed after content creation
- Chronological ordering maintained

### Sentiment Consistency
- Confidence scores sum probabilities ≈ 1.0
- Polarity matches sentiment category
- Category matches overall sentiment

## Testing Scenarios

### Positive Test Cases
- Product launches with high engagement
- Positive reviews and testimonials
- Successful announcements

### Negative Test Cases
- Customer complaints
- Service issues
- Negative feedback

### Neutral Test Cases
- Information requests
- Announcements without emotion
- Factual statements

### Mixed Sentiment
- Posts with varied comments
- Conflicting opinions
- Nuanced discussions

## Maintenance

### Adding New Data
1. Follow existing ID pattern (UUID v4)
2. Maintain timestamp chronology
3. Ensure sentiment data includes all fields
4. Link users, posts, comments correctly

### Updating Existing Data
1. Preserve referential integrity
2. Update related timestamps
3. Recalculate summary statistics
4. Test all relationships

### Data Consistency Checks
- Verify all IDs are unique
- Check all foreign keys resolve
- Validate sentiment probabilities
- Ensure timestamp ordering

## Performance Considerations

### Data Size
- 5 posts with full details
- 8 total comments
- 13 sentiment analyses
- Lightweight for demo purposes

### Query Performance
- Pre-computed relationships
- No database overhead
- Instant data access
- Suitable for development

### Scalability Notes
- Can be expanded with more posts
- Additional comments can be added
- More users for diversity
- Historical data for trends

## Future Enhancements

### Potential Additions
- More diverse content types
- Additional platforms (Twitter, Instagram)
- Reaction types and counts
- User engagement metrics
- Time-series data for trends
- Multi-language content
- Media attachments metadata

### Advanced Scenarios
- Bulk operations
- Complex filtering
- Aggregation examples
- Real-time updates simulation
- Error state examples
