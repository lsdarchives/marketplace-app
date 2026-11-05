import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@marketplace/shared';

import { SecureSessionStorage } from './secure-session-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Typed Supabase client, or `null` when the app has no backend configured
 * (see apps/mobile/.env.example). Screens should handle the null case gracefully.
 *
 * Only the public anon key ever ships in the app; all authorization is enforced by
 * Postgres row-level security on the server.
 */
export const supabase: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: {
          // On web the default (localStorage) is used; native keeps the session encrypted.
          storage: Platform.OS === 'web' ? undefined : new SecureSessionStorage(),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Only refresh tokens while the app is in the foreground (recommended for React Native).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
