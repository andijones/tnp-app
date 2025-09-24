import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { googleSignInService } from '../../services/GoogleSignInService';
import { theme } from '../../theme';
import { Button } from '../common/Button';

interface GoogleSignInButtonProps {
  onSignInSuccess?: () => void;
  onSignInError?: (error: Error) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
  onSignInError
}) => {
  const [loading, setLoading] = useState(false);

  // Add debug log on component mount
  React.useEffect(() => {
    console.log('🔵 GoogleSignInButton component mounted');
  }, []);

  const handleGoogleSignIn = async () => {
    console.log('=== GOOGLE SIGN-IN BUTTON CLICKED ===');
    if (loading) return;

    setLoading(true);
    try {
      console.log('About to call googleSignInService.signIn()');
      const { data, error } = await googleSignInService.signIn();
      console.log('Result from googleSignInService:', { data, error });

      if (error) {
        console.error('Google Sign-In Error:', error);

        // Show more helpful error messages
        let errorMessage = error.message || 'Failed to sign in with Google';

        if (errorMessage.includes('Google Client ID not configured')) {
          errorMessage = 'Google Sign-In is not configured yet. Please ask the developer to set up the Google OAuth client ID.';
        } else if (errorMessage.includes('cancelled')) {
          errorMessage = 'Sign in was cancelled. Please try again.';
        } else if (errorMessage.includes('malformed')) {
          errorMessage = 'Google configuration error. Please check the OAuth settings.';
        }

        Alert.alert('Sign In Error', errorMessage);
        onSignInError?.(error);
      } else if (data) {
        console.log('Signed in successfully:', data.user?.email);
        onSignInSuccess?.();
      }
    } catch (error: any) {
      console.error('Unexpected Google Sign-In Error:', error);
      Alert.alert('Sign In Error', 'An unexpected error occurred');
      onSignInError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <View style={styles.googleIconContainer}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );

  return (
    <Button
      title={loading ? 'Signing in...' : 'Continue with Google'}
      onPress={handleGoogleSignIn}
      disabled={loading}
      variant="tertiary"
      leftIcon={loading ? <ActivityIndicator size="small" color="#4285f4" /> : <GoogleIcon />}
      style={styles.customButtonStyle}
    />
  );
};

const styles = StyleSheet.create({
  customButtonStyle: {
    marginVertical: 8,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285f4',
    fontFamily: 'Inter',
  },
});

export default GoogleSignInButton;