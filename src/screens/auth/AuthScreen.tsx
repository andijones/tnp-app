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
  Keyboard,
} from 'react-native';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { logger } from '../../utils/logger';
import { formatErrorForDisplay, ValidationErrors } from '../../utils/errorHandling';

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'resetSuccess';

export const AuthScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
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

    if (currentView === 'signup' && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (currentView === 'login') {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          const formattedError = formatErrorForDisplay(error);
          Alert.alert(
            formattedError.title,
            formattedError.message,
            formattedError.actionText ? [
              { text: 'OK', style: 'default' }
            ] : undefined
          );
          return;
        }
      } else if (currentView === 'signup') {
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
          const formattedError = formatErrorForDisplay(error);
          Alert.alert(
            formattedError.title,
            formattedError.message,
            formattedError.actionText ? [
              { text: 'OK', style: 'default' }
            ] : undefined
          );
          return;
        }

        if (data.user && !data.session) {
          Alert.alert(
            'Check your email',
            'We\'ve sent a confirmation link to ' + email.trim() + '. Please click the link to verify your account and complete registration.',
            [{ text: 'OK', onPress: () => setCurrentView('login') }]
          );
        }
      }
    } catch (error) {
      const formattedError = formatErrorForDisplay(error);
      Alert.alert(formattedError.title, formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Validate email before sending reset
    if (!email.trim()) {
      setErrors({ ...errors, email: 'Please enter your email address' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'thenakedpantry://auth/callback',
      });

      if (error) {
        const formattedError = formatErrorForDisplay(error);
        Alert.alert(formattedError.title, formattedError.message);
        return;
      }

      // Show success screen
      setCurrentView('resetSuccess');
    } catch (error) {
      const formattedError = formatErrorForDisplay(error);
      Alert.alert(formattedError.title, formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    setCurrentView('login');
    setEmail('');
    setPassword('');
    setFullName('');
    setErrors({ email: '', password: '', fullName: '' });
  };

  // Render forgot password view
  const renderForgotPasswordView = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.forgotPasswordContent}>
        <Image
          source={require('../../../assets/FPW.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Forgotten your password?</Text>
          <Text style={styles.body}>
            Don't worry… even Sherlock needed clues sometimes. Just enter your email address below and we will send a reset link.
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
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
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title={loading ? 'Sending...' : 'Send reset link'}
            onPress={handleForgotPassword}
            disabled={loading}
            variant="secondary"
          />
        </View>

        <TouchableOpacity
          style={styles.returnHomeButton}
          onPress={handleReturnHome}
          activeOpacity={0.8}
        >
          <Text style={styles.returnHomeButtonText}>← Return home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render success view
  const renderSuccessView = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.forgotPasswordContent}>
        <Image
          source={require('../../../assets/Inbox.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Check your inbox</Text>
          <Text style={[styles.body, { color: '#737373' }]}>
            We have sent a link and instructions to your email on how to reset your password.
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <TouchableOpacity
          style={styles.returnHomeButton}
          onPress={handleReturnHome}
          activeOpacity={0.8}
        >
          <Text style={styles.returnHomeButtonText}>← Return home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.contentContainer}
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
          >
            {/* Show different views based on currentView */}
            {currentView === 'forgotPassword' ? (
              renderForgotPasswordView()
            ) : currentView === 'resetSuccess' ? (
              renderSuccessView()
            ) : (
              <>
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
                  {currentView === 'login' ? (
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
                  onPress={() => setCurrentView('forgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>

                {/* Create Account Button */}
                <View style={styles.createAccountSection}>
                  <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={() => setCurrentView('signup')}
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
                    onPress={() => setCurrentView('login')}
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
              </>
            )}
          </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28.5, // (393 - 336) / 2 = 28.5px from Figma
    paddingTop: 112, // Top spacing for login/signup
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40, // Figma 40px spacing
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
    marginVertical: 24, // Figma 24px spacing
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
    gap: 12, // Figma 12px gap
    marginBottom: 24, // Figma 24px
  },

  // Forgot Password
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 24, // Spacing from button
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
    marginTop: 80, // Figma 80px spacing between sections
  },
  createAccountButton: {
    height: 52, // Match Figma height
    backgroundColor: '#EBEAE4', // Neutral-BG2 from Figma
    borderRadius: 9999, // Fully rounded pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '700', // Bold from Figma
    color: '#525252', // Neutral-600
    letterSpacing: -0.48,
  },

  // Forgot Password & Success Views
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordContent: {
    alignItems: 'center',
    gap: 24, // Figma 24px gap
    marginBottom: 40, // Figma 40px gap to form
    maxWidth: 300, // Figma 300px max width for centered content
  },
  illustrationImage: {
    width: 120, // Figma 120px
    height: 120, // Figma 120px
  },
  textContainer: {
    gap: 8, // Figma 8px gap between heading and body
    alignItems: 'center',
  },
  heading: {
    fontSize: 22, // Figma Heading2
    fontWeight: '700',
    lineHeight: 28,
    color: '#262626', // Neutral-800
    letterSpacing: -0.44,
    textAlign: 'center',
  },
  body: {
    fontSize: 13, // Figma Body
    fontWeight: '400',
    lineHeight: 17,
    color: '#404040', // Neutral-700
    letterSpacing: -0.13,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 40, // Figma 40px gap
    marginBottom: 24,
  },
  returnHomeButton: {
    height: 52,
    backgroundColor: '#EBEAE4', // Neutral-BG2
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnHomeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#525252', // Neutral-600
    letterSpacing: -0.48,
  },
});
