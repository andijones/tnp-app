import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase/config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

class GoogleSignInService {
  private getRedirectUrl(): string {
    if (Platform.OS === 'web') {
      // For web, use the exact URL where our app is hosted
      // This needs to match what's configured in Supabase dashboard
      return window.location.origin;
    } else {
      // For mobile, use the Expo auth proxy
      return 'https://auth.expo.io/@anonymous/nakedpantryapp';
    }
  }

  constructor() {
    console.log('Google Sign-In Service initialized');
    console.log('Platform:', Platform.OS);
    console.log('Redirect URL:', this.getRedirectUrl());
  }

  async signIn() {
    try {
      const redirectUrl = this.getRedirectUrl();

      console.log('==========================================');
      console.log('Starting Google OAuth flow...');
      console.log('Platform:', Platform.OS);
      console.log('Redirect URL:', redirectUrl);
      console.log('==========================================');

      if (Platform.OS === 'web') {
        // For web, use the standard Supabase OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        console.log('Supabase OAuth response:', { data, error });

        if (error) {
          console.error('Supabase OAuth Error:', error);
          return { data: null, error };
        }

        // For web, the redirect happens automatically
        // The session will be available after the redirect
        return { data, error: null };
      } else {
        // For mobile, use the WebBrowser approach
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        console.log('Supabase OAuth response:', { data, error });

        if (error) {
          console.error('Supabase OAuth Error:', error);
          throw error;
        }

        if (data?.url) {
          console.log('Opening OAuth URL in browser...');

          // Open the OAuth URL in a web browser
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          console.log('Browser result:', result);

          if (result.type === 'success' && result.url) {
            console.log('OAuth success, processing result...');

            // The URL should contain auth tokens
            // Let's wait a moment for Supabase to process the callback
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if we now have a session
            const { data: sessionData } = await supabase.auth.getSession();

            if (sessionData.session) {
              console.log('Session established successfully');
              return { data: sessionData, error: null };
            } else {
              console.log('No session found, auth may have failed');
              return { data: null, error: new Error('Authentication failed - no session created') };
            }
          } else if (result.type === 'cancel') {
            return { data: null, error: new Error('User cancelled the sign-in process') };
          } else {
            return { data: null, error: new Error('OAuth flow failed') };
          }
        } else {
          throw new Error('No OAuth URL received from Supabase');
        }
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
      return { error: null };
    } catch (error: any) {
      console.error('Sign-Out Error:', error);
      return { error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export const googleSignInService = new GoogleSignInService();