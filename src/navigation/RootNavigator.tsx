// src/navigation/RootNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
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
import { UserReviewsScreen } from '../screens/profile/UserReviewsScreen';
import { UserContributionsScreen } from '../screens/profile/UserContributionsScreen';
import { ProfilePicture } from '../components/common/ProfilePicture';
import { useUser } from '../hooks/useUser';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Drawer removed – Aisle browsing lives as a regular stack screen

// Custom Floating Tab Bar Background
function FloatingTabBarBackground({ style }: any) {
  return (
    <View style={[StyleSheet.absoluteFillObject, { paddingHorizontal: 20 }]}>
      <View style={styles.floatingContainer}>
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurContainer}
        >
          <View style={styles.glassOverlay} />
        </BlurView>
      </View>
    </View>
  );
}

// Animated Tab Icon Component
function AnimatedTabIcon({
  name,
  focusedName,
  focused,
  color,
  size
}: {
  name: string;
  focusedName: string;
  focused: boolean;
  color: string;
  size: number;
}) {
  const scaleAnim = React.useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 0.85,
        useNativeDriver: true,
        friction: 4,
        tension: 80,
      }),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: focused ? -4 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 5,
        }),
      ]),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: bounceAnim }
        ],
      }}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

// Profile Tab Icon Component
function ProfileTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { user, profile, loading } = useUser();
  const scaleAnim = React.useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.15 : 0.85,
      useNativeDriver: true,
      friction: 4,
      tension: 80,
    }).start();
  }, [focused, scaleAnim]);

  if (loading) {
    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? color : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ProfilePicture
        imageUrl={profile?.avatar_url}
        fullName={profile?.full_name}
        email={user?.email}
        size="small"
      />
    </Animated.View>
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
          bottom: 30,
          left: 0,
          right: 0,
          height: 68,
          borderRadius: 34,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 15,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: '#1F5932',
        tabBarInactiveTintColor: 'rgba(31, 89, 50, 0.5)',
        tabBarBackground: () => <FloatingTabBarBackground style={undefined} />,
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={IngredientScannerScreen}
        options={({ route }) => ({
          title: 'Scanner',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name="scan-outline"
              focusedName="scan"
              focused={focused}
              color={color}
              size={28}
            />
          ),
          tabBarStyle: (route.params as any)?.hideTabBar ? { display: 'none' } : {
            position: 'absolute',
            bottom: 30,
            left: 0,
            right: 0,
            height: 68,
            borderRadius: 34,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 15,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 12,
          },
        })}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'All Foods',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name="nutrition-outline"
              focusedName="nutrition"
              focused={focused}
              color={color}
              size={28}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Submit"
        component={SubmissionScreen}
        options={{
          title: 'Submit',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name="add-circle-outline"
              focusedName="add-circle"
              focused={focused}
              color={color}
              size={28}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name="heart-outline"
              focusedName="heart"
              focused={focused}
              color={color}
              size={28}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <ProfileTabIcon color={color} size={28} focused={focused} />
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
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 34,
  },
});