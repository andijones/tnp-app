import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';

type ScanMode = 'url' | 'manual';

export const ScannerScreen: React.FC = () => {
  const [scanMode, setScanMode] = useState<ScanMode>('manual');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [productUrl, setProductUrl] = useState('');

  const submitFoodSubmission = async () => {
    if (!productName.trim() || !ingredients.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit foods.');
        return;
      }

      const { error } = await supabase
        .from('foods')
        .insert({
          name: productName.trim(),
          description: ingredients.trim(),
          category: 'manual-submission',
          status: 'pending',
          user_id: user.id,
        });

      if (error) {
        console.error('Submission error:', error);
        Alert.alert('Error', 'Failed to submit food. Please try again.');
        return;
      }

      Alert.alert(
        'Success!',
        'Your food submission has been sent for review. Thank you!',
        [
          {
            text: 'OK',
            onPress: resetForm,
          },
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const submitUrlSubmission = async () => {
    if (!productUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid product URL.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit foods.');
        return;
      }

      const { error } = await supabase
        .from('food_links')
        .insert({
          user_id: user.id,
          url: productUrl.trim(),
          status: 'pending',
        });

      if (error) {
        console.error('URL submission error:', error);
        Alert.alert('Error', 'Failed to submit URL. Please try again.');
        return;
      }

      Alert.alert(
        'Success!',
        'Your URL submission has been received and will be processed soon.',
        [{ text: 'OK', onPress: resetForm }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setIngredients('');
    setProductUrl('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submit Food</Text>
        <Text style={styles.headerSubtitle}>
          Help grow our healthy food database
        </Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'manual' && styles.modeButtonActive]}
          onPress={() => setScanMode('manual')}
        >
          <Ionicons
            name="create"
            size={24}
            color={scanMode === 'manual' ? theme.colors.background : theme.colors.text.primary}
          />
          <Text style={[
            styles.modeButtonText,
            scanMode === 'manual' && styles.modeButtonTextActive
          ]}>
            Manual Entry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'url' && styles.modeButtonActive]}
          onPress={() => setScanMode('url')}
        >
          <Ionicons
            name="link"
            size={24}
            color={scanMode === 'url' ? theme.colors.background : theme.colors.text.primary}
          />
          <Text style={[
            styles.modeButtonText,
            scanMode === 'url' && styles.modeButtonTextActive
          ]}>
            URL Submit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {scanMode === 'manual' ? (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="create" size={32} color={theme.colors.primary} />
              <Text style={styles.formTitle}>Manual Entry</Text>
              <Text style={styles.formSubtitle}>
                Enter product information and ingredients manually.
              </Text>
            </View>

            <Input
              label="Product Name"
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
            />

            <Input
              label="Ingredients List"
              placeholder="Enter ingredients separated by commas"
              value={ingredients}
              onChangeText={setIngredients}
              multiline={true}
            />

            <Button
              title={loading ? 'Submitting...' : 'Submit Product'}
              onPress={submitFoodSubmission}
              disabled={loading}
              style={styles.submitButton}
            />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Ionicons name="link" size={32} color={theme.colors.primary} />
              <Text style={styles.formTitle}>Submit Product URL</Text>
              <Text style={styles.formSubtitle}>
                Paste a link to a product page and we'll extract the information.
              </Text>
            </View>

            <Input
              label="Product URL"
              placeholder="https://example.com/product/..."
              value={productUrl}
              onChangeText={setProductUrl}
            />

            <Button
              title={loading ? 'Submitting...' : 'Submit URL'}
              onPress={submitUrlSubmission}
              disabled={loading}
              style={styles.submitButton}
            />
          </View>
        )}
      </View>

      {/* Camera Note */}
      <View style={styles.cameraNote}>
        <Ionicons name="camera-outline" size={24} color={theme.colors.text.tertiary} />
        <Text style={styles.cameraNoteText}>
          Camera scanning will be added in a future update
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  header: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  headerSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  
  modeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  
  modeButtonTextActive: {
    color: theme.colors.background,
  },
  
  content: {
    flex: 1,
  },
  
  formContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  formHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  
  formTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  formSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  
  cameraNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.lg,
  },
  
  cameraNoteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.sm,
    fontStyle: 'italic',
  },
});