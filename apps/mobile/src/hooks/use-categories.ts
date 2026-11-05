import { useEffect, useState } from 'react';

import type { Category } from '@marketplace/shared';

import { fetchCategories } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

// Categories rarely change, so one fetch per app session is enough.
let cache: Category[] | null = null;
let pending: Promise<Category[]> | null = null;

export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>(cache ?? []);

  useEffect(() => {
    if (cache || !supabase) return;
    pending ??= fetchCategories(supabase).then((result) => {
      if (result.length) cache = result;
      pending = null;
      return result;
    });
    let active = true;
    pending.then((result) => {
      if (active) setCategories(result);
    });
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
