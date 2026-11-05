import type { Session } from '@supabase/supabase-js';

import { initAuth, useAuthStore } from '@/stores/auth';

type Listener = (event: string, session: Session | null) => void;

function fakeSession(userId: string): Session {
  return { user: { id: userId, email: `${userId}@test.local` } } as unknown as Session;
}

/** Fake client: captures the auth listener and serves a profile per user id. */
function fakeClient() {
  let listener: Listener = () => {};
  const unsubscribe = jest.fn();
  const profileQuery = jest.fn(async (userId: string) => ({
    data: { id: userId, username: `user_${userId}` },
    error: null,
  }));

  const client = {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        listener = cb;
        return { data: { subscription: { unsubscribe } } };
      },
    },
    from: () => ({
      select: () => ({
        eq: (_column: string, userId: string) => ({ maybeSingle: () => profileQuery(userId) }),
      }),
    }),
  };

  return {
    client: client as unknown as Parameters<typeof initAuth>[0],
    emit: (event: string, session: Session | null) => listener(event, session),
    unsubscribe,
    profileQuery,
  };
}

const flush = async () => {
  jest.runAllTimers();
  await Promise.resolve();
  await Promise.resolve();
};

beforeEach(() => {
  jest.useFakeTimers();
  useAuthStore.setState({ status: 'loading', session: null, profile: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('initAuth', () => {
  it('is signed out when no backend is configured', () => {
    initAuth(null);
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('starts signed out when there is no stored session', () => {
    const fake = fakeClient();
    initAuth(fake.client);
    fake.emit('INITIAL_SESSION', null);
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', session: null });
  });

  it('signs in and loads the profile', async () => {
    const fake = fakeClient();
    initAuth(fake.client);
    fake.emit('SIGNED_IN', fakeSession('u1'));
    expect(useAuthStore.getState().status).toBe('signedIn');

    await flush();
    expect(useAuthStore.getState().profile).toMatchObject({ id: 'u1', username: 'user_u1' });
  });

  it('does not reload the profile on token refresh for the same user', async () => {
    const fake = fakeClient();
    initAuth(fake.client);
    fake.emit('SIGNED_IN', fakeSession('u1'));
    await flush();
    fake.emit('TOKEN_REFRESHED', fakeSession('u1'));
    await flush();

    expect(fake.profileQuery).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().profile).toMatchObject({ id: 'u1' });
  });

  it('clears everything on sign out', async () => {
    const fake = fakeClient();
    initAuth(fake.client);
    fake.emit('SIGNED_IN', fakeSession('u1'));
    await flush();
    fake.emit('SIGNED_OUT', null);

    expect(useAuthStore.getState()).toEqual({ status: 'signedOut', session: null, profile: null });
  });

  it('ignores a stale profile response after the user changes', async () => {
    const fake = fakeClient();
    initAuth(fake.client);
    fake.emit('SIGNED_IN', fakeSession('u1'));
    fake.emit('SIGNED_OUT', null); // before u1's profile query runs
    await flush();

    expect(useAuthStore.getState().profile).toBeNull();
  });

  it('unsubscribes on cleanup', () => {
    const fake = fakeClient();
    const cleanup = initAuth(fake.client);
    cleanup();
    expect(fake.unsubscribe).toHaveBeenCalled();
  });
});
