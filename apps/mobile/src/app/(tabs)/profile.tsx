import { ActivityIndicator } from 'react-native';

import { ProfileEditor } from '@/components/profile-editor';
import { Screen } from '@/components/screen';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { useAuthStore } from '@/stores/auth';

export default function ProfileScreen() {
  const { status, session, profile } = useAuthStore();

  if (status !== 'signedIn') {
    return (
      <SignInPrompt
        title="Profile"
        message="Sign in to set up your profile, save favourites and start selling."
      />
    );
  }

  return (
    <Screen title="Profile">
      {profile ? (
        <ProfileEditor key={profile.id} profile={profile} email={session?.user.email} />
      ) : (
        <ActivityIndicator />
      )}
    </Screen>
  );
}
