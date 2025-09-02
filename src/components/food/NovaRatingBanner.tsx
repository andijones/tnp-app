import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface NovaRatingBannerProps {
  novaGroup?: number;
}

const getNovaInfo = (novaGroup: number) => {
  switch (novaGroup) {
    case 1:
      return {
        label: 'Unprocessed or Minimally Processed',
        description: 'Natural foods with no or minimal processing',
        color: '#34C759', // iOS green
        backgroundColor: '#E8F5E8',
        icon: 'leaf' as const,
        iconColor: '#34C759',
      };
    case 2:
      return {
        label: 'Processed Culinary Ingredients',
        description: 'Ingredients extracted from natural foods',
        color: '#32D74B', // iOS mint
        backgroundColor: '#E8F8E8',
        icon: 'restaurant' as const,
        iconColor: '#32D74B',
      };
    case 3:
      return {
        label: 'Processed Foods',
        description: 'Foods with added salt, sugar, or other ingredients',
        color: '#FF9F0A', // iOS orange
        backgroundColor: '#FFF4E6',
        icon: 'warning' as const,
        iconColor: '#FF9F0A',
      };
    case 4:
      return {
        label: 'Ultra-Processed Foods',
        description: 'Industrial formulations with multiple additives',
        color: '#FF3B30', // iOS red
        backgroundColor: '#FFE6E6',
        icon: 'alert-circle' as const,
        iconColor: '#FF3B30',
      };
    default:
      return {
        label: 'Processing Level Unknown',
        description: 'NOVA classification not available',
        color: '#8E8E93', // iOS gray
        backgroundColor: '#F2F2F7',
        icon: 'help-circle' as const,
        iconColor: '#8E8E93',
      };
  }
};

export const NovaRatingBanner: React.FC<NovaRatingBannerProps> = ({ novaGroup }) => {
  if (!novaGroup) {
    return null;
  }

  const novaInfo = getNovaInfo(novaGroup);

  return (
    <View style={[styles.container, { backgroundColor: novaInfo.backgroundColor }]}>
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: novaInfo.color }]}>
            <Ionicons 
              name={novaInfo.icon} 
              size={20} 
              color="white" 
            />
          </View>
          <View style={styles.textContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.novaGroupText, { color: novaInfo.color }]}>
                NOVA {novaGroup}
              </Text>
            </View>
            <Text style={[styles.labelText, { color: novaInfo.color }]}>
              {novaInfo.label}
            </Text>
            <Text style={styles.descriptionText}>
              {novaInfo.description}
            </Text>
          </View>
        </View>
        
        {/* Health indicator */}
        <View style={styles.rightContent}>
          <View style={[styles.scoreCircle, { borderColor: novaInfo.color }]}>
            <Text style={[styles.scoreText, { color: novaInfo.color }]}>
              {novaGroup}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: -20, // Overlap with hero image
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  textContent: {
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },

  novaGroupText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  labelText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },

  descriptionText: {
    fontSize: 15,
    color: '#6D6D70', // iOS secondary text
    lineHeight: 18,
  },

  rightContent: {
    marginLeft: 16,
  },

  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },

  scoreText: {
    fontSize: 17,
    fontWeight: '700',
  },
});