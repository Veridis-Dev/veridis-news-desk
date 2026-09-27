import { useQuery } from '@tanstack/react-query';
import { getArticle } from '../api/articles';

export function useArticle(id: number | null) {
  return useQuery({ queryKey: ['veridis-news', 'article', id], queryFn: ({ signal }) => getArticle(id!, signal), enabled: Boolean(id) });
}
