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
import { RatingsSection } from '../../components/food/RatingsSection';
import { ReviewSubmission } from '../../components/food/ReviewSubmission';
import { useFavorites } from '../../hooks/useFavorites';
import { NovaRatingBanner } from '../../components/food/NovaRatingBanner';
import { ImprovedNutritionPanel } from '../../components/food/ImprovedNutritionPanel';
import { ImprovedIngredientsList } from '../../components/food/ImprovedIngredientsList';
import { RelatedFoodsSection } from '../../components/food/RelatedFoodsSection';

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
        .select('*')
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

      // Fetch user profiles for ratings
      const ratings = [];
      if (ratingsData && ratingsData.length > 0) {
        for (const rating of ratingsData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', rating.user_id)
            .single();

          ratings.push({
            ...rating,
            ratingValue: parseInt(rating.rating) || 0,
            username: profileData?.username,
            avatar_url: profileData?.avatar_url
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
          {/* Hero Section - Clean & Focused */}
          <View style={styles.heroSection}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {food.image ? (
                <Image source={{ uri: food.image }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color={theme.colors.text.tertiary} />
                </View>
              )}
            </View>

            {/* Product Header */}
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{food.name}</Text>
              
              {/* Supermarket & Aisle Info */}
              <View style={styles.metaInfo}>
                <Text style={styles.supermarketText}>
                  {food.supermarket || 'Available at supermarkets'}
                </Text>
                {food.aisle?.name && (
                  <TouchableOpacity 
                    style={styles.aisleLink}
                    onPress={() => {
                      if (food.aisle?.slug && food.aisle?.name) {
                        navigation.navigate('AisleDetail', {
                          slug: food.aisle.slug,
                          title: food.aisle.name
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.aisleLinkText}>{food.aisle.name} aisle</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* NOVA Rating - Prominent */}
            <View style={styles.novaSection}>
              <NovaRatingBanner novaGroup={food.nova_group} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {food.url && (
                <Button
                  title="View at Store"
                  onPress={handleViewFood}
                  variant="primary"
                  style={styles.primaryButton}
                />
              )}
              
              <Button
                title="Search Online"
                onPress={handleGoogleSearch}
                variant="tertiary"
                style={styles.secondaryButton}
              />
            </View>
          </View>

          {/* Content Sections - Clean Typography Hierarchy */}
          <View style={styles.contentContainer}>
            
            {/* Nutrition Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <ImprovedNutritionPanel nutrition={food.nutrition} />
            </View>

            {/* Ingredients Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <ImprovedIngredientsList 
                ingredients={food.ingredients} 
                description={food.description} 
              />
            </View>

            {/* Reviews Section */}
            <View style={styles.section} ref={reviewSectionRef}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {food.average_rating && food.ratings_count && food.ratings_count > 0 ? (
                  <Text style={styles.reviewsSummary}>
                    {food.average_rating.toFixed(1)} stars • {food.ratings_count} review{food.ratings_count === 1 ? '' : 's'}
                  </Text>
                ) : (
                  <Text style={styles.reviewsSummary}>Be the first to review this product</Text>
                )}
              </View>
              <RatingsSection 
                ratings={food.ratings}
                averageRating={food.average_rating}
                ratingsCount={food.ratings_count}
                reviewSubmission={
                  <ReviewSubmission 
                    foodId={foodId}
                    onReviewSubmitted={fetchFoodDetails}
                    hasExistingReview={hasUserReview}
                  />
                }
              />
            </View>

            {/* Related Foods Section */}
            <View style={styles.section}>
              <RelatedFoodsSection 
                currentFood={food}
                onFoodPress={(foodId) => navigation.push('FoodDetail', { foodId })}
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
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  
  // Clean Header Design
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
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
  },
  
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  
  // Hero Section - Clean and Focused Design
  heroSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  
  // Product Image
  imageContainer: {
    height: 240,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  // Product Header - Clear Typography
  productHeader: {
    marginBottom: theme.spacing.xl,
  },
  
  productName: {
    ...theme.typography.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 38,
  },
  
  metaInfo: {
    gap: theme.spacing.sm,
  },
  
  supermarketText: {
    ...theme.typography.bodyNew,
    color: theme.colors.text.secondary,
  },
  
  aisleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  
  aisleLinkText: {
    ...theme.typography.bodyNew,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // NOVA Section
  novaSection: {
    marginBottom: theme.spacing.xl,
  },
  
  // Action Buttons
  actionSection: {
    gap: theme.spacing.md,
  },
  
  primaryButton: {
    marginBottom: theme.spacing.sm,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  
  // Content Container - Clean Background Switch
  contentContainer: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xxl,
  },
  
  // Section Styling - Generous Spacing
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  // Reviews Section Header
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  
  reviewsSummary: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
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