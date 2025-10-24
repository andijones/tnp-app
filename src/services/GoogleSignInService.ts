import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase/config';
import { logger } from '../utils/logger';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

class GoogleSignInService {
  private getRedirectUrl(): string {
    if (Platform.OS === 'web') {
      // For web, use the exact URL where our app is hosted
      return window.location.origin;
    } else {
      // For mobile development, use the app scheme
      // In production, we'll need to use the Supabase callback URL
      return 'tnpclean://auth/callback';
    }
  }

  constructor() {
    logger.log('Google Sign-In Service initialized');
    logger.log('Platform:', Platform.OS);
    logger.log('Redirect URL:', this.getRedirectUrl());
  }

  async signIn() {
    try {
      const redirectUrl = this.getRedirectUrl();

      logger.log('==========================================');
      logger.log('Starting Google OAuth flow...');
      logger.log('Platform:', Platform.OS);
      logger.log('Redirect URL:', redirectUrl);
      logger.log('==========================================');

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

        logger.log('Supabase OAuth response:', { data, error });

        if (error) {
          logger.error('Supabase OAuth Error:', error);
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

        logger.log('Supabase OAuth response:', { data, error });

        if (error) {
          logger.error('Supabase OAuth Error:', error);
          throw error;
        }

        if (data?.url) {
          logger.log('Opening OAuth URL in browser...');

          // Open the OAuth URL in a web browser
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          logger.log('Browser result:', result);

          if (result.type === 'success' && result.url) {
            logger.log('✅ OAuth success! Processing callback URL:', result.url);

            // The result.url contains the callback with tokens
            if (result.url.includes('#')) {
              // Extract tokens from the callback URL
              const hashParams = new URLSearchParams(result.url.split('#')[1]);
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');

              if (accessToken && refreshToken) {
                logger.log('🔑 Setting session with tokens from callback...');

                // Set the session directly
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });

                if (sessionError) {
                  logger.error('❌ Error setting session:', sessionError);
                  throw sessionError;
                }

                if (sessionData.session) {
                  logger.log('✅ Session established successfully:', sessionData.session.user.email);
                  return { data: sessionData, error: null };
                } else {
                  throw new Error('Failed to create session with tokens');
                }
              } else {
                logger.log('⚠️ No tokens found in callback URL');
                throw new Error('No authentication tokens received');
              }
            } else {
              logger.log('⚠️ No hash found in callback URL');
              throw new Error('Invalid callback URL format');
            }
          } else if (result.type === 'cancel') {
            return { data: null, error: new Error('User cancelled the sign-in process') };
          } else {
            throw new Error(`OAuth flow failed: ${result.type}`);
          }
        } else {
          throw new Error('No OAuth URL received from Supabase');
        }
      }

    } catch (error: any) {
      logger.error('Google Sign-In Error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
      return { error: null };
    } catch (error: any) {
      logger.error('Sign-Out Error:', error);
      return { error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch (error) {
      logger.error('Get current user error:', error);
      return null;
    }
  }
}

export const googleSignInService = new GoogleSignInService();