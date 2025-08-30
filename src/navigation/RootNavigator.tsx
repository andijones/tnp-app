// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Import your screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { AisleMenuView } from '../screens/aisles/AisleMenuScreen';
import { AisleDetailView } from '../screens/aisles/AisleDetailScreen';
import { FoodDetailScreen } from '../screens/food/FoodDetailScreen';
import { IngredientScannerScreen } from '../screens/scanner/IngredientScannerScreen';
import { SubmissionScreen } from '../screens/scanner/SubmissionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfilePicture } from '../components/common/ProfilePicture';
import { useUser } from '../hooks/useUser';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Drawer removed – Aisle browsing lives as a regular stack screen

// Profile Tab Icon Component
function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { user, profile, loading } = useUser();
  
  if (loading) {
    return <Ionicons name="person-outline" size={size} color={color} />;
  }
  
  return (
    <ProfilePicture
      imageUrl={profile?.avatar_url}
      fullName={profile?.full_name}
      email={user?.email}
      size="small"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  );
}

// Bottom Tab Navigator (Main App Navigation)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.surface,
          height: 85,
          paddingTop: 5,
          paddingBottom: 25,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'All Foods',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={IngredientScannerScreen}
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Submit"
        component={SubmissionScreen}
        options={{
          title: 'Submit',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <ProfileTabIcon color={color} size={size} />
          ),
        }}
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
      />
    </Stack.Navigator>
  );
}