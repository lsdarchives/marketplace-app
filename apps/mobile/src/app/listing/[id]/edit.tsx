import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { ListingForm } from '@/components/listing-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchListing, updateListing, type ListingDetail } from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewerId = useAuthStore((s) => s.session?.user.id);
  const [listing, setListing] = useState<ListingDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase || !id) return setListing(null);
    void fetchListing(supabase, id).then(setListing);
  }, [id]);

  if (listing === undefined) return <ActivityIndicator style={styles.spinner} />;
  if (!listing || listing.seller_id !== viewerId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>You can only edit your own listings.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ListingForm
          defaultValues={{
            title: listing.title,
            description: listing.description,
            price: (listing.price_cents / 100).toString(),
            category_slug: listing.category_slug,
            condition: listing.condition,
            brand: listing.brand ?? '',
            region: listing.region ?? '',
          }}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            if (!supabase) return 'The app is not connected to a backend yet.';
            const result = await updateListing(supabase, listing.id, values);
            if (!result.ok) return result.message;
            router.back();
            return null;
          }}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: MaxContentWidth, padding: Spacing.four },
  spinner: { marginTop: Spacing.six },
});
