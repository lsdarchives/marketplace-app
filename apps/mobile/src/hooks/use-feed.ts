import { useCallback, useEffect, useRef, useState } from 'react';

import { FEED_PAGE_SIZE, fetchFeed, type FeedItem } from '@/lib/listings';
import { supabase } from '@/lib/supabase';

type FeedState = {
  items: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
};

const initial: FeedState = {
  items: [],
  loading: true,
  refreshing: false,
  loadingMore: false,
  hasMore: true,
  error: null,
};

export function useFeed(category: string | null) {
  const [state, setState] = useState<FeedState>(initial);
  // Bumped on every reload so responses for an old category/refresh are ignored.
  const generation = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!supabase) {
        setState({ ...initial, loading: false, hasMore: false });
        return;
      }
      const gen = ++generation.current;
      setState((s) => ({ ...s, loading: mode === 'initial', refreshing: mode === 'refresh', error: null }));
      const result = await fetchFeed(supabase, { category });
      if (gen !== generation.current) return;
      setState(
        result.ok
          ? { ...initial, loading: false, items: result.data, hasMore: result.data.length === FEED_PAGE_SIZE }
          : { ...initial, loading: false, hasMore: false, error: result.message },
      );
    },
    [category],
  );

  const loadMore = useCallback(async () => {
    const last = state.items.at(-1);
    if (!supabase || !last || !state.hasMore || state.loadingMore || state.loading) return;
    const gen = generation.current;
    setState((s) => ({ ...s, loadingMore: true }));
    const result = await fetchFeed(supabase, {
      category,
      cursor: { created_at: last.created_at, id: last.id },
    });
    if (gen !== generation.current) return;
    setState((s) =>
      result.ok
        ? {
            ...s,
            loadingMore: false,
            items: [...s.items, ...result.data],
            hasMore: result.data.length === FEED_PAGE_SIZE,
          }
        : { ...s, loadingMore: false, error: result.message },
    );
  }, [category, state.items, state.hasMore, state.loadingMore, state.loading]);

  useEffect(() => {
    void load('initial');
  }, [load]);

  return { ...state, refresh: () => load('refresh'), loadMore };
}
