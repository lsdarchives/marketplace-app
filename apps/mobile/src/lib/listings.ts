import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Category,
  Database,
  Listing,
  ListingFormOutput,
  ListingImage,
  ListingStatus,
} from '@marketplace/shared';

import { preparePhoto, type PickedPhoto } from './photos';
import type { Result } from './profile';

type Client = SupabaseClient<Database>;

export const PHOTO_BUCKET = 'listing-photos';
export const FEED_PAGE_SIZE = 20;

export type FeedItem = Pick<
  Listing,
  'id' | 'title' | 'price_cents' | 'currency' | 'region' | 'created_at' | 'status'
> & { listing_images: Pick<ListingImage, 'path'>[] };

export type ListingDetail = Listing & {
  listing_images: ListingImage[];
  seller: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

export type FeedCursor = { created_at: string; id: string };

export function photoUrl(client: Client, path: string): string {
  return client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function fetchCategories(client: Client): Promise<Category[]> {
  const { data } = await client.from('categories').select('*').order('sort_order');
  return data ?? [];
}

/**
 * Newest-first feed with keyset pagination: stable while new items are posted, and fast
 * via the partial (created_at, id) indexes.
 */
export async function fetchFeed(
  client: Client,
  options: { category?: string | null; cursor?: FeedCursor | null; limit?: number } = {},
): Promise<Result<FeedItem[]>> {
  let query = client
    .from('listings')
    .select('id, title, price_cents, currency, region, created_at, status, listing_images(path)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .order('position', { referencedTable: 'listing_images' })
    .limit(1, { referencedTable: 'listing_images' })
    .limit(options.limit ?? FEED_PAGE_SIZE);

  if (options.category) query = query.eq('category_slug', options.category);
  if (options.cursor) {
    const { created_at, id } = options.cursor;
    query = query.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`);
  }

  const { data, error } = await query;
  if (error) return { ok: false, message: 'Could not load listings. Pull down to try again.' };
  return { ok: true, data: data as FeedItem[] };
}

export async function fetchListing(client: Client, id: string): Promise<ListingDetail | null> {
  const { data } = await client
    .from('listings')
    .select(
      '*, listing_images(*), seller:profiles!listings_seller_id_fkey(id, username, display_name, avatar_url)',
    )
    .eq('id', id)
    .order('position', { referencedTable: 'listing_images' })
    .maybeSingle();
  return (data as ListingDetail | null) ?? null;
}

export async function fetchMyListings(client: Client, userId: string): Promise<FeedItem[]> {
  const { data } = await client
    .from('listings')
    .select('id, title, price_cents, currency, region, created_at, status, listing_images(path)')
    .eq('seller_id', userId)
    .in('status', ['active', 'sold', 'draft'])
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'listing_images' })
    .limit(1, { referencedTable: 'listing_images' });
  return (data as FeedItem[] | null) ?? [];
}

function toRow(values: ListingFormOutput) {
  const { price, ...rest } = values;
  return { ...rest, price_cents: price };
}

/**
 * Publishes a listing in three steps so buyers never see a half-uploaded item:
 * 1. insert as a private draft, 2. upload photos + rows, 3. flip to active
 * (which also makes the database log the `listing_created` event).
 * On any failure the draft and its uploaded files are cleaned up.
 */
export async function createListing(
  client: Client,
  userId: string,
  values: ListingFormOutput,
  photos: PickedPhoto[],
  onProgress?: (done: number, total: number) => void,
): Promise<Result<{ id: string }>> {
  if (photos.length === 0) return { ok: false, message: 'Add at least one photo.' };

  const { data: draft, error } = await client
    .from('listings')
    .insert({ ...toRow(values), status: 'draft' })
    .select('id')
    .single();
  if (error || !draft) return { ok: false, message: 'Could not create the listing. Please try again.' };

  const uploaded: string[] = [];
  const fail = async (message: string): Promise<Result<{ id: string }>> => {
    if (uploaded.length) await client.storage.from(PHOTO_BUCKET).remove(uploaded);
    await client.from('listings').delete().eq('id', draft.id);
    return { ok: false, message };
  };

  try {
    const rows = [];
    for (const [position, photo] of photos.entries()) {
      onProgress?.(position, photos.length);
      const prepared = await preparePhoto(photo);
      const body = await (await fetch(prepared.uri)).arrayBuffer();
      const path = `${userId}/${draft.id}/${position}.jpg`;
      const { error: uploadError } = await client.storage
        .from(PHOTO_BUCKET)
        .upload(path, body, { contentType: 'image/jpeg' });
      if (uploadError) return await fail('A photo failed to upload. Check your connection and try again.');
      uploaded.push(path);
      rows.push({
        listing_id: draft.id,
        path,
        position,
        width: prepared.width,
        height: prepared.height,
      });
    }
    onProgress?.(photos.length, photos.length);

    const { error: rowsError } = await client.from('listing_images').insert(rows);
    if (rowsError) return await fail('Could not save your photos. Please try again.');

    const { error: publishError } = await client
      .from('listings')
      .update({ status: 'active' })
      .eq('id', draft.id);
    if (publishError) return await fail('Could not publish the listing. Please try again.');

    return { ok: true, data: { id: draft.id } };
  } catch {
    return fail('Something went wrong while uploading. Please try again.');
  }
}

export async function updateListing(
  client: Client,
  id: string,
  values: ListingFormOutput,
): Promise<Result<null>> {
  const { error } = await client.from('listings').update(toRow(values)).eq('id', id);
  return error ? { ok: false, message: 'Could not save changes. Please try again.' } : { ok: true, data: null };
}

export async function setListingStatus(
  client: Client,
  id: string,
  status: Extract<ListingStatus, 'active' | 'sold' | 'removed'>,
  soldPriceCents?: number,
): Promise<Result<null>> {
  const { error } = await client
    .from('listings')
    .update(status === 'sold' ? { status, sold_price_cents: soldPriceCents ?? null } : { status })
    .eq('id', id);
  return error ? { ok: false, message: 'Could not update the listing. Please try again.' } : { ok: true, data: null };
}

export async function fetchSellerWhatsApp(client: Client, sellerId: string): Promise<string | null> {
  const { data } = await client
    .from('seller_contacts')
    .select('whatsapp')
    .eq('user_id', sellerId)
    .maybeSingle();
  return data?.whatsapp ?? null;
}

export async function saveWhatsApp(
  client: Client,
  userId: string,
  whatsapp: string | null,
): Promise<Result<null>> {
  const { error } = await client
    .from('seller_contacts')
    .upsert({ user_id: userId, whatsapp }, { onConflict: 'user_id' });
  return error ? { ok: false, message: 'Could not save your number. Please try again.' } : { ok: true, data: null };
}

export function whatsappLink(e164: string, listingTitle: string): string {
  const text = `Hi! Is "${listingTitle}" still available? (Seen on Marketplace)`;
  return `https://wa.me/${e164.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
