export type { Database, Json } from './database.types';

import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Listing = Tables<'listings'>;
export type ListingImage = Tables<'listing_images'>;

export * from './market';
export * from './schemas/auth';
export * from './schemas/listing';
export * from './schemas/profile';
