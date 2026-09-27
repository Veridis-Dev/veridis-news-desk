import { __ } from '@wordpress/i18n';
import type { FollowUpSummaryCounts } from '../../types';
import { StatCard } from '../../design-system/StatCard';
import { StatCardSkeleton } from '../../design-system/VeridisSkeleton';

interface FollowUpSummaryCardsProps {
  counts: FollowUpSummaryCounts;
  activeDue: string;
  activeStatus: string;
  loading?: boolean;
  onSelectDueFilter: (due: 'all' | 'overdue' | 'due_today' | 'upcoming' | 'no_deadline') => void;
}

export function FollowUpSummaryCards({
  counts,
  activeDue,
  activeStatus,
  loading = false,
  onSelectDueFilter,
}: FollowUpSummaryCardsProps) {
  if (loading) {
    return (
      <section className="vnd-stats" aria-busy="true" aria-label={__('Follow-up overview', 'veridis-news-desk')}>
        <span className="vnd-sr-only" role="status">{__('Loading follow-up overview…', 'veridis-news-desk')}</span>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </section>
    );
  }
  const stats = [
    {
      id: 'overdue',
      label: __('Overdue', 'veridis-news-desk'),
      value: counts.overdue,
      note: counts.overdue === 0
        ? __('Nothing overdue', 'veridis-news-desk')
        : counts.overdue === 1
          ? __('Requires immediate attention', 'veridis-news-desk')
          : __('Require immediate attention', 'veridis-news-desk'),
      tone: counts.overdue > 0 ? ('error' as const) : ('neutral' as const),
      dueKey: 'overdue' as const,
    },
    {
      id: 'due_today',
      label: __('Due today', 'veridis-news-desk'),
      value: counts.dueToday,
      note: __('Tasks due today', 'veridis-news-desk'),
      tone: counts.dueToday > 0 ? ('warning' as const) : ('neutral' as const),
      dueKey: 'due_today' as const,
    },
    {
      id: 'upcoming',
      label: __('Upcoming', 'veridis-news-desk'),
      value: counts.upcoming,
      note: __('Future deadlines', 'veridis-news-desk'),
      tone: 'info' as const,
      dueKey: 'upcoming' as const,
    },
    {
      id: 'no_deadline',
      label: __('No deadline', 'veridis-news-desk'),
      value: counts.noDeadline,
      note: __('Backlog & notes', 'veridis-news-desk'),
      tone: 'neutral' as const,
      dueKey: 'no_deadline' as const,
    },
  ];

  return (
    <section className="vnd-stats" aria-label={__('Follow-up overview', 'veridis-news-desk')}>
      {stats.map(stat => {
        const isSelected = activeStatus === 'open' && activeDue === stat.dueKey;
        return (
          <StatCard
            key={stat.id}
            stat={stat}
            selected={isSelected}
            onClick={() => {
              onSelectDueFilter(activeDue === stat.dueKey ? 'all' : stat.dueKey);
            }}
          />
        );
      })}
    </section>
  );
}
