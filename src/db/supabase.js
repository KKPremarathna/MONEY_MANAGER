import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_URL !== '' &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== ''
  );
};

export const supabase = createClient(
  isSupabaseConfigured() ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
