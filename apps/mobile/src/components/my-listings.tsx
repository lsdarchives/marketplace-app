import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { fetchMyListings, photoUrl, type FeedItem } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

import { ListingCard } from './listing-card';
import { ThemedText } from './themed-text';

/** The signed-in seller's own listings, refreshed whenever the Profile tab is focused. */
export function MyListings({ userId }: { userId: string }) {
  const [items, setItems] = useState<FeedItem[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!supabase) return;
      void fetchMyListings(supabase, userId).then(setItems);
    }, [userId]),
  );

  if (!items) return null;

  // Two-column grid without a nested FlatList (this sits inside the screen's ScrollView).
  const rows: FeedItem[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">My listings ({items.length})</ThemedText>
      {items.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          You haven’t listed anything yet. Tap Sell to get started.
        </ThemedText>
      ) : (
        rows.map((row) => (
          <View key={row[0]!.id} style={styles.row}>
            {row.map((item) => {
              const cover = item.listing_images[0]?.path;
              return (
                <ListingCard
                  key={item.id}
                  item={item}
                  imageUrl={cover && supabase ? photoUrl(supabase, cover) : null}
                />
              );
            })}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three },
  spacer: { flex: 1 },
});
