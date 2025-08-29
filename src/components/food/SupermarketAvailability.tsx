import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FoodSupermarket } from '../../types';
import { SectionHeader } from '../common/SectionHeader';

interface SupermarketAvailabilityProps {
  supermarkets?: FoodSupermarket[];
}

interface SupermarketCardProps {
  foodSupermarket: FoodSupermarket;
}

const SupermarketCard: React.FC<SupermarketCardProps> = ({ foodSupermarket }) => {
  const { supermarket, available, price } = foodSupermarket;
  
  if (!supermarket) return null;

  const formatPrice = (price?: number): string => {
    if (!price) return 'Price not available';
    return `$${price.toFixed(2)}`;
  };

  return (
    <TouchableOpacity style={[
      styles.supermarketCard,
      !available && styles.unavailableCard
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.supermarketInfo}>
          {supermarket.logo ? (
            <Image 
              source={{ uri: supermarket.logo }} 
              style={styles.supermarketLogo}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={24} color={theme.colors.text.hint} />
            </View>
          )}
          <View style={styles.supermarketDetails}>
            <Text style={styles.supermarketName}>{supermarket.name}</Text>
            <View style={styles.availabilityRow}>
              <Ionicons 
                name={available ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={available ? theme.colors.success : theme.colors.error} 
              />
              <Text style={[
                styles.availabilityText,
                { color: available ? theme.colors.success : theme.colors.error }
              ]}>
                {available ? 'Available' : 'Out of stock'}
              </Text>
            </View>
          </View>
        </View>
        
        {available && price && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{formatPrice(price)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const SupermarketAvailability: React.FC<SupermarketAvailabilityProps> = ({ 
  supermarkets 
}) => {
  if (!supermarkets || supermarkets.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader 
          title="Store Availability" 
          icon="storefront-outline"
        />
        <View style={styles.noDataContainer}>
          <Ionicons name="storefront-outline" size={32} color={theme.colors.text.hint} />
          <Text style={styles.noDataText}>Store availability not tracked</Text>
        </View>
      </View>
    );
  }

  const availableStores = supermarkets.filter(s => s.available).length;
  const totalStores = supermarkets.length;

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Store Availability" 
        icon="storefront-outline"
        subtitle={`Available in ${availableStores} of ${totalStores} stores`}
      />
      
      <View style={styles.supermarketsContainer}>
        {supermarkets.map((foodSupermarket) => (
          <SupermarketCard 
            key={foodSupermarket.id} 
            foodSupermarket={foodSupermarket} 
          />
        ))}
      </View>
      
      {availableStores > 0 && (
        <TouchableOpacity style={styles.findStoreButton}>
          <Ionicons name="map-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.findStoreText}>Find nearest store</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },

  noDataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },

  noDataText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },

  supermarketsContainer: {
    gap: theme.spacing.md,
  },

  supermarketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.background,
  },

  unavailableCard: {
    opacity: 0.7,
    backgroundColor: theme.colors.background,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  supermarketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  supermarketLogo: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },

  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  supermarketDetails: {
    flex: 1,
  },

  supermarketName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  availabilityText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },

  priceContainer: {
    alignItems: 'flex-end',
  },

  priceText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  findStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  findStoreText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});