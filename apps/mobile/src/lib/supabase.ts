import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@marketplace/shared';

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
          // Session persistence (expo-secure-store) is added with sign-in in Increment 1.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
