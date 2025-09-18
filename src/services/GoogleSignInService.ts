import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase/config';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

class GoogleSignInService {
  private readonly redirectUrl = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  constructor() {
    console.log('Google Sign-In Service initialized');
    console.log('Redirect URL:', this.redirectUrl);
  }

  async signIn() {
    try {
      console.log('Starting Google OAuth flow...');

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth Error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);

        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          this.redirectUrl
        );

        console.log('WebBrowser result:', result);

        if (result.type === 'success') {
          // Parse the URL to get the session
          const url = result.url;
          const urlParts = url.split('#');

          if (urlParts.length > 1) {
            const params = new URLSearchParams(urlParts[1]);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken) {
              // Set the session in Supabase
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (sessionError) {
                throw sessionError;
              }

              return { data: sessionData, error: null };
            }
          }
        } else if (result.type === 'cancel') {
          return { data: null, error: new Error('User cancelled the sign-in process') };
        }

        throw new Error('OAuth flow failed');
      } else {
        throw new Error('No OAuth URL received from Supabase');
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