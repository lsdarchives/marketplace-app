import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatPrice } from '@marketplace/shared';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FeedItem } from '@/lib/listings';

import { ThemedText } from './themed-text';

type Props = {
  item: FeedItem;
  imageUrl: string | null;
};

const STATUS_BADGES: Partial<Record<FeedItem['status'], string>> = {
  sold: 'Sold',
  draft: 'Draft',
};

export function ListingCard({ item, imageUrl }: Props) {
  const theme = useTheme();
  const badge = STATUS_BADGES[item.status];
  const price = formatPrice(item.price_cents, item.currency);

  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: item.id } }} asChild>
      <Pressable
        style={styles.card}
        accessibilityRole="link"
        accessibilityLabel={`${item.title}, ${price}${badge ? `, ${badge}` : ''}`}>
        <View style={[styles.imageWrap, { backgroundColor: theme.backgroundElement }]}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.image} contentFit="cover" transition={150} />
          ) : null}
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.text }]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {badge}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="smallBold">{price}</ThemedText>
        <ThemedText type="small" numberOfLines={2}>
          {item.title}
        </ThemedText>
        {item.region ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {item.region}
          </ThemedText>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: Spacing.half, marginBottom: Spacing.three },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginBottom: Spacing.one,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
});
