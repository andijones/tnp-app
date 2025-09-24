import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Rating } from '../../types';
import { Button } from '../common/Button';

interface ImprovedRatingsSectionProps {
  ratings?: Rating[];
  averageRating?: number;
  ratingsCount?: number;
  reviewSubmission?: React.ReactNode;
  onWriteReview?: () => void;
}

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  showNumber = false,
  color = '#FFA500'
}) => {
  const stars = [];
  const roundedRating = Math.round(rating);

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name="star"
        size={size}
        color={i <= roundedRating ? color : '#E5E5E5'}
        style={{ marginRight: 1 }}
      />
    );
  }

  return (
    <View style={styles.starContainer}>
      {stars}
      {showNumber && (
        <Text style={[styles.ratingNumber, { fontSize: size * 0.8 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

interface RatingBreakdownProps {
  ratings: Rating[];
  totalCount: number;
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({ ratings, totalCount }) => {
  const breakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      const ratingValue = Math.round(rating.ratingValue || 0);
      if (ratingValue >= 1 && ratingValue <= 5) {
        counts[ratingValue as keyof typeof counts]++;
      }
    });

    return Object.entries(counts)
      .map(([star, count]) => ({
        star: parseInt(star),
        count,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0
      }))
      .reverse(); // Show 5 stars first
  }, [ratings, totalCount]);

  return (
    <View style={styles.ratingBreakdown}>
      {breakdown.map(({ star, count, percentage }) => (
        <TouchableOpacity key={star} style={styles.breakdownRow} activeOpacity={0.7}>
          <Text style={styles.breakdownStar}>{star}</Text>
          <Ionicons name="star" size={12} color="#FFA500" />
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${percentage}%` }]}
            />
          </View>
          <Text style={styles.breakdownCount}>{count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface ReviewItemProps {
  rating: Rating;
  onHelpful?: (ratingId: string) => void;
  onNotHelpful?: (ratingId: string) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ rating, onHelpful, onNotHelpful }) => {
  const navigation = useNavigation();
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [userVoted, setUserVoted] = useState<'helpful' | 'not-helpful' | null>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUserPress = () => {
    if (rating.user_id) {
      navigation.navigate('UserProfile' as never, { userId: rating.user_id } as never);
    }
  };

  const handleHelpfulPress = () => {
    if (userVoted === 'helpful') return;
    setUserVoted('helpful');
    setHelpfulCount(prev => prev + (userVoted === 'not-helpful' ? 2 : 1));
    onHelpful?.(rating.id);
  };

  const handleNotHelpfulPress = () => {
    if (userVoted === 'not-helpful') return;
    setUserVoted('not-helpful');
    setHelpfulCount(prev => prev - (userVoted === 'helpful' ? 2 : 1));
    onNotHelpful?.(rating.id);
  };

  return (
    <View style={styles.reviewItem}>
      {/* Reviewer Header */}
      <View style={styles.reviewHeader}>
        <TouchableOpacity
          style={styles.reviewerInfo}
          onPress={handleUserPress}
          activeOpacity={0.7}
          disabled={!rating.user_id}
        >
          {rating.avatar_url ? (
            <Image source={{ uri: rating.avatar_url }} style={styles.reviewerAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={theme.colors.text.secondary} />
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {rating.username || 'Anonymous User'}
            </Text>
            <View style={styles.reviewMeta}>
              <StarRating rating={rating.ratingValue || 0} size={12} />
              <Text style={styles.reviewDate}>
                • {formatDate(rating.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      {/* Review Content */}
      {rating.review && (
        <Text style={styles.reviewContent}>{rating.review}</Text>
      )}

      {/* Review Actions */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={[styles.actionButton, userVoted === 'helpful' && styles.actionButtonActive]}
          onPress={handleHelpfulPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="thumbs-up-outline"
            size={16}
            color={userVoted === 'helpful' ? theme.colors.primary : theme.colors.text.secondary}
          />
          <Text style={[
            styles.actionText,
            userVoted === 'helpful' && styles.actionTextActive
          ]}>
            Helpful {helpfulCount > 0 && `(${helpfulCount})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, userVoted === 'not-helpful' && styles.actionButtonActive]}
          onPress={handleNotHelpfulPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="thumbs-down-outline"
            size={16}
            color={userVoted === 'not-helpful' ? theme.colors.error : theme.colors.text.secondary}
          />
          <Text style={[
            styles.actionText,
            userVoted === 'not-helpful' && { color: theme.colors.error }
          ]}>
            Not helpful
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

export const ImprovedRatingsSection: React.FC<ImprovedRatingsSectionProps> = ({
  ratings = [],
  averageRating = 0,
  ratingsCount = 0,
  reviewSubmission,
  onWriteReview
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [filterByStar, setFilterByStar] = useState<number | null>(null);

  const sortedAndFilteredReviews = useMemo(() => {
    let filtered = filterByStar
      ? ratings.filter(r => Math.round(r.ratingValue || 0) === filterByStar)
      : ratings;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return (b.ratingValue || 0) - (a.ratingValue || 0);
        case 'lowest':
          return (a.ratingValue || 0) - (b.ratingValue || 0);
        case 'helpful':
          // For now, just sort by newest since we don't have helpful votes data
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return showAllReviews ? sorted : sorted.slice(0, 3);
  }, [ratings, sortBy, filterByStar, showAllReviews]);

  // Empty State
  if (ratingsCount === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="star-outline" size={48} color={theme.colors.text.tertiary} />
        </View>
        <Text style={styles.emptyStateTitle}>No reviews yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Be the first to share your experience with this product
        </Text>
        {reviewSubmission}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reviews Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryLeft}>
          <Text style={styles.overallRating}>
            {averageRating.toFixed(1)}
          </Text>
          <View style={styles.summaryStars}>
            <StarRating rating={averageRating} size={16} color="#FFA500" />
            <Text style={styles.summaryText}>
              {ratingsCount} review{ratingsCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRight}>
          <RatingBreakdown ratings={ratings} totalCount={ratingsCount} />
        </View>
      </View>


      {reviewSubmission}

      {/* Sorting and Filtering */}
      <View style={styles.controlsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortingScroll}>
          <View style={styles.sortingContainer}>
            {[
              { key: 'newest', label: 'Most Recent' },
              { key: 'helpful', label: 'Most Helpful' },
              { key: 'highest', label: 'Highest Rated' },
              { key: 'lowest', label: 'Lowest Rated' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.sortButton,
                  sortBy === key && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(key as SortOption)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === key && styles.sortButtonTextActive
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Star Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterByStar === null && styles.filterButtonActive
              ]}
              onPress={() => setFilterByStar(null)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                filterByStar === null && styles.filterButtonTextActive
              ]}>
                All stars
              </Text>
            </TouchableOpacity>
            {[5, 4, 3, 2, 1].map(star => (
              <TouchableOpacity
                key={star}
                style={[
                  styles.filterButton,
                  filterByStar === star && styles.filterButtonActive
                ]}
                onPress={() => setFilterByStar(star)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterByStar === star && styles.filterButtonTextActive
                ]}>
                  {star}
                </Text>
                <Ionicons name="star" size={12} color={filterByStar === star ? '#FFFFFF' : '#FFA500'} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {sortedAndFilteredReviews.map((rating, index) => (
          <View key={rating.id}>
            <ReviewItem
              rating={rating}
              onHelpful={(id) => console.log('Helpful:', id)}
              onNotHelpful={(id) => console.log('Not helpful:', id)}
            />
            {index < sortedAndFilteredReviews.length - 1 && (
              <View style={styles.reviewSeparator} />
            )}
          </View>
        ))}
      </View>

      {/* Show More/Less Button */}
      {ratings.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllReviews(!showAllReviews)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            {showAllReviews
              ? 'Show less'
              : `See all ${ratings.length} reviews`
            }
          </Text>
          <Ionicons
            name={showAllReviews ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },

  emptyStateIcon: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 50,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 22,
  },


  // Summary Header
  summaryHeader: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  summaryLeft: {
    alignItems: 'center',
    minWidth: 100,
  },

  overallRating: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 48,
  },

  summaryStars: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },

  summaryText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  summaryRight: {
    flex: 1,
    justifyContent: 'center',
  },

  // Rating Breakdown
  ratingBreakdown: {
    gap: theme.spacing.xs,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  breakdownStar: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    width: 12,
  },

  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },

  breakdownCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    minWidth: 20,
    textAlign: 'right',
  },


  // Controls Section
  controlsSection: {
    gap: theme.spacing.sm,
  },

  sortingScroll: {
    flexGrow: 0,
  },

  sortingContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },

  sortButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  sortButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },

  sortButtonTextActive: {
    color: '#FFFFFF',
  },

  filterScroll: {
    flexGrow: 0,
  },

  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    gap: theme.spacing.xs,
  },

  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // Reviews List
  reviewsList: {
    gap: theme.spacing.md,
  },

  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },

  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },

  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  reviewerDetails: {
    flex: 1,
  },

  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  reviewDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '10',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },

  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.success,
  },

  reviewContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },

  reviewActions: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },

  actionButtonActive: {
    // Add active styling if needed
  },

  actionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  actionTextActive: {
    color: theme.colors.primary,
  },

  reviewSeparator: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: theme.spacing.md,
  },

  // Show More Button
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },

  showMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Star Container
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingNumber: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});