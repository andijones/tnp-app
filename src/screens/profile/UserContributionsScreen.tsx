import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import { supabase } from '../../services/supabase/config';
import { logger } from '../../utils/logger';

interface UserContributionsScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
    };
  };
}

interface Contribution {
  id: string;
  name: string;
  image?: string;
  supermarket?: string;
  created_at: string;
  status: string;
}

export const UserContributionsScreen: React.FC<UserContributionsScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { userId, userName } = route.params;
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserContributions();
  }, [userId]);

  const loadUserContributions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foods')
        .select(`
          id,
          name,
          image,
          supermarket,
          created_at,
          status
        `)
        .or(`user_id.eq.${userId},original_submitter_id.eq.${userId}`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading contributions:', error);
        Alert.alert('Error', 'Failed to load contributions');
        return;
      }

      setContributions(data || []);
    } catch (error) {
      logger.error('Error loading contributions:', error);
      Alert.alert('Error', 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderContributionItem = ({ item }: { item: Contribution }) => (
    <TouchableOpacity
      style={styles.contributionCard}
      onPress={() => {
        navigation.navigate('FoodDetail' as never, { foodId: item.id } as never);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={theme.colors.text.tertiary} />
            </View>
          )}
        </View>

        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.metaInfo}>
            {item.supermarket && (
              <View style={styles.metaItem}>
                <Ionicons name="storefront-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>{item.supermarket}</Text>
              </View>
            )}
          </View>

          <Text style={styles.contributionDate}>
            Added {formatDate(item.created_at)}
          </Text>
        </View>

        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {userName}'s Contributions
            </Text>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading contributions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {userName}'s Contributions
          </Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {contributions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="add-circle-outline" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Contributions Yet</Text>
          <Text style={styles.emptySubtitle}>
            {userName} hasn't contributed any foods yet.
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsText}>
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={contributions}
            renderItem={renderContributionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

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

  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.BG,
  },

  statsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },

  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },

  imageContainer: {
    marginRight: theme.spacing.md,
  },

  foodImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
  },

  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  foodInfo: {
    flex: 1,
  },

  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  metaInfo: {
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
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

  contributionDate: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },

  chevron: {
    marginLeft: theme.spacing.sm,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.neutral.BG,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});