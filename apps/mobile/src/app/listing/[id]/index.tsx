import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { conditionLabel, formatPrice, soldPriceSchema } from '@marketplace/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { logEvent } from '@/lib/events';
import {
  fetchListing,
  fetchSellerWhatsApp,
  photoUrl,
  setListingStatus,
  whatsappLink,
  type ListingDetail,
} from '@/lib/listings';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const viewerId = useAuthStore((s) => s.session?.user.id ?? null);
  const categories = useCategories();
  const [listing, setListing] = useState<ListingDetail | null | undefined>(undefined);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const loggedView = useRef(false);

  const load = useCallback(async () => {
    if (!supabase || !id) return setListing(null);
    setListing(await fetchListing(supabase, id));
  }, [id]);

  // Reload when returning from the edit screen.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const isOwner = !!listing && listing.seller_id === viewerId;

  useEffect(() => {
    if (!listing || isOwner || loggedView.current) return;
    loggedView.current = true;
    logEvent('listing_viewed', listing.id, { category: listing.category_slug });
  }, [listing, isOwner]);

  useEffect(() => {
    if (!supabase || !listing || !viewerId || isOwner) return;
    void fetchSellerWhatsApp(supabase, listing.seller_id).then(setWhatsapp);
  }, [listing, viewerId, isOwner]);

  if (listing === undefined) return <ActivityIndicator style={styles.spinner} />;
  if (listing === null) {
    return (
      <ThemedView style={styles.missing}>
        <ThemedText>This listing isn’t available any more.</ThemedText>
      </ThemedView>
    );
  }

  const photoWidth = Math.min(width, MaxContentWidth);
  const categoryName = categories.find((c) => c.slug === listing.category_slug)?.name;
  const seller = listing.seller;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {listing.listing_images.map((image, index) => (
            <Image
              key={image.id}
              source={supabase ? photoUrl(supabase, image.path) : null}
              style={{ width: photoWidth, height: photoWidth }}
              contentFit="cover"
              accessibilityLabel={`Photo ${index + 1} of ${listing.listing_images.length}`}
            />
          ))}
        </ScrollView>

        <View style={styles.body}>
          {listing.status !== 'active' ? (
            <ThemedView type="backgroundSelected" style={styles.banner}>
              <ThemedText type="smallBold">
                {listing.status === 'sold'
                  ? `Sold${listing.sold_price_cents != null && isOwner ? ` for ${formatPrice(listing.sold_price_cents, listing.currency)}` : ''}`
                  : listing.status === 'draft'
                    ? 'Draft: only you can see this'
                    : 'Removed'}
              </ThemedText>
            </ThemedView>
          ) : null}

          <ThemedText type="subtitle">{formatPrice(listing.price_cents, listing.currency)}</ThemedText>
          <ThemedText type="default">{listing.title}</ThemedText>

          <View style={styles.facts}>
            <Fact label="Condition" value={conditionLabel(listing.condition)} />
            {categoryName ? <Fact label="Category" value={categoryName} /> : null}
            {listing.brand ? <Fact label="Brand" value={listing.brand} /> : null}
            {listing.region ? <Fact label="Area" value={listing.region} /> : null}
          </View>

          {listing.description ? <ThemedText>{listing.description}</ThemedText> : null}

          <ThemedView type="backgroundElement" style={styles.sellerCard}>
            {seller?.avatar_url ? (
              <Image source={seller.avatar_url} style={styles.avatar} />
            ) : null}
            <View style={styles.sellerText}>
              <ThemedText type="small" themeColor="textSecondary">
                Seller
              </ThemedText>
              <ThemedText type="smallBold">
                {seller?.display_name || (seller?.username ? `@${seller.username}` : 'Marketplace user')}
              </ThemedText>
            </View>
          </ThemedView>

          {isOwner ? (
            <OwnerActions listing={listing} onChanged={load} />
          ) : listing.status === 'active' ? (
            <ContactSeller
              signedIn={!!viewerId}
              whatsapp={whatsapp}
              onContact={() => {
                if (!whatsapp) return;
                logEvent('listing_contacted', listing.id, { channel: 'whatsapp' });
                void Linking.openURL(whatsappLink(whatsapp, listing.title));
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.fact}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

function ContactSeller({
  signedIn,
  whatsapp,
  onContact,
}: {
  signedIn: boolean;
  whatsapp: string | null;
  onContact: () => void;
}) {
  if (!signedIn) {
    return <Button title="Sign in to contact the seller" onPress={() => router.push('/sign-in')} />;
  }
  if (!whatsapp) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        This seller hasn’t added contact details yet. In-app chat is coming soon.
      </ThemedText>
    );
  }
  return <Button title="Chat on WhatsApp" onPress={onContact} />;
}

function OwnerActions({ listing, onChanged }: { listing: ListingDetail; onChanged: () => void }) {
  const [markingSold, setMarkingSold] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(soldPriceSchema),
    defaultValues: { price: (listing.price_cents / 100).toString() },
  });

  const run = async (action: () => ReturnType<typeof setListingStatus>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) setError(result.message);
    else onChanged();
  };

  const confirmSold = handleSubmit(async ({ price }) => {
    if (!supabase) return;
    await run(() => setListingStatus(supabase!, listing.id, 'sold', price));
    setMarkingSold(false);
  });

  if (listing.status === 'sold' || listing.status === 'removed') {
    return (
      <View style={styles.actions}>
        <Button
          title="Relist"
          variant="secondary"
          loading={busy}
          onPress={() => supabase && run(() => setListingStatus(supabase!, listing.id, 'active'))}
        />
        {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      {markingSold ? (
        <ThemedView type="backgroundElement" style={styles.soldBox}>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="What did it sell for? (R)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.price?.message}
                keyboardType="decimal-pad"
                hint="Private. Helps us build fair-price suggestions."
              />
            )}
          />
          <Button title="Confirm sold" onPress={() => confirmSold()} loading={isSubmitting} />
          <Button title="Cancel" variant="secondary" onPress={() => setMarkingSold(false)} />
        </ThemedView>
      ) : (
        <Button title="Mark as sold" onPress={() => setMarkingSold(true)} />
      )}
      <Button
        title="Edit listing"
        variant="secondary"
        onPress={() => router.push({ pathname: '/listing/[id]/edit', params: { id: listing.id } })}
      />
      <Button
        title="Remove listing"
        variant="secondary"
        loading={busy}
        onPress={() => supabase && run(() => setListingStatus(supabase!, listing.id, 'removed'))}
      />
      {error ? <ThemedText type="small" themeColor="danger">{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: Spacing.six },
  body: { width: '100%', maxWidth: MaxContentWidth, padding: Spacing.four, gap: Spacing.three },
  spinner: { marginTop: Spacing.six },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  banner: { padding: Spacing.three, borderRadius: Spacing.three },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fact: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.three },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  sellerText: { gap: Spacing.half },
  actions: { gap: Spacing.two },
  soldBox: { gap: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three },
});
