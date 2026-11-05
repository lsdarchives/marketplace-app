import { ComingSoon } from '@/components/coming-soon';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { useAuthStore } from '@/stores/auth';

export default function InboxScreen() {
  const signedIn = useAuthStore((state) => state.status === 'signedIn');

  if (!signedIn) {
    return <SignInPrompt title="Inbox" message="Sign in to chat with buyers and sellers." />;
  }
  return (
    <ComingSoon
      title="Inbox"
      description="Chat with buyers and sellers, and get alerts when you're outbid."
      increment="Increment 5"
    />
  );
}
