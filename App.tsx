import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { NavigationContainer } from '@react-navigation/native';

import { supabase } from './src/services/supabase/config';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme';
import { loadFonts } from './src/utils/fonts';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !fontsLoaded) return null;

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {session && session.user ? <RootNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
}