import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/config';
import * as Linking from 'expo-linking';
import { logger } from '../utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth redirect URLs
    const handleUrl = (url: string) => {
      logger.log('📱 Deep link received:', url);
      if (url.includes('auth/callback')) {
        logger.log('🔗 Processing OAuth callback URL:', url);

        // Handle the callback URL - Supabase will process it automatically
        if (url.includes('#')) {
          // Extract tokens from URL hash
          const hashParams = new URLSearchParams(url.split('#')[1]);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            logger.log('🔑 Found tokens in URL, setting session...');
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).then(({ data, error }) => {
              if (error) {
                logger.error('❌ Error setting session:', error);
              } else {
                logger.log('✅ Session set successfully:', data.session?.user?.email);
              }
            });
          } else {
            logger.log('⚠️ No tokens found in callback URL');
          }
        }
      }
    };

    // Listen for incoming URLs
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    // Check if the app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        logger.log('📱 Initial URL:', url);
        handleUrl(url);
      }
    });

    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log('Auth state changed:', event, session?.user?.email);

        if (event === 'TOKEN_REFRESHED') {
          logger.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          logger.log('User signed out');
        } else if (event === 'SIGNED_IN') {
          logger.log('✅ User signed in:', session?.user?.email);
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session and handle invalid tokens
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Session error:', error);
          // Clear any invalid session data
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else {
          logger.log('Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        // Handle refresh token errors specifically
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          logger.log('Clearing invalid refresh token');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            logger.error('Error during signOut:', signOutError);
          }
        }
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription?.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};