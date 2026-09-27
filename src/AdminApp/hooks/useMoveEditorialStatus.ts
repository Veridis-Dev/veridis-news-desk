import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __, sprintf } from '@wordpress/i18n';
import { updateEditorial } from '../api/articles';
import { useToast } from '../design-system/VeridisToast';
import type { EditorialStatus, NewsroomBoardData, NewsroomItem, Tone } from '../types';

const statusLabels: Record<EditorialStatus, string> = {
  idea: __('Idea', 'veridis-news-desk'),
  writing: __('Writing', 'veridis-news-desk'),
  review: __('Review', 'veridis-news-desk'),
  ready: __('Ready to publish', 'veridis-news-desk'),
};

const statusTones: Record<EditorialStatus, Tone> = {
  idea: 'neutral',
  writing: 'info',
  review: 'warning',
  ready: 'success',
};

export function useMoveEditorialStatus() {
  const client = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      articleId,
      targetStatus,
    }: {
      articleId: number;
      targetStatus: EditorialStatus;
      sourceStatus?: EditorialStatus;
    }) => updateEditorial(articleId, { editorialStatus: targetStatus }),

    onMutate: async ({ articleId, targetStatus, sourceStatus }) => {
      await client.cancelQueries({ queryKey: ['veridis-news', 'newsroom', 'board'] });

      const previousBoardQueries = client.getQueriesData<NewsroomBoardData>({
        queryKey: ['veridis-news', 'newsroom', 'board'],
      });

      client.setQueriesData<NewsroomBoardData>(
        { queryKey: ['veridis-news', 'newsroom', 'board'] },
        oldData => {
          if (!oldData?.columns) return oldData;

          let movingItem: NewsroomItem | null = null;
          let fromCol: EditorialStatus | null = sourceStatus ?? null;

          // Find the moving item and its source column if not provided
          if (!fromCol) {
            for (const [colKey, col] of Object.entries(oldData.columns) as [EditorialStatus, typeof oldData.columns.idea][]) {
              const found = col.items.find(item => item.id === articleId);
              if (found) {
                fromCol = colKey;
                movingItem = found;
                break;
              }
            }
          } else {
            movingItem = oldData.columns[fromCol]?.items.find(item => item.id === articleId) ?? null;
          }

          if (!movingItem || !fromCol || fromCol === targetStatus) {
            return oldData;
          }

          const updatedItem: NewsroomItem = {
            ...movingItem,
            editorialStatus: targetStatus,
            editorialStatusLabel: statusLabels[targetStatus],
            editorialStatusTone: statusTones[targetStatus],
          };

          const newColumns = { ...oldData.columns };

          // Remove from source column
          newColumns[fromCol] = {
            ...newColumns[fromCol],
            items: newColumns[fromCol].items.filter(item => item.id !== articleId),
            total: Math.max(0, newColumns[fromCol].total - 1),
          };

          // Add to target column (at start for visibility)
          newColumns[targetStatus] = {
            ...newColumns[targetStatus],
            items: [updatedItem, ...newColumns[targetStatus].items],
            total: newColumns[targetStatus].total + 1,
          };

          return {
            ...oldData,
            columns: newColumns,
          };
        }
      );

      return { previousBoardQueries };
    },

    onError: (err, _variables, context) => {
      if (context?.previousBoardQueries) {
        for (const [queryKey, data] of context.previousBoardQueries) {
          client.setQueryData(queryKey, data);
        }
      }
      toast(err.message || __('Could not update story status. Please try again.', 'veridis-news-desk'), 'error');
    },

    onSuccess: (updatedArticle, variables) => {
      /* translators: %s: target editorial status label */
      toast(sprintf(__('Story moved to %s.', 'veridis-news-desk'), statusLabels[variables.targetStatus]), 'success');
      client.setQueryData(['veridis-news', 'article', updatedArticle.id], updatedArticle);
    },

    onSettled: () => {
      void client.invalidateQueries({ queryKey: ['veridis-news', 'newsroom'] });
      void client.invalidateQueries({ queryKey: ['veridis-news', 'dashboard'] });
    },
  });
}
