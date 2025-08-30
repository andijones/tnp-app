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
          const profile: UserProfile = {
            id: user.id,
            full_name: profileData?.full_name || user.user_metadata?.full_name || null,
            avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
            bio: profileData?.bio || null,
          };

          setUserData({
            user,
            profile,
            loading: false,
            error: profileError && profileError.code !== 'PGRST116' ? profileError.message : null, // PGRST116 is "not found"
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

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    // Update local state
    setUserData(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : null,
    }));
  };

  return {
    ...userData,
    updateProfile,
  };
};