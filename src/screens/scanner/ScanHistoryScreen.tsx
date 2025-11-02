import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { getScanHistory, clearScanHistory, removeScanFromHistory, ScanHistoryItem } from '../../services/scanHistoryService';

export const ScanHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setIsLoading(true);
    const scanHistory = await getScanHistory();
    setHistory(scanHistory);
    setIsLoading(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const handleRemoveItem = (scanId: string) => {
    Alert.alert(
      'Remove Scan',
      'Remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeScanFromHistory(scanId);
            await loadHistory();
          },
        },
      ]
    );
  };

  const getProcessingLevelColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1: return '#C1FFD0';
      case 2: return '#FFF9B3';
      case 3: return '#FFE4CC';
      case 4: return '#FFD4D4';
      default: return '#F5F5F5';
    }
  };

  const getProcessingLevelIcon = (novaGroup?: number): keyof typeof Ionicons.glyphMap => {
    switch (novaGroup) {
      case 1: return 'leaf';
      case 2: return 'water';
      case 3: return 'restaurant';
      case 4: return 'warning';
      default: return 'help-circle';
    }
  };

  const getProcessingLevelIconColor = (novaGroup?: number): string => {
    switch (novaGroup) {
      case 1: return '#26733E';
      case 2: return '#928D1D';
      case 3: return '#E6630B';
      case 4: return '#DC2626';
      default: return '#737373';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <View style={styles.historyCard}>
      {/* Image Container with Processing Badge */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="nutrition-outline" size={40} color={theme.colors.text.tertiary} />
          </View>
        )}

        {/* Processing Level Badge */}
        {item.novaGroup && (
          <View
            style={[
              styles.processingBadge,
              { backgroundColor: getProcessingLevelColor(item.novaGroup) }
            ]}
          >
            <Ionicons
              name={getProcessingLevelIcon(item.novaGroup)}
              size={16}
              color={getProcessingLevelIconColor(item.novaGroup)}
            />
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.productName}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.scanTypeTag}>
            <Ionicons
              name={item.scanType === 'barcode' ? 'barcode-outline' : 'scan-outline'}
              size={12}
              color={theme.colors.green[950]}
            />
            <Text style={styles.scanTypeText}>
              {item.scanType === 'barcode' ? 'Barcode' : 'OCR'}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={24} color={theme.colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {history.length === 0 && <View style={{ width: 70 }} />}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Scan History</Text>
          <Text style={styles.emptySubtitle}>
            Your scanned products will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.neutral[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#E5E5E5',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: theme.colors.neutral[100],
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 26,
    height: 26,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.45,
    color: theme.colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.green[50],
    borderRadius: 4,
  },
  scanTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.green[950],
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
