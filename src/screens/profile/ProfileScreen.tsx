import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { Button } from '../../components/common/Button';
import { ProfilePicture } from '../../components/common/ProfilePicture';
import { Input } from '../../components/common/Input';
import { supabase } from '../../services/supabase/config';
import { useUser } from '../../hooks/useUser';

export const ProfileScreen: React.FC = () => {
  const { user, profile, loading, error, updateProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    instagram: '',
    bio: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        instagram: profile.instagram || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);


  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty strings to avoid overwriting with null values
      const updates = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );
      
      console.log('Attempting to save profile updates:', updates);
      await updateProfile(updates);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', `Failed to update profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        instagram: profile.instagram || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
    setEditing(false);
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Camera roll permission is required to change your profile picture.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        setFormData(prev => ({ ...prev, avatar_url: pickerResult.assets[0].uri }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };


  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture
                imageUrl={editing && formData.avatar_url ? formData.avatar_url : profile?.avatar_url}
                fullName={profile?.full_name}
                email={user?.email}
                size="large"
                style={styles.profilePicture}
              />
              {editing && (
                <TouchableOpacity 
                  style={styles.editImageButton}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="camera-outline" 
                    size={16} 
                    color={theme.colors.background} 
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {profile?.full_name || 'Add your name'}
              </Text>
              {profile?.username && (
                <Text style={styles.userHandle}>@{profile.username}</Text>
              )}
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
          
          {!editing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditing(true)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={theme.colors.text.secondary} 
              />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Fields */}
        <View style={styles.profileFieldsContainer}>
          {editing ? (
            <View style={styles.editingContainer}>
              <View style={styles.editSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                />
                
                <Input
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                  multiline
                />
              </View>
              
              <View style={styles.editSection}>
                <Text style={styles.sectionTitle}>Social</Text>
                <Input
                  label="Username"
                  placeholder="your_username"
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                />
                
                <Input
                  label="Instagram"
                  placeholder="your_instagram"
                  value={formData.instagram}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, instagram: text }))}
                />
              </View>
              
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelLinkButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </TouchableOpacity>
                <Button
                  title={saving ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.primarySaveButton}
                />
              </View>
              
              {saving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.savingText}>Saving changes...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.profileInfoContainer}>
              {profile?.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioText}>{profile.bio}</Text>
                </View>
              )}
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailCard}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{user?.email}</Text>
                  </View>
                </View>
                
                {profile?.username && (
                  <View style={styles.detailCard}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Username</Text>
                      <Text style={styles.detailValue}>@{profile.username}</Text>
                    </View>
                  </View>
                )}
                
                {profile?.instagram && (
                  <View style={styles.detailCard}>
                    <Ionicons name="logo-instagram" size={20} color={theme.colors.text.secondary} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Instagram</Text>
                      <Text style={styles.detailValue}>@{profile.instagram}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>The Naked Pantry v1.0</Text>
          <Text style={styles.appInfoText}>Made with care for healthy eating</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  header: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  profilePictureContainer: {
    position: 'relative',
    marginRight: theme.spacing.lg,
  },
  
  profilePicture: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  editImageButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  profileInfo: {
    flex: 1,
  },
  
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
    letterSpacing: -0.5,
  },
  
  userHandle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs / 2,
    fontWeight: '500',
  },
  
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
  
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.full,
    minWidth: 70,
    justifyContent: 'center',
  },
  
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs / 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  saveButtonText: {
    color: theme.colors.success,
  },
  
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  
  cancelLinkButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  cancelLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  primarySaveButton: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  profileFieldsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  
  editingContainer: {
    marginBottom: theme.spacing.xl,
  },
  
  editSection: {
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.3,
  },
  
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  
  savingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  
  profileInfoContainer: {
    marginBottom: theme.spacing.xl,
  },
  
  bioSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  
  bioText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontWeight: '400',
    textAlign: 'left',
  },
  
  detailsGrid: {
    gap: theme.spacing.sm,
  },
  
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  
  detailContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  detailLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  detailValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  signOutContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: 'auto' as any,
    marginBottom: theme.spacing.xl,
  },
  
  signOutButton: {
    borderColor: theme.colors.error,
  },
  
  appInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  
  appInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.hint,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },

  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },

  userBio: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});