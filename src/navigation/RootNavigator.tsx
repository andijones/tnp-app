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
function ProfileTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { user, profile, loading } = useUser();
  
  if (loading) {
    return <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />;
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
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? color : 'transparent',
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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1F5932',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 84,
          paddingTop: 12,
          paddingBottom: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: '#44DB6D',
        tabBarInactiveTintColor: '#FFFFFF',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'All Foods',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "nutrition" : "nutrition-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={IngredientScannerScreen}
        options={{
          title: 'Scanner',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "scan" : "scan-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Submit"
        component={SubmissionScreen}
        options={{
          title: 'Submit',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <ProfileTabIcon color={color} size={size} focused={focused} />
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