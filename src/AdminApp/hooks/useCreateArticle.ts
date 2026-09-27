import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createArticle } from '../api/articles';

export function useCreateArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: article => {
      client.setQueryData(['veridis-news', 'article', article.id], article);
      void client.invalidateQueries({ queryKey: ['veridis-news', 'newsroom'] });
      void client.invalidateQueries({ queryKey: ['veridis-news', 'dashboard'] });
    },
  });
}
