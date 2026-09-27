import { useEffect, useRef, useState, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import type { EditorialStatus, NewsroomBoardData } from '../../types';
import { EmptyState } from '../../design-system/EmptyState';
import { VeridisButton } from '../../design-system/VeridisButton';
import { BoardCardSkeleton, VeridisSkeleton } from '../../design-system/VeridisSkeleton';
import { useMoveEditorialStatus } from '../../hooks/useMoveEditorialStatus';
import { EditorialBoardColumn } from './EditorialBoardColumn';

export interface EditorialBoardProps {
  data?: NewsroomBoardData;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenArticle: (id: number) => void;
  onViewListForStatus: (status: EditorialStatus) => void;
}

const columnDefs: { status: EditorialStatus; label: string }[] = [
  { status: 'idea', label: __('Idea', 'veridis-news-desk') },
  { status: 'writing', label: __('Writing', 'veridis-news-desk') },
  { status: 'review', label: __('Review', 'veridis-news-desk') },
  { status: 'ready', label: __('Ready to publish', 'veridis-news-desk') },
];

interface BoardScrollFrameProps {
  children: ReactNode;
  loading?: boolean;
  fetching?: boolean;
}

function BoardScrollFrame({ children, loading = false, fetching = false }: BoardScrollFrameProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    const gridElement = gridRef.current;
    if (!scrollElement || !gridElement) return;

    const updateScrollMetrics = () => {
      const nextTrackWidth = gridElement.scrollWidth;
      const nextHasOverflow = nextTrackWidth > scrollElement.clientWidth + 1;

      setTrackWidth(nextTrackWidth);
      setHasOverflow(nextHasOverflow);

      if (!nextHasOverflow) {
        scrollElement.scrollLeft = 0;
        if (topScrollRef.current) topScrollRef.current.scrollLeft = 0;
      }
    };

    updateScrollMetrics();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollMetrics);
      return () => window.removeEventListener('resize', updateScrollMetrics);
    }

    const observer = new ResizeObserver(updateScrollMetrics);
    observer.observe(scrollElement);
    observer.observe(gridElement);

    return () => observer.disconnect();
  }, []);

  const shellClassName = [
    'vnd-board-shell',
    loading ? 'vnd-board-loading' : '',
    fetching ? 'is-fetching' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {hasOverflow && (
        <div
          ref={topScrollRef}
          className="vnd-board-top-scroll"
          onScroll={event => {
            if (scrollRef.current) scrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }}
          role="region"
          aria-label={__('Board', 'veridis-news-desk')}
          tabIndex={0}
        >
          <div className="vnd-board-top-scroll-track" style={{ width: trackWidth }} />
        </div>
      )}
      <div
        ref={scrollRef}
        className={shellClassName}
        aria-busy={loading || fetching}
        aria-label={loading ? __('Loading editorial board', 'veridis-news-desk') : undefined}
        onScroll={event => {
          if (topScrollRef.current) topScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
      >
        <div ref={gridRef} className="vnd-board-grid">
          {children}
        </div>
      </div>
    </>
  );
}

export function EditorialBoard({
  data,
  loading,
  fetching,
  error,
  onRetry,
  onOpenArticle,
  onViewListForStatus,
}: EditorialBoardProps) {
  const moveMutation = useMoveEditorialStatus();

  if (loading && !data) {
    return (
      <BoardScrollFrame loading>
        <span className="vnd-sr-only" role="status">{__('Loading editorial board…', 'veridis-news-desk')}</span>
        {columnDefs.map(col => (
          <div key={col.status} className="vnd-board-column vnd-board-column-skeleton">
            <div className="vnd-board-column-header">
              <div className="vnd-board-column-title-group">
                <h3>{col.label}</h3>
                <span className="vnd-board-column-count">
                  <VeridisSkeleton shape="badge" style={{ width: '22px', height: '16px' }} />
                </span>
              </div>
            </div>
            <div className="vnd-board-column-body">
              <div className="vnd-board-cards-list">
                <BoardCardSkeleton />
                <BoardCardSkeleton />
                <BoardCardSkeleton />
              </div>
            </div>
          </div>
        ))}
      </BoardScrollFrame>
    );
  }

  if (error && !data) {
    return (
      <EmptyState
        title={__('The editorial board could not load', 'veridis-news-desk')}
        description={__('Please try again.', 'veridis-news-desk')}
        action={<VeridisButton onClick={onRetry}>{__('Try again', 'veridis-news-desk')}</VeridisButton>}
      />
    );
  }

  const columns = data?.columns;

  return (
    <BoardScrollFrame fetching={fetching}>
      {columnDefs.map(col => {
        const colData = columns?.[col.status] ?? { items: [], total: 0, limit: 50 };
        return (
          <EditorialBoardColumn
            key={col.status}
            status={col.status}
            title={col.label}
            columnData={colData}
            onOpenArticle={onOpenArticle}
            onMoveStatus={(id, target, source) => moveMutation.mutate({ articleId: id, targetStatus: target, sourceStatus: source })}
            onViewListForStatus={onViewListForStatus}
          />
        );
      })}
    </BoardScrollFrame>
  );
}
