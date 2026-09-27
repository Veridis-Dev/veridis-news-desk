import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEditorial } from '../api/articles';
import type { UpdateEditorialInput } from '../types';

export function useUpdateEditorial(articleId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEditorialInput) => updateEditorial(articleId, input),
    onSuccess: updatedArticle => {
      client.setQueryData(['veridis-news', 'article', articleId], updatedArticle);
      void client.invalidateQueries({ queryKey: ['veridis-news', 'newsroom'] });
      void client.invalidateQueries({ queryKey: ['veridis-news', 'dashboard'] });
    },
  });
}
