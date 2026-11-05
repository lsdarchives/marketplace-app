import { useCallback, useEffect, useState } from 'react';

import { checkBackend, type BackendStatus } from '@/lib/backend-status';
import { supabase } from '@/lib/supabase';

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>(supabase ? 'checking' : 'unconfigured');

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setStatus('checking');
    setStatus(await checkBackend(supabase));
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkBackend(supabase).then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, refresh };
}
