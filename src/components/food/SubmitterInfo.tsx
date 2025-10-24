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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!originalSubmitterId}
    >
      <View style={styles.userRow}>
        {submitterProfile?.avatar_url ? (
          <Image
            source={{ uri: submitterProfile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={14} color={theme.colors.text.tertiary} />
          </View>
        )}
        <Text style={styles.submittedText}>
          Submitted by <Text style={styles.username}>{displayName}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // No extra styling needed
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  submittedText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },

  username: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  loadingText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});