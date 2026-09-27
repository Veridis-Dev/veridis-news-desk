import { useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { ArticleDetail, FollowUpItem } from '../../types';
import { useArticleFollowUps } from '../../hooks/useArticleFollowUps';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { FollowUpRowSkeleton } from '../../design-system/VeridisSkeleton';
import { FollowUpRow } from './FollowUpRow';
import { FollowUpModal } from './FollowUpModal';

interface FollowUpSectionProps {
  article: ArticleDetail;
}

export function FollowUpSection({ article }: FollowUpSectionProps) {
  const query = useArticleFollowUps(article.id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<FollowUpItem | null>(null);

  const items = query.data || [];
  const openCount = items.filter(item => item.status === 'open').length;
  const overdueCount = items.filter(item => item.status === 'open' && item.isOverdue).length;

  // Preserve explicit unassigned semantics: if article is unassigned, initialAssignedTo is 0 (Unassigned).
  // Otherwise if article has an explicit eligible assignee, pass it.
  const defaultAssignee = article.isUnassigned ? 0 : (article.assignedTo || 0);

  return (
    <section className="vnd-drawer-section vnd-followup-drawer-section" aria-labelledby="vnd-followups-title">
      <div className="vnd-editorial-header">
        <div>
          <h3 id="vnd-followups-title">{__('Follow-ups', 'veridis-news-desk')}</h3>
          <p className="vnd-editorial-subtitle">
            {openCount > 0
              ? sprintf(
                  /* translators: %d: count of open follow-up tasks */
                  _n('%d open editorial task', '%d open editorial tasks', openCount, 'veridis-news-desk'),
                  openCount
                )
              : __('No open follow-up tasks for this story.', 'veridis-news-desk')}
          </p>
        </div>

        <div className="vnd-followup-drawer-header-actions">
          {overdueCount > 0 && (
            <VeridisBadge tone="error">
              {sprintf(
                /* translators: %d: count of overdue follow-ups */
                _n('%d overdue', '%d overdue', overdueCount, 'veridis-news-desk'),
                overdueCount
              )}
            </VeridisBadge>
          )}
          <VeridisButton variant="secondary" onClick={() => setIsCreating(true)}>
            {__('+ Add follow-up', 'veridis-news-desk')}
          </VeridisButton>
        </div>
      </div>

      {query.isPending ? (
        <div aria-busy="true" aria-label={__('Loading follow-ups', 'veridis-news-desk')}>
          <span className="vnd-sr-only" role="status">{__('Loading follow-ups…', 'veridis-news-desk')}</span>
          <ul className="vnd-followups-ul vnd-followups-drawer-list" aria-hidden="true">
            <FollowUpRowSkeleton compact />
            <FollowUpRowSkeleton compact />
          </ul>
        </div>
      ) : items.length === 0 ? (
        <div className="vnd-followup-empty-drawer">
          <p>{__('No follow-ups recorded yet. Add callbacks, pending responses, or future revisits.', 'veridis-news-desk')}</p>
        </div>
      ) : (
        <ul className="vnd-followups-ul vnd-followups-drawer-list">
          {items.map(item => (
            <FollowUpRow
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              compact
            />
          ))}
        </ul>
      )}

      {isCreating && (
        <FollowUpModal
          open={isCreating}
          initialPostId={article.id}
          initialArticleTitle={article.title}
          initialAssignedTo={defaultAssignee}
          onClose={() => setIsCreating(false)}
        />
      )}

      {editingItem && (
        <FollowUpModal
          open={Boolean(editingItem)}
          followUp={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </section>
  );
}
