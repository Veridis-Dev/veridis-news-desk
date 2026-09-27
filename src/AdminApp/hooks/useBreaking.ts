import { useQuery } from '@tanstack/react-query';
import { getBreaking } from '../api/breaking';
import { useBreakingExpiry } from './useBreakingExpiry';
export function useBreaking() {
  const query = useQuery({ queryKey: ['veridis-news', 'breaking'], queryFn: ({ signal }) => getBreaking(signal), refetchInterval: 30000 });
  useBreakingExpiry(query.data);
  return query;
}
