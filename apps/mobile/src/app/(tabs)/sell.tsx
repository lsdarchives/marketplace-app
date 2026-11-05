import { ComingSoon } from '@/components/coming-soon';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { useAuthStore } from '@/stores/auth';

export default function SellScreen() {
  const signedIn = useAuthStore((state) => state.status === 'signedIn');

  if (!signedIn) {
    return <SignInPrompt title="Sell" message="Sign in to list items and run auctions." />;
  }
  return (
    <ComingSoon
      title="Sell"
      description="List an item in under a minute: snap photos, set a price or start an auction."
      increment="Increment 2"
    />
  );
}
