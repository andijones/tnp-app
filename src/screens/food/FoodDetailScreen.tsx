import React, { useEffect, useState } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

export const FoodDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState<Food | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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

      setFood(foodData);
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          {/* Title & NOVA Badge */}
          <View style={styles.titleSection}>
            <View style={styles.titleContent}>
              <Text style={styles.foodName}>{food.name}</Text>
              {food.nova_group && (
                <View style={styles.novaBadgeContainer}>
                  <NovaBadge novaGroup={food.nova_group} size="large" showLabel />
                </View>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <IconBadge
              icon="storefront-outline"
              label="Available"
              value="15 stores"
              onPress={() => Alert.alert('Store Locator', 'Coming soon!')}
            />
            <IconBadge
              icon="star-outline"
              label="Rating"
              value="4.2"
              onPress={() => Alert.alert('Reviews', 'Coming soon!')}
            />
            <IconBadge
              icon="information-circle-outline"
              label="More Info"
              onPress={() => Alert.alert('Nutrition Facts', 'Coming soon!')}
            />
          </View>

          {/* Ingredients Section */}
          {food.description && (
            <View style={styles.section}>
              <SectionHeader 
                title="Ingredients" 
                icon="list-outline"
                subtitle="What's inside this product"
              />
              <View style={styles.ingredientsContainer}>
                <Text style={styles.ingredientsText}>{food.description}</Text>
              </View>
            </View>
          )}

          {/* Health Score Section */}
          <View style={styles.section}>
            <SectionHeader 
              title="Health Assessment" 
              icon="fitness-outline"
              subtitle="Based on processing level"
            />
            <View style={styles.healthScore}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreNumber}>
                  {food.nova_group ? (5 - food.nova_group) * 25 : 'N/A'}
                </Text>
                <Text style={styles.scoreLabel}>Health Score</Text>
              </View>
              <View style={styles.scoreDescription}>
                <Text style={styles.scoreDescriptionText}>
                  {food.nova_group === 1 && "Excellent choice! This is a minimally processed, whole food."}
                  {food.nova_group === 2 && "Good choice! This contains natural culinary ingredients."}
                  {food.nova_group === 3 && "Moderate processing. Consider frequency of consumption."}
                  {food.nova_group === 4 && "Ultra-processed. Best consumed occasionally."}
                  {!food.nova_group && "Processing level not yet determined."}
                </Text>
              </View>
            </View>
          </View>

          {/* Warnings Section (if applicable) */}
          {food.nova_group && food.nova_group >= 3 && (
            <View style={styles.section}>
              <SectionHeader 
                title="Things to Consider" 
                icon="warning-outline"
              />
              <View style={styles.warningContainer}>
                <View style={styles.warningItem}>
                  <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} />
                  <Text style={styles.warningText}>
                    {food.nova_group === 3 
                      ? "Contains added ingredients for preservation or flavor" 
                      : "Highly processed with multiple industrial ingredients"
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Submission Info */}
          <View style={styles.section}>
            <SectionHeader 
              title="Product Info" 
              icon="document-text-outline"
            />
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Added</Text>
                <Text style={styles.metaValue}>
                  {new Date(food.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[
                  styles.metaValue, 
                  { color: food.status === 'approved' ? theme.colors.success : theme.colors.warning }
                ]}>
                  {food.status.charAt(0).toUpperCase() + food.status.slice(1)}
                </Text>
              </View>
            </View>
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
    resizeMode: 'cover',
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
    marginBottom: theme.spacing.xl,
  },
  
  titleContent: {
    alignItems: 'flex-start',
  },
  
  foodName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    lineHeight: 36,
  },
  
  novaBadgeContainer: {
    alignSelf: 'flex-start',
  },
  
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  
  section: {
    marginBottom: theme.spacing.xl,
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
  
  healthScore: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  
  scoreContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  
  scoreNumber: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  scoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  
  scoreDescription: {
    flex: 1,
  },
  
  scoreDescriptionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  
  warningContainer: {
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  warningText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 22,
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