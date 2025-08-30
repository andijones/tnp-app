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

const { width: screenWidth } = Dimensions.get('window');

export const FoodDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState<Food | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const reviewSectionRef = useRef<View>(null);

  useEffect(() => {
    fetchFoodDetails();
    checkIfFavorite();
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

  const checkIfFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('food_id', foodId)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save favorites');
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            food_id: foodId,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const shareFood = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {food.image ? (
            <Image source={{ uri: food.image }} style={styles.foodImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={64} color={theme.colors.text.hint} />
            </View>
          )}
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.background} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareFood}
              >
                <Ionicons name="share-outline" size={24} color={theme.colors.background} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, favoriteLoading && styles.actionButtonDisabled]}
                onPress={toggleFavorite}
                disabled={favoriteLoading}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFavorite ? theme.colors.error : theme.colors.background}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.foodName}>{food.name}</Text>
          </View>
          
          {/* NOVA Badge - Full Width */}
          {food.nova_group && (
            <View style={styles.fullWidthNovaBadge}>
              <NovaBadge novaGroup={food.nova_group} size="large" showLabel />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* View Food Button (Primary) - Only show if URL exists */}
            {food.url && (
              <Button
                title="View Food"
                onPress={handleViewFood}
                variant="primary"
                style={styles.primaryActionButton}
                leftIcon={<Ionicons name="storefront" size={20} color="white" />}
              />
            )}
            
            {/* Google Search Button (Secondary) */}
            <Button
              title="Search Google"
              onPress={handleGoogleSearch}
              variant="outline"
              style={styles.secondaryActionButton}
              leftIcon={<Ionicons name="search" size={20} color={theme.colors.primary} />}
            />
          </View>

          {/* Supermarket & Rating Info */}
          <View style={styles.infoSection}>
            {/* Supermarket Info */}
            <View style={styles.supermarketInfo}>
              <Ionicons name="storefront" size={18} color={theme.colors.primary} />
              <Text style={styles.supermarketText}>
                {food.supermarket || 'Supermarket not specified'}
              </Text>
            </View>
            
            {/* Aisle Info */}
            {food.aisle?.name && (
              <TouchableOpacity 
                style={styles.aisleInfo}
                onPress={() => {
                  if (food.aisle?.slug && food.aisle?.name) {
                    console.log('Navigating to aisle:', food.aisle);
                    navigation.navigate('AisleDetail', {
                      slug: food.aisle.slug,
                      title: food.aisle.name
                    });
                  } else {
                    console.warn('Missing aisle data:', food.aisle);
                    Alert.alert('Navigation Error', 'Unable to navigate to aisle. Missing data.');
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="apps" size={18} color={theme.colors.primary} />
                <Text style={styles.aisleText}>
                  {food.aisle.name}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={theme.colors.text.hint} 
                  style={styles.aisleChevron}
                />
              </TouchableOpacity>
            )}
            
            {/* Rating Info */}
            <TouchableOpacity 
              style={styles.ratingInfo}
              onPress={() => {
                reviewSectionRef.current?.measureLayout(
                  scrollViewRef.current as any,
                  (x, y) => {
                    scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                  },
                  () => {}
                );
              }}
              activeOpacity={0.7}
            >
              {food.average_rating && food.ratings_count && food.ratings_count > 0 ? (
                <View style={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(food.average_rating) ? "star" : "star-outline"}
                      size={16}
                      color={star <= Math.round(food.average_rating) ? theme.colors.warning : theme.colors.text.hint}
                      style={styles.star}
                    />
                  ))}
                  <Text style={styles.ratingText}>
                    {food.average_rating.toFixed(1)} ({food.ratings_count} review{food.ratings_count === 1 ? '' : 's'})
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={16} 
                    color={theme.colors.text.secondary} 
                    style={styles.chevron}
                  />
                </View>
              ) : (
                <View style={styles.starRating}>
                  <Text style={styles.noRatingText}>No ratings yet</Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={16} 
                    color={theme.colors.text.secondary} 
                    style={styles.chevron}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Ingredients Section */}
          <IngredientsList 
            ingredients={food.ingredients} 
            description={food.description} 
          />

          {/* Nutrition Facts */}
          <MinimalNutritionPanel nutrition={food.nutrition} />

          {/* Ratings & Reviews */}
          <View ref={reviewSectionRef}>
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



          {/* Report Button */}
          <TouchableOpacity style={styles.reportButton} onPress={reportFood}>
            <Ionicons name="flag-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.reportText}>Report incorrect information</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  
  foodImage: {
    width: screenWidth,
    height: 250,
    resizeMode: 'contain',
    backgroundColor: theme.colors.background,
  },
  
  placeholderImage: {
    width: screenWidth,
    height: 250,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerActions: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  
  rightActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  actionButtonDisabled: {
    opacity: 0.5,
  },
  
  contentContainer: {
    padding: theme.spacing.lg,
  },
  
  titleSection: {
    marginBottom: theme.spacing.lg,
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    lineHeight: 36,
  },
  
  fullWidthNovaBadge: {
    width: '100%',
    marginBottom: theme.spacing.xl,
    alignItems: 'flex-start',
  },
  
  infoSection: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  
  supermarketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  supermarketText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  aisleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  aisleText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  
  aisleChevron: {
    marginLeft: theme.spacing.xs,
  },
  
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  star: {
    marginRight: 2,
  },
  
  ratingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  noRatingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  
  chevron: {
    marginLeft: theme.spacing.sm,
  },

  actionButtonsContainer: {
    marginVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },

  secondaryActionButton: {
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  
  
  ingredientsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  
  ingredientsText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  
  
  metaInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  
  metaLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  
  metaValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  
  reportText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginVertical: theme.spacing.lg,
  },
});