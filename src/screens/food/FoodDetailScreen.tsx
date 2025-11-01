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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food, FoodDetailScreenProps } from '../../types';
import { supabase } from '../../services/supabase/config';
import { Button } from '../../components/common/Button';
import { useFavorites } from '../../hooks/useFavorites';
import { SubmitterInfo } from '../../components/food/SubmitterInfo';
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
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
      logger.error('Error fetching food details:', error);

      // Show user-friendly error message
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Unable to load food details. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: () => fetchFoodDetails() }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load food details. Please try again later.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      }
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

  const handleOpenReviewModal = async () => {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      Alert.alert('Login Required', 'Please log in to leave a review.');
      return;
    }

    // Check if user already has a review
    if (hasUserReview) {
      Alert.alert('Already Reviewed', 'You have already reviewed this product.');
      return;
    }

    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedRating(0);
    setReviewText('');
  };

  const handleSubmitReview = async () => {
    if (selectedRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    try {
      setIsSubmittingReview(true);

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
          rating: selectedRating.toString(),
          review: reviewText.trim() || null,
        });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Your review has been submitted!');

      // Close modal and refresh
      handleCloseReviewModal();
      fetchFoodDetails();

    } catch (error) {
      logger.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
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

        {/* Header with Background */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />

          {/* Close Button - Top Right */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>

          {/* Header Actions - Share & Favorite */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={shareFood}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.neutral[600]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, favoriteLoading && styles.buttonDisabled]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite(foodId) ? 'heart' : 'heart-outline'}
                size={20}
                color={theme.colors.neutral[600]}
              />
            </TouchableOpacity>
          </View>
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
          {/* Processing Level Ribbon - Above hero image, transparent sides */}
          {food.nova_group && (
            <View style={styles.processingRibbonContainer}>
              <View style={[
                styles.processingRibbon,
                food.nova_group === 1 && styles.processingRibbonNova1,
                food.nova_group === 2 && styles.processingRibbonNova2,
                food.nova_group === 3 && styles.processingRibbonNova3,
              ]}>
                <Text style={[
                  styles.processingRibbonLabel,
                  food.nova_group === 1 && styles.processingRibbonTextNova1,
                  food.nova_group === 2 && styles.processingRibbonTextNova2,
                  food.nova_group === 3 && styles.processingRibbonTextNova3,
                ]}>
                  {food.nova_group === 1 ? 'Whole Food' : food.nova_group === 2 ? 'Extracted Foods' : 'Lightly Processed'}
                </Text>
                <Text style={[
                  styles.processingRibbonNova,
                  food.nova_group === 1 && styles.processingRibbonTextNova1,
                  food.nova_group === 2 && styles.processingRibbonTextNova2,
                  food.nova_group === 3 && styles.processingRibbonTextNova3,
                ]}>
                  Nova {food.nova_group}
                </Text>
              </View>
            </View>
          )}

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

            {/* Static Sections - Full Width with Top Margin */}
            <View style={styles.staticSectionsContainer}>
              {/* Ingredients Section */}
              <View style={styles.staticSection}>
                <Text style={styles.sectionTitleText}>Ingredients</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.ingredientsText}>
                    {food.ingredients || food.description || 'No ingredients information available'}
                  </Text>
                </View>
              </View>

              {/* Nutrition Section */}
              {food.nutrition && (
                <View style={styles.staticSection}>
                  <Text style={styles.sectionTitleText}>Nutrition Facts</Text>
                  <View style={styles.nutritionList}>
                    {food.nutrition.calories != null && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                        <Text style={styles.nutritionValue}>{`${food.nutrition.calories}`}</Text>
                      </View>
                    )}
                    {food.nutrition.fat != null && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                        <Text style={styles.nutritionValue}>{`${food.nutrition.fat}g`}</Text>
                      </View>
                    )}
                    {food.nutrition.carbs != null && (
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                        <Text style={styles.nutritionValue}>{`${food.nutrition.carbs}g`}</Text>
                      </View>
                    )}
                    {food.nutrition.protein != null && (
                      <View style={[styles.nutritionRow, styles.nutritionRowLast]}>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                        <Text style={styles.nutritionValue}>{`${food.nutrition.protein}g`}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Reviews Section - Redesigned matching Figma */}
              <View ref={reviewSectionRef} style={styles.staticSection}>
                <Text style={styles.sectionTitleText}>Ratings</Text>

                {/* No Reviews State */}
                {(!food.ratings || food.ratings.length === 0) && (
                  <View style={styles.noReviewsContainer}>
                    <View style={styles.noReviewsContent}>
                      <Text style={styles.avocadoEmoji}>🥑</Text>
                      <Text style={styles.noReviewsText}>No Reviews</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.writeReviewBtn}
                      onPress={handleOpenReviewModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.writeReviewBtnText}>Write a review</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Has Reviews State */}
                {food.ratings && food.ratings.length > 0 && (
                  <View style={styles.reviewsContainer}>
                    {/* Write a Review Button */}
                    <TouchableOpacity
                      style={styles.writeReviewBtn}
                      onPress={handleOpenReviewModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.writeReviewBtnText}>Write a review</Text>
                    </TouchableOpacity>

                    {/* Rating Summary */}
                    <View style={styles.ratingSummaryRow}>
                      {/* Left Column: Average Rating */}
                      <View style={styles.averageRatingColumn}>
                        <Text style={styles.averageRatingNumber}>
                          {food.average_rating ? food.average_rating.toFixed(1) : '0.0'}
                        </Text>
                        <View style={styles.starsContainerSmall}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name="star"
                              size={9}
                              color={star <= Math.round(food.average_rating || 0) ? "#FFA500" : "#E5E5E5"}
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewCountText}>
                          {food.ratings_count || 0} review{(food.ratings_count !== 1) ? 's' : ''}
                        </Text>
                      </View>

                      {/* Right Column: Rating Distribution Bars */}
                      <View style={styles.ratingBarsColumn}>
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = food.ratings?.filter(r => parseInt(r.rating) === rating).length || 0;
                          const percentage = food.ratings_count ? (count / food.ratings_count) * 100 : 0;

                          return (
                            <View key={rating} style={styles.ratingBarRow}>
                              <Text style={styles.ratingBarLabel}>{rating}</Text>
                              <Ionicons name="star" size={11} color="#FFA500" />
                              <View style={styles.ratingBarBackground}>
                                {percentage > 0 && (
                                  <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Review Cards */}
                    <View style={styles.reviewsList}>
                      {food.ratings.slice(0, 2).map((rating, index) => (
                        <View key={rating.id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.reviewerAvatar}>
                              {rating.avatar_url ? (
                                <Image source={{ uri: rating.avatar_url }} style={styles.avatarImage} />
                              ) : (
                                <Ionicons name="person" size={20} color={theme.colors.neutral[400]} />
                              )}
                            </View>
                            <View style={styles.reviewerDetails}>
                              <Text style={styles.reviewerName}>{rating.username || 'Anonymous'}</Text>
                              <View style={styles.reviewMeta}>
                                <View style={styles.reviewStars}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name="star"
                                      size={16}
                                      color={star <= parseInt(rating.rating) ? "#FFA500" : "#E5E5E5"}
                                    />
                                  ))}
                                </View>
                                <Text style={styles.reviewDate}>3 days ago</Text>
                              </View>
                            </View>
                          </View>
                          {rating.review && (
                            <Text style={styles.reviewText}>{rating.review}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Similar Foods Section */}
            <View style={styles.similarFoodsWrapper}>
              <SimilarFoodsSection
                currentFoodId={foodId}
                aisleId={food.aisle?.id}
                onFoodPress={(foodId) => navigation.push('FoodDetail', { foodId })}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavoriteHook}
              />
            </View>

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

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseReviewModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseReviewModal}
          />
          <View style={styles.reviewModalContent}>
            {/* Modal Header */}
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={handleCloseReviewModal} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color={theme.colors.neutral[800]} />
              </TouchableOpacity>
            </View>

            {/* Star Rating Picker */}
            <View style={styles.starPickerContainer}>
              <Text style={styles.starPickerLabel}>Your Rating *</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedRating(star)}
                    style={styles.starButton}
                    hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                  >
                    <Ionicons
                      name={star <= selectedRating ? "star" : "star-outline"}
                      size={40}
                      color={star <= selectedRating ? "#FFA500" : theme.colors.neutral[300]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {selectedRating > 0 && (
                <Text style={styles.selectedRatingText}>
                  {selectedRating} star{selectedRating === 1 ? '' : 's'}
                </Text>
              )}
            </View>

            {/* Review Text Input */}
            <View style={styles.reviewTextContainer}>
              <Text style={styles.reviewTextLabel}>Your Review (Optional)</Text>
              <TextInput
                style={styles.reviewTextInput}
                placeholder="Share your thoughts about this product..."
                placeholderTextColor={theme.colors.neutral[400]}
                multiline
                numberOfLines={4}
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{reviewText.length}/500</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.reviewModalActions}>
              <TouchableOpacity
                style={[styles.reviewModalButton, styles.reviewModalButtonPrimary]}
                onPress={handleSubmitReview}
                disabled={selectedRating === 0 || isSubmittingReview}
                activeOpacity={0.8}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.reviewModalButtonPrimaryText}>
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reviewModalButton, styles.reviewModalButtonSecondary]}
                onPress={handleCloseReviewModal}
                disabled={isSubmittingReview}
                activeOpacity={0.8}
              >
                <Text style={styles.reviewModalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: theme.colors.neutral[100], // Changed from white to neutral-100
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
    marginBottom: 0, // No margin - header is directly below
  },

  // Header Container
  header: {
    height: 64,
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8, // Space from drag handle
  },

  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.neutral[100],
    borderBottomWidth: 0, // No border - ribbon is directly below
    borderBottomColor: theme.colors.neutral[200],
  },

  // Close Button - Top Right
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA', // var(--Neutral-50)
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Subtle gradient effect (approximated with background color)
    shadowColor: 'rgba(212, 207, 181, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  // Header Actions - Share & Favorite (Top Left)
  headerActions: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },

  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA', // var(--Neutral-50)
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle gradient effect (approximated with background color)
    shadowColor: 'rgba(212, 207, 181, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
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
    height: 300, // 1.5x the original size (200 * 1.5 = 300)
    backgroundColor: theme.colors.neutral.white,
    position: 'relative',
    marginTop: 0, // Remove margin - ribbon is now above image
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: 24, // Reduced bottom padding
    paddingHorizontal: 24, // 24pt padding left and right
    gap: 0, // No gap - we control spacing manually
    backgroundColor: theme.colors.neutral.white,
  },

  // Hero Card - Full Width with horizontal padding for breathing room
  heroCard: {
    borderWidth: 0,
    backgroundColor: theme.colors.neutral.white,
    paddingTop: 24, // Generous top padding
    paddingBottom: 32, // Extra bottom padding for separation
    paddingHorizontal: 0, // No padding - handled by contentContainer
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

  // Processing Level Ribbon Container (scrolls with content, transparent sides)
  processingRibbonContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent so sides show through
    paddingTop: 0, // No top padding - closer to header
    paddingBottom: 8, // Bottom padding for visual breathing
  },

  // Processing Level Ribbon (below image, above content)
  processingRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 0.5,
    width: '80%', // 80% width instead of full width
  },

  processingRibbonNova1: {
    backgroundColor: '#C1FFD0', // Green-100 - Matching GridFoodCard
    borderColor: 'rgba(38, 115, 62, 0.2)', // Subtle dark green border
  },

  processingRibbonNova2: {
    backgroundColor: '#FFF9B3', // Richer yellow - Matching GridFoodCard
    borderColor: 'rgba(146, 141, 29, 0.2)', // Subtle dark yellow border
  },

  processingRibbonNova3: {
    backgroundColor: '#FFE4CC', // Warmer orange - Matching GridFoodCard
    borderColor: 'rgba(230, 99, 11, 0.2)', // Subtle dark orange border
  },

  processingRibbonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.45,
    fontFamily: 'System',
  },

  processingRibbonNova: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.42,
    fontFamily: 'System',
  },

  processingRibbonTextNova1: {
    color: '#26733E', // Dark green for contrast - Matching GridFoodCard
  },

  processingRibbonTextNova2: {
    color: '#928D1D', // Dark yellow/olive for contrast - Matching GridFoodCard
  },

  processingRibbonTextNova3: {
    color: '#E6630B', // Dark orange for contrast - Matching GridFoodCard
  },

  // Static Sections Container
  staticSectionsContainer: {
    marginTop: 0, // No extra margin - hero card handles it
    gap: 80, // 80px gap between sections for maximum breathing room
  },

  staticSection: {
    paddingHorizontal: 0, // No padding - handled by contentContainer
  },

  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.36,
    color: theme.colors.neutral[800],
    marginBottom: 20, // Increased from 16px to 20px for better hierarchy
    fontFamily: 'System',
  },

  sectionContent: {
    gap: theme.spacing.md,
  },

  ingredientsText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.15,
    color: theme.colors.neutral[600],
    fontFamily: 'System',
  },

  nutritionList: {
    gap: theme.spacing.md,
  },

  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },

  nutritionRowLast: {
    borderBottomWidth: 0,
  },

  nutritionLabel: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.15,
    color: theme.colors.neutral[900],
    fontFamily: 'System',
  },

  nutritionValue: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.15,
    color: theme.colors.neutral[900],
    fontFamily: 'System',
  },

  // Ratings Section Styles
  // No Reviews State Styles
  noReviewsContainer: {
    gap: 24,
    alignItems: 'center',
  },

  noReviewsContent: {
    gap: 8,
    alignItems: 'center',
  },

  avocadoEmoji: {
    fontSize: 60,
  },

  noReviewsText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.48,
    color: theme.colors.neutral[700],
    fontFamily: 'System',
  },

  // Write Review Button (matching Figma gradient design)
  writeReviewBtn: {
    height: 48,
    borderRadius: 1000,
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    backgroundColor: '#FAFAFA', // Base color, gradient applied via shadow
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    // Gradient effect simulated with shadow
    shadowColor: 'rgba(212, 207, 181, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },

  writeReviewBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.48,
    color: theme.colors.neutral[700],
    fontFamily: 'System',
  },

  // Reviews Container (has reviews state)
  reviewsContainer: {
    gap: 20, // 20px gap between button and summary
  },

  // Rating Summary Row (horizontal layout)
  ratingSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  ratingSummaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  averageRatingColumn: {
    alignItems: 'center',
    gap: 4,
  },

  averageRatingNumber: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.6,
    color: theme.colors.neutral[800],
    fontFamily: 'System',
  },

  starsContainer: {
    flexDirection: 'row',
    gap: 3,
  },

  starsContainerSmall: {
    flexDirection: 'row',
    gap: 3,
  },

  reviewCountText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.neutral[500],
    fontFamily: 'System',
  },

  ratingBarsColumn: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },

  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.neutral[950],
    fontFamily: 'System',
    width: 12,
  },

  ratingBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 32,
    overflow: 'hidden',
  },

  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 32,
  },

  reviewsList: {
    gap: 8,
  },

  reviewCard: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: theme.colors.neutral[200],
    padding: 16,
    gap: 8,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  reviewerInfo: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },

  reviewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  reviewerDetails: {
    flex: 1,
    gap: 4,
  },

  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.45,
    color: theme.colors.neutral[800],
    fontFamily: 'System',
  },

  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reviewStars: {
    flexDirection: 'row',
    gap: 4,
  },

  reviewDate: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.neutral[500],
    fontFamily: 'System',
  },

  reviewText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
    letterSpacing: -0.15,
    color: theme.colors.neutral[500],
    fontFamily: 'System',
  },

  // Similar Foods Wrapper - Add spacing before submitter
  similarFoodsWrapper: {
    marginTop: 80, // Same as section spacing for consistency
  },

  // Submitter Container - At bottom of page
  submitterContainer: {
    paddingHorizontal: 0, // No padding - handled by contentContainer
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

  // Review Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  reviewModalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 24,
  },

  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reviewModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
    color: theme.colors.neutral[800],
    fontFamily: 'System',
  },

  closeModalButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  starPickerContainer: {
    gap: 12,
    alignItems: 'center',
  },

  starPickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[800],
    fontFamily: 'System',
  },

  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },

  starButton: {
    padding: 4,
  },

  selectedRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.neutral[600],
    fontFamily: 'System',
  },

  reviewTextContainer: {
    gap: 8,
  },

  reviewTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[800],
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  reviewTextInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: 'System',
    color: theme.colors.neutral[800],
    minHeight: 100,
    backgroundColor: theme.colors.neutral.white,
  },

  characterCount: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    textAlign: 'right',
    fontFamily: 'System',
  },

  reviewModalActions: {
    gap: 12,
  },

  reviewModalButton: {
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  reviewModalButtonPrimary: {
    backgroundColor: theme.colors.green[500],
  },

  reviewModalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.neutral.white,
    fontFamily: 'System',
  },

  reviewModalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },

  reviewModalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    fontFamily: 'System',
  },
});