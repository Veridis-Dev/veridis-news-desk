import { useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { EditorialStatus, NewsroomItem } from '../../types';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { CategoryBadge } from '../../design-system/CategoryBadge';

export interface EditorialBoardCardProps {
  item: NewsroomItem;
  currentStatus: EditorialStatus;
  onOpen: (id: number) => void;
  onMoveStatus: (id: number, targetStatus: EditorialStatus, sourceStatus: EditorialStatus) => void;
}

export function EditorialBoardCard({
  item,
  currentStatus,
  onOpen,
  onMoveStatus,
}: EditorialBoardCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const assigneeText = item.isUnassigned
    ? __('Unassigned', 'veridis-news-desk')
    : item.assignedName;

  /* translators: %s: article title */
  const cardAriaLabel = sprintf(__('Story: %s. Click to view details or drag to change status.', 'veridis-news-desk'), item.title);
  /* translators: %s: article title */
  const moveAriaLabel = sprintf(__('Move story "%s" to status', 'veridis-news-desk'), item.title);

  return (
    <div
      className={`vnd-board-card ${isDragging ? 'is-dragging' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={cardAriaLabel}
      draggable={true}
      onDragStart={event => {
        setIsDragging(true);
        event.dataTransfer.setData('text/plain', String(item.id));
        event.dataTransfer.setData(
          'application/json',
          JSON.stringify({ id: item.id, fromStatus: currentStatus })
        );
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onOpen(item.id)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item.id);
        }
      }}
    >
      <div className="vnd-board-card-header">
        <CategoryBadge category={item.primaryCategory} />
        {item.healthIssueCount > 0 && (
          <span
            className="vnd-board-card-health"
            /* translators: %d: issue count */
            title={sprintf(_n('%d issue', '%d issues', item.healthIssueCount, 'veridis-news-desk'), item.healthIssueCount)}
          >
            ⚠ {item.healthIssueCount}
          </span>
        )}
      </div>

      <h4 className="vnd-board-card-title">{item.title}</h4>

      <div className="vnd-board-card-assignee">
        <span className="vnd-avatar vnd-avatar--inline" aria-hidden="true">
          {item.assignedInitials || item.authorInitials}
        </span>
        <span className="vnd-assignee-text">{assigneeText}</span>
      </div>

      <div className="vnd-board-card-footer">
        <div className="vnd-board-card-badges">
          {item.priority === 'urgent' && (
            <VeridisBadge tone="error">{item.priorityLabel}</VeridisBadge>
          )}
          {item.priority === 'high' && (
            <VeridisBadge tone="warning">{item.priorityLabel}</VeridisBadge>
          )}
          {item.deadlineLabel && (
            <span
              className={`vnd-deadline-pill ${
                item.isOverdue ? 'vnd-deadline-pill--overdue' : ''
              }`}
            >
              {item.deadlineLabel}
            </span>
          )}
          {item.followUps && item.followUps.count > 0 && (
            <VeridisBadge tone={item.followUps.overdueCount > 0 ? 'error' : 'neutral'}>
              {item.followUps.overdueCount > 0
                ? sprintf(
                    /* translators: %d: count of overdue follow-up tasks */
                    _n('%d overdue', '%d overdue', item.followUps.overdueCount, 'veridis-news-desk'),
                    item.followUps.overdueCount
                  )
                : sprintf(
                    /* translators: %d: count of open follow-up tasks */
                    _n('%d follow-up', '%d follow-ups', item.followUps.count, 'veridis-news-desk'),
                    item.followUps.count
                  )}
            </VeridisBadge>
          )}
        </div>

        <div className="vnd-board-card-move" onClick={e => e.stopPropagation()}>
          <label className="vnd-sr-only" htmlFor={`move-${item.id}`}>{moveAriaLabel}</label>
          <select
            id={`move-${item.id}`}
            className="vnd-card-move-select"
            value=""
            aria-label={moveAriaLabel}
            onChange={event => {
              const nextStatus = event.target.value as EditorialStatus;
              if (nextStatus) {
                onMoveStatus(item.id, nextStatus, currentStatus);
              }
            }}
          >
            <option value="" disabled>{__('Move', 'veridis-news-desk')}</option>
            <option value="idea" disabled={currentStatus === 'idea'}>
              {__('→ Idea', 'veridis-news-desk')}
            </option>
            <option value="writing" disabled={currentStatus === 'writing'}>
              {__('→ Writing', 'veridis-news-desk')}
            </option>
            <option value="review" disabled={currentStatus === 'review'}>
              {__('→ Review', 'veridis-news-desk')}
            </option>
            <option value="ready" disabled={currentStatus === 'ready'}>
              {__('→ Ready to publish', 'veridis-news-desk')}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
