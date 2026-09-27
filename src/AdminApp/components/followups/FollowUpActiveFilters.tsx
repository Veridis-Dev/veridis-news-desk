import { __, sprintf } from '@wordpress/i18n';
import type { FollowUpFilters, TermOption } from '../../types';
import { ActiveFilterBar, type FilterChipItem } from '../../design-system/ActiveFilterBar';

interface FollowUpActiveFiltersProps {
  filters: Partial<FollowUpFilters>;
  authors: TermOption[];
  onChange: (patch: Partial<FollowUpFilters>) => void;
  onClear: () => void;
}

const statusLabels: Record<string, string> = {
  open: __('Open tasks', 'veridis-news-desk'),
  done: __('Completed', 'veridis-news-desk'),
  cancelled: __('Cancelled', 'veridis-news-desk'),
  all: __('All statuses', 'veridis-news-desk'),
};

const dueLabels: Record<string, string> = {
  overdue: __('Overdue', 'veridis-news-desk'),
  due_today: __('Due today', 'veridis-news-desk'),
  upcoming: __('Upcoming', 'veridis-news-desk'),
  no_deadline: __('No deadline', 'veridis-news-desk'),
};

export function FollowUpActiveFilters({
  filters,
  authors,
  onChange,
  onClear,
}: FollowUpActiveFiltersProps) {
  const chips: FilterChipItem[] = [];

  // 1. Search
  if (filters.search && filters.search.trim()) {
    const trimmed = filters.search.trim();
    chips.push({
      id: 'search',
      /* translators: %s: search query */
      label: sprintf(__('Search: “%s”', 'veridis-news-desk'), trimmed),
      /* translators: %s: search query */
      removeAriaLabel: sprintf(__('Remove search filter “%s”', 'veridis-news-desk'), trimmed),
      onRemove: () => onChange({ search: '', page: 1 }),
    });
  }

  // 2. Status (default is 'open')
  if (filters.status && filters.status !== 'open') {
    const label = statusLabels[filters.status] || filters.status;
    chips.push({
      id: 'status',
      /* translators: %s: follow-up status label. */
      label: sprintf(__('Status: %s', 'veridis-news-desk'), label),
      removeAriaLabel: sprintf(__('Reset status filter', 'veridis-news-desk')),
      onRemove: () => onChange({ status: 'open', page: 1 }),
    });
  }

  // 3. Deadline (default is 'all')
  if (filters.due && filters.due !== 'all') {
    const label = dueLabels[filters.due] || filters.due;
    chips.push({
      id: 'due',
      /* translators: %s: deadline filter label. */
      label: sprintf(__('Deadline: %s', 'veridis-news-desk'), label),
      removeAriaLabel: sprintf(__('Reset deadline filter', 'veridis-news-desk')),
      onRemove: () => onChange({ due: 'all', page: 1 }),
    });
  }

  // 4. Assignee (default is 0 / all)
  if (typeof filters.assigned_to === 'number' && filters.assigned_to !== 0) {
    let name: string = __('Unassigned', 'veridis-news-desk');
    if (filters.assigned_to > 0) {
      const found = authors.find(a => a.id === filters.assigned_to);
      /* translators: %d: WordPress user ID. */
      name = found ? found.name : sprintf(__('User #%d', 'veridis-news-desk'), filters.assigned_to);
    }
    chips.push({
      id: 'assigned_to',
      /* translators: %s: assignee display name. */
      label: sprintf(__('Assignee: %s', 'veridis-news-desk'), name),
      removeAriaLabel: sprintf(__('Reset assignee filter', 'veridis-news-desk')),
      onRemove: () => onChange({ assigned_to: 0, page: 1 }),
    });
  }

  return <ActiveFilterBar chips={chips} onClear={onClear} />;
}
