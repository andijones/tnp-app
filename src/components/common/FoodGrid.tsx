import React, { forwardRef } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import { Food } from '../../types';
import { GridFoodCard } from './GridFoodCard';
import { theme } from '../../theme';

interface FoodGridProps {
  foods: Food[];
  onFoodPress: (foodId: string) => void;
  isFavorite: (foodId: string) => boolean;
  onToggleFavorite: (foodId: string) => void;
  contentContainerStyle?: any;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const FoodGrid = forwardRef<FlatList, FoodGridProps>(({
  foods,
  onFoodPress,
  isFavorite,
  onToggleFavorite,
  contentContainerStyle,
  ListHeaderComponent,
  ListEmptyComponent,
  onRefresh,
  refreshing,
}, ref) => {
  const screenWidth = Dimensions.get('window').width;
  const horizontalSpacing = 16; // Horizontal padding on each side
  const columnGap = 12; // Gap between columns (slightly less than vertical for better proportion)
  const cardWidth = (screenWidth - (horizontalSpacing * 2) - columnGap) / 2; // 2 columns with spacing

  const renderFoodItem = ({ item }: { item: Food }) => (
    <View style={[styles.cardContainer, { width: cardWidth }]}>
      <GridFoodCard
        food={item}
        onPress={() => onFoodPress(item.id)}
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={onToggleFavorite}
      />
    </View>
  );

  return (
    <FlatList
      ref={ref}
      data={foods}
      renderItem={renderFoodItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.container, contentContainerStyle]}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16, // Consistent horizontal padding
    paddingTop: 16, // Top padding
    paddingBottom: 120, // Extra padding for floating tab bar
  },

  row: {
    justifyContent: 'space-between',
    gap: 12, // Explicit gap between columns for better control
  },

  cardContainer: {
    marginBottom: 24, // Increased to 24px for better vertical breathing room
  },
});