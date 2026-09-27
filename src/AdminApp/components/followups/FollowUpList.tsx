import { useEffect, useRef } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { FollowUpListingData, FollowUpItem } from '../../types';
import { EmptyState } from '../../design-system/EmptyState';
import { VeridisButton } from '../../design-system/VeridisButton';
import { FollowUpPanelSkeleton, VeridisSkeleton } from '../../design-system/VeridisSkeleton';
import { FollowUpRow } from './FollowUpRow';

interface FollowUpListProps {
  data?: FollowUpListingData;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenArticle?: (postId: number) => void;
  onEdit: (item: FollowUpItem) => void;
  onPage: (page: number) => void;
  onCreate: () => void;
  onCreateStory: () => void;
  canCreateStory: boolean;
}

export function FollowUpList({
  data,
  loading,
  fetching,
  error,
  onRetry,
  onOpenArticle,
  onEdit,
  onPage,
  onCreate,
  onCreateStory,
  canCreateStory,
}: FollowUpListProps) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const isPaginatingRef = useRef(false);
  const currentPage = data?.page;

  useEffect(() => {
    if (isPaginatingRef.current && !fetching && currentPage !== undefined) {
      isPaginatingRef.current = false;
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, fetching]);

  const handlePageChange = (newPage: number) => {
    isPaginatingRef.current = true;
    onPage(newPage);
  };

  if (loading && !data) {
    return (
      <div className="vnd-followup-list" aria-busy="true" aria-label={__('Loading follow-ups', 'veridis-news-desk')}>
        <span className="vnd-sr-only" role="status">{__('Loading follow-up tasks…', 'veridis-news-desk')}</span>
        <div className="vnd-list-summary" tabIndex={-1}>
          <VeridisSkeleton shape="short" style={{ width: '80px', height: '14px' }} />
        </div>
        <FollowUpPanelSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <EmptyState
        title={__('Follow-ups could not load', 'veridis-news-desk')}
        description={__('Please try again.', 'veridis-news-desk')}
        action={<VeridisButton onClick={onRetry}>{__('Try again', 'veridis-news-desk')}</VeridisButton>}
      />
    );
  }

  if (data?.overallStories === 0) {
    return (
      <EmptyState
        title={__('No follow-ups yet', 'veridis-news-desk')}
        description={__('Follow-ups are attached to stories. Create your first story to start tracking callbacks, updates, and editorial tasks.', 'veridis-news-desk')}
        action={
          <VeridisButton onClick={onCreateStory} disabled={!canCreateStory}>
            {__('Create your first story', 'veridis-news-desk')}
          </VeridisButton>
        }
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title={__('No follow-ups found', 'veridis-news-desk')}
        description={__('There are no editorial follow-ups matching the current filters.', 'veridis-news-desk')}
        action={
          <VeridisButton variant="secondary" onClick={onCreate}>
            {__('Create follow-up', 'veridis-news-desk')}
          </VeridisButton>
        }
      />
    );
  }

  const { page, pages, total } = data;
  /* translators: %d: total count of follow-ups */
  const countLabel = sprintf(_n('%d follow-up', '%d follow-ups', total, 'veridis-news-desk'), total);
  /* translators: 1: current page number, 2: total number of pages */
  const pageLabel = sprintf(__('Page %1$d of %2$d', 'veridis-news-desk'), page, pages);

  return (
    <div className={`vnd-followup-list ${fetching ? 'is-fetching' : ''}`} aria-busy={fetching}>
      <div ref={topRef} className="vnd-list-summary" tabIndex={-1}>
        <span>{countLabel}</span>
        <div className="vnd-list-summary-status">
          {fetching && <span className="vnd-fetching-pill">{__('Updating…', 'veridis-news-desk')}</span>}
          {error && <span className="vnd-inline-error">{__('Refresh failed. Showing the last results.', 'veridis-news-desk')}</span>}
        </div>
      </div>

      <ul className="vnd-followups-ul">
        {data.items.map(item => (
          <FollowUpRow
            key={item.id}
            item={item}
            onOpenArticle={onOpenArticle}
            onEdit={onEdit}
          />
        ))}
      </ul>

      {pages > 1 && (
        <nav className="vnd-pagination" aria-label={__('Follow-ups pagination', 'veridis-news-desk')}>
          <VeridisButton
            variant="secondary"
            disabled={page <= 1 || fetching}
            onClick={() => handlePageChange(page - 1)}
          >
            {__('Previous', 'veridis-news-desk')}
          </VeridisButton>
          <span>{pageLabel}</span>
          <VeridisButton
            variant="secondary"
            disabled={page >= pages || fetching}
            onClick={() => handlePageChange(page + 1)}
          >
            {__('Next', 'veridis-news-desk')}
          </VeridisButton>
        </nav>
      )}
    </div>
  );
}
