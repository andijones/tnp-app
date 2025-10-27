import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { PublicProfile, SubmissionStats, FoodLink } from '../../types';
import { logger } from '../../utils/logger';

interface SubmitterInfoProps {
  originalSubmitterId?: string | null;
  foodLinkId?: string | null;
}

export const SubmitterInfo: React.FC<SubmitterInfoProps> = ({
  originalSubmitterId,
  foodLinkId,
}) => {
  const navigation = useNavigation();
  const [submitterProfile, setSubmitterProfile] = useState<PublicProfile | null>(null);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats | null>(null);
  const [foodLink, setFoodLink] = useState<FoodLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!originalSubmitterId && !foodLinkId) {
      setLoading(false);
      return;
    }

    fetchSubmitterData();
  }, [originalSubmitterId, foodLinkId]);

  const fetchSubmitterData = async () => {
    logger.log('SubmitterInfo - originalSubmitterId:', originalSubmitterId, 'foodLinkId:', foodLinkId);
    try {
      // Fetch profile data if we have a submitter ID
      if (originalSubmitterId) {
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_public_profile', { user_id: originalSubmitterId });

        if (profileError) {
          logger.error('Profile error:', profileError);
        }

        if (profileData && profileData.length > 0) {
          const profile = profileData[0]; // RPC returns an array, get first element
          logger.log('Profile data found from RPC:', profile);
          logger.log('Full name:', profile.full_name);
          logger.log('Username:', profile.username);
          setSubmitterProfile(profile);
        } else {
          logger.log('No profile data returned from RPC for user:', originalSubmitterId);
          setSubmitterProfile(null);
        }

        // Fetch submission statistics - simplified approach
        try {
          const { data: uniqueFoods, error: foodsError } = await supabase
            .from('foods')
            .select('id')
            .or(`user_id.eq.${originalSubmitterId},original_submitter_id.eq.${originalSubmitterId}`)
            .eq('status', 'approved');

          const { count: pendingFoodLinkCount, error: pendingError } = await supabase
            .from('food_links')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', originalSubmitterId)
            .eq('status', 'pending');

          // Set stats even if one query fails, just use 0 for failed queries
          setSubmissionStats({
            totalContributions: (foodsError ? 0 : (uniqueFoods?.length || 0)) + (pendingError ? 0 : (pendingFoodLinkCount || 0))
          });
        } catch (statsError) {
          logger.error('Error fetching submission stats:', statsError);
          setSubmissionStats({ totalContributions: 0 });
        }
      }

      // Fetch food link data if we have a food link ID
      if (foodLinkId) {
        try {
          const { data: foodLinkData, error: foodLinkError } = await supabase
            .from('food_links')
            .select('url')
            .eq('id', foodLinkId)
            .single();

          if (!foodLinkError && foodLinkData) {
            setFoodLink(foodLinkData as FoodLink);
          }
        } catch (linkError) {
          logger.error('Error fetching food link:', linkError);
        }
      }
    } catch (error) {
      logger.error('Error fetching submitter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (): string => {
    logger.log('getDisplayName called with submitterProfile:', submitterProfile);

    if (!submitterProfile) {
      logger.log('No submitter profile found, showing Community Member');
      return 'Community Member';
    }

    // Check if we have actual name data with detailed debugging
    logger.log('Checking full_name:', typeof submitterProfile.full_name, '"' + submitterProfile.full_name + '"');
    logger.log('Checking username:', typeof submitterProfile.username, '"' + submitterProfile.username + '"');

    if (submitterProfile.full_name && typeof submitterProfile.full_name === 'string' && submitterProfile.full_name.trim() !== '') {
      logger.log('✅ Using full_name:', submitterProfile.full_name);
      return submitterProfile.full_name;
    }

    if (submitterProfile.username && typeof submitterProfile.username === 'string' && submitterProfile.username.trim() !== '') {
      logger.log('✅ Using username:', submitterProfile.username);
      return submitterProfile.username;
    }

    // If the RPC returned a profile but it's empty, something's wrong
    logger.log('RPC returned profile but no name data:', submitterProfile);
    return 'Community Member';
  };

  const getRank = (contributionCount: number) => {
    if (contributionCount >= 50) return { title: 'Contribution Master', color: theme.colors.green[100], textColor: theme.colors.green[800] };
    if (contributionCount >= 25) return { title: 'Contribution Champion', color: theme.colors.green[50], textColor: theme.colors.green[700] };
    if (contributionCount >= 10) return { title: 'Contribution Expert', color: theme.colors.neutral[100], textColor: theme.colors.neutral[700] };
    if (contributionCount >= 5) return { title: 'Active Contributor', color: theme.colors.green[100], textColor: theme.colors.green[800] };
    return { title: 'New Contributor', color: theme.colors.neutral[100], textColor: theme.colors.neutral[700] };
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.green[600]} />
        <Text style={styles.loadingText}>Loading contributor info...</Text>
      </View>
    );
  }

  if (!originalSubmitterId && !foodLinkId) {
    return null;
  }

  const displayName = getDisplayName();
  const contributionCount = submissionStats?.totalContributions || 0;

  const handlePress = () => {
    if (originalSubmitterId) {
      navigation.navigate('UserProfile' as never, { userId: originalSubmitterId } as never);
    }
  };

  const avatarUrl = submitterProfile?.avatar_url
    ? `https://uacihrlnwlqhpbobzajs.supabase.co/storage/v1/object/public/avatars/${submitterProfile.avatar_url}`
    : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!originalSubmitterId}
    >
      {/* Profile Picture */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {getInitials(displayName)}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>Contributed by</Text>
        <Text style={styles.nameText}>{displayName}</Text>

        {/* Contribution Count Badge */}
        {submissionStats && contributionCount > 0 && (
          <View style={styles.contributionBadge}>
            <Text style={styles.contributionText}>
              {contributionCount} {contributionCount === 1 ? 'contribution' : 'contributions'}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron Icon */}
      {originalSubmitterId && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.neutral[400]}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.neutral[200],
  },

  avatarContainer: {
    marginRight: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[100],
  },

  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.green[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.green[950],
    letterSpacing: -0.32,
  },

  content: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.neutral[500],
    marginBottom: 2,
    letterSpacing: -0.12,
  },

  nameText: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '600',
    color: theme.colors.neutral[800],
    marginBottom: 4,
    letterSpacing: -0.32,
  },

  contributionBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.green[50],
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: theme.colors.green[200],
    marginTop: 2,
  },

  contributionText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: theme.colors.green[950],
    letterSpacing: -0.11,
  },

  chevron: {
    marginLeft: 8,
  },

  loadingText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});