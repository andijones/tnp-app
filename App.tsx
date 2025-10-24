import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { loadFonts } from './src/utils/fonts';
import { logger } from './src/utils/logger';

const linking = {
  prefixes: ['tnpclean://'],
  config: {
    screens: {
      Auth: {
        path: 'auth/callback',
      },
    },
  },
};

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Force minimum splash duration
        const [fontsResult] = await Promise.all([
          loadFonts(),
          new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second
        ]);
        setFontsLoaded(true);
      } catch (error) {
        logger.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue without fonts if loading fails
      }
    };

    initApp();
  }, []);

  // Wait for both auth and fonts to be ready
  useEffect(() => {
    if (!loading && fontsLoaded) {
      setAppReady(true);
    }
  }, [loading, fontsLoaded]);

  // Show splash screen until app is ready AND splash animation completes
  if (showSplash || !appReady) {
    return (
      <SplashScreen
        onAnimationComplete={() => {
          logger.log('Splash animation completed');
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {session && session.user ? <RootNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}