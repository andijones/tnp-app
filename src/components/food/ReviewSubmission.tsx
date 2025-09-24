import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { SectionHeader } from '../common/SectionHeader';
import { Button } from '../common/Button';

interface ReviewSubmissionProps {
  foodId: string;
  onReviewSubmitted: () => void;
  hasExistingReview?: boolean;
}

interface StarRatingPickerProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

const StarRatingPicker: React.FC<StarRatingPickerProps> = ({ 
  rating, 
  onRatingChange, 
  size = 32 
}) => {
  return (
    <View style={styles.starPicker}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.starButton}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? theme.colors.warning : theme.colors.text.tertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ 
  foodId, 
  onReviewSubmitted,
  hasExistingReview = false
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        Alert.alert('Authentication Required', 'Please log in to submit a review.');
        return;
      }

      // Insert new review (no update functionality)
      const { error: insertError } = await supabase
        .from('ratings')
        .insert({
          food_id: foodId,
          user_id: user.id,
          rating: rating.toString(),
          review: reviewText.trim() || null,
        });

      if (insertError) throw insertError;
      
      Alert.alert('Success', 'Your review has been submitted!');

      // Reset form
      setRating(0);
      setReviewText('');
      setIsExpanded(false);
      
      // Notify parent to refresh reviews
      onReviewSubmitted();

    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('ratings')
                .delete()
                .eq('food_id', foodId)
                .eq('user_id', user.id);

              if (error) throw error;

              Alert.alert('Success', 'Your review has been deleted.');
              onReviewSubmitted(); // Refresh the reviews
              
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const checkAuthAndExpand = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Alert.alert(
        'Login Required', 
        'Please log in to leave a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {
            // Navigate to login screen or show login modal
            // This would depend on your navigation setup
            console.log('Navigate to login');
          }}
        ]
      );
      return;
    }

    setIsExpanded(true);
  };

  if (hasExistingReview && !isExpanded) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Your Review" 
          icon="star-outline"
        />
        <View style={styles.existingReviewCard}>
          <Text style={styles.existingReviewText}>
            You've already reviewed this product
          </Text>
          <TouchableOpacity 
            style={styles.deleteReviewButton}
            onPress={handleDeleteReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                <Text style={styles.deleteReviewText}>Delete Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isExpanded) {
    return (
      <View style={styles.container}>
        <Button
          title="Write a review"
          onPress={checkAuthAndExpand}
          variant="text"
          leftIcon={<Ionicons name="star-outline" size={20} color={theme.colors.green[950]} />}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SectionHeader 
        title="Write a Review" 
        icon="star-outline"
      />
      
      <View style={styles.reviewCard}>
        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <StarRatingPicker 
            rating={rating} 
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating} star{rating === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        {/* Review Text */}
        <View style={styles.textSection}>
          <Text style={styles.textLabel}>Review (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about this product..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {reviewText.length}/500
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title={isSubmitting ? "Submitting..." : "Submit Review"}
            onPress={handleSubmitReview}
            variant="primary"
            disabled={rating === 0 || isSubmitting}
            style={styles.submitButtonStyle}
          />

          <Button
            title="Cancel"
            onPress={() => {
              setIsExpanded(false);
              setRating(0);
              setReviewText('');
            }}
            variant="tertiary"
            disabled={isSubmitting}
            style={styles.cancelButtonStyle}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },


  existingReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  existingReviewText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },

  deleteReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.sm,
  },

  deleteReviewText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    fontWeight: '600',
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  ratingSection: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  ratingLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  starPicker: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  starButton: {
    padding: theme.spacing.xs,
  },

  ratingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },

  textSection: {
    gap: theme.spacing.sm,
  },

  textLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 100,
  },

  characterCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
  },

  actionButtons: {
    gap: theme.spacing.md,
  },

  cancelButtonStyle: {
    // No additional styling needed
  },

  submitButtonStyle: {
    // No additional styling needed
  },
});