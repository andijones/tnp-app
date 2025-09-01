import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Food } from '../../types';
import { SectionHeader } from '../common/SectionHeader';

interface ProductInfoSectionProps {
  food: Food;
}

interface InfoRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  if (!value) return null;

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={16} 
            color={theme.colors.text.secondary} 
            style={styles.infoIcon} 
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const extractBrandFromName = (name: string): string | undefined => {
  const brandPatterns = [
    /^([A-Za-z']+(?:\s+[A-Za-z']+)?)\s+/,
    /^(Dr\.?\s+[A-Za-z']+)/,
    /^(Uncle\s+[A-Za-z']+)/,
    /^(Aunt\s+[A-Za-z']+)/,
  ];

  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      const brand = match[1].trim();
      if (brand.length > 2 && brand.length < 20) {
        return brand;
      }
    }
  }
  return undefined;
};

const extractSizeFromName = (name: string): string | undefined => {
  const sizePatterns = [
    /(\d+(?:\.\d+)?(?:kg|g|ml|l|oz|lb|pack|x\d+))/i,
    /(\d+\s*x\s*\d+(?:g|ml|oz))/i,
  ];

  for (const pattern of sizePatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
};

const getCategoryDisplayName = (category?: string): string | undefined => {
  if (!category) return undefined;
  
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getNovaGroupDescription = (novaGroup?: number): string => {
  switch (novaGroup) {
    case 1:
      return 'Unprocessed or minimally processed foods';
    case 2:
      return 'Processed culinary ingredients';
    case 3:
      return 'Processed foods';
    case 4:
      return 'Ultra-processed food and drink products';
    default:
      return 'Processing level not determined';
  }
};

const getProcessingColor = (novaGroup?: number): string => {
  switch (novaGroup) {
    case 1:
      return theme.colors.success;
    case 2:
      return theme.colors.primary;
    case 3:
      return theme.colors.warning;
    case 4:
      return theme.colors.error;
    default:
      return theme.colors.text.hint;
  }
};

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({ food }) => {
  const brand = extractBrandFromName(food.name);
  const size = extractSizeFromName(food.name);
  const categoryDisplay = getCategoryDisplayName(food.category);
  const novaDescription = getNovaGroupDescription(food.nova_group);
  const processingColor = getProcessingColor(food.nova_group);

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Product Details" 
        icon="information-circle-outline"
        subtitle="Key product information"
      />
      
      <View style={styles.infoCard}>
        <InfoRow 
          label="Brand" 
          value={brand} 
          icon="business-outline"
        />
        
        <InfoRow 
          label="Aisle" 
          value={food.aisle?.name || categoryDisplay} 
          icon="storefront-outline"
        />
        
        <InfoRow 
          label="Size" 
          value={size} 
          icon="resize-outline"
        />

        {food.nova_group && (
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons 
                name="analytics-outline" 
                size={16} 
                color={theme.colors.text.secondary} 
                style={styles.infoIcon} 
              />
              <Text style={styles.infoLabelText}>Processing Level</Text>
            </View>
            <View style={styles.processingInfo}>
              <View style={[styles.processingDot, { backgroundColor: processingColor }]} />
              <Text style={styles.infoValue}>NOVA {food.nova_group}</Text>
            </View>
          </View>
        )}

        {food.nova_group && (
          <View style={styles.processingDescription}>
            <Text style={styles.processingDescriptionText}>
              {novaDescription}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <InfoRow 
          label="Status" 
          value={food.status.charAt(0).toUpperCase() + food.status.slice(1)} 
          icon="checkmark-circle-outline"
        />
        
        <InfoRow 
          label="Added" 
          value={new Date(food.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} 
          icon="calendar-outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },

  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  infoIcon: {
    marginRight: theme.spacing.sm,
  },

  infoLabelText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },

  processingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },

  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },

  processingDescription: {
    paddingTop: theme.spacing.sm,
    paddingLeft: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },

  processingDescriptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginVertical: theme.spacing.md,
  },
});