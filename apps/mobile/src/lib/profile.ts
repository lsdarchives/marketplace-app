import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Profile, ProfileUpdate } from '@marketplace/shared';

export type Result<T> = { ok: true; data: T } | { ok: false; message: string };

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

export async function updateProfile(
  client: SupabaseClient<Database>,
  userId: string,
  changes: Partial<ProfileUpdate> & { avatar_url?: string | null },
): Promise<Result<Profile>> {
  const { data, error } = await client
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { ok: false, message: 'That username is taken.' };
    if (error.code === CHECK_VIOLATION) return { ok: false, message: 'Please check your details.' };
    return { ok: false, message: 'Could not save your profile. Please try again.' };
  }
  return { ok: true, data };
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Uploads to avatars/<userId>/avatar.<ext> (storage RLS only allows the user's own folder)
 * and saves the public URL on the profile. A version query string busts image caches.
 */
export async function uploadAvatar(
  client: SupabaseClient<Database>,
  userId: string,
  file: { uri: string; mimeType?: string | null },
): Promise<Result<Profile>> {
  const contentType = file.mimeType ?? 'image/jpeg';
  const extension = EXTENSIONS[contentType];
  if (!extension) return { ok: false, message: 'Please choose a JPEG, PNG or WebP photo.' };

  const body = await (await fetch(file.uri)).arrayBuffer();
  const path = `${userId}/avatar.${extension}`;

  const { error } = await client.storage
    .from('avatars')
    .upload(path, body, { contentType, upsert: true });
  if (error) return { ok: false, message: 'Could not upload your photo. Please try again.' };

  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return updateProfile(client, userId, { avatar_url: `${data.publicUrl}?v=${Date.now()}` });
}
