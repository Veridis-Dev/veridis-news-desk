import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDashboard } from '../hooks/useDashboard';
import { useToast } from '../design-system/VeridisToast';
import { VeridisButton } from '../design-system/VeridisButton';
import { StatCard } from '../design-system/StatCard';
import { EmptyState } from '../design-system/EmptyState';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { DashboardPanels } from '../components/DashboardPanels';
export function Dashboard({
  onOpenNewsroom,
  onOpenFollowUps,
}: {
  onOpenFollowUps?: () => void;
  onOpenNewsroom: (params: Record<string, string | number>) => void;
}) {
  const query = useDashboard();
  const toast = useToast();
  // A brief presentation-only minimum lets the initial skeleton settle; API calls are never delayed.
  const [initial, setInitial] = useState(!query.data);
  useEffect(() => { const timer = window.setTimeout(() => setInitial(false), 450); return () => window.clearTimeout(timer); }, []);
  async function refresh() {
    const result = await query.refetch();
    toast(
      result.isError
        ? __('Could not refresh the dashboard. Please try again.', 'veridis-news-desk')
        : __('Dashboard refreshed.', 'veridis-news-desk'),
      result.isError ? 'error' : 'success',
    );
  }
  function focusPanel(id: string) {
    const panel = document.getElementById(id);
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return <>
    <div className="vnd-page-heading">
      <div>
        <p className="vnd-eyebrow">{__('YOUR NEWSROOM, AT A GLANCE', 'veridis-news-desk')}</p>
        <h2>{__('Dashboard', 'veridis-news-desk')}</h2>
        <p>{__('A little clarity for your next big story.', 'veridis-news-desk')}</p>
      </div>
      <div className="vnd-page-heading-actions">
        <VeridisButton variant="secondary" disabled={query.isFetching} onClick={refresh}>
          {query.isFetching ? __('Refreshing…', 'veridis-news-desk') : __('↻  Refresh overview', 'veridis-news-desk')}
        </VeridisButton>
      </div>
    </div>
    {query.isPending || initial ? <DashboardSkeleton /> : !query.data ? <div role="alert"><EmptyState title={__('Your desk could not load', 'veridis-news-desk')} description={query.error?.message ?? __('Please try again.', 'veridis-news-desk')} action={<VeridisButton onClick={refresh} disabled={query.isFetching}>{__('Try again', 'veridis-news-desk')}</VeridisButton>} /></div> : <>
      {query.isError && <p className="vnd-error" role="alert">{__('Refresh failed. Showing the last available overview.', 'veridis-news-desk')}</p>}
      <div className="vnd-stats">
        {query.data.stats
          .filter(stat => stat.id !== 'breaking')
          .map(stat => (
            <StatCard
              key={stat.id}
              stat={stat}
              onClick={
                stat.id === 'published'
                  ? () => onOpenNewsroom({ status: 'publish', period: 'today' })
                  : stat.id === 'scheduled'
                  ? () => onOpenNewsroom({ status: 'future' })
                  : stat.id === 'attention'
                  ? () => focusPanel('vnd-attention-panel')
                  : undefined
              }
            />
          ))}
        <StatCard
          stat={{
            id: 'deadline_watch',
            label: __('Deadline watch', 'veridis-news-desk'),
            value: query.data.deadlineWatch.overdue + query.data.deadlineWatch.dueToday,
            note: query.data.deadlineWatch.overdue + query.data.deadlineWatch.dueToday > 0
              ? sprintf(
                /* translators: 1: overdue story count, 2: stories due today count. */
                __('%1$d overdue · %2$d due today', 'veridis-news-desk'),
                query.data.deadlineWatch.overdue,
                query.data.deadlineWatch.dueToday,
              )
              : __('No deadline risks today', 'veridis-news-desk'),
            tone: query.data.deadlineWatch.overdue > 0 ? 'error' : query.data.deadlineWatch.dueToday > 0 ? 'warning' : 'success',
          }}
          onClick={() => focusPanel('vnd-deadline-watch-panel')}
        />
      </div>
      <DashboardPanels
        data={query.data}
        onOpenFollowUps={onOpenFollowUps}
        onOpenArticle={id => onOpenNewsroom({ article: id })}
        onOpenNewsroom={onOpenNewsroom}
      />
    </>}
  </>;
}
