import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Rating, AppNavigationProp } from '../../types';

interface RatingsSectionProps {
  ratings?: Rating[];
  averageRating?: number;
  ratingsCount?: number;
  onSubmitReview?: (rating: number, review: string) => void;
  userHasReviewed?: boolean;
}

/**
 * Star Rating Display Component
 * Shows filled/empty stars based on rating value
 */
interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 16,
  color = '#F59E0B',
  emptyColor = '#D4D4D4'
}) => {
  const stars = [];
  const roundedRating = Math.round(rating);

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= roundedRating ? "star" : "star-outline"}
        size={size}
        color={i <= roundedRating ? color : emptyColor}
      />
    );
  }

  return (
    <View style={styles.starContainer}>
      {stars}
    </View>
  );
};

/**
 * Interactive Star Rating Selector
 * For when user is writing a review
 */
interface StarRatingSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const StarRatingSelector: React.FC<StarRatingSelectorProps> = ({
  rating,
  onRatingChange
}) => {
  return (
    <View style={styles.starSelectorContainer}>
      <View style={styles.starSelectorRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? '#F59E0B' : '#D4D4D4'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.starLabel}>
        {rating} STAR{rating !== 1 ? 'S' : ''}
      </Text>
    </View>
  );
};

/**
 * Rating Distribution Bars
 * Shows breakdown of ratings by star level
 */
