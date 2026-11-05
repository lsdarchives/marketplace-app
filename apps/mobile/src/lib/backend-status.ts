import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@marketplace/shared';

export type BackendStatus = 'unconfigured' | 'checking' | 'online' | 'offline';

/**
 * Round-trips to the API and database by counting public profiles (no rows transferred).
 * Succeeds only if the API is reachable, the key is valid and the migrations have run.
 */
export async function checkBackend(
  client: SupabaseClient<Database> | null,
): Promise<Exclude<BackendStatus, 'checking'>> {
  if (!client) return 'unconfigured';
  try {
    const { error } = await client.from('profiles').select('id', { count: 'exact', head: true });
    return error ? 'offline' : 'online';
  } catch {
    return 'offline';
  }
}
