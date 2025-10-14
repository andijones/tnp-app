import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: '',
      fullName: '',
    };

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Login Error', error.message);
          return;
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          Alert.alert('Sign Up Error', error.message);
          return;
        }

        if (data.user && !data.session) {
          Alert.alert(
            'Check your email',
            'Please check your email for a confirmation link to complete your registration.'
          );
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({ email: '', password: '', fullName: '' });
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact support to reset your password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blur effect at bottom */}
      <View style={styles.blurBackground} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {isLogin ? (
              <>
                {/* Login Form */}
                <GoogleSignInButton />

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.inputsContainer}>
                  <Input
                    label="EMAIL ADDRESS"
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Input
                    label="PASSWORD"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    error={errors.password}
                  />
                </View>

                <Button
                  title={loading ? 'Signing In...' : 'Sign In'}
                  onPress={handleAuth}
                  disabled={loading}
                  variant="secondary"
                />

                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>

                {/* Create Account Button */}
                <View style={styles.createAccountSection}>
                  <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={toggleMode}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createAccountButtonText}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Sign Up Form */}
                <GoogleSignInButton />

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.inputsContainer}>
                  <Input
                    label="FULL NAME"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    error={errors.fullName}
                  />

                  <Input
                    label="EMAIL ADDRESS"
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Input
                    label="PASSWORD"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    error={errors.password}
                  />
                </View>

                <Button
                  title={loading ? 'Creating Account...' : 'Create Account'}
                  onPress={handleAuth}
                  disabled={loading}
                  variant="secondary"
                />

                {/* Back to Login */}
                <View style={styles.createAccountSection}>
                  <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={toggleMode}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createAccountButtonText}>
                      Already have an account? Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F0', // Warm background from Figma
  },
  blurBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(224, 255, 231, 0.3)', // Light green blur effect
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 98.5,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logo: {
    height: 64,
    width: 107.567,
  },
  formContainer: {
    width: '100%',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 11,
    fontWeight: '500',
    color: '#A3A3A3', // Neutral-400
    letterSpacing: 0.33,
    textTransform: 'uppercase',
  },

  // Inputs
  inputsContainer: {
    gap: 12,
    marginBottom: 24,
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#26733E', // Green-900
    textDecorationLine: 'underline',
    letterSpacing: -0.48,
  },

  // Create Account Section
  createAccountSection: {
    marginTop: 80,
  },
  createAccountButton: {
    height: 48,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(161, 153, 105, 0.3)',
    shadowColor: 'rgba(90, 82, 34, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#404040', // Neutral-700
    letterSpacing: -0.48,
  },
});
