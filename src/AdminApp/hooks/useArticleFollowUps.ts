import { useQuery } from '@tanstack/react-query';
import { getArticleFollowUps } from '../api/followups';

export function useArticleFollowUps(postId: number) {
  return useQuery({
    queryKey: ['veridis-news', 'article-follow-ups', postId],
    queryFn: ({ signal }) => getArticleFollowUps(postId, signal),
    enabled: postId > 0,
  });
}
