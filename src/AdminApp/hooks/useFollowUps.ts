import { useQuery } from '@tanstack/react-query';
import { getFollowUps } from '../api/followups';
import type { FollowUpFilters } from '../types';

export function useFollowUps(filters: Partial<FollowUpFilters>) {
  return useQuery({
    queryKey: ['veridis-news', 'follow-ups', filters],
    queryFn: ({ signal }) => getFollowUps(filters, signal),
    refetchInterval: 30000,
  });
}
