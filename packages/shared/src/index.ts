export type { Database, Json } from './database.types';

import type { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Profile = Tables<'profiles'>;

export * from './schemas/auth';
export * from './schemas/profile';
