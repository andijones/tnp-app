import React from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Rating } from '../../types';
import { SectionHeader } from '../common/SectionHeader';

interface RatingsSectionProps {
  ratings?: Rating[];
  averageRating?: number;
  ratingsCount?: number;
  reviewSubmission?: React.ReactNode;
}

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, showNumber = false }) => {
  const stars = [];
  const roundedRating = Math.round(rating);
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= roundedRating ? "star" : "star-outline"}
        size={size}
        color={i <= roundedRating ? theme.colors.warning : theme.colors.text.hint}
        style={{ marginRight: 2 }}
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

interface RatingItemProps {
  rating: Rating;
}

const RatingItem: React.FC<RatingItemProps> = ({ rating }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.ratingItem}>
      <View style={styles.ratingHeader}>
        <View style={styles.userInfo}>
          {rating.avatar_url ? (
            <Image source={{ uri: rating.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={theme.colors.text.hint} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {rating.username || 'Anonymous User'}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(rating.created_at)}
            </Text>
          </View>
        </View>
        <StarRating rating={rating.ratingValue || 0} size={14} />
      </View>
      
      {rating.review && (
        <Text style={styles.reviewText}>{rating.review}</Text>
      )}
    </View>
  );
};

export const RatingsSection: React.FC<RatingsSectionProps> = ({ 
  ratings = [], 
  averageRating = 0, 
  ratingsCount = 0,
  reviewSubmission 
}) => {
  if (ratingsCount === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Reviews" 
          icon="star-outline"
        />
        {reviewSubmission}
        <View style={styles.noRatingsContainer}>
          <Ionicons name="star-outline" size={32} color={theme.colors.text.hint} />
          <Text style={styles.noRatingsText}>No reviews yet</Text>
          <Text style={styles.noRatingsSubtext}>Be the first to review this product</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Reviews" 
        icon="star-outline"
        subtitle={`${ratingsCount} review${ratingsCount === 1 ? '' : 's'}`}
      />
      
      {reviewSubmission}
      
      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.averageRating}>
          <Text style={styles.averageNumber}>{averageRating.toFixed(1)}</Text>
          <StarRating rating={averageRating} size={20} />
          <Text style={styles.totalReviews}>
            Based on {ratingsCount} review{ratingsCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {/* Individual Reviews */}
      <View style={styles.reviewsList}>
        <FlatList
          data={ratings.slice(0, 5)} // Show first 5 reviews
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RatingItem rating={item} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        
        {ratings.length > 5 && (
          <View style={styles.moreReviews}>
            <Text style={styles.moreReviewsText}>
              +{ratings.length - 5} more review{ratings.length - 5 === 1 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },

  noRatingsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  noRatingsText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  noRatingsSubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  ratingSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  averageRating: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  averageNumber: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingNumber: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  totalReviews: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },

  reviewsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },

  ratingItem: {
    paddingVertical: theme.spacing.md,
  },

  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.md,
  },

  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  userDetails: {
    flex: 1,
  },

  username: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  reviewDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  reviewText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },

  separator: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginVertical: theme.spacing.sm,
  },

  moreReviews: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    marginTop: theme.spacing.md,
  },

  moreReviewsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});