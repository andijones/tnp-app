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
  const cardSpacing = theme.spacing.md;
  const cardWidth = (screenWidth - (cardSpacing * 3)) / 2; // 2 columns with spacing

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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  
  row: {
    justifyContent: 'space-between',
  },
  
  cardContainer: {
    marginBottom: theme.spacing.md,
  },
});