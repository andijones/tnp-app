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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { supabase } from '../../services/supabase/config';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { NovaBadge } from '../../components/common/NovaBadge';
import { IconBadge } from '../../components/common/IconBadge';
import { SectionHeader } from '../../components/common/SectionHeader';
import { NutritionPanel } from '../../components/food/NutritionPanel';
import { IngredientsList } from '../../components/food/IngredientsList';
import { MinimalNutritionPanel } from '../../components/food/MinimalNutritionPanel';
import { ImprovedRatingsSection } from '../../components/food/ImprovedRatingsSection';
import { ReviewSubmission } from '../../components/food/ReviewSubmission';
import { useFavorites } from '../../hooks/useFavorites';
import { NovaRatingBanner } from '../../components/food/NovaRatingBanner';
import { ImprovedNutritionPanel } from '../../components/food/ImprovedNutritionPanel';
import { ImprovedIngredientsList } from '../../components/food/ImprovedIngredientsList';
import { RelatedFoodsSection } from '../../components/food/RelatedFoodsSection';
import { SubmitterInfo } from '../../components/food/SubmitterInfo';
import { CategoryCard } from '../../components/aisles/CategoryCard';

const { width: screenWidth } = Dimensions.get('window');

export const FoodDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const reviewSectionRef = useRef<View>(null);
  const { isFavorite, toggleFavorite: toggleFavoriteHook } = useFavorites();

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
        console.error('Error fetching food:', foodError);
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
        console.error('Error fetching ratings:', ratingsError);
      }

      console.log('Raw ratings data:', ratingsData);
      console.log('Aisle data from food item:', aisleData);
      console.log('Food data with submitter info:', {
        id: foodData.id,
        name: foodData.name,
        original_submitter_id: foodData.original_submitter_id,
        food_link_id: foodData.food_link_id
      });

      // Fetch user profiles for ratings
      const ratings = [];
      if (ratingsData && ratingsData.length > 0) {
        for (const rating of ratingsData) {
          console.log('Processing rating for user_id:', rating.user_id);

          const { data: profileData, error: profileError } = await supabase
            .rpc('get_public_profile', { user_id: rating.user_id });

          if (profileError) {
            console.error('Error fetching profile for rating:', profileError);
          }

          console.log('Profile data for rating:', profileData);

          // Use full_name first, then username, then fallback
          let displayName = null;

          if (profileData && profileData.length > 0) {
            const profile = profileData[0]; // RPC returns an array, get first element
            console.log('Rating user profile check - full_name:', typeof profile.full_name, '"' + profile.full_name + '"');
            console.log('Rating user profile check - username:', typeof profile.username, '"' + profile.username + '"');

            // Check for actual non-empty values
            if (profile.full_name && typeof profile.full_name === 'string' && profile.full_name.trim() !== '') {
              displayName = profile.full_name;
              console.log('✅ Using full_name for rating:', displayName);
            } else if (profile.username && typeof profile.username === 'string' && profile.username.trim() !== '') {
              displayName = profile.username;
              console.log('✅ Using username for rating:', displayName);
            } else {
              console.log('❌ RPC returned profile but no valid name data for rating user:', rating.user_id, profile);
            }
          }

          if (!displayName) {
            console.log('No display name found in profile for user:', rating.user_id);
          }

          ratings.push({
            ...rating,
            ratingValue: parseInt(rating.rating) || 0,
            username: displayName || 'Anonymous User',
            avatar_url: profileData && profileData.length > 0 ? profileData[0].avatar_url : null
          });
        }
      }

      console.log('Processed ratings:', ratings);

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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      await toggleFavoriteHook(foodId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
      console.error('Error sharing food:', error);
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
      console.error('Error opening URL:', error);
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
      console.error('Error opening Google search:', error);
      Alert.alert('Error', 'Failed to open Google search.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading food details..." />
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Food not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.colors.surface} 
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Clean Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={shareFood}
              activeOpacity={0.6}
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerButton, favoriteLoading && styles.buttonDisabled]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              activeOpacity={0.6}
            >
              <Ionicons
                name={isFavorite(foodId) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite(foodId) ? theme.colors.error : theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

          {/* Content Container with Card Layout */}
          <View style={styles.contentContainer}>
            {/* Info Card */}
            <View style={styles.card}>
              {/* Nova Rating */}
              {food.nova_group && (
                <View style={styles.novaCardInline}>
                  <Text style={styles.novaTextInline}>Nova {food.nova_group}</Text>
                </View>
              )}
              
              {/* Store Info */}
              <View style={styles.metaColumn}>
                <Text style={styles.storeText}>
                  {(food.supermarket || 'TESCO').toUpperCase()}
                </Text>
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
                  variant="tertiary"
                />
              </View>
            </View>

            {/* Category/Aisle Card */}
            {food.aisle && (
              <CategoryCard
                aisle={{
                  id: food.aisle.id || 'unknown',
                  name: food.aisle.name,
                  slug: food.aisle.slug,
                  children: []
                }}
                onPress={(aisle) => {
                  navigation.navigate('AisleDetail', {
                    slug: aisle.slug,
                    title: aisle.name
                  });
                }}
              />
            )}

            {/* Submitter Info Card */}
            {(food.original_submitter_id || food.food_link_id) && (
              <View style={styles.card}>
                <SubmitterInfo
                  originalSubmitterId={food.original_submitter_id}
                  foodLinkId={food.food_link_id}
                />
              </View>
            )}

            {/* Ingredients Card */}
            <View style={styles.card}>
              <View style={styles.cleanSectionHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
              </View>
              <ImprovedIngredientsList
                ingredients={food.ingredients}
                description={food.description}
              />
            </View>

            {/* Nutrition Card */}
            <View style={styles.card}>
              <View style={styles.cleanSectionHeader}>
                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              </View>
              <ImprovedNutritionPanel nutrition={food.nutrition} />
            </View>

            {/* Reviews Card */}
            <View style={styles.card} ref={reviewSectionRef}>
              <View style={styles.cleanSectionHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
              </View>

              <ImprovedRatingsSection
                ratings={food.ratings}
                averageRating={food.average_rating}
                ratingsCount={food.ratings_count}
                reviewSubmission={!hasUserReview ? (
                  <ReviewSubmission
                    foodId={foodId}
                    onReviewSubmitted={fetchFoodDetails}
                    hasExistingReview={hasUserReview}
                  />
                ) : undefined}
                onWriteReview={hasUserReview ? undefined : () => {
                  // Scroll to review submission or open modal
                  console.log('Write review pressed');
                }}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.reportLink} onPress={reportFood}>
                <Ionicons name="flag-outline" size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.reportText}>Report incorrect information</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Design
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 0,
  },
  
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },
  
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  
  // Hero Image Container
  heroImageContainer: {
    height: 320,
    backgroundColor: theme.colors.neutral.white,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5', // neutral-200
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  
  // Card Styling from Figma
  card: {
    borderRadius: 6, // var(--Spacing-6, 6px)
    borderWidth: 1,
    borderColor: theme.colors.neutral[200], // var(--Neutral-200, #E5E5E5)
    backgroundColor: theme.colors.neutral.white, // var(--Neutral-white, #FFF)
    padding: theme.spacing.md,
  },
  
  // Meta Column - Store and Category stacked
  metaColumn: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  
  storeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[500],
  },
  
  
  // Product Title
  productTitle: {
    ...theme.typography.heading,
    fontSize: 22, // Reduced from 26 to 22 (4px decrease)
    color: theme.colors.green[950],
    marginBottom: theme.spacing.lg,
    lineHeight: 28,
  },
  
  // Rating Row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  
  ratingText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  
  // Action Buttons
  buttonContainer: {
    gap: theme.spacing.md,
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