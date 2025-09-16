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
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { PublicProfile, SubmissionStats, FoodLink } from '../../types';

interface SubmitterInfoProps {
  originalSubmitterId?: string | null;
  foodLinkId?: string | null;
}

export const SubmitterInfo: React.FC<SubmitterInfoProps> = ({
  originalSubmitterId,
  foodLinkId,
}) => {
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
    try {
      // Fetch profile data if we have a submitter ID
      if (originalSubmitterId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, created_at')
          .eq('id', originalSubmitterId)
          .maybeSingle();

        if (!profileError && profileData) {
          setSubmitterProfile(profileData);
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
          console.error('Error fetching submission stats:', statsError);
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
          console.error('Error fetching food link:', linkError);
        }
      }
    } catch (error) {
      console.error('Error fetching submitter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (): string => {
    if (!submitterProfile) {
      return 'Community Member';
    }

    if (submitterProfile.full_name) {
      return submitterProfile.full_name;
    }

    if (submitterProfile.username) {
      return submitterProfile.username;
    }

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
  const rank = getRank(contributionCount);

  return (
    <View style={styles.container}>
      {/* Social Header */}
      <View style={styles.socialHeader}>
        <Ionicons name="heart" size={16} color={theme.colors.green[600]} />
        <Text style={styles.socialText}>
          Community member {foodLink ? 'shared' : 'added'} this food
        </Text>
      </View>

      {/* User Profile Row - matching review pattern */}
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {submitterProfile?.avatar_url ? (
            <Image
              source={{ uri: submitterProfile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={theme.colors.text.tertiary} />
            </View>
          )}
        </View>

        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{displayName}</Text>
            {foodLink && (
              <View style={styles.sourceIndicator}>
                <Ionicons name="link" size={12} color={theme.colors.green[600]} />
              </View>
            )}
          </View>

          <View style={styles.contributionInfo}>
            <Text style={styles.contributionText}>
              {contributionCount} contribution{contributionCount !== 1 ? 's' : ''} • {rank.title}
            </Text>
          </View>
        </View>

        <View style={styles.appreciationBadge}>
          <Ionicons name="star" size={14} color={theme.colors.warning} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },

  // Social Header
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },

  socialText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  // User Profile Row - matching review pattern exactly
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContainer: {
    marginRight: theme.spacing.md,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  userDetails: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  username: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  sourceIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.green[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  contributionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contributionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  appreciationBadge: {
    marginLeft: theme.spacing.sm,
  },

  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});