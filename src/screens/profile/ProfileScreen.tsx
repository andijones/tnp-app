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
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { ProfilePicture } from '../../components/common/ProfilePicture';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';
import { useUser } from '../../hooks/useUser';
import { useFavorites } from '../../hooks/useFavorites';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  route?: {
    params?: {
      userId?: string;
    };
  };
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const targetUserId = route?.params?.userId;
  const navigation = useNavigation();
  const { user, profile: currentUserProfile, loading: currentUserLoading, error: currentUserError, updateProfile } = useUser();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  // Check if we need to show header (when navigated via UserProfile route, not Profile tab)
  const showHeader = route?.name === 'UserProfile';

  // State for profile data (either current user or target user)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode states (only for own profile)
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    instagram: '',
    bio: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);

  // Common profile data states
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [userStats, setUserStats] = useState({
    totalFavorites: 0,
    totalReviews: 0,
    totalContributions: 0,
    joinDate: '',
  });
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Load profile data based on whether it's own profile or target user
  useEffect(() => {
    const loadProfile = async () => {
      console.log('ProfileScreen loading profile for:', { targetUserId, isOwnProfile });
      setLoading(true);
      setError(null);

      try {
        if (isOwnProfile) {
          // Use current user's profile data
          if (currentUserProfile) {
            console.log('Using current user profile:', currentUserProfile);
            setProfile(currentUserProfile);
            setFormData({
              full_name: currentUserProfile.full_name || '',
              username: currentUserProfile.username || '',
              instagram: currentUserProfile.instagram || '',
              bio: currentUserProfile.bio || '',
              avatar_url: currentUserProfile.avatar_url || '',
            });
          } else {
            console.log('No current user profile available');
            setError('Profile not available');
          }
        } else {
          // Fetch target user's profile
          console.log('Fetching profile for user ID:', targetUserId);
          const { data: profileData, error: profileError } = await supabase
            .rpc('get_public_profile', { user_id: targetUserId });

          console.log('Profile fetch result:', { profileData, profileError });

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            setError('Failed to load profile');
            return;
          }

          if (profileData && profileData.length > 0) {
            const profile = profileData[0]; // RPC returns an array, get first element
            setProfile(profile);
          } else {
            // User exists but no profile created yet - create a minimal profile object
            console.log('No profile found for user, creating minimal profile');
            setProfile({
              id: targetUserId,
              full_name: null,
              username: null,
              bio: null,
              avatar_url: null,
              instagram: null,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Profile loading error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    // Always load profile if we have the necessary data
    if (isOwnProfile || targetUserId) {
      loadProfile();
    } else {
      setLoading(false);
      setError('No user specified');
    }
  }, [isOwnProfile, currentUserProfile, targetUserId]);

  // Load favorite foods and stats when profile is loaded
  useEffect(() => {
    if (profile) {
      const userId = isOwnProfile ? user?.id : targetUserId;
      if (userId) {
        loadUserStats(userId);
        if (isOwnProfile && favoriteIds && favoriteIds.length > 0) {
          loadFavoriteFoods();
        }
      }
    }
  }, [profile, favoriteIds, isOwnProfile]);

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

  const loadUserStats = async (userId: string) => {
    try {
      // Get reviews with content (not just count)
      const { data: reviews } = await supabase
        .from('ratings')
        .select('*, foods(id, name)')
        .eq('user_id', userId)
        .not('review', 'is', null);

      // Get food contributions count using the proper query from your documentation
      const { data: foodContributions } = await supabase
        .from('foods')
        .select('id')
        .or(`user_id.eq.${userId},original_submitter_id.eq.${userId}`)
        .eq('status', 'approved');

      // Get favorites count (only for own profile)
      let favoritesCount = 0;
      if (isOwnProfile) {
        favoritesCount = favoriteIds ? favoriteIds.length : 0;
      }

      // Get join date from profile creation
      const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      }) : '';

      setUserStats({
        totalFavorites: favoritesCount,
        totalReviews: reviews?.length || 0,
        totalContributions: foodContributions?.length || 0,
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
    <SafeAreaView style={[styles.safeArea, showHeader && styles.safeAreaWithHeader]}>
      {/* Standard Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isOwnProfile ? 'My Profile' : 'Profile'}
            </Text>
            <View style={styles.headerRight} />
          </View>
        </View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Modern Profile Header */}
        <View style={styles.modernHeader}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture
                imageUrl={editing && formData.avatar_url ? formData.avatar_url : profile?.avatar_url}
                fullName={profile?.full_name}
                email={user?.email}
                size="xlarge"
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
                    size={20}
                    color={theme.colors.background}
                  />
                </TouchableOpacity>
              )}
            </View>

            {!editing && isOwnProfile && (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setEditing(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <Text style={styles.displayName}>
              {(profile?.full_name && profile.full_name.trim() !== '') ? profile.full_name :
               (profile?.username && profile.username.trim() !== '') ? profile.username :
               'User Profile'}
            </Text>

            {profile?.username && profile.full_name && (
              <Text style={styles.username}>@{profile.username}</Text>
            )}

            {profile?.bio && !editing && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              {userStats.joinDate && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.metaText}>Joined {userStats.joinDate}</Text>
                </View>
              )}

              {profile?.instagram && (
                <TouchableOpacity
                  style={styles.metaItem}
                  onPress={async () => {
                    const url = `https://instagram.com/${profile.instagram}`;
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                      await Linking.openURL(url);
                    } else {
                      Alert.alert('Error', 'Unable to open Instagram profile');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-instagram" size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.metaText, styles.instagramLink]}>@{profile.instagram}</Text>
                </TouchableOpacity>
              )}
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
          /* Display Mode - Modern Stats & Content */
          <View style={styles.contentContainer}>
            {/* Stats Sections */}
            <View style={styles.sectionsContainer}>

              <TouchableOpacity
                style={styles.sectionCard}
                onPress={() => {
                  navigation.navigate('UserReviews' as never, {
                    userId: isOwnProfile ? user?.id : targetUserId,
                    userName: profile?.full_name || profile?.username || 'User'
                  } as never);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionTextContainer}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <Text style={styles.sectionCount}>{userStats.totalReviews} reviews</Text>
                  </View>
                  <View style={styles.sectionAction}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sectionCard}
                onPress={() => {
                  navigation.navigate('UserContributions' as never, {
                    userId: isOwnProfile ? user?.id : targetUserId,
                    userName: profile?.full_name || profile?.username || 'User'
                  } as never);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionTextContainer}>
                    <Text style={styles.sectionTitle}>Contributions</Text>
                    <Text style={styles.sectionCount}>{userStats.totalContributions} foods</Text>
                  </View>
                  <View style={styles.sectionAction}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>



          </View>
        )}

        {/* Sign Out & App Info - Only for own profile */}
        {isOwnProfile && (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  safeAreaWithHeader: {
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  // Standard Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    padding: 4,
    marginRight: theme.spacing.sm,
  },

  headerTitle: {
    ...theme.typography.heading,
    fontSize: 22, // Reduced from 26 to 22 (4px decrease)
    color: theme.colors.green[950],
    flex: 1,
    textAlign: 'center',
  },

  headerRight: {
    width: 32,
    alignItems: 'center',
  },

  // Modern Profile Header
  modernHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },

  profilePictureSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  userInfoSection: {
    alignItems: 'center',
  },

  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  username: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },

  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  metaText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  instagramLink: {
    color: theme.colors.primary,
    fontWeight: '500',
  },

  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },

  editProfileText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
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

  // Sections Container
  sectionsContainer: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },

  sectionTextContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  sectionCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  sectionAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },



  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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