import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Linking,
  StatusBar,
  Share,
  Platform,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food, FoodDetailScreenProps } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { NovaBadge } from '../../components/common/NovaBadge';
import { IconBadge } from '../../components/common/IconBadge';
import { SectionHeader } from '../../components/common/SectionHeader';
import { NutritionPanel } from '../../components/food/NutritionPanel';
import { IngredientsList } from '../../components/food/IngredientsList';
import { MinimalNutritionPanel } from '../../components/food/MinimalNutritionPanel';
import { RatingsSection } from '../../components/food/RatingsSection';
import { ReviewSubmission } from '../../components/food/ReviewSubmission';
import { useFavorites } from '../../hooks/useFavorites';
import { NovaRatingBanner } from '../../components/food/NovaRatingBanner';
import { ProcessingLevelBanner } from '../../components/food/ProcessingLevelBanner';
import { ProcessingLevelCard } from '../../components/common/ProcessingLevelCard';
import { ImprovedNutritionPanel } from '../../components/food/ImprovedNutritionPanel';
import { ImprovedIngredientsList } from '../../components/food/ImprovedIngredientsList';
import { RelatedFoodsSection } from '../../components/food/RelatedFoodsSection';
import { SubmitterInfo } from '../../components/food/SubmitterInfo';
import { CategoryCard } from '../../components/aisles/CategoryCard';
import { CollapsibleSection } from '../../components/common/CollapsibleSection';
import { SimilarFoodsSection } from '../../components/food/SimilarFoodsSection';
import { logger } from '../../utils/logger';
import { FoodDetailSkeleton } from '../../components/common/skeletons/FoodDetailSkeleton';

const { width: screenWidth } = Dimensions.get('window');

