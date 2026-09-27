import type { ArticleDetail } from '../../types';

export function canUseArticleHealthFix(
  article: Pick<ArticleDetail, 'editorialStatus' | 'isUnassigned'>,
  checkId: string,
): boolean {
  return checkId === 'source' || article.editorialStatus !== 'idea' || !article.isUnassigned;
}
