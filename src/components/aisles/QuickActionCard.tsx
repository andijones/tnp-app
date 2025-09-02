import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  gradient?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'secondary',
  gradient = false,
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.card, styles.primaryCard];
      case 'accent':
        return [styles.card, styles.accentCard];
      default:
        return [styles.card, styles.secondaryCard];
    }
  };

  const getTextColor = () => {
    return variant === 'primary' ? '#FFFFFF' : theme.colors.text.primary;
  };

  const getSubtextColor = () => {
    return variant === 'primary' ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary;
  };

  const getIconColor = () => {
    return variant === 'primary' ? '#FFFFFF' : theme.colors.primary;
  };

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getTextColor() }]}>
            {title}
          </Text>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={getIconColor()}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  primaryCard: {
    backgroundColor: theme.colors.primary,
  },

  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  accentCard: {
    backgroundColor: '#44DB6D',
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
  },

  chevronContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});