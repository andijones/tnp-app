// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';
import type { RootStackParamList, TabParamList } from '../types/navigation';

// Import your screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { AisleMenuView } from '../screens/aisles/AisleMenuScreen';
import { AisleDetailView } from '../screens/aisles/AisleDetailScreen';
import { FoodDetailScreen } from '../screens/food/FoodDetailScreen';
import { UnifiedScannerScreen } from '../screens/scanner/UnifiedScannerScreen';
import { IngredientScannerScreen } from '../screens/scanner/IngredientScannerScreen';
import { SubmissionScreen } from '../screens/scanner/SubmissionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UserReviewsScreen } from '../screens/profile/UserReviewsScreen';
import { UserContributionsScreen } from '../screens/profile/UserContributionsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { ProfilePicture } from '../components/common/ProfilePicture';
import { useUser } from '../hooks/useUser';
import { ScannerIcon } from '../components/icons/ScannerIcon';
import { TNPLogoIcon } from '../components/icons/TNPLogoIcon';
import { AddIcon } from '../components/icons/AddIcon';
import { HeartIcon } from '../components/icons/HeartIcon';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
// Drawer removed – Aisle browsing lives as a regular stack screen

// Custom Fixed Tab Bar Background (90% opacity)
function FixedTabBarBackground({ style }: any) {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.fixedTabBarBackground]} />
  );
}

// Simple Tab Icon Component (no animation, just color change)
function SimpleTabIcon({
  name,
  focusedName,
  focused,
  color,
  size,
  customIcon,
}: {
  name: string;
  focusedName: string;
  focused: boolean;
  color: string;
  size: number;
  customIcon?: 'scanner' | 'tnp-logo' | 'add' | 'heart';
}) {
  // Render custom icon if specified
  const renderIcon = () => {
    if (customIcon === 'scanner') {
      return <ScannerIcon size={size} color={color} focused={focused} />;
    }
    if (customIcon === 'tnp-logo') {
      return <TNPLogoIcon size={size} color={color} focused={focused} />;
    }
    if (customIcon === 'add') {
      return <AddIcon size={size} color={color} focused={focused} />;
    }
    if (customIcon === 'heart') {
      return <HeartIcon size={size} color={color} focused={focused} />;
    }
    return (
      <Ionicons
        name={focused ? focusedName : name}
        size={size}
        color={color}
      />
    );
  };

  return (
    <View>
      {renderIcon()}
    </View>
  );
}

// Profile Tab Icon Component (simple version, no animation)
function ProfileTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { user, profile, loading } = useUser();

  if (loading) {
    return (
      <View>
        <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? theme.colors.green[500] : 'transparent',
      }}
    >
      <ProfilePicture
        imageUrl={profile?.avatar_url}
        fullName={profile?.full_name}
        email={user?.email}
        size="small"
      />
    </View>
  );
}

// Bottom Tab Navigator (Main App Navigation)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 83,
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral.BG2,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 32,
        },
        tabBarItemStyle: {
          paddingHorizontal: 8,
        },
        tabBarActiveTintColor: theme.colors.green[950],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        tabBarBackground: () => <FixedTabBarBackground style={undefined} />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'All Foods',
          tabBarAccessibilityLabel: 'Home, Browse all foods',
          tabBarIcon: ({ focused, color }) => (
            <SimpleTabIcon
              name="nutrition-outline"
              focusedName="nutrition"
              focused={focused}
              color={color}
              size={28}
              customIcon="tnp-logo"
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Get the current route state
            const state = navigation.getState();
            const currentRoute = state.routes[state.index];

            // Check if we're already on the Home tab
            if (currentRoute.name === 'Home') {
              // Prevent default navigation
              e.preventDefault();

              // Trigger scroll to top on HomeScreen
              navigation.navigate('Home', { scrollToTop: true });
            }
          },
        })}
      />
      <Tab.Screen
        name="Scanner"
        component={UnifiedScannerScreen}
        options={({ route }) => ({
          title: 'Scanner',
          tabBarAccessibilityLabel: 'Scanner, Scan ingredient labels',
          tabBarIcon: ({ focused, color }) => (
            <SimpleTabIcon
              name="scan-outline"
              focusedName="scan"
              focused={focused}
              color={color}
              size={28}
              customIcon="scanner"
            />
          ),
          tabBarStyle: (route.params as any)?.hideTabBar ? { display: 'none' } : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 83,
            backgroundColor: 'transparent',
            borderTopWidth: 1,
            borderTopColor: theme.colors.neutral.BG2,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 32,
          },
        })}
      />
      <Tab.Screen
        name="Submit"
        component={SubmissionScreen}
        options={{
          title: 'Submit',
          tabBarAccessibilityLabel: 'Submit, Add a food suggestion',
          tabBarIcon: ({ focused, color }) => (
            <SimpleTabIcon
              name="add-circle-outline"
              focusedName="add-circle"
              focused={focused}
              color={color}
              size={28}
              customIcon="add"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarAccessibilityLabel: 'Favorites, View your favorite foods',
          tabBarIcon: ({ focused, color }) => (
            <SimpleTabIcon
              name="heart-outline"
              focusedName="heart"
              focused={focused}
              color={color}
              size={28}
              customIcon="heart"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ route }) => ({
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile, View your profile and settings',
          tabBarIcon: ({ focused, color }) => (
            <ProfileTabIcon color={color} size={28} focused={focused} />
          ),
          tabBarStyle: (route.params as any)?.hideTabBar ? { display: 'none' } : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 83,
            backgroundColor: 'transparent',
            borderTopWidth: 1,
            borderTopColor: theme.colors.neutral.BG2,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 32,
          },
        })}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
export function RootNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen 
        name="AisleMenu" 
        component={AisleMenuView}
      />
      <Stack.Screen 
        name="AisleDetail" 
        component={AisleDetailView}
      />
      <Stack.Screen
        name="FoodDetail"
        component={FoodDetailScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="UserReviews"
        component={UserReviewsScreen}
      />
      <Stack.Screen
        name="UserContributions"
        component={UserContributionsScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />
      <Stack.Screen
        name="IngredientScanner"
        component={IngredientScannerScreen}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  fixedTabBarBackground: {
    backgroundColor: `${theme.colors.neutral.BG}F2`, // 95% opacity (F2 = 242/255 ≈ 95%)
  },
});