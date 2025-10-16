import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { FilterChip } from './FilterChip';
import { BottomSheetModal } from './BottomSheetModal';
import { getProcessingLevel, ProcessingLevelType } from '../../utils/processingLevel';
export interface FilterState {
  processingLevels: ProcessingLevelType[];
  supermarketIds: string[];
}

interface FilterBarProps {
  activeFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableSupermarkets: string[];
  totalCount: number;
  filteredCount: number;
  categoryChip?: React.ReactNode;
}

/**
 * Filter bar with two bottom sheet modals
 * - Food Group: Processing levels (Whole Food, Whole Food+, Lightly Processed)
 * - Supermarket: Supermarkets from database
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilters,
  onFiltersChange,
  availableSupermarkets,
  totalCount,
  filteredCount,
  categoryChip,
}) => {
  const [foodGroupModalVisible, setFoodGroupModalVisible] = useState(false);
  const [supermarketModalVisible, setSupermarketModalVisible] = useState(false);

  const processingLevels: Array<{
    type: ProcessingLevelType;
    label: string;
    description: string;
    icon: any;
  }> = [
    {
      type: 'wholeFood',
      label: 'Whole Food',
      description: 'Natural and unprocessed',
      icon: 'leaf',
    },
    {
      type: 'extractedFoods',
      label: 'Extracted Foods',
      description: 'Single ingredient',
      icon: 'restaurant',
    },
    {
      type: 'lightlyProcessed',
      label: 'Lightly Processed',
      description: 'Few added ingredients',
      icon: 'warning-outline',
    },
  ];

  const toggleProcessingLevel = (level: ProcessingLevelType) => {
    const current = activeFilters.processingLevels;
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];

    onFiltersChange({
      ...activeFilters,
      processingLevels: updated,
    });
  };

  const toggleSupermarket = (supermarketId: string) => {
    const current = activeFilters.supermarketIds;
    const updated = current.includes(supermarketId)
      ? current.filter(id => id !== supermarketId)
      : [...current, supermarketId];

    onFiltersChange({
      ...activeFilters,
      supermarketIds: updated,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      processingLevels: [],
      supermarketIds: [],
    });
  };

  const clearFoodGroupFilters = () => {
    onFiltersChange({
      ...activeFilters,
      processingLevels: [],
    });
    setFoodGroupModalVisible(false);
  };

  const clearSupermarketFilters = () => {
    onFiltersChange({
      ...activeFilters,
      supermarketIds: [],
    });
    setSupermarketModalVisible(false);
  };

  const totalActiveFilters =
    activeFilters.processingLevels.length + activeFilters.supermarketIds.length;

  const hasActiveFilters = totalActiveFilters > 0;

  return (
    <View style={styles.container}>
      <View style={styles.chipsContainer}>
        {/* Category Chip (optional, passed from parent) */}
        {categoryChip}

        {/* Food Group Filter Chip */}
        <FilterChip
          label="Food Group"
          icon="nutrition"
          active={activeFilters.processingLevels.length > 0}
          count={activeFilters.processingLevels.length}
          onPress={() => setFoodGroupModalVisible(true)}
        />

        {/* Supermarket Filter Chip */}
        <FilterChip
          label="Supermarket"
          icon="storefront"
          active={activeFilters.supermarketIds.length > 0}
          count={activeFilters.supermarketIds.length}
          onPress={() => setSupermarketModalVisible(true)}
        />

        {/* Clear All Button */}
        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results counter */}
      {hasActiveFilters && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            Showing {filteredCount} of {totalCount} foods
          </Text>
        </View>
      )}

      {/* Food Group Bottom Sheet */}
      <BottomSheetModal
        visible={foodGroupModalVisible}
        onClose={() => setFoodGroupModalVisible(false)}
        title="Filter by Food Group"
        footerButtons={[
          {
            label: 'Clear',
            onPress: clearFoodGroupFilters,
            variant: 'secondary',
          },
          {
            label: `Done (${activeFilters.processingLevels.length})`,
            onPress: () => setFoodGroupModalVisible(false),
            variant: 'primary',
          },
        ]}
      >
        <View style={styles.modalContent}>
          {processingLevels.map(level => {
            const isActive = activeFilters.processingLevels.includes(level.type);
            return (
              <TouchableOpacity
                key={level.type}
                style={styles.modalItem}
                onPress={() => toggleProcessingLevel(level.type)}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isActive
                          ? theme.colors.processing[level.type].light
                          : theme.colors.neutral[100],
                      },
                    ]}
                  >
                    <Ionicons
                      name={level.icon}
                      size={20}
                      color={
                        isActive
                          ? theme.colors.processing[level.type].color
                          : theme.colors.text.secondary
                      }
                    />
                  </View>
                  <View style={styles.modalItemTextContainer}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isActive && styles.modalItemTextActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text style={styles.modalItemDescription}>
                      {level.description}
                    </Text>
                  </View>
                </View>
                {isActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.green[600]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetModal>

      {/* Supermarket Bottom Sheet */}
      <BottomSheetModal
        visible={supermarketModalVisible}
        onClose={() => setSupermarketModalVisible(false)}
        title="Filter by Supermarket"
        footerButtons={[
          {
            label: 'Clear',
            onPress: clearSupermarketFilters,
            variant: 'secondary',
          },
          {
            label: `Done (${activeFilters.supermarketIds.length})`,
            onPress: () => setSupermarketModalVisible(false),
            variant: 'primary',
          },
        ]}
      >
        <View style={styles.modalContent}>
          {availableSupermarkets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="storefront-outline"
                size={48}
                color={theme.colors.text.tertiary}
              />
              <Text style={styles.emptyText}>No supermarkets available</Text>
            </View>
          ) : (
            availableSupermarkets.map(supermarket => {
              const isActive = activeFilters.supermarketIds.includes(supermarket);
              return (
                <TouchableOpacity
                  key={supermarket}
                  style={styles.modalItem}
                  onPress={() => toggleSupermarket(supermarket)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="storefront"
                        size={20}
                        color={
                          isActive
                            ? theme.colors.green[600]
                            : theme.colors.text.secondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.modalItemText,
                        isActive && styles.modalItemTextActive,
                      ]}
                    >
                      {supermarket}
                    </Text>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.green[600]}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },

  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1.5,
    borderColor: theme.colors.neutral[200],
  },

  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: 4,
    fontFamily: 'System',
  },

  resultsBar: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },

  resultsText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Modal Content Styles
  modalContent: {
    paddingVertical: theme.spacing.xs,
  },

  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },

  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  modalItemTextContainer: {
    flex: 1,
  },

  modalItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },

  modalItemTextActive: {
    fontWeight: '600',
    color: theme.colors.green[950],
  },

  modalItemDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontFamily: 'System',
  },

  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },
});
