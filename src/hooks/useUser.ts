import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/config';
import { UserProfile } from '../types';

export interface UserData {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useUser = () => {
  const [userData, setUserData] = useState<UserData>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          if (mounted) {
            setUserData(prev => ({ ...prev, error: userError.message, loading: false }));
          }
          return;
        }

        if (!user) {
          if (mounted) {
            setUserData(prev => ({ ...prev, loading: false }));
          }
          return;
        }

        // Try to get profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (mounted) {
          // Create profile object combining user metadata and profile data
          // Prioritize profile table data, but fall back to user metadata
          const profile: UserProfile = {
            id: user.id,
            full_name: profileData?.full_name || user.user_metadata?.full_name || null,
            avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
            bio: profileData?.bio || user.user_metadata?.bio || null,
            username: profileData?.username || user.user_metadata?.username || null,
            instagram: profileData?.instagram || user.user_metadata?.instagram || null,
          };

          // Only show profile error if it's not a "not found" or RLS error
          const shouldShowError = profileError && 
            profileError.code !== 'PGRST116' && // "not found"
            !profileError.message.includes('row-level security');

          setUserData({
            user,
            profile,
            loading: false,
            error: shouldShowError ? profileError.message : null,
          });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching user data:', error);
          setUserData(prev => ({ ...prev, error: 'Failed to load user data', loading: false }));
        }
      }
    };

    fetchUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUserData();
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUserData({
              user: null,
              profile: null,
              loading: false,
              error: null,
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userData.user) {
      throw new Error('No user logged in');
    }

    console.log('Updating profile for user:', userData.user.id, 'with updates:', updates);
    
    try {
      // First, try to update existing profile
      let { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.user.id)
        .select();

      console.log('Update response:', { data, error });

      // If no rows were updated (profile doesn't exist), try to insert
      if (!error && (!data || data.length === 0)) {
        console.log('No existing profile found, attempting insert...');
        const insertResult = await supabase
          .from('profiles')
          .insert({
            id: userData.user.id,
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();
        
        data = insertResult.data;
        error = insertResult.error;
        console.log('Insert response:', { data, error });
      }

      if (error) {
        console.error('Supabase error:', error);
        
        // If it's an RLS error, try alternative approach using auth metadata
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          console.log('RLS error detected, trying auth metadata update...');
          
          // Update user metadata as fallback
          const { data: authData, error: authError } = await supabase.auth.updateUser({
            data: {
              ...userData.user.user_metadata,
              ...updates,
            }
          });
          
          if (authError) {
            throw new Error(`Authentication error: ${authError.message}`);
          }
          
          console.log('Updated via auth metadata:', authData);
          
          // Update local state with auth metadata
          setUserData(prev => ({
            ...prev,
            profile: prev.profile ? { ...prev.profile, ...updates } : {
              id: userData.user.id,
              ...updates
            },
          }));
          
          return;
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      // Update local state
      setUserData(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : {
          id: userData.user.id,
          ...updates
        },
      }));
      
      console.log('Profile updated successfully');
    } catch (err) {
      console.error('Profile update failed:', err);
      throw err;
    }
  };

  return {
    ...userData,
    updateProfile,
  };
};