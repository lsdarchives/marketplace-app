import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { Database, Profile } from '@marketplace/shared';

import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
};

export const useAuthStore = create<AuthState>(() => ({
  status: 'loading',
  session: null,
  profile: null,
}));

export const setProfile = (profile: Profile) => useAuthStore.setState({ profile });

async function loadProfile(client: SupabaseClient<Database>, userId: string) {
  const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  // Ignore the result if the user changed while the request was in flight.
  if (useAuthStore.getState().session?.user.id === userId) {
    useAuthStore.setState({ profile: data ?? null });
  }
}

/**
 * Keeps the store in sync with Supabase Auth. Call once at app start; returns an unsubscribe.
 * onAuthStateChange emits INITIAL_SESSION immediately, so no separate getSession() is needed.
 */
export function initAuth(client: SupabaseClient<Database> | null = supabase): () => void {
  if (!client) {
    useAuthStore.setState({ status: 'signedOut', session: null, profile: null });
    return () => {};
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      useAuthStore.setState({ status: 'signedOut', session: null, profile: null });
      return;
    }

    const previous = useAuthStore.getState();
    const sameUser = previous.session?.user.id === session.user.id;
    useAuthStore.setState({
      status: 'signedIn',
      session,
      profile: sameUser ? previous.profile : null,
    });

    // Token refreshes for the same user don't need a profile reload. Supabase advises against
    // awaiting other client calls inside this callback, so defer the query.
    if (!sameUser || !previous.profile) {
      setTimeout(() => void loadProfile(client, session.user.id), 0);
    }
  });

  return () => subscription.unsubscribe();
}
