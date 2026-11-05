import { router } from 'expo-router';
import { useState } from 'react';

import { EMPTY_LISTING, ListingForm } from '@/components/listing-form';
import { Screen } from '@/components/screen';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { createListing } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function SellScreen() {
  const { status, session, profile } = useAuthStore();
  const [formKey, setFormKey] = useState(0);
  const [progress, setProgress] = useState<string | null>(null);

  if (status !== 'signedIn' || !session) {
    return <SignInPrompt title="Sell" message="Sign in to list items and run auctions." />;
  }

  return (
    <Screen title="Sell an item">
      <ListingForm
        key={formKey}
        defaultValues={{ ...EMPTY_LISTING, region: profile?.region ?? '' }}
        submitLabel="Publish listing"
        withPhotos
        busyLabel={progress}
        onSubmit={async (values, photos) => {
          if (!supabase) return 'The app is not connected to a backend yet.';
          const result = await createListing(supabase, session.user.id, values, photos, (done, total) =>
            setProgress(done < total ? `Uploading photo ${done + 1} of ${total}…` : 'Publishing…'),
          );
          setProgress(null);
          if (!result.ok) return result.message;
          setFormKey((k) => k + 1); // fresh form for the next item
          router.push({ pathname: '/listing/[id]', params: { id: result.data.id } });
          return null;
        }}
      />
    </Screen>
  );
}
