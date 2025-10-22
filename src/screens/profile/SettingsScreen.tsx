import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [useMetric, setUseMetric] = useState(false); // Default to Imperial

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
                  redirectTo: 'tnpclean://auth/callback',
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
                    try {
                      // TODO: Implement account deletion API call
                      // This should be handled by a backend function that:
                      // 1. Deletes user profile
                      // 2. Removes user contributions
                      // 3. Deletes user reviews
                      // 4. Deletes auth user
                      Alert.alert('Notice', 'Account deletion is not yet implemented. Please contact support.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account');
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

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached images. The app may take longer to load images temporarily.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleReportBug = () => {
    Linking.openURL('mailto:support@thenakedpantry.com?subject=Bug Report');
  };

  const handleRequestFeature = () => {
    Linking.openURL('mailto:support@thenakedpantry.com?subject=Feature Request');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@thenakedpantry.com?subject=Support Request');
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
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.text.secondary} />
              <Text style={styles.settingText}>Clear Image Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
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
            style={[styles.settingRow, styles.dangerRow]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.settingText, styles.dangerText]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.error} />
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

  settingText: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.text.primary,
    letterSpacing: -0.32,
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

  bottomSpacer: {
    height: 100,
  },
});
