import type { Session } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react-native';

import type { Profile } from '@marketplace/shared';

import ProfileScreen from '@/app/(tabs)/profile';
import { useAuthStore } from '@/stores/auth';

const baseProfile: Profile = {
  id: 'u1',
  username: null,
  display_name: null,
  avatar_url: null,
  region: null,
  created_at: '2026-11-06T00:00:00Z',
  updated_at: '2026-11-06T00:00:00Z',
};

const session = { user: { id: 'u1', email: 'alice@test.local' } } as unknown as Session;

describe('Profile tab', () => {
  it('asks signed-out visitors to sign in', async () => {
    useAuthStore.setState({ status: 'signedOut', session: null, profile: null });
    await render(<ProfileScreen />);
    expect(screen.getByRole('button', { name: 'Sign in or create account' })).toBeTruthy();
  });

  it('prompts a brand-new user to create their profile', async () => {
    useAuthStore.setState({ status: 'signedIn', session, profile: baseProfile });
    await render(<ProfileScreen />);
    expect(screen.getByText(/Choose a username/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create profile' })).toBeTruthy();
    expect(screen.getByText('alice@test.local')).toBeTruthy();
  });

  it('shows saved details for an existing user', async () => {
    useAuthStore.setState({
      status: 'signedIn',
      session,
      profile: { ...baseProfile, username: 'alice', region: 'Cape Town' },
    });
    await render(<ProfileScreen />);
    expect(screen.getByDisplayValue('alice')).toBeTruthy();
    expect(screen.getByDisplayValue('Cape Town')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });
});
