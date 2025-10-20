import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useNavigation } from '@react-navigation/native';
import { Food } from '../../types';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  route?: {
    params?: {
      userId?: string;
    };
  };
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ route }) => {
  const insets = useSafeAreaInsets();
  const targetUserId = route?.params?.userId;
  const navigation = useNavigation();
  const { user, profile: currentUserProfile, loading: userLoading, error: currentUserError, updateProfile } = useUser();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  // Check if we need to show header (when navigated via UserProfile route, not Profile tab)
  const showHeader = (route as any)?.name === 'UserProfile';

  // State for profile data (either current user or target user)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode states (only for own profile)
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'contributions' | 'reviews'>('contributions');

  // Common profile data states
  const [contributions, setContributions] = useState<Food[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalFavorites: 0,
    totalReviews: 0,
    totalContributions: 0,
    joinDate: '',
  });
  const [loadingContent, setLoadingContent] = useState(false);

  // Pagination states
  const [contributionsPage, setContributionsPage] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [hasMoreContributions, setHasMoreContributions] = useState(true);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const ITEMS_PER_PAGE = 12;

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
              avatar_url: currentUserProfile.avatar_url || '',
            });
          } else {
            // Don't set error yet - profile might still be loading
            console.log('Waiting for current user profile to load...');
            setLoading(false);
            return;
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
    // For own profile, wait until useUser has finished loading
    if (isOwnProfile) {
      if (!userLoading) {
        loadProfile();
      }
    } else if (targetUserId) {
      loadProfile();
    } else {
      setLoading(false);
      setError('No user specified');
    }
  }, [isOwnProfile, currentUserProfile, targetUserId, userLoading]);

  // Load stats when profile is loaded
  useEffect(() => {
    if (profile) {
      const userId = isOwnProfile ? user?.id : targetUserId;
      if (userId) {
        loadUserStats(userId);
      }
    }
  }, [profile, isOwnProfile]);

  // Lazy load content only when the tab is viewed
  useEffect(() => {
    if (profile && !editing) {
      const userId = isOwnProfile ? user?.id : targetUserId;
      if (userId) {
        loadUserContent(userId);
      }
    }
  }, [profile, isOwnProfile, activeTab, editing]);

  const loadUserContent = async (userId: string, loadMore: boolean = false) => {
    // Only load data for the active tab
    if (activeTab === 'contributions') {
      if (loadMore && !hasMoreContributions) return;
      if (!loadMore && contributions.length > 0) return;

      loadMore ? setLoadingMore(true) : setLoadingContent(true);
      try {
        const page = loadMore ? contributionsPage + 1 : 0;
        const from = page * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data: contributionsData, error: contributionsError } = await supabase
          .from('foods')
          .select('*')
          .or(`user_id.eq.${userId},original_submitter_id.eq.${userId}`)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (contributionsError) {
          console.error('Error loading contributions:', contributionsError);
        } else {
          console.log(`Contributions loaded: ${contributionsData?.length || 0} items (page ${page})`);

          if (loadMore) {
            setContributions(prev => [...prev, ...(contributionsData || [])]);
          } else {
            setContributions(contributionsData || []);
          }

          setContributionsPage(page);
          setHasMoreContributions((contributionsData?.length || 0) === ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error('Error loading contributions:', error);
      } finally {
        loadMore ? setLoadingMore(false) : setLoadingContent(false);
      }
    } else if (activeTab === 'reviews') {
      if (loadMore && !hasMoreReviews) return;
      if (!loadMore && reviews.length > 0) return;

      loadMore ? setLoadingMore(true) : setLoadingContent(true);
      try {
        const page = loadMore ? reviewsPage + 1 : 0;
        const from = page * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('ratings')
          .select('id, rating, review, created_at, food_id, foods(id, name)')
          .eq('user_id', userId)
          .not('review', 'is', null)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (reviewsError) {
          console.error('Error loading reviews:', reviewsError);
        } else {
          console.log(`Reviews loaded: ${reviewsData?.length || 0} reviews (page ${page})`);

          if (loadMore) {
            setReviews(prev => [...prev, ...(reviewsData || [])]);
          } else {
            setReviews(reviewsData || []);
          }

          setReviewsPage(page);
          setHasMoreReviews((reviewsData?.length || 0) === ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        loadMore ? setLoadingMore(false) : setLoadingContent(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || loadingContent) return;

    const userId = isOwnProfile ? user?.id : targetUserId;
    if (!userId) return;

    loadUserContent(userId, true);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      handleLoadMore();
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
        favoritesCount = favorites ? favorites.size : 0;
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
        mediaTypes: ['images'],
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
      <View style={[styles.safeArea, styles.safeAreaWhite, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.safeArea, styles.safeAreaWhite, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, styles.safeAreaWhite]}>
      {/* Standard Header */}
      {showHeader && (
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {profile?.full_name || 'Profile'}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity onPress={handleSignOut} style={styles.headerRight}>
                <Ionicons name="log-out-outline" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
            {!isOwnProfile && <View style={styles.headerRight} />}
          </View>
        </View>
      )}

      <View style={styles.container}>
        {/* Modern Profile Header - Instagram/Twitter Inspired */}
        <View style={[styles.modernHeader, !showHeader && { paddingTop: insets.top + 16 }]}>
          {/* Avatar and Stats Row */}
          <View style={styles.profileTopRow}>
            <View style={styles.avatarContainer}>
              <ProfilePicture
                imageUrl={editing && formData.avatar_url ? formData.avatar_url : profile?.avatar_url}
                fullName={profile?.full_name}
                email={user?.email}
                size="large"
              />
              {editing && (
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={20} color={theme.colors.surface} />
                </TouchableOpacity>
              )}
            </View>

            {/* Right side: Name + Stats */}
            <View style={styles.rightSection}>
              {/* Name above stats */}
              <Text style={styles.displayName}>
                {(profile?.full_name && profile.full_name.trim() !== '') ? profile.full_name : 'User Profile'}
              </Text>

              {/* Stats Row - Instagram Style */}
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                  <Text style={styles.statNumber}>{userStats.totalContributions}</Text>
                  <Text style={styles.statLabel}>Submissions</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                  <Text style={styles.statNumber}>{userStats.totalReviews}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </TouchableOpacity>

                {isOwnProfile && (
                  <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                    <Text style={styles.statNumber}>{userStats.totalFavorites}</Text>
                    <Text style={styles.statLabel}>Favorites</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Join Date */}
          {userStats.joinDate && (
            <View style={styles.joinDateRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
              <Text style={styles.joinDateText}>Joined {userStats.joinDate}</Text>
            </View>
          )}

          {/* Edit Profile Button */}
          {!editing && isOwnProfile && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setEditing(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Sections */}
        {editing ? (
          /* Edit Mode */
          <View style={styles.editModeContainer}>
            <ScrollView
              style={styles.editScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editScrollContent}
            >
              <View style={styles.editingContainer}>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                />
              </View>
            </ScrollView>

            {/* Fixed Action Buttons at Bottom */}
            <View style={styles.editFooter}>
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="tertiary"
                  style={{ flex: 1 }}
                />
                <Button
                  title={saving ? "Saving..." : "Save"}
                  onPress={handleSave}
                  disabled={saving}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </View>

              {/* Sign Out Button */}
              {isOwnProfile && (
                <Button
                  title="Sign Out"
                  onPress={handleSignOut}
                  variant="outline"
                  style={styles.signOutButton}
                />
              )}

              {/* App Info */}
              <View style={styles.appInfo}>
                <Text style={styles.appInfoText}>The Naked Pantry v1.0</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Display Mode - Tab Layout */
          <View style={styles.contentContainer}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.tab,
                  activeTab === 'contributions' && styles.activeTab,
                  pressed && styles.tabPressed
                ]}
                onPress={() => {
                  console.log('Contributions tab pressed');
                  setActiveTab('contributions');
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'contributions' && styles.activeTabText
                  ]}
                >
                  Contributions
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.tab,
                  activeTab === 'reviews' && styles.activeTab,
                  pressed && styles.tabPressed
                ]}
                onPress={() => {
                  console.log('Reviews tab pressed');
                  setActiveTab('reviews');
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'reviews' && styles.activeTabText
                  ]}
                >
                  Reviews
                </Text>
              </Pressable>
            </View>

            {/* Tab Content */}
            {loadingContent ? (
              <View style={styles.loadingContentContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView
                style={styles.tabScrollView}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={400}
              >
                {activeTab === 'contributions' ? (
                  contributions.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons name="add-circle-outline" size={64} color={theme.colors.text.tertiary} />
                      <Text style={styles.emptyStateTitle}>No Contributions Yet</Text>
                      <Text style={styles.emptyStateSubtitle}>
                        {isOwnProfile ? "You haven't" : `${profile?.full_name || 'This user'} hasn't`} contributed any foods yet.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.contributionsGrid}>
                      {contributions.map((food) => (
                        <View key={food.id} style={styles.gridCardWrapper}>
                          <GridFoodCard
                            food={food}
                            onPress={() => (navigation as any).navigate('FoodDetail', { foodId: food.id })}
                            isFavorite={isFavorite(food.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        </View>
                      ))}
                    </View>
                  )
                ) : (
                  reviews.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Ionicons name="chatbubble-outline" size={64} color={theme.colors.text.tertiary} />
                      <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
                      <Text style={styles.emptyStateSubtitle}>
                        {isOwnProfile ? "You haven't" : `${profile?.full_name || 'This user'} hasn't`} written any reviews yet.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.reviewsList}>
                      {reviews.map((review) => (
                        <TouchableOpacity
                          key={review.id}
                          style={styles.reviewCard}
                          onPress={() => {
                            if (review.food_id) {
                              (navigation as any).navigate('FoodDetail', { foodId: review.food_id });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.reviewFoodName}>
                            {review.foods?.name || 'Unknown Food'}
                          </Text>

                          <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= parseInt(review.rating) ? "star" : "star-outline"}
                                size={16}
                                color={star <= parseInt(review.rating) ? theme.colors.warning : theme.colors.text.tertiary}
                              />
                            ))}
                          </View>

                          <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>

                          <Text style={styles.reviewText}>
                            {review.review}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                )}

                {/* Loading More Indicator */}
                {loadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                )}

                {/* End of List Indicator */}
                {!loadingContent && !loadingMore && (
                  activeTab === 'contributions' ? (
                    !hasMoreContributions && contributions.length > 0 && (
                      <View style={styles.endOfListContainer}>
                        <Text style={styles.endOfListText}>No more contributions</Text>
                      </View>
                    )
                  ) : (
                    !hasMoreReviews && reviews.length > 0 && (
                      <View style={styles.endOfListContainer}>
                        <Text style={styles.endOfListText}>No more reviews</Text>
                      </View>
                    )
                  )
                )}
              </ScrollView>
            )}
          </View>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F6F0',
  },

  safeAreaWhite: {
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  editScrollView: {
    flex: 1,
  },

  // Standard Header
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 16,
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
    alignItems: 'center',
    padding: 4,
  },

  // Modern Profile Header - Instagram/Twitter Inspired
  modernHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.neutral[200],
  },

  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  avatarContainer: {
    position: 'relative',
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.green[950],
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Right section: Name + Stats
  rightSection: {
    flex: 1,
    marginLeft: 16,
  },

  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.neutral[950],
    marginBottom: 8,
  },

  // Stats Row - Instagram Style
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },

  statItem: {
    alignItems: 'flex-start',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.neutral[950],
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },

  joinDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },

  joinDateText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },

  // Edit Profile Button - Full Width like Instagram
  editProfileButton: {
    backgroundColor: theme.colors.neutral[100],
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[950],
  },

  // Content sections
  contentContainer: {
    flex: 1,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.BG2,
    zIndex: 10,
  },

  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  activeTab: {
    borderBottomColor: theme.colors.green[500],
  },

  tabPressed: {
    backgroundColor: theme.colors.neutral[100],
  },

  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  activeTabText: {
    color: theme.colors.green[600],
  },

  // Tab Content
  tabScrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  loadingContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    backgroundColor: theme.colors.neutral.BG,
  },

  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },

  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  endOfListText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },

  // Contributions Grid
  contributionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },

  gridCardWrapper: {
    width: (width - theme.spacing.md * 3) / 2,
    marginBottom: theme.spacing.md,
  },

  // Reviews List
  reviewsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    gap: 4,
  },

  reviewFoodName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.green[950],
    lineHeight: Math.round(16 * 1.197),
    letterSpacing: -0.48,
  },

  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },

  reviewDate: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.neutral[500],
    lineHeight: 12,
  },

  reviewText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    color: theme.colors.neutral[900],
    letterSpacing: -0.15,
  },

  // Empty States
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Edit Mode Styles
  editModeContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  editScrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  editingContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  editFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },

  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  signOutButton: {
    marginBottom: theme.spacing.sm,
  },

  appInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },

  appInfoText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
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
});
