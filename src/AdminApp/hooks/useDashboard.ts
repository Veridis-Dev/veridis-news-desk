import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard';
import { useBreakingExpiry } from './useBreakingExpiry';
export function useDashboard() {
  const query = useQuery({ queryKey: ['veridis-news', 'dashboard'], refetchInterval: 30000, queryFn: ({ signal }) => getDashboard(signal) });
  useBreakingExpiry(query.data?.breaking);
  return query;
}
