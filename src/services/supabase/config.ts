import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://uacihrlnwlqhpbobzajs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2locmxud2xxaHBib2J6YWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTE2MjUsImV4cCI6MjA2MDEyNzYyNX0.NKoj5Olfg3sxPX0p3AT4POlxs4wmHa3XmcAIXEttxXU';

// Check if we're in a valid environment
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable session detection from URL for OAuth callback
  },
});

// Test the connection
console.log('Supabase client created:', !!supabase);