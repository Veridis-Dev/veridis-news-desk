import { useState } from 'react';
import { __, _x } from '@wordpress/i18n';
import type { FollowUpItem } from '../../types';
import { FollowUpBadge } from './FollowUpBadge';
import { useUpdateFollowUp } from '../../hooks/useUpdateFollowUp';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisBadge } from '../../design-system/VeridisBadge';

interface FollowUpRowProps {
  item: FollowUpItem;
  onOpenArticle?: (postId: number) => void;
  onEdit: (item: FollowUpItem) => void;
  compact?: boolean;
}

export function FollowUpRow({ item, onOpenArticle, onEdit, compact = false }: FollowUpRowProps) {
  const updateMutation = useUpdateFollowUp();
  const toast = useToast();
  const [isPendingLocal, setIsPendingLocal] = useState(false);

  const isDone = item.status === 'done';
  const isCancelled = item.status === 'cancelled';
  const isOpen = item.status === 'open';

  async function handleToggleStatus() {
    if (isPendingLocal) return;
    setIsPendingLocal(true);
    const nextStatus = isOpen ? 'done' : 'open';
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        input: { status: nextStatus },
      });
      toast(
        nextStatus === 'done'
          ? __('Follow-up completed.', 'veridis-news-desk')
          : __('Follow-up reopened.', 'veridis-news-desk'),
        'success'
      );
    } catch (err) {
      toast(__('Could not update follow-up.', 'veridis-news-desk'), 'error');
    } finally {
      setIsPendingLocal(false);
    }
  }

  return (
    <li className={`vnd-followup-row ${compact ? 'is-compact' : ''} ${isDone ? 'is-done' : ''} ${isCancelled ? 'is-cancelled' : ''} ${item.isOverdue ? 'is-overdue' : ''}`}>
      <div className="vnd-followup-row-start">
        <button
          type="button"
          className={`vnd-followup-check-btn ${isDone ? 'checked' : ''}`}
          onClick={handleToggleStatus}
          disabled={isPendingLocal || updateMutation.isPending}
          aria-label={
            isDone
              ? __('Mark follow-up as incomplete', 'veridis-news-desk')
              : __('Mark follow-up as complete', 'veridis-news-desk')
          }
          title={
            isDone
              ? __('Reopen follow-up', 'veridis-news-desk')
              : __('Complete follow-up', 'veridis-news-desk')
          }
        >
          {isDone ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <span className="vnd-followup-check-box" />
          )}
        </button>
      </div>

      <div className="vnd-followup-row-content">
        <strong className="vnd-followup-title">{item.title}</strong>

        {item.notes && (
          <p className="vnd-followup-notes">{item.notes}</p>
        )}

        <div className="vnd-followup-meta-line">
          {!compact && (
            <>
              {onOpenArticle ? (
                <button
                  type="button"
                  className="vnd-followup-article-link"
                  onClick={() => onOpenArticle(item.postId)}
                  title={__('Open story in newsroom', 'veridis-news-desk')}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 2H13C13.55 2 14 2.45 14 3V13C14 13.55 13.55 14 13 14H3C2.45 14 2 13.55 2 13V3C2 2.45 2.45 2 3 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 6H11M5 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>{item.articleTitle}</span>
                </button>
              ) : (
                <span className="vnd-followup-article-title">
                  <span>{item.articleTitle}</span>
                </span>
              )}
              <span className="vnd-followup-sep">·</span>
            </>
          )}

          <span className="vnd-followup-assignee" title={item.assignedName}>
            {item.assignedInitials ? (
              <span className="vnd-followup-initials">{item.assignedInitials}</span>
            ) : null}
            <span>{item.assignedName}</span>
          </span>
        </div>
      </div>

      <div className="vnd-followup-row-actions">
        <FollowUpBadge dueState={item.dueState} label={item.dueLabel} />
        {isCancelled && <VeridisBadge tone="neutral">{_x('Cancelled', 'single follow-up status', 'veridis-news-desk')}</VeridisBadge>}
        <VeridisButton
          variant="ghost"
          onClick={() => onEdit(item)}
          aria-label={__('Edit follow-up', 'veridis-news-desk')}
        >
          {__('Edit', 'veridis-news-desk')}
        </VeridisButton>
      </div>
    </li>
  );
}
