import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { APP_INFO, DEEP_LINKS } from '../../constants';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [useMetric, setUseMetric] = useState(false); // Default to Imperial
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('Calculating...');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.email) {
                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: DEEP_LINKS.authCallback,
                });
                if (error) {
                  Alert.alert('Error', error.message);
                } else {
                  Alert.alert('Success', 'Password reset link sent to your email');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send reset link');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (isDeleting) return; // Prevent multiple calls

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data, contributions, and reviews will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      console.log('Initiating account deletion...');

                      // Get the current session to use the access token
                      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                      if (sessionError || !session) {
                        throw new Error('Not authenticated');
                      }

                      // Call the delete-account edge function
                      const { data, error } = await supabase.functions.invoke('delete-account', {
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      });

                      if (error) {
                        console.error('Account deletion error:', error);
                        throw new Error(error.message || 'Failed to delete account');
                      }

                      console.log('Account deletion response:', data);

                      // Sign out the user (session should already be invalidated)
                      await supabase.auth.signOut();

                      // Show success message
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted. We\'re sorry to see you go!',
                        [{ text: 'OK' }]
                      );

                      // Navigation will automatically redirect to auth screen after sign out
                    } catch (error) {
                      console.error('Account deletion failed:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
                      Alert.alert(
                        'Deletion Failed',
                        `Unable to delete your account: ${errorMessage}. Please try again or contact support.`,
                        [{ text: 'OK' }]
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Calculate cache size on component mount
  useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        setCacheSize('Unknown');
        return;
      }

      // Get all files in cache directory
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;

      // Calculate total size of all cached files
      for (const file of files) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          console.warn(`Could not get info for file: ${file}`, error);
        }
      }

      // Format size in human-readable format
      const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      setCacheSize(formatSize(totalSize));
    } catch (error) {
      console.error('Error calculating cache size:', error);
      setCacheSize('Unknown');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      `This will clear approximately ${cacheSize} of cached images. The app may take longer to load images temporarily.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            setIsClearing(true);
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (!cacheDir) {
                throw new Error('Cache directory not available');
              }

              // Get all files in cache directory
              const files = await FileSystem.readDirectoryAsync(cacheDir);
              let deletedCount = 0;
              let failedCount = 0;

              // Delete each file
              for (const file of files) {
                try {
                  const filePath = `${cacheDir}${file}`;
                  const fileInfo = await FileSystem.getInfoAsync(filePath);

                  // Only delete files (not directories)
                  if (fileInfo.exists && !fileInfo.isDirectory) {
                    await FileSystem.deleteAsync(filePath, { idempotent: true });
                    deletedCount++;
                  }
                } catch (error) {
                  console.warn(`Failed to delete file: ${file}`, error);
                  failedCount++;
                }
              }

              // Recalculate cache size
              await calculateCacheSize();

              // Show success message
              const message = failedCount > 0
                ? `Cache cleared! Deleted ${deletedCount} files. ${failedCount} files could not be deleted.`
                : `Cache cleared successfully! Deleted ${deletedCount} files.`;

              Alert.alert('Success', message);
            } catch (error) {
              console.error('Error clearing cache:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert(
                'Error',
                `Failed to clear cache: ${errorMessage}. Please try again.`
              );
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleReportBug = () => {
    Linking.openURL(`mailto:${APP_INFO.supportEmail}?subject=Bug Report`);
  };

  const handleRequestFeature = () => {
    Linking.openURL(`mailto:${APP_INFO.supportEmail}?subject=Feature Request`);
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_INFO.supportEmail}?subject=Support Request`);
  };

  const handleTermsOfService = () => {
    // TODO: Add actual terms of service URL
    Alert.alert('Terms of Service', 'Terms of Service page coming soon');
  };

  const handlePrivacyPolicy = () => {
    // TODO: Add actual privacy policy URL
    Alert.alert('Privacy Policy', 'Privacy Policy page coming soon');
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="scale-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Metric Units</Text>
            </View>
            <Switch
              value={useMetric}
              onValueChange={setUseMetric}
              trackColor={{ false: theme.colors.neutral[300], true: theme.colors.green[500] }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA & STORAGE</Text>

          <TouchableOpacity
            style={[styles.settingRow, isClearing && styles.disabledRow]}
            onPress={handleClearCache}
            activeOpacity={0.7}
            disabled={isClearing}
            accessible={true}
            accessibilityLabel={`Clear image cache, current size ${cacheSize}`}
            accessibilityRole="button"
            accessibilityHint="Double tap to clear cached images"
            accessibilityState={{ disabled: isClearing, busy: isClearing }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.text.secondary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>
                  {isClearing ? 'Clearing Cache...' : 'Clear Image Cache'}
                </Text>
                <Text style={styles.cacheSize}>{cacheSize}</Text>
              </View>
            </View>
            {isClearing ? (
              <ActivityIndicator size="small" color={theme.colors.text.secondary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Support & Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT & FEEDBACK</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleReportBug}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="bug-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Report a Bug</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleRequestFeature}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Request a Feature</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>App Version</Text>
            </View>
            <Text style={styles.versionText}>{appVersion}</Text>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleTermsOfService}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>DANGER ZONE</Text>

          <TouchableOpacity
            style={[styles.settingRow, styles.dangerRow, isDeleting && styles.disabledRow]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={isDeleting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.settingText, styles.dangerText]}>
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </View>
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },

  backButton: {
    padding: 4,
    marginRight: theme.spacing.sm,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#0A0A0A',
    letterSpacing: -0.44,
    flex: 1,
    textAlign: 'center',
  },

  headerRight: {
    width: 32,
  },

  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.neutral[500],
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.neutral[200],
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  settingTextContainer: {
    flex: 1,
  },

  settingText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
    letterSpacing: -0.32,
  },

  cacheSize: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },

  versionText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },

  // Danger Zone
  dangerTitle: {
    color: theme.colors.error,
  },

  dangerRow: {
    borderBottomColor: theme.colors.error + '30',
  },

  dangerText: {
    color: theme.colors.error,
  },

  disabledRow: {
    opacity: 0.5,
  },

  bottomSpacer: {
    height: 100,
  },
});