export const FoodDetailScreen: React.FC<FoodDetailScreenProps> = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const reviewSectionRef = useRef<View>(null);
  const scrollHandlerRef = useRef(null);
  const { isFavorite, toggleFavorite: toggleFavoriteHook } = useFavorites();

  // Gesture handling for swipe to dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const [scrollY, setScrollY] = useState(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationY: translation, velocityY } = event.nativeEvent;

    // When gesture ends
    if (state === 5) { // END
      // Dismiss if dragged down more than 100px or fast swipe down
      if (translation > 100 || velocityY > 1000) {
        // Navigate immediately for better responsiveness
        navigation.goBack();

        // Continue animation for visual smoothness (but don't wait for it)
        Animated.spring(translateY, {
          toValue: 1000,
          velocity: velocityY / 1000,
          useNativeDriver: true,
          stiffness: 150,
          damping: 25,
        }).start();
      } else {
        // Spring back to original position
        Animated.spring(translateY, {
          toValue: 0,
          velocity: velocityY / 1000,
          useNativeDriver: true,
          stiffness: 400,
          damping: 30,
        }).start();
      }
    }
  };

  const handleScroll = (event: any) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  useEffect(() => {
    fetchFoodDetails();
  }, [foodId]);

  const fetchFoodDetails = async () => {
    try {
      const { data: foodData, error: foodError } = await supabase
        .from('foods')
        .select('*, original_submitter_id, food_link_id')
        .eq('id', foodId)
        .single();

      if (foodError) {
        logger.error('Error fetching food:', foodError);
        Alert.alert('Error', 'Failed to load food details');
        navigation.goBack();
        return;
      }

      // Fetch aisle associations
      const { data: aisleData } = await supabase
        .from('food_item_aisles')
        .select(`
          aisle_id,
          aisles!inner(
            id,
            name,
            slug
          )
        `)
        .eq('food_id', foodId)
        .limit(1)
        .single();

      // Fetch ratings first
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('id, rating, review, created_at, user_id')
        .eq('food_id', foodId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        logger.error('Error fetching ratings:', ratingsError);
      }

      logger.log('Raw ratings data:', ratingsData);
      logger.log('Aisle data from food item:', aisleData);
      logger.log('Food data with submitter info:', {
        id: foodData.id,
        name: foodData.name,
        original_submitter_id: foodData.original_submitter_id,
        food_link_id: foodData.food_link_id
      });

      // Fetch user profiles for ratings
      const ratings = [];
      if (ratingsData && ratingsData.length > 0) {
        for (const rating of ratingsData) {
          logger.log('Processing rating for user_id:', rating.user_id);

          const { data: profileData, error: profileError } = await supabase
            .rpc('get_public_profile', { user_id: rating.user_id });

          if (profileError) {
            logger.error('Error fetching profile for rating:', profileError);
          }

          logger.log('Profile data for rating:', profileData);

          // Use full_name first, then username, then fallback
          let displayName = null;

          if (profileData && profileData.length > 0) {
            const profile = profileData[0]; // RPC returns an array, get first element
            logger.log('Rating user profile check - full_name:', typeof profile.full_name, '"' + profile.full_name + '"');
            logger.log('Rating user profile check - username:', typeof profile.username, '"' + profile.username + '"');

            // Check for actual non-empty values
            if (profile.full_name && typeof profile.full_name === 'string' && profile.full_name.trim() !== '') {
              displayName = profile.full_name;
              logger.log('✅ Using full_name for rating:', displayName);
            } else if (profile.username && typeof profile.username === 'string' && profile.username.trim() !== '') {
              displayName = profile.username;
              logger.log('✅ Using username for rating:', displayName);
            } else {
              logger.log('❌ RPC returned profile but no valid name data for rating user:', rating.user_id, profile);
            }
          }

          if (!displayName) {
            logger.log('No display name found in profile for user:', rating.user_id);
          }

          ratings.push({
            ...rating,
            ratingValue: parseInt(rating.rating) || 0,
            username: displayName || 'Anonymous User',
            avatar_url: profileData && profileData.length > 0 ? profileData[0].avatar_url : null
          });
        }
      }

      logger.log('Processed ratings:', ratings);

      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length 
        : 0;

      // Check if current user has already reviewed this food
      const { data: { user } } = await supabase.auth.getUser();
      let userHasReview = false;
      if (user && ratingsData && ratingsData.length > 0) {
        userHasReview = ratingsData.some(rating => rating.user_id === user.id);
      }
      setHasUserReview(userHasReview);

      // Parse nutrition data from JSONB column
      let nutritionData = null;
      if (foodData.nutrition_data) {
        nutritionData = foodData.nutrition_data;
      }

      setFood({
        ...foodData,
        aisle: aisleData?.aisles || null,
        nutrition: nutritionData,
        ratings,
        average_rating: averageRating,
        ratings_count: ratings.length
      });
    } catch (error) {
      logger.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      await toggleFavoriteHook(foodId);
    } catch (error) {
      logger.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const shareFood = async () => {
    if (!food) return;
    
    try {
      const shareOptions = {
        message: `Check out ${food.name} on TNP - The Naked Pantry!`,
        url: food.url || undefined,
        title: food.name,
      };

      if (Platform.OS === 'ios') {
        await Share.share({
          message: shareOptions.url ? `${shareOptions.message}\n${shareOptions.url}` : shareOptions.message,
          url: shareOptions.url,
          title: shareOptions.title,
        });
      } else {
        await Share.share({
          message: shareOptions.url ? `${shareOptions.message}\n${shareOptions.url}` : shareOptions.message,
          title: shareOptions.title,
        });
      }
    } catch (error) {
      logger.error('Error sharing food:', error);
      Alert.alert('Error', 'Failed to share this food item');
    }
  };

  const reportFood = () => {
    Alert.alert('Report', 'Report functionality coming soon!');
  };

  const handleViewFood = async () => {
    if (!food?.url) {
      Alert.alert('Not Available', 'This food doesn\'t have a supermarket link available.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(food.url);
      if (supported) {
        await Linking.openURL(food.url);
      } else {
        Alert.alert('Error', 'Unable to open this link on your device.');
      }
    } catch (error) {
      logger.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open supermarket link.');
    }
  };

  const handleGoogleSearch = async () => {
    if (!food?.name) {
      Alert.alert('Error', 'Food name not available.');
      return;
    }

    try {
      const encodedFoodName = encodeURIComponent(food.name);
      const googleSearchUrl = `https://www.google.com/search?q=${encodedFoodName}`;

      const supported = await Linking.canOpenURL(googleSearchUrl);
      if (supported) {
        await Linking.openURL(googleSearchUrl);
      } else {
        Alert.alert('Error', 'Unable to open Google search on your device.');
      }
    } catch (error) {
      logger.error('Error opening Google search:', error);
      Alert.alert('Error', 'Failed to open Google search.');
    }
  };

  const handleSubmitReview = async (rating: number, review: string) => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Authentication Required', 'Please log in to submit a review.');
        return;
      }

      // Insert new review
      const { error: insertError } = await supabase
        .from('ratings')
        .insert({
          food_id: foodId,
          user_id: user.id,
          rating: rating.toString(),
          review: review || null,
        });

      if (insertError) {
        logger.error('Error submitting review:', insertError);
        Alert.alert('Error', 'Failed to submit review. Please try again.');
        return;
      }

      Alert.alert('Success', 'Your review has been submitted!');

      // Refresh food details to show new review
      fetchFoodDetails();
    } catch (error) {
      logger.error('Error in handleSubmitReview:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  if (loading) {
    return <FoodDetailSkeleton />;
  }

  if (!food) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.modalCard}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
            <Text style={styles.errorText}>Food not found</Text>
            <Button title="Go Back" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Animated Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: translateY.interpolate({
              inputRange: [0, 300],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
      {/* Modal Card Container with Gesture Handler */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetY={5}
        failOffsetY={-10}
        enabled={scrollY <= 0}
        simultaneousHandlers={scrollHandlerRef}
      >
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [-50, 0, 1000],
                    outputRange: [0, 0, 1000],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        {/* Close Button - Top Right */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={theme.colors.neutral[600]} />
        </TouchableOpacity>

        {/* Header Actions - Share & Favorite */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={shareFood}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, favoriteLoading && styles.buttonDisabled]}
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite(foodId) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite(foodId) ? theme.colors.error : theme.colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <NativeViewGestureHandler ref={scrollHandlerRef} disallowInterruption={true}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
          {/* Hero Product Image */}
          <View style={styles.heroImageContainer}>
            {food.image ? (
              <Image source={{ uri: food.image }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Ionicons name="image-outline" size={80} color={theme.colors.neutral[400]} />
              </View>
            )}
          </View>

          {/* Processing Level Card - Full Width */}
          {food.nova_group && (
            <ProcessingLevelCard level={food.nova_group} />
          )}

          {/* Content Container with Card Layout */}
          <View style={styles.contentContainer}>
            {/* Info Card - Full Width */}
            <View style={styles.heroCard}>

              {/* Store Info (left) & Aisle Pill (right) */}
              <View style={styles.metaRow}>
                <Text style={styles.storeText}>
                  {(food.supermarket || 'TESCO').toUpperCase()}
                </Text>
                {food.aisle && (
                  <TouchableOpacity
                    style={styles.aislePill}
                    onPress={() => {
                      navigation.navigate('AisleDetail', {
                        slug: food.aisle.slug,
                        title: food.aisle.name
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.aislePillText}>{food.aisle.name}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Product Title */}
              <Text style={styles.productTitle}>{food.name}</Text>

              {/* Star Rating - Clickable */}
              <TouchableOpacity 
                style={styles.ratingRow} 
                onPress={() => {
                  reviewSectionRef.current?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y) => {
                      scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
                    },
                    () => {}
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={16}
                      color={star <= Math.round(food.average_rating || 0) ? "#FFA500" : "#E5E5E5"}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {food.ratings_count || 0} rating{(food.ratings_count !== 1) ? 's' : ''}
                </Text>
                <Ionicons name="chevron-down" size={14} color={theme.colors.neutral[400]} />
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title="View food"
                  onPress={handleViewFood}
                  variant="primary"
                />

                <Button
                  title="Search on Google"
                  onPress={handleGoogleSearch}
                  variant="outline"
                />
              </View>
            </View>

            {/* Collapsible Sections - Full Width with Top Margin */}
            <View style={styles.collapsibleSectionsContainer}>
              {/* Ingredients Section */}
              <CollapsibleSection
                icon={require('../../../assets/ingred.png')}
                title="Ingredients"
                defaultExpanded={true}
              >
                <ImprovedIngredientsList
                  ingredients={food.ingredients}
                  description={food.description}
                />
              </CollapsibleSection>

              {/* Nutrition Section */}
              <CollapsibleSection
                icon={require('../../../assets/nut.png')}
                title="Nutrition Facts"
                defaultExpanded={true}
              >
                <ImprovedNutritionPanel nutrition={food.nutrition} />
              </CollapsibleSection>

              {/* Reviews Section */}
              <View ref={reviewSectionRef}>
                <RatingsSection
                  ratings={food.ratings}
                  averageRating={food.average_rating}
                  ratingsCount={food.ratings_count}
                  onSubmitReview={handleSubmitReview}
                  userHasReviewed={hasUserReview}
                />
              </View>
            </View>

            {/* Similar Foods Section */}
            <SimilarFoodsSection
              currentFoodId={foodId}
              aisleId={food.aisle?.id}
              onFoodPress={(foodId) => navigation.push('FoodDetail', { foodId })}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavoriteHook}
            />

            {/* Submitter Info - Moved to bottom */}
            {(food.original_submitter_id || food.food_link_id || food.user_id) && (
              <View style={styles.submitterContainer}>
                <SubmitterInfo
                  originalSubmitterId={food.original_submitter_id || food.user_id}
                  foodLinkId={food.food_link_id}
                />
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.reportLink} onPress={reportFood}>
                <Ionicons name="flag-outline" size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.reportText}>Report incorrect information</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </NativeViewGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  // Modal Card Container
  modalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 80, // Space for status bar and dynamic island
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // Drag Handle (visual indicator for swipe gesture)
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.neutral[300],
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  // Close Button - Top Right
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Header Actions - Share & Favorite (Top Left)
  headerActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    zIndex: 10,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.5,
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },

  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar (68px + margin)
    backgroundColor: theme.colors.neutral.white,
  },

  // Hero Image Container
  heroImageContainer: {
    height: 280,
    backgroundColor: theme.colors.neutral.white,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5', // neutral-200
    marginTop: 0, // Remove margin - drag handle provides spacing
  },
  
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  
  heroImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  
  
  // Inline Nova Card (for info card)
  novaCardInline: {
    alignSelf: 'stretch',
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: theme.spacing.md,
  },
  
  novaTextInline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  // Content Container
  contentContainer: {
    paddingTop: 0, // No top padding for hero section
    paddingBottom: theme.spacing.md,
    gap: 0, // No gap - we control spacing manually
    backgroundColor: theme.colors.neutral.white,
  },

  // Hero Card - Full Width with horizontal padding for breathing room
  heroCard: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.neutral.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md, // 16px horizontal padding
  },

  // Card Styling from Figma (with horizontal margin for rounded cards)
  card: {
    borderRadius: 6, // var(--Spacing-6, 6px)
    borderWidth: 1,
    borderColor: theme.colors.neutral[200], // var(--Neutral-200, #E5E5E5)
    backgroundColor: theme.colors.neutral.white, // var(--Neutral-white, #FFF)
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md, // Add margin between cards
  },

  // Meta Row - Store (left) and Aisle pill (right)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between for left/right alignment
    marginBottom: 12,
  },

  storeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: theme.colors.neutral[500],
    letterSpacing: 0.5,
  },

  // Aisle Pill
  aislePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 0.5,
    borderColor: theme.colors.neutral[200],
  },

  aislePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    letterSpacing: -0.11,
  },

  // Collapsible Sections Container
  collapsibleSectionsContainer: {
    marginTop: theme.spacing.md, // Add spacing after hero section
  },

  // Submitter Container - At bottom of page
  submitterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    marginTop: theme.spacing.lg,
  },
  
  
  // Product Title
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
    lineHeight: 29,
    letterSpacing: -0.72,
  },
  
  // Rating Row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },

  starsContainer: {
    flexDirection: 'row',
    gap: 3,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[600],
    letterSpacing: -0.14,
  },
  
  // Action Buttons
  buttonContainer: {
    gap: 12, // Slightly tighter spacing between buttons
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  // Clean Section Header (no icons)
  cleanSectionHeader: {
    marginBottom: theme.spacing.md,
  },
  
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: Math.round(24 * 1.19712), // 28.731px rounded to 29
    letterSpacing: -0.72,
    color: theme.colors.neutral[900],
    flex: 1,
  },
  
  portionText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  
  
  // Footer
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    marginTop: theme.spacing.xl,
  },
  
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  
  reportText: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  
  errorText: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing.lg,
    textAlign: 'center',
  },
});