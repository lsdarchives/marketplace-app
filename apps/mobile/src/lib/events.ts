import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@marketplace/shared';

import { supabase } from './supabase';

/** Engagement events clients may log. Lifecycle events (created/sold) are logged by the DB. */
export type ClientEventType = 'listing_viewed' | 'listing_contacted';

/**
 * Fire-and-forget analytics for future pricing and fraud models. Never blocks the UI and never
 * throws: losing an event is acceptable, breaking a screen is not.
 */
export function logEvent(
  type: ClientEventType,
  listingId: string,
  properties: { [key: string]: Json | undefined } = {},
  client: SupabaseClient<Database> | null = supabase,
): void {
  if (!client) return;
  client
    .from('events')
    .insert({ event_type: type, listing_id: listingId, properties })
    .then(
      () => undefined,
      () => undefined,
    );
}
