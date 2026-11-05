import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackendStatusCard } from '@/components/backend-status-card';
import { ListingCard } from '@/components/listing-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBackendStatus } from '@/hooks/use-backend-status';
import { useCategories } from '@/hooks/use-categories';
import { useFeed } from '@/hooks/use-feed';
import { photoUrl } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const categories = useCategories();
  const feed = useFeed(category);
  const backend = useBackendStatus();

  const header = (
    <View style={styles.header}>
      <ThemedText type="subtitle" accessibilityRole="header">
        Marketplace
      </ThemedText>
      {backend.status !== 'online' ? (
        <BackendStatusCard status={backend.status} onRetry={backend.refresh} />
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            selected={category === c.slug}
            onPress={() => setCategory(c.slug)}
          />
        ))}
      </ScrollView>
      {feed.error ? (
        <ThemedText type="small" themeColor="danger">
          {feed.error}
        </ThemedText>
      ) : null}
    </View>
  );

  const empty = feed.loading ? (
    <ActivityIndicator style={styles.spinner} />
  ) : (
    <ThemedView type="backgroundElement" style={styles.empty}>
      <ThemedText type="smallBold">
        {category ? 'Nothing in this category yet' : 'No listings yet'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Be the first: it takes under a minute to list something.
      </ThemedText>
      <Button title="Sell something" onPress={() => router.push('/sell')} />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={feed.loadingMore ? <ActivityIndicator style={styles.spinner} /> : null}
          renderItem={({ item }) => {
            const cover = item.listing_images[0]?.path;
            return (
              <ListingCard
                item={item}
                imageUrl={cover && supabase ? photoUrl(supabase, cover) : null}
              />
            );
          }}
          onEndReached={feed.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} />
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  column: { gap: Spacing.three },
  spinner: { marginVertical: Spacing.four },
  empty: { padding: Spacing.four, borderRadius: Spacing.four, gap: Spacing.two },
});
