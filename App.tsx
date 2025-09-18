import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadFonts } from './src/utils/fonts';

const linking = {
  prefixes: ['tnpclean://'],
  config: {
    screens: {
      Auth: '*',
    },
  },
};

const AppContent: React.FC = () => {
  const { session, loading } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue without fonts if loading fails
      }
    };

    initApp();
  }, []);

  if (loading || !fontsLoaded) return null;

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