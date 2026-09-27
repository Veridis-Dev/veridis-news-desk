import { useQuery } from '@tanstack/react-query';
import { getNewsroomOptions } from '../api/newsroom';

export const NEWSROOM_OPTIONS_QUERY_KEY = ['veridis-news', 'newsroom-options'] as const;

/**
 * Hook to retrieve editorial author and category filter options.
 *
 * Stale time is set to 5 minutes (300,000 ms) because authors and categories change
 * infrequently during active editorial filtering sessions. This prevents redundant
 * database calls during title search, status/health changes, sorting, and pagination.
 */
export function useNewsroomOptions() {
  return useQuery({
    queryKey: NEWSROOM_OPTIONS_QUERY_KEY,
    queryFn: ({ signal }) => getNewsroomOptions(signal),
    staleTime: 5 * 60 * 1000,
  });
}
