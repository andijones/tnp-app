import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { ProfilePicture } from '../../components/common/ProfilePicture';
import { Input } from '../../components/common/Input';
import { GridFoodCard } from '../../components/common/GridFoodCard';
import { supabase } from '../../services/supabase/config';
import { useUser } from '../../hooks/useUser';
import { useFavorites } from '../../hooks/useFavorites';
import { Food } from '../../types';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const { user, profile, loading, error, updateProfile } = useUser();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    instagram: '',
    bio: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [userStats, setUserStats] = useState({
    totalFavorites: 0,
    totalReviews: 0,
    joinDate: '',
  });
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        instagram: profile.instagram || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  // Load favorite foods when user data is available
  useEffect(() => {
    if (user && favoriteIds && favoriteIds.length > 0) {
      loadFavoriteFoods();
    }
    if (user) {
      loadUserStats();
    }
  }, [user, favoriteIds]);

  const loadFavoriteFoods = async () => {
    if (!favoriteIds || favoriteIds.length === 0) return;

    setLoadingFavorites(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .in('id', favoriteIds.slice(0, 6)) // Show first 6 favorites
        .eq('status', 'approved');

      if (error) throw error;
      setFavoriteFoods(data || []);
    } catch (error) {
      console.error('Error loading favorite foods:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get total reviews count
      const { count: reviewsCount } = await supabase
        .from('ratings')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Get join date from user metadata
      const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      }) : '';

      setUserStats({
        totalFavorites: favoriteIds ? favoriteIds.length : 0,
        totalReviews: reviewsCount || 0,
        joinDate,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty strings to avoid overwriting with null values
      const updates = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );
      
      console.log('Attempting to save profile updates:', updates);
      await updateProfile(updates);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', `Failed to update profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        instagram: profile.instagram || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setEditing(false);
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Camera roll permission is required to change your profile picture.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        setFormData(prev => ({ ...prev, avatar_url: pickerResult.assets[0].uri }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };


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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture
                imageUrl={editing && formData.avatar_url ? formData.avatar_url : profile?.avatar_url}
                fullName={profile?.full_name}
                email={user?.email}
                size="large"
                style={styles.profilePicture}
              />
              {editing && (
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="camera-outline"
                    size={16}
                    color={theme.colors.background}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {profile?.full_name || 'Food Explorer'}
              </Text>
              {profile?.username && (
                <Text style={styles.userHandle}>@{profile.username}</Text>
              )}
              {userStats.joinDate && (
                <Text style={styles.joinDate}>
                  <Ionicons name="calendar-outline" size={12} color={theme.colors.text.tertiary} />
                  {' '}Joined {userStats.joinDate}
                </Text>
              )}
            </View>

            {!editing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Bio Section */}
          {profile?.bio && !editing && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {/* Social Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.totalFavorites}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.floor(Math.random() * 50) + 10}</Text>
              <Text style={styles.statLabel}>Discoveries</Text>
            </View>
          </View>
        </View>

        {/* Content Sections */}
        {editing ? (
          /* Edit Mode */
          <View style={styles.editingContainer}>
            <View style={styles.editSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              />

              <Input
                label="Bio"
                placeholder="Tell us about your food journey..."
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                multiline
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.sectionTitle}>Social</Text>
              <Input
                label="Username"
                placeholder="your_username"
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              />

              <Input
                label="Instagram"
                placeholder="your_instagram"
                value={formData.instagram}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instagram: text }))}
              />
            </View>

            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="tertiary"
                style={{ flex: 1, marginRight: theme.spacing.sm }}
              />
              <Button
                title={saving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                disabled={saving}
                variant="primary"
                style={{ flex: 2 }}
              />
            </View>
          </View>
        ) : (
          /* Display Mode - Social Content */
          <View style={styles.contentContainer}>
            {/* Favorite Foods Section */}
            {favoriteFoods.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart" size={20} color={theme.colors.error} />
                  <Text style={styles.sectionTitle}>Favorite Foods</Text>
                  <Text style={styles.sectionCount}>({userStats.totalFavorites})</Text>
                </View>

                {loadingFavorites ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.lg }} />
                ) : (
                  <View style={styles.favoritesGrid}>
                    {favoriteFoods.slice(0, 4).map((food) => (
                      <View key={food.id} style={styles.favoriteItem}>
                        <GridFoodCard
                          food={food}
                          onPress={() => {/* Navigate to food detail */}}
                          isFavorite={isFavorite(food.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {userStats.totalFavorites > 4 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View all {userStats.totalFavorites} favorites</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Activity/Achievements Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Food Journey</Text>
              </View>

              <View style={styles.achievementsList}>
                <View style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name="star" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>Food Explorer</Text>
                    <Text style={styles.achievementDesc}>Discovered healthy food choices</Text>
                  </View>
                </View>

                {userStats.totalReviews > 0 && (
                  <View style={styles.achievementItem}>
                    <View style={styles.achievementIcon}>
                      <Ionicons name="chatbubble" size={16} color={theme.colors.green[600]} />
                    </View>
                    <View style={styles.achievementContent}>
                      <Text style={styles.achievementTitle}>Community Contributor</Text>
                      <Text style={styles.achievementDesc}>Shared {userStats.totalReviews} helpful review{userStats.totalReviews !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                )}

                {userStats.totalFavorites >= 10 && (
                  <View style={styles.achievementItem}>
                    <View style={styles.achievementIcon}>
                      <Ionicons name="heart" size={16} color={theme.colors.error} />
                    </View>
                    <View style={styles.achievementContent}>
                      <Text style={styles.achievementTitle}>Food Enthusiast</Text>
                      <Text style={styles.achievementDesc}>Curated a collection of favorite foods</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Contact Info Card */}
            <View style={styles.sectionCard}>
              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.contactText}>{user?.email}</Text>
                </View>

                {profile?.instagram && (
                  <View style={styles.contactItem}>
                    <Ionicons name="logo-instagram" size={18} color={theme.colors.text.secondary} />
                    <Text style={styles.contactText}>@{profile.instagram}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Sign Out & App Info */}
        <View style={styles.footerContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="tertiary"
          />

          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>The Naked Pantry v1.0</Text>
            <Text style={styles.appInfoText}>Made with care for healthy eating</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  
  profilePictureContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },

  profilePicture: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  editImageButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  profileInfo: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },

  userName: {
    ...theme.typography.heading,
    fontSize: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },

  userHandle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs / 2,
    fontWeight: '600',
  },

  joinDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontWeight: '400',
  },

  editButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
  },

  bioContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },

  bioText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },

  // Social Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },

  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },

  // Content sections
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  sectionCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },

  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },

  favoriteItem: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.lg * 2 - theme.spacing.sm) / 2,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  viewAllText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },

  achievementsList: {
    gap: theme.spacing.sm,
  },

  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(68, 219, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  achievementContent: {
    flex: 1,
  },

  achievementTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },

  achievementDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  contactInfo: {
    gap: theme.spacing.md,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '400',
  },

  footerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    gap: theme.spacing.md,
  },

  editingContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },

  editSection: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.3,
  },
  
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  
  savingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  
  profileInfoContainer: {
    marginBottom: theme.spacing.xl,
  },
  
  
  
  appInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  
  appInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },

  userBio: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});