import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getNewsroom } from '../api/newsroom';
import type { NewsroomFilters } from '../types';

export function useNewsroom(filters: NewsroomFilters, enabled = true) {
  return useQuery({
    queryKey: ['veridis-news', 'newsroom', filters],
    queryFn: ({ signal }) => getNewsroom(filters, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
