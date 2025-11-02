import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const SCAN_HISTORY_KEY = '@TNP:scan_history';
const MAX_HISTORY_ITEMS = 50; // Keep last 50 scans

export interface ScanHistoryItem {
  id: string;
  productName: string;
  barcode: string;
  novaGroup?: number;
  image?: string;
  timestamp: number;
  scanType: 'barcode' | 'ocr';
}

/**
 * Add a scan to the history
 */
export const addScanToHistory = async (item: Omit<ScanHistoryItem, 'id' | 'timestamp'>): Promise<void> => {
  try {
    // Get existing history
    const history = await getScanHistory();

    // Create new item with ID and timestamp
    const newItem: ScanHistoryItem = {
      ...item,
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to beginning of array (most recent first)
    const updatedHistory = [newItem, ...history];

    // Keep only MAX_HISTORY_ITEMS
    const trimmedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);

    // Save to AsyncStorage
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(trimmedHistory));

    logger.log('✅ Scan added to history:', newItem.productName);
  } catch (error) {
    logger.error('❌ Failed to add scan to history:', error);
  }
};

/**
 * Get scan history (most recent first)
 */
export const getScanHistory = async (): Promise<ScanHistoryItem[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(SCAN_HISTORY_KEY);

    if (!historyJson) {
      return [];
    }

    const history: ScanHistoryItem[] = JSON.parse(historyJson);
    return history;
  } catch (error) {
    logger.error('❌ Failed to get scan history:', error);
    return [];
  }
};

/**
 * Clear all scan history
 */
export const clearScanHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
    logger.log('✅ Scan history cleared');
  } catch (error) {
    logger.error('❌ Failed to clear scan history:', error);
  }
};

/**
 * Remove a specific scan from history
 */
export const removeScanFromHistory = async (scanId: string): Promise<void> => {
  try {
    const history = await getScanHistory();
    const updatedHistory = history.filter(item => item.id !== scanId);
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
    logger.log('✅ Scan removed from history:', scanId);
  } catch (error) {
    logger.error('❌ Failed to remove scan from history:', error);
  }
};

/**
 * Get scan history count
 */
export const getScanHistoryCount = async (): Promise<number> => {
  try {
    const history = await getScanHistory();
    return history.length;
  } catch (error) {
    logger.error('❌ Failed to get scan history count:', error);
    return 0;
  }
};
