import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { logger } from '../../utils/logger';

interface UserReviewsScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
    };
  };
}

interface Review {
  id: string;
  rating: string;
  review: string;
  created_at: string;
  food_id?: string;
  foods?: {
    id: string;
    name: string;
    image?: string;
  };
}

export const UserReviewsScreen: React.FC<UserReviewsScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { userId, userName } = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserReviews();
  }, [userId]);

  const loadUserReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          food_id,
          foods(id, name, image)
        `)
        .eq('user_id', userId)
        .not('review', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading reviews:', error);
        Alert.alert('Error', 'Failed to load reviews');
        return;
      }

      setReviews(data || []);
    } catch (error) {
      logger.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? theme.colors.warning : theme.colors.text.tertiary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={() => {
        if (item.food_id) {
          navigation.navigate('FoodDetail' as never, { foodId: item.food_id } as never);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={2}>
            {item.foods?.name || 'Unknown Food'}
          </Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
        {renderStars(parseInt(item.rating) || 0)}
      </View>

      <Text style={styles.reviewText} numberOfLines={3}>
        {item.review}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {userName}'s Reviews
            </Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {userName}'s Reviews
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>
            {userName} hasn't written any reviews yet.
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsText}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    padding: 4,
    marginRight: theme.spacing.sm,
  },

  headerTitle: {
    ...theme.typography.heading,
    fontSize: 22, // Reduced from 26 to 22 (4px decrease)
    color: theme.colors.green[950],
    flex: 1,
    textAlign: 'center',
  },

  headerRight: {
    width: 32,
    alignItems: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  statsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },

  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  reviewCard: {
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

  foodInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },

  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  reviewDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.neutral.BG,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});