interface RatingDistributionProps {
  ratings: Rating[];
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({ ratings }) => {
  // Calculate distribution
  const distribution = [5, 4, 3, 2, 1].map(starLevel => {
    const count = ratings.filter(r => r.ratingValue === starLevel).length;
    const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
    return { star: starLevel, count, percentage };
  });

  return (
    <View style={styles.distributionContainer}>
      {distribution.map(({ star, percentage }) => (
        <View key={star} style={styles.distributionRow}>
          <Text style={styles.distributionNumber}>{star}</Text>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%` }
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Individual Review Card
 */
interface ReviewCardProps {
  rating: Rating;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ rating }) => {
  const navigation = useNavigation<AppNavigationProp>();

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleUserPress = () => {
    if (rating.user_id) {
      navigation.navigate('UserProfile', { userId: rating.user_id });
    }
  };

  const username = rating.username || 'Anonymous User';
  const ratingValue = rating.ratingValue || 0;

  return (
    <View style={styles.reviewCard}>
      {/* Review Header */}
      <View style={styles.reviewHeader}>
        <TouchableOpacity
          onPress={handleUserPress}
          activeOpacity={0.7}
          disabled={!rating.user_id}
        >
          {rating.avatar_url ? (
            <Image
              source={{ uri: rating.avatar_url }}
              style={styles.reviewAvatar}
            />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#A3A3A3" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUsername}>{username}</Text>
          <View style={styles.reviewMeta}>
            <StarRating rating={ratingValue} size={16} />
            <Text style={styles.reviewTimestamp}>
              {formatTimeAgo(rating.created_at)}
            </Text>
          </View>
        </View>
      </View>

      {/* Review Content */}
      {rating.review && (
        <Text style={styles.reviewText}>{rating.review}</Text>
      )}
    </View>
  );
};

/**
 * Write Review Button
 * Pill-shaped button to open write mode
 */
interface WriteReviewButtonProps {
  onPress: () => void;
}

const WriteReviewButton: React.FC<WriteReviewButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.writeReviewButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.writeReviewButtonText}>Write a review</Text>
    </TouchableOpacity>
  );
};

/**
 * Review Form
 * Shown when user clicks "Write a review"
 */
interface ReviewFormProps {
  onSubmit: (rating: number, review: string) => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onCancel }) => {
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating, reviewText);
      setSelectedRating(5);
      setReviewText('');
    }
  };

  return (
    <View style={styles.reviewForm}>
      <Text style={styles.reviewFormTitle}>Write a review</Text>

      {/* Star Rating Selector */}
      <StarRatingSelector
        rating={selectedRating}
        onRatingChange={setSelectedRating}
      />

      {/* Review Input */}
      <View style={styles.reviewInputContainer}>
        <Text style={styles.reviewInputLabel}>REVIEW (OPTIONAL)</Text>
        <TextInput
          style={styles.reviewInput}
          placeholder="Share your thoughts about the product..."
          placeholderTextColor="#A3A3A3"
          multiline
          numberOfLines={6}
          value={reviewText}
          onChangeText={setReviewText}
          textAlignVertical="top"
        />
      </View>

      {/* Buttons */}
      <View style={styles.reviewFormButtons}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Submit review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Main Ratings Section Component
 * Handles all states: empty, collapsed, expanded, write mode
 */
export const RatingsSection: React.FC<RatingsSectionProps> = ({
  ratings = [],
  averageRating = 0,
  ratingsCount = 0,
  onSubmitReview,
  userHasReviewed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default
  const [isWriteMode, setIsWriteMode] = useState(false);

  const hasReviews = ratingsCount > 0;

  const handleSubmitReview = (rating: number, review: string) => {
    if (onSubmitReview) {
      onSubmitReview(rating, review);
    }
    setIsWriteMode(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Header (Always Visible) */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/Reviews.png')}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>Ratings</Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-forward"}
          size={16}
          color="#737373"
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Write Review Form (shown in write mode) */}
          {isWriteMode ? (
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={() => setIsWriteMode(false)}
            />
          ) : (
            <>
              {/* Empty State */}
              {!hasReviews && (
                <View style={styles.emptyState}>
                  <Image
                    source={require('../../../assets/noreviews.png')}
                    style={styles.emptyStateImage}
                  />
                  <Text style={styles.emptyStateText}>No Reviews</Text>
                  <WriteReviewButton onPress={() => setIsWriteMode(true)} />
                </View>
              )}

              {/* Reviews Exist */}
              {hasReviews && (
                <>
                  {/* Write Review Button (if user hasn't reviewed) */}
                  {!userHasReviewed && (
                    <WriteReviewButton onPress={() => setIsWriteMode(true)} />
                  )}

                  {/* Rating Summary */}
                  <View style={styles.ratingSummary}>
                    {/* Average Rating */}
                    <View style={styles.averageRating}>
                      <Text style={styles.averageNumber}>
                        {averageRating.toFixed(1)}
                      </Text>
                      <StarRating rating={averageRating} size={9} />
                      <Text style={styles.reviewCount}>
                        {ratingsCount} review{ratingsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    {/* Distribution Bars */}
                    <RatingDistribution ratings={ratings} />
                  </View>

                  {/* Reviews List */}
                  <View style={styles.reviewsList}>
                    {ratings.slice(0, 5).map((rating) => (
                      <ReviewCard key={rating.id} rating={rating} />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#EBEAE4',
    width: '100%',
    marginTop: 8, // 8px margin to match other collapsible sections
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  headerIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    letterSpacing: -0.6,
    lineHeight: 24,
  },

  // Expanded Content
  expandedContent: {
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
  },

  emptyStateImage: {
    width: 97,
    height: 86,
    resizeMode: 'contain',
  },

  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#404040',
    letterSpacing: -0.48,
  },

  // Write Review Button
  writeReviewButton: {
    width: '100%',
    height: 48,
    borderRadius: 1000,
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  writeReviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#404040',
    letterSpacing: -0.48,
  },

  // Rating Summary
  ratingSummary: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  averageRating: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },

  averageNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: '#262626',
    lineHeight: 28,
    letterSpacing: -0.6,
  },

  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  reviewCount: {
    fontSize: 12,
    color: '#737373',
  },

  // Distribution Bars
  distributionContainer: {
    flex: 1,
    gap: 4,
  },

  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  distributionNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0A0A0A',
    width: 8,
  },

  progressBarBackground: {
    flex: 1,
    height: 10,
    borderRadius: 32,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 32,
  },

  // Reviews List
  reviewsList: {
    gap: 8,
  },

  // Review Card
  reviewCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 16,
    gap: 8,
  },

  reviewHeader: {
    flexDirection: 'row',
    gap: 8,
  },

  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  reviewAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  reviewUserInfo: {
    flex: 1,
    gap: 4,
  },

  reviewUsername: {
    fontSize: 15,
    fontWeight: '700',
    color: '#262626',
    letterSpacing: -0.45,
    lineHeight: 18,
  },

  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reviewTimestamp: {
    fontSize: 12,
    color: '#737373',
  },

  reviewText: {
    fontSize: 15,
    color: '#737373',
    lineHeight: 21,
    letterSpacing: -0.15,
  },

  // Review Form
  reviewForm: {
    backgroundColor: '#F5F5F5',
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16,
  },

  reviewFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
    letterSpacing: -0.48,
    textAlign: 'center',
  },

  // Star Rating Selector
  starSelectorContainer: {
    alignItems: 'center',
    gap: 8,
  },

  starSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },

  starLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#737373',
    letterSpacing: 0.33,
    textTransform: 'uppercase',
  },

  // Review Input
  reviewInputContainer: {
    gap: 6,
  },

  reviewInputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#737373',
    letterSpacing: 0.33,
    textTransform: 'uppercase',
  },

  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    height: 160,
    padding: 16,
    fontSize: 15,
    color: '#0A0A0A',
    lineHeight: 21,
    letterSpacing: -0.15,
  },

  // Review Form Buttons
  reviewFormButtons: {
    gap: 8,
  },

  submitButton: {
    height: 48,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#043614',
    backgroundColor: '#1F5932',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.48,
  },

  cancelButton: {
    height: 48,
    borderRadius: 1000,
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#404040',
    letterSpacing: -0.48,
  },
});
