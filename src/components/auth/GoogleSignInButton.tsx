import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { googleSignInService } from '../../services/GoogleSignInService';
import { theme } from '../../theme';

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

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="#3c4043" style={styles.icon} />
        ) : (
          <View style={styles.icon}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
    fontFamily: theme.typography.subtitle.fontFamily,
  },
});

export default GoogleSignInButton;