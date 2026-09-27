import { useEffect, useRef } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { NewsroomData } from '../../types';
import { EmptyState } from '../../design-system/EmptyState';
import { VeridisButton } from '../../design-system/VeridisButton';
import { NewsroomRowSkeleton, VeridisSkeleton } from '../../design-system/VeridisSkeleton';
import { NewsroomRow } from './NewsroomRow';

export function NewsroomList({ data, loading, fetching, error, canCreate, onRetry, onCreate, onOpen, onPage }: {
  data?: NewsroomData; loading: boolean; fetching: boolean; error: boolean; onRetry: () => void;
  canCreate: boolean; onCreate: () => void; onOpen: (id: number) => void; onPage: (page: number) => void;
}) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const isPaginatingRef = useRef(false);
  const currentPage = data?.pagination.page;

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
      <div className="vnd-newsroom-list" aria-busy="true" aria-label={__('Loading newsroom', 'veridis-news-desk')}>
        <span className="vnd-sr-only" role="status">{__('Loading newsroom articles…', 'veridis-news-desk')}</span>
        <div className="vnd-list-summary" tabIndex={-1}>
          <VeridisSkeleton shape="short" style={{ width: '80px', height: '14px' }} />
        </div>
        <ul>
          {Array.from({ length: 8 }, (_, index) => (
            <NewsroomRowSkeleton key={index} />
          ))}
        </ul>
      </div>
    );
  }
  if (error && !data) return <EmptyState title={__('The newsroom could not load', 'veridis-news-desk')} description={__('Please try again.', 'veridis-news-desk')} action={<VeridisButton onClick={onRetry}>{__('Try again', 'veridis-news-desk')}</VeridisButton>} />;
  if (data?.overallTotal === 0) return <EmptyState
    title={__('Your newsroom is ready', 'veridis-news-desk')}
    description={__('Create your first story to start assigning work and tracking editorial progress.', 'veridis-news-desk')}
    action={<VeridisButton onClick={onCreate} disabled={!canCreate}>{__('Create your first story', 'veridis-news-desk')}</VeridisButton>}
  />;
  if (!data?.items.length) return <EmptyState title={__('No articles found', 'veridis-news-desk')} description={__('Try changing or clearing the current filters.', 'veridis-news-desk')} />;
  const { page, totalPages, totalItems } = data.pagination;
  /* translators: %d: total number of articles. */
  const count = sprintf(_n('%d article', '%d articles', totalItems, 'veridis-news-desk'), totalItems);
	/* translators: 1: current page number, 2: total number of pages. */
	const pageLabel = sprintf(__('Page %1$d of %2$d', 'veridis-news-desk'), page, totalPages);
  return <div className={`vnd-newsroom-list ${fetching ? 'is-fetching' : ''}`} aria-busy={fetching}>
    <div ref={topRef} className="vnd-list-summary" tabIndex={-1}>
      <span>{count}</span>
      <div className="vnd-list-summary-status">
        {fetching && <span className="vnd-fetching-pill">{__('Updating…', 'veridis-news-desk')}</span>}
        {error && <span className="vnd-inline-error">{__('Refresh failed. Showing the last results.', 'veridis-news-desk')}</span>}
      </div>
    </div>
    <ul>{data.items.map(item => <NewsroomRow item={item} onOpen={onOpen} key={item.id} />)}</ul>
    <nav className="vnd-pagination" aria-label={__('Newsroom pagination', 'veridis-news-desk')}>
      <VeridisButton variant="secondary" disabled={page <= 1 || fetching} onClick={() => handlePageChange(page - 1)}>{__('Previous', 'veridis-news-desk')}</VeridisButton>
      <span>{pageLabel}</span>
      <VeridisButton variant="secondary" disabled={page >= totalPages || fetching} onClick={() => handlePageChange(page + 1)}>{__('Next', 'veridis-news-desk')}</VeridisButton>
    </nav>
  </div>;
}
