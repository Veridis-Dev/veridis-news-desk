import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getNewsroomBoard } from '../api/newsroom';
import type { NewsroomFilters } from '../types';

export function useEditorialBoard(filters: NewsroomFilters, enabled = true) {
  const boardFilterKey = {
    search: filters.search,
    status: filters.status,
    assigned_to: filters.assigned_to,
    priority: filters.priority,
    deadline_state: filters.deadline_state,
    author: filters.author,
    category: filters.category,
    health: filters.health,
    period: filters.period,
  };

  return useQuery({
    queryKey: ['veridis-news', 'newsroom', 'board', boardFilterKey],
    queryFn: ({ signal }) => getNewsroomBoard(filters, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
