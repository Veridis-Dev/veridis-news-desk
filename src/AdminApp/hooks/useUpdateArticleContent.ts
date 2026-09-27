import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateArticleContent } from '../api/articles';
import type { ArticleDetail, UpdateArticleContentInput } from '../types';

export function useUpdateArticleContent(articleId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateArticleContentInput) => updateArticleContent(articleId, input),
    onSuccess: (updatedArticle: ArticleDetail) => {
      client.setQueryData(['veridis-news', 'article', articleId], updatedArticle);
      void client.invalidateQueries({ queryKey: ['veridis-news', 'newsroom'] });
      void client.invalidateQueries({ queryKey: ['veridis-news', 'dashboard'] });
    },
  });
}
