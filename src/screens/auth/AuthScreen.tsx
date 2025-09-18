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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
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
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Input
                  label="EMAIL ADDRESS"
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                />

                <Input
                  label="PASSWORD"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                />

                <Button
                  title={loading ? 'Signing In...' : 'Sign In'}
                  onPress={handleAuth}
                  disabled={loading}
                  variant="primary"
                  style={styles.signInButton}
                />

                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>

                <Button
                  title="Create Account"
                  onPress={toggleMode}
                  variant="tertiary"
                  style={styles.createAccountButton}
                />
              </>
            ) : (
              <>
                {/* Sign Up Form */}
                <GoogleSignInButton />

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

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
                />

                <Input
                  label="PASSWORD"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  error={errors.password}
                />

                <Button
                  title={loading ? 'Creating Account...' : 'Create Account'}
                  onPress={handleAuth}
                  disabled={loading}
                  variant="primary"
                  style={styles.signInButton}
                />

                <TouchableOpacity
                  style={styles.backToLoginContainer}
                  onPress={toggleMode}
                >
                  <Text style={styles.backToLoginText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
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
    backgroundColor: '#f5f4f0',
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 40,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  
  logo: {
    height: 80,
    width: 240,
  },
  
  formContainer: {
    width: '100%',
  },
  
  signInButton: {
    marginTop: 24,
    marginBottom: 32,
  },
  
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: theme.typography.subtitle.fontSize,
    fontFamily: theme.typography.subtitle.fontFamily,
    lineHeight: theme.typography.subtitle.lineHeight,
    letterSpacing: theme.typography.subtitle.letterSpacing,
    textDecorationLine: 'underline',
  },
  
  createAccountButton: {
    marginTop: 16,
  },
  
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  
  backToLoginText: {
    color: '#666',
    fontSize: theme.typography.subtitle.fontSize,
    fontFamily: theme.typography.subtitle.fontFamily,
    lineHeight: theme.typography.subtitle.lineHeight,
    letterSpacing: theme.typography.subtitle.letterSpacing,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dadce0',
  },

  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
    fontFamily: theme.typography.subtitle.fontFamily,
  },
});