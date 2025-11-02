/**
 * Navigation Type Definitions
 *
 * This file contains all navigation-related TypeScript types for the app.
 * It provides type safety for navigation props, routes, and params.
 */

import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, CompositeScreenProps, RouteProp } from '@react-navigation/native';

// ============================================================================
// Stack Navigation Types
// ============================================================================

/**
 * Root Stack Navigator - Contains all stack screens
 */
export type RootStackParamList = {
  Main: undefined;
  AisleMenu: undefined;
  AisleDetail: { slug: string; title: string };
  FoodDetail: { foodId: string };
  UserProfile: { userId: string };
  UserReviews: { userId: string };
  UserContributions: { userId: string };
  Settings: undefined;
  IngredientScanner: undefined;
  ScanHistory: undefined;
};

/**
 * Tab Navigator - Contains all tab screens
 */
export type TabParamList = {
  Home: { scrollToTop?: boolean } | undefined;
  Scanner: { hideTabBar?: boolean } | undefined;
  Submit: undefined;
  Favorites: undefined;
  Profile: { hideTabBar?: boolean; userId?: string } | undefined;
};

// ============================================================================
// Navigation Prop Types (for useNavigation hook)
// ============================================================================

/**
 * Navigation prop for screens in the Root Stack
 */
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Navigation prop for screens in the Tab Navigator
 */
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

/**
 * Composite navigation prop that combines both Stack and Tab navigation
 * Use this for screens that can navigate to both stack and tab screens
 */
export type AppNavigationProp = CompositeNavigationProp<
  RootStackNavigationProp,
  TabNavigationProp
>;

// ============================================================================
// Screen Props Types (for screen components)
// ============================================================================

/**
 * Screen props for Root Stack screens
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Screen props for Tab Navigator screens
 */
export type TabScreenProps<T extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// ============================================================================
// Specific Screen Props
// ============================================================================

// Stack Screens
export type AisleDetailScreenProps = RootStackScreenProps<'AisleDetail'>;
export type FoodDetailScreenProps = RootStackScreenProps<'FoodDetail'>;
export type UserProfileScreenProps = RootStackScreenProps<'UserProfile'>;
export type UserReviewsScreenProps = RootStackScreenProps<'UserReviews'>;
export type UserContributionsScreenProps = RootStackScreenProps<'UserContributions'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type IngredientScannerScreenProps = RootStackScreenProps<'IngredientScanner'>;

// Tab Screens
export type HomeScreenProps = TabScreenProps<'Home'>;
export type ScannerScreenProps = TabScreenProps<'Scanner'>;
export type SubmitScreenProps = TabScreenProps<'Submit'>;
export type FavoritesScreenProps = TabScreenProps<'Favorites'>;
export type ProfileScreenProps = TabScreenProps<'Profile'>;

// ============================================================================
// Navigation Prop Types for Specific Screens
// ============================================================================

// Stack Screen Navigation Props
export type AisleDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AisleDetail'>;
export type FoodDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FoodDetail'>;
export type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
export type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

// Tab Screen Navigation Props
export type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ScannerNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Scanner'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ============================================================================
// Route Prop Types
// ============================================================================

export type AisleDetailRouteProp = RouteProp<RootStackParamList, 'AisleDetail'>;
export type FoodDetailRouteProp = RouteProp<RootStackParamList, 'FoodDetail'>;
export type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
export type HomeRouteProp = RouteProp<TabParamList, 'Home'>;
export type ProfileRouteProp = RouteProp<TabParamList, 'Profile'>;

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if params exist
 */
export function hasParams<T extends keyof RootStackParamList>(
  route: { params?: RootStackParamList[T] },
  screen: T
): route is { params: RootStackParamList[T] } {
  return route.params !== undefined;
}

/**
 * Type-safe navigation helper types
 */
export type NavigateFunction<T extends keyof RootStackParamList> =
  RootStackParamList[T] extends undefined
    ? (screen: T) => void
    : (screen: T, params: RootStackParamList[T]) => void;

/**
 * Declare global type augmentation for React Navigation
 * This enables type checking for navigation.navigate() calls
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
