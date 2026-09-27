import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BreakingData } from '../types';
/** Revalidate server counts and empty states at the next known expiry, even without a mutation. */
export function useBreakingExpiry(data?: BreakingData) {
  const client = useQueryClient();
  const next = data?.items.reduce((earliest, item) => {
    const expires = item.breaking.expiresAt ? Date.parse(item.breaking.expiresAt) : Infinity;
    return item.breaking.active ? Math.min(earliest, expires) : earliest;
  }, Infinity);
  useEffect(() => {
    if (!next || !Number.isFinite(next)) return;
    const delay = Math.min(Math.max(next - Date.now(), 0) + 50, 2147483647);
    const timer = window.setTimeout(() => { void client.invalidateQueries({ queryKey: ['veridis-news'] }); }, delay);
    return () => window.clearTimeout(timer);
  }, [next, client, data]);
}
