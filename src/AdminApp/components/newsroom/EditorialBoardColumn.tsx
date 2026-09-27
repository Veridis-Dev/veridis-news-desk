import { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import type { BoardColumnData, EditorialStatus } from '../../types';
import { EditorialBoardCard } from './EditorialBoardCard';

export interface EditorialBoardColumnProps {
  status: EditorialStatus;
  title: string;
  columnData: BoardColumnData;
  onOpenArticle: (id: number) => void;
  onMoveStatus: (id: number, targetStatus: EditorialStatus, sourceStatus?: EditorialStatus) => void;
  onViewListForStatus: (status: EditorialStatus) => void;
}

const emptyMessages: Record<EditorialStatus, string> = {
  idea: __('No stories in Idea', 'veridis-news-desk'),
  writing: __('No stories in Writing', 'veridis-news-desk'),
  review: __('No stories in Review', 'veridis-news-desk'),
  ready: __('No stories ready to publish', 'veridis-news-desk'),
};

export function EditorialBoardColumn({
  status,
  title,
  columnData,
  onOpenArticle,
  onMoveStatus,
  onViewListForStatus,
}: EditorialBoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const items = columnData?.items ?? [];
  const total = columnData?.total ?? 0;
  const limit = columnData?.limit ?? 50;
  const isOverflow = total > limit;

  return (
    <section
      className={`vnd-board-column vnd-board-column--${status} ${isDragOver ? 'is-drag-over' : ''}`}
      aria-label={
        // translators: %s: editorial board column title.
        sprintf(__('%s column', 'veridis-news-desk'), title)
      }
      onDragOver={event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={event => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={event => {
        event.preventDefault();
        // Prevent flashing if moving over children
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragOver(false);
      }}
      onDrop={event => {
        event.preventDefault();
        setIsDragOver(false);
        const rawId = event.dataTransfer.getData('text/plain');
        const articleId = parseInt(rawId, 10);
        let fromStatus: EditorialStatus | undefined;
        try {
          const payload = JSON.parse(event.dataTransfer.getData('application/json'));
          if (payload?.fromStatus) fromStatus = payload.fromStatus;
        } catch {
          // ignore json parse error
        }
        if (articleId && fromStatus !== status) {
          onMoveStatus(articleId, status, fromStatus);
        }
      }}
    >
      <header className="vnd-board-column-header">
        <div className="vnd-board-column-title-group">
          <h3>{title}</h3>
          <span className="vnd-board-column-count">
            {isOverflow ? sprintf(
              /* translators: 1: number of currently displayed articles, 2: total number of articles. */
              __('%1$d of %2$d', 'veridis-news-desk'),
              items.length,
              total
            ) : total}
          </span>
        </div>
        {isOverflow && (
          <button
            type="button"
            className="vnd-board-column-more"
            onClick={() => onViewListForStatus(status)}
            /* translators: %s: status name */
            title={sprintf(__('View all %s stories in list', 'veridis-news-desk'), title)}
          >
            {__('View all →', 'veridis-news-desk')}
          </button>
        )}
      </header>

      <div className="vnd-board-column-body">
        {items.length === 0 ? (
          <div className="vnd-board-empty-column">
            <p>{emptyMessages[status]}</p>
          </div>
        ) : (
          <div className="vnd-board-cards-list">
            {items.map(item => (
              <EditorialBoardCard
                key={item.id}
                item={item}
                currentStatus={status}
                onOpen={onOpenArticle}
                onMoveStatus={onMoveStatus}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
