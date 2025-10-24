import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface CollapsibleSectionProps {
  icon: ImageSourcePropType;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

/**
 * Collapsible Section Component
 * Used for sections like Ingredients, Nutrition, Reviews in Food Detail Screen
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultExpanded = true,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Image source={icon} style={styles.icon} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#737373"
        />
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#EBEAE4',
    width: '100%',
    marginTop: 8, // 8px margin between sections
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.6,
    color: '#262626',
  },

  content: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
});